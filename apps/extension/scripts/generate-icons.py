#!/usr/bin/env python3
"""Generate placeholder PNG icons for the Design Vault Chrome extension."""
import struct, zlib, os

def create_png(size, filename):
    pixels = []
    for y in range(size):
        row = []
        for x in range(size):
            r, g, b, a = 99, 102, 241, 255
            cx, cy = size / 2, size / 2
            left_line = abs(x - (cx - (cy - y) * 0.4)) < max(size * 0.08, 1.5)
            right_line = abs(x - (cx + (cy - y) * 0.4)) < max(size * 0.08, 1.5)
            in_v = (left_line or right_line) and y > size * 0.2 and y < size * 0.8
            if in_v:
                r, g, b = 255, 255, 255
            row.append(bytes([r, g, b, a]))
        pixels.append(b'\x00' + b''.join(row))
    raw = b''.join(pixels)
    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = struct.pack('>I', zlib.crc32(c) & 0xffffffff)
        return struct.pack('>I', len(data)) + c + crc
    header = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)
    idat = zlib.compress(raw)
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'wb') as f:
        f.write(header)
        f.write(chunk(b'IHDR', ihdr))
        f.write(chunk(b'IDAT', idat))
        f.write(chunk(b'IEND', b''))
    print(f'Created {filename} ({size}x{size})')

script_dir = os.path.dirname(os.path.abspath(__file__))
icons_dir = os.path.join(script_dir, '..', 'public', 'icons')

create_png(16, os.path.join(icons_dir, 'icon-16.png'))
create_png(48, os.path.join(icons_dir, 'icon-48.png'))
create_png(128, os.path.join(icons_dir, 'icon-128.png'))
