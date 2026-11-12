"""Pieces from the 2D Hand Painted Grassland Tileset and Extra Objects pack.

DECO: decorations and trees, each cut from a sheet as (sheet, col, row, w, h)
in 64 px tiles and trimmed; the importer saves each as deco.<name> (or the
prop id in PROPS), drawn at the walk grid's scale (half size).
GROUND: tiles added to the ground atlas for wild areas (grassland grass, the
dirt road ring with inner corners, the natural pond, bridge planks).
"""
EX, GL, GL2 = 'ExtraObjects', 'Grassland', 'Grassland 2'

DECO = {
    # trees (also drawn over the woods, 'T' tiles, by src/explore/sceneMap.js)
    'tree-oak': (EX, 2, 11, 3, 5), 'tree-pine': (EX, 5, 11, 3, 5), 'tree-dead': (EX, 0, 11, 2, 5),
    'tree-broad': (GL, 0, 11, 4, 5), 'tree-dead-small': (EX, 8, 14, 1, 2), 'bush-dead': (EX, 11, 14, 2, 2),
    # rocks, logs, plants
    'rock-big': (EX, 10, 10, 2, 2), 'standing-stone': (EX, 12, 10, 2, 2), 'rocks': (EX, 14, 13, 1, 1), 'rock-tall': (EX, 15, 12, 1, 2),
    'rock-flat': (EX, 13, 14, 2, 1), 'pebbles': (EX, 15, 14, 1, 1), 'log': (EX, 9, 13, 3, 1), 'log-hollow': (EX, 14, 11, 1, 1),
    'stump': (EX, 14, 15, 1, 1), 'stump-moss': (EX, 13, 15, 1, 1), 'stump-big': (GL, 5, 14, 2, 2), 'firewood': (EX, 14, 12, 1, 1),
    'flowers-pink': (EX, 9, 11, 1, 1), 'flowers-white': (EX, 9, 12, 1, 1), 'fern': (EX, 10, 12, 1, 1), 'fern-2': (EX, 11, 12, 1, 1),
    'mushrooms': (EX, 2, 0, 2, 2), 'haystack': (EX, 12, 12, 2, 2), 'bush': (GL, 3, 7, 1, 1), 'reeds': (GL, 0, 15, 1, 1), 'flowers-red': (GL, 4, 14, 1, 1),
    # camps and the road
    'tent': (EX, 8, 4, 3, 4), 'campfire': (EX, 14, 10, 1, 1), 'spit': (EX, 9, 14, 2, 2), 'banner': (EX, 9, 8, 1, 2), 'skull-pike': (EX, 10, 8, 1, 2),
    'signpost': (EX, 11, 8, 1, 2), 'signpost-2': (EX, 12, 8, 1, 2), 'cart': (EX, 14, 8, 2, 2), 'crate': (EX, 8, 0, 2, 2), 'barrel': (EX, 1, 6, 1, 1),
    'sacks': (EX, 5, 7, 1, 2), 'log-pile': (EX, 0, 7, 2, 2), 'bench': (EX, 7, 8, 2, 1), 'fence': (EX, 13, 4, 3, 1), 'stocks': (EX, 6, 2, 2, 2),
    'grave': (EX, 5, 9, 1, 2), 'grave-cross': (EX, 6, 9, 1, 2), 'ruin-column': (EX, 8, 9, 1, 2), 'crystals': (EX, 1, 9, 1, 2),
}

# Props the places already name (src/data/towns, src/data/wilds), now from these packs.
PROPS = {
    'prop.milestone': (EX, 12, 10, 2, 2), 'prop.campfire': (EX, 14, 10, 1, 1), 'prop.anvil': (EX, 0, 3, 1, 1), 'prop.forge': (EX, 6, 0, 1, 2),
    'prop.wardstone': (EX, 15, 12, 1, 2), 'prop.statue': (EX, 8, 9, 1, 2), 'prop.plaque': (EX, 3, 9, 2, 2), 'prop.herbcart': (EX, 14, 8, 2, 2),
    'prop.elderoak': (GL, 0, 11, 4, 5), 'prop.beehives': (EX, 5, 0, 1, 1), 'prop.noticeboard': (EX, 0, 4, 2, 2),
    'prop.gather.herb': (EX, 9, 12, 1, 1), 'prop.gather.ore': (EX, 15, 11, 1, 1), 'prop.gather.coin': (EX, 4, 8, 1, 1),
}

# Ground atlas additions: grass, the dirt road (outer ring + inner corners), centres, the pond, planks.
GROUND = {
    'wgrass': (GL, 6, 3), 'wgrass2': (GL, 5, 3), 'wgrass3': (GL, 6, 4),
    # the road ring: outer corners and edges, and the hole's inner corners
    'road-tl': (GL, 0, 5), 'road-t': (GL, 2, 5), 'road-tr': (GL, 5, 5), 'road-l': (GL, 0, 7), 'road-r': (GL, 5, 7),
    'road-bl': (GL, 0, 10), 'road-b': (GL, 2, 10), 'road-br': (GL, 5, 10),
    'road-in-br': (GL, 1, 6), 'road-in-bl': (GL, 4, 6), 'road-in-tr': (GL, 1, 9), 'road-in-tl': (GL, 4, 9),
    'road-c0': (GL, 7, 8), 'road-c1': (GL, 8, 8), 'road-c2': (GL, 7, 9), 'road-c3': (GL, 8, 9),
    # the pond (dirt banks on grass): 3 x 3 from its 4 x 4
    'pond0': (GL, 10, 7), 'pond1': (GL, 11, 7), 'pond2': (GL, 13, 7), 'pond3': (GL, 10, 8), 'pond4': (GL, 12, 8),
    'pond5': (GL, 13, 8), 'pond6': (GL, 10, 10), 'pond7': (GL, 11, 10), 'pond8': (GL, 13, 10),
    'wplanks': (GL, 10, 4),
}
