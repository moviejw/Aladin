import numpy as np
import os

BRAILLE_ON = lambda c: c != "\u2800"

def parse_frames(path):
    frames = []
    with open(path, "r", encoding="utf-8") as f:
        lines = [l.rstrip("\n") for l in f]

    i = 0
    n = len(lines)

    while i < n:
        # 1) 프레임 번호
        if lines[i].strip().isdigit():
            i += 1

            # 2) 타임스탬프 줄 스킵
            if i < n and "-->" in lines[i]:
                i += 1

            # 3) 아트 수집
            art = []
            while i < n:
                line = lines[i]
                if line.strip() == "":
                    break
                art.append(line)
                i += 1

            if art:
                frames.append(art)

        i += 1

    return frames


def braille_to_binary(frame):
    h = len(frame)
    w = max(len(row) for row in frame)

    grid = np.zeros((h, w), dtype=np.float32)

    for y, row in enumerate(frame):
        for x, ch in enumerate(row):
            grid[y, x] = 1.0 if BRAILLE_ON(ch) else 0.0

    return grid


def downsample(grid, out_w=12, out_h=11, threshold=0.5):
    in_h, in_w = grid.shape
    result = np.zeros((out_h, out_w), dtype=np.int8)

    for oy in range(out_h):
        for ox in range(out_w):
            y0 = int(oy * in_h / out_h)
            y1 = int((oy + 1) * in_h / out_h)
            x0 = int(ox * in_w / out_w)
            x1 = int((ox + 1) * in_w / out_w)

            block = grid[y0:y1, x0:x1]
            result[oy, ox] = 1 if block.mean() >= threshold else 0

    return result


# ===== 실행 =====

frames = parse_frames("./frostrain/frames.txt")

converted = []
for frame in frames:
    binary = braille_to_binary(frame)      # 48x18
    small = downsample(binary, 12, 11)     # 12x11
    converted.append(small)

print("frames count:", len(frames))
print("first frame line count:", len(frames[0]) if frames else "no frames")
print("first frame preview:", frames[1222][:3] if frames else "none")


with open("badapple.bin", "wb") as f:
    for frame in converted:
        bits = frame.flatten()
        byte = 0
        count = 0
        for b in bits:
            byte = (byte << 1) | int(b)
            count += 1
            if count == 8:
                f.write(bytes([byte]))
                byte = 0
                count = 0

        # ⭐ 남은 비트 처리 (4비트)
        if count > 0:
            byte = byte << (8 - count)
            f.write(bytes([byte]))
