# Black Friday 2026, stutt útgáfa (6,5 sek, 1080×1920): eitt skilaboð, grínið.
# 0–2,2 s: BLACK FRIDAY TILBOÐ + 100% | 1,2–4 s: afsláttur af áskrift að Tossalista* | 4–6,5 s: *Frítt eins og alla aðra daga + tossalisti.is
# 5,6–7,8 s: lokamynd, stórt lógó og tossalisti.is undir.
# Tónlist: intró lagsins okkar (fyrstu 7,8 sek, söngurinn byrjar um 8. sek).
import subprocess, os, math
src = open('make.py', encoding='utf-8').read()
exec(src[:src.index("ITEMS=")])
S = 1
W, H, FPS, DUR = 1080, 1920, 30, 7.8
BLACK = (12, 14, 20); SOFT = (201, 214, 236)
def ease(t): t = max(0.0, min(1.0, t)); return 1 - (1 - t) ** 3
def pop(t, start, dur=0.35):
    t = (t - start) / dur
    if t <= 0: return 0.0
    if t >= 1: return 1.0
    return 1 + 0.18 * math.sin(t * math.pi) * (1 - t) + (ease(t) - 1)
def mix(a, b, p): p = max(0.0, min(1.0, p)); return tuple(int(a[i] + (b[i] - a[i]) * p) for i in range(3))
def logo_top(c):
    f = F("pb", 36); wd = c.tw("Tossalisti", f); x = W / 2 - (58 + 16 + wd) / 2
    c.rr(x, 90, 58, 58, 16, fill=WHITE); k = 58 / 64
    c.line([(x + 20*k, 90 + 33*k), (x + 29*k, 90 + 42*k), (x + 45*k, 90 + 24*k)], GOLD, 5.5*k)
    c.t(x + 74, 119, "Tossalisti", f, WHITE, "lm")
def endcard(t):
    # Lokamynd: dökkblár bakgrunnur, stórt lógó sem „poppar“ inn, tossalisti.is undir
    c = C(W, H, NAVY)
    s = pop(t, 0.0, 0.45)
    if s > 0:
        size = 340 * s; x = W/2 - size/2; y = 720 - size/2
        c.shadow(x, y, size, size, size * 0.27, blur=30, alpha=70, dy=12)
        c.rr(x, y, size, size, size * 0.27, fill=WHITE); k = size / 64
        c.line([(x + 20*k, y + 33*k), (x + 29*k, y + 42*k), (x + 45*k, y + 24*k)], GOLD, 5.5*k)
        for px, py in [(20, 33), (29, 42), (45, 24)]: c.circ(x + px*k, y + py*k, 2.75*k, fill=GOLD)
    p = ease((t - 0.35) / 0.4)
    if p > 0:
        c.t(W/2, 1000, "Tossalisti", F("pb", 104), mix(NAVY, WHITE, p), "mm")
    p2 = ease((t - 0.6) / 0.4)
    if p2 > 0:
        c.t(W/2, 1115, "tossalisti.is", F("ls", 58), mix(NAVY, GOLD, p2), "mm")
    return c.im

def frame(t):
    if t >= 5.6: return endcard(t - 5.6)
    c = C(W, H, BLACK); logo_top(c)
    p = pop(t, 0.0, 0.3)
    if p > 0:
        f = F("pb", int(58 * max(0.01, p))); w = c.tw("BLACK FRIDAY TILBOÐ", f) + 80 * p
        c.rr(W/2 - w/2, 320, w, 104 * p, 52 * p, fill=GOLD); c.t(W/2, 320 + 52 * p, "BLACK FRIDAY TILBOÐ", f, BLACK, "mm")
    n = int(min(100, 60 + 40 * ease(t / 0.7)))
    c.t(W/2, 760, f"{n}%", F("pb", max(10, int(270 * pop(t, 0.05, 0.45)))), GOLD, "mm")
    p2 = ease((t - 1.1) / 0.45)
    if p2 > 0:
        c.t(W/2, 1060, "afsláttur af", F("pb", 96), mix(BLACK, WHITE, p2), "mm")
        c.t(W/2, 1180, "áskrift að Tossalista*", F("pb", 84), mix(BLACK, WHITE, p2), "mm")
    s = pop(t, 3.6, 0.45)
    if s > 0:
        c.t(W/2, 1400, "*Frítt eins og alla aðra daga.", F("pb", max(10, int(64 * s))), GOLD, "mm")
    p3 = pop(t, 4.6, 0.4)
    if p3 > 0:
        w = 560 * p3; h = 110 * p3
        c.rr(W/2 - w/2, 1580 - h/2, w, h, 55 * p3, fill=WHITE)
        c.t(W/2, 1580, "tossalisti.is", F("pb", max(10, int(58 * p3))), BLACK, "mm")
    return c.im
os.makedirs('/tmp/bfs', exist_ok=True)
for i in range(int(DUR * FPS)): frame(i / FPS).save(f'/tmp/bfs/f{i:04d}.png')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', '/tmp/bfs/f%04d.png', '-i', 'Smart_Cart_Anthem_90871_Lyria_3_Pro.mp3',
  '-filter_complex', f'[1:a]atrim=0:{DUR},afade=t=out:st={DUR-0.8}:d=0.8,volume=1.3[a]', '-map', '0:v', '-map', '[a]',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-shortest',
  'tossalisti-blackfriday-stutt.mp4'], check=True)
frame(7.6).resize((360, 640)).save('/tmp/bfs/last.png'); frame(5.2).resize((360, 640)).save('/tmp/bfs/mid.png')
print('ok')
