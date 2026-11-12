"""The world map: a painted parchment map, 2400 x 1500 (8:5, like the map plane).

    python3 scripts/art/worldmap.py [path/to/my-art]

An old ink-on-parchment map (in the manner of the maps in classic fantasy
novels): land is grown around the places in src/data/world.js (their x/y are
percents of the map), so every town stands on land; the sea is what is left, a
shade darker, with echoing coast lines. Mountains are inked, hatched peaks,
forests little inked crowns (pines in the cold north and the Veil), rivers ink
lines, a compass rose, a vignette and a double border. Only parchment and ink.
Deterministic (a fixed seed). Writes public/art/packs/myart/worldmap.jpg.
Needs numpy and Pillow.
"""
import json, math, os, re, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.dirname(os.path.dirname(HERE))
ART = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(GAME, '..', 'my-art'))
W, H = 2400, 1500
rng = np.random.default_rng(1187)


def places():
    src = open(os.path.join(GAME, 'src', 'data', 'world.js')).read()
    out = []
    for m in re.finditer(r"id: '([a-z-]+)',\n    name: '([^']+)',\n    region: '([^']+)',\n    tier: '([^']+)'[\s\S]*?x: (\d+),\n    y: (\d+)", src):
        pid, name, region, tier, x, y = m.groups()
        out.append(dict(id=pid, name=name, region=region, x=int(x) / 100 * W, y=int(y) / 100 * H))
    return out


def noise(scale, octaves=5):
    """Smooth value noise in [0, 1], W x H."""
    total = np.zeros((H, W))
    amp, norm = 1.0, 0.0
    for o in range(octaves):
        cells = (max(2, int(W / scale * 2 ** o)), max(2, int(H / scale * 2 ** o)))
        grid = rng.random((cells[1] + 1, cells[0] + 1))
        im = Image.fromarray((grid * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)
        total += np.asarray(im, dtype=float) / 255 * amp
        norm += amp
        amp *= 0.5
    return total / norm


PL = places()
yy, xx = np.mgrid[0:H, 0:W]

# ---------------------------------------------------------------- land
land = np.zeros((H, W))
for p in PL:
    d = np.hypot(xx - p['x'], (yy - p['y']) * 1.15)
    land = np.maximum(land, np.exp(-(d / 215) ** 2))
n = noise(520)
bays = noise(170, 4)
field = land * 0.9 + n * 0.42 + (bays - 0.5) * 0.5 - 0.52
# keep a sea margin round the edges, a little ragged
# land runs along every road (src/data/roads.js) and the main route east, so roads never cross the sea
BYID = {p['id']: p for p in PL}
links = re.findall(r"ends: \['([a-z-]+)', '([a-z-]+)'\]", open(os.path.join(GAME, 'src', 'data', 'roads.js')).read())
chain = ['windmere', 'tidecross', 'sunspire', 'mooncourt', 'thornwatch']
links += list(zip(chain, chain[1:]))
for a, b in links:
    if a not in BYID or b not in BYID:
        continue
    ax, ay, bx, by = BYID[a]['x'], BYID[a]['y'], BYID[b]['x'], BYID[b]['y']
    vx, vy = bx - ax, by - ay
    t = np.clip(((xx - ax) * vx + (yy - ay) * vy) / (vx * vx + vy * vy), 0, 1)
    dist = np.hypot(xx - (ax + t * vx), yy - (ay + t * vy))
    field += 0.55 * np.exp(-(dist / 80) ** 2)
edge = np.minimum.reduce([xx, W - xx, yy, H - yy]) / 230.0
field -= np.clip(1 - edge, 0, 1) * 0.6
is_land = field > 0
# a channel cuts the Storm Isles off from the mainland
channel = np.abs(xx - (0.76 * W + (noise(200, 3) - 0.5) * 420 + np.sin(yy / 90) * 30)) < 30
is_land &= ~(channel & (yy > 0.18 * H) & (yy < 0.86 * H))

# ---------------------------------------------------------------- parchment (one colour; ink does the rest)
pts = np.array([[p['x'], p['y']] for p in PL])
regs = [p['region'] for p in PL]
idx = np.zeros((H, W), dtype=int)
best = np.full((H, W), 1e12)
for i, (px, py) in enumerate(pts):
    d = (xx - px) ** 2 + (yy - py) ** 2
    closer = d < best
    best[closer] = d[closer]
    idx[closer] = i
paper = np.array([233, 214, 172], dtype=float)
grain = noise(40, 4)[..., None]
stain = noise(320, 3)[..., None]
base = paper * (0.9 + grain * 0.12) * (0.94 + stain * 0.1)
# the sea: the same parchment, a shade darker and greyer
sea_tone = np.array([214, 200, 168], dtype=float)
img = np.where(is_land[..., None], base, sea_tone * (0.9 + grain * 0.12) * (0.94 + stain * 0.1))
canvas = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert('RGBA')
draw = ImageDraw.Draw(canvas, 'RGBA')
INK = (38, 30, 22, 255)
GREY = (96, 84, 70, 255)

# ---------------------------------------------------------------- coastline: ink line, with fading echo lines out to sea
mask = Image.fromarray((is_land * 255).astype(np.uint8))
def ring(grow):
    a = np.asarray(mask.filter(ImageFilter.MaxFilter(grow)), dtype=bool)
    b = np.asarray(mask.filter(ImageFilter.MaxFilter(max(1, grow - 2))), dtype=bool)
    return a & ~b
layer = np.zeros((H, W, 4), dtype=np.uint8)
coast = is_land & ~np.asarray(mask.filter(ImageFilter.MinFilter(5)), dtype=bool)
layer[coast] = INK
for grow, alpha in [(15, 120), (27, 80), (41, 45)]:
    layer[ring(grow) & ~is_land] = (60, 50, 40, alpha)
canvas.alpha_composite(Image.fromarray(layer, 'RGBA'))
# sea: short ink strokes, sparse
for _ in range(1400):
    x, y = int(rng.integers(0, W)), int(rng.integers(0, H))
    if not is_land[y, x] and field[y, x] < -0.12:
        draw.arc([x - 12, y - 3, x + 12, y + 3], 200, 340, fill=(70, 58, 44, 90), width=2)

# ---------------------------------------------------------------- mountains: inked peaks, shaded on one side
ridges = noise(200, 4)
peaks = []
for _ in range(3000):
    x, y = int(rng.integers(30, W - 30)), int(rng.integers(30, H - 30))
    if is_land[y, x] and ridges[y, x] > 0.665 and all(math.hypot(x - p['x'], y - p['y']) > 110 for p in PL):
        if all(math.hypot(x - a, y - b) > 30 for a, b in peaks[-60:]):
            peaks.append((x, y))
peaks.sort(key=lambda p: p[1])
for x, y in peaks:
    s = int(20 + (ridges[y, x] - 0.665) * 160)
    top = (x + int(s * 0.1), y - int(s * 1.2))
    draw.polygon([(x - s, y), top, (x + s, y)], fill=tuple(int(c) for c in base[min(H - 1, y), x]) + (255,))
    for k in range(1, 6):
        fx = top[0] + (s - (top[0] - x)) * k / 6
        draw.line([top, (fx, y)], fill=(80, 68, 54, 150), width=2)
    draw.line([(x - s, y), top, (x + s, y)], fill=INK, width=3, joint='curve')

# ---------------------------------------------------------------- forests: little inked crowns, packed together
woods = noise(160, 4)
spots = []
for _ in range(16000):
    x, y = int(rng.integers(20, W - 20)), int(rng.integers(40, H - 10))
    if not is_land[y, x] or woods[y, x] < 0.57 or ridges[y, x] > 0.6:
        continue
    if regs[idx[y, x]] in ('Sun Kingdoms',):
        continue
    if any(math.hypot(x - p['x'], y - p['y']) < 70 for p in PL) or math.hypot(x - (W - 230), y - (H - 230)) < 170:
        continue
    spots.append((x, y, regs[idx[y, x]]))
spots.sort(key=lambda s: s[1])
for x, y, reg in spots[::2]:
    r = 9 + (x * 13 + y * 7) % 5
    fill = tuple(int(c) for c in base[y, x]) + (255,)
    if reg in ('Frost Frontier', 'The Far Veil'):
        # pines
        draw.polygon([(x - r, y), (x, y - r * 2.4), (x + r, y)], fill=fill, outline=INK)
    else:
        draw.ellipse([x - r, y - r * 2, x + r, y], fill=fill, outline=INK, width=2)
        draw.arc([x - r + 3, y - r * 2 + 4, x + r - 2, y - 2], 20, 140, fill=GREY, width=2)
    draw.line([(x, y), (x, y + 5)], fill=INK, width=2)

# ---------------------------------------------------------------- rivers: from a mountain range, winding to the nearest coast
sea_pts = [(x, y) for x, y in zip(rng.integers(0, W, 6000), rng.integers(0, H, 6000)) if not is_land[y, x]]
for k, (sx, sy) in enumerate(peaks[::max(1, len(peaks) // 7)][:7]):
    tx, ty = min(sea_pts, key=lambda q: (q[0] - sx) ** 2 + (q[1] - sy) ** 2)
    length = math.hypot(tx - sx, ty - sy)
    if length < 120 or length > 900:
        continue
    nx, ny = -(ty - sy) / length, (tx - sx) / length
    path = []
    steps = int(length / 8)
    for t in range(steps + 1):
        f = t / steps
        wob = math.sin(f * math.pi * 3 + k) * 26 * math.sin(f * math.pi) + math.sin(f * math.pi * 7 + k * 2) * 8
        x, y = sx + (tx - sx) * f + nx * wob, sy + (ty - sy) * f + ny * wob
        path.append((x, y))
        if not is_land[int(min(H - 1, max(0, y))), int(min(W - 1, max(0, x)))]:
            break
    for a, b in zip(path, path[1:]):
        width = 2 + int(3 * path.index(a) / max(1, len(path)))
        draw.line([a, b], fill=INK, width=width)

# ---------------------------------------------------------------- compass rose, vignette, border
cx, cy, R = W - 230, H - 230, 120
for a in range(0, 360, 45):
    rad = math.radians(a)
    long = R if a % 90 == 0 else R * 0.6
    tip = (cx + math.sin(rad) * long, cy - math.cos(rad) * long)
    left = (cx + math.sin(rad - 0.25) * R * 0.18, cy - math.cos(rad - 0.25) * R * 0.18)
    right = (cx + math.sin(rad + 0.25) * R * 0.18, cy - math.cos(rad + 0.25) * R * 0.18)
    draw.polygon([left, tip, (cx, cy)], fill=INK)
    draw.polygon([right, tip, (cx, cy)], fill=tuple(int(c) for c in paper) + (255,), outline=INK)
draw.ellipse([cx - R * 0.75, cy - R * 0.75, cx + R * 0.75, cy + R * 0.75], outline=INK, width=2)
vig = np.hypot((xx - W / 2) / (W / 2), (yy - H / 2) / (H / 2))
vv = np.zeros((H, W, 4), dtype=np.uint8)
vv[..., 0], vv[..., 1], vv[..., 2] = 70, 48, 22
vv[..., 3] = (np.clip(vig - 0.6, 0, 1) * 320).clip(0, 160).astype(np.uint8)
canvas.alpha_composite(Image.fromarray(vv, 'RGBA'))
border = ImageDraw.Draw(canvas)
border.rectangle([10, 10, W - 11, H - 11], outline=INK, width=6)
border.rectangle([26, 26, W - 27, H - 27], outline=INK, width=2)

out = os.path.join(GAME, 'public', 'art', 'packs', 'myart', 'worldmap.jpg')
canvas.convert('RGB').save(out, quality=86, optimize=True)
print('wrote', out, os.path.getsize(out) // 1024, 'KB')
