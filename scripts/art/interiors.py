"""Building interiors, composed from the 2D Hand Painted Interior tileset.

Each room is a painting the size of the old ones (20 x 9 tiles, drawn from the
128 px sheets: 2560 x 1152), seen from the front: the back wall (plank panels,
windows, carved posts) on the top three rows, a floor below, and furniture
placed where src/data/interiors.js puts the people, hotspots and the door
(positions there are percentages; here they are tiles: x% of 20, y% of 9).
Pieces are placed by their bottom centre: put(piece, x, y, w) stands a piece
`w` tiles wide with its foot at (x, y).
"""
import os
from PIL import Image, ImageDraw, ImageFilter

W, H = 20, 9
R = 128  # source and output tile size

# Pieces: (sheet, col, row, w, h) in tiles of the sheet.
I, I2, T = 'Interior', 'Interior 2', 'Town'
P = {
    'wall-plank': (I2, 0, 0, 2, 3), 'wall-window': (I2, 3, 0, 2, 3), 'post': (I2, 2, 0, 1, 3), 'post-carved': (I2, 5, 0, 1, 3),
    'floor-oak': (I, 1, 0, 1, 1), 'floor-light': (I, 0, 0, 1, 1), 'floor-boards': (I, 5, 0, 1, 1), 'floor-dark': (I, 7, 0, 1, 1),
    'floor-stone': (I2, 8, 0, 1, 1), 'floor-check': (I2, 9, 0, 1, 1), 'floor-diamond': (I2, 8, 1, 1, 1),
    'counter': (I, 12, 9, 4, 4), 'counter-short': (I, 12, 9, 2, 2), 'fireplace': (I, 9, 9, 2, 4), 'armor-stand': (I, 8, 9, 1, 2),
    'candle': (I, 8, 11, 1, 1), 'firewood': (I, 8, 12, 1, 1), 'cabinet': (I, 11, 10, 1, 2), 'scrolls': (I, 12, 12, 1, 1),
    'shelf-low': (I, 0, 14, 2, 2), 'cupboard': (I, 2, 14, 2, 2), 'sack': (I, 4, 14, 1, 1), 'mug': (I, 5, 14, 1, 1), 'ham': (I, 4, 15, 1, 1), 'bowl': (I, 5, 15, 1, 1),
    'table-long': (I, 6, 13, 3, 3), 'table': (I, 9, 13, 2, 3), 'barrel': (I, 11, 13, 1, 1), 'flowers': (I, 11, 14, 1, 1), 'barrel-small': (I, 11, 15, 1, 1),
    'clock': (I, 12, 13, 1, 2), 'stool': (I, 12, 15, 1, 1), 'painting': (I, 13, 15, 1, 1), 'side-table': (I, 13, 14, 1, 2), 'bed': (I, 14, 13, 2, 3),
    'potions': (I, 8, 6, 1, 1), 'sword-rack': (I, 8, 7, 1, 2), 'rug-green': (I, 13, 3, 3, 3), 'frame': (I, 11, 0, 2, 2), 'big-window': (I, 9, 6, 3, 4),
    'pitcher': (I, 9, 2, 1, 1),
    'spear-rack': (I2, 8, 4, 1, 2), 'wall-shelf': (I2, 9, 4, 2, 2), 'bench': (I2, 13, 0, 3, 2), 'plant': (I2, 10, 0, 1, 2), 'pot': (I2, 11, 0, 1, 1),
    'satchel': (I2, 8, 3, 1, 1), 'sack-patched': (I2, 8, 2, 1, 1), 'sausages': (I2, 9, 2, 1, 2), 'bread': (I2, 10, 2, 1, 1), 'box': (I2, 11, 2, 1, 1),
    'onions': (I2, 10, 3, 1, 1), 'vials': (I2, 11, 3, 1, 1), 'ink': (I2, 11, 4, 1, 1), 'book': (I2, 13, 2, 1, 1), 'note': (I2, 14, 2, 1, 1), 'side-table-2': (I2, 15, 2, 1, 3),
    'door-arch': (I2, 1, 6, 1, 4), 'door-planks': (I2, 5, 13, 1, 2),
    'mat-red': (T, 10, 6, 3, 3),
    'banner': ('ExtraObjects', 9, 8, 1, 2),
}


# Small things on tables and the floor that you can walk past (everything else on the floor is solid).
NONSOLID = {'mat-red', 'stool', 'flowers', 'mug', 'bowl', 'pitcher', 'scrolls', 'ink', 'book', 'note', 'candle', 'firewood',
            'onions', 'bread', 'vials', 'potions', 'box', 'pot', 'sack', 'satchel', 'sack-patched', 'rug-green'}
WALL_BASE = 3.05  # pieces whose foot is above this hang on the back wall


class Room:
    def __init__(self, sheets, floor, size=(20, 9)):
        self.sheets = sheets
        self.W, self.H = size
        self.front = []  # pieces drawn again above the people (a counter in front of the keeper): (box px, alpha mask)
        self.blocks = []  # [x, y, w, h] in tiles: what a walker cannot cross (walkable rooms)
        self.spots = {}  # spot id -> (x, y) tiles: where each person stands (their feet)
        self.im = Image.new('RGBA', (self.W * R, self.H * R))
        self.floor(floor)
        self.wall()

    def piece(self, name):
        sheet, c, r, w, h = P[name]
        crop = self.sheets[sheet].crop((c * R, r * R, (c + w) * R, (r + h) * R))
        box = crop.getbbox()
        return crop.crop(box) if box else crop

    def put(self, name, x, y, w=None, flip=False, h=None, front=False):
        im = self.piece(name)
        if flip:
            im = im.transpose(Image.FLIP_LEFT_RIGHT)
        if w is not None or h is not None:
            width = int((w if w is not None else (h * R) * im.width / im.height / R) * R)
            height = int(h * R) if h is not None and w is not None else int(width * im.height / im.width)
            im = im.resize((max(1, width), max(1, height)), Image.LANCZOS)
        self.im.alpha_composite(im, (int(x * R - im.width / 2), int(y * R - im.height)))
        if front:
            # Cut out again from the finished painting (save), drawn above whoever stands behind it.
            self.front.append(((int(x * R - im.width / 2), int(y * R - im.height), im.width, im.height), im.getchannel('A')))
        if name not in NONSOLID and y > WALL_BASE:
            # The footprint: the bottom of the piece, a little narrower than its picture.
            w_t, h_t = im.width / R, im.height / R
            depth = min(0.7, h_t * 0.5)
            # A tenth of a tile in from each side, so pieces set side by side (the bar) leave no gap.
            self.blocks.append([round(x - w_t / 2 + 0.1, 2), round(y - depth, 2), round(max(0.3, w_t - 0.2), 2), round(depth - 0.05, 2)])

    def tile(self, name, x, y):
        self.im.alpha_composite(self.piece_raw(name), (int(x * R), int(y * R)))

    def piece_raw(self, name):
        sheet, c, r, w, h = P[name]
        return self.sheets[sheet].crop((c * R, r * R, (c + w) * R, (r + h) * R))

    def floor(self, name):
        for row in range(3, self.H):
            for col in range(self.W):
                self.tile(name, col, row)

    def wall(self, windows=None):
        W = self.W
        windows = windows if windows is not None else ((2, 7) if W >= 16 else (1,))
        for seg in range(W // 2):
            self.tile('wall-window' if seg in windows else 'wall-plank', seg * 2, 0)
        # Carved posts every four tiles, so the wall reads as panels, not a fence.
        for seg in range(0, W // 2 + 1, 2):
            post = self.piece_raw('post-carved')
            self.im.alpha_composite(post, (int((seg * 2 - 0.5) * R), 0))
        # A soft shadow where the wall meets the floor.
        shade = Image.new('RGBA', (W * R, R // 2))
        draw = ImageDraw.Draw(shade)
        for i in range(R // 2):
            draw.line([(0, i), (W * R, i)], fill=(20, 10, 5, int(110 * (1 - i / (R / 2)))))
        self.im.alpha_composite(shade, (0, 3 * R))

    def mood(self, rgba):
        self.im.alpha_composite(Image.new('RGBA', self.im.size, rgba))

    def vignette(self, strength=110):
        W, H = self.W, self.H
        mask = Image.new('L', self.im.size, 0)
        draw = ImageDraw.Draw(mask)
        draw.rectangle([0, 0, W * R, H * R], fill=strength)
        draw.ellipse([-W * R * 0.1, -H * R * 0.25, W * R * 1.1, H * R * 1.25], fill=0)
        mask = mask.filter(ImageFilter.GaussianBlur(R))
        self.im.alpha_composite(Image.new('RGBA', self.im.size, (15, 8, 4, 255)), (0, 0)) if False else None
        dark = Image.new('RGBA', self.im.size, (15, 8, 4, 0))
        dark.putalpha(mask)
        self.im.alpha_composite(dark)

    def spot(self, spot_id, x, y, seat=None):
        """A person's place; `seat` draws a stool (or bench) under them, so they sit at a table."""
        if seat:
            self.put(seat, x, y + 0.2, w=0.62 if seat == 'stool' else None)
        self.spots[spot_id] = (x, y)

    def door(self):
        """The way out, bottom middle (DOOR in interiors.js): a mat at the threshold."""
        self.put('mat-red', self.W / 2, self.H + 0.05, w=2.6, h=1.5)

    def save(self, path):
        """Writes the painting, and each front piece as a PNG beside it: returns [(file, [x, y, w, h] tiles)]."""
        self.vignette()
        self.im.convert('RGB').save(path, quality=86, optimize=True)
        fronts = []
        for n, ((x, y, w, h), alpha) in enumerate(self.front):
            piece = self.im.crop((x, y, x + w, y + h))
            piece.putalpha(alpha)
            name = path.rsplit('.', 1)[0] + f'-front{n}.png'
            piece.save(name, optimize=True)
            fronts.append((os.path.basename(name), [round(x / R, 3), round(y / R, 3), round(w / R, 3), round(h / R, 3)]))
        return fronts


def pct(x, y):
    """Percent of the painting to tiles."""
    return x * W / 100, y * H / 100


def tavern(room):
    # The keeper behind the bar (back middle); three tables, a guest on a stool at each side; a corner by the barrels.
    room.put('fireplace', 2.6, 3.4, w=1.9)
    room.put('firewood', 4.2, 3.3, w=0.7)
    room.put('wall-shelf', 15.0, 2.2, w=2.0)
    room.put('mug', 14.5, 1.45, w=0.5)
    room.put('pot', 15.5, 1.45, w=0.45)
    # The keeper stands behind the bar (between it and the wall); the bar is drawn over their legs.
    room.spot('bar', 10, 4.05)
    room.put('counter-short', 8.95, 5.0, w=2.2, front=True)
    room.put('counter-short', 11.05, 5.0, w=2.2, flip=True, front=True)
    room.put('mug', 9.2, 4.3, w=0.45, front=True)
    room.put('pitcher', 11.6, 4.25, w=0.5, front=True)
    # Behind the bar: casks on a rack and a shelf of bottles.
    room.put('barrel', 7.0, 3.35, w=0.9)
    room.put('barrel', 13.0, 3.35, w=0.9)
    room.put('wall-shelf', 10.0, 2.25, w=2.0)
    room.put('vials', 9.6, 1.5, w=0.45)
    room.put('pot', 10.5, 1.5, w=0.45)
    room.put('banner', 5.6, 2.6, w=0.8)
    room.put('banner', 14.4, 2.6, w=0.8)
    room.put('candle', 17.5, 3.25, w=0.5)
    for (cx, cy), (a, b) in [((5.0, 6.3), ('t1a', 't1b')), ((15.0, 6.3), ('t2a', 't2b')), ((5.0, 8.7), ('t3a', 't3b'))]:
        room.put('table', cx, cy, w=1.6)
        room.put('mug', cx - 0.25, cy - 1.35, w=0.4)
        room.spot(a, cx - 1.35, cy - 0.35, seat='stool')
        room.spot(b, cx + 1.35, cy - 0.35, seat='stool')
    room.put('barrel', 18.3, 7.6, w=0.9)
    room.put('barrel', 19.2, 7.9, w=0.9)
    room.spot('corner', 17.2, 8.2)
    room.door()
    room.mood((255, 170, 80, 18))


def shop(room):
    # Shelves along the back wall (hotspots), the keeper behind the counter on the right, two browsing spots.
    room.put('sword-rack', 4.6, 2.9, w=0.95)
    room.put('spear-rack', 6.6, 2.9, w=0.95)
    room.put('wall-shelf', 9.4, 2.4, w=2.6)
    for i, item in enumerate(['potions', 'vials', 'potions', 'vials']):
        room.put(item, 8.5 + i * 0.6, 1.55, w=0.55)
    room.put('armor-stand', 13.0, 3.1, w=1.1)
    room.put('cupboard', 16.7, 3.2, w=2.2)
    room.spot('counter', 17.2, 3.6)
    room.put('counter-short', 17.2, 5.1, w=2.6)
    room.put('barrel', 1.3, 4.4, w=0.9)
    room.put('sack-patched', 2.2, 4.6, w=0.8)
    room.spot('browse-1', 6.0, 5.2)
    room.spot('browse-2', 11.5, 5.2)
    room.put('plant', 19.3, 8.6, w=0.8)
    room.door()


def arena(room):
    # The registrar behind her desk on the left, the history board on the right wall,
    # the sparring mat in the middle (a fighter on it, two sparring), a bench to watch from.
    room.spot('desk', 3.6, 3.2)
    room.put('counter-short', 3.6, 4.6, w=2.2)
    room.put('scrolls', 3.2, 3.85, w=0.5)
    room.put('mat-red', 10, 7.6, w=7.0, h=3.9)
    room.spot('ground', 10, 5.4)
    room.spot('spar-1', 8.2, 6.9)
    room.spot('spar-2', 11.8, 6.9)
    room.put('frame', 17.6, 3.0, w=3.6)
    for nx, ny in [(16.6, 1.5), (17.5, 1.3), (18.4, 1.6), (17.0, 2.4), (18.1, 2.5)]:
        room.put('note', nx, ny, w=0.55)
    room.put('sword-rack', 7.0, 2.9, w=0.95)
    room.put('spear-rack', 8.2, 2.9, w=0.95)
    room.put('armor-stand', 12.6, 3.1, w=1.1)
    room.put('bench', 2.6, 7.0, w=2.6)
    room.spot('bench', 2.6, 6.75)
    room.spot('spar-3', 15.2, 7.6)
    room.spot('spar-4', 4.8, 8.4)
    room.put('barrel', 19.3, 6.3, w=0.9)
    room.door()


def herald(room):
    # The herald behind the desk under the ranking board; the records shelf on the right; a waiting bench.
    room.put('frame', 10, 3.1, w=4.6)
    for i in range(6):
        room.put('note', 8.6 + (i % 3) * 1.4, 1.5 + (i // 3) * 0.9, w=0.6)
    room.put('wall-shelf', 15.4, 1.9, w=2.4)
    room.put('wall-shelf', 15.4, 3.2, w=2.4)
    for i in range(3):
        room.put('book', 14.6 + i * 0.75, 1.15, w=0.55)
        room.put('scrolls', 14.6 + i * 0.75, 2.45, w=0.55)
    room.spot('desk', 10, 3.6)
    room.put('counter-short', 8.95, 4.95, w=2.2)
    room.put('counter-short', 11.05, 4.95, w=2.2, flip=True)
    room.put('ink', 9.4, 4.25, w=0.4)
    room.put('bench', 5.2, 7.3, w=2.6)
    room.spot('bench', 5.2, 7.05)
    room.spot('door-side', 15.8, 7.4)
    room.put('plant', 2.0, 4.3, w=0.9)
    room.put('plant', 18.6, 8.6, w=0.9)
    room.door()


def temple(room):
    # Dawnwatch Temple: the altar under the big window, candles, two rows of pews, a priestess at the altar.
    room.put('big-window', 10, 3.0, w=3.4)
    room.put('banner', 6.4, 3.0, w=0.9)
    room.put('banner', 13.6, 3.0, w=0.9)
    room.spot('altar', 10, 3.5)
    room.put('table-long', 10, 5.2, w=3.0)
    room.put('candle', 9.0, 3.65, w=0.45)
    room.put('candle', 11.0, 3.65, w=0.45)
    room.put('book', 10.0, 3.7, w=0.55)
    for y in (6.6, 8.1):
        room.put('bench', 6.0, y, w=2.8)
        room.put('bench', 14.0, y, w=2.8)
    room.spot('pew-1', 5.4, 6.35)
    room.spot('pew-2', 14.6, 6.35)
    room.spot('pew-3', 6.6, 7.85)
    room.put('candle', 2.0, 4.2, w=0.5)
    room.put('candle', 18.0, 4.2, w=0.5)
    room.put('plant', 1.6, 8.6, w=0.9)
    room.put('plant', 18.4, 8.6, w=0.9)
    room.door()
    room.mood((255, 230, 180, 22))


def priory(room):
    # The priests' house: a hearth, a table where Brother Tamas sits, two cots, shelves of jars.
    room.put('fireplace', 3.0, 3.4, w=1.9)
    room.put('firewood', 4.6, 3.3, w=0.7)
    room.put('wall-shelf', 9.0, 2.2, w=2.0)
    room.put('vials', 8.5, 1.45, w=0.45)
    room.put('pot', 9.5, 1.45, w=0.45)
    room.put('table', 10, 6.4, w=1.7)
    room.put('bowl', 9.75, 5.0, w=0.4)
    room.put('candle', 10.3, 5.0, w=0.4)
    room.spot('table', 8.6, 6.05, seat='stool')
    room.spot('hearth', 5.2, 4.6)
    room.put('bed', 16.0, 6.4, w=2.0)
    room.put('bed', 18.6, 6.4, w=2.0)
    room.spot('cot', 17.3, 7.6)
    room.put('sack', 1.6, 8.4, w=0.8)
    room.put('barrel', 2.6, 8.6, w=0.85)
    room.door()


def house(room):
    # The founder's house (prologue): one small room at night. The bed by the hearth, a table with a candle,
    # a chest, the door (mat) at the bottom. 10 x 7 tiles.
    room.put('fireplace', 2.0, 3.4, w=1.9)
    room.put('firewood', 3.5, 3.3, w=0.7)
    room.put('wall-shelf', 7.4, 2.2, w=1.8)
    room.put('pot', 7.0, 1.45, w=0.45)
    room.put('mug', 7.8, 1.45, w=0.45)
    room.put('bed', 1.5, 6.1, w=2.2)
    room.put('table', 7.6, 5.4, w=1.6)
    room.put('candle', 7.3, 4.35, w=0.4)
    room.put('bowl', 7.9, 4.4, w=0.4)
    room.put('stool', 6.3, 5.5, w=0.6)
    room.put('sack', 9.2, 3.5, w=0.7)
    room.spot('founder', 3.6, 5.2)
    room.spot('rook', 5.0, 6.4)
    room.door()
    room.mood((14, 18, 50, 120))
    # Firelight on the left.
    glow = Image.new('RGBA', room.im.size)
    draw = ImageDraw.Draw(glow)
    draw.ellipse([-1 * R, 0.4 * R, 6 * R, 7 * R], fill=(255, 150, 60, 80))
    room.im.alpha_composite(glow.filter(ImageFilter.GaussianBlur(R)))


ROOMS = [
    # (asset id, maker, palette, floor)
    ('interior.tavern', tavern, '', 'floor-oak'),
    ('interior.inn.greenhollow', tavern, ' Color 2', 'floor-light'),
    ('interior.inn.ironford', tavern, ' Color 3', 'floor-stone'),
    ('interior.inn.windmere', tavern, ' Color 2', 'floor-oak'),
    ('interior.shop', shop, '', 'floor-oak'),
    ('interior.arena', arena, '', 'floor-stone'),
    ('interior.arena.dunmere', arena, '', 'floor-stone'),
    ('interior.arena.greenhollow', arena, ' Color 2', 'floor-stone'),
    ('interior.arena.ironford', arena, ' Color 3', 'floor-stone'),
    ('interior.arena.windmere', arena, ' Color 2', 'floor-diamond'),
    ('interior.herald', herald, '', 'floor-check'),
    ('interior.house', house, '', 'floor-oak', (10, 7)),
    ('interior.temple', temple, '', 'floor-diamond'),
    ('interior.priory', priory, ' Color 2', 'floor-oak'),
]


def compose(src_interior, src_town, key_out, out_dir, src_extra=None):
    made = []
    town = key_out(Image.open(os.path.join(src_town, 'Town@128x128.png')).convert('RGBA'))
    extra = key_out(Image.open(os.path.join(src_extra, 'ExtraObjects@128x128.png')).convert('RGBA')) if src_extra else None
    cache = {}
    for asset_id, maker, palette, floor, *size in ROOMS:
        if palette not in cache:
            cache[palette] = {
                I: key_out(Image.open(os.path.join(src_interior, f'Interior{palette}@128x128.png')).convert('RGBA')),
                I2: key_out(Image.open(os.path.join(src_interior, f'Interior 2{palette}@128x128.png')).convert('RGBA')),
                T: town,
                'ExtraObjects': extra,
            }
        room = Room(cache[palette], floor, *size)
        maker(room)
        name = asset_id.split('.', 1)[1].replace('.', '-') + '.jpg'
        fronts = room.save(os.path.join(out_dir, name))
        spots = {k: [round(x * 100 / room.W, 1), round(y * 100 / room.H, 1)] for k, (x, y) in room.spots.items()}
        made.append((asset_id, name, room.blocks, spots, (room.W, room.H), fronts))
    return made
