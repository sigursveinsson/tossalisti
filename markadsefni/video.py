import subprocess, sys
from PIL import Image, ImageDraw, ImageFilter
src = open('make.py', encoding='utf-8').read().split("# ---------- Slide 1")[0]
exec(src)
W, H, FPS = 1080, 1920, 30
def ease(t): t = max(0.0, min(1.0, t)); return 1 - (1 - t) ** 3
def prog(t, start, dur): return ease((t - start) / dur)
def mix(a, b, p): p = max(0.0, min(1.0, p)); return tuple(int(a[i] + (b[i] - a[i]) * p) for i in range(3))
LIGHT = (205, 217, 238)
PX, PY, PW, PH = 220, 250, 640, 1290
SX, SY, SW, SH = PX + 12, PY + 12, PW - 24, PH - 24
REC = receipt_img(300, -4, 1.5)

def base():
    c = C(W, H, NAVY)
    f = F("pb", 34); wd = c.tw("Tossalisti", f); x = W/2 - (56 + 16 + wd)/2
    c.rr(x, 84, 56, 56, 15, fill=WHITE); k = 56/64
    c.line([(x+20*k, 84+33*k), (x+29*k, 84+42*k), (x+45*k, 84+24*k)], GOLD, 5.5*k)
    c.t(x+72, 112, "Tossalisti", f, WHITE, "lm")
    return c
def caption(c, t, main, sub=None):
    p = prog(t, 0.15, 0.5); dy = (1-p)*24
    c.t(W/2, 1640+dy, main, F("pb", 58), mix(NAVY, WHITE, p), "mm")
    if sub: c.t(W/2, 1716+dy, sub, F("lr", 38), mix(NAVY, LIGHT, prog(t, 0.3, 0.5)), "mm")
def phone_frame(c, screen):
    c.shadow(PX, PY, PW, PH, 64, blur=44, alpha=110)
    c.rr(PX, PY, PW, PH, 64, fill=(10, 18, 34))
    c.rr(SX, SY, SW, SH, 54, fill=screen)
def notch(c): c.rr(PX+PW/2-66, PY+28, 132, 32, 16, fill=(10, 18, 34))
def app_header(c, title, badge=None):
    c.rr(SX, SY, SW, 140, 54, fill=NAVY); c.rect(SX, SY+70, SW, 70, NAVY)
    c.t(SX+34, SY+98, title, F("pb", 34), WHITE, "lm")
    if badge:
        f = F("ls", 20); wd = c.tw(badge, f); c.rr(SX+SW-wd-66, SY+79, wd+34, 38, 19, fill=WHITE); c.t(SX+SW-49-wd/2, SY+98, badge, f, NAVY, "mm")

def scene_a(t):
    c = base()
    lines = [("Veistu hvað þú", WHITE), ("eyddir í mat í", WHITE), ("síðasta mánuði?", GOLD)]
    for i, (tx, col) in enumerate(lines):
        p = prog(t, 0.15 + i*0.22, 0.6)
        c.t(W/2, 800 + i*132 + (1-p)*46, tx, F("pb", 104), mix(NAVY, col, p), "mm")
    return c
def scene_b(t):
    c = base(); phone_frame(c, (30, 34, 42))
    scr = Image.new("RGBA", (SW*S, SH*S), (30, 34, 42, 255))
    ry = SH + 40 - (SH + 40 - 150) * prog(t, 0.1, 0.9)
    scr.paste(REC, (int(SW*S/2 - REC.width/2), int(ry*S)), REC)
    m = Image.new("L", scr.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, scr.size[0], scr.size[1]], radius=54*S, fill=255)
    c.im.paste(scr, (SX*S, SY*S), m)
    bx, by, bw, bh, L = SX+50, SY+120, SW-100, 800, 56; pb_ = prog(t, 0.7, 0.4); col = mix((30, 34, 42), GOLD, pb_)
    for (cx, cy, dx, dy) in [(bx, by, 1, 1), (bx+bw, by, -1, 1), (bx, by+bh, 1, -1), (bx+bw, by+bh, -1, -1)]:
        c.line([(cx+dx*L, cy), (cx, cy), (cx, cy+dy*L)], col, 7)
    if 1.2 <= t <= 2.7:
        sp = (t - 1.2) / 1.5; ly = by + 20 + (bh - 40) * (0.5 - 0.5 * __import__('math').cos(sp * 3.14159 * 2) if False else sp)
        for i, a in enumerate([0.18, 0.35, 0.6, 1.0]):
            c.rect(bx+14, ly - (3-i)*7, bw-28, 5, mix((30, 34, 42), GOLD, a))
    f = F("ls", 26); tx = "Haltu kvittuninni innan rammans"; wd = c.tw(tx, f)
    c.rr(SX+SW/2-wd/2-22, SY+966, wd+44, 52, 26, fill=(0, 0, 0)); c.t(SX+SW/2, SY+992, tx, f, WHITE, "mm")
    pr = 1 - 0.12 * max(0, 1 - abs(t - 2.85) / 0.12)
    c.circ(SX+SW/2, SY+1120, 54, outline=WHITE, width=6); c.circ(SX+SW/2, SY+1120, 41*pr, fill=WHITE)
    if t > 2.85:
        fl = max(0, 1 - (t - 2.85) / 0.35)
        if fl > 0:
            ov = Image.new("RGB", (SW*S, SH*S), WHITE); cur = c.im.crop((SX*S, SY*S, (SX+SW)*S, (SY+SH)*S))
            c.im.paste(Image.blend(cur, ov, fl*0.9), (SX*S, SY*S), m)
    notch(c); caption(c, t, "Taktu mynd af kvittuninni")
    return c
def scene_c(t):
    c = base(); phone_frame(c, BG); app_header(c, "Kvittun", "Lesið með gervigreind"); notch(c)
    cy = SY + 162
    c.rr(SX+20, cy, SW-40, 100, 18, fill=WHITE, outline=LINE, width=1.5)
    c.t(SX+44, cy+34, "Matvörubúðin", F("lb", 30), NAVY, "lm"); c.t(SX+44, cy+70, "7. nóvember 2026", F("lr", 23), MUTED, "lm")
    cy += 118; rh = 70; n = len(ITEMS)
    c.rr(SX+20, cy, SW-40, rh*n+84, 18, fill=WHITE, outline=LINE, width=1.5)
    run = 0.0
    for i, (nm, p, cat) in enumerate(ITEMS):
        pr = prog(t, 0.35 + i*0.26, 0.4); run += p * pr; ry = cy + i*rh; dx = (1-pr)*36
        if pr <= 0: continue
        if i: c.rect(SX+38, ry, SW-76, 1.2, LINE)
        c.t(SX+44+dx, ry+rh/2, nm, F("lm", 26), mix(WHITE, NAVY, pr), "lm")
        fc = F("lm", 18.5); cw = c.tw(cat, fc); cx = SX+SW-176-cw
        c.rr(cx-30, ry+rh/2-17, cw+48, 34, 17, fill=mix(WHITE, CHIP, pr)); c.circ(cx-14, ry+rh/2, 6, fill=mix(WHITE, CAT[cat], pr)); c.t(cx, ry+rh/2, cat, fc, mix(WHITE, MUTED, pr), "lm")
        c.t(SX+SW-44, ry+rh/2, kr(p), F("lb", 25), mix(WHITE, NAVY, pr), "rm")
    ty = cy + rh*n
    c.rect(SX+20, ty, SW-40, 2, LINE)
    c.t(SX+44, ty+43, "Samtals", F("lb", 28), NAVY, "lm"); c.t(SX+SW-44, ty+43, kr(int(round(run))), F("pb", 32), NAVY, "rm")
    pb_ = prog(t, 0.35 + n*0.26 + 0.1, 0.4); by = ty + 110 + (1-pb_)*20
    c.rr(SX+20, by, SW-40, 76, 18, fill=mix(BG, GOLD, pb_)); c.t(SX+SW/2, by+38, "Vista í bókhaldið", F("lb", 28), mix(BG, INK, pb_), "mm")
    caption(c, t, "Hver lína lesin og flokkuð", "sjálfkrafa, á nokkrum sekúndum")
    return c
def scene_d(t):
    c = base(); phone_frame(c, BG); app_header(c, "Útgjöld"); notch(c)
    cy = SY + 162; pt = prog(t, 0.2, 1.3)
    c.rr(SX+20, cy, SW-40, 232, 20, fill=WHITE, outline=LINE, width=1.5)
    c.t(SX+46, cy+40, "Október 2026", F("lm", 24), MUTED, "lm")
    c.t(SX+46, cy+104, kr(int(round(MTOT*pt/100)*100)), F("pb", 62), NAVY, "lm")
    c.t(SX+46, cy+160, "23 kvittanir · 6 verslanir", F("lr", 23), MUTED, "lm")
    bx = SX+46; bw = SW-92; x = bx
    c.rr(bx, cy+190, bw, 16, 8, fill=CHIP)
    for nm, v in MONTH:
        w_ = bw*v/MTOT*pt
        if w_ > 6: c.rr(x, cy+190, w_-3, 16, 8, fill=CAT[nm])
        x += w_
    cy += 252; rh = 92
    c.rr(SX+20, cy, SW-40, rh*len(MONTH), 20, fill=WHITE, outline=LINE, width=1.5)
    for i, (nm, v) in enumerate(MONTH):
        pr = prog(t, 0.5 + i*0.2, 0.7); ry = cy + i*rh
        if i: c.rect(SX+38, ry, SW-76, 1.2, LINE)
        c.circ(SX+60, ry+32, 11, fill=mix(WHITE, CAT[nm], pr)); c.t(SX+86, ry+32, nm, F("lm", 27), mix(WHITE, NAVY, pr), "lm")
        c.t(SX+SW-46, ry+32, kr(int(round(v*pr/100)*100)), F("lb", 27), mix(WHITE, NAVY, pr), "rm")
        c.rr(SX+46, ry+62, SW-92, 10, 5, fill=CHIP)
        w_ = (SW-92)*v/MONTH[0][1]*pr
        if w_ > 8: c.rr(SX+46, ry+62, w_, 10, 5, fill=CAT[nm])
    caption(c, t, "Og þú sérð hvert", None)
    p = prog(t, 0.3, 0.5); c.t(W/2, 1716+(1-p)*24, "peningarnir fara", F("pb", 58), mix(NAVY, GOLD, p), "mm")
    return c
def scene_e(t):
    c = C(W, H, NAVY); p = prog(t, 0.1, 0.6); sz = 190; x = W/2 - sz/2; y = 560 + (1-p)*40
    c.rr(x, y, sz, sz, sz*0.27, fill=mix(NAVY, WHITE, p)); k = sz/64
    c.line([(x+20*k, y+33*k), (x+29*k, y+42*k), (x+45*k, y+24*k)], mix(NAVY, GOLD, p), 5.5*k)
    c.t(W/2, 870, "Tossalisti", F("pb", 116), mix(NAVY, WHITE, prog(t, 0.3, 0.6)), "mm")
    p2 = prog(t, 0.55, 0.6)
    c.t(W/2, 990, "Heimilisbókhald sem", F("lr", 50), mix(NAVY, LIGHT, p2), "mm"); c.t(W/2, 1054, "fyllir sig sjálft", F("lr", 50), mix(NAVY, LIGHT, p2), "mm")
    p3 = prog(t, 0.9, 0.5); f = F("pb", 58); tx = "Frítt á tossalisti.is"; wd = c.tw(tx, f); sc = 0.9 + 0.1*p3
    w_ = (wd+110)*sc; h_ = 124*sc
    c.rr(W/2-w_/2, 1250-h_/2, w_, h_, h_/2, fill=mix(NAVY, GOLD, p3)); c.t(W/2, 1252, tx, f, mix(NAVY, INK, p3), "mm")
    return c

SCENES = [(scene_a, 2.6), (scene_b, 3.5), (scene_c, 4.4), (scene_d, 3.6), (scene_e, 3.2)]
XF = 0.3
def render(fn, t): return fn(t).im.reduce(S)
out = sys.argv[1]
ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                       "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
total = 0
for si, (fn, dur) in enumerate(SCENES):
    nxt = render(SCENES[si+1][0], 0.0) if si+1 < len(SCENES) else None
    nf = int(dur*FPS); last = None; lastkey = None
    for i in range(nf):
        t = i / FPS
        fr = render(fn, t)
        rem = dur - t
        if nxt is not None and rem < XF: fr = Image.blend(fr, nxt, 1 - rem/XF)
        ff.stdin.write(fr.tobytes()); total += 1
    print("scene", si, "done", total, flush=True)
ff.stdin.close(); ff.wait(); print("frames", total, "sec", total/FPS)
