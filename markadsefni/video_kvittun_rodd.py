# Auglýsingamyndband með rödd: kvittanaskönnun („Hvert fóru peningarnir?“). 1080×1920, ~13 sek.
# Texti á skjánum fyrir hljóðlaust áhorf. Röddin (upptaka Sverris) er sett undir síðar og senurnar stilltar
# eftir henni: breyttu SCENES-lengdunum þegar upptakan er komin.
# Keyrt: python3 video_kvittun_rodd.py út.mp4 [rödd.m4a]
import subprocess, sys, math, os
from PIL import Image
src = open('make.py', encoding='utf-8').read().split("# ---------- Slide 1")[0]
exec(src)
W, H, FPS = 1080, 1920, 30
def ease(t): t = max(0.0, min(1.0, t)); return 1 - (1 - t) ** 3
def prog(t, start, dur): return ease((t - start) / dur)
def mix(a, b, p): p = max(0.0, min(1.0, p)); return tuple(int(a[i] + (b[i] - a[i]) * p) for i in range(3))
LIGHT = (205, 217, 238)
PX, PY, PW, PH = 220, 250, 640, 1290
SX, SY, SW, SH = PX + 12, PY + 12, PW - 24, PH - 24
HERE = os.path.dirname(os.path.abspath(__file__))
RECEIPT = Image.open(os.path.join(HERE, '..', 'public', 'postur', 'demo-kvittun.jpg')).convert('RGB')

def base():
    c = C(W, H, NAVY)
    f = F("pb", 34); wd = c.tw("Tossalisti", f); x = W/2 - (56 + 16 + wd)/2
    c.rr(x, 84, 56, 56, 15, fill=WHITE); k = 56/64
    c.line([(x+20*k, 84+33*k), (x+29*k, 84+42*k), (x+45*k, 84+24*k)], GOLD, 5.5*k)
    c.t(x+72, 112, "Tossalisti", f, WHITE, "lm")
    return c
def caption(c, t, main, sub=None, gold=False):
    p = prog(t, 0.15, 0.5); dy = (1-p)*24
    c.t(W/2, 1640+dy, main, F("pb", 58), mix(NAVY, GOLD if gold else WHITE, p), "mm")
    if sub: c.t(W/2, 1716+dy, sub, F("lr", 38), mix(NAVY, LIGHT, prog(t, 0.3, 0.5)), "mm")
def phone_frame(c, screen):
    c.shadow(PX, PY, PW, PH, 64, blur=44, alpha=110)
    c.rr(PX, PY, PW, PH, 64, fill=(10, 18, 34))
    c.rr(SX, SY, SW, SH, 54, fill=screen)
def notch(c): c.rr(PX+PW/2-66, PY+28, 132, 32, 16, fill=(10, 18, 34))
def app_header(c, title):
    c.rr(SX, SY, SW, 140, 54, fill=NAVY); c.rect(SX, SY+70, SW, 70, NAVY)
    c.t(SX+34, SY+98, title, F("pb", 34), WHITE, "lm")

# A) Spurningin sem stöðvar skrunið
def scene_a(t):
    c = base()
    lines = [("Hvert fóru", WHITE, 112), ("peningarnir?", GOLD, 112)]
    for i, (tx, col, sz) in enumerate(lines):
        p = prog(t, 0.15 + i*0.25, 0.6)
        c.t(W/2, 840 + i*150 + (1-p)*46, tx, F("pb", sz), mix(NAVY, col, p), "mm")
    p3 = prog(t, 0.8, 0.6)
    c.t(W/2, 1170, "í þessum mánuði", F("lr", 52), mix(NAVY, LIGHT, p3), "mm")
    return c

# B) Myndavélin: kvittun í rammanum og skannlína
RW = SW - 120
RIMG = RECEIPT.resize((int(RW*S), int(RW*S*RECEIPT.height/RECEIPT.width)), Image.LANCZOS)
RH = RIMG.height / S
def scene_b(t):
    c = base(); phone_frame(c, (24, 28, 36)); notch(c)
    top = SY + 150
    vis = min(RH, SH - 330)
    crop = RIMG.crop((0, 0, RIMG.width, int(vis*S)))
    c.im.paste(crop, (int((SX+60)*S), int(top*S)))
    # hornrammar
    for (x, y, dx, dy) in [(SX+44, top-16, 1, 1), (SX+SW-44, top-16, -1, 1), (SX+44, top+vis+16, 1, -1), (SX+SW-44, top+vis+16, -1, -1)]:
        c.line([(x, y+dy*60), (x, y), (x+dx*60, y)], GOLD, 8)
    # skannlína
    if 0.6 < t < 2.6:
        y = top + (vis) * prog(t, 0.6, 2.0)
        c.rect(SX+44, y-3, SW-88, 6, GOLD)
    # afsmellari
    p = prog(t, 2.6, 0.3)
    c.circ(SX+SW/2, SY+SH-90, 52, fill=mix((24, 28, 36), WHITE, 0.9))
    c.circ(SX+SW/2, SY+SH-90, 40, fill=mix(WHITE, GOLD, p))
    if t > 2.7:
        cx0, cy0 = SX+SW/2, top+vis/2
        c.rr(cx0-140, cy0-40, 280, 80, 40, fill=(46, 158, 91))
        c.line([(cx0-92, cy0+2), (cx0-78, cy0+16), (cx0-54, cy0-12)], WHITE, 7)
        c.t(cx0+20, cy0, "Lesin", F("pb", 38), WHITE, "mm")
    caption(c, t, "Taktu mynd af kvittuninni")
    return c

# C) Flokkað + mánuðurinn
CATS = [("Matur", 4985, (232, 149, 74)), ("Drykkir", 769, (31, 138, 192)), ("Snakk & sælgæti", 314, (217, 140, 0)), ("Heimili", 53, (168, 59, 102))]
DAYS = [0]*30
for d, a in [(2,6121),(5,8450),(8,11230),(11,7980),(14,9340),(17,6890),(21,10450),(24,8120),(28,9819),(3,5420),(9,8910),(13,6230),(19,9870),(23,7340),(27,8430),(15,31900),(6,7400),(20,7400),(12,5900),(26,6400),(7,3900),(22,5900),(10,4800),(25,4800),(27,8400)]:
    DAYS[d-1] += a
def scene_c(t):
    c = base(); phone_frame(c, BG); app_header(c, "Kvittun lesin"); notch(c)
    y = SY + 180
    c.t(SX+40, y+20, "Bónus Fiskislóð", F("pb", 36), NAVY, "lm")
    c.t(SX+SW-40, y+20, "6.121 kr", F("pb", 38), NAVY, "rm")
    c.t(SX+40, y+64, "11 vörur flokkaðar", F("lr", 26), MUTED, "lm")
    y += 110
    for i, (nm, v, col) in enumerate(CATS):
        p = prog(t, 0.2 + i*0.22, 0.45)
        if p <= 0: continue
        c.circ(SX+64, y+32, 22, fill=mix(BG, col, p))
        c.t(SX+104, y+20, nm, F("lb", 30), mix(BG, NAVY, p), "lm")
        c.t(SX+SW-40, y+20, f"{v:,}".replace(",", ".") + " kr", F("pb", 30), mix(BG, NAVY, p), "rm")
        bw = (SW-150) * (v/CATS[0][1]) * prog(t, 0.35 + i*0.22, 0.6)
        c.rr(SX+104, y+48, SW-150, 12, 6, fill=mix(BG, LINE, p))
        if bw > 2: c.rr(SX+104, y+48, max(12, bw), 12, 6, fill=col)
        y += 86
    # mánuðurinn
    pm = prog(t, 1.5, 0.5)
    if pm > 0:
        y += 20
        c.rr(SX+24, y, SW-48, 360, 24, fill=mix(BG, WHITE, pm), outline=mix(BG, LINE, pm), width=1.5)
        c.t(SX+52, y+40, "Nóvember · 25 kvittanir", F("lr", 26), mix(WHITE, MUTED, pm), "lm")
        c.t(SX+52, y+92, "211.400 kr", F("pb", 54), mix(WHITE, NAVY, pm), "lm")
        mx = max(DAYS); bx = SX+52; bwid = (SW-104)/30
        for i, v in enumerate(DAYS):
            g = prog(t, 1.7 + i*0.025, 0.4)
            h_ = (v/mx) * 170 * g if v else 3
            c.rr(bx + i*bwid + 2, y+320-h_, bwid-4, max(3, h_), 3, fill=NAVY if v else LINE)
    caption(c, t, "Tossalisti flokkar allt", "og sýnir hvert peningarnir fara")
    return c

# D) Lógó + kall til aðgerða
def smooth(t): t = max(0.0, min(1.0, t)); return t*t*(3 - 2*t)
def scene_d(t):
    # Hvítur kassi birtist fyrst (smá „pop“), svo teiknast tékkmerkið inn í hann eins og penni dragi það
    c = C(W, H, NAVY)
    pb = prog(t, 0.1, 0.45)
    pop = 1 + 0.08*math.sin(math.pi*min(1.0, max(0.0, (t-0.1)/0.45)))
    sz = 190*(0.6 + 0.4*pb)*pop; x = W/2 - sz/2; y = 655 - sz/2
    c.rr(x, y, sz, sz, sz*0.27, fill=mix(NAVY, WHITE, pb)); k = sz/64
    pts = [(x+20*k, y+33*k), (x+29*k, y+42*k), (x+45*k, y+24*k)]
    seg = [math.dist(pts[0], pts[1]), math.dist(pts[1], pts[2])]
    q = smooth((t - 0.6) / 0.55) * (seg[0] + seg[1])
    if q > 0:
        if q <= seg[0]:
            f_ = q/seg[0]; c.line([pts[0], (pts[0][0]+(pts[1][0]-pts[0][0])*f_, pts[0][1]+(pts[1][1]-pts[0][1])*f_)], GOLD, 5.5*k)
        else:
            f_ = (q-seg[0])/seg[1]
            c.line([pts[0], pts[1], (pts[1][0]+(pts[2][0]-pts[1][0])*f_, pts[1][1]+(pts[2][1]-pts[1][1])*f_)], GOLD, 5.5*k)
    c.t(W/2, 870, "Tossalisti", F("pb", 116), mix(NAVY, WHITE, prog(t, 1.15, 0.5)), "mm")
    c.t(W/2, 1000, "Heimilisbókhald sem sér um sig sjálft", F("lr", 44), mix(NAVY, LIGHT, prog(t, 1.35, 0.5)), "mm")
    p3 = prog(t, 1.65, 0.5); f = F("pb", 58); tx = "Ókeypis · tossalisti.is"; wd = c.tw(tx, f); sc = 0.9 + 0.1*p3
    w_ = (wd+110)*sc; h_ = 124*sc
    c.rr(W/2-w_/2, 1250-h_/2, w_, h_, h_/2, fill=mix(NAVY, GOLD, p3)); c.t(W/2, 1252, tx, f, mix(NAVY, INK, p3), "mm")
    return c

# Bráðabirgðatímasetning: stillt eftir upptökunni þegar hún kemur
SCENES = [(scene_a, 2.6), (scene_b, 3.6), (scene_c, 4.2), (scene_d, 3.6)]
XF = 0.3
def render(fn, t): return fn(t).im.reduce(S)

if __name__ == '__main__':
    out = sys.argv[1]
    voice = sys.argv[2] if len(sys.argv) > 2 else None
    tmp = out + '.video.mp4' if voice else out
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                           "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium", "-movflags", "+faststart", tmp], stdin=subprocess.PIPE)
    total = 0
    for si, (fn, dur) in enumerate(SCENES):
        nxt = render(SCENES[si+1][0], 0.0) if si+1 < len(SCENES) else None
        nf = int(dur*FPS)
        for i in range(nf):
            t = i / FPS
            fr = render(fn, t)
            rem = dur - t
            if nxt is not None and rem < XF: fr = Image.blend(fr, nxt, 1 - rem/XF)
            ff.stdin.write(fr.tobytes()); total += 1
        print("scene", si, "done", total, flush=True)
    ff.stdin.close(); ff.wait()
    if voice:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-i", voice, "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-af", "loudnorm=I=-16:TP=-1.5", "-shortest", out], check=True)
        os.remove(tmp)
