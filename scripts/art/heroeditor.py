"""Assemble HeroEditor (Unity) characters into flat PNGs and walk sheets.

Reads the Human.prefab rig (bones, sorting orders, which parts are active) and
the sliced sprite sheets (.meta rects and pivots) from the private art repo, and
draws a character from a recipe: body, head, hair, eyes, armor, weapon...
Used by scripts/art/import_myart.py. Needs Pillow.
"""
import math, os, re, glob
from PIL import Image

PPU = 100


def _meta_slices(png):
    """{name: (x, y, w, h, px, py)} and {fileID: name} from a sprite .meta."""
    txt = open(png + '.meta').read()
    ids = {}
    for m in re.finditer(r'213: (-?\d+)\n    second: (.+)', txt):
        ids[m.group(1)] = m.group(2).strip()
    for m in re.finditer(r'(\d{6,}): (\S+)\n', txt.split('externalObjects')[0] if 'fileIDToRecycleName' in txt else ''):
        ids.setdefault(m.group(1), m.group(2))
    slices = {}
    single = re.search(r'spriteMode: 1\b', txt)
    for m in [] if single else re.finditer(r'      name: (.+)\n(?:.*\n){0,3}?      rect:\n        serializedVersion: 2\n        x: ([\d.]+)\n        y: ([\d.]+)\n        width: ([\d.]+)\n        height: ([\d.]+)\n      alignment: \d+\n      pivot: \{x: ([-\d.e]+), y: ([-\d.e]+)\}', txt):
        n = m.group(1).strip()
        slices[n] = tuple(float(v) for v in m.groups()[1:])
    if not slices:
        # a single sprite: whole image, pivot from spritePivot
        im = Image.open(png)
        p = re.search(r'spritePivot: \{x: ([-\d.e]+), y: ([-\d.e]+)\}', txt)
        px, py = (float(p.group(1)), float(p.group(2))) if p else (0.5, 0.5)
        slices['_'] = (0, 0, im.width, im.height, px, py)
    return slices, ids


class Library:
    def __init__(self, root):
        self.root = root
        self.guid = {}
        for meta in glob.glob(os.path.join(root, '**', '*.png.meta'), recursive=True):
            g = re.search(r'guid: (\w+)', open(meta).read())
            if g:
                self.guid[g.group(1)] = meta[:-5]
        self._cache = {}

    def sheet(self, png):
        if png not in self._cache:
            im = Image.open(png).convert('RGBA')
            slices, ids = _meta_slices(png)
            self._cache[png] = (im, slices, ids)
        return self._cache[png]

    def sprite(self, png, name=None):
        im, slices, _ = self.sheet(png)
        key = name if name in slices else ('_' if '_' in slices else None)
        if key is None:
            return None
        x, y, w, h, px, py = slices[key]
        top = im.height - y - h
        crop = im.crop((int(x), int(top), int(x + w), int(top + h)))
        return crop, (px * w, (1 - py) * h)


def _recolor_iris(img, rgb):
    """Repaints the coloured part of an eye sprite (the iris) in another colour, keeping its shading."""
    import colorsys
    th, ts, _ = colorsys.rgb_to_hsv(*[c / 255 for c in rgb])
    out = []
    for r, g, b, a in img.getdata():
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if a and s > 0.25:
            nr, ng, nb = colorsys.hsv_to_rgb(th, min(1, ts * (0.6 + s * 0.5)), v * (0.55 + 0.45 * (rgb[0] + rgb[1] + rgb[2]) / 765))
            out.append((int(nr * 255), int(ng * 255), int(nb * 255), a))
        else:
            out.append((r, g, b, a))
    img = img.copy()
    img.putdata(out)
    return img


def _quat_angle(z, w):
    return 2 * math.atan2(z, w)


class Rig:
    def __init__(self, prefab, lib):
        txt = open(prefab).read()
        parts = re.split(r'\n--- !u!(\d+) &(\d+)[^\n]*\n', txt)
        objs = {parts[i + 1]: (parts[i], parts[i + 2]) for i in range(1, len(parts), 3)}
        self.go, self.active, self.tr, self.sr = {}, {}, {}, {}
        for fid, (cls, body) in objs.items():
            if cls == '1':
                self.go[fid] = re.search(r'm_Name: ?(.*)', body).group(1).strip()
                self.active[fid] = re.search(r'm_IsActive: (\d)', body).group(1) == '1'
            elif cls == '4':
                g = re.search(r'm_GameObject: \{fileID: (\d+)', body).group(1)
                f = lambda k: [float(v) for v in re.search(k + r': \{x: ([^,]+), y: ([^,]+), z: ([^,}]+)(?:, w: ([^}]+))?\}', body).groups() if v is not None]
                self.tr[fid] = dict(go=g, pos=f('m_LocalPosition'), rot=f('m_LocalRotation'), sc=f('m_LocalScale'),
                                    father=re.search(r'm_Father: \{fileID: (\d+)', body).group(1))
            elif cls == '212':
                g = re.search(r'm_GameObject: \{fileID: (\d+)', body).group(1)
                sp = re.search(r'm_Sprite: \{fileID: (-?\d+)(?:, guid: (\w+))?', body).groups()
                col = re.search(r'm_Color: \{r: ([^,]+), g: ([^,]+), b: ([^,]+), a: ([^}]+)\}', body)
                self.sr[g] = dict(order=int(re.search(r'm_SortingOrder: (-?\d+)', body).group(1)),
                                  enabled=re.search(r'm_Enabled: (\d)', body).group(1) == '1',
                                  sprite=sp, color=tuple(float(v) for v in col.groups()) if col else (1, 1, 1, 1))
        self.lib = lib
        self.by_go = {t['go']: k for k, t in self.tr.items()}

    def path(self, tf):
        p, k = [], tf
        while k in self.tr:
            p.append(self.go.get(self.tr[k]['go'], '?'))
            k = self.tr[k]['father']
        return '/'.join(reversed(p))

    def world(self, tf, pose):
        """(x, y, angle, sx, sy) of a transform, with pose overrides {name: degrees}."""
        chain, k = [], tf
        while k in self.tr and self.tr[k]['father'] in self.tr:  # the root's own place is ignored
            chain.append(k)
            k = self.tr[k]['father']
        x = y = a = 0.0
        sx = sy = 1.0
        for k in reversed(chain):
            t = self.tr[k]
            name = self.go.get(t['go'], '')
            lx, ly = t['pos'][0] * sx, t['pos'][1] * sy
            ca, sa = math.cos(a), math.sin(a)
            x, y = x + lx * ca - ly * sa, y + lx * sa + ly * ca
            a += _quat_angle(t['rot'][2], t['rot'][3]) + math.radians(pose.get(name, 0))
            sx, sy = sx * t['sc'][0], sy * t['sc'][1]
            if name in pose.get('_offset', {}):
                ox, oy = pose['_offset'][name]
                x, y = x + ox, y + oy
        return x, y, a, sx, sy

    def visible(self, tf):
        k = tf
        while k in self.tr:
            if not self.active.get(self.tr[k]['go'], True):
                return False
            k = self.tr[k]['father']
        return True

    def render(self, recipe, pose=None, size=(320, 400), origin=(160, 330), scale=1.0):
        """recipe: {slot: png path or (png, tint)}; slots named after the rig's renderers
        (Body, Head, Hair, Eyes, Eyebrows, Mouth, Ears, Beard, Armor, Helmet,
        MeleeWeapon, Shield, Cape, Back, Mask, Glasses)."""
        pose = pose or {}
        canvas = Image.new('RGBA', size, (0, 0, 0, 0))
        items = []
        for g, s in self.sr.items():
            tf = self.by_go.get(g)
            if tf is None or not s['enabled'] or not self.visible(tf):
                continue
            name = self.go[g]
            path = self.path(tf)
            if '/Firearm/' in path or '/Bow/' in path or name in ('Shadow',):
                continue
            base = re.sub(r'\[(\d|L|R)\]', '', name)
            if base.endswith('[Armor]'):
                slot, part = 'Armor', base[:-7]
            elif base in ('Torso', 'Pelvis', 'ArmL', 'ArmR', 'ForearmL', 'ForearmR', 'HandL', 'HandR', 'Leg', 'Shin', 'Finger') or base.startswith('Leg') :
                slot, part = 'Body', base
            else:
                slot, part = base, None
            choice = recipe.get(slot)
            if not choice:
                continue
            png, tint = (choice if isinstance(choice, tuple) else (choice, None))
            if slot == 'Body' and part == 'Finger':
                continue
            if slot == 'Armor' and isinstance(png, dict):
                png = png.get(part)
                if not png:
                    continue
            got = self.lib.sprite(png, part)
            if not got:
                continue
            items.append((s['order'], tf, got, tint, slot))
        for order, tf, (img, (pvx, pvy)), tint, slot in sorted(items, key=lambda i: i[0]):
            if tint and tint[0] == 'iris':
                img = _recolor_iris(img, tint[1])
            elif tint:
                r, g_, b = tint
                img = img.copy()
                img.putdata([(int(p[0] * r), int(p[1] * g_), int(p[2] * b), p[3]) for p in img.getdata()])
            x, y, a, sx, sy = self.world(tf, pose)
            k = scale
            # forward: canvas = origin + R(a) * S * (p - pivot) with y flipped
            ca, sa = math.cos(-a), math.sin(-a)
            m00, m01 = ca * sx * k, -sa * sy * k
            m10, m11 = sa * sx * k, ca * sy * k
            tx = origin[0] + x * PPU * k
            ty = origin[1] - y * PPU * k
            det = m00 * m11 - m01 * m10
            i00, i01, i10, i11 = m11 / det, -m01 / det, -m10 / det, m00 / det
            # inverse: p = pivot + inv * (c - t)
            c0 = pvx - (i00 * tx + i01 * ty)
            c1 = pvy - (i10 * tx + i11 * ty)
            layer = img.transform(size, Image.AFFINE, (i00, i01, c0, i10, i11, c1), resample=Image.BICUBIC)
            canvas.alpha_composite(layer)
        return canvas
