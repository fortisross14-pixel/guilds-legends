"""Composes the art test town and tavern from the Arex V "Medieval Fantasy" pack.

Dev-time tool (Python 3 + Pillow): reads the original sheets in
public/art/packs/arex-medieval/{tiles,animations}, writes 2x images to
public/art/packs/arex-medieval/test/ and the layout (props, collision blocks,
doors, people) to src/data/artTest/layout.json, which src/data/artTest/index.js
turns into walkable maps.

    python3 scripts/art-test/compose_arex.py

Tile coordinates below are (column, row) on the 16 px grid of each sheet.
"""
import json
import os
import random

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PACK = os.path.join(ROOT, 'public', 'art', 'packs', 'arex-medieval')
OUT = os.path.join(PACK, 'test')
LAYOUT = os.path.join(ROOT, 'src', 'data', 'artTest', 'layout.json')
T = 16  # native tile
S = 2  # output scale (the game's walkable grid is 32 px)

SHEETS = {}


def sheet(name):
    if name not in SHEETS:
        folder = 'animations' if name.startswith('Fantasy_Char') or name in ('Fantasy_Doors', 'Fantasy_Chests', 'Fantasy_Rabbits', 'Fantasy_Objects', 'Fantasy_Gate') else 'tiles'
        SHEETS[name] = Image.open(os.path.join(PACK, folder, f'{name}.png')).convert('RGBA')
    return SHEETS[name]


def tile(name, col, row, w=1, h=1):
    return sheet(name).crop((col * T, row * T, (col + w) * T, (row + h) * T))


def px(name, x, y, w, h):
    return sheet(name).crop((x, y, x + w, y + h))


def up(image):
    return image.resize((image.width * S, image.height * S), Image.NEAREST)


def save(image, filename):
    os.makedirs(OUT, exist_ok=True)
    up(image).save(os.path.join(OUT, filename))
    return f'art/packs/arex-medieval/test/{filename}'


# ------------------------------------------------------------------ ground

AUTO = 'Fantasy_Autotiles'
FLOORS = 'Fantasy_Floors'
GRASS_FILL = [(FLOORS, 5, 4)] * 6 + [(FLOORS, 6, 4), (FLOORS, 5, 3)]
# 9-slice patches inside grass: (sheet, left col, top row) of a 3x3 block whose centre is the patch terrain.
PATCH = {'dirt': (AUTO, 0, 12), 'stone': (AUTO, 0, 9)}


def paint_patch(canvas, kind, x0, y0, w, h):
    name, c0, r0 = PATCH[kind]
    for ty in range(h):
        for tx in range(w):
            cx = 0 if tx == 0 else 2 if tx == w - 1 else 1
            cy = 0 if ty == 0 else 2 if ty == h - 1 else 1
            canvas.alpha_composite(tile(name, c0 + cx, r0 + cy), ((x0 + tx) * T, (y0 + ty) * T))


def ground(cols, rows, patches, seed=7):
    rng = random.Random(seed)
    canvas = Image.new('RGBA', (cols * T, rows * T))
    for ty in range(rows):
        for tx in range(cols):
            name, c, r = rng.choice(GRASS_FILL)
            canvas.alpha_composite(tile(name, c, r), (tx * T, ty * T))
    for kind, x0, y0, w, h in patches:
        paint_patch(canvas, kind, x0, y0, w, h)
    return canvas


# ------------------------------------------------------------------ buildings

ABOVE = 'Fantasy_Above_Tiles'
WALLS = 'Fantasy_Walls'
DOORS = 'Fantasy_Doors'
ROOF = {'orange': (ABOVE, 9, 20)}  # 3 cols x 5 rows: left edge, repeatable middle, right edge
WALL = {'brick': (9, 3), 'stone': (3, 3), 'wood': (6, 0), 'plaster': (12, 3), 'planks': (3, 0)}  # 3x3 blocks on the walls sheet
WINDOW = {'plain': (1, 21), 'arched': (5, 21), 'pale': (4, 21)}
DOOR = {'wood': 1, 'window': 2, 'plank': 3, 'arch': 4, 'archwindow': 6}
ROOF_ROWS = 5
WALL_ROWS = 2


ROOF_X, ROOF_W, ROOF_H = 9 * T + 11, 26, 75  # the shingle slab on Above_Tiles (9,20): 26 x 75 px
ROOF_EDGE = 4
WALL_TOP = ROOF_H - 3  # the wall starts just under the eave


def roof(width_px):
    """The slab sliced into left edge, repeating middle and right edge, to any width."""
    img = Image.new('RGBA', (width_px, ROOF_H))
    base_y = 20 * T
    left = px(ABOVE, ROOF_X, base_y, ROOF_EDGE, ROOF_H)
    right = px(ABOVE, ROOF_X + ROOF_W - ROOF_EDGE, base_y, ROOF_EDGE, ROOF_H)
    middle = px(ABOVE, ROOF_X + ROOF_EDGE, base_y, ROOF_W - 2 * ROOF_EDGE, ROOF_H)
    img.alpha_composite(left, (0, 0))
    x = ROOF_EDGE
    while x < width_px - ROOF_EDGE:
        piece = middle.crop((0, 0, min(middle.width, width_px - ROOF_EDGE - x), ROOF_H))
        img.alpha_composite(piece, (x, 0))
        x += piece.width
    img.alpha_composite(right, (width_px - ROOF_EDGE, 0))
    return img


def building(width, wall='brick', door='wood', windows=('plain',), sign=None):
    """A front-facing building: a shingle roof over a two-row wall with a door."""
    height_px = WALL_TOP + WALL_ROWS * T
    img = Image.new('RGBA', (width * T, height_px))
    wc, wr = WALL[wall]
    for ty in range(WALL_ROWS):
        for tx in range(width):
            cx = 0 if tx == 0 else 2 if tx == width - 1 else 1
            img.alpha_composite(tile(WALLS, wc + cx, wr + 1 + ty), (tx * T, WALL_TOP + ty * T))
    img.alpha_composite(roof(width * T), (0, 0))
    door_col = width // 2
    img.alpha_composite(tile(DOORS, DOOR[door], 0, 1, 2), (door_col * T, WALL_TOP))
    spots = [c for c in range(1, width - 1) if abs(c - door_col) >= 2]
    for i, col in enumerate(spots):
        kind = windows[i % len(windows)]
        wc2, wr2 = WINDOW[kind]
        img.alpha_composite(px(ABOVE, wc2 * T, wr2 * T, T, 26), (col * T, WALL_TOP + 2))
    if sign:
        img.alpha_composite(px(ABOVE, 7 * T, 22 * T, T, 20), ((door_col + 1) * T, WALL_TOP - 14))
    return img, door_col, DOOR[door]


# ------------------------------------------------------------------ props (col, row, w, h on Above_Tiles) and their foot blocks

PROPS = {
    'pine': ((16, 16, 3, 3), (1, 2, 1, 1)),
    'oak': ((19, 16, 3, 3), (1, 2, 1, 1)),
    'pine2': ((22, 16, 2, 3), (0.5, 2, 1, 1)),
    'bush': ((21, 19, 1, 1), (0, 0.5, 1, 0.5)),
    'bush2': ((16, 22, 2, 2), (0.25, 1, 1.5, 1)),
    'rocks': ((25, 16, 2, 2), (0, 1, 2, 1)),
    'well': ((0, 17, 2, 2), (0, 1, 2, 1)),
    'board': ((7, 24, 2, 2), (0, 1.5, 2, 0.5)),
    'signpost': ((8, 22, 1, 2), (0.25, 1.5, 0.5, 0.5)),
    'cart': ((16, 26, 3, 3), (0, 1, 3, 2)),
    'hay': ((16, 29, 3, 3), (0, 1, 3, 2)),
    'stall': ((5, 26, 3, 4), (0, 2, 3, 2)),
    'flowers': ((16, 24, 2, 1), None),
    'mushrooms': ((22, 21, 2, 1), None),
}


def prop_image(kind):
    (c, r, w, h), _ = PROPS[kind]
    return tile(ABOVE, c, r, w, h)


# ------------------------------------------------------------------ characters

CHAR_SHEET = 'Fantasy_Characters1'
CW, CH = 24, 32


def character(index):
    """Character `index` (0-31) as its own 3x4 sheet: rows down, left, right, up."""
    col = index % 4
    row = index // 4
    return px(CHAR_SHEET, col * CW * 3, row * CH * 4, CW * 3, CH * 4)


def door_sheet(col):
    """One door's opening frames (4 frames, 16x32 each) side by side."""
    frames = Image.new('RGBA', (T * 4, T * 2))
    for i in range(4):
        frames.alpha_composite(tile(DOORS, col, i * 2, 1, 2), (i * T, 0))
    return frames


# ------------------------------------------------------------------ the town

def compose_town(layout, assets):
    cols, rows = 40, 28
    patches = [
        ('stone', 11, 9, 18, 10),  # the square
        ('dirt', 18, 0, 4, 9),  # road north to the Guild Hall
        ('dirt', 0, 13, 11, 3),  # the Old Road, west
        ('dirt', 29, 13, 11, 3),  # east road
        ('dirt', 18, 19, 4, 9),  # road south
    ]
    assets.append({'id': 'arex.town.ground', 'path': save(ground(cols, rows, patches), 'town-ground.png'), 'w': cols * T * S, 'h': rows * T * S, 'use': 'Art test town: ground'})
    buildings = [
        # id, label, x, y (tiles, top-left), width, wall, door, windows, sign, building kind
        ('tavern', 'The Wayfarer', 3, 2, 8, 'brick', 'window', ('plain',), True, 'tavern'),
        ('hall', 'Guild Hall', 15, 1, 10, 'stone', 'arch', ('arched',), False, 'guildHall'),
        ('shop', 'Mira’s Supply', 30, 3, 7, 'planks', 'wood', ('plain',), True, 'shop'),
        ('herald', 'Herald’s Office', 3, 18, 7, 'plaster', 'plank', ('pale',), False, 'herald'),
        ('arena', 'Dunmere Arena', 29, 18, 9, 'stone', 'archwindow', ('arched',), False, 'arena'),
    ]
    props, blocks, doors = [], [], []
    for bid, label, bx, by, width, wall, door, windows, sign, kind in buildings:
        img, door_col, door_sheet_col = building(width, wall, door, windows, sign)
        path = save(img, f'building-{bid}.png')
        asset_id = f'arex.building.{bid}'
        assets.append({'id': asset_id, 'path': path, 'w': img.width * S, 'h': img.height * S, 'use': f'Art test town: {label}'})
        props.append({'asset': asset_id, 'x': bx * T * S, 'y': by * T * S, 'w': img.width * S, 'h': img.height * S})
        blocks.append({'x': bx * T * S, 'y': by * T * S + 24 * S, 'w': width * T * S, 'h': img.height * S - 24 * S})
        door_id = f'arex.door.{door}'
        if not any(a['id'] == door_id for a in assets):
            assets.append({'id': door_id, 'path': save(door_sheet(door_sheet_col), f'door-{door}.png'), 'w': T * 4 * S, 'h': T * 2 * S, 'use': f'Art test: {door} door, 4 opening frames', 'sheet': {'frameWidth': T * S, 'frameHeight': T * 2 * S}})
        dx = (bx + door_col) * T * S
        dy = by * T * S + WALL_TOP * S
        doors.append({'id': f'door:{bid}', 'name': label, 'building': kind, 'asset': door_id, 'x': dx + T * S // 2, 'y': dy + T * 2 * S, 'w': T * S, 'h': T * 2 * S})
    scatter = [
        ('pine', 0, 0), ('oak', 12, 0), ('pine2', 27, 0), ('pine', 37, 0), ('oak', 0, 7), ('pine', 37, 8), ('bush2', 26, 6),
        ('oak', 0, 24), ('pine', 12, 23), ('pine2', 25, 24), ('oak', 37, 24), ('rocks', 14, 20), ('rocks', 24, 3),
        ('well', 19, 12), ('board', 24, 10), ('signpost', 10, 12), ('stall', 31, 10), ('cart', 26, 15), ('hay', 1, 21),
        ('flowers', 12, 17), ('flowers', 26, 9), ('bush', 13, 9), ('bush', 28, 17), ('mushrooms', 2, 11), ('bush', 36, 16),
    ]
    for kind, tx, ty in scatter:
        img = prop_image(kind)
        asset_id = f'arex.prop.{kind}'
        if not any(a['id'] == asset_id for a in assets):
            assets.append({'id': asset_id, 'path': save(img, f'prop-{kind}.png'), 'w': img.width * S, 'h': img.height * S, 'use': f'Art test prop: {kind}'})
        props.append({'asset': asset_id, 'x': int(tx * T * S), 'y': int(ty * T * S), 'w': img.width * S, 'h': img.height * S})
        foot = PROPS[kind][1]
        if foot:
            fx, fy, fw, fh = foot
            blocks.append({'x': int((tx + fx) * T * S), 'y': int((ty + fy) * T * S), 'w': int(fw * T * S), 'h': int(fh * T * S)})
    people = [
        {'id': 'guard', 'name': 'Town guard', 'char': 21, 'at': [19, 8], 'line': 'Mind the Old Road after dark.'},
        {'id': 'merchant', 'name': 'Mira', 'char': 13, 'at': [32, 12], 'line': 'Fresh bread, old maps, honest prices.'},
        {'id': 'villager', 'name': 'Pip', 'char': 6, 'at': [17, 13], 'line': 'Is that a real guild banner?'},
        {'id': 'scholar', 'name': 'Orren Pike', 'char': 3, 'at': [7, 10], 'line': 'Names are my trade.'},
        {'id': 'farmer', 'name': 'Hesta Coal', 'char': 9, 'at': [5, 25], 'line': 'Hay for the arena horses, every week.'},
    ]
    layout['town'] = {
        'size': {'width': cols * T * S, 'height': rows * T * S},
        'ground': 'arex.town.ground',
        'props': props,
        'blocks': blocks,
        'doors': doors,
        'people': people,
        'spawn': {'x': 20 * T * S, 'y': 17 * T * S},
        'exits': [{'id': 'exit:west', 'name': 'The Old Road', 'x': T * S, 'y': 14 * T * S + T * S // 2}],
    }


# ------------------------------------------------------------------ the tavern interior

def compose_tavern(layout, assets):
    cols, rows = 16, 12
    floor = Image.new('RGBA', (cols * T, rows * T))
    for ty in range(rows):
        for tx in range(cols):
            floor.alpha_composite(tile(FLOORS, 2, 3 + (ty % 3)), (tx * T, ty * T))
    # back wall: three rows of dark wood panelling
    for ty in range(3):
        for tx in range(cols):
            cx = 0 if tx == 0 else 2 if tx == cols - 1 else 1
            floor.alpha_composite(tile(WALLS, 0 + cx, ty), (tx * T, ty * T))
    # a rug in the middle (3x3 carpet)
    for ty in range(3):
        for tx in range(5):
            cx = 0 if tx == 0 else 2 if tx == 4 else 1
            floor.alpha_composite(tile(FLOORS, cx, ty), ((6 + tx) * T, (6 + ty) * T))
    assets.append({'id': 'arex.tavern.floor', 'path': save(floor, 'tavern-floor.png'), 'w': cols * T * S, 'h': rows * T * S, 'use': 'Art test tavern: floor and walls'})
    furniture = [
        # kind, (col,row,w,h) on Above_Tiles, at (tiles), foot block (fx,fy,fw,fh) or None
        ('shelf', (24, 0, 2, 3), (2, 0), (0, 2, 2, 1)),
        ('shelf2', (26, 0, 2, 3), (4, 0), (0, 2, 2, 1)),
        ('fireplace', (30, 12, 2, 4), (13, 0), (0, 2.5, 2, 1.5)),
        ('barrels', (22, 4, 2, 2), (10, 1), (0, 1, 2, 1)),
        ('barrel', (22, 3, 1, 1), (9, 2), (0, 0.4, 1, 0.6)),
        ('bartop', (16, 0, 3, 1), (3, 4), None),
        ('bartop2', (16, 0, 3, 1), (6, 4), None),
        ('barfront', (19, 6, 3, 1), (3, 5), (0, -1, 3, 2)),
        ('barfront2', (19, 6, 3, 1), (6, 5), (0, -1, 3, 2)),
        ('longtable', (16, 10, 3, 3), (1, 8), (0, 0.7, 3, 2)),
        ('roundtable', (19, 11, 2, 3), (12, 7), (0, 0.7, 2, 2)),
        ('chair', (16, 13, 1, 2), (2, 6.6), None),
        ('chair2', (16, 13, 1, 2), (12, 5.6), None),
        ('stool', (19, 15, 1, 1), (4, 9), None),
        ('stool2', (19, 15, 1, 1), (14, 8), None),
        ('plant', (1, 13, 1, 1), (0, 10), (0, 0.5, 1, 0.5)),
        ('plant2', (1, 13, 1, 1), (15, 10), (0, 0.5, 1, 0.5)),
    ]
    props, blocks = [], [{'x': 0, 'y': 0, 'w': cols * T * S, 'h': int(2.6 * T * S)}]
    for kind, (c, r, w, h), (tx, ty), foot in furniture:
        img = tile(ABOVE, c, r, w, h)
        asset_id = f'arex.furniture.{kind}'
        assets.append({'id': asset_id, 'path': save(img, f'furniture-{kind}.png'), 'w': img.width * S, 'h': img.height * S, 'use': f'Art test tavern: {kind}'})
        props.append({'asset': asset_id, 'x': int(tx * T * S), 'y': int(ty * T * S), 'w': img.width * S, 'h': img.height * S})
        if foot:
            fx, fy, fw, fh = foot
            blocks.append({'x': int((tx + fx) * T * S), 'y': int((ty + fy) * T * S), 'w': int(fw * T * S), 'h': int(fh * T * S)})
    layout['tavern'] = {
        'size': {'width': cols * T * S, 'height': rows * T * S},
        'ground': 'arex.tavern.floor',
        'props': props,
        'blocks': blocks,
        'people': [
            {'id': 'mara', 'name': 'Mara Fen', 'char': 14, 'at': [6, 3], 'approach': [6, 6.6], 'reach': 3.4, 'line': 'Sit anywhere. Pay before you sing.'},
            {'id': 'nessa', 'name': 'Nessa Thornfield', 'char': 17, 'at': [4, 10], 'line': 'Looking for a guide? I know every trail.'},
            {'id': 'bram', 'name': 'Bram Calder', 'char': 25, 'at': [11, 9], 'line': 'You? A guild? I’ll believe it in the arena.'},
        ],
        'spawn': {'x': 8 * T * S, 'y': 11 * T * S},
        'exits': [{'id': 'exit:street', 'name': 'Out to Dunmere', 'x': 8 * T * S, 'y': rows * T * S - 6}],
    }


def main():
    layout, assets = {}, []
    compose_town(layout, assets)
    compose_tavern(layout, assets)
    used = sorted({p['char'] for scene in ('town', 'tavern') for p in layout[scene]['people']} | {0})
    for index in used:
        img = character(index)
        assets.append({'id': f'arex.char.{index}', 'path': save(img, f'char-{index}.png'), 'w': img.width * S, 'h': img.height * S, 'use': f'Art test character {index}', 'sheet': {'frameWidth': CW * S, 'frameHeight': CH * S}})
    layout['player'] = {'char': 0}
    layout['assets'] = assets
    os.makedirs(os.path.dirname(LAYOUT), exist_ok=True)
    with open(LAYOUT, 'w', encoding='utf-8') as handle:
        json.dump(layout, handle, indent=1, ensure_ascii=False)
    print(f'{len(assets)} assets, layout at {os.path.relpath(LAYOUT, ROOT)}')


if __name__ == '__main__':
    main()
