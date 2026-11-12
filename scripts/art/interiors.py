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
}


class Room:
    def __init__(self, sheets, floor):
        self.sheets = sheets
        self.im = Image.new('RGBA', (W * R, H * R))
        self.floor(floor)
        self.wall()

    def piece(self, name):
        sheet, c, r, w, h = P[name]
        crop = self.sheets[sheet].crop((c * R, r * R, (c + w) * R, (r + h) * R))
        box = crop.getbbox()
        return crop.crop(box) if box else crop

    def put(self, name, x, y, w=None, flip=False, h=None):
        im = self.piece(name)
        if flip:
            im = im.transpose(Image.FLIP_LEFT_RIGHT)
        if w is not None or h is not None:
            width = int((w if w is not None else (h * R) * im.width / im.height / R) * R)
            height = int(h * R) if h is not None and w is not None else int(width * im.height / im.width)
            im = im.resize((max(1, width), max(1, height)), Image.LANCZOS)
        self.im.alpha_composite(im, (int(x * R - im.width / 2), int(y * R - im.height)))

    def tile(self, name, x, y):
        self.im.alpha_composite(self.piece_raw(name), (int(x * R), int(y * R)))

    def piece_raw(self, name):
        sheet, c, r, w, h = P[name]
        return self.sheets[sheet].crop((c * R, r * R, (c + w) * R, (r + h) * R))

    def floor(self, name):
        for row in range(3, H):
            for col in range(W):
                self.tile(name, col, row)

    def wall(self, windows=(2, 7)):
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
        mask = Image.new('L', self.im.size, 0)
        draw = ImageDraw.Draw(mask)
        draw.rectangle([0, 0, W * R, H * R], fill=strength)
        draw.ellipse([-W * R * 0.1, -H * R * 0.25, W * R * 1.1, H * R * 1.25], fill=0)
        mask = mask.filter(ImageFilter.GaussianBlur(R))
        self.im.alpha_composite(Image.new('RGBA', self.im.size, (15, 8, 4, 255)), (0, 0)) if False else None
        dark = Image.new('RGBA', self.im.size, (15, 8, 4, 0))
        dark.putalpha(mask)
        self.im.alpha_composite(dark)

    def door(self):
        """The way out, bottom middle (DOOR in interiors.js): a mat at the threshold."""
        self.put('mat-red', 10, 9.05, w=2.6, h=1.5)

    def save(self, path):
        self.vignette()
        self.im.convert('RGB').save(path, quality=86, optimize=True)


def pct(x, y):
    """Percent of the painting to tiles."""
    return x * W / 100, y * H / 100


def tavern(room):
    # The bar: the keeper stands at 52% x 31% (just in front of the wall), the counter in front.
    room.put('fireplace', 3, 3.4, w=1.9)
    room.put('firewood', 4.6, 3.3, w=0.7)
    room.put('clock', 7.2, 2.5, w=0.75)
    room.put('wall-shelf', 13.2, 2.2, w=1.9)
    room.put('mug', 12.7, 1.45, w=0.5)
    room.put('pot', 13.6, 1.45, w=0.45)
    room.put('barrel', 15.8, 3.3, w=0.9)
    room.put('barrel', 16.7, 3.4, w=0.9)
    room.put('counter-short', 8.9, 4.3, w=2.2)
    room.put('counter-short', 11.1, 4.3, w=2.2, flip=True)
    room.put('mug', 9.4, 3.6, w=0.45)
    room.put('pitcher', 11.6, 3.55, w=0.5)
    for (ax, ay), (bx, by) in [((23, 58), (35, 60)), ((69, 56), (81, 58)), ((9, 76), (20, 79))]:
        x1, y1 = pct(ax, ay)
        x2, y2 = pct(bx, by)
        room.put('table', (x1 + x2) / 2, max(y1, y2) + 0.2, w=1.9)
        room.put('mug', (x1 + x2) / 2 - 0.3, max(y1, y2) - 0.9, w=0.4)
        room.put('bowl', (x1 + x2) / 2 + 0.3, max(y1, y2) - 0.85, w=0.4)
        room.put('stool', x1 - 0.55, y1 + 0.35, w=0.6)
        room.put('stool', x2 + 0.55, y2 + 0.35, w=0.6)
    room.put('barrel-small', 19.3, 7.2, w=0.8)
    room.put('sack', 19.4, 8.0, w=0.8)
    room.put('flowers', 17.8, 5.0, w=0.6)
    room.door()
    room.mood((255, 170, 80, 18))


def shop(room):
    # Shelves along the back wall (hotspots), the counter on the right (keeper at 86% x 40%).
    room.put('sword-rack', 4.6, 2.9, w=0.95)
    room.put('spear-rack', 6.6, 2.9, w=0.95)
    room.put('wall-shelf', 9.4, 2.4, w=2.6)
    for i, item in enumerate(['potions', 'vials', 'potions', 'vials']):
        room.put(item, 8.5 + i * 0.6, 1.55, w=0.55)
    room.put('armor-stand', 13.0, 3.1, w=1.1)
    room.put('cupboard', 16.7, 3.2, w=2.2)
    room.put('vials', 16.2, 1.6, w=0.5)
    room.put('box', 17.2, 1.6, w=0.5)
    room.put('counter-short', 17.2, 5.0, w=2.6)
    room.put('scrolls', 16.7, 4.0, w=0.55)
    room.put('ink', 17.8, 4.0, w=0.4)
    room.put('barrel', 1.3, 4.4, w=0.9)
    room.put('sack-patched', 2.2, 4.6, w=0.8)
    room.put('satchel', 3.0, 4.7, w=0.7)
    room.put('table-long', 9.0, 7.8, w=2.6)
    room.put('onions', 8.4, 6.6, w=0.5)
    room.put('bread', 9.6, 6.6, w=0.5)
    room.put('plant', 19.3, 8.0, w=0.8)
    room.door()


def arena(room):
    # The registrar's desk on the left (18% x 39%), the history board on the right wall (78-98%),
    # the sparring mat in the middle, the bench at 12% x 64%.
    room.put('table', 3.6, 4.9, w=2.0)
    room.put('scrolls', 3.2, 3.9, w=0.5)
    room.put('ink', 4.1, 3.9, w=0.4)
    room.put('mat-red', 10, 7.4, w=7.0, h=3.9)
    room.put('frame', 17.6, 3.0, w=3.6)
    for i, (nx, ny) in enumerate([(16.6, 1.5), (17.5, 1.3), (18.4, 1.6), (17.0, 2.4), (18.1, 2.5)]):
        room.put('note', nx, ny, w=0.55)
    room.put('sword-rack', 7.0, 2.9, w=0.95)
    room.put('spear-rack', 8.2, 2.9, w=0.95)
    room.put('armor-stand', 12.6, 3.1, w=1.1)
    room.put('spear-rack', 14.0, 2.9, w=0.95)
    room.put('bench', 2.4, 6.4, w=2.6)
    room.put('barrel', 19.3, 6.3, w=0.9)
    room.put('barrel-small', 18.6, 7.0, w=0.75)
    room.door()


def herald(room):
    # The herald's desk in the middle (50% x 46%), the ranking board above it (37-63%), the records shelf right (71-92%).
    room.put('frame', 10, 3.1, w=4.6)
    for i in range(6):
        room.put('note', 8.6 + (i % 3) * 1.4, 1.5 + (i // 3) * 0.9, w=0.6)
    room.put('wall-shelf', 15.2, 1.9, w=2.4)
    room.put('wall-shelf', 15.2, 3.2, w=2.4)
    for i in range(3):
        room.put('book', 14.4 + i * 0.75, 1.15, w=0.55)
        room.put('scrolls', 14.4 + i * 0.75, 2.45, w=0.55)
    room.put('table-long', 10, 5.6, w=3.0)
    room.put('ink', 9.4, 4.4, w=0.4)
    room.put('book', 10.6, 4.45, w=0.6)
    room.put('bench', 6.0, 7.2, w=2.6)
    room.put('plant', 2.0, 4.3, w=0.9)
    room.put('clock', 4.5, 2.5, w=0.75)
    room.put('plant', 18.6, 8.6, w=0.9)
    room.door()


def house(room):
    # The founder's house at night: the hearth, the table (founder at 46% x 66%), one bed, the door on the right.
    room.put('fireplace', 3.4, 3.4, w=1.9)
    room.put('firewood', 5.0, 3.3, w=0.7)
    room.put('bed', 1.6, 7.6, w=2.4)
    room.put('table', 11.0, 6.4, w=2.0)
    room.put('candle', 10.6, 5.3, w=0.45)
    room.put('bowl', 11.4, 5.35, w=0.45)
    room.put('stool', 12.4, 6.6, w=0.6)
    room.put('wall-shelf', 8.0, 2.2, w=1.9)
    room.put('pot', 7.6, 1.45, w=0.45)
    room.put('mug', 8.4, 1.45, w=0.45)
    # The front door on the right wall: a dark doorway in a wooden frame.
    ImageDraw.Draw(room.im).rectangle([int(16.9 * R), int(2.9 * R), int(19.3 * R), int(6.8 * R)], fill=(40, 26, 18, 255))
    room.put('frame', 18.1, 6.95, w=2.8, h=4.3)
    room.put('sack', 15.4, 3.4, w=0.8)
    room.mood((14, 18, 50, 125))
    # Firelight on the left.
    glow = Image.new('RGBA', room.im.size)
    draw = ImageDraw.Draw(glow)
    draw.ellipse([0.4 * R, 0.6 * R, 7 * R, 7.5 * R], fill=(255, 150, 60, 70))
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
    ('interior.house', house, '', 'floor-oak'),
]


def compose(src_interior, src_town, key_out, out_dir):
    made = []
    town = key_out(Image.open(os.path.join(src_town, 'Town@128x128.png')).convert('RGBA'))
    cache = {}
    for asset_id, maker, palette, floor in ROOMS:
        if palette not in cache:
            cache[palette] = {
                I: key_out(Image.open(os.path.join(src_interior, f'Interior{palette}@128x128.png')).convert('RGBA')),
                I2: key_out(Image.open(os.path.join(src_interior, f'Interior 2{palette}@128x128.png')).convert('RGBA')),
                T: town,
            }
        room = Room(cache[palette], floor)
        maker(room)
        name = asset_id.split('.', 1)[1].replace('.', '-') + '.jpg'
        room.save(os.path.join(out_dir, name))
        made.append((asset_id, name))
    return made
