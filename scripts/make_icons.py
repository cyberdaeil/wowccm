"""와플 아이콘 만들기: branding/ 의 그림으로 src-tauri/icons/ 의 모든 아이콘을 다시 만든다.

필요한 것: Python Pillow (pip install pillow), npm install 이 끝난 상태
실행: npm run icons

- Mac(.icns): 원본 그림을 Apple 아이콘 격자(1024 캔버스에 824 둥근 사각형 + 그림자)에 맞춘다.
- Windows(.ico)와 창·트레이 아이콘: 48px 이하는 와플을 확대한 그림, 그보다 크면 원본.
"""
import os
import subprocess
import tempfile
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAND = os.path.join(ROOT, "branding")
ICONS = os.path.join(ROOT, "src-tauri", "icons")


def rounded(img, r=0.2):
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], int(w * r), fill=255)
    out = img.copy()
    out.putalpha(mask)
    return out


def mac_icon(img):
    canvas = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    body = rounded(img.resize((824, 824), Image.LANCZOS), 0.225)
    shadow_mask = Image.new("L", (1024, 1024), 0)
    ImageDraw.Draw(shadow_mask).rounded_rectangle([100, 112, 924, 936], 185, fill=90)
    shadow = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    shadow.putalpha(shadow_mask.filter(ImageFilter.GaussianBlur(14)))
    canvas.alpha_composite(shadow)
    canvas.alpha_composite(body, (100, 100))
    return canvas


def main():
    src = Image.open(os.path.join(BRAND, "wapl-icon-source.png")).convert("RGBA")
    small_src = Image.open(os.path.join(BRAND, "wapl-icon-small.png")).convert("RGBA").resize((1024, 1024), Image.LANCZOS)
    full, small = rounded(src), rounded(small_src)

    # 1) Mac용 원본으로 tauri icon 을 돌려 .icns 등을 만든다
    with tempfile.TemporaryDirectory() as tmp:
        mac_path = os.path.join(tmp, "mac.png")
        mac_icon(src).save(mac_path)
        subprocess.run(["npx", "tauri", "icon", mac_path, "-o", ICONS], check=True, cwd=ROOT)
    for extra in ("android", "ios"):
        subprocess.run(["rm", "-rf", os.path.join(ICONS, extra)], check=True)

    # 2) Windows·창·트레이 아이콘은 크기에 따라 그림을 골라 덮어쓴다
    def pick(size):
        return (small if size <= 48 else full).resize((size, size), Image.LANCZOS)

    sizes = (16, 24, 32, 48, 64, 128, 256)
    images = [pick(s) for s in sizes]
    images[-1].save(os.path.join(ICONS, "icon.ico"), format="ICO", sizes=[(s, s) for s in sizes], append_images=images[:-1])
    pick(32).save(os.path.join(ICONS, "32x32.png"))
    pick(64).save(os.path.join(ICONS, "64x64.png"))
    pick(64).save(os.path.join(ICONS, "tray.png"))
    full.resize((128, 128), Image.LANCZOS).save(os.path.join(ICONS, "128x128.png"))
    full.resize((256, 256), Image.LANCZOS).save(os.path.join(ICONS, "128x128@2x.png"))
    full.resize((512, 512), Image.LANCZOS).save(os.path.join(ICONS, "icon.png"))
    print("아이콘을 만들었습니다:", ICONS)


if __name__ == "__main__":
    main()
