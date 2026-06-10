// Fögnuður þegar verk klárast: konfetti + lítið hljóð. Engin ytri pakki.
// Hljóð má slökkva á (vistast í localStorage 'korfan.sound').

const SOUND_KEY = 'korfan.sound'
export function soundEnabled() { try { return localStorage.getItem(SOUND_KEY) !== '0' } catch { return true } }
export function setSoundEnabled(on) { try { localStorage.setItem(SOUND_KEY, on ? '1' : '0') } catch (e) {} }

let audioCtx = null
function ping(points = 10) {
  if (!soundEnabled()) return
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)()
    const ctx = audioCtx
    if (ctx.state === 'suspended') ctx.resume()
    const now = ctx.currentTime
    // Stærri verðlaun → lengri, glaðari laglína.
    const notes = points >= 30 ? [523.25, 659.25, 783.99, 1046.5] : [659.25, 987.77]
    notes.forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = 'triangle'; o.frequency.value = f
      o.connect(g); g.connect(ctx.destination)
      const t = now + i * 0.085
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26)
      o.start(t); o.stop(t + 0.3)
    })
  } catch (e) { /* hljóð ekki bagalegt */ }
}

function confetti(intense = false) {
  try {
    const W = window.innerWidth, H = window.innerHeight
    const dpr = window.devicePixelRatio || 1
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:3000'
    canvas.width = W * dpr; canvas.height = H * dpr
    document.body.appendChild(canvas)
    const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr)
    const colors = ['#2563eb', '#f5a623', '#16a34a', '#dc2626', '#9333ea', '#06b6d4', '#ec4899']
    const N = intense ? 150 : 90
    const parts = Array.from({ length: N }, () => ({
      x: W / 2 + (Math.random() - 0.5) * 160,
      y: H * 0.34 + (Math.random() - 0.5) * 50,
      vx: (Math.random() - 0.5) * (intense ? 11 : 8),
      vy: Math.random() * -10 - 4,
      s: 5 + Math.random() * 7,
      c: colors[(Math.random() * colors.length) | 0],
      rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.45,
    }))
    const start = performance.now()
    function frame(t) {
      const fade = Math.max(0, 1 - (t - start) / 1300)
      ctx.clearRect(0, 0, W, H)
      let alive = false
      for (const p of parts) {
        p.vy += 0.26; p.x += p.vx; p.y += p.vy; p.rot += p.vr
        if (p.y < H + 20) alive = true
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot)
        ctx.globalAlpha = fade; ctx.fillStyle = p.c
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.62)
        ctx.restore()
      }
      if (alive && t - start < 1500) requestAnimationFrame(frame)
      else canvas.remove()
    }
    requestAnimationFrame(frame)
  } catch (e) { /* ekki bagalegt */ }
}

// Venjuleg klárun.
export function celebrate(points = 10) {
  confetti(points >= 30)
  ping(points)
}

// Stærri fögnuður þegar krakki kemst á nýtt borð (level-up).
export function celebrateLevelUp() {
  confetti(true)
  ping(50)
}
