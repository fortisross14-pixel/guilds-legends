"""The game's enemies, all people, assembled from HeroEditor parts (no monsters).

Each roster enemy and boss in src/data/enemies.js has a recipe here (same id).
The importer draws each one facing left for battle (asset battle.foe.<id>) and
groups them for the wild-area maps (enemy.group.*, enemy.boss.*).
Elemental foes are people too: skin tinted by their element, glowing eyes,
armor tinted to match.
"""
from PIL import Image, ImageOps

FIRE = (1.0, 0.56, 0.4)
FROST = (0.62, 0.82, 1.0)
VOID = (0.66, 0.52, 0.88)
TIDE = (0.56, 0.86, 0.84)
STORM = (0.78, 0.82, 1.0)
GLOW = 'Undead/GlowingEyes'

FOES = {
    # Crownlands: bandits and the Wolfskins (raiders in wolf pelts)
    'road-bandit': dict(hair='Shaggy', hc='brown', skin='tan', armor='BanditArmor', mask='BanditMask [Paint]', weapon='Dagger/HunterKnife [Paint]', brows='Angry', mouth='Angry'),
    'wolfskin': dict(hair='Shaggy', hc='grey', skin='light', armor='Vikings/VikingFurArmor', helmet='Vikings/VikingLeatherHelm', weapon='Axe/SmallAxe', brows='Angry', mouth='Angry', beard=True),
    'hedge-witch': dict(hair='LongHair', hc='black', skin='fair', armor='WitchArmor', helmet='WitchHat [Paint]', weapon='Wand/WitchWand', eyes='Female', mouth='Smirk'),
    'field-priest': dict(hair='BuzzCut', hc='grey', skin='tan', armor='Cleric [Paint]', atint=(0.55, 0.45, 0.45), weapon='Wand/CursedBone', brows='Angry'),
    'shield-thug': dict(hair='BuzzCut', hc='black', skin='light', armor='Deserter', helmet='SteelPotHelm', shield='WoodenShield', weapon='Hammer/WoodenSpikedClub', brows='Angry', mouth='Angry'),
    # Verdant Marches: forest outlaws and grove zealots
    'thorn-stalker': dict(hair='SideFringe', hc='brown', skin='tan', armor='HunterLightArmor', helmet='PathfinderHood', mask='Mask1 [Paint]', weapon='Dagger/BronzeDagger', back='ArrowQuiver'),
    'bark-brute': dict(hair='Mohawk', hc='auburn', skin='brown', armor='BerserkArmor', weapon='Axe/StoneAxe', brows='Angry', mouth='Angry', beard=True),
    'spore-caller': dict(hair='Leaky', hc='grey', skin=(0.8, 0.95, 0.7), armor='DruidArmor', helmet='DruidHat [Paint]', weapon='Wand/DruidWand', eyes=GLOW),
    'grove-mender': dict(hair='LongHair', hc='blond', skin='light', armor='ShamanArmor', weapon='Wand/ShamanWand', eyes='Female'),
    'moss-warden': dict(hair='BuzzCut', hc='brown', skin='tan', armor='HeavyArmor [Paint]', helmet='HeavyHelm [Paint]', atint=(0.55, 0.8, 0.5), shield='OldHeavyShield', weapon='Hammer/WoodenMace'),
    # Ember Coast: reavers and the tide-touched
    'reef-raider': dict(hair='ShortPonytail', hc='black', skin='brown', armor='MarauderArmor [Paint]', atint=TIDE, weapon='Sword/Machete [Paint]', eyes='Female', mouth='Smirk'),
    'shell-guard': dict(hair='BuzzCut', hc='black', skin='tan', armor='IronPlateArmor [Paint]', helmet='SteelHelm [Paint]', atint=TIDE, shield='SteelTowerShield', weapon='Hammer/WarHammer'),
    'tide-caller': dict(hair='LongHair', hc='white', skin=TIDE, armor='WaterWizardArmor', helmet='WaterWizardHelm', weapon='Wand/WaterWizardWand', eyes=GLOW),
    'brine-cleric': dict(hair='PushedBack', hc='white', skin='tan', armor='WaterAdept', weapon='Wand/WaterAdeptWand1'),
    'harbor-brute': dict(hair='BuzzCut', hc='red', skin='light', armor='LeatherRivetedArmor', weapon='Hammer/WoodenClub', brows='Angry', mouth='Angry', beard=True),
    'sea-hag': dict(hair='LongHair', hc='grey', skin=TIDE, armor='Rags2', weapon='Wand/DrownedGoblinHand', eyes=GLOW, mouth='Smirk'),
    # Sun Kingdoms: the fire-sworn
    'ash-runner': dict(hair='SideFringe', hc='black', skin=FIRE, armor='AssassinArmor [Paint]', atint=FIRE, weapon='Sword/AssassinDagger [Paint]', eyes=GLOW),
    'pyre-zealot': dict(hair='Mohawk', hc='red', skin=FIRE, armor='PyromancerArmor', weapon='Wand/PyromancerWand', eyes=GLOW, mouth='Angry'),
    'sun-templar': dict(hair='ShortHair', hc='blond', skin='tan', armor='PaladinArmor [Paint]', helmet='PaladinHelm [Paint]', atint=(1.0, 0.85, 0.55), shield='CrusaderShield', weapon='Sword/KnightSword [Paint]'),
    'ember-acolyte': dict(hair='BuzzCut', hc='red', skin=FIRE, armor='FireAdept', helmet='FireAdeptHood', weapon='Wand/FireAdeptWand1', eyes=GLOW),
    'arena-brute': dict(hair='BuzzCut', hc='black', skin='brown', armor='GladiatorArmor', helmet='GladiatorHelm1', shield='GladiatorShield', weapon='Sword/FireWarriorSword1'),
    # Storm Isles: the storm-sworn
    'gale-skirmisher': dict(hair='ShortPonytail', hc='white', skin=STORM, armor='Scout [Paint]', atint=STORM, weapon='Sword/Stoccata', eyes='Female'),
    'storm-adept': dict(hair='LongHair', hc='white', skin=STORM, armor='StormBringerArmor', weapon='Wand/StormBringerWand', eyes=GLOW),
    'cliff-brute': dict(hair='Shaggy', hc='black', skin='tan', armor='SpikedArmor', weapon='Hammer/Morgenstern', brows='Angry', mouth='Angry', beard=True),
    'wind-shaman': dict(hair='Leaky', hc='grey', skin='brown', armor='ShamanArmor', helmet='ShamanHelm [FullHair]', weapon='Wand/ShamanWand'),
    'thunder-shield': dict(hair='BuzzCut', hc='black', skin='light', armor='KnightArmor [Paint]', helmet='VisorKnightHelm [Paint]', atint=STORM, shield='TowerShield', weapon='Hammer/WarHammer'),
    # Frost Frontier: the frost-touched
    'frost-reaver': dict(hair='Shaggy', hc='white', skin=FROST, armor='Vikings/VikingRoughArmor1', helmet='Vikings/VikingIronHelm1', weapon='Axe/RunicAxe', eyes=GLOW, mouth='Angry'),
    'tusk-brute': dict(hair='Mohawk', hc='blond', skin='light', armor='Vikings/VikingFurArmor', weapon='Axe/DreadCleaver', brows='Angry', mouth='Angry', beard=True),
    'rime-seer': dict(hair='LongHair', hc='white', skin=FROST, armor='IceWizardArmor', helmet='IceWizardHood', weapon='Wand/IceWizardWand', eyes=GLOW),
    'rime-mother': dict(hair='LongHair', hc='white', skin=FROST, armor='Robe', atint=FROST, cape='GrandmaCape [Paint]', weapon='Wand/HermitWand', eyes='Female'),
    'frostbound': dict(hair='BuzzCut', hc='white', skin=FROST, armor='IronPlateArmor [Paint]', helmet='HeavyHelm [Paint]', atint=FROST, shield='SteelTowerShield', weapon='Hammer/DarkStoneHammer', eyes=GLOW),
    # The Far Veil: the hollow dead and the Veil-touched
    'veil-wraith': dict(body='skeleton', armor='Undead [Preview]/SkeletonArmor1', helmet='AssassinHood [Paint]', atint=VOID, eyes=GLOW, weapon='Sword/RustySword'),
    'mind-thief': dict(hair='SideFringe', hc='black', skin=VOID, armor='WarlockArmor', helmet='WarlockHood', weapon='Wand/WarlockWand', eyes=GLOW, mask='CarnivalMask'),
    'hollow-knight': dict(body='skeleton', armor='DarkKnight', helmet='Undead [Preview]/SkeletonHelm', shield='DarkKnightShield', weapon='Sword/RustySword', eyes=GLOW),
    'dream-weaver': dict(hair='LongHair', hc='white', skin=VOID, armor='NecromancerArmor', helmet='NecromancerHood', weapon='Wand/MalformedStaff', eyes=GLOW),
    'void-juggernaut': dict(hair='BuzzCut', hc='black', skin=VOID, armor='DestroyerArmor [Paint]', helmet='DestroyerHelm [Paint]', atint=VOID, weapon='Hammer/DarkStoneHammer', eyes=GLOW),
    # Regional bosses
    'boss-oswin': dict(body='skeleton', armor='GreyKnight', helmet='Undead [Preview]/SkeletonHelm', shield='GreyKnightShield', weapon='Sword/InquisitorSword2 [Paint]', eyes=GLOW, cape='OldCape [Paint]'),
    'boss-briarmother': dict(hair='LongHair', hc='grey', skin=(0.78, 0.92, 0.66), armor='DruidArmor', helmet='DruidHat [Paint]', atint=(0.6, 0.85, 0.5), weapon='Wand/DruidWand', eyes=GLOW, cape='GrandmaCape [Paint]'),
    'boss-maelra': dict(hair='LongHair', hc='white', skin=TIDE, armor='ArielDress [Paint]', atint=TIDE, weapon='Wand/WaterWizardWand', eyes=GLOW, mouth='Smirk'),
    'boss-pyrelord': dict(hair='Mohawk', hc='red', skin=FIRE, armor='FireKnightArmor [Paint]', atint=FIRE, shield='FireKnightShield', weapon='Sword/FireWarriorSword2', eyes=GLOW, cape='RoyalCape [Paint]'),
    'boss-tempest': dict(hair='ShortPonytail', hc='white', skin=STORM, armor='StormBringerArmor', weapon='Sword/MagicSword [Paint]', eyes=GLOW, cape='HeroicCape2 [Paint]'),
    'boss-jarnvald': dict(hair='LongHair', hc='white', skin=FROST, armor='Vikings/VikingRoughArmor3 [Paint]', helmet='Vikings/VikingIronHelm3', atint=FROST, shield='OldHeavyShield', weapon='Axe/RunicAxe', eyes=GLOW, beard=True),
    'boss-nameless': dict(hair='LongHair', hc='black', skin=VOID, armor='NecromancerArmor', mask='Mask2 [Paint]', weapon='Wand/CursedBone', eyes=GLOW, cape='VampireCape [Paint]'),
    # Wild-area bosses
    'ash-abbot': dict(hair='BuzzCut', hc='grey', skin='fair', armor='CardinalArmor', helmet='CardinalHat [Paint]', atint=(0.42, 0.36, 0.42), weapon='Wand/CursedBone', eyes=GLOW, glow=(255, 120, 40), cape='VampireCape [Paint]', mouth='Smirk'),
    'grey-alpha': dict(hair='Shaggy', hc='grey', skin='light', armor='Vikings/VikingFurArmor', helmet='Vikings/VikingIronHelm2', weapon='Axe/DreadCleaver', brows='Angry', mouth='Angry', beard=True, cape='OldCape2 [Paint]'),
    'bandit-captain': dict(hair='Slicked', hc='black', skin='tan', armor='MercenaryArmor [Paint]', helmet='MercenaryHelm1 [Paint]', shield='KiteShield', weapon='Sword/GuardSword1 [Paint]', brows='Angry', mouth='Smirk'),
    'lantern-brood': dict(hair='LongHair', hc='white', skin=VOID, armor='WarlockArmor', helmet='HermitHood [Paint]', atint=VOID, shield='HermitLamp', weapon='Wand/WarlockWand', eyes=GLOW, cape='VampireCape [Paint]'),
}

# Glowing eyes take the colour of the element in the skin.
GLOWS = {FIRE: (255, 140, 40), FROST: (110, 220, 255), VOID: (200, 90, 255), TIDE: (70, 230, 200), STORM: (170, 190, 255)}
for _spec in FOES.values():
    if _spec.get('eyes') == GLOW and _spec.get('skin') in GLOWS:
        _spec.setdefault('glow', GLOWS[_spec['skin']])

# Map art for the enemy groups standing in wild areas (and contract sites): who stands in each.
GROUPS = {
    'enemy.group.bandits': ['road-bandit', 'shield-thug', 'field-priest'],
    'enemy.group.wolfskins': ['wolfskin', 'road-bandit', 'wolfskin'],
    'enemy.group.witch': ['hedge-witch', 'shield-thug'],
    'enemy.group.stalkers': ['thorn-stalker', 'thorn-stalker'],
    'enemy.group.spores': ['spore-caller', 'grove-mender'],
    'enemy.group.barkhides': ['bark-brute', 'moss-warden'],
    'enemy.group.wraiths': ['veil-wraith', 'mind-thief', 'veil-wraith'],
    'enemy.group.hollow': ['hollow-knight', 'void-juggernaut'],
}
BOSSES = {'enemy.boss.abbot': 'ash-abbot', 'enemy.boss.alpha': 'grey-alpha', 'enemy.boss.captain': 'bandit-captain', 'enemy.boss.lanterneater': 'lantern-brood'}

BOX = (300, 330)
FEET = (150, 310)


def battle_still(rig, parts):
    """Full size, facing left (enemies stand on the right in battle)."""
    im = rig.render(parts, size=BOX, origin=FEET)
    return ImageOps.mirror(im.crop(im.getbbox()) if im.getbbox() else im)


def group_image(stills):
    """Two or three foes side by side, the middle one in front, for the map (about 2:1)."""
    h = max(s.height for s in stills)
    step = int(max(s.width for s in stills) * 0.55)
    w = step * (len(stills) - 1) + max(s.width for s in stills)
    canvas = Image.new('RGBA', (w, h))
    order = list(range(len(stills)))
    if len(stills) == 3:
        order = [0, 2, 1]  # the middle one drawn last, in front
    for i in order:
        s = stills[i]
        canvas.alpha_composite(s, (i * step, h - s.height))
    return canvas
