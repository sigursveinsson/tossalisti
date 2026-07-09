from PIL import Image, ImageDraw, ImageFont
import numpy as np
BOLD="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
NAVY=(21,49,94); WHITE=(255,255,255)
src=Image.open("Hlaupandi gæs.png").convert("RGB")
W0,H0=src.size
gl=src.convert("L").copy()
for s in [(0,0),(W0-1,0),(0,H0-1),(W0-1,H0-1)]:
    ImageDraw.floodfill(gl,s,0,thresh=14)
mask=(np.array(gl)!=0)
print("goose frac",round(float(mask.mean()),3))
ys,xs=np.where(mask); x0,x1,y0,y1=xs.min(),xs.max(),ys.min(),ys.max()
mimg=Image.fromarray((mask*255).astype('uint8'),'L')
real=src.crop((x0,y0,x1+1,y1+1)); mc=mimg.crop((x0,y0,x1+1,y1+1))
gw,gh=real.size
realrgba=real.convert("RGBA"); realrgba.putalpha(mc)
sil=Image.composite(Image.new("RGBA",(gw,gh),NAVY+(255,)),Image.new("RGBA",(gw,gh),(0,0,0,0)),mc)
def banner(g,out):
    TH=560; sc=TH/gh; gw2=int(gw*sc); g2=g.resize((gw2,TH),Image.LANCZOS)
    font=ImageFont.truetype(BOLD,300); t=ImageDraw.Draw(Image.new("RGB",(9,9)))
    tb=t.textbbox((0,0),"Gríptu",font=font); tw=tb[2]-tb[0]; th=tb[3]-tb[1]
    px,py,gap=70,60,-10; Wc=px+tw+gap+gw2+px; Hc=max(th,TH)+2*py
    c=Image.new("RGBA",(Wc,Hc),WHITE+(255,)); d=ImageDraw.Draw(c)
    d.text((px,(Hc-th)//2-tb[1]),"Gríptu",font=font,fill=NAVY)
    c.alpha_composite(g2,(px+tw+gap,(Hc-TH)//2-10)); c.convert("RGB").save(out,"PNG")
banner(realrgba,"griptu-hlaup-raunveruleg.png")
banner(sil,"griptu-hlaup-blasilhouette.png")
print("done",gw,gh)
