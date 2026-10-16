# Gæsin í portrett með talblöðru. Keyra: python3 gera.py  → gaes-talblodrur/*.png
from PIL import Image, ImageDraw, ImageFont
import os, sys
HERE=os.path.dirname(os.path.abspath(__file__))
SRC=os.path.join(HERE,'..','griptu-site','mascot-gaes.png')
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
REG='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
NAVY=(21,49,94,255); GOLD=(245,166,35,255); WHITE=(255,255,255,255); BG=(245,247,251,255); LINE=(21,49,94,255)

def wrap(d,text,font,maxw):
    out=[]
    for para in text.split('\n'):
        cur=''
        for w in para.split():
            t=(cur+' '+w).strip()
            if d.textlength(t,font=font)<=maxw: cur=t
            else:
                if cur: out.append(cur)
                cur=w
        out.append(cur)
    return out

def bez(p0,p1,p2,n=24):
    return [((1-t)**2*p0[0]+2*(1-t)*t*p1[0]+t*t*p2[0], (1-t)**2*p0[1]+2*(1-t)*t*p1[1]+t*t*p2[1]) for t in [i/n for i in range(n+1)]]

def make(text, out, W=1080, H=1350, small=None, style='white', web=False):
    # web=True: gegnsær bakgrunnur, gæsin óskorin, ekkert orðmerki — rennur saman við vefsíðuna
    if web: W=1360
    from PIL import ImageFilter
    S=2
    goose=Image.open(SRC).convert('RGBA')
    img=Image.new('RGBA',(W,H),(0,0,0,0) if web else BG)
    # Gæsin vinstra megin, stór; blaðran hægra megin við hausinn — halinn kemur úr goggnum.
    gh=int(H*0.76); gw=int(goose.width*gh/goose.height)
    goose_r=goose.resize((gw,gh),Image.LANCZOS)
    gx=0 if web else -int(gw*0.14); gy=H-gh-28
    img.paste(goose_r,(gx,gy),goose_r)
    beak=(gx+int(gw*0.805), gy+int(gh*0.13))   # goggurinn (hægra megin á hausnum)
    big=Image.new('RGBA',(W*S,H*S),(0,0,0,0))
    d=ImageDraw.Draw(big)
    tf=ImageFont.truetype(BOLD,50*S)
    padx,pady=44*S,36*S
    x0=(beak[0]+70)*S; x1=(W-40)*S
    maxw=(x1-x0)-2*padx
    lines=wrap(d,text.replace('\n',' '),tf,maxw)
    lh=int(tf.size*1.18)
    tw=max(d.textlength(l,font=tf) for l in lines)
    bw=int(tw+2*padx); bh=int(len(lines)*lh+2*pady)
    x1=x0+bw
    # lóðrétt: blaðran OFAR — neðri brún vel fyrir ofan gogginn
    y1=beak[1]*S - 90*S; y0=max(50*S, y1-bh); y1=y0+bh
    fill = WHITE if style=='white' else NAVY
    ink  = NAVY if style=='white' else WHITE
    # hali: úr neðri vinstri brún blöðrunnar NIÐUR að goggnum, speglaður bogi (kúpt upp/vinstri)
    bk=(beak[0]*S, beak[1]*S)
    a=(x0+36*S, y1-6*S); b=(x0+130*S, y1-6*S)
    c1=(x0-20*S, y1+40*S); c2=(x0+60*S, y1+60*S)
    tail=bez(a,c1,bk)+bez(bk,c2,b)[1:]
    sh=Image.new('RGBA',big.size,(0,0,0,0)); sd=ImageDraw.Draw(sh)
    sd.rounded_rectangle([x0,y0+10*S,x1,y1+10*S],radius=44*S,fill=(21,49,94,70))
    sd.polygon([(x,y+10*S) for x,y in tail],fill=(21,49,94,70))
    sh=sh.filter(ImageFilter.GaussianBlur(26*S))
    big.alpha_composite(sh)
    d.polygon(tail,fill=fill)
    d.rounded_rectangle([x0,y0,x1,y1],radius=44*S,fill=fill)
    ty=y0+pady
    for l in lines:
        d.text((x0+padx,ty),l,font=tf,fill=ink); ty+=lh
    big=big.resize((W,H),Image.LANCZOS)
    img.alpha_composite(big)
    if web:
        bbox=img.getbbox(); img=img.crop((max(0,bbox[0]-10),max(0,bbox[1]-10),min(W,bbox[2]+10),min(H,bbox[3]+10)))
        img.save(out,optimize=True); print('→',out); return
    d=ImageDraw.Draw(img)
    wf=ImageFont.truetype(BOLD,64)
    ww=d.textlength('Gríptu',font=wf)
    d.text((W-56-ww-30,H-110),'Gríptu',font=wf,fill=NAVY)
    d.ellipse([W-56-20,H-110+44,W-56,H-110+64],fill=GOLD)
    img.convert('RGB').save(out,quality=92)
    print('→',out)

TEXTS=[
  ('01-ai-gaes', 'Ég er ekki alvöru gæs.\nÉg er AI-gæs.\nGais.'),
  ('02-kvittun', 'Skannaðu kvittunina.\nÉg sé um rest.\nGa.'),
  ('03-til-baka', 'Þú kaupir Cheerios\nhvort eð er.\nFáðu þá eitthvað til baka.'),
  ('04-bonus-kronan', 'Bónus, Krónan, Nettó…\nMér er alveg sama hvar.\nBara skannaðu.'),
  ('05-listi', 'Settu það á listann.\nÉg man það fyrir þig.\nÉg er gæs — ég man allt.'),
  ('06-abyrgd', 'Þvottavélin bilaði?\nÉg geymdi kvittunina.\nGa-ga.'),
  ('07-gjafabref', 'Ég breyti kvittunum\ní gjafabréf.\nSpyrðu ekki hvernig.'),
  ('08-radd', 'Segðu „taco fyrir sex“.\nÉg skrifa listann.\nÞú kaupir skeljarnar.'),
]
if __name__=='__main__':
    only = sys.argv[1] if len(sys.argv)>1 else None
    for name,t in TEXTS:
        if only and not name.startswith(only): continue
        make(t, os.path.join(HERE,name+'.jpg'), style='white')
        make(t, os.path.join(HERE,'navy-'+name+'.jpg'), style='navy')
        make(t, os.path.join(HERE,'..','public','griptu','tal',name+'.png'), style='white', web=True)
