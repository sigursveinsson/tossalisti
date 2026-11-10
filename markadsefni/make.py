from PIL import Image, ImageDraw, ImageFont, ImageFilter
S = 2
GF = "/usr/share/fonts/truetype/google-fonts/"; LF = "/usr/share/fonts/truetype/lato/"
def F(name, size):
    p = {"pb": GF+"Poppins-Bold.ttf", "pm": GF+"Poppins-Medium.ttf", "pr": GF+"Poppins-Regular.ttf",
         "lr": LF+"Lato-Regular.ttf", "lb": LF+"Lato-Bold.ttf", "ls": LF+"Lato-Semibold.ttf", "lm": LF+"Lato-Medium.ttf",
         "mono": "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", "monob": "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"}[name]
    return ImageFont.truetype(p, int(size*S))
NAVY=(21,49,94); GOLD=(245,166,35); BG=(245,247,251); LINE=(227,232,240); MUTED=(107,122,147); FAINT=(154,166,186); WHITE=(255,255,255); CHIP=(238,243,251); INK=(58,38,0)
CAT={"Matur":(232,149,74),"Heimili":(168,59,102),"Samgöngur":(90,158,90),"Veitingar & kaffihús":(224,123,57),"Hreinlæti":(20,163,122),"Drykkir":(31,138,192)}
def kr(n): return f"{n:,}".replace(",", ".") + " kr"

class C:
    def __init__(s, w, h, bg):
        s.w, s.h = w, h
        s.im = Image.new("RGB", (w*S, h*S), bg); s.d = ImageDraw.Draw(s.im)
    def rr(s, x, y, w, h, r, fill=None, outline=None, width=1):
        s.d.rounded_rectangle([x*S, y*S, (x+w)*S, (y+h)*S], radius=r*S, fill=fill, outline=outline, width=int(width*S))
    def rect(s, x, y, w, h, fill): s.d.rectangle([x*S, y*S, (x+w)*S, (y+h)*S], fill=fill)
    def circ(s, cx, cy, r, fill=None, outline=None, width=1): s.d.ellipse([(cx-r)*S,(cy-r)*S,(cx+r)*S,(cy+r)*S], fill=fill, outline=outline, width=int(width*S))
    def t(s, x, y, txt, font, fill, anchor="la"): s.d.text((x*S, y*S), txt, font=font, fill=fill, anchor=anchor)
    def tw(s, txt, font): return s.d.textlength(txt, font=font)/S
    def line(s, pts, fill, width): s.d.line([(x*S,y*S) for x,y in pts], fill=fill, width=int(width*S), joint="curve")
    def wrap(s, x, y, txt, font, fill, maxw, lh):
        words = txt.split(" "); cur = ""; lines=[]
        for w_ in words:
            trial = (cur+" "+w_).strip()
            if s.tw(trial, font) <= maxw: cur = trial
            else: lines.append(cur); cur = w_
        if cur: lines.append(cur)
        for i,l in enumerate(lines): s.t(x, y+i*lh, l, font, fill)
        return y + len(lines)*lh
    def shadow(s, x, y, w, h, r, blur=40, alpha=90, dy=18):
        pad = blur*3
        sh = Image.new("RGBA", (int((w+2*pad)*S), int((h+2*pad)*S)), (0,0,0,0))
        ImageDraw.Draw(sh).rounded_rectangle([pad*S, pad*S, (pad+w)*S, (pad+h)*S], radius=r*S, fill=(8,20,45,alpha))
        sh = sh.filter(ImageFilter.GaussianBlur(blur*S/2))
        s.im.paste(sh, (int((x-pad)*S), int((y-pad+dy)*S)), sh)
    def paste(s, img, x, y): s.im.paste(img, (int(x*S), int(y*S)), img)
    def save(s, path): s.im.resize((s.w, s.h), Image.LANCZOS).save(path, quality=95)

def logo(c, x, y, size=44, dark_bg=True, label=True):
    c.rr(x, y, size, size, size*0.27, fill=WHITE if dark_bg else NAVY)
    k = size/64
    c.line([(x+20*k, y+33*k), (x+29*k, y+42*k), (x+45*k, y+24*k)], GOLD, 5.5*k)
    for px,py in [(20,33),(29,42),(45,24)]: c.circ(x+px*k, y+py*k, 2.75*k, fill=GOLD)
    if label: c.t(x+size+14, y+size/2, "Tossalisti", F("pb", 28), WHITE if dark_bg else NAVY, "lm")

def phone(c, x, y, w, h, screen=BG):
    c.shadow(x, y, w, h, 56)
    c.rr(x, y, w, h, 56, fill=(14,24,44))
    c.rr(x+12, y+12, w-24, h-24, 46, fill=screen)
    c.rr(x+w/2-58, y+26, 116, 28, 14, fill=(14,24,44))
    return (x+12, y+12, w-24, h-24)

ITEMS=[("Mjólk 1 l ×2",398,"Matur"),("Heimilisbrauð",489,"Matur"),("Bananar",312,"Matur"),("Kjúklingabringur",2390,"Matur"),
       ("Ostur 26%",1149,"Matur"),("Egg 10 stk",799,"Matur"),("Kaffi 500 g",1129,"Drykkir"),("Uppþvottatöflur",1395,"Hreinlæti")]
TOTAL=sum(p for _,p,_ in ITEMS)
MONTH=[("Matur",96200),("Heimili",31800),("Samgöngur",28400),("Veitingar & kaffihús",18900),("Hreinlæti",12100)]
MTOT=sum(v for _,v in MONTH)

def receipt_img(w=300, rot=-5, scale=1.0):
    lh=30; h=150+len(ITEMS)*lh+118
    im = Image.new("RGBA", (int(w*S*scale), int(h*S*scale)), (0,0,0,0)); d = ImageDraw.Draw(im); k=S*scale
    d.rectangle([0,0,w*k,h*k], fill=(252,252,249,255))
    # zigzag bottom
    z=12
    for i in range(0, w, z*2):
        d.polygon([(i*k,h*k),((i+z)*k,(h-z)*k),((i+2*z)*k,h*k)], fill=(0,0,0,0))
    fb=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", int(19*k)); fm=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", int(14.5*k)); fs=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", int(12*k))
    ink=(40,44,52,255)
    d.text((w*k/2, 30*k), "MATVÖRUBÚÐIN", font=fb, fill=ink, anchor="mm")
    d.text((w*k/2, 56*k), "Sýnidæmi · 7.11.2026 17:42", font=fs, fill=(110,116,128,255), anchor="mm")
    d.line([(18*k,78*k),((w-18)*k,78*k)], fill=(170,174,182,255), width=int(1.2*k))
    y=96
    for n,p,_ in ITEMS:
        d.text((18*k, y*k), n.upper()[:20], font=fm, fill=ink)
        d.text(((w-18)*k, y*k), f"{p:,}".replace(",", "."), font=fm, fill=ink, anchor="ra"); y+=lh
    d.line([(18*k,(y+6)*k),((w-18)*k,(y+6)*k)], fill=(170,174,182,255), width=int(1.2*k))
    d.text((18*k,(y+22)*k), "SAMTALS", font=fb, fill=ink); d.text(((w-18)*k,(y+22)*k), f"{TOTAL:,}".replace(",", "."), font=fb, fill=ink, anchor="ra")
    d.text((w*k/2,(y+78)*k), "Takk fyrir viðskiptin", font=fs, fill=(110,116,128,255), anchor="mm")
    return im.rotate(rot, expand=True, resample=Image.BICUBIC) if rot else im

def footer_cta(c, y, h, text="Frítt á tossalisti.is"):
    c.rect(0, y, c.w, h, NAVY)
    f=F("pb", 40); wd=c.tw(text, f)
    c.rr(c.w/2-wd/2-44, y+h/2-44, wd+88, 88, 44, fill=GOLD)
    c.t(c.w/2, y+h/2+1, text, f, INK, "mm")

# ---------- Slide 1 ----------
def slide1(path):
    c=C(1080,1350,NAVY); logo(c,72,64)
    y=c.wrap(72,160,"Veistu hvað þú eyddir í mat í síðasta mánuði?",F("pb",70),WHITE,940,86)
    c.wrap(72,y+30,"Taktu mynd af kvittuninni. Tossalisti sér um rest.",F("lr",36),(205,217,238),900,48)
    px,py,pw,ph=280,520,520,1000
    sx,sy,sw,sh=phone(c,px,py,pw,ph,screen=(30,34,42))
    r=receipt_img(300,-4,1.0); c.paste(r, sx+sw/2-r.width/S/2, sy+104)
    # scan brackets
    bx,by,bw,bh=sx+44,sy+84,sw-88,560; L=46
    for (cx,cy,dx,dy) in [(bx,by,1,1),(bx+bw,by,-1,1),(bx,by+bh,1,-1),(bx+bw,by+bh,-1,-1)]:
        c.line([(cx+dx*L,cy),(cx,cy),(cx,cy+dy*L)],GOLD,6)
    f=F("ls",22); tx="Haltu kvittuninni innan rammans"; wd=c.tw(tx,f)
    c.rr(sx+sw/2-wd/2-18, sy+664, wd+36, 44, 22, fill=(0,0,0)); c.t(sx+sw/2, sy+686, tx, f, WHITE, "mm")
    c.circ(sx+sw/2, sy+770, 44, outline=WHITE, width=5); c.circ(sx+sw/2, sy+770, 33, fill=WHITE)
    c.save(path)

# ---------- Slide 2 ----------
def slide2(path):
    c=C(1080,1350,BG); logo(c,72,64,dark_bg=False)
    y=c.wrap(72,160,"Hver lína lesin og flokkuð sjálfkrafa",F("pb",70),NAVY,940,86)
    c.wrap(72,y+30,"Verslun, dagsetning, vörur og verð á nokkrum sekúndum.",F("lr",36),MUTED,900,48)
    px,py,pw,ph=260,470,560,1040
    sx,sy,sw,sh=phone(c,px,py,pw,ph)
    c.rr(sx,sy,sw,118,46,fill=NAVY); c.rect(sx,sy+60,sw,58,NAVY)
    c.t(sx+28,sy+82,"Kvittun",F("pb",28),WHITE,"lm")
    f=F("ls",17); tx="Lesið með gervigreind"; wd=c.tw(tx,f); c.rr(sx+sw-wd-52,sy+66,wd+28,32,16,fill=(255,255,255,)); c.t(sx+sw-38-wd/2,sy+82,tx,f,NAVY,"mm")
    cy=sy+136
    c.rr(sx+18,cy,sw-36,84,16,fill=WHITE,outline=LINE,width=1.5)
    c.t(sx+38,cy+28,"Matvörubúðin",F("lb",25),NAVY,"lm"); c.t(sx+38,cy+58,"7. nóvember 2026",F("lr",19),MUTED,"lm")
    c.t(sx+sw-38,cy+42,f"{len(ITEMS)} vörur",F("lm",19),FAINT,"rm")
    cy+=100; rh=58
    c.rr(sx+18,cy,sw-36,rh*len(ITEMS)+70,16,fill=WHITE,outline=LINE,width=1.5)
    for i,(n,p,cat) in enumerate(ITEMS):
        ry=cy+i*rh
        if i: c.rect(sx+34,ry,sw-68,1.2,LINE)
        c.t(sx+38,ry+rh/2,n,F("lm",22),NAVY,"lm")
        fc=F("lm",15.5); cw=c.tw(cat,fc); cx=sx+sw-150-cw
        c.rr(cx-26,ry+rh/2-14,cw+40,28,14,fill=CHIP); c.circ(cx-12,ry+rh/2,5,fill=CAT[cat]); c.t(cx,ry+rh/2,cat,fc,MUTED,"lm")
        c.t(sx+sw-38,ry+rh/2,kr(p),F("lb",21),NAVY,"rm")
    ty=cy+rh*len(ITEMS)
    c.rect(sx+18,ty,sw-36,2,LINE)
    c.t(sx+38,ty+36,"Samtals",F("lb",24),NAVY,"lm"); c.t(sx+sw-38,ty+36,kr(TOTAL),F("pb",26),NAVY,"rm")
    by=ty+92
    c.rr(sx+18,by,sw-36,64,16,fill=GOLD); c.t(sx+sw/2,by+32,"Vista í bókhaldið",F("lb",24),INK,"mm")
    c.save(path)

# ---------- Slide 3 ----------
def month_card(c, sx, cy, sw, compact=False):
    c.rr(sx+18,cy,sw-36,196,18,fill=WHITE,outline=LINE,width=1.5)
    c.t(sx+40,cy+34,"Október 2026",F("lm",20),MUTED,"lm")
    c.t(sx+40,cy+86,kr(MTOT),F("pb",50),NAVY,"lm")
    c.t(sx+40,cy+134,"23 kvittanir · 6 verslanir",F("lr",19),MUTED,"lm")
    bx=sx+40; bw=sw-80; x=bx
    for i,(n,v) in enumerate(MONTH):
        w_=bw*v/MTOT
        c.rr(x,cy+160,w_-3,14,7,fill=CAT[n]); x+=w_
    cy+=214; rh=74
    c.rr(sx+18,cy,sw-36,rh*len(MONTH),18,fill=WHITE,outline=LINE,width=1.5)
    for i,(n,v) in enumerate(MONTH):
        ry=cy+i*rh
        if i: c.rect(sx+34,ry,sw-68,1.2,LINE)
        c.circ(sx+52,ry+26,9,fill=CAT[n]); c.t(sx+74,ry+26,n,F("lm",22),NAVY,"lm")
        c.t(sx+sw-40,ry+26,kr(v),F("lb",22),NAVY,"rm")
        c.rr(sx+40,ry+50,sw-80,8,4,fill=CHIP); c.rr(sx+40,ry+50,(sw-80)*v/MONTH[0][1],8,4,fill=CAT[n])
    return cy+rh*len(MONTH)

def slide3(path):
    c=C(1080,1350,BG); logo(c,72,64,dark_bg=False)
    y=c.wrap(72,160,"Og þú sérð hvert peningarnir fara",F("pb",70),NAVY,940,86)
    c.wrap(72,y+30,"Heimilisbókhald sem fyllir sig sjálft.",F("lr",36),MUTED,900,48)
    px,py,pw,ph=260,450,560,1040
    sx,sy,sw,sh=phone(c,px,py,pw,ph)
    c.rr(sx,sy,sw,118,46,fill=NAVY); c.rect(sx,sy+60,sw,58,NAVY)
    c.t(sx+28,sy+82,"Útgjöld",F("pb",28),WHITE,"lm")
    month_card(c,sx,sy+136,sw)
    footer_cta(c,1200,150)
    c.save(path)

# ---------- Stök mynd 1080x1080 ----------
def single(path):
    c=C(1080,1080,NAVY); logo(c,64,56)
    c.t(64,150,"Kvittun inn.",F("pb",76),WHITE); c.t(64,238,"Heimilisbókhald út.",F("pb",76),GOLD)
    c.t(64,348,"Taktu mynd af kvittuninni og sjáðu hvert peningarnir fara.",F("lr",31),(205,217,238))
    r=receipt_img(300,-6,0.92); c.shadow(86,452,270,400,6,blur=26,alpha=110); c.paste(r,70,432)
    # arrow
    ax=430; ay=650
    c.line([(ax,ay),(ax+70,ay)],GOLD,9); c.line([(ax+44,ay-26),(ax+72,ay),(ax+44,ay+26)],GOLD,9)
    # card
    x0,y0,w0=540,430,476
    c.shadow(x0,y0,w0,470,24,blur=30,alpha=120); c.rr(x0,y0,w0,470,24,fill=BG)
    c.t(x0+30,y0+38,"Október 2026",F("lm",20),MUTED,"lm"); c.t(x0+30,y0+90,kr(MTOT),F("pb",50),NAVY,"lm")
    x=x0+30; bw=w0-60
    for n,v in MONTH:
        w_=bw*v/MTOT; c.rr(x,y0+130,w_-3,14,7,fill=CAT[n]); x+=w_
    for i,(n,v) in enumerate(MONTH):
        ry=y0+166+i*58
        c.circ(x0+40,ry+22,8,fill=CAT[n]); c.t(x0+60,ry+22,n,F("lm",21),NAVY,"lm"); c.t(x0+w0-30,ry+22,kr(v),F("lb",21),NAVY,"rm")
        if i<len(MONTH)-1: c.rect(x0+30,ry+50,w0-60,1.2,LINE)
    f=F("pb",38); tx="Frítt á tossalisti.is"; wd=c.tw(tx,f)
    c.rr(540-wd/2-44,946,wd+88,84,42,fill=GOLD); c.t(540,989,tx,f,INK,"mm")
    c.save(path)

slide1("tossalisti-kvittun-1.png"); slide2("tossalisti-kvittun-2.png"); slide3("tossalisti-kvittun-3.png"); single("tossalisti-kvittun-stok.png")
print("ok", TOTAL, MTOT)
