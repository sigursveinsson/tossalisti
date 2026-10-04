import { supabase } from './supabaseClient.js'

// Raddstýring: tekur upp hljóð í vafranum sem WAV (16 kHz mono) og sendir í
// edge-fallið `parse-voice` (Gemini) sem skilar vörulista með magni.
// WAV er valið því það virkar alls staðar (Android Chrome, iOS Safari) og Gemini
// tekur við því beint — MediaRecorder skilar webm/mp4 sem er óáreiðanlegra.

export function canRecord() {
  return typeof window !== 'undefined' && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) &&
    !!(window.AudioContext || window.webkitAudioContext)
}

function downsample(buf, inRate, outRate = 16000) {
  if (outRate >= inRate) return buf
  const ratio = inRate / outRate
  const n = Math.floor(buf.length / ratio)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const s = Math.floor(i * ratio), e = Math.min(buf.length, Math.floor((i + 1) * ratio))
    let sum = 0
    for (let j = s; j < e; j++) sum += buf[j]
    out[i] = sum / Math.max(1, e - s)
  }
  return out
}

function wavBase64(f32, rate) {
  const n = f32.length
  const buf = new ArrayBuffer(44 + n * 2)
  const v = new DataView(buf)
  let o = 0
  const ws = (s) => { for (const c of s) v.setUint8(o++, c.charCodeAt(0)) }
  ws('RIFF'); v.setUint32(o, 36 + n * 2, true); o += 4; ws('WAVE'); ws('fmt ')
  v.setUint32(o, 16, true); o += 4; v.setUint16(o, 1, true); o += 2; v.setUint16(o, 1, true); o += 2
  v.setUint32(o, rate, true); o += 4; v.setUint32(o, rate * 2, true); o += 4
  v.setUint16(o, 2, true); o += 2; v.setUint16(o, 16, true); o += 2
  ws('data'); v.setUint32(o, n * 2, true); o += 4
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, f32[i]))
    v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2
  }
  const u8 = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000))
  return btoa(bin)
}

// Byrjar upptöku. Skilar { stop(): Promise<{base64,mime,seconds}>, cancel() }.
// onLevel(0..1) gefur hljóðstyrk fyrir lifandi hreyfimynd.
export async function startRecording({ onLevel } = {}) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  })
  const AC = window.AudioContext || window.webkitAudioContext
  const ctx = new AC()
  if (ctx.state === 'suspended') { try { await ctx.resume() } catch (e) {} }
  const src = ctx.createMediaStreamSource(stream)
  const proc = ctx.createScriptProcessor(4096, 1, 1)
  const chunks = []
  let len = 0
  proc.onaudioprocess = (e) => {
    const d = e.inputBuffer.getChannelData(0)
    chunks.push(new Float32Array(d)); len += d.length
    if (onLevel) {
      let s = 0, c = 0
      for (let i = 0; i < d.length; i += 16) { s += d[i] * d[i]; c++ }
      onLevel(Math.min(1, Math.sqrt(s / Math.max(1, c)) * 5))
    }
  }
  src.connect(proc); proc.connect(ctx.destination)
  const rate = ctx.sampleRate
  const cleanup = () => {
    try { proc.disconnect(); src.disconnect() } catch (e) {}
    stream.getTracks().forEach(t => t.stop())
    try { ctx.close() } catch (e) {}
  }
  return {
    async stop() {
      cleanup()
      const all = new Float32Array(len)
      let off = 0
      for (const c of chunks) { all.set(c, off); off += c.length }
      const ds = downsample(all, rate, 16000)
      return { base64: wavBase64(ds, 16000), mime: 'audio/wav', seconds: ds.length / 16000 }
    },
    cancel() { cleanup() },
  }
}

// Sendir hljóð (eða texta) í gervigreindina. Skilar { transcript, items:[{name,qty,unit,reward_product_id?}] }.
export async function parseVoice({ audio, mime, text, products, existing }) {
  if (!supabase || !supabase.functions) throw new Error('offline')
  const prods = (products || []).filter(p => p && p.id && p.name && p.active !== false)
    .map(p => ({ id: p.id, name: p.name, brand: p.brand || '' }))
  const body = {
    ...(audio ? { audio, mime: mime || 'audio/wav' } : { text }),
    ...(prods.length ? { products: prods } : {}),
    ...(existing && existing.length ? { existing: existing.slice(0, 150) } : {}),
  }
  const { data, error } = await supabase.functions.invoke('parse-voice', { body })
  if (error) {
    const status = error.context && error.context.status
    const e = new Error(status === 401 ? 'login' : 'server')
    e.status = status
    throw e
  }
  if (!data || data.error) throw new Error(data && data.error ? String(data.error) : 'server')
  return { transcript: data.transcript || '', items: Array.isArray(data.items) ? data.items : [] }
}
