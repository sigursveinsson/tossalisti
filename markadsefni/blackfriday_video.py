# Black Friday 2026: lóðrétt myndband 1080×1920 (Reels/Stories), ~12,5 sek, með „laginu okkar“ undir.
# Hugmynd: „100% afsláttur af áskrift að Tossalista*“ → *Eins og alla aðra daga.
import subprocess, os, math
src = open('make.py', encoding='utf-8').read()
exec(src[:src.index("ITEMS=")])
S = 1  # myndband: ekki ofursýni (hraðar)
W, H, FPS, DUR = 1080, 1920, 30, 12.5
BLACK = (12, 14, 20); SOFT = (201, 214, 236); RED = (200, 16, 46)
def ease(t): t = max(0.0, min(1.0, t)); return 1 - (1 - t) ** 3
def pop(t, start, dur=0.35):
    t = (t - start) / dur
    if t <= 0: return 0.0
    if t >= 1: return 1.0
    return 1 + 0.18 * math.sin(t * math.pi) * (1 - t) + (ease(t) - 1)
def mix(a, b, p): p = max(0.0, min(1.0, p)); return tuple(int(a[i] + (b[i] - a[i]) * p) for i in range(3))

def tag(c, cx, y, txt, p):
    if p <= 0: return
    f = F("pb", int(40 * max(0.01, p))); w = c.tw(txt, f) + 60 * p
    c.rr(cx - w / 2, y, w, 76 * p, 38 * p, fill=GOLD); c.t(cx, y + 38 * p, txt, f, BLACK, "mm")

def logo_top(c):
    f = F("pb", 36); wd = c.tw("Tossalisti", f); x = W / 2 - (58 + 16 + wd) / 2
    c.rr(x, 90, 58, 58, 16, fill=WHITE); k = 58 / 64
    c.line([(x + 20*k, 90 + 33*k), (x + 29*k, 90 + 42*k), (x + 45*k, 90 + 24*k)], GOLD, 5.5*k)
    c.t(x + 74, 119, "Tossalisti", f, WHITE, "lm")

def frame(t):
    c = C(W, H, BLACK)
    logo_top(c)
    # 1) 0–3,2 s: BLACK FRIDAY TILBOÐ + 100% (sést strax á fyrstu sekúndu)
    if t < 3.4:
        tag(c, W/2, 300, "BLACK FRIDAY TILBOÐ", pop(t, 0.0, 0.3))
        n = int(min(100, 60 + 40 * ease(t / 0.7)))
        s = pop(t, 0.05, 0.45)
        c.t(W/2, 760, f"{n}%", F("pb", max(10, int(330 * s))), GOLD, "mm")
        p2 = ease((t - 1.0) / 0.5)
        if p2 > 0:
            col = mix(BLACK, WHITE, p2)
            c.t(W/2, 1080, "afsláttur af", F("pb", 96), col, "mm")
            c.t(W/2, 1200, "áskrift að Tossalista*", F("pb", 84), col, "mm")
    # 2) 3,2–7,4 s: verðmiðinn
    elif t < 7.4:
        tt = t - 3.2
        tag(c, W/2, 300, "BLACK FRIDAY TILBOÐ", 1)
        c.t(W/2, 520, "100% afsláttur", F("pb", 92), GOLD, "mm")
        y0 = 720
        c.rr(90, y0, 900, 640, 40, fill=(26, 30, 40))
        p = ease(tt / 0.4)
        c.t(W/2, y0 + 90, "Verð áður", F("ls", 44), mix((26, 30, 40), FAINT, p), "mm")
        c.t(W/2, y0 + 200, "0 kr.", F("pb", 130), mix((26, 30, 40), FAINT, p), "mm")
        sl = ease((tt - 0.9) / 0.35)
        if sl > 0:
            wd = c.tw("0 kr.", F("pb", 130)); x0 = W/2 - wd/2 - 14
            c.rect(x0, y0 + 205, (wd + 28) * sl, 12, RED)
        p3 = pop(tt, 1.6, 0.4)
        if p3 > 0:
            c.t(W/2, y0 + 380, "Verð núna", F("ls", 44), GOLD, "mm")
            c.t(W/2, y0 + 500, "0 kr.", F("pb", max(10, int(150 * p3))), WHITE, "mm")
        p4 = ease((tt - 2.6) / 0.5)
        if p4 > 0: c.t(W/2, 1500, "Sparnaður: 0 kr.", F("pb", 64), mix(BLACK, SOFT, p4), "mm")
    # 3) 7,4–9,9 s: punchline
    elif t < 9.9:
        tt = t - 7.4
        s = pop(tt, 0.0, 0.45)
        c.t(W/2, 820, "*Eins og alla", F("pb", max(10, int(118 * s))), WHITE, "mm")
        c.t(W/2, 960, "aðra daga.", F("pb", max(10, int(118 * s))), GOLD, "mm")
        p = ease((tt - 0.8) / 0.5)
        if p > 0: c.t(W/2, 1170, "Tossalisti er ókeypis. Alltaf.", F("lr", 54), mix(BLACK, SOFT, p), "mm")
    # 4) 9,9–12,5 s: hvatning
    else:
        tt = t - 9.9
        p = ease(tt / 0.4)
        c.t(W/2, 620, "Keyptirðu eitthvað", F("pb", 88), mix(BLACK, WHITE, p), "mm")
        c.t(W/2, 735, "á Black Friday?", F("pb", 88), mix(BLACK, WHITE, p), "mm")
        p2 = ease((tt - 0.5) / 0.4)
        if p2 > 0:
            c.t(W/2, 900, "Taktu mynd af kvittuninni.", F("pb", 62), mix(BLACK, GOLD, p2), "mm")
            for i, l in enumerate(["Ábyrgðin skráð", "Skilafresturinn á sínum stað", "Beint í heimilisbókhaldið"]):
                q = ease((tt - 0.8 - i * 0.2) / 0.3)
                if q > 0:
                    f = F("ls", 48); wd = c.tw(l, f); x = W/2 - (wd + 56) / 2; y = 1060 + i * 78; col = mix(BLACK, SOFT, q)
                    c.line([(x + 4, y + 2), (x + 16, y + 14), (x + 38, y - 12)], mix(BLACK, GOLD, q), 7)
                    c.t(x + 56, y, l, f, col, "lm")
        p3 = pop(tt, 1.5, 0.4)
        if p3 > 0:
            w = 640 * p3; h = 120 * p3
            c.rr(W/2 - w/2, 1430 - h/2, w, h, 60 * p3, fill=GOLD)
            c.t(W/2, 1430, "tossalisti.is", F("pb", max(10, int(64 * p3))), BLACK, "mm")
    return c.im

os.makedirs('/tmp/bfv', exist_ok=True)
for i in range(int(DUR * FPS)):
    frame(i / FPS).save(f'/tmp/bfv/f{i:04d}.png')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', '/tmp/bfv/f%04d.png',
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', 'tossalisti-blackfriday.mp4'], check=True)
# Lagið okkar undir: kaflinn frá 32. sek. (kraftmikill kafli, að því er virðist án söngs), fade inn/út
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'tossalisti-blackfriday.mp4', '-ss', '32', '-i', 'Smart_Cart_Anthem_90871_Lyria_3_Pro.mp3',
  '-filter_complex', f'[1:a]atrim=0:{DUR},afade=t=in:st=0:d=0.4,afade=t=out:st={DUR-1.2}:d=1.2,volume=0.9[a]',
  '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', 'tossalisti-blackfriday-tonlist.mp4'], check=True)
for t in (0.5, 2.0, 5.5, 8.5, 11.8):
    frame(t).resize((360, 640)).save(f'/tmp/bfv/prev_{t}.png')
print('ok')
