# Auglýsingamyndband: raddstýring („Segðu bara hvað vantar“). 1080×1920, ~14 sek, texti fyrir hljóðlaust áhorf.
# Keyrt: python3 video_rodd.py út.mp4   (notar teikniföll úr make.py)
import subprocess, sys, math
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

SPEECH = "Mjólk, tvö kíló af kartöflum, brauð og bananar"
WORDS = SPEECH.split(" ")
# Tímasetning orða í takt við upptöku (rödd hefst við t=0.3 í senu B)
WORD_T = [0.35, 1.23, 1.47, 1.71, 1.95, 2.56, 3.18, 3.40]
# (heiti, magn, deild, litur)
ITEMS = [("Mjólk", "", "Mjólkurvörur", (31, 138, 192)),
         ("Kartöflur", "2 kg", "Grænmeti og ávextir", (90, 158, 90)),
         ("Bananar", "", "Grænmeti og ávextir", (90, 158, 90)),
         ("Brauð", "", "Brauð og bakkelsi", (232, 149, 74))]

def scene_a(t):
    c = base()
    lines = [("Nennirðu ekki", WHITE), ("að skrifa", WHITE), ("innkaupalistann?", GOLD)]
    for i, (tx, col) in enumerate(lines):
        p = prog(t, 0.15 + i*0.22, 0.6)
        c.t(W/2, 800 + i*132 + (1-p)*46, tx, F("pb", 100), mix(NAVY, col, p), "mm")
    return c

def mic_orb(c, cx, cy, t, level):
    for i in range(3):  # bylgjur út frá hljóðnemanum
        ph = (t*1.1 + i/3) % 1.0
        r = 92 + ph*120
        c.circ(cx, cy, r, outline=mix(BG, GOLD, (1-ph)*0.8), width=5)
    r = 92 * (1 + 0.12*level)
    c.circ(cx, cy, r, fill=NAVY)
    # hljóðnemi teiknaður
    c.rr(cx-22, cy-52, 44, 70, 22, fill=WHITE)
    c.line([(cx-38, cy-2), (cx-38, cy+6)], WHITE, 6)
    c.line([(cx+38, cy-2), (cx+38, cy+6)], WHITE, 6)
    for a in range(0, 181, 12):
        pass
    c.d.arc([(cx-38)*S, (cy-34)*S, (cx+38)*S, (cy+40)*S], 0, 180, fill=WHITE, width=int(6*S))
    c.line([(cx, cy+40), (cx, cy+58)], WHITE, 6)
    c.line([(cx-22, cy+58), (cx+22, cy+58)], WHITE, 6)

def scene_b(t):
    c = base(); phone_frame(c, BG); app_header(c, "Innkaupalisti"); notch(c)
    level = 0.5 + 0.5*math.sin(t*14) * (1 if 0.3 < t < 3.7 else 0)
    mic_orb(c, SX+SW/2, SY+430, t, abs(level))
    # hljóðbylgja
    for i in range(23):
        h_ = 12 + abs(math.sin(t*9 + i*0.7)) * 70 * (1 if 0.3 < t < 3.7 else 0.15)
        x = SX + 70 + i*((SW-140)/22)
        c.rr(x-5, SY+700-h_/2, 10, h_, 5, fill=mix(BG, NAVY, 0.75))
    # talbóla sem skrifast orð fyrir orð
    n = sum(1 for wt in WORD_T if t >= wt)
    txt = "„" + " ".join(WORDS[:n]) + ("“" if n == len(WORDS) else "")
    if n:
        c.rr(SX+36, SY+800, SW-72, 230, 28, fill=WHITE, outline=LINE, width=2)
        c.wrap(SX+70, SY+834, txt, F("lm", 40), NAVY, SW-140, 58)
    if t > 3.85:
        p = prog(t, 3.85, 0.3)
        c.t(SX+SW/2, SY+1100, "Les það sem þú sagðir…", F("ls", 30), mix(BG, MUTED, p), "mm")
    caption(c, t, "Segðu bara hvað vantar", "á íslensku")
    return c

def scene_c(t):
    c = base(); phone_frame(c, BG); app_header(c, "Innkaupalisti"); notch(c)
    y = SY + 170; shown_dept = None; k = 0
    for i, (nm, q, dept, col) in enumerate(ITEMS):
        p = prog(t, 0.25 + i*0.45, 0.45)
        if p <= 0: continue
        if dept != shown_dept:
            c.t(SX+40, y+26, dept, F("lb", 26), mix(BG, MUTED, p), "lm"); y += 52; shown_dept = dept
        dx = (1-p)*60
        c.rr(SX+24+dx, y, SW-48, 104, 20, fill=mix(BG, WHITE, p), outline=mix(BG, LINE, p), width=1.5)
        c.circ(SX+70+dx, y+52, 20, outline=mix(BG, (195, 204, 218), p), width=4)
        c.rr(SX+108+dx, y+18, 68, 68, 16, fill=mix(BG, col, p))
        c.t(SX+142+dx, y+52, nm[0], F("pb", 36), mix(BG, WHITE, p), "mm")
        c.t(SX+196+dx, y+52, nm, F("lb", 34), mix(BG, NAVY, p), "lm")
        if q:
            fq = F("lb", 26); wq = c.tw(q, fq)
            c.rr(SX+SW-60-wq-dx*0, y+32, wq+28, 40, 20, fill=mix(BG, CHIP, p)); c.t(SX+SW-46-wq/2, y+52, q, fq, mix(BG, NAVY, p), "mm")
        y += 120; k += 1
    pd = prog(t, 2.3, 0.5)
    if pd > 0:
        c.rr(SX+24, y+20, SW-48, 84, 20, fill=mix(BG, GOLD, pd))
        c.t(SX+SW/2, y+62, "Deila með heimilinu", F("lb", 30), mix(BG, INK, pd), "mm")
    caption(c, t, "Listinn verður til sjálfur", "flokkaður eftir deildum búðarinnar")
    return c

def scene_d(t):
    c = C(W, H, NAVY); p = prog(t, 0.1, 0.6); sz = 190; x = W/2 - sz/2; y = 520 + (1-p)*40
    c.rr(x, y, sz, sz, sz*0.27, fill=mix(NAVY, WHITE, p)); k = sz/64
    c.line([(x+20*k, y+33*k), (x+29*k, y+42*k), (x+45*k, y+24*k)], mix(NAVY, GOLD, p), 5.5*k)
    c.t(W/2, 830, "Tossalisti", F("pb", 116), mix(NAVY, WHITE, prog(t, 0.3, 0.6)), "mm")
    p2 = prog(t, 0.55, 0.6)
    c.t(W/2, 960, "Þú talar íslensku.", F("lr", 54), mix(NAVY, LIGHT, p2), "mm")
    c.t(W/2, 1030, "Tossalisti skilur.", F("pb", 54), mix(NAVY, GOLD, prog(t, 0.75, 0.6)), "mm")
    p3 = prog(t, 1.0, 0.5); f = F("pb", 58); tx = "Frítt á tossalisti.is"; wd = c.tw(tx, f); sc = 0.9 + 0.1*p3
    w_ = (wd+110)*sc; h_ = 124*sc
    c.rr(W/2-w_/2, 1250-h_/2, w_, h_, h_/2, fill=mix(NAVY, GOLD, p3)); c.t(W/2, 1252, tx, f, mix(NAVY, INK, p3), "mm")
    return c

SCENES = [(scene_a, 2.4), (scene_b, 4.6), (scene_c, 3.8), (scene_d, 3.4)]
XF = 0.3
def render(fn, t): return fn(t).im.reduce(S)
out = sys.argv[1]
ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                       "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
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
ff.stdin.close(); ff.wait(); print("frames", total, "sec", total/FPS)
