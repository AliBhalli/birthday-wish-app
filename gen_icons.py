from PIL import Image, ImageDraw, ImageFilter
import math

def lerp(a, b, t):
    return a + (b - a) * t

def gradient_bg(size, c1, c2):
    img = Image.new("RGB", (size, size), c1)
    top = Image.new("RGB", (size, size), c1)
    draw = ImageDraw.Draw(top)
    for y in range(size):
        t = y / size
        r = int(lerp(c1[0], c2[0], t))
        g = int(lerp(c1[1], c2[1], t))
        b = int(lerp(c1[2], c2[2], t))
        draw.line([(0, y), (size, y)], fill=(r, g, b))
    return top

def rounded_mask(size, radius):
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return mask

def draw_gift(draw, cx, cy, s, color_box, color_ribbon, color_bow):
    # box
    box_w, box_h = s * 0.62, s * 0.44
    x0, y0 = cx - box_w / 2, cy - box_h / 2 + s * 0.06
    x1, y1 = cx + box_w / 2, cy + box_h / 2 + s * 0.06
    r = s * 0.06
    draw.rounded_rectangle([x0, y0, x1, y1], radius=r, fill=color_box)
    # lid
    lid_h = box_h * 0.32
    lx0, ly0 = cx - box_w / 2 - s * 0.02, y0 - lid_h
    lx1, ly1 = cx + box_w / 2 + s * 0.02, y0 + s * 0.03
    draw.rounded_rectangle([lx0, ly0, lx1, ly1], radius=r * 0.8, fill=color_box)
    # vertical ribbon
    rw = s * 0.09
    draw.rectangle([cx - rw / 2, ly0, cx + rw / 2, y1], fill=color_ribbon)
    # bow (two loops)
    bow_r = s * 0.09
    draw.ellipse([cx - bow_r * 2.0, ly0 - bow_r * 1.1, cx - bow_r * 0.2, ly0 + bow_r * 0.7], fill=color_bow)
    draw.ellipse([cx + bow_r * 0.2, ly0 - bow_r * 1.1, cx + bow_r * 2.0, ly0 + bow_r * 0.7], fill=color_bow)
    draw.ellipse([cx - bow_r * 0.55, ly0 - bow_r * 0.55, cx + bow_r * 0.55, ly0 + bow_r * 0.55], fill=color_bow)

def make_icon(size, maskable=False, filename="icon.png"):
    pad_scale = 0.72 if maskable else 0.86
    img = gradient_bg(size, (200, 179, 245), (255, 200, 214)).convert("RGBA")

    # soft glow circle
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gr = size * 0.62
    gd.ellipse([size/2-gr/2, size/2-gr/2, size/2+gr/2, size/2+gr/2], fill=(255, 255, 255, 60))
    glow = glow.filter(ImageFilter.GaussianBlur(size * 0.06))
    img = Image.alpha_composite(img, glow)

    draw = ImageDraw.Draw(img)
    s = size * pad_scale
    draw_gift(draw, size/2, size/2, s, (255, 255, 255, 235), (255, 179, 71, 255), (255, 138, 101, 255))

    if not maskable:
        mask = rounded_mask(size, size * 0.22)
        out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        out.paste(img, (0, 0), mask)
        img = out

    img.save(filename)

sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512]
for s in sizes:
    make_icon(s, maskable=False, filename=f"assets/icons/icon-{s}.png")

make_icon(512, maskable=True, filename="assets/icons/icon-maskable-512.png")
make_icon(192, maskable=True, filename="assets/icons/icon-maskable-192.png")

# favicon
make_icon(32, maskable=False, filename="assets/icons/favicon-32.png")
make_icon(16, maskable=False, filename="assets/icons/favicon-16.png")

print("done")
