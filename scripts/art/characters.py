"""Walking characters for towns and buildings, assembled from HeroEditor parts.

Each recipe names body parts and equipment; heroeditor.py draws it. A walk sheet
is 4 rows (down, left, right, up) x 3 frames (step, stand, step). HeroEditor
characters are drawn from the side only, so down uses the right-facing frames and
up the left-facing ones; the walk engine keeps the last side while walking up or
down (asset `sideOnly`).
"""
import hashlib
from PIL import Image, ImageOps

SKIN = {'fair': (1.0, 0.86, 0.74), 'light': (0.98, 0.8, 0.66), 'tan': (0.86, 0.66, 0.5), 'brown': (0.68, 0.5, 0.38), 'deep': (0.5, 0.36, 0.28)}
HAIR = {'black': (0.22, 0.2, 0.22), 'brown': (0.48, 0.32, 0.2), 'chestnut': (0.62, 0.36, 0.2), 'auburn': (0.72, 0.3, 0.18), 'blond': (0.95, 0.8, 0.45),
        'grey': (0.72, 0.72, 0.74), 'white': (0.95, 0.95, 0.95), 'red': (0.8, 0.28, 0.16)}

EYES = {'brown': (120, 72, 40), 'hazel': (140, 110, 50), 'blue': (60, 120, 200), 'grey': (120, 130, 140), 'green': (70, 150, 80), 'amber': (190, 130, 40)}


def _eye_for(spec):
    """A stable eye colour per recipe when none is given: mostly brown, some blue, grey, green, hazel."""
    pool = ['brown', 'brown', 'hazel', 'blue', 'grey', 'green', 'brown', 'amber']
    key = repr(sorted((k, str(v)) for k, v in spec.items()))
    return pool[int(hashlib.md5(key.encode()).hexdigest(), 16) % len(pool)]


# Who wears what. Keys are part names inside the HeroEditor folders (Basic sets).
R = {
    'char.founder': dict(hair='ShortHair', hc='brown', skin='light', armor='HunterTunic', weapon='Sword/ShortIronKatana [Paint]', eyes='Male', ec='brown', brows='Eyebrows2', mouth='Normal'),
    'npc.dunmere.merchant': dict(hair='PushedBack', hc='chestnut', skin='tan', armor='Nomad', helmet='GypsyHat', eyes='Male', beard=True, mouth='Smirk'),
    'npc.dunmere.fighter': dict(hair='Slicked', hc='black', skin='light', armor='GladiatorArmor', weapon='Sword/ShortIronKatana [Paint]', eyes='Male', brows='Angry', mouth='Smirk'),
    'npc.dunmere.stablemaster': dict(hair='Shaggy', hc='grey', skin='tan', armor='FarmerClothes', helmet='StrawHat', eyes='Male', beard=True),
    'npc.dunmere.nessa': dict(hair='ShortPonytail', hc='auburn', skin='fair', armor='RangerArmor', eyes='Female', brows='Eyebrows4', back='ArrowQuiver', mouth='Normal'),
    'npc.dunmere.traveler': dict(hair='SideFringe', hc='blond', skin='light', armor='Wanderer', cape='CotttonCape [Paint]', eyes='Male'),
    'npc.dunmere.herald': dict(hair='PushedBack', hc='white', skin='fair', armor='BishopArmor', eyes='Male', brows='Eyebrows3'),
    'npc.dunmere.kilnmaster': dict(hair='BuzzCut', hc='black', skin='brown', armor='LeatherJacket', eyes='Female', mouth='Smirk'),
    'npc.dunmere.lamplighter': dict(hair='Shaggy', hc='chestnut', skin='fair', armor='PeasantClothing', helmet='PeasantCap', eyes='Male', shield='HermitLamp'),
    'npc.greenhollow.herbalist': dict(hair='LongHair', hc='grey', skin='fair', armor='DruidArmor', eyes='Female', cape='GrandmaCape [Paint]'),
    'npc.greenhollow.warden': dict(hair='ShortPonytail', hc='brown', skin='tan', armor='PathfinderArmor', helmet='PathfinderHood', eyes='Female', back='ArrowQuiver2'),
    'npc.greenhollow.storyteller': dict(hair='Leaky', hc='white', skin='light', armor='Hermit', helmet='HermitHat', eyes='Male', beard=True),
    'npc.greenhollow.stablehand': dict(hair='Shaggy', hc='blond', skin='light', armor='PeasantClothing', eyes='Male'),
    'npc.greenhollow.cleric': dict(hair='BuzzCut', hc='brown', skin='brown', armor='Cleric [Paint]', eyes='Male', shield='CardinalBook'),
    'npc.ironford.foreman': dict(hair='ShortPonytail', hc='red', skin='light', armor='LeatherRivetedArmor', eyes='Female', weapon='Hammer', brows='Angry'),
    'npc.ironford.tollkeeper': dict(hair='ShortHair', hc='brown', skin='tan', armor='Militiaman', helmet='LeatherCap', eyes='Male'),
    'npc.ironford.smith': dict(hair='BuzzCut', hc='black', skin='deep', armor='LeatherJacket', weapon='Hammer', eyes='Male', beard=True),
    'npc.ironford.guard': dict(hair='ShortPonytail', hc='black', skin='light', armor='GuardArmor [Paint]', helmet='GuardHelm1 [Paint]', eyes='Female', shield='GuardShield'),
    'npc.ironford.scholar': dict(hair='SideFringe', hc='chestnut', skin='fair', armor='Robe', eyes='Male', shield='CardinalBook'),
    'npc.ironford.archivist': dict(hair='PushedBack', hc='grey', skin='fair', armor='InquisitorArmor', eyes='Male', beard=True),
    'npc.windmere.courier': dict(hair='ShortHair', hc='blond', skin='tan', armor='Scout [Paint]', cape='CotttonCape [Paint]', eyes='Female'),
    'npc.windmere.monk': dict(hair='BuzzCut', hc='grey', skin='brown', armor='ShamanArmor', eyes='Male'),
    'npc.dunmere.innkeeper': dict(hair='LongHair', hc='auburn', skin='light', armor='PeasantClothing', eyes='Female', mouth='Smirk'),
    'npc.role.shopkeeper': dict(hair='ShortPonytail', hc='brown', skin='fair', armor='FarmerClothes', eyes='Female'),
    'npc.role.registrar': dict(hair='SideFringe', hc='black', skin='tan', armor='CardinalArmor', eyes='Female'),
    'npc.role.referee': dict(hair='Slicked', hc='grey', skin='brown', armor='ChampionArmor', eyes='Male', beard=True),
    'npc.role.herald-s-clerk': dict(hair='ShortHair', hc='chestnut', skin='fair', armor='Robe', eyes='Female'),
    'npc.greenhollow.innkeeper': dict(hair='Shaggy', hc='brown', skin='tan', armor='FarmerClothes', eyes='Male', beard=True),
    'npc.role.herb-seller': dict(hair='LongHair', hc='blond', skin='light', armor='DruidArmor', eyes='Female'),
    'npc.ironford.barkeep': dict(hair='AfroSmall', hc='black', skin='deep', armor='LeatherJacket', eyes='Female', mouth='Smirk'),
    'npc.role.forge-trader': dict(hair='BuzzCut', hc='red', skin='light', armor='LeatherRivetedArmor', eyes='Male', beard=True),
    'npc.role.assay-clerk': dict(hair='ShortPonytail', hc='black', skin='fair', armor='Robe', eyes='Female'),
    'npc.role.innkeeper': dict(hair='Leaky', hc='grey', skin='tan', armor='PeasantClothing', eyes='Male'),
    'npc.role.courier-supplier': dict(hair='ShortHair', hc='chestnut', skin='brown', armor='Nomad', eyes='Male'),
    'npc.role.council-steward': dict(hair='PushedBack', hc='brown', skin='fair', armor='BishopArmor', eyes='Male'),
    'npc.role.watch-sergeant': dict(hair='ShortHair', hc='black', skin='tan', armor='Militiaman', helmet='MilitiamanHelmet1 [Paint]', eyes='Male', shield='MilitiamanShield'),
    'npc.role.temple-acolyte': dict(hair='BuzzCut', hc='blond', skin='light', armor='Cleric [Paint]', eyes='Female'),
    'npc.role.trader': dict(hair='Shaggy', hc='chestnut', skin='tan', armor='Nomad', helmet='GypsyHat', eyes='Male'),
    'npc.role.traveller': dict(hair='SideFringe', hc='brown', skin='light', armor='Wanderer', cape='OldCape2 [Paint]', eyes='Male'),
    'npc.role.messenger': dict(hair='ShortHair', hc='blond', skin='fair', armor='Scout [Paint]', eyes='Female'),
    'npc.role.high-priestess': dict(hair='LongHair', hc='grey', skin='light', armor='BishopArmor', helmet='BishopHat [FullHair]', eyes='Female', ec='grey'),
    'npc.role.priest': dict(hair='BowlCut' if False else 'SideFringe', hc='brown', skin='tan', armor='Cleric [Paint]', eyes='Male', ec='hazel', mouth='Normal'),
    'char.class.guardian': dict(hair='ShortHair', hc='brown', skin='tan', armor='KnightArmor [Paint]', helmet='KnightHelm [Paint]', shield='KnightShield', weapon='Sword/ShortIronKatana [Paint]', eyes='Male'),
    'char.class.duelist': dict(hair='Slicked', hc='black', skin='light', armor='MercenaryArmor [Paint]', weapon='Sword/ShortIronKatana [Paint]', eyes='Male', brows='Angry'),
    'char.class.ranger': dict(hair='ShortPonytail', hc='auburn', skin='fair', armor='HunterLightArmor', helmet='RangerHat [Paint]', back='ArrowQuiver', eyes='Female'),
    'char.class.rogue': dict(hair='SideFringe', hc='black', skin='tan', armor='ThiefArmor', helmet='AssassinHood [Paint]', weapon='Dagger', eyes='Male'),
    'char.class.cleric': dict(hair='LongHair', hc='blond', skin='light', armor='Cleric [Paint]', helmet='ClericHood [Paint]', shield='CardinalBook', eyes='Female'),
    'char.class.mage': dict(hair='LongHair', hc='white', skin='fair', armor='FireWizardArmor', helmet='FireWizardHood', weapon='Wand', eyes='Male', beard=True),
    'char.class.scholar': dict(hair='PushedBack', hc='chestnut', skin='brown', armor='Robe', shield='CardinalBook', eyes='Male'),
    'char.class.artificer': dict(hair='AfroSmall', hc='black', skin='deep', armor='LeatherRivetedArmor', helmet='AmateurDipperHat', weapon='Hammer', eyes='Female'),
}


def _first(lib_root, folder, name):
    """A part file: exact name, or the first file whose name starts with it (weapons by kind)."""
    import glob, os
    exact = os.path.join(lib_root, folder, name + '.png')
    if os.path.exists(exact):
        return exact
    found = sorted(glob.glob(os.path.join(lib_root, folder, name, '**', '*.png'), recursive=True)) or sorted(glob.glob(os.path.join(lib_root, folder, name + '*.png')))
    if not found:
        raise FileNotFoundError(f'{folder}/{name}')
    return found[0]


def _in(folder, name):
    """'Name' is in the folder's Basic set; 'Set/Name' names another set."""
    return f'{folder}/{name}.png' if '/' in name else f'{folder}/Basic/{name}.png'


def recipe_parts(root, spec):
    """Recipe keys: skin (a name in SKIN or an (r, g, b) multiplier), hair and hc,
    eyes ('Male', or 'Undead/GlowingEyes'), ec, brows, mouth, beard, body
    ('skeleton' for the Veil's dead), armor and helmet ('Name' or 'Set/Name'),
    atint (a colour multiplier for armor and helmet), weapon, shield, cape, back, mask."""
    S = root + '/Sprites/'
    skin = spec.get('skin', 'light')
    skin = SKIN[skin] if isinstance(skin, str) else skin
    hair = HAIR[spec.get('hc', 'brown')]
    atint = spec.get('atint')
    dead = spec.get('body') == 'skeleton'
    body_png = S + ('BodyParts/Body/Undead [Preview]/Skeleton1.png' if dead else 'BodyParts/Body/Basic/Human.png')
    head_png = S + ('BodyParts/Head/Undead [Preview]/Skeleton1.png' if dead else 'BodyParts/Head/Basic/Head.png')
    eyes = spec.get('eyes', 'Male')
    parts = {
        'Body': (body_png, None if dead else skin),
        'Head': (head_png, None if dead else skin),
        'Eyes': (S + _in('BodyParts/Eyes', eyes), ('iris', EYES[spec.get('ec') or _eye_for(spec)] if '/' not in eyes else spec['glow'])) if ('/' not in eyes or spec.get('glow')) else S + _in('BodyParts/Eyes', eyes),
        'Armor': (S + _in('Equipment/Armor', spec['armor']), atint) if atint else S + _in('Equipment/Armor', spec['armor']),
    }
    if not dead:
        parts['Ears'] = (S + 'BodyParts/Ears/Basic/HumanEar.png', skin)
        parts['Eyebrows'] = (S + f"BodyParts/Eyebrows/Basic/{spec.get('brows', 'Eyebrows1')}.png", hair)
        parts['Mouth'] = S + f"BodyParts/Mouth/Basic/{spec.get('mouth', 'Normal')}.png"
    helmet = spec.get('helmet')
    if helmet:
        parts['Helmet'] = (S + _in('Equipment/Helmet', helmet), atint) if atint else S + _in('Equipment/Helmet', helmet)
    # Helmets hide the hair; hats and [FullHair] pieces keep it.
    if spec.get('hair') and not dead and (not helmet or 'Hat' in helmet or 'FullHair' in helmet or 'Cap' in helmet):
        parts['Hair'] = (S + f"BodyParts/Hair/Basic/{spec['hair']}.png", hair)
    if spec.get('beard') and not dead:
        parts['Beard'] = (S + 'BodyParts/Beard/Basic/Beard.png', hair)
    if spec.get('weapon'):
        parts['MeleeWeapon'] = _first(S, 'Equipment/MeleeWeapon1H/Basic', spec['weapon'])
    if spec.get('shield'):
        parts['Shield'] = S + f"Equipment/Shield/Basic/{spec['shield']}.png"
    if spec.get('cape'):
        parts['Cape'] = (S + f"Equipment/Cape/Basic/{spec['cape']}.png", atint) if atint else S + f"Equipment/Cape/Basic/{spec['cape']}.png"
    if spec.get('back'):
        parts['Back'] = S + f"Equipment/Back/Basic/{spec['back']}.png"
    if spec.get('mask'):
        parts['Mask'] = S + f"Equipment/Mask/Basic/{spec['mask']}.png"
    return parts


# The walk cycle: legs and arms swing, the body lifts a little on the passing frame.
STEP = 24
POSES = [
    {'Leg[L]': STEP, 'Leg[R]': -STEP, 'ArmL': -14, 'ArmR[1]': 14, '_offset': {'Body': (0, 0.015)}},
    {},
    {'Leg[L]': -STEP, 'Leg[R]': STEP, 'ArmL': 14, 'ArmR[1]': -14, '_offset': {'Body': (0, 0.015)}},
]

# Frame box in rig pixels (feet at FEET), scaled down to the sheet frame.
BOX = (280, 300)
FEET = (140, 284)
FRAME = (112, 120)


def walk_sheet(rig, parts):
    frames = []
    for pose in POSES:
        im = rig.render(parts, pose=pose, size=BOX, origin=FEET)
        frames.append(im.resize(FRAME, Image.LANCZOS))
    right = frames
    left = [ImageOps.mirror(f) for f in frames]
    rows = [right, left, right, left]
    sheet = Image.new('RGBA', (FRAME[0] * 3, FRAME[1] * 4), (0, 0, 0, 0))
    for r, row in enumerate(rows):
        for c, f in enumerate(row):
            sheet.alpha_composite(f, (c * FRAME[0], r * FRAME[1]))
    still = frames[1]
    return sheet, still


def battle_figure(rig, parts):
    """Full size, facing right (heroes stand on the left in battle)."""
    im = rig.render(parts, size=(300, 330), origin=(150, 310))
    return im.crop(im.getbbox()) if im.getbbox() else im


def bust(rig, parts, size=192):
    """A close-up of the head and shoulders, for portraits (hero rows, dialogue)."""
    im = rig.render(parts, size=BOX, origin=FEET)
    # The head sits about 100-240 px above the feet in the rig's own pixels.
    top = FEET[1] - 250
    box = (FEET[0] - 95, top, FEET[0] + 95, top + 190)
    return im.crop(box).resize((size, size), Image.LANCZOS)
