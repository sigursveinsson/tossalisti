// Minnka mynd í litla ferningslaga data-URL (fyrir andlitsmyndir krakka og verk-myndir).
// Geymd beint í gagnagrunni (avatar_url / image_url) svo myndir sitja á bak við sömu
// aðgangsstýringu og allt annað — engin opin myndageymsla.
export function resizeImageFile(file, max = 256, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file) { resolve(null); return }
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const side = Math.min(img.width, img.height)
        const sx = (img.width - side) / 2
        const sy = (img.height - side) / 2
        const canvas = document.createElement('canvas')
        canvas.width = max; canvas.height = max
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, sx, sy, side, side, 0, 0, max, max)
        try { resolve(canvas.toDataURL('image/jpeg', quality)) }
        catch (e) { reject(e) }
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Tákn fyrir verk: geymt sem "emoji:🐕" í image_url svo hægt sé að greina frá mynd-slóð.
export const EMOJI_PREFIX = 'emoji:'
export const isEmojiImage = (v) => typeof v === 'string' && v.startsWith(EMOJI_PREFIX)
export const emojiOf = (v) => isEmojiImage(v) ? v.slice(EMOJI_PREFIX.length) : null
export const makeEmojiImage = (e) => EMOJI_PREFIX + e
