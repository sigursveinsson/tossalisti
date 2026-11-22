# Black Friday 2026 (föstudagur 27. nóv.): þrjár myndir 1080×1350 fyrir Facebook/Instagram.
#  1) Grín: „100% afsláttur af áskrift (eins og alla aðra daga)“
#  2) Kvittanir: „Keyptirðu eitthvað á Black Friday? Taktu mynd af kvittuninni.“
#  3) Kaupa seinna / Verðvakt
src = open(__file__.replace("blackfriday_myndir.py", "make.py"), encoding="utf-8").read()
exec(src[:src.index("ITEMS=")])          # leturgerðir, litir, C (strigi), logo(), phone()
BLACK = (12, 14, 20); SOFT = (201, 214, 236); GREEN = (31, 122, 77)

def tag(c, x, y, txt, fg=BLACK, bg=GOLD):
    f = F("pb", 30); w = c.tw(txt, f) + 44
    c.rr(x, y, w, 58, 29, fill=bg); c.t(x + 22, y + 29, txt, f, fg, "lm")
    return w

# ---------- 1: 100% afsláttur ----------
c = C(1080, 1350, BLACK)
logo(c, 72, 64)
tag(c, 72, 170, "BLACK FRIDAY TILBOÐ")
c.t(64, 250, "100%", F("pb", 300), GOLD)
c.t(72, 640, "afsláttur af", F("pb", 84), WHITE)
c.t(72, 738, "áskrift að Tossalista*", F("pb", 84), WHITE)
# verðmiði
c.rr(72, 900, 936, 190, 28, fill=(26, 30, 40))
c.t(120, 934, "Verð áður", F("ls", 30), FAINT); c.t(120, 978, "0 kr.", F("pb", 76), FAINT)
w0 = c.tw("0 kr.", F("pb", 76)); c.rect(112, 1030, w0 + 16, 7, (200, 16, 46))
c.t(560, 934, "Verð núna", F("ls", 30), GOLD); c.t(560, 978, "0 kr.", F("pb", 76), WHITE)
c.t(72, 1150, "*Eins og alla aðra daga.", F("pb", 44), WHITE)
c.t(72, 1216, "Innkaupalisti, kvittanir og heimilisbókhald. Ókeypis.", F("lr", 32), SOFT)
c.t(72, 1270, "tossalisti.is", F("ls", 32), GOLD)
c.save("tossalisti-blackfriday-1.png")

# ---------- 2: kvittunin ----------
c = C(1080, 1350, NAVY)
logo(c, 72, 64)
tag(c, 72, 170, "BLACK FRIDAY")
for i, l in enumerate(["Keyptirðu eitthvað", "á Black Friday?"]): c.t(72, 262 + i * 100, l, F("pb", 88), WHITE)
c.t(72, 486, "Taktu mynd af kvittuninni.", F("pb", 60), GOLD)
rows = [("Ábyrgðin skráð", "Þú finnur kvittunina eftir tvö ár, ekki bara í dag."),
        ("Skilafresturinn á sínum stað", "Við minnum þig á áður en hann rennur út."),
        ("Beint í heimilisbókhaldið", "Sjáðu hvað föstudagurinn kostaði í raun.")]
for i, (a, b) in enumerate(rows):
    y = 620 + i * 178
    c.rr(72, y, 936, 154, 26, fill=WHITE)
    c.circ(138, y + 77, 30, fill=(230, 244, 236)); c.line([(124, y + 78), (134, y + 89), (153, y + 66)], GREEN, 6)
    c.t(196, y + 34, a, F("pb", 38), NAVY); c.t(196, y + 92, b, F("lr", 28), MUTED)
c.t(72, 1190, "Ókeypis. Alla daga,", F("pb", 46), WHITE)
c.t(72, 1248, "ekki bara á föstudaginn.", F("pb", 46), WHITE)
c.t(1008, 1262, "tossalisti.is", F("ls", 32), GOLD, "ra")
c.save("tossalisti-blackfriday-2.png")

# ---------- 3: Kaupa seinna ----------
c = C(1080, 1350, BG)
logo(c, 72, 64, dark_bg=False)
tag(c, 72, 170, "KAUPA SEINNA", fg=WHITE, bg=NAVY)
for i, l in enumerate(["Er þetta í alvöru", "gott tilboð?"]): c.t(72, 262 + i * 100, l, F("pb", 88), NAVY)
c.wrap(72, 486, "Límdu slóðina á vöruna í Tossalista. Verðvaktin lætur þig vita ef verðið lækkar.", F("lr", 38), MUTED, 936, 52)
items = [("Úlpa", "fataverslun.is", "69.000 kr.", None), ("Kaffivél", "raftaekjabud.is", "32.995 kr.", "Lækkaði um 7.000 kr."), ("Náttborð", "husgagnabud.is", "14.990 kr.", None)]
for i, (n, h, p, drop) in enumerate(items):
    y = 640 + i * 176
    c.shadow(72, y, 936, 150, 26, blur=22, alpha=30, dy=8); c.rr(72, y, 936, 150, 26, fill=WHITE, outline=LINE, width=1.5)
    c.rr(100, y + 27, 96, 96, 20, fill=CHIP); c.t(148, y + 75, n[0], F("pb", 48), NAVY, "mm")
    c.t(226, y + 30, n, F("pb", 40), NAVY); c.t(226, y + 90, h + " ↗", F("ls", 26), MUTED)
    c.t(980, y + 30, p, F("pb", 40), NAVY, "ra")
    if drop:
        f = F("lb", 26); w = c.tw(drop, f) + 28
        c.rr(980 - w, y + 88, w, 40, 12, fill=(200, 16, 46)); c.t(980 - w + 14, y + 108, drop, f, WHITE, "lm")
    else:
        f = F("lb", 24); w = c.tw("Verðvakt", f) + 28
        c.rr(980 - w, y + 90, w, 38, 12, fill=(230, 244, 236)); c.t(980 - w + 14, y + 109, "Verðvakt", f, GREEN, "lm")
c.t(72, 1200, "Ókeypis á tossalisti.is", F("pb", 44), NAVY)
c.t(72, 1262, "Vörur og verð á myndinni eru sýnidæmi.", F("lr", 24), FAINT)
c.save("tossalisti-blackfriday-3.png")
print("ok")
