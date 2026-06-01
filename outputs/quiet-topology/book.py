# -*- coding: utf-8 -*-
"""Quiet Topology — assemble the 50-plate atlas into a single PDF."""
import sys, math, random
from engine import *
from lib import *
from content import FEATURED, OTHERS, RADAR_AXES

OUT = "/Users/williammeldman/Desktop/openrouter-tui/outputs/quiet-topology"

def nice(name):  # CLOUDFLARE -> Cloudflare ; GOOGLE WORKSPACE -> Google Workspace
    special={"GITHUB":"GitHub"}
    if name in special: return special[name]
    return " ".join(w.capitalize() for w in name.split())

# ============================================================ FEATURED TEMPLATES
def t_anatomy(cfg, plate):
    a=cfg["anatomy"]; acc=ACC[cfg["key"]]
    c=Canvas(); frame(c,accent=acc); edge_ticks(c)
    header(c, f"{cfg['name']} · 01 OF 04", f"PLATE {plate:02d} · ANATOMY")
    title_head(c, f"{nice(cfg['name'])} — how it works", a["title"], acc, roman="I")
    schematic_flow(c, MARGIN+250, a["flow"], acc)
    body_block(c, CX0, 540, "THE MODEL", a["para"], acc, width=566)
    object_cards(c, CX0+616, 540, "CORE OBJECTS", a["objects"], acc, width=288)
    horizontal_strata(c, CX0, 1170, CW, a["layers_label"], a["layers"], acc)
    stat_band(c, a["stats"], acc)
    footer(c, f"PLATE {plate:02d}", a["title"].lower(), accent=acc)
    return finish(c)

def t_operation(cfg, plate):
    o=cfg["operation"]; acc=ACC[cfg["key"]]
    c=Canvas(); frame(c,accent=acc); edge_ticks(c)
    header(c, f"{cfg['name']} · 02 OF 04", f"PLATE {plate:02d} · OPERATION")
    title_head(c, f"{nice(cfg['name'])} — how you run it", o["title"], acc, roman="II")
    verbs_grid(c, CX0, 430, CW, "THE VERBS", o["verbs"], acc, cols=3)
    body_block(c, CX0, 706, "THE METHOD", o["para"], acc, width=560)
    ui_wireframe(c, CX0+612, 712, 292, 286, acc, kind=o["ui"])
    c.text(CX0+612, 712+296, "fig. — the working surface, abstracted",
           "serifi", 12, GREY)
    cycle_diagram(c, W/2, 1170, 92, "THE OPERATING LOOP",
                  ["AUTHOR","DEPLOY","OBSERVE","REFINE"], acc)
    stat_band(c, o["stats"], acc)
    footer(c, f"PLATE {plate:02d}", "the instrument in the hand", accent=acc)
    return finish(c)

def t_ecosystem(cfg, plate):
    e=cfg["ecosystem"]; acc=ACC[cfg["key"]]
    c=Canvas(); frame(c,accent=acc); edge_ticks(c)
    header(c, f"{cfg['name']} · 03 OF 04", f"PLATE {plate:02d} · ECOSYSTEM")
    title_head(c, f"{nice(cfg['name'])} — extensions & reach", e["title"], acc, roman="III")
    radial_integrations(c, W/2, 632, 232, cfg["name"].split()[0], e["groups"], acc)
    body_block(c, CX0, 1006, "THE SURFACE", e["para"], acc, width=560)
    # category index
    ix=CX0+612; iy=1006
    c.text(ix, iy, "CATEGORIES", "mono", 11, acc, tracking=3.0)
    yy=iy+28
    for cat,names in e["groups"]:
        c.dot(ix+3, yy+6, 2.4, acc)
        c.text(ix+14, yy, cat, "serifb", 13, INK)
        c.text(ix+14, yy+16, " · ".join(names), "mono", 9, GREY, tracking=0.4)
        yy+=42
    stat_band(c, e["stats"], acc)
    footer(c, f"PLATE {plate:02d}", "the continent around the core", accent=acc)
    return finish(c)

def t_sentiment(cfg, plate):
    s=cfg["sentiment"]; acc=ACC[cfg["key"]]
    c=Canvas(); frame(c,accent=acc); edge_ticks(c)
    header(c, f"{cfg['name']} · 04 OF 04", f"PLATE {plate:02d} · SENTIMENT")
    title_head(c, f"{nice(cfg['name'])} — how it is felt", "The Sentiment", acc, roman="IV")
    radar_chart(c, W*0.30, 580, 178, RADAR_AXES, s["axes"], acc)
    c.text(W*0.30, 580+214, "fig. — the disposition profile", "serifi", 12, GREY, anchor="ma")
    pull_quote(c, CX0+566, 452, 360, s["quote"], s["attrib"], acc)
    sparkline(c, CX0+566, 700, 360, 90, s["timeline"], acc, label="MENTION TREND · 12 PERIODS")
    body_block(c, CX0, 980, "THE READING", s["para"], acc, width=440)
    theme_bars(c, CX0+512, 980, 392, "WHAT THEY SAY", s["themes"], acc)
    c.text(CX0, H-MARGIN-118, "Qualitative composite — an illustration of reputation, not a measurement.",
           "serifi", 11.5, GREY)
    stat_band(c, s["stats"], acc)
    footer(c, f"PLATE {plate:02d}", "the ephemeral, plotted", accent=acc)
    return finish(c)

# ============================================================ OTHERS TEMPLATES
def t_other_a(cfg, plate):
    acc=ACC[cfg["key"]]
    c=Canvas(); frame(c,accent=acc); edge_ticks(c)
    header(c, f"{cfg['name']} · 01 OF 02", f"PLATE {plate:02d} · ANATOMY + OPERATION")
    title_head(c, f"{nice(cfg['name'])} — how it works", nice(cfg["name"]).split()[0]+" "+ "·", acc) \
        if False else title_head(c, f"{nice(cfg['name'])} — how it works", nice(cfg["name"]), acc, sub=cfg["tagline"])
    body_block(c, CX0, 460, "THE MODEL", cfg["para_a"], acc, width=560)
    ui_wireframe(c, CX0+612, 466, 292, 250, acc, kind="app")
    horizontal_strata(c, CX0, 760, CW, "THE LIFECYCLE", [(s.replace("\n"," "),"") for s in cfg["flow"]], acc)
    verbs_grid(c, CX0, 940, CW, "THE VERBS", cfg["verbs"], acc, cols=3)
    stat_band(c, cfg["stats_a"], acc)
    footer(c, f"PLATE {plate:02d}", cfg["tagline"], accent=acc)
    return finish(c)

def t_other_b(cfg, plate):
    acc=ACC[cfg["key"]]
    c=Canvas(); frame(c,accent=acc); edge_ticks(c)
    header(c, f"{cfg['name']} · 02 OF 02", f"PLATE {plate:02d} · ECOSYSTEM + SENTIMENT")
    title_head(c, f"{nice(cfg['name'])} — reach & feeling", "The Surface & The Sentiment", acc)
    radial_integrations(c, W*0.32, 600, 188, cfg["name"].split()[0], cfg["groups"], acc)
    radar_chart(c, W*0.74, 560, 150, RADAR_AXES, cfg["axes"], acc)
    body_block(c, CX0, 866, "EXTENSIONS", cfg["para_b"], acc, width=440)
    theme_bars(c, CX0+512, 866, 392, "WHAT THEY SAY", cfg["themes"], acc)
    yq=1120
    pull_quote(c, CX0, yq, CW-12, cfg["quote"], cfg["attrib"], acc)
    stat_band(c, cfg["stats_b"], acc)
    footer(c, f"PLATE {plate:02d}", "the continent and its weather", accent=acc)
    return finish(c)

# ============================================================ SPECIAL PAGES
def p_cover():
    c=Canvas(); frame(c); edge_ticks(c)
    header(c, "QUIET  TOPOLOGY", "ATLAS · ED. I · MMXXVI")
    cx,cy=W/2,H*0.45
    pts=phyllotaxis(cx,cy,150,33,jitter=4,seed=4)
    pts=[p for p in pts if (p[0]-cx)**2+(p[1]-cy)**2<356**2]
    for i,j in nearest_edges(pts,k=3): c.line([pts[i],pts[j]],HAIR,0.7)
    rr=random.Random(9)
    for _ in range(5):
        i,j=rr.randrange(len(pts)),rr.randrange(len(pts)); c.line([pts[i],pts[j]],SIGNAL,0.9)
    for k,p in enumerate(pts):
        if k%11==0: c.circle(p[0],p[1],5.5,outline=INK,width=1.1); c.dot(p[0],p[1],2.0,SIGNAL)
        else: c.dot(p[0],p[1],1.8,INK_SOFT)
    degree_ring(c,cx,cy,388,ticks=120,labels=False)
    ty=H*0.73
    c.text(W/2,ty,"QUIET","display",94,INK,anchor="ma",tracking=14)
    c.text(W/2,ty+96,"TOPOLOGY","display",94,INK,anchor="ma",tracking=14)
    c.seg(W/2-150,ty+210,W/2+150,ty+210,SIGNAL,1.2)
    c.text(W/2,ty+224,"AN ATLAS OF CONNECTED SOFTWARE","mono",13,INK_SOFT,anchor="ma",tracking=5.5)
    c.text(W/2,ty+248,"fifty plates · how the tools work, and how they relate","serifi",14,GREY,anchor="ma")
    footer(c,"PLATE 00","every tool a handshake")
    return finish(c)

def p_colophon():
    c=Canvas(); frame(c); edge_ticks(c)
    header(c,"QUIET  TOPOLOGY","PLATE 01 · COLOPHON")
    c.text(W/2,H*0.30,"QUIET TOPOLOGY","display",46,INK,anchor="ma",tracking=8)
    c.seg(W/2-120,H*0.30+58,W/2+120,H*0.30+58,SIGNAL,1.0)
    c.text(W/2,H*0.30+74,"AN ATLAS OF CONNECTED SOFTWARE","mono",12,INK_SOFT,anchor="ma",tracking=4)
    lines=[
        ("EDITION","I · MMXXVI"),
        ("SUBJECT","fourteen instruments of the modern stack"),
        ("METHOD","each documented as a natural specimen"),
        ("PILLARS","anatomy · operation · ecosystem · sentiment"),
        ("TYPE","Italiana · Lora · IBM Plex Mono · DM Mono"),
        ("PALETTE","aged plate · oxblood · rationed accent"),
        ("PLATES","fifty, drawn by patient hand"),
    ]
    y=H*0.46
    for lab,val in lines:
        c.text(W/2-30,y,lab,"mono",11,GREY,anchor="ra",tracking=2.5)
        c.text(W/2-12,y,"·",   "mono",11,SIGNAL,anchor="ma")
        c.text(W/2+4, y,val,"serif",14.5,INK)
        y+=46
    c.text(W/2,H*0.86,"“ the most profound information is the line between objects ”",
           "serifi",15,INK_SOFT,anchor="ma")
    footer(c,"PLATE 01","the maker's note")
    return finish(c)

def p_preface():
    c=Canvas(); frame(c); edge_ticks(c)
    header(c,"QUIET  TOPOLOGY","PLATE 02 · PREFACE")
    title_head(c,"On reading the atlas","Preface",SIGNAL)
    paras=[
      ("THE PREMISE",
       "Modern software is no longer a shelf of separate programs. It is a single "
       "connected organism — a mesh of services that authenticate one another, pass "
       "data across, and trigger each other through quiet protocols the user never "
       "sees. This atlas treats fourteen of those services as specimens, and studies "
       "not only each one but the lines between them."),
      ("THE STRUCTURE",
       "Each instrument receives four plates. The first dissects its anatomy — how it "
       "physically works. The second shows its operation — how a person actually runs "
       "it. The third maps its ecosystem — the extensions and integrations that extend "
       "its reach. The fourth plots its sentiment — how the people who use it feel, "
       "rendered as an honest, qualitative composite rather than a hard measurement."),
      ("THE THESIS",
       "Read end to end, a single argument emerges: these tools have converged. The "
       "same primitives — an API, a webhook, a token — recur everywhere, and a new "
       "protocol now makes the whole mesh legible to machines. The final plates make "
       "that convergence visible. The rest is patient documentation of an invisible "
       "country."),
    ]
    y=MARGIN+200
    for lab,txt in paras:
        y=body_block(c, CX0, y, lab, txt, SIGNAL, width=CW-12, size=16, leading=1.6)
        y+=46
    stat_band(c, [("INSTRUMENTS","14"),("PLATES","50"),
                  ("PILLARS","4"),("THESIS","convergence")], SIGNAL)
    footer(c,"PLATE 02","how to read what follows")
    return finish(c)

def p_contents():
    c=Canvas(); frame(c); edge_ticks(c)
    header(c,"QUIET  TOPOLOGY","PLATE 03 · CONTENTS")
    title_head(c,"Index of plates","Contents",SIGNAL)
    rows=[
      ("00","Cover","signal"),("01","Colophon","signal"),("02","Preface","signal"),
      ("03","Contents","signal"),("04","The Visual Language","signal"),
      ("05","The Constellation","signal"),("06","The Protocol Layer","signal"),
      ("07","Anatomy of a Request","signal"),
      ("08","Stripe — the payment rail","stripe"),
      ("12","Notion — everything is a block","notion"),
      ("16","Canva — design in the cloud","canva"),
      ("20","Cloudflare — the network at the edge","cloud"),
      ("24","GitHub — the commit graph","github"),
      ("26","Figma — design as a place","figma"),
      ("28","Slack — the event stream","slack"),
      ("30","Shopify — programmable commerce","shopify"),
      ("32","Vercel — git push to URL","vercel"),
      ("34","Linear — software made instant","linear"),
      ("36","Airtable — the citizen database","airtable"),
      ("38","Zapier — the universal glue","zapier"),
      ("40","Google Workspace — the shared default","google"),
      ("42","Datadog — the system made visible","datadog"),
      ("44","The Sentiment Atlas","signal"),
      ("45","The Relationship Matrix","signal"),
      ("46","Data-Flow Cartography","signal"),
      ("47","The Convergence","signal"),
      ("48","Glossary of Primitives","signal"),
      ("49","Colophon — verso","signal"),
    ]
    col_w=(CW-40)/2
    y0=MARGIN+200; rowh=44; per=14
    for i,(num,nm,key) in enumerate(rows):
        col=i//per; row=i%per
        x=CX0+col*(col_w+40); y=y0+row*rowh
        acc=ACC.get(key,SIGNAL)
        c.dot(x+3,y+7,2.6,acc)
        c.text(x+16,y,num,"dmmono",12,acc,tracking=1.0)
        c.text(x+52,y,nm,"serif",14.5,INK)
        # leader dots
        nmw=c.measure(nm,"serif",14.5)
        lx=x+58+nmw+8
        while lx<x+col_w-6:
            c.dot(lx,y+8,0.8,GREY); lx+=8
    footer(c,"PLATE 03","the field, indexed")
    return finish(c)

def p_legend():
    c=Canvas(); frame(c); edge_ticks(c)
    header(c,"QUIET  TOPOLOGY","PLATE 04 · THE LEGEND")
    title_head(c,"Reading the plates","The Visual Language",SIGNAL)
    items=[("node — a service","dot"),("primary node — a host","ring"),
           ("edge — an integration","edge"),("bridge — a protocol link","bridge"),
           ("boundary — a trust zone","box"),("flux — direction of data","arrow")]
    x0,y0=CX0+22,MARGIN+210; rowh=86
    for k,(lab,kind) in enumerate(items):
        col=k%2; row=k//2; x=x0+col*510; y=y0+row*rowh; gx=x+18
        if kind=="dot": c.dot(gx,y,4,INK_SOFT)
        elif kind=="ring": c.circle(gx,y,8,outline=INK,width=1.2); c.dot(gx,y,2.4,SIGNAL)
        elif kind=="edge": c.line([(gx-22,y),(gx+22,y)],HAIR,1.0)
        elif kind=="bridge": c.line([(gx-22,y),(gx+22,y)],SIGNAL,1.2)
        elif kind=="box": c.rect(gx-18,y-12,36,24,outline=INK_SOFT,width=1.0)
        elif kind=="arrow":
            c.line([(gx-20,y),(gx+18,y)],INK_SOFT,1.0)
            c.poly([(gx+18,y-4),(gx+26,y),(gx+18,y+4)],fill=INK_SOFT)
        c.text(x+58,y,lab,"mono",13,INK_SOFT,anchor="lm",tracking=1.2)
    py=y0+3*rowh+6
    c.text(CX0+22,py,"CHROMATIC INDEX","mono",11.5,INK_SOFT,tracking=3.0)
    sw=[("stripe","STRIPE"),("notion","NOTION"),("canva","CANVA"),("cloud","CLOUDFLARE"),
        ("github","GITHUB"),("figma","FIGMA"),("slack","SLACK"),("shopify","SHOPIFY"),
        ("vercel","VERCEL"),("linear","LINEAR"),("airtable","AIRTABLE"),("zapier","ZAPIER"),
        ("google","GOOGLE"),("datadog","DATADOG")]
    sx,sy=CX0+22,py+28
    for k,(key,nm) in enumerate(sw):
        col=k%4; row=k//4; x=sx+col*250; y=sy+row*70
        c.rect(x,y,38,38,fill=ACC[key])
        c.text(x+50,y+8,nm,"mono",10.5,INK_SOFT,tracking=1.2)
        c.text(x+50,y+24,"#%02X%02X%02X"%ACC[key],"dmmono",9,GREY)
    c.paragraph(CX0+22,sy+4*70+16,
        "Each plate documents one instrument of the modern stack as though it were a "
        "natural specimen. The accent colour names the subject; the lines name the "
        "relations between subjects. Read slowly — the field rewards a returning eye.",
        "serif",16,INK_SOFT,width=CW-56,leading=1.6,align="j")
    footer(c,"PLATE 04","the key to the field")
    return finish(c)

def p_constellation():
    c=Canvas(); frame(c); edge_ticks(c)
    header(c,"QUIET  TOPOLOGY","PLATE 05 · THE CONSTELLATION")
    title_head(c,"How they relate","The Constellation",SIGNAL)
    cx,cy=W/2,H*0.54
    nodes={"STRIPE":(0,-300,"stripe"),"NOTION":(250,-150,"notion"),"CANVA":(290,140,"canva"),
      "CLOUDFLARE":(120,330,"cloud"),"GITHUB":(-180,300,"github"),"FIGMA":(-310,90,"figma"),
      "SLACK":(-260,-170,"slack"),"SHOPIFY":(345,-15,"shopify"),"VERCEL":(-50,-150,"vercel"),
      "LINEAR":(-120,160,"linear"),"ZAPIER":(55,35,"zapier"),"GOOGLE":(175,-305,"google")}
    P={k:(cx+dx,cy+dy,key) for k,(dx,dy,key) in nodes.items()}
    rel=[("STRIPE","SHOPIFY"),("STRIPE","NOTION"),("STRIPE","SLACK"),("NOTION","SLACK"),
      ("NOTION","GITHUB"),("FIGMA","SLACK"),("FIGMA","GITHUB"),("GITHUB","VERCEL"),
      ("GITHUB","LINEAR"),("LINEAR","SLACK"),("VERCEL","CLOUDFLARE"),("CANVA","SHOPIFY"),
      ("ZAPIER","STRIPE"),("ZAPIER","NOTION"),("ZAPIER","SLACK"),("ZAPIER","SHOPIFY"),
      ("GOOGLE","NOTION"),("GOOGLE","SLACK"),("CLOUDFLARE","SHOPIFY"),("VERCEL","STRIPE"),
      ("CANVA","SLACK"),("LINEAR","GITHUB"),("ZAPIER","CANVA"),("GOOGLE","CANVA")]
    for a,b in rel: c.line([P[a][:2],P[b][:2]],HAIR,0.8)
    for a,b in rel:
        if "ZAPIER" in (a,b): c.line([P[a][:2],P[b][:2]],SIGNAL,0.9)
    degree_ring(c,cx,cy,430,ticks=120,labels=False); c.circle(cx,cy,372,outline=GRID,width=0.8)
    for k,(x,y,key) in P.items():
        c.circle(x,y,13,outline=INK,width=1.2,fill=PAPER); c.dot(x,y,6.5,ACC[key])
        ang=math.atan2(y-cy,x-cx); lx=x+26*math.cos(ang); ly=y+26*math.sin(ang)
        c.text(lx,ly,k,"mono",11,INK_SOFT,anchor="lm" if math.cos(ang)>=0 else "rm",tracking=1.6)
    c.text(cx,cy-4,"ctx","dmmono",12,GREY,anchor="mm")
    footer(c,"PLATE 05","the mesh observed only by its effects")
    return finish(c)

def p_protocol():
    c=Canvas(); frame(c); edge_ticks(c)
    header(c,"QUIET  TOPOLOGY","PLATE 06 · THE PROTOCOL LAYER")
    title_head(c,"The invisible connective tissue","The Protocol Layer",SIGNAL)
    # central stack of protocol primitives
    layers=[("REST / GraphQL","the request — ask and receive"),
            ("Webhook","the interrupt — be told when"),
            ("OAuth / Token","the handshake — prove who"),
            ("Event / Queue","the stream — many, in order"),
            ("MCP","the agent bridge — tools as context")]
    layer_stack(c, CX0, MARGIN+220, CW, layers, SIGNAL)
    horizontal_strata(c, CX0, 1140, CW, "THE FIVE DIALECTS, IN ORDER OF AGE",
        [("REST","1990s"),("OAUTH","2007"),("WEBHOOK","2007"),
         ("EVENT","2010s"),("MCP","2024")], SIGNAL)
    body_block(c, CX0, MARGIN+220+5*44+34,
        "WHY IT MATTERS",
        "Every instrument in this atlas speaks the same five dialects. A request asks "
        "and receives; a webhook reverses the call so a service can speak first; a token "
        "proves identity without revealing a secret; an event stream carries many "
        "messages in order. The fifth is newest: the Model Context Protocol exposes a "
        "tool's own primitives to an AI agent, so the mesh that humans wired together "
        "by hand becomes legible to machines. Learn these five and every API in the "
        "world is half-familiar before you read its documentation.",
        SIGNAL, width=CW-12, size=16, leading=1.62)
    stat_band(c, [("DIALECTS","5"),("OLDEST","REST"),("REVERSED","webhook"),("NEWEST","MCP")], SIGNAL)
    footer(c,"PLATE 06","the five dialects of connection")
    return finish(c)

def p_request():
    c=Canvas(); frame(c); edge_ticks(c)
    header(c,"QUIET  TOPOLOGY","PLATE 07 · ANATOMY OF A REQUEST")
    title_head(c,"How data physically moves","Anatomy of a Request",SIGNAL)
    schematic_flow(c, MARGIN+250,
        ["CLIENT","DNS","EDGE\nPOP","CACHE","FUNCTION","ORIGIN","DATABASE"], SIGNAL, r=26)
    body_block(c, CX0, 470,
        "THE JOURNEY",
        "A single click sets off a relay across the planet. The browser resolves a name "
        "to an address through DNS, then opens a connection that anycast routing lands "
        "at the nearest edge location. There a cache may answer instantly; if not, a "
        "function runs, perhaps calling an origin server, which in turn queries a "
        "database. The response retraces the path home. Most of this happens in tens of "
        "milliseconds, and almost none of it is visible — the defining quality of "
        "infrastructure done well.",
        SIGNAL, width=566)
    object_cards(c, CX0+616, 470, "WHERE TIME GOES",
        [("DNS","~20 ms · resolve"),("TLS","~30 ms · handshake"),
         ("Edge","~5 ms · nearest"),("Function","~50 ms · compute"),
         ("Database","~10 ms · query")], SIGNAL, width=288)
    horizontal_strata(c, CX0, 1170, CW, "THE ROUND TRIP",
        [("OUT","request"),("EDGE","routed"),("WORK","computed"),
         ("DATA","fetched"),("BACK","rendered")], SIGNAL)
    stat_band(c, [("HOPS","7"),("ROUTING","anycast"),
                  ("BUDGET","~100 ms"),("VISIBLE","none")], SIGNAL)
    footer(c,"PLATE 07","the relay, slowed down")
    return finish(c)

def p_sentiment_atlas():
    c=Canvas(); frame(c); edge_ticks(c)
    header(c,"QUIET  TOPOLOGY","PLATE 44 · THE SENTIMENT ATLAS")
    title_head(c,"Reputation, compared","The Sentiment Atlas",SIGNAL)
    # composite love/contention scatter
    apps=[("STRIPE",9.0,3.0,"stripe"),("LINEAR",8.8,3.5,"linear"),("FIGMA",9.1,4.0,"figma"),
      ("GITHUB",9.1,4.4,"github"),("CLOUD",8.6,4.7,"cloud"),("NOTION",8.3,5.1,"notion"),
      ("VERCEL",8.5,5.4,"vercel"),("CANVA",7.9,4.2,"canva"),("SHOPIFY",8.1,4.8,"shopify"),
      ("GOOGLE",7.6,3.9,"google"),("AIRTBL",7.4,5.0,"airtable"),("SLACK",7.5,5.7,"slack"),
      ("ZAPIER",7.1,5.3,"zapier"),("DATADOG",7.7,6.6,"datadog")]
    px0,py0=CX0+70,MARGIN+220; pw,ph=CW-120,600
    # axes
    c.rect(px0,py0,pw,ph,outline=HAIR,width=0.9)
    for gx in range(1,5): c.seg(px0+pw*gx/5,py0,px0+pw*gx/5,py0+ph,GRID,0.6)
    for gy in range(1,5): c.seg(px0,py0+ph*gy/5,px0+pw,py0+ph*gy/5,GRID,0.6)
    c.text(px0+pw/2,py0+ph+30,"DEVOTION  →","mono",11,INK_SOFT,anchor="ma",tracking=2.5)
    c.text(px0-44,py0+ph/2,"CONTENTION  →","mono",11,INK_SOFT,anchor="mm",tracking=2.5)
    for nm,love,cont,key in apps:
        x=px0+pw*(love-6.5)/(9.5-6.5); y=py0+ph-ph*(cont-2.0)/(7.0-2.0)
        c.circle(x,y,9,outline=INK,width=1.0,fill=PAPER); c.dot(x,y,4,ACC[key])
        c.text(x+13,y,nm,"dmmono",9,INK_SOFT,anchor="lm",tracking=0.5)
    body_block(c, CX0, py0+ph+70,
        "THE PATTERN",
        "Plotted by devotion against contention, a shape appears. The most beloved tools "
        "— Stripe, Linear, Figma, GitHub — cluster low and right: adored and little "
        "argued over. Toward the upper edge sit the indispensable-but-debated — Datadog "
        "for its invoices, Slack for its noise. Nothing truly loved is free of critique; "
        "the affection and the complaint are usually about the very same trait.",
        SIGNAL, width=CW-12, size=15.5, leading=1.55)
    stat_band(c, [("AXES","devotion × contention"),("BELOVED","Stripe · Linear · Figma"),
                  ("DEBATED","Datadog · Slack"),("THE LAW","love ≈ critique")], SIGNAL)
    footer(c,"PLATE 44","the weather of opinion")
    return finish(c)

def p_matrix():
    c=Canvas(); frame(c); edge_ticks(c)
    header(c,"QUIET  TOPOLOGY","PLATE 45 · THE RELATIONSHIP MATRIX")
    title_head(c,"Which speaks to which","The Relationship Matrix",SIGNAL)
    names=["STRIPE","NOTION","CANVA","CLOUDFLARE","GITHUB","FIGMA","SLACK",
           "SHOPIFY","VERCEL","LINEAR","AIRTABLE","ZAPIER","GOOGLE","DATADOG"]
    idx={n:i for i,n in enumerate(names)}
    pairs=[("STRIPE","SHOPIFY"),("STRIPE","NOTION"),("STRIPE","SLACK"),("STRIPE","VERCEL"),
      ("STRIPE","ZAPIER"),("NOTION","SLACK"),("NOTION","GITHUB"),("NOTION","GOOGLE"),
      ("NOTION","ZAPIER"),("CANVA","SHOPIFY"),("CANVA","SLACK"),("CANVA","ZAPIER"),
      ("CANVA","GOOGLE"),("CLOUDFLARE","VERCEL"),("CLOUDFLARE","SHOPIFY"),("CLOUDFLARE","GITHUB"),
      ("GITHUB","VERCEL"),("GITHUB","LINEAR"),("GITHUB","FIGMA"),("GITHUB","SLACK"),
      ("GITHUB","DATADOG"),("FIGMA","SLACK"),("FIGMA","LINEAR"),("SLACK","LINEAR"),
      ("SLACK","ZAPIER"),("SLACK","DATADOG"),("SLACK","GOOGLE"),("SHOPIFY","ZAPIER"),
      ("VERCEL","DATADOG"),("LINEAR","ZAPIER"),("AIRTABLE","ZAPIER"),("AIRTABLE","SLACK"),
      ("AIRTABLE","GOOGLE"),("GOOGLE","ZAPIER"),("DATADOG","ZAPIER")]
    edges=set((min(idx[a],idx[b]),max(idx[a],idx[b])) for a,b in pairs)
    adjacency_matrix(c, CX0+150, MARGIN+250, names, edges, SIGNAL, cell=46)
    body_block(c, CX0, MARGIN+250+14*46+60,
        "READING THE GRID",
        "A filled cell marks a native integration between two instruments. The densest "
        "rows belong to the connectors — Zapier and Slack touch nearly everything, the "
        "hubs through which the rest of the mesh communicates. The diagonal is struck "
        "out: nothing integrates with itself. What the grid proves is simple and "
        "profound — there is no longer any such thing as a standalone tool.",
        SIGNAL, width=CW-12, size=15, leading=1.5)
    footer(c,"PLATE 45","the mesh, tabulated")
    return finish(c)

def p_dataflow():
    c=Canvas(); frame(c); edge_ticks(c)
    header(c,"QUIET  TOPOLOGY","PLATE 46 · DATA-FLOW CARTOGRAPHY")
    title_head(c,"A day in the life of an event","Data-Flow Cartography",SIGNAL)
    # a left-to-right flow of a real event across tools
    stages=["CUSTOMER\nPAYS","STRIPE\nwebhook","ZAPIER\nrouter","NOTION\nrecord",
            "SLACK\nalert","DATADOG\nmetric"]
    schematic_flow(c, MARGIN+250, stages, SIGNAL, r=30, lab_size=9)
    body_block(c, CX0, 480,
        "ONE EVENT, MANY HOMES",
        "Follow a single payment. The customer pays; Stripe fires a webhook the instant "
        "the charge succeeds. A Zapier router catches it and fans the news outward: a "
        "row appears in a Notion revenue database, a message lands in a Slack channel, "
        "and a custom metric ticks upward in Datadog. One real-world act, refracted into "
        "five systems in under a second — none of which their makers built to know about "
        "the others. The protocol layer did the introductions.",
        SIGNAL, width=566)
    object_cards(c, CX0+616, 480, "THE HANDOFFS",
        [("Pay → Stripe","card rail"),("Stripe → Zapier","webhook"),
         ("Zapier → Notion","API write"),("Zapier → Slack","Block Kit"),
         ("→ Datadog","metric")], SIGNAL, width=288)
    horizontal_strata(c, CX0, 1170, CW, "THE FAN-OUT",
        [("ACT","payment"),("EMIT","webhook"),("ROUTE","zapier"),
         ("RECORD","notion"),("NOTIFY","slack"),("MEASURE","datadog")], SIGNAL)
    stat_band(c, [("ORIGIN","one click"),("DESTINATIONS","5"),
                  ("GLUE","webhook + zap"),("LATENCY","< 1 s")], SIGNAL)
    footer(c,"PLATE 46","the cartography of a single act")
    return finish(c)

def p_convergence():
    c=Canvas(); frame(c); edge_ticks(c)
    header(c,"QUIET  TOPOLOGY","PLATE 47 · THE CONVERGENCE")
    title_head(c,"The mesh becomes legible","The Convergence",SIGNAL)
    cx,cy=W/2,H*0.46
    # all tools as a ring, all converging to a central agent
    ring=["STRIPE","NOTION","CANVA","CLOUDFLARE","GITHUB","FIGMA","SLACK",
          "SHOPIFY","VERCEL","LINEAR","AIRTABLE","ZAPIER","GOOGLE","DATADOG"]
    R=300
    pos=[]
    for i,nm in enumerate(ring):
        a=math.radians(i/len(ring)*360-90)
        x=cx+R*math.cos(a); y=cy+R*math.sin(a); pos.append((x,y,nm,a))
    for x,y,nm,a in pos:
        c.line([(cx+24*math.cos(a),cy+24*math.sin(a)),(x-12*math.cos(a),y-12*math.sin(a))],
               SIGNAL,0.9)
    degree_ring(c,cx,cy,R+34,ticks=112,labels=False)
    for x,y,nm,a in pos:
        key=nm.lower()
        col=ACC.get({"cloudflare":"cloud","airtable":"airtable","google":"google"}.get(key,key),SIGNAL)
        c.circle(x,y,12,outline=INK,width=1.1,fill=PAPER); c.dot(x,y,5.5,col)
        lx=cx+(R+22)*math.cos(a); ly=cy+(R+22)*math.sin(a)
        c.text(lx,ly,nm,"mono",10,INK_SOFT,anchor="lm" if math.cos(a)>=0 else "rm",tracking=1.0)
    c.circle(cx,cy,30,outline=INK,width=1.4,fill=PAPER); c.dot(cx,cy,12,SIGNAL)
    c.text(cx,cy+48,"THE AGENT","mono",11,INK_SOFT,anchor="ma",tracking=3.0)
    c.text(cx,cy+64,"one protocol · every tool","serifi",12,GREY,anchor="ma")
    body_block(c, CX0, H*0.46+R+90,
        "THE QUIET CONCLUSION",
        "For two decades these tools were wired to each other by human hands, one "
        "integration at a time. The final shift is subtler: a shared protocol now lets a "
        "single agent read and operate all of them at once — context flowing to the "
        "centre instead of point to point. The atlas began by studying the lines between "
        "objects. It ends by watching them all converge on one.",
        SIGNAL, width=CW-12, size=16, leading=1.6)
    footer(c,"PLATE 47","every tool a handshake")
    return finish(c)

def p_glossary():
    c=Canvas(); frame(c); edge_ticks(c)
    header(c,"QUIET  TOPOLOGY","PLATE 48 · GLOSSARY")
    title_head(c,"The recurring primitives","Glossary",SIGNAL)
    left=[("API","A contract for asking a service to do or return something, usually over HTTP."),
      ("REST","An API style using HTTP verbs against addressable resources — the lingua franca of the web."),
      ("GraphQL","A query language that lets a client request exactly the fields it needs in one round trip."),
      ("Webhook","A reverse call: the service notifies you the moment an event occurs."),
      ("Token","A credential that proves identity or grants scope without exposing a password."),
      ("OAuth","A delegation flow granting a third party scoped access without sharing a password."),
      ("Idempotency","The property that retrying a request causes no additional effect."),
      ("SDK","A language-native library wrapping an API, so you call functions rather than endpoints."),
      ("Block","The atomic unit of a document model; everything is one, nested into a tree.")]
    right=[("Edge","Compute or cache run close to the user, in many cities at once."),
      ("Isolate","A lightweight sandbox sharing one process — fast to start, cheap to run."),
      ("Serverless","Code run on demand without managing servers; billed for execution, not uptime."),
      ("CDN","A network caching content near users so it loads from nearby, not the origin."),
      ("Webhook secret","A signing key used to verify a webhook truly came from its sender."),
      ("Rate limit","A cap on requests per window that protects a service from overload."),
      ("Headless","Decoupling a system's data and logic from its presentation, exposed only by API."),
      ("Integration","A standing connection that lets two services exchange data or events."),
      ("MCP","Model Context Protocol — exposes a tool's primitives to an AI agent.")]
    glossary(c, CX0+16, MARGIN+208, CW/2-46, left, SIGNAL)
    glossary(c, CX0+CW/2+24, MARGIN+208, CW/2-46, right, SIGNAL)
    footer(c,"PLATE 48","the shared vocabulary")
    return finish(c)

def p_backcover():
    c=Canvas(); frame(c); edge_ticks(c)
    header(c,"QUIET  TOPOLOGY","PLATE 49 · VERSO")
    cx,cy=W/2,H*0.40
    pts=phyllotaxis(cx,cy,70,30,jitter=3,seed=12)
    pts=[p for p in pts if (p[0]-cx)**2+(p[1]-cy)**2<230**2]
    for i,j in nearest_edges(pts,k=2): c.line([pts[i],pts[j]],HAIR,0.7)
    for k,p in enumerate(pts):
        if k%9==0: c.circle(p[0],p[1],4.5,outline=INK,width=1.0); c.dot(p[0],p[1],1.6,SIGNAL)
        else: c.dot(p[0],p[1],1.5,INK_SOFT)
    degree_ring(c,cx,cy,250,ticks=84,labels=False)
    c.text(W/2,H*0.64,"“","display2",60,SIGNAL,anchor="ma")
    c.paragraph(W/2-360,H*0.64+44,
        "Something ephemeral — a relation, a recognition, a thing felt between two "
        "distant points — can be observed, measured, and held, if only the instrument "
        "is patient enough.","serifi",18,INK,width=720,leading=1.5,align="c")
    c.seg(W/2-60,H*0.80,W/2+60,H*0.80,SIGNAL,1.0)
    c.text(W/2,H*0.80+16,"QUIET TOPOLOGY · EDITION I · MMXXVI","mono",11,INK_SOFT,anchor="ma",tracking=4)
    c.text(W/2,H*0.80+38,"an atlas of connected software","serifi",13,GREY,anchor="ma")
    footer(c,"PLATE 49","the end of the field")
    return finish(c)

# ============================================================ REGISTRY
def build_pages(subset=None):
    feat_order=[("stripe",8),("notion",12),("canva",16),("cloud",20)]
    other_order=[("github",24),("figma",26),("slack",28),("shopify",30),
                 ("vercel",32),("linear",34),("airtable",36),("zapier",38),
                 ("google",40),("datadog",42)]
    pages=[]
    pages.append(("00_cover",p_cover))
    pages.append(("01_colophon",p_colophon))
    pages.append(("02_preface",p_preface))
    pages.append(("03_contents",p_contents))
    pages.append(("04_legend",p_legend))
    pages.append(("05_constellation",p_constellation))
    pages.append(("06_protocol",p_protocol))
    pages.append(("07_request",p_request))
    for key,base in feat_order:
        cfg=FEATURED[key]
        pages.append((f"{base:02d}_{key}_anatomy",   lambda cfg=cfg,b=base:t_anatomy(cfg,b)))
        pages.append((f"{base+1:02d}_{key}_operation",lambda cfg=cfg,b=base:t_operation(cfg,b+1)))
        pages.append((f"{base+2:02d}_{key}_ecosystem",lambda cfg=cfg,b=base:t_ecosystem(cfg,b+2)))
        pages.append((f"{base+3:02d}_{key}_sentiment",lambda cfg=cfg,b=base:t_sentiment(cfg,b+3)))
    for key,base in other_order:
        cfg=OTHERS[key]
        pages.append((f"{base:02d}_{key}_a",  lambda cfg=cfg,b=base:t_other_a(cfg,b)))
        pages.append((f"{base+1:02d}_{key}_b",lambda cfg=cfg,b=base:t_other_b(cfg,b+1)))
    pages.append(("44_sentiment_atlas",p_sentiment_atlas))
    pages.append(("45_matrix",p_matrix))
    pages.append(("46_dataflow",p_dataflow))
    pages.append(("47_convergence",p_convergence))
    pages.append(("48_glossary",p_glossary))
    pages.append(("49_backcover",p_backcover))
    if subset:
        pages=[p for p in pages if any(s in p[0] for s in subset)]
    return pages

if __name__=="__main__":
    mode=sys.argv[1] if len(sys.argv)>1 else "subset"
    if mode=="subset":
        subset=["00_cover","08_stripe","09_stripe","10_stripe","11_stripe",
                "24_github","25_github","06_protocol","45_matrix","47_convergence"]
        for name,fn in build_pages(subset):
            fn().save(f"{OUT}/pg_{name}.png"); print("wrote pg_"+name)
    else:
        imgs=[]
        for name,fn in build_pages():
            print("render",name); imgs.append(fn().convert("RGB"))
        imgs[0].save(f"{OUT}/Quiet-Topology.pdf",save_all=True,
                     append_images=imgs[1:],resolution=150.0)
        print("WROTE Quiet-Topology.pdf  (%d pages)"%len(imgs))
