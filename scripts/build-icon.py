"""
Build a multi-resolution .ico icon for IT Support Lab Academy.

The icon uses the brand palette (deep indigo + electric violet + cyan accent)
and a clean graduation cap over a stylized "circuit" background, evoking both
the academic and IT-professional themes of the app.

Outputs:
  public/favicon.svg       - 32x32 vector
  public/icon-256.png       - 256x256 master PNG (used by electron-builder)
  public/icon-512.png       - 512x512 master PNG
  public/icon.ico           - Multi-res ICO (16, 32, 48, 64, 128, 256)
  build-assets/installer-icon.ico - Same .ico for electron-builder win.target
  build-assets/installer-banner.png - 164x314 banner for the installer
"""
from __future__ import annotations
import io
import os
import struct
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
BUILD = ROOT / 'build-assets'
PUBLIC.mkdir(exist_ok=True)
BUILD.mkdir(exist_ok=True)

# Brand palette
INDIGO = (67, 56, 202)        # primary deep indigo
VIOLET = (124, 58, 237)       # secondary
CYAN = (34, 211, 238)         # accent
WHITE = (255, 255, 255)
INK = (15, 23, 42)            # slate-900
INK_SOFT = (30, 41, 59)       # slate-800


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def make_background(width: int, height: int | None = None) -> Image.Image:
    """Rounded-square gradient background from indigo to violet with a soft
    glow at the top-left and a subtle vignette. Defaults to a square if
    only `width` is provided."""
    if height is None:
        height = width
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    px = img.load()
    # Diagonal gradient from indigo (top-left) to violet (bottom-right)
    for y in range(height):
        for x in range(width):
            t = (x + y) / (max(1, (width - 1) + (height - 1)))
            color = lerp(INDIGO, VIOLET, t)
            px[x, y] = (*color, 255)
    return img


def make_circuit_layer(size: int) -> Image.Image:
    """Subtle circuit-board texture: faint cyan lines and nodes at a fraction
    of full opacity so the icon reads as IT-themed without distracting from
    the cap. Drawn at the target size and composited onto the gradient."""
    layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    # Lines: a horizontal/vertical grid with small "chip" rectangles
    alpha_line = 38
    alpha_node = 90
    step = max(8, size // 8)
    for i in range(0, size + 1, step):
        draw.line([(i, 0), (i, size)], fill=(*CYAN, alpha_line), width=1)
        draw.line([(0, i), (size, i)], fill=(*CYAN, alpha_line), width=1)
    # A few "chips" — small rounded squares at grid intersections
    for y in range(step, size - step, step * 2):
        for x in range(step, size - step, step * 2):
            r = max(2, size // 64)
            draw.rectangle([(x - r, y - r), (x + r, y + r)], fill=(*CYAN, alpha_node))

    return layer


def make_glow(size: int) -> Image.Image:
    """A soft cyan glow at the top to give the icon a bit of life."""
    glow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    r = int(size * 0.55)
    g.ellipse(
        [(size // 2 - r // 2, -r // 3), (size // 2 + r // 2, r)],
        fill=(*CYAN, 110),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=size / 30))
    return glow


def make_cap(size: int) -> Image.Image:
    """Graduation cap (mortarboard) drawn in white with a cyan tassel. Drawn
    at the target size; we keep it geometric so it reads cleanly even at
    16x16."""
    cap = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(cap)

    # The cap is centered. We use fractions of `size` for every measurement
    # so it scales smoothly.
    s = size
    cx, cy = s // 2, int(s * 0.46)

    # --- Cap base (the "head" portion, under the mortarboard) ---
    base_w = int(s * 0.42)
    base_h = int(s * 0.16)
    base_top = cy + int(s * 0.02)
    # Rounded shape (ellipse-top rectangle)
    d.ellipse(
        [(cx - base_w // 2, base_top), (cx + base_w // 2, base_top + base_h * 2)],
        fill=INK_SOFT,
    )
    # Trim the ellipse to a flat-bottom band
    d.rectangle(
        [(cx - base_w // 2, base_top + base_h), (cx + base_w // 2, base_top + base_h + 2)],
        fill=INK_SOFT,
    )

    # --- Mortarboard (the flat square on top, drawn as a rotated square) ---
    board_w = int(s * 0.58)
    board_h = int(s * 0.30)
    # A rhombus/diamond: top, right, bottom, left points
    top = (cx, cy - board_h // 2)
    right = (cx + board_w // 2, cy)
    bottom = (cx, cy + board_h // 2)
    left = (cx - board_w // 2, cy)
    d.polygon([top, right, bottom, left], fill=WHITE, outline=INK)

    # Inner border on the mortarboard for a little depth
    inset = max(1, s // 80)
    d.polygon(
        [
            (top[0], top[1] + inset * 4),
            (right[0] - inset * 4, right[1]),
            (bottom[0], bottom[1] - inset * 4),
            (left[0] + inset * 4, left[1]),
        ],
        outline=(*INK, 110),
    )

    # --- Button on the cap (small circle in the center) ---
    btn_r = max(2, s // 40)
    d.ellipse(
        [(cx - btn_r, cy - btn_r), (cx + btn_r, cy + btn_r)],
        fill=CYAN,
        outline=INK,
    )

    # --- Tassel (cyan cord hanging from the right side) ---
    # Cord: a thin line from the center button to the right corner, then
    # down with a small fringe at the end.
    cord_w = max(2, s // 64)
    right_anchor = (right[0] - s // 60, right[1] - s // 200)
    d.line([(cx, cy), right_anchor], fill=(*CYAN, 230), width=cord_w)
    # Tassel drop
    drop_top = right_anchor[1] + 2
    drop_bottom = drop_top + int(s * 0.18)
    drop_x = right_anchor[0] + int(s * 0.02)
    # Cord from anchor down to drop top
    d.line(
        [(right_anchor[0], right_anchor[1]), (drop_x, drop_top + s // 60)],
        fill=(*CYAN, 230),
        width=cord_w,
    )
    # Tassel body (a small rounded rectangle)
    tassel_w = max(3, s // 28)
    tassel_h = int(s * 0.13)
    d.rounded_rectangle(
        [
            (drop_x - tassel_w // 2, drop_top + s // 60),
            (drop_x + tassel_w // 2, drop_top + s // 60 + tassel_h),
        ],
        radius=tassel_w // 2,
        fill=CYAN,
        outline=INK,
    )

    return cap


def render(size: int, rounded: bool = True, radius_ratio: float = 0.22) -> Image.Image:
    """Composite the gradient + circuit + glow + cap into a final RGBA icon.
    If `rounded`, the icon is masked with a rounded-square shape (standard
    app-icon look). If False, the icon is left square (for legacy favicons)."""
    bg = make_background(size, size)
    glow = make_glow(size)
    circuit = make_circuit_layer(size)
    cap = make_cap(size)

    img = Image.alpha_composite(bg, glow)
    img = Image.alpha_composite(img, circuit)
    img = Image.alpha_composite(img, cap)

    if rounded:
        mask = Image.new('L', (size, size), 0)
        md = ImageDraw.Draw(mask)
        r = int(size * radius_ratio)
        md.rounded_rectangle([(0, 0), (size - 1, size - 1)], radius=r, fill=255)
        out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        out.paste(img, (0, 0), mask)
        return out
    return img


def make_favicon_svg() -> str:
    """Vector favicon mirroring the PNG composition. We keep it as a hand
    written SVG so it stays sharp at any zoom."""
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">'
        '<defs>'
        '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">'
        '<stop offset="0%" stop-color="#4338ca"/>'
        '<stop offset="100%" stop-color="#7c3aed"/>'
        '</linearGradient>'
        '<radialGradient id="glow" cx="50%" cy="0%" r="60%">'
        '<stop offset="0%" stop-color="#22d3ee" stop-opacity="0.45"/>'
        '<stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>'
        '</radialGradient>'
        '</defs>'
        '<rect x="0" y="0" width="64" height="64" rx="14" fill="url(#bg)"/>'
        '<rect x="0" y="0" width="64" height="64" rx="14" fill="url(#glow)"/>'
        # Subtle grid (very low opacity)
        '<g stroke="#22d3ee" stroke-opacity="0.18" stroke-width="0.5">'
        '<line x1="0" y1="16" x2="64" y2="16"/>'
        '<line x1="0" y1="32" x2="64" y2="32"/>'
        '<line x1="0" y1="48" x2="64" y2="48"/>'
        '<line x1="16" y1="0" x2="16" y2="64"/>'
        '<line x1="32" y1="0" x2="32" y2="64"/>'
        '<line x1="48" y1="0" x2="48" y2="64"/>'
        '</g>'
        # Cap base
        '<ellipse cx="32" cy="36" rx="14" ry="6" fill="#1e293b"/>'
        # Mortarboard
        '<polygon points="32,18 52,30 32,42 12,30" fill="#ffffff" stroke="#0f172a" stroke-width="1.2"/>'
        # Button
        '<circle cx="32" cy="30" r="2" fill="#22d3ee" stroke="#0f172a" stroke-width="0.8"/>'
        # Tassel
        '<line x1="32" y1="30" x2="50" y2="30" stroke="#22d3ee" stroke-width="1.5"/>'
        '<line x1="50" y1="30" x2="52" y2="38" stroke="#22d3ee" stroke-width="1.5"/>'
        '<rect x="50" y="38" width="4" height="8" rx="2" fill="#22d3ee" stroke="#0f172a" stroke-width="0.8"/>'
        '</svg>'
    )


def make_banner(width: int = 164, height: int = 314) -> Image.Image:
    """The installer side banner (small) used by electron-builder. Uses the
    same palette so the install dialog looks branded."""
    img = make_background(width, height)
    # Add a vertical gradient overlay so it reads vertically
    overlay = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    for y in range(height):
        a = int(60 * (1 - y / height))
        d.line([(0, y), (width, y)], fill=(*INK, a))
    img = Image.alpha_composite(img, overlay)

    # Cap centered horizontally, slightly above center
    cap = make_cap(width)
    img.paste(cap, (0, height // 4), cap)

    # Brand mark text (drawn as a simple geometric logotype so we don't
    # need a system font): a thick "IT" / "LAB" using rectangles. We
    # render a simple "SL" monogram since pure text with PIL needs a font
    # file we don't want to ship.
    d = ImageDraw.Draw(img)
    # Title bar
    bar_y = int(height * 0.78)
    d.rectangle(
        [(12, bar_y), (width - 12, bar_y + 3)],
        fill=CYAN,
    )
    # Tagline bars (placeholder for "IT Support Lab" wordmark)
    for i, w in enumerate([width - 60, width - 30, width - 80]):
        d.rectangle(
            [(12, bar_y + 12 + i * 10), (w, bar_y + 12 + i * 10 + 4)],
            fill=WHITE,
        )

    return img


def write_multi_size_ico(images: list[Image.Image], out_path: Path) -> None:
    """Write a true multi-resolution .ico file.

    PIL's ICO writer has a long-standing bug where it embeds only the first
    image when the input is RGBA. We work around it by writing the file
    manually using PNG-encoded entries (the format Windows accepts for
    > 256x256 sizes and for any modern app icon).
    """
    entries: list[tuple[bytes, int, int]] = []  # (png_bytes, w, h)
    for img in images:
        buf = io.BytesIO()
        # Save as PNG inside the ICO entry — supported since Vista.
        img.save(buf, format='PNG', optimize=True)
        w, h = img.size
        # ICO header uses 0 to mean 256
        entries.append((buf.getvalue(), w if w < 256 else 0, h if h < 256 else 0))

    # Build the file
    n = len(entries)
    header = struct.pack('<HHH', 0, 1, n)  # reserved, type=ICO, count
    # ICONDIRENTRY is 16 bytes: w, h, ncolors, reserved, planes, bpp, size, offset
    dir_size = 16 * n
    offset = 6 + dir_size
    directory = b''
    body = b''
    for png_bytes, w, h in entries:
        directory += struct.pack(
            '<BBBBHHII',
            w,
            h,
            0,  # ncolors (palette; 0 for >8bpp)
            0,  # reserved
            1,  # planes
            32,  # bpp
            len(png_bytes),
            offset,
        )
        body += png_bytes
        offset += len(png_bytes)

    out_path.write_bytes(header + directory + body)


def main() -> None:
    # PNG masters
    for sz, name in [(256, 'icon-256.png'), (512, 'icon-512.png')]:
        out = render(sz, rounded=True)
        out.save(PUBLIC / name, 'PNG', optimize=True)
        print(f'wrote {PUBLIC / name}')

    # Multi-resolution ICO via custom writer (PIL's writer only embeds one
    # image when given RGBA inputs).
    ico_sizes = [16, 32, 48, 64, 128, 256]
    ico_imgs = [render(s, rounded=True) for s in ico_sizes]
    write_multi_size_ico(ico_imgs, PUBLIC / 'favicon.ico')
    print(f'wrote {PUBLIC / "favicon.ico"}')

    # SVG favicon
    svg = make_favicon_svg()
    (PUBLIC / 'favicon.svg').write_text(svg, encoding='utf-8')
    print(f'wrote {PUBLIC / "favicon.svg"}')

    # Copy the 256 PNG and the ICO into build-assets for electron-builder
    import shutil
    shutil.copyfile(PUBLIC / 'icon-256.png', BUILD / 'icon.png')
    shutil.copyfile(PUBLIC / 'favicon.ico', BUILD / 'installer-icon.ico')
    shutil.copyfile(PUBLIC / 'icon-512.png', BUILD / 'icon-512.png')

    # Banner
    banner = make_banner()
    banner.save(BUILD / 'installer-banner.png', 'PNG', optimize=True)
    print(f'wrote {BUILD / "installer-banner.png"}')

    # Square (non-rounded) 256x256 for the .desktop and installer fallback
    sq = render(256, rounded=False)
    sq.save(BUILD / 'icon-square.png', 'PNG', optimize=True)
    print(f'wrote {BUILD / "icon-square.png"}')

    print('done.')


if __name__ == '__main__':
    main()
