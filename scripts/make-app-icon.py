"""Génère l'icône source 1024x1024 de l'app (dégradé violet -> magenta -> or +
emblème épées croisées), utilisée ensuite par `tauri icon`.
Usage : python scripts/make-app-icon.py
"""
from PIL import Image, ImageDraw
import math

SIZE = 1024
BRAND_1 = (167, 139, 250)  # violet
BRAND_2 = (217, 70, 168)  # magenta
BRAND_3 = (245, 197, 66)  # or


def lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def brand_color(t: float):
    if t < 0.5:
        return lerp(BRAND_1, BRAND_2, t / 0.5)
    return lerp(BRAND_2, BRAND_3, (t - 0.5) / 0.5)


def rounded_mask(size, radius):
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return mask


def main():
    img = Image.new("RGB", (SIZE, SIZE))
    px = img.load()
    # dégradé diagonal (haut-gauche violet -> bas-droite or)
    for y in range(SIZE):
        for x in range(SIZE):
            t = (x + y) / (2 * SIZE)
            px[x, y] = brand_color(t)

    # halo radial sombre pour la profondeur
    overlay = Image.new("L", (SIZE, SIZE), 0)
    od = ImageDraw.Draw(overlay)
    od.ellipse([-SIZE * 0.3, -SIZE * 0.3, SIZE * 1.3, SIZE * 1.3], fill=40)
    dark = Image.new("RGB", (SIZE, SIZE), (10, 10, 18))
    img = Image.composite(img, dark, overlay.point(lambda v: 255 - v))

    draw = ImageDraw.Draw(img)

    # emblème : deux épées croisées (lignes épaisses blanches + garde + pommeau)
    cx, cy = SIZE / 2, SIZE / 2
    blade_len = SIZE * 0.30
    blade_w = SIZE * 0.045

    def sword(angle_deg, color=(255, 255, 255)):
        a = math.radians(angle_deg)
        dx, dy = math.cos(a), math.sin(a)
        px_, py_ = -dy, dx
        # lame : rectangle plein qui se termine en pointe côté "haut"
        tip_len = SIZE * 0.09
        x_tip, y_tip = cx - dx * (blade_len + tip_len), cy - dy * (blade_len + tip_len)
        x_shoulder, y_shoulder = cx - dx * blade_len, cy - dy * blade_len
        x_hilt, y_hilt = cx + dx * blade_len, cy + dy * blade_len
        half = blade_w / 2
        draw.polygon(
            [
                (x_tip, y_tip),
                (x_shoulder + px_ * half, y_shoulder + py_ * half),
                (x_hilt + px_ * half, y_hilt + py_ * half),
                (x_hilt - px_ * half, y_hilt - py_ * half),
                (x_shoulder - px_ * half, y_shoulder - py_ * half),
            ],
            fill=color,
        )
        # garde (perpendiculaire) proche de la poignée
        gx, gy = cx + dx * blade_len * 0.62, cy + dy * blade_len * 0.62
        guard = SIZE * 0.085
        draw.line(
            [gx - px_ * guard, gy - py_ * guard, gx + px_ * guard, gy + py_ * guard],
            fill=color,
            width=int(blade_w * 0.6),
        )
        # pommeau
        draw.ellipse(
            [x_hilt - blade_w * 0.55, y_hilt - blade_w * 0.55, x_hilt + blade_w * 0.55, y_hilt + blade_w * 0.55],
            fill=color,
        )

    sword(58, (255, 255, 255))
    sword(-32, (255, 255, 255))

    # coins arrondis + fond transparent hors du rayon (pour les usages "squircle")
    mask = rounded_mask(SIZE, int(SIZE * 0.22))
    rgba = img.convert("RGBA")
    rgba.putalpha(mask)

    out = "src-tauri/icons/app-icon-source.png"
    rgba.save(out)
    print("Écrit", out)

    # variante fond plein (sans alpha), utile pour `tauri icon` qui préfère un carré plein
    solid = Image.new("RGB", (SIZE, SIZE), (10, 10, 18))
    solid.paste(img, (0, 0))
    solid.save("src-tauri/icons/app-icon-solid.png")
    print("Écrit src-tauri/icons/app-icon-solid.png")


if __name__ == "__main__":
    main()
