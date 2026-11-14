# Skjámyndir fyrir velkomupóst (teiknaðar, sýnidæmi). Keyrt: python3 postur.py
src = open('make.py', encoding='utf-8').read().split('# ---------- Slide 1')[0]
exec(src)
OUT = '../public/postur/'
W, H = 600, 900
GREEN=(15,110,86); RED=(216,69,47)

def screen(title, sub=None):
    c = C(W, H, BG)
    c.rect(0, 0, W, 132, NAVY)
    logo(c, 30, 30, 40, True, False)
    c.t(86, 50, title, F("pb", 30), WHITE, "lm")
    if sub: c.t(86, 92, sub, F("lr", 20), (200,214,236), "lm")
    return c

def check(c, x, y, on):
    if on:
        c.circ(x, y, 15, fill=GREEN); c.line([(x-7,y),(x-2,y+6),(x+8,y-6)], WHITE, 3.5)
    else:
        c.circ(x, y, 15, outline=FAINT, width=2.5)

def btn(c, y, text, fill=GOLD, ink=INK):
    c.rr(36, y, W-72, 74, 20, fill=fill); c.t(W/2, y+37, text, F("pb", 26), ink, "mm")

# 1. Kvittun lesin
c = screen("Kvittun lesin", "Bónus · 14. nóv.")
c.rr(30, 160, W-60, 610, 22, fill=WHITE)
rows=[("Nýmjólk 1 l",398,"Matur"),("Heimilisbrauð",549,"Matur"),("Kjúklingur",2798,"Matur"),("Kaffi 500 g",1129,"Drykkir"),("Uppþvottalögur",549,"Hreinlæti"),("Klósettpappír",1198,"Hreinlæti")]
y=196
for n,p,cat in rows:
    c.circ(64, y+14, 9, fill=CAT[cat]); c.t(86, y+14, n, F("lm", 24), NAVY, "lm"); c.t(W-60, y+14, kr(p), F("lb", 24), NAVY, "rm")
    c.t(86, y+44, cat, F("lr", 17), MUTED, "lm"); y+=74
c.rect(54, y+4, W-108, 2, LINE)
tot=sum(p for _,p,_ in rows)
c.t(60, y+40, "Samtals", F("pb", 26), NAVY, "lm"); c.t(W-60, y+40, kr(tot), F("pb", 26), NAVY, "rm")
btn(c, 790, "Vista í bókhald")
c.save(OUT+'kvittun.png')

# 2. Deildur innkaupalisti
c = screen("Innkaupalisti", "Deilt með heimilinu")
for i,(ini,col) in enumerate([("SS",(232,149,74)),("EM",(31,138,192)),("KR",(20,163,122))]):
    c.circ(W-70-i*40, 66, 22, fill=col, outline=NAVY, width=3); c.t(W-70-i*40, 66, ini, F("pb", 15), WHITE, "mm")
groups=[("Mjólkurvörur",[("Mjólk",True),("Ostur 26%",False),("Skyr",False)]),("Ávextir og grænmeti",[("Bananar",True),("Gúrka",False)]),("Brauð",[("Heimilisbrauð",False)])]
y=160
for g,items in groups:
    c.t(36, y+14, g.upper(), F("pb", 17), MUTED, "lm"); y+=38
    c.rr(30, y, W-60, len(items)*66, 18, fill=WHITE)
    for n,on in items:
        check(c, 70, y+33, on); c.t(100, y+33, n, F("lm", 25), FAINT if on else NAVY, "lm")
        if on: c.rect(100, y+34, c.tw(n, F("lm",25)), 2, FAINT)
        y+=66
    y+=18
c.rr(30, H-86, W-60, 60, 18, fill=CHIP); c.t(W/2, H-56, "Eva hakaði við mjólk — rétt í þessu", F("lm", 19), NAVY, "mm")
c.save(OUT+'listi.png')

# 3. Talaðu inn á listann
c = screen("Talaðu inn á listann")
for r,a in [(150,30),(118,60),(88,255)]:
    col = tuple(int(GOLD[i]*(a/255)+BG[i]*(1-a/255)) for i in range(3))
    c.circ(W/2, 330, r, fill=col)
cx,cy=W/2,330
c.rr(cx-20, cy-52, 40, 70, 20, fill=INK); c.line([(cx-34,cy+2),(cx-34,cy+10),(cx,cy+40),(cx+34,cy+10),(cx+34,cy+2)], INK, 6); c.rect(cx-3, cy+40, 6, 22, INK); c.rect(cx-22, cy+60, 44, 6, INK)
c.wrap(56, 520, "„Mjólk, tvö kíló af hakki og eitthvað í morgunmat“", F("lm", 26), NAVY, W-112, 38)
y=640; x=40
for ch in ["Mjólk","Hakk · 2 kg","Morgunkorn"]:
    wd=c.tw(ch, F("lb", 22))+44
    if x+wd>W-40: x=40; y+=66
    c.rr(x, y, wd, 52, 26, fill=WHITE, outline=NAVY, width=2); c.t(x+wd/2, y+26, ch, F("lb", 22), NAVY, "mm"); x+=wd+12
btn(c, 790, "Bæta 3 vörum á listann")
c.save(OUT+'rodd.png')

# 4. Uppskrift
c = screen("Lasagne", "Uppskrift · 45 mín.")
c.rr(30, 160, W-60, 76, 18, fill=WHITE)
c.t(60, 198, "Fyrir", F("lm", 24), MUTED, "lm")
c.rr(W-230, 176, 170, 44, 22, fill=CHIP); c.t(W-208, 198, "–", F("pb", 26), NAVY, "mm"); c.t(W-145, 198, "4 manns", F("pb", 21), NAVY, "mm"); c.t(W-82, 198, "+", F("pb", 26), NAVY, "mm")
ing=[("Nautahakk","500 g"),("Lasagneplötur","250 g"),("Tómatar í dós","2 stk"),("Rifinn ostur","200 g"),("Laukur","1 stk"),("Hvítlaukur","2 rif"),("Mjólk","5 dl"),("Smjör","50 g")]
c.rr(30, 256, W-60, len(ing)*58+20, 18, fill=WHITE)
y=276
for n,q in ing:
    c.circ(64, y+19, 6, fill=GOLD); c.t(86, y+19, n, F("lm", 23), NAVY, "lm"); c.t(W-60, y+19, q, F("lb", 22), MUTED, "rm"); y+=58
btn(c, 790, "Setja á innkaupalistann (8)")
c.save(OUT+'uppskrift.png')

# 5. Kvittanir & ábyrgðir
c = screen("Kvittanir & ábyrgðir")
c.rr(30, 160, W-60, 118, 20, fill=(253,240,213))
c.rr(52, 186, 64, 64, 16, fill=GOLD); c.t(84, 218, "!", F("pb", 36), INK, "mm")
c.t(134, 200, "Skilafrestur: Úlpa", F("pb", 24), NAVY, "lm"); c.t(134, 236, "Rennur út eftir 3 daga", F("lm", 20), (122,90,18), "lm")
c.rr(40, 300, 360, 52, 26, fill=WHITE, outline=LINE, width=2); c.t(70, 326, "Leita: ryksuga, Elko…", F("lr", 20), FAINT, "lm")
items=[("Ryksuga","Elko · 12. mars 2026","Ábyrgð til 2028"),("Kaffivél","Heimilistæki · 3. jan. 2026","Ábyrgð til 2028"),("Úlpa","66°Norður · 4. nóv. 2026","Skil til 18. nóv."),("Bónus","14. nóv. 2026 · 6.621 kr","Kvittun")]
y=376
for n,s,b in items:
    c.rr(30, y, W-60, 96, 18, fill=WHITE)
    c.t(60, y+34, n, F("pb", 24), NAVY, "lm"); c.t(60, y+68, s, F("lr", 18), MUTED, "lm")
    bw=c.tw(b, F("lb", 17))+28; c.rr(W-60-bw, y+30, bw, 36, 18, fill=CHIP); c.t(W-60-bw/2, y+48, b, F("lb", 17), NAVY, "mm")
    y+=110
c.save(OUT+'abyrgd.png')
print('ok')
