from PIL import Image, ImageDraw, ImageFont

DEJA = "/usr/share/fonts/truetype/dejavu/"
def F(name, size): return ImageFont.truetype(DEJA+name, size)
SANS = "DejaVuSans.ttf"; SANSB = "DejaVuSans-Bold.ttf"; SERIFB = "DejaVuSerif-Bold.ttf"

NAVY=(21,49,94); NAVY2=(26,43,69); GOLD=(245,166,35); GREEN=(46,211,164)
MUTED=(120,138,160); MUTED_L=(170,186,210); LINE=(228,232,240); TRACK=(226,231,240)
WHITE=(255,255,255)

def rr(d, box, r, fill): d.rounded_rectangle(box, radius=r, fill=fill)

def center(d, cx, y, text, font, fill):
    w = d.textlength(text, font=font); d.text((cx-w/2, y), text, font=font, fill=fill)

def draw_phone(base, x, y, w, h, screen_fn, body=NAVY2):
    phone = Image.new('RGBA',(w,h),(0,0,0,0)); pd=ImageDraw.Draw(phone)
    body_r=48
    pd.rounded_rectangle([0,0,w,h], radius=body_r, fill=body+(255,))
    inset=9; sw,sh=w-2*inset,h-2*inset; screen_r=body_r-inset
    screen=Image.new('RGBA',(sw,sh),WHITE+(255,)); sd=ImageDraw.Draw(screen)
    screen_fn(screen, sd, sw, sh)
    mask=Image.new('L',(sw,sh),0)
    ImageDraw.Draw(mask).rounded_rectangle([0,0,sw,sh], radius=screen_r, fill=255)
    phone.paste(screen,(inset,inset),mask)
    base.alpha_composite(phone,(x,y))

# ---------- screen: shopping list ----------
def screen_list(img,d,sw,sh):
    hh=66
    d.rectangle([0,0,sw,hh], fill=NAVY)
    # triangle
    tx,ty=20,24; d.polygon([(tx,ty+16),(tx+9,ty),(tx+18,ty+16)], fill=GOLD)
    d.text((46,20),"Vikuinnkaup",font=F(SANSB,22),fill=WHITE)
    tw=d.textlength("Vikuinnkaup",font=F(SANSB,22))
    d.text((46+tw+8,26),"6 eftir",font=F(SANS,13),fill=(200,214,235))
    items=[("Mjólk","Mjólkurvörur",(46,196,150)),("Bananar","Ávextir",(245,166,35)),
           ("Kjúklingur","Kjöt",(232,97,90)),("Klósettpappír","Heimili",(150,95,60)),
           ("Egils Appelsín","Drykkir",(43,127,196)),("Brauð","Bakkelsi",(224,163,90))]
    y=hh+22
    for name,sub,col in items:
        cy=y+18
        d.ellipse([26,cy-13,52,cy+13], outline=(150,160,175), width=3)  # checkbox
        d.rounded_rectangle([64,cy-14,92,cy+14], radius=7, fill=col)
        d.text((104,cy-16),name,font=F(SANSB,18),fill=NAVY)
        d.text((104,cy+4),sub,font=F(SANS,12),fill=MUTED)
        y+=52

# ---------- screen: budget ----------
def screen_budget(img,d,sw,sh):
    hh=66
    d.rectangle([0,0,sw,hh], fill=NAVY)
    d.text((20,14),"Bókhald",font=F(SANSB,22),fill=WHITE)
    d.text((20,42),"Útgjöld í júlí",font=F(SANS,12),fill=(200,214,235))
    tot="84.900 kr"; tw=d.textlength(tot,font=F(SANSB,20)); d.text((sw-20-tw,22),tot,font=F(SANSB,20),fill=GOLD)
    cats=[("Matur",0.82,(245,166,35)),("Drykkir",0.55,(43,127,196)),
          ("Heimili",0.42,(150,60,92)),("Hreinlæti",0.30,(46,180,120)),
          ("Samgöngur",0.20,(90,170,90))]
    y=hh+24
    for name,frac,col in cats:
        d.text((22,y),name,font=F(SANSB,16),fill=NAVY)
        by=y+26
        rr(d,[22,by,sw-22,by+14],7,TRACK)
        rr(d,[22,by,22+int((sw-44)*frac),by+14],7,col)
        y+=58

# ---------- screen: griptu cashback ----------
def screen_griptu(img,d,sw,sh):
    hh=66
    d.rectangle([0,0,sw,hh], fill=NAVY)
    d.text((22,18),"Gríptu",font=F(SANSB,24),fill=GOLD)
    # navy card
    cx0,cy0,cx1,cy1=18,hh+16,sw-18,hh+16+120
    rr(d,[cx0,cy0,cx1,cy1],16,NAVY)
    center(d,(cx0+cx1)/2,cy0+18,"450 kr",F(SANSB,46),GOLD)
    center(d,(cx0+cx1)/2,cy0+82,"safnað cashback",F(SANS,14),(200,214,235))
    d.text((22,cy1+18),"Áunnið",font=F(SANS,13),fill=MUTED)
    rows=[("Egils Appelsín","+30 kr"),("Egils Malt","+30 kr"),("Pepsi Max","+30 kr"),("Collab","+30 kr")]
    y=cy1+44
    for name,val in rows:
        d.text((22,y),name,font=F(SANSB,16),fill=NAVY)
        vw=d.textlength(val,font=F(SANSB,16)); d.text((sw-22-vw,y),val,font=F(SANSB,16),fill=(30,170,120))
        d.line([22,y+30,sw-22,y+30],fill=LINE,width=1)
        y+=48

def gold_kicker(d,x,y,label,fill_lbl):
    rr(d,[x,y,x+38,y+38],9,GOLD)
    d.text((x+52,y+8),label,font=F(SANSB,20),fill=GOLD)

# ============ SLIDE 2 (intro1) ============
W,H=1600,900
img=Image.new('RGBA',(W,H),WHITE+(255,)); d=ImageDraw.Draw(img)
gold_kicker(d,80,70,"HVAÐ ER TOSSALISTI",GOLD)
d.text((78,116),"Allt heimilið á einum stað — á íslensku",font=F(SERIFB,50),fill=NAVY)
pw,ph,py=295,595,238
xs=[175,653,1131]
draw_phone(img,xs[0],py,pw,ph,screen_list)
draw_phone(img,xs[1],py,pw,ph,screen_budget)
draw_phone(img,xs[2],py,pw,ph,screen_griptu)
labels=["Innkaupalistar","Bókhald","Cashback"]
for x,lb in zip(xs,labels):
    center(d,x+pw/2,py+ph+18,lb,F(SANSB,22),NAVY)
img.convert('RGB').save('/tmp/intro1.png','PNG')

# ============ SLIDE 3 (intro2) ============
img2=Image.new('RGBA',(W,H),NAVY+(255,)); d2=ImageDraw.Draw(img2)
gold_kicker(d2,80,70,"FYRIR NOTANDANN",GOLD)
d2.text((78,116),"Það sem notendur fá",font=F(SERIFB,50),fill=WHITE)
feats=[("Sjáðu hvert peningarnir fara","Skannaðu kvittanir — appið flokkar útgjöldin sjálfkrafa."),
       ("Fáðu cashback á vörurnar","Verðlaun frá vörumerkjum fyrir það sem þú kaupir hvort eð er."),
       ("Deildu með fjölskyldunni","Sameiginlegir listar sem uppfærast hjá öllum í rauntíma."),
       ("Íslenskt og frítt","Íslenskar vörur, íslenskar verslanir, engin gjöld.")]
y=250
for title,sub in feats:
    # green check
    d2.ellipse([98,y,134,y+36],fill=GREEN)
    d2.line([107,y+18,115,y+26],fill=WHITE,width=4)
    d2.line([115,y+26,127,y+11],fill=WHITE,width=4)
    d2.text((162,y-2),title,font=F(SANSB,26),fill=WHITE)
    d2.text((162,y+32),sub,font=F(SANS,15),fill=MUTED_L)
    y+=140
draw_phone(img2,1185,225,300,640,screen_griptu)
img2.convert('RGB').save('/tmp/intro2.png','PNG')
print("done")
