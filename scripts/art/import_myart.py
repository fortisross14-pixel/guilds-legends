"""Brings the art from the private art repo (fortisross14-pixel/my-art) into the game.

    python3 scripts/art/import_myart.py [path/to/my-art]

Three Unity Asset Store packs, used under their licences in this private repo
(only the pieces the game uses are copied; see public/art/packs/myart/README.md):
  - 2D Hand Painted Tilesets (Town, Interior): the ground, the buildings, props
  - GUI PRO Kit - Fantasy RPG: buttons, frames, bars, the joystick, the font
  - HeroEditor (Fantasy Heroes): walking characters, assembled from body parts

Writes images under public/art/packs/myart/ and the asset entries that point the
game at them in src/data/myart/assets.json (src/data/assets.js applies them over
the older art). Re-run it after changing a recipe here or in characters.py.
Needs Pillow. Takes about a minute (the characters).
"""
import json, os, shutil, sys
from PIL import Image, ImageEnhance, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(GAME, '..', 'my-art'))
OUT = os.path.join(GAME, 'public', 'art', 'packs', 'myart')
REL = 'art/packs/myart'
sys.path.insert(0, HERE)

TOWN = os.path.join(SRC, '2D Hand Painted Tilesets', '2D Hand Painted - Town Tileset', 'Sprites', 'Tilesets 64x64')
INTERIOR = os.path.join(SRC, '2D Hand Painted Tilesets', '2D Hand Painted - Interior Tileset', 'Sprites', 'Tilesets 64x64')
GUI = os.path.join(SRC, 'GUI PRO Kit - Fantasy RPG')
HERO = os.path.join(SRC, 'HeroEditor', 'FantasyHeroes')
TS = 64  # source tile size
WT = 32  # walk grid tile, world px

assets = []


def out(path):
    full = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    return full


_sheets = {}


def sheet(name, folder=TOWN):
    """A tile sheet with its magenta 'empty' cells keyed out."""
    key = (name, folder)
    if key not in _sheets:
        im = Image.open(os.path.join(folder, f'{name}@64x64.png')).convert('RGBA')
        im.putdata([(0, 0, 0, 0) if (r > 180 and g < 90 and b > 180) else (r, g, b, a) for r, g, b, a in im.getdata()])
        _sheets[key] = im
    return _sheets[key]


def tiles(im, col, row, w=1, h=1, skip=()):
    """A block of tiles; `skip` lists (col, row) cells (sheet coords) left empty."""
    block = im.crop((col * TS, row * TS, (col + w) * TS, (row + h) * TS))
    for c, r in skip:
        x, y = (c - col) * TS, (r - row) * TS
        block.paste((0, 0, 0, 0), (x, y, x + TS, y + TS))
    return block


def trim(im):
    box = im.getbbox()
    return im.crop(box) if box else im


# --- Ground ------------------------------------------------------------------
# One atlas of 64 px tiles; src/explore/groundPaint.js paints the walk grid from it
# (quarter-tile autotiling for paths, plaza, water and hedges).
def ground():
    town, town2 = sheet('Town'), sheet('Town 2')
    moss = sheet('Town 2 Color 3')
    inner, inner2 = sheet('Interior', INTERIOR), sheet('Interior 2', INTERIOR)
    cells = {}
    picks = [
        ('grass', town, 14, 5), ('grass2', town, 15, 5), ('flowers', town, 12, 5),
        # 3 x 3 sets, read as tl t tr / l c r / bl b br
        *[(f'plaza{r * 3 + c}', town, 13 + c, 6 + r) for r in range(3) for c in range(3)],
        *[(f'pool{r * 3 + c}', town, 2 + c, 13 + r) for r in range(3) for c in range(3)],
        ('water', town, 0, 13), ('planks', inner, 5, 0), ('stone', inner2, 8, 0),
        ('cobble0', town, 12, 10), ('cobble1', town, 11, 10), ('bushTop', town, 7, 12), ('bushBottom', town, 7, 13),
        ('hedge0', moss, 0, 13), ('hedge1', moss, 1, 13), ('hedge2', moss, 2, 14), ('hedge3', moss, 4, 14),
    ]
    cols = 8
    atlas = Image.new('RGBA', (cols * TS, ((len(picks) + cols - 1) // cols) * TS))
    for i, (name, im, c, r) in enumerate(picks):
        atlas.alpha_composite(tiles(im, c, r), ((i % cols) * TS, (i // cols) * TS))
        cells[name] = i
    atlas.save(out('tiles/ground-atlas.png'))
    assets.append({'id': 'tiles.handpainted', 'group': 'tileset', 'path': f'{REL}/tiles/ground-atlas.png', 'w': atlas.width, 'h': atlas.height, 'tile': TS, 'cols': cols, 'cells': cells,
                   'use': 'Ground tiles (hand-painted), painted into each walkable map by src/explore/groundPaint.js'})


# --- Buildings ---------------------------------------------------------------
def gable(name):
    """The gable house (Town sheets): 7 x 9 tiles, the chimney filling the roof's gap, the shop signs cut away."""
    im = sheet(name)
    house = tiles(im, 0, 0, 7, 9, skip=[(0, 0), (1, 0), (5, 0), (6, 0), (0, 1), (6, 1), (0, 4), (6, 4), (0, 5), (0, 6), (0, 7), (0, 8), (6, 5), (6, 6), (6, 7), (6, 8)])
    house.alpha_composite(tiles(im, 2, 2), (3 * TS, TS))  # roof under the chimney
    house.alpha_composite(tiles(im, 11, 2, 1, 2), (3 * TS, 0))
    return trim(house)


def woodhouse(name):
    return trim(tiles(sheet(name), 0, 0, 7, 8, skip=[(6, 7)]))


def thatch(name):
    im = sheet(name)
    return trim(tiles(im, 7, 6, 6, 7, skip=[(12, 11), (12, 12)]))


def hut(name):
    return trim(tiles(sheet(name), 5, 13, 2, 3))


SIGNS = {'potion': (1, 0, 1, 1), 'sword': (0, 1, 1, 1), 'armor': (0, 5, 1, 1), 'beer': (0, 7, 1, 2), 'arrow': (6, 1, 1, 1)}


def sign(kind):
    c, r, w, h = SIGNS[kind]
    return trim(tiles(sheet('Town'), c, r, w, h))


def with_sign(house, kind, side='left'):
    """Hangs a shop sign beside the door (signs are drawn for a 64 px tile; the house is too)."""
    s = sign(kind)
    pad = s.width // 2
    canvas = Image.new('RGBA', (house.width + pad * 2, house.height))
    # (the canvas keeps the house centred, so its door stays in the middle)
    canvas.alpha_composite(house, (pad, 0))
    x = pad + 18 - s.width // 2 if side == 'left' else canvas.width - pad - 18 - s.width // 2
    canvas.alpha_composite(s, (x, house.height - s.height - TS // 2))
    return canvas


def building(asset_id, image, use):
    path = f"buildings/{asset_id.split('.', 1)[1].replace('.', '-')}.png"
    # Stored at half size: 64 px tiles become the walk grid's 32, doubled for sharp phones.
    image.save(out(path))
    assets.append({'id': asset_id, 'group': 'building', 'path': f'{REL}/{path}', 'w': image.width, 'h': image.height, 'aspect': True, 'scale': WT / TS, 'use': use})


def buildings():
    B = building
    B('town.dunmere.herald', gable('TownColor3'), 'Dunmere: Herald’s Office (purple gable house)')
    B('town.dunmere.tavern', with_sign(thatch('Town 2'), 'beer'), 'Dunmere: The Wayfarer (thatched, the beer sign)')
    B('town.dunmere.guildhall.stage1', woodhouse('Town 2'), 'Dunmere: the Guild Hall (wooden house)')
    B('town.dunmere.shop', with_sign(gable('TownColor2'), 'potion'), 'Dunmere: Mira’s Supply (orange gable house, the potion sign)')
    B('town.dunmere.arena', with_sign(woodhouse('Town 2 Color 3'), 'sword'), 'Dunmere: the arena (dark wooden house, the sword sign)')
    B('town.greenhollow.arena', with_sign(woodhouse('Town 2 Color 2'), 'sword'), 'Greenhollow: the arena')
    B('town.greenhollow.lodge', thatch('Town 2 Color 3'), 'Greenhollow: the lodge (moss thatch)')
    B('town.greenhollow.shop', with_sign(gable('Town Spring'), 'potion'), 'Greenhollow: the shop')
    B('town.greenhollow.tavern', with_sign(thatch('Town 2'), 'beer'), 'Greenhollow: the tavern')
    B('town.ironford.arena', with_sign(woodhouse('Town 2 Color 3'), 'sword'), 'Ironford: the arena')
    B('town.ironford.herald', gable('Town'), 'Ironford: the herald (blue gable house)')
    B('town.ironford.offices', woodhouse('Town 2 Color 2'), 'Ironford: the offices')
    B('town.ironford.shop', with_sign(gable('TownColor2'), 'armor'), 'Ironford: the shop (the armor sign)')
    B('town.ironford.tavern', with_sign(thatch('Town 2'), 'beer'), 'Ironford: the tavern')
    B('town.windmere.arena', with_sign(woodhouse('Town 2 Color 2'), 'sword'), 'Windmere: the arena')
    B('town.windmere.inn', with_sign(thatch('Town 2'), 'beer'), 'Windmere: the inn')
    B('town.windmere.shop', with_sign(gable('TownColor3'), 'potion'), 'Windmere: the shop')


# --- Props -------------------------------------------------------------------
def prop(asset_id, image, use):
    path = f"props/{asset_id.split('.', 1)[1].replace('.', '-')}.png"
    image.save(out(path))
    assets.append({'id': asset_id, 'group': 'prop', 'path': f'{REL}/{path}', 'w': image.width, 'h': image.height, 'aspect': True, 'scale': WT / TS, 'use': use})


def props():
    town, inner2 = sheet('Town'), sheet('Interior 2', INTERIOR)
    prop('prop.lamp', trim(tiles(town, 7, 7, 1, 4)), 'Street lamp')
    prop('prop.well', trim(tiles(town, 8, 6, 2, 3)), 'Well (blue roof)')
    prop('prop.stall', trim(tiles(town, 8, 13, 3, 3)), 'Market stall (striped awning)')
    prop('prop.fountain', trim(tiles(town, 2, 13, 3, 3)), 'Fountain basin')
    prop('prop.kiln', trim(tiles(town, 11, 2, 1, 2)), 'Kiln chimney')
    crates = Image.new('RGBA', (2 * TS, TS))
    crates.alpha_composite(tiles(town, 5, 10), (0, 0))
    crates.alpha_composite(tiles(town, 6, 10), (TS, 0))
    prop('prop.crates', trim(crates), 'Crate and barrel')
    board = tiles(inner2, 9, 4, 2, 2)
    note = trim(tiles(inner2, 14, 2))
    board.alpha_composite(note, (22, 18))
    board.alpha_composite(note.rotate(-8, expand=True), (TS + 4, 22))
    prop('prop.noticeboard', trim(board), 'Notice board (notes pinned to a wooden board)')


# --- Characters --------------------------------------------------------------
def characters():
    from heroeditor import Library, Rig
    from characters import R, recipe_parts, walk_sheet, FRAME
    lib = Library(HERO)
    rig = Rig(os.path.join(HERO, 'Prefabs', 'Human.prefab'), lib)
    for asset_id, spec in R.items():
        image, still = walk_sheet(rig, recipe_parts(HERO, spec))
        name = asset_id.replace('.', '-')
        image.save(out(f'chars/{name}.png'))
        still.save(out(f'chars/{name}-still.png'))
        assets.append({'id': asset_id, 'group': 'npc' if asset_id.startswith('npc.') else 'char', 'path': f'{REL}/chars/{name}.png', 'still': f'{REL}/chars/{name}-still.png',
                       'w': FRAME[0], 'h': FRAME[1], 'sheet': {'frameWidth': FRAME[0], 'frameHeight': FRAME[1]}, 'sideOnly': True, 'walker': True,
                       'use': 'Walking character (HeroEditor parts, scripts/art/characters.py)'})


# --- Foes (no monsters: every enemy is a person) ----------------------------
def foes():
    from heroeditor import Library, Rig
    from characters import recipe_parts
    from foes import FOES, GROUPS, BOSSES, battle_still, group_image
    lib = Library(HERO)
    rig = Rig(os.path.join(HERO, 'Prefabs', 'Human.prefab'), lib)
    stills = {}
    for foe_id, spec in FOES.items():
        im = battle_still(rig, recipe_parts(HERO, spec))
        stills[foe_id] = im
        im.save(out(f'foes/{foe_id}.png'))
        assets.append({'id': f'battle.foe.{foe_id}', 'group': 'battler', 'path': f'{REL}/foes/{foe_id}.png', 'w': im.width, 'h': im.height, 'foe': True,
                       'use': f'Enemy in battle: {foe_id} (HeroEditor parts, scripts/art/foes.py)'})
    for asset_id, members in GROUPS.items():
        im = group_image([ImageOps.mirror(stills[m]) for m in members])
        name = asset_id.split('.', 1)[1].replace('.', '-')
        im.save(out(f'foes/{name}.png'))
        assets.append({'id': asset_id, 'group': 'enemy', 'path': f'{REL}/foes/{name}.png', 'w': im.width, 'h': im.height, 'aspect': True, 'use': f'Enemy group on the map: {", ".join(members)}'})
    for asset_id, foe_id in BOSSES.items():
        im = ImageOps.mirror(stills[foe_id])
        name = asset_id.split('.', 1)[1].replace('.', '-')
        im.save(out(f'foes/{name}.png'))
        assets.append({'id': asset_id, 'group': 'enemy', 'path': f'{REL}/foes/{name}.png', 'w': im.width, 'h': im.height, 'aspect': True, 'use': f'Boss on the map: {foe_id}'})


# --- Interface ---------------------------------------------------------------
GUI_FILES = {
    'panel.png': 'Sprites/Component/Popup/popup_00_frame.png',
    'popup.png': 'Sprites/Component/Popup/popup_01_frame.png',
    'card.png': 'Sprites/Component/Popup/popup_02_frame1.png',
    'btn-gold.png': 'Sprites/Component/Button/btn_rectangle_01_n_yellow.png',
    'btn-dark.png': 'Sprites/Component/Button/btn_rectangle_01_n_dark.png',
    'btn-slate.png': 'Sprites/Component/Button/btn_rectangle_01_n_bluegray.png',
    'btn-blue.png': 'Sprites/Component/Button/btn_rectangle_01_n_blue.png',
    'btn-red.png': 'Sprites/Component/Button/btn_rectangle_01_n_red.png',
    'btn-green.png': 'Sprites/Component/Button/btn_rectangle_01_n_green.png',
    'btn-gray.png': 'Sprites/Component/Button/btn_rectangle_01_n_darkgray.png',
    'btn-square.png': 'Sprites/Component/Button/btn_sqeure_01.png',
    'ribbon-blue.png': 'Sprites/Component/Label/label_flag_01_blue.png',
    'ribbon-red.png': 'Sprites/Component/Label/label_flag_01_red.png',
    'ribbon-purple.png': 'Sprites/Component/Label/label_flag_00.png',
    'item-gold.png': 'Sprites/Component/Frame/frame_itemframe_00_n_gold.png',
    'item-glow.png': 'Sprites/Component/Frame/frame_itemframe_00_s1.png',
    'orb-blue.png': 'Sprites/Demo/Demo_Play/joystick_button_00_frame.png',
    'orb-red.png': 'Sprites/Demo/Demo_Play/joystick_button_02_frame.png',
    'orb-dark.png': 'Sprites/Demo/Demo_Play/joystick_button_01_frame.png',
    'orb-ring.png': 'Sprites/Demo/Demo_Play/joystick_button_01_slier_144x144.png',
    'stick-base.png': 'Sprites/Demo/Demo_Play/joystick_move_frame.png',
    'stick-knob.png': 'Sprites/Demo/Demo_Play/joystick_move_point.png',
    'circle-gold.png': 'Sprites/Component/Frame/frame_iconframe_circle_02.png',
    'bar-frame.png': 'Sprites/Component/Slider/slider_basictype_00_frame_front.png',
    'bar-back.png': 'Sprites/Component/Slider/slider_basictype_00_back.png',
    'gold.png': 'Sprites/Component/UI_Etc/status_icon_gold.png',
    'gem.png': 'Sprites/Component/UI_Etc/status_icon_gem.png',
    'star.png': 'Sprites/Component/UI_Etc/status_icon_star.png',
    'close.png': 'Sprites/Component/Popup/popup_01_frame_top_btn_icon.png',
    'badge-lvl.png': 'Sprites/Component/Label/label_flag_02_blue.png',
    'check.png': 'Sprites/Component/UI_Etc/toggle_checkbox_on.png',
    'shield.png': 'Sprites/Component/Slider/slider_icontype_00_icon3.png',
}


def interface():
    import glob
    for name, rel in GUI_FILES.items():
        found = glob.glob(os.path.join(GUI, rel.replace('_144x144', '*').replace('circle_02', 'circle_0*')))
        source = os.path.join(GUI, rel) if os.path.exists(os.path.join(GUI, rel)) else (sorted(found)[-1] if found else None)
        if not source:
            print('missing', rel)
            continue
        shutil.copyfile(source, out(f'gui/{name}'))
    for font in ['Alata-Regular.ttf', 'JosefinSans-Bold.ttf']:
        shutil.copyfile(os.path.join(GUI, 'Font', font), out(f'fonts/{font}'))


def main():
    if not os.path.isdir(SRC):
        sys.exit(f'Art repo not found at {SRC}')
    ground()
    buildings()
    props()
    interface()
    if '--no-characters' not in sys.argv:
        characters()
        foes()
    os.makedirs(os.path.join(GAME, 'src', 'data', 'myart'), exist_ok=True)
    keep = []
    target = os.path.join(GAME, 'src', 'data', 'myart', 'assets.json')
    if '--no-characters' in sys.argv and os.path.exists(target):
        keep = [a for a in json.load(open(target))['assets'] if a.get('walker') or a.get('foe') or a['id'].startswith('enemy.')]
    with open(target, 'w') as f:
        json.dump({'source': 'scripts/art/import_myart.py', 'assets': assets + keep}, f, indent=1)
    print(len(assets) + len(keep), 'assets')


if __name__ == '__main__':
    main()
