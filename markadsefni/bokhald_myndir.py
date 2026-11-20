# Færsla fyrir Facebook/Instagram: „Bókhaldið í myndum“ — 3 myndir (1080×1350). Öll gögn eru sýnidæmi.
import re, math
src = open(__file__.replace("bokhald_myndir.py", "make.py"), encoding="utf-8").read()
exec(src[:src.index("ITEMS=")])          # leturgerðir, litir, C (strigi), logo(), phone()

# Tölurnar eru úr sýningunni á tossalisti.is/siggaogjon (tilbúið heimili: Sigga og Jón, heilt ár af kvittunum).
CATS = [("Matur", 1075000, (232,149,74)), ("Samgöngur", 384000, (90,158,90)), ("Veitingar", 231000, (224,123,57)),
        ("Heimili", 163000, (168,59,102)), ("Föt", 154000, (63,143,208))]
MONTHS = [283, 238, 183, 184, 136, 220, 194, 257, 168, 224, 181, 171]   # des–nóv, þús. kr
SOFT = (201,214,236)

def donut(c, cx, cy, r, w, slices, rest=0):
    a = -90.0
    box = [(cx-r)*S, (cy-r)*S, (cx+r)*S, (cy+r)*S]
    tot = sum(v for _, v, _ in slices) + rest
    for _, v, col in list(slices) + ([("", rest, (182,191,204))] if rest else []):
        e = a + v / tot * 360
        c.d.pieslice(box, a + 1.2, e - 1.2, fill=col); a = e
    c.circ(cx, cy, r - w, fill=WHITE)

def bars(c, x, y, w, h, vals, col, hi=None, hicol=GOLD, labels=None, lblfont=None):
    n = len(vals); slot = w / n; bw = slot * 0.62; mx = max(vals) or 1
    c.rect(x, y + h, w, 1.5, LINE)
    for i, v in enumerate(vals):
        bh = v / mx * h
        if bh > 0: c.rr(x + i*slot + (slot-bw)/2, y + h - bh, bw, bh, min(6, bw/2), fill=hicol if i == hi else col)
        if labels and labels[i]: c.t(x + i*slot + slot/2, y + h + 10, labels[i], lblfont, MUTED, "ma")

def card(c, x, y, w, h, r=22): c.rr(x, y, w, h, r, fill=WHITE, outline=LINE, width=1.5)

# ---------- Mynd 1: Sigga og Jón ----------
c = C(1080, 1350, NAVY)
logo(c, 72, 64)
c.t(72, 164, "Sigga og Jón", F("pb", 80), WHITE); c.t(72, 256, "skönnuðu allar", F("pb", 80), WHITE); c.t(72, 348, "kvittanir í heilt ár.", F("pb", 80), WHITE)
c.t(72, 470, "Sjáðu bókhaldið þeirra.", F("lr", 38), SOFT)
sx, sy, sw, sh = phone(c, 190, 570, 700, 1100)
px = sx + 34; pw = sw - 68
c.t(sx + sw/2, sy + 92, "Síðustu 12 mánuðir", F("ls", 26), MUTED, "ma")
c.t(sx + sw/2, sy + 128, "2.514.227 kr", F("pb", 60), NAVY, "ma")
c.t(sx + sw/2, sy + 214, "449 kvittanir · 26 verslanir", F("lr", 24), MUTED, "ma")
card(c, px, sy + 262, pw, 244)
c.t(px + 24, sy + 282, "Útgjöld á mánuði", F("ls", 24), NAVY)
bars(c, px + 24, sy + 330, pw - 48, 124, MONTHS, NAVY, hi=0, labels=list("DJFMAMJJÁSON"), lblfont=F("ls", 18))
card(c, px, sy + 528, pw, 330)
donut(c, px + 150, sy + 693, 112, 40, CATS, rest=507000)
c.t(px + 150, sy + 675, "Flokkar", F("lr", 20), MUTED, "ma"); c.t(px + 150, sy + 700, "2,5 m.kr", F("pb", 26), NAVY, "ma")
for i, (n, v, col) in enumerate(CATS):
    yy = sy + 568 + i * 54
    c.circ(px + 306, yy + 14, 9, fill=col); c.t(px + 326, yy, n, F("ls", 24), NAVY); c.t(px + pw - 22, yy, kr(v), F("lb", 23), NAVY, "ra")
c.save("tossalisti-bokhald-1.png")

# ---------- Mynd 2: Hverju komust þau að? ----------
c = C(1080, 1350, BG)
logo(c, 72, 64, dark_bg=False)
c.t(72, 170, "Hverju komust", F("pb", 84), NAVY); c.t(72, 266, "þau að?", F("pb", 84), NAVY)
facts = [("43%", "af útgjöldunum fóru í mat", "Rúm milljón króna á árinu.", (232,149,74)),
         ("283 þ.kr", "fóru í desember", "Dýrasti mánuðurinn, eins og hjá flestum.", (168,59,102)),
         ("48", "kaffihúsaferðir", "Þær telja meira en maður heldur.", (224,123,57)),
         ("384 þ.kr", "í bensín", "Næststærsti flokkurinn á eftir mat.", (90,158,90))]
for i, (big, a, b, col) in enumerate(facts):
    y = 420 + i * 206
    c.shadow(72, y, 936, 180, 28, blur=24, alpha=36, dy=10); card(c, 72, y, 936, 180, 28)
    c.rr(72, y, 14, 180, 7, fill=col)
    c.t(120, y + 30, big, F("pb", 62), NAVY)
    xx = 120 + c.tw(big, F("pb", 62)) + 22
    c.t(xx, y + 56, a, F("ls", 34), NAVY)
    c.t(120, y + 122, b, F("lr", 28), MUTED)
c.t(72, 1262, "Tilbúið sýniheimili. Tölurnar eru dæmi.", F("lr", 24), FAINT)
c.save("tossalisti-bokhald-2.png")

# ---------- Mynd 3: Skoðaðu sjálf(ur) ----------
c = C(1080, 1350, NAVY)
logo(c, 72, 64)
c.t(72, 170, "Skoðaðu", F("pb", 84), WHITE); c.t(72, 266, "bókhaldið þeirra.", F("pb", 84), WHITE)
c.rr(72, 440, 936, 150, 34, fill=WHITE)
c.t(540, 515, "tossalisti.is/siggaogjon", F("pb", 54), NAVY, "mm")
steps = [("1", "Taktu mynd af kvittuninni", "Úr hvaða búð sem er."),
         ("2", "Appið les og flokkar hverja línu", "Þú slærð ekkert inn."),
         ("3", "Sjáðu hvert peningarnir fara", "Eftir tímabilum og flokkum.")]
c.t(72, 672, "Svona byrjar þú á þínu:", F("ls", 32), SOFT)
for i, (n, a, b) in enumerate(steps):
    y = 742 + i * 158
    c.rr(72, y, 936, 136, 26, fill=(31,62,112))
    c.circ(138, y + 68, 32, fill=GOLD); c.t(138, y + 68, n, F("pb", 32), INK, "mm")
    c.t(196, y + 30, a, F("pb", 33), WHITE); c.t(196, y + 80, b, F("lr", 27), SOFT)
c.t(540, 1290, "Tossalisti er ókeypis", F("ls", 30), GOLD, "mm")
c.save("tossalisti-bokhald-3.png")
print("ok")
