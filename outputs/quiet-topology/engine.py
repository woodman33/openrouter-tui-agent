"""
Quiet Topology — rendering engine.
A scientific-plate design system rendered with PIL at 2x supersampling.
Authoring is done in FINAL pixel units; the engine scales to the supersampled
canvas, draws, then downsamples with LANCZOS for crisp, vector-like output.
"""
import math, random, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# ----------------------------------------------------------------------------
# Geometry / page
# ----------------------------------------------------------------------------
W, H = 1240, 1560          # final book/coffee-table portrait
SS = 2                      # supersample factor
MARGIN = 96

FONT_DIR = "/Users/williammeldman/.claude/skills/canvas-design/canvas-fonts"
FONTS = {
    "display":  "Italiana-Regular.ttf",     # elegant high-contrast serif
    "display2": "Gloock-Regular.ttf",       # heavier display serif
    "serif":    "Lora-Regular.ttf",         # readable body serif
    "serifb":   "Lora-Bold.ttf",
    "serifi":   "Lora-Italic.ttf",
    "mono":     "IBMPlexMono-Regular.ttf",  # clinical labels
    "monob":    "IBMPlexMono-Bold.ttf",
    "dmmono":   "DMMono-Regular.ttf",       # numerals / ticks
    "thin":     "Jura-Light.ttf",           # fine technical annotation
    "thinm":    "Jura-Medium.ttf",
    "young":    "YoungSerif-Regular.ttf",
}

# ----------------------------------------------------------------------------
# Palette — archival, warm-paper, rationed accents
# ----------------------------------------------------------------------------
PAPER   = (239, 233, 221)
PAPER_D = (233, 226, 212)   # panel ground
INK     = (29, 27, 23)
INK_SOFT= (74, 70, 61)
GREY    = (143, 136, 121)
GRID    = (203, 195, 178)
HAIR    = (181, 173, 156)
SIGNAL  = (168, 58, 46)     # default oxblood accent

ACC = {
    "stripe":   (90, 84, 146),    # muted indigo
    "notion":   (66, 62, 56),     # warm near-ink
    "canva":    (38, 120, 120),   # muted teal
    "cloud":    (188, 108, 50),   # muted terracotta (cloudflare orange)
    "github":   (58, 55, 52),     # graphite
    "figma":    (171, 70, 52),    # muted vermilion
    "slack":    (110, 64, 104),   # muted plum/aubergine
    "shopify":  (96, 122, 70),    # muted olive
    "vercel":   (40, 38, 36),     # near-black
    "linear":   (96, 96, 150),    # muted periwinkle
    "airtable": (180, 128, 56),   # muted amber
    "zapier":   (188, 96, 60),    # muted ember
    "google":   (96, 116, 150),   # muted blue
    "datadog":  (108, 80, 138),   # muted violet
    "signal":   SIGNAL,
}

# ----------------------------------------------------------------------------
# Canvas wrapper: authoring in final units, drawing in SS space
# ----------------------------------------------------------------------------
_font_cache = {}
def _font(key, size):
    k = (key, int(round(size * SS)))
    if k not in _font_cache:
        _font_cache[k] = ImageFont.truetype(os.path.join(FONT_DIR, FONTS[key]), k[1])
    return _font_cache[k]


class Canvas:
    def __init__(self, bg=PAPER):
        self.img = Image.new("RGB", (W * SS, H * SS), bg)
        self.d = ImageDraw.Draw(self.img, "RGBA")

    # -- primitives (coords in final units) --
    def line(self, pts, fill=INK, width=1.0):
        p = [(x * SS, y * SS) for x, y in pts]
        self.d.line(p, fill=fill, width=max(1, int(round(width * SS))))

    def seg(self, x1, y1, x2, y2, fill=INK, width=1.0):
        self.line([(x1, y1), (x2, y2)], fill, width)

    def rect(self, x, y, w, h, outline=None, fill=None, width=1.0):
        b = [x * SS, y * SS, (x + w) * SS, (y + h) * SS]
        self.d.rectangle(b, outline=outline, fill=fill,
                         width=max(1, int(round(width * SS))) if outline else 1)

    def circle(self, cx, cy, r, outline=None, fill=None, width=1.0):
        b = [(cx - r) * SS, (cy - r) * SS, (cx + r) * SS, (cy + r) * SS]
        self.d.ellipse(b, outline=outline, fill=fill,
                       width=max(1, int(round(width * SS))) if outline else 1)

    def dot(self, cx, cy, r, fill=INK):
        self.circle(cx, cy, r, fill=fill)

    def arc(self, cx, cy, r, a0, a1, fill=INK, width=1.0):
        b = [(cx - r) * SS, (cy - r) * SS, (cx + r) * SS, (cy + r) * SS]
        self.d.arc(b, a0, a1, fill=fill, width=max(1, int(round(width * SS))))

    def poly(self, pts, outline=None, fill=None, width=1.0):
        p = [(x * SS, y * SS) for x, y in pts]
        self.d.polygon(p, outline=outline, fill=fill,
                       width=max(1, int(round(width * SS))) if outline else 1)

    # -- text --
    def measure(self, s, key, size, tracking=0.0):
        f = _font(key, size)
        w = self.d.textlength(s, font=f) / SS
        if tracking and len(s) > 1:
            w += tracking * (len(s) - 1)
        return w

    def text(self, x, y, s, key="serif", size=18, fill=INK,
             anchor="la", tracking=0.0):
        """anchor: PIL anchors but we handle h-align for tracked text manually."""
        f = _font(key, size)
        if tracking and len(s) > 1:
            total = self.measure(s, key, size, tracking)
            ha = anchor[0]
            if ha == "m":   cx = x - total / 2
            elif ha == "r": cx = x - total
            else:           cx = x
            va = anchor[1] if len(anchor) > 1 else "a"
            pa = ("l" + va)
            for ch in s:
                self.d.text((cx * SS, y * SS), ch, font=f, fill=fill, anchor=pa)
                cx += self.d.textlength(ch, font=f) / SS + tracking
            return
        self.d.text((x * SS, y * SS), s, font=f, fill=fill, anchor=anchor)

    def paragraph(self, x, y, s, key="serif", size=17, fill=INK_SOFT,
                  width=400, leading=1.5, align="l"):
        f = _font(key, size)
        words = s.split()
        lines, cur = [], ""
        for w in words:
            t = (cur + " " + w).strip()
            if self.d.textlength(t, font=f) / SS <= width or not cur:
                cur = t
            else:
                lines.append(cur); cur = w
        if cur:
            lines.append(cur)
        lh = size * leading
        for i, ln in enumerate(lines):
            yy = y + i * lh
            if align == "j" and i < len(lines) - 1 and len(ln.split()) > 1:
                self._justify(x, yy, ln, f, key, size, fill, width)
            elif align == "c":
                self.text(x + width / 2, yy, ln, key, size, fill, anchor="ma")
            elif align == "r":
                self.text(x + width, yy, ln, key, size, fill, anchor="ra")
            else:
                self.d.text((x * SS, yy * SS), ln, font=f, fill=fill)
        return y + len(lines) * lh

    def _justify(self, x, y, ln, f, key, size, fill, width):
        words = ln.split()
        wsum = sum(self.d.textlength(w, font=f) / SS for w in words)
        gap = (width - wsum) / (len(words) - 1)
        cx = x
        for w in words:
            self.d.text((cx * SS, y * SS), w, font=f, fill=fill)
            cx += self.d.textlength(w, font=f) / SS + gap

    def finalize(self):
        return self.img.resize((W, H), Image.LANCZOS)


# ----------------------------------------------------------------------------
# Texture & chrome
# ----------------------------------------------------------------------------
def paper_texture(img, strength=7, seed=7):
    """Subtle grain so the plate reads as printed stock, not flat digital."""
    rnd = random.Random(seed)
    sw, sh = img.size[0] // 6, img.size[1] // 6
    noise = Image.new("L", (sw, sh))
    noise.putdata([128 + rnd.randint(-strength, strength) for _ in range(sw * sh)])
    noise = noise.resize(img.size, Image.BILINEAR).filter(ImageFilter.GaussianBlur(0.6))
    grain = Image.merge("RGB", (noise, noise, noise))
    return Image.blend(img, grain, 0.05)


def vignette(img, strength=0.10):
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse([-w * 0.30, -h * 0.30, w * 1.30, h * 1.30], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(w * 0.10))
    dark = Image.new("RGB", (w, h), (0, 0, 0))
    shaded = Image.composite(img, Image.blend(img, dark, strength), mask)
    return shaded


# ----------------------------------------------------------------------------
# Shared plate chrome
# ----------------------------------------------------------------------------
def frame(c, m=MARGIN, inner=True, accent=SIGNAL):
    c.rect(m, m, W - 2 * m, H - 2 * m, outline=HAIR, width=1.0)
    if inner:
        g = 9
        c.rect(m + g, m + g, W - 2 * m - 2 * g, H - 2 * m - 2 * g,
               outline=GRID, width=0.8)
    # corner registration ticks
    t = 16
    for (cx, cy) in [(m, m), (W - m, m), (m, H - m), (W - m, H - m)]:
        c.seg(cx - t, cy, cx + t, cy, INK, 1.0)
        c.seg(cx, cy - t, cx, cy + t, INK, 1.0)


def edge_ticks(c, m=MARGIN, n=40, accent=SIGNAL):
    """Measurement ruling along the top & bottom inner frame edge."""
    x0, x1 = m + 9, W - m - 9
    span = x1 - x0
    for i in range(n + 1):
        x = x0 + span * i / n
        major = (i % 5 == 0)
        ln = 11 if major else 6
        c.seg(x, m + 9, x, m + 9 + ln, GREY, 0.8)
        c.seg(x, H - m - 9, x, H - m - 9 - ln, GREY, 0.8)


def header(c, left, right, m=MARGIN, accent=SIGNAL):
    y = m - 30
    c.text(m, y, left, "mono", 11.5, INK_SOFT, tracking=2.4)
    c.text(W - m, y, right, "mono", 11.5, INK_SOFT, anchor="ra", tracking=2.4)


def footer(c, plate, caption, m=MARGIN, accent=SIGNAL):
    y = H - m + 16
    c.dot(m + 3, y + 6, 2.2, accent)
    c.text(m + 14, y, caption, "serifi", 12.5, GREY)
    c.text(W - m, y, plate, "mono", 11.5, INK_SOFT, anchor="ra", tracking=2.0)


def kicker(c, x, y, label, accent=SIGNAL, size=11.5):
    """Tiny accent dot + tracked label — the recurring section marker."""
    c.dot(x + 2.5, y + size * 0.42, 2.4, accent)
    c.text(x + 13, y, label.upper(), "mono", size, INK_SOFT, tracking=3.0)


def section_number(c, x, y, num, accent=SIGNAL):
    c.text(x, y, num, "dmmono", 13, accent, tracking=1.5)


# ----------------------------------------------------------------------------
# Diagram primitives
# ----------------------------------------------------------------------------
def phyllotaxis(cx, cy, n, scale, jitter=0.0, seed=1):
    rnd = random.Random(seed)
    ga = math.pi * (3 - math.sqrt(5))
    pts = []
    for i in range(n):
        r = scale * math.sqrt(i + 0.5)
        a = i * ga
        x = cx + r * math.cos(a) + (rnd.uniform(-1, 1) * jitter if jitter else 0)
        y = cy + r * math.sin(a) + (rnd.uniform(-1, 1) * jitter if jitter else 0)
        pts.append((x, y))
    return pts


def nearest_edges(pts, k=3):
    edges = set()
    for i, p in enumerate(pts):
        d = sorted(range(len(pts)),
                   key=lambda j: (pts[j][0]-p[0])**2 + (pts[j][1]-p[1])**2)
        for j in d[1:k+1]:
            edges.add((min(i, j), max(i, j)))
    return list(edges)


def degree_ring(c, cx, cy, r, accent=SIGNAL, ticks=72, labels=True):
    for i in range(ticks):
        a = math.radians(i * 360 / ticks - 90)
        major = (i % 6 == 0)
        ln = 12 if major else 6
        x0 = cx + r * math.cos(a); y0 = cy + r * math.sin(a)
        x1 = cx + (r - ln) * math.cos(a); y1 = cy + (r - ln) * math.sin(a)
        c.seg(x0, y0, x1, y1, GREY if not major else INK_SOFT, 0.8)
    c.circle(cx, cy, r, outline=HAIR, width=0.9)
    if labels:
        for deg in range(0, 360, 30):
            a = math.radians(deg - 90)
            x = cx + (r + 16) * math.cos(a); y = cy + (r + 16) * math.sin(a)
            c.text(x, y, f"{deg:03d}", "dmmono", 9, GREY, anchor="mm")
