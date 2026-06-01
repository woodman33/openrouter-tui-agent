"""Quiet Topology — diagram library & page templates (built atop engine.py)."""
import math, random
from engine import *

# ---------------------------------------------------------------- finishing
def finish(c):
    img = c.finalize()
    img = paper_texture(img)
    img = vignette(img)
    return img

CW = W - 2*MARGIN          # content width
CX0 = MARGIN + 12          # content left
CX1 = W - MARGIN - 12      # content right

# ---------------------------------------------------------------- title head
def title_head(c, kick, title, accent, roman=None, sub=None):
    if roman:
        c.text(CX1, MARGIN+34, roman, "dmmono", 13, accent, anchor="ra", tracking=1.5)
    kicker(c, CX0, MARGIN+34, kick, accent)
    c.text(CX0, MARGIN+56, title, "display", 50, INK)
    tw = c.measure(title, "display", 50)
    c.seg(CX0, MARGIN+126, CX0+min(tw, 420), MARGIN+126, accent, 1.2)
    if sub:
        c.text(CX0, MARGIN+136, sub, "serifi", 15, GREY)

# ---------------------------------------------------------------- stat band
def stat_band(c, stats, accent, y=None):
    if y is None: y = H - MARGIN - 86
    c.seg(CX0, y, CX1, y, HAIR, 0.9)
    step = CW / len(stats)
    for i,(lab,val) in enumerate(stats):
        x = CX0 + i*step
        c.dot(x+3, y+16, 2.2, accent)
        c.text(x+12, y+11, lab, "mono", 9.5, GREY, tracking=2.0)
        c.text(x, y+30, val, "serifb", 14.5, INK)

# ---------------------------------------------------------------- body block
def body_block(c, x, y, label, text, accent, width=520, size=15.5, leading=1.5):
    c.text(x, y, label, "mono", 11, accent, tracking=3.0)
    c.seg(x, y+16, x+34, y+16, accent, 1.0)
    return c.paragraph(x, y+30, text, "serif", size, INK_SOFT,
                       width=width, leading=leading, align="j")

# ---------------------------------------------------------------- object cards
def object_cards(c, x, y, label, items, accent, width=290, n=None):
    c.text(x, y, label, "mono", 11, accent, tracking=3.0)
    yy = y+26
    for nm, sub in items:
        c.rect(x, yy, width, 46, outline=HAIR, width=0.9)
        c.dot(x+16, yy+23, 3.0, accent)
        c.text(x+30, yy+12, nm, "serifb", 14, INK)
        c.text(x+30, yy+29, sub, "dmmono", 10.5, GREY)
        yy += 56
    return yy

# ---------------------------------------------------------------- flow schematic
def schematic_flow(c, y, stages, accent, r=28, lab_size=9.5):
    x0, x1 = MARGIN+58, W-MARGIN-58
    n = len(stages)
    xs = [x0 + (x1-x0)*i/(n-1) for i in range(n)]
    for i in range(n-1):
        c.line([(xs[i]+r+4, y),(xs[i+1]-r-4, y)], INK_SOFT, 1.0)
        mx = (xs[i]+xs[i+1])/2
        c.poly([(mx-4,y-4),(mx+4,y),(mx-4,y+4)], fill=accent)
    for i,s in enumerate(xs):
        c.circle(s, y, r, outline=INK, width=1.2, fill=PAPER)
        c.dot(s, y, 3.6, accent)
        c.text(s, y-r-16, f"{i:02d}", "dmmono", 9.5, GREY, anchor="ma")
        for li,line in enumerate(stages[i].split("\n")):
            c.text(s, y+r+12+li*14, line, "mono", lab_size, INK_SOFT,
                   anchor="ma", tracking=0.8)
    return xs

# ---------------------------------------------------------------- layer stack
def layer_stack(c, x, y, w, layers, accent):
    """layers: list of (name, gloss). Drawn as stacked horizontal strata."""
    lh = 44
    for i,(nm, gloss) in enumerate(layers):
        yy = y + i*lh
        shade = tuple(int(p + (PAPER[k]-p)*(i/ max(1,len(layers)))*0.0) for k,p in enumerate(PAPER_D))
        c.rect(x, yy, w, lh-8, outline=HAIR, width=0.9, fill=PAPER_D)
        c.seg(x, yy, x+5, yy, accent, 2.4)
        c.text(x+18, yy+(lh-8)/2, nm, "serifb", 13.5, INK, anchor="lm")
        c.text(x+w-12, yy+(lh-8)/2, gloss, "mono", 10, GREY, anchor="rm", tracking=0.6)
    return y + len(layers)*lh

# ---------------------------------------------------------------- mini icons
def _icon(c, x, y, r, kind, accent):
    if kind=="plus":
        c.seg(x-r,y,x+r,y,INK_SOFT,1.2); c.seg(x,y-r,x,y+r,INK_SOFT,1.2)
    elif kind=="ring":
        c.circle(x,y,r,outline=INK_SOFT,width=1.2); c.dot(x,y,2.2,accent)
    elif kind=="arrow":
        c.seg(x-r,y,x+r-3,y,INK_SOFT,1.2)
        c.poly([(x+r-6,y-4),(x+r,y),(x+r-6,y+4)],fill=accent)
    elif kind=="doc":
        c.rect(x-r*0.7,y-r,r*1.4,r*2,outline=INK_SOFT,width=1.1)
        for k in range(3): c.seg(x-r*0.4,y-r*0.4+k*6,x+r*0.4,y-r*0.4+k*6,GREY,0.9)
    elif kind=="stack":
        for k in range(3):
            c.rect(x-r,y-r+ k*r*0.8, r*2, r*0.6, outline=INK_SOFT, width=1.0)
    elif kind=="branch":
        c.dot(x-r*0.6,y+r*0.6,2.6,INK_SOFT); c.dot(x+r*0.6,y-r*0.6,2.6,accent)
        c.dot(x-r*0.6,y-r*0.6,2.6,INK_SOFT)
        c.seg(x-r*0.6,y+r*0.6,x-r*0.6,y-r*0.6,INK_SOFT,1.1)
        c.line([(x-r*0.6,y-r*0.6),(x+r*0.6,y-r*0.6)],INK_SOFT,1.1)
    elif kind=="bolt":
        c.poly([(x-2,y-r),(x+r*0.5,y-2),(x,y-2),(x+2,y+r),(x-r*0.5,y+2),(x,y+2)],
               outline=accent, width=1.1)
    elif kind=="filter":
        c.poly([(x-r,y-r),(x+r,y-r),(x+r*0.3,y),(x+r*0.3,y+r),(x-r*0.3,y),(x-r*0.3,y)],
               outline=INK_SOFT,width=1.1)
    elif kind=="gear":
        c.circle(x,y,r*0.6,outline=INK_SOFT,width=1.1)
        for a in range(0,360,45):
            ar=math.radians(a)
            c.seg(x+r*0.6*math.cos(ar),y+r*0.6*math.sin(ar),
                  x+r*math.cos(ar),y+r*math.sin(ar),INK_SOFT,1.1)
    elif kind=="grid":
        for k in range(3):
            c.seg(x-r,y-r+k*r,x+r,y-r+k*r,INK_SOFT,0.9)
            c.seg(x-r+k*r,y-r,x-r+k*r,y+r,INK_SOFT,0.9)
    elif kind=="eye":
        c.arc(x,y+r*0.6,r,200,340,INK_SOFT,1.1); c.arc(x,y-r*0.6,r,20,160,INK_SOFT,1.1)
        c.dot(x,y,2.4,accent)
    elif kind=="layers":
        c.poly([(x,y-r),(x+r,y),(x,y+r*0.4),(x-r,y)],outline=INK_SOFT,width=1.0)
        c.poly([(x,y),(x+r,y+r*0.5),(x,y+r),(x-r,y+r*0.5)],outline=accent,width=1.0)
    elif kind=="cube":
        c.rect(x-r*0.7,y-r*0.5,r*1.4,r*1.2,outline=INK_SOFT,width=1.0)
        c.line([(x-r*0.7,y-r*0.5),(x-r*0.3,y-r),(x+r,y-r),(x+r*0.7,y-r*0.5)],INK_SOFT,1.0)
        c.line([(x+r,y-r),(x+r,y+r*0.4),(x+r*0.7,y+r*0.7)],INK_SOFT,1.0)
    elif kind=="hash":
        c.seg(x-r*0.4,y-r,x-r*0.6,y+r,INK_SOFT,1.1); c.seg(x+r*0.6,y-r,x+r*0.4,y+r,INK_SOFT,1.1)
        c.seg(x-r,y-r*0.4,x+r,y-r*0.4,INK_SOFT,1.1); c.seg(x-r,y+r*0.4,x+r,y+r*0.4,INK_SOFT,1.1)
    else:
        c.dot(x,y,3,accent)

def verbs_grid(c, x, y, w, label, verbs, accent, cols=3):
    """verbs: list of (icon_kind, NAME, gloss)."""
    c.text(x, y, label, "mono", 11, accent, tracking=3.0)
    gy = y+24
    cw = w/cols
    rh = 104
    for i,(kind,nm,gloss) in enumerate(verbs):
        cxx = x + (i%cols)*cw
        ry = gy + (i//cols)*rh
        c.rect(cxx, ry, cw-16, rh-16, outline=HAIR, width=0.8)
        _icon(c, cxx+30, ry+34, 12, kind, accent)
        c.text(cxx+54, ry+28, nm, "serifb", 13.5, INK)
        # wrap gloss to two lines
        c.paragraph(cxx+16, ry+58, gloss, "serif", 11.5, INK_SOFT,
                    width=cw-34, leading=1.32)
    rows = (len(verbs)+cols-1)//cols
    return gy + rows*rh

# ---------------------------------------------------------------- UI wireframe
def ui_wireframe(c, x, y, w, h, accent, kind="app"):
    """Abstract interface as art — panes only, no text noise."""
    c.rect(x, y, w, h, outline=INK_SOFT, width=1.1, fill=PAPER_D)
    pad=10
    if kind=="app":
        side=w*0.22
        c.rect(x+pad, y+pad, side-pad, h-2*pad, outline=HAIR, width=0.8)
        for k in range(6):
            c.seg(x+pad+10, y+pad+20+k*22, x+side-14, y+pad+20+k*22, GREY, 0.8)
        top=34
        c.rect(x+side+4, y+pad, w-side-2*pad, top, outline=HAIR, width=0.8)
        c.dot(x+side+18, y+pad+top/2, 3, accent)
        main_y=y+pad+top+8
        c.rect(x+side+4, main_y, (w-side-2*pad)*0.62, y+h-pad-main_y, outline=HAIR, width=0.8)
        c.rect(x+side+4+(w-side-2*pad)*0.66, main_y, (w-side-2*pad)*0.34,
               y+h-pad-main_y, outline=HAIR, width=0.8)
        for k in range(5):
            c.seg(x+side+18, main_y+18+k*26, x+side+4+(w-side-2*pad)*0.62-14,
                  main_y+18+k*26, GREY, 0.8)
    elif kind=="canvas":
        c.rect(x+pad, y+pad, w*0.18, h-2*pad, outline=HAIR, width=0.8)
        cvx=x+pad+w*0.18+10
        c.rect(cvx, y+pad+8, w-(w*0.18)-3*pad-8, h-2*pad-16, outline=HAIR, width=0.8)
        c.circle(cvx+90, y+h*0.4, 26, outline=accent, width=1.1)
        c.rect(cvx+150, y+h*0.5, 80, 50, outline=INK_SOFT, width=1.0)
        c.poly([(cvx+60,y+h*0.7),(cvx+110,y+h*0.62),(cvx+90,y+h*0.78)],outline=GREY,width=0.9)
    elif kind=="board":
        for k in range(4):
            cxx=x+pad+k*((w-2*pad)/4)
            c.rect(cxx, y+pad, (w-2*pad)/4-8, h-2*pad, outline=HAIR, width=0.8)
            for j in range(3):
                c.rect(cxx+8, y+pad+12+j*((h-2*pad)/3.3), (w-2*pad)/4-24,
                       (h-2*pad)/3.6-10, outline=GREY, width=0.7)
                if (k+j)%3==0: c.seg(cxx+8, y+pad+12+j*((h-2*pad)/3.3),
                                     cxx+8, y+pad+12+j*((h-2*pad)/3.3)+(h-2*pad)/3.6-10, accent, 2.0)

# ---------------------------------------------------------------- radial map
def radial_integrations(c, cx, cy, r, center, groups, accent):
    """groups: list of (category, [names]). Spokes by category sectors."""
    degree_ring(c, cx, cy, r+26, ticks=96, labels=False)
    total = sum(len(g[1]) for g in groups)
    idx = 0
    cat_angles=[]
    for gi,(cat, names) in enumerate(groups):
        for nm in names:
            a = math.radians(idx/total*360 - 90)
            x = cx + r*math.cos(a); y = cy + r*math.sin(a)
            c.line([(cx+22*math.cos(a), cy+22*math.sin(a)), (x,y)], HAIR, 0.8)
            c.circle(x,y,7,outline=INK,width=1.0,fill=PAPER); c.dot(x,y,2.0,accent)
            lx=cx+(r+18)*math.cos(a); ly=cy+(r+18)*math.sin(a)
            an = "lm" if math.cos(a)>=-0.01 else "rm"
            c.text(lx,ly,nm,"mono",9.5,INK_SOFT,anchor=an,tracking=0.6)
            if nm==names[len(names)//2]:
                cat_angles.append((cat,a))
            idx+=1
    # center
    c.circle(cx,cy,18,outline=INK,width=1.3,fill=PAPER)
    c.dot(cx,cy,8,accent)
    c.text(cx,cy+30,center,"mono",10,INK_SOFT,anchor="ma",tracking=1.5)

# ---------------------------------------------------------------- radar chart
def radar_chart(c, cx, cy, r, axes, values, accent, rings=4):
    n=len(axes)
    for k in range(1,rings+1):
        rr=r*k/rings
        pts=[(cx+rr*math.cos(math.radians(i/n*360-90)),
              cy+rr*math.sin(math.radians(i/n*360-90))) for i in range(n)]
        pts.append(pts[0])
        c.line(pts, GRID if k<rings else HAIR, 0.8)
    for i,ax in enumerate(axes):
        a=math.radians(i/n*360-90)
        x=cx+r*math.cos(a); y=cy+r*math.sin(a)
        c.seg(cx,cy,x,y,GRID,0.7)
        lx=cx+(r+24)*math.cos(a); ly=cy+(r+24)*math.sin(a)
        c.text(lx,ly,ax,"mono",10,INK_SOFT,anchor="mm",tracking=1.0)
    poly=[]
    for i,v in enumerate(values):
        a=math.radians(i/n*360-90); rr=r*v/10.0
        poly.append((cx+rr*math.cos(a), cy+rr*math.sin(a)))
    fillc=(accent[0],accent[1],accent[2],46)
    c.poly(poly+[poly[0]], fill=fillc)
    c.line(poly+[poly[0]], accent, 1.4)
    for p in poly: c.dot(p[0],p[1],3.0,accent)

# ---------------------------------------------------------------- sparkline
def sparkline(c, x, y, w, h, series, accent, label=None):
    if label: c.text(x, y-18, label, "mono", 10, GREY, tracking=2.0)
    c.rect(x, y, w, h, outline=HAIR, width=0.8)
    mn,mx=min(series),max(series)
    rng=(mx-mn) or 1
    pts=[(x+w*i/(len(series)-1), y+h-(h-8)*((v-mn)/rng)-4) for i,v in enumerate(series)]
    c.line(pts, accent, 1.3)
    c.dot(pts[-1][0],pts[-1][1],3.0,accent)

# ---------------------------------------------------------------- theme bars
def theme_bars(c, x, y, w, label, rows, accent):
    """rows: list of (theme, value0-100, sign +/-)."""
    c.text(x, y, label, "mono", 11, accent, tracking=3.0)
    yy=y+26
    for nm,val,sign in rows:
        col = accent if sign=="+" else GREY
        c.text(x, yy, nm, "serif", 13, INK_SOFT)
        bx=x+180; bw=w-180
        c.seg(bx, yy+8, bx+bw, yy+8, GRID, 3.0)
        c.seg(bx, yy+8, bx+bw*val/100, yy+8, col, 3.0)
        c.text(x+w, yy, f"{val:02d}", "dmmono", 11, GREY, anchor="ra")
        yy+=34
    return yy

# ---------------------------------------------------------------- pull quote
def pull_quote(c, x, y, w, quote, attrib, accent):
    c.text(x, y, "“", "display2", 56, accent)
    yend=c.paragraph(x+6, y+30, quote, "serifi", 18, INK, width=w, leading=1.42)
    c.seg(x+6, yend+10, x+46, yend+10, accent, 1.2)
    c.text(x+6, yend+18, attrib, "mono", 10.5, GREY, tracking=2.0)
    return yend+44

# ---------------------------------------------------------------- horizontal strata
def horizontal_strata(c, x, y, w, label, items, accent):
    """A wide segmented cross-section — lower-register anchor."""
    c.text(x, y, label, "mono", 11, accent, tracking=3.0)
    by = y+24; bh = 66
    n = len(items)
    seg = w/n
    for i,(nm,gloss) in enumerate(items):
        sx = x+i*seg
        c.rect(sx, by, seg, bh, outline=HAIR, width=0.9,
               fill=PAPER_D if i%2==0 else PAPER)
        c.seg(sx, by, sx, by+bh, accent if i==0 else HAIR, 2.0 if i==0 else 0.8)
        c.dot(sx+seg/2, by+18, 2.6, accent)
        c.text(sx+seg/2, by+30, nm, "serifb", 12.5, INK, anchor="ma")
        c.text(sx+seg/2, by+47, gloss, "mono", 9, GREY, anchor="ma", tracking=0.5)
        c.text(sx+8, by+10, f"{i:02d}", "dmmono", 8.5, GREY)
    # connecting flux arrows between segments
    for i in range(n-1):
        mx = x+(i+1)*seg
        c.poly([(mx-5,by+bh+9),(mx+5,by+bh+9),(mx,by+bh+15)], fill=GREY)
    return by+bh

# ---------------------------------------------------------------- cycle diagram
def cycle_diagram(c, cx, cy, r, label, nodes, accent):
    if label: c.text(cx, cy-r-40, label, "mono", 11, accent, anchor="ma", tracking=3.0)
    n=len(nodes)
    pos=[]
    for i in range(n):
        a=math.radians(i/n*360-90)
        pos.append((cx+r*math.cos(a), cy+r*math.sin(a)))
    for i in range(n):
        a0=pos[i]; a1=pos[(i+1)%n]
        ang=math.atan2(a1[1]-a0[1],a1[0]-a0[0])
        sx=a0[0]+26*math.cos(ang); sy=a0[1]+26*math.sin(ang)
        ex=a1[0]-30*math.cos(ang); ey=a1[1]-30*math.sin(ang)
        c.line([(sx,sy),(ex,ey)], HAIR, 1.0)
        c.poly([(ex-6*math.cos(ang-0.4),ey-6*math.sin(ang-0.4)),(ex,ey),
                (ex-6*math.cos(ang+0.4),ey-6*math.sin(ang+0.4))], fill=accent)
    for i,(x,y) in enumerate(pos):
        c.circle(x,y,24,outline=INK,width=1.2,fill=PAPER); c.dot(x,y,3.4,accent)
        c.text(x,y+38,nodes[i],"mono",9.5,INK_SOFT,anchor="ma",tracking=0.8)

# ---------------------------------------------------------------- adjacency matrix
def adjacency_matrix(c, x, y, names, edges, accent, cell=46):
    n=len(names)
    # column headers (rotated-ish: stacked short codes)
    for j,nm in enumerate(names):
        c.text(x+cell*(j+0.5), y-10, nm[:3], "dmmono", 9, INK_SOFT, anchor="mb", tracking=0.5)
    for i,nm in enumerate(names):
        ry=y+i*cell
        c.text(x-10, ry+cell*0.5, nm[:3], "dmmono", 9, INK_SOFT, anchor="rm", tracking=0.5)
        for j in range(n):
            cxx=x+j*cell
            c.rect(cxx, ry, cell, cell, outline=GRID, width=0.6)
            if i==j:
                c.seg(cxx,ry,cxx+cell,ry+cell,HAIR,0.6)
            elif (min(i,j),max(i,j)) in edges:
                c.dot(cxx+cell/2, ry+cell/2, 5.5, accent)

# ---------------------------------------------------------------- glossary col
def glossary(c, x, y, w, terms, accent, leading=1.5, size=15):
    yy=y
    for term, dfn in terms:
        c.text(x, yy, term, "serifb", size+1, INK)
        c.dot(x-12, yy+ (size)*0.5, 2.2, accent)
        yy=c.paragraph(x, yy+(size+7), dfn, "serif", size-2, INK_SOFT,
                       width=w, leading=leading)
        yy+= size*1.55
    return yy
