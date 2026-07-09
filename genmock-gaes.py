from PIL import Image, ImageDraw, ImageFont
DEJA="/usr/share/fonts/truetype/dejavu/"
BOLD=DEJA+"DejaVuSans-Bold.ttf"
src=Image.open("Gæs.png").convert("RGBA")
W,H=src.size
EXTRA=210
NAVY=(21,49,94,255); BLACK=(23,23,23,255); WHITE=(255,255,255,255)

def wrap(d,text,font,maxw):
    words=text.split(); lines=[]; cur=""
    for w in words:
        t=(cur+" "+w).strip()
        if d.textlength(t,font=font)<=maxw: cur=t
        else:
            if cur: lines.append(cur)
            cur=w
    if cur: lines.append(cur)
    return lines

def make(text,out):
    img=Image.new("RGBA",(W,H+EXTRA),WHITE); img.paste(src,(0,0),src)
    d=ImageDraw.Draw(img)
    d.rectangle([760,0,W,338],fill=WHITE)          # cover old bubble+tail
    tf=ImageFont.truetype(BOLD,56)
    lines=wrap(d,text,tf,470)
    lh=int(tf.size*1.2)
    tw=max(d.textlength(l,font=tf) for l in lines)
    padx,pady=46,34
    bw=int(tw+2*padx); bh=int(len(lines)*lh+2*pady)
    x0=815; y0=46; x1=x0+bw; y1=y0+bh
    apex=(742,190); b1=(x0+46,y1-6); b2=(x0+120,y1-6)
    d.polygon([apex,b1,b2],fill=WHITE)
    d.line([apex,b1],fill=BLACK,width=8); d.line([apex,b2],fill=BLACK,width=8)
    d.rounded_rectangle([x0,y0,x1,y1],radius=34,fill=WHITE,outline=BLACK,width=8)
    ty=y0+pady
    for l in lines:
        w=d.textlength(l,font=tf); d.text((x0+(bw-w)/2,ty),l,font=tf,fill=BLACK); ty+=lh
    wf=ImageFont.truetype(BOLD,118)
    word="Gríptu"; ww=d.textlength(word,font=wf)
    d.text(((W-ww)/2,H+22),word,font=wf,fill=NAVY)
    img.convert("RGB").save(out,"PNG"); print("saved",out,"lines",len(lines))

make("Gríptu mig!","griptu-gaes-1.png")
make("Egils Appelsín fyrir öll! Gríptu!","griptu-gaes-2.png")
make("Páskaegg! Gríptu!","griptu-gaes-3.png")
make("Gríptu eitthvað á grillið. Ekki mig samt!","griptu-gaes-4.png")
