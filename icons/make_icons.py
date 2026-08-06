# -*- coding: utf-8 -*-
"""纯标准库生成 PWA 图标，不依赖 Pillow。蓝粉渐变圆角方块 + 白色调色盘。"""
import zlib, struct, math, os

OUT = os.path.dirname(os.path.abspath(__file__))
SS = 1536  # 主渲染尺寸


def lerp(a, b, t):
    return a + (b - a) * t


def grad(x, y, n):
    # 135 度三段渐变 #7AA5F7 -> #B79BF5 -> #FFA0C0
    t = (x / n * 0.5 + y / n * 0.5)
    c1, c2, c3 = (0x7A, 0xA5, 0xF7), (0xB7, 0x9B, 0xF5), (0xFF, 0xA0, 0xC0)
    if t < 0.5:
        u = t / 0.5
        return tuple(int(lerp(c1[i], c2[i], u)) for i in range(3))
    u = (t - 0.5) / 0.5
    return tuple(int(lerp(c2[i], c3[i], u)) for i in range(3))


def in_round_rect(x, y, n, r):
    if r <= 0:
        return True
    if r <= x <= n - r or r <= y <= n - r:
        if (r <= x <= n - r) or (r <= y <= n - r):
            return True
    cx = r if x < r else (n - r if x > n - r else x)
    cy = r if y < r else (n - r if y > n - r else y)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def ell(x, y, cx, cy, rx, ry):
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0


def render(n, radius_ratio, content_scale):
    r = n * radius_ratio
    cs = content_scale
    half = n / 2.0
    # 调色盘几何（单位坐标经 content_scale 缩放，围绕中心）
    def sc(u, v):
        return half + (u - 0.5) * n * cs, half + (v - 0.5) * n * cs

    pcx, pcy = sc(0.50, 0.53)
    prx, pry = 0.31 * n * cs, 0.28 * n * cs
    hcx, hcy = sc(0.615, 0.635)
    hrx, hry = 0.080 * n * cs, 0.070 * n * cs
    dots = [
        (sc(0.355, 0.395), 0.058 * n * cs, (0x5B, 0x8D, 0xEF)),
        (sc(0.505, 0.335), 0.058 * n * cs, (0xB7, 0x9B, 0xF5)),
        (sc(0.655, 0.415), 0.058 * n * cs, (0xFF, 0x7F, 0xA8)),
    ]

    rows = []
    for y in range(n):
        row = bytearray()
        yy = y + 0.5
        for x in range(n):
            xx = x + 0.5
            if not in_round_rect(xx, yy, n, r):
                row += b'\x00\x00\x00\x00'
                continue
            cr, cg, cb = grad(xx, yy, n)
            if ell(xx, yy, pcx, pcy, prx, pry) and not ell(xx, yy, hcx, hcy, hrx, hry):
                cr, cg, cb = 0xFF, 0xFF, 0xFF
                for (dx, dy), dr, col in dots:
                    if (xx - dx) ** 2 + (yy - dy) ** 2 <= dr * dr:
                        cr, cg, cb = col
                        break
            row += bytes((cr, cg, cb, 255))
        rows.append(bytes(row))
    return rows


def downsample(rows, n, k):
    m = n // k
    out = []
    for y in range(m):
        row = bytearray()
        for x in range(m):
            tr = tg = tb = ta = 0
            for j in range(k):
                src = rows[y * k + j]
                base = (x * k) * 4
                for i in range(k):
                    o = base + i * 4
                    a = src[o + 3]
                    tr += src[o] * a
                    tg += src[o + 1] * a
                    tb += src[o + 2] * a
                    ta += a
            cnt = k * k
            if ta == 0:
                row += b'\x00\x00\x00\x00'
            else:
                row += bytes((tr // ta, tg // ta, tb // ta, ta // cnt))
        out.append(bytes(row))
    return out, m


def write_png(path, rows, n):
    raw = b''.join(b'\x00' + r for r in rows)
    comp = zlib.compress(raw, 9)

    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        return c + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', n, n, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', comp)
    png += chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)
    print(path, n, 'x', n, len(png), 'bytes')


print('rendering master...')
master = render(SS, 0.22, 1.0)
r512, n512 = downsample(master, SS, 3)
write_png(os.path.join(OUT, 'icon-512.png'), r512, n512)
r192, n192 = downsample(master, SS, 8)
write_png(os.path.join(OUT, 'icon-192.png'), r192, n192)

print('rendering maskable...')
mk = render(SS, 0.0, 0.70)
rm, nm = downsample(mk, SS, 3)
write_png(os.path.join(OUT, 'icon-maskable-512.png'), rm, nm)
print('done')
