from pathlib import Path
from PIL import Image, ImageOps

# ========= CONFIG =========

INPUT_FOLDER = Path(".")
OUTPUT_FOLDER = Path("optimized")

MAX_WIDTH = 1920
MAX_HEIGHT = 1920

JPEG_QUALITY = 82
WEBP_QUALITY = 80

EXPORT_JPEG = False
EXPORT_WEBP = True

SUPPORTED = {".jpg", ".jpeg", ".png"}

# ==========================


def optimize_image(path: Path):
    relative = path.relative_to(INPUT_FOLDER)
    output_dir = OUTPUT_FOLDER / relative.parent
    output_dir.mkdir(parents=True, exist_ok=True)

    with Image.open(path) as img:
        img = ImageOps.exif_transpose(img)

        if img.mode in ("RGBA", "LA", "P"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[-1] if img.mode != "RGB" else None)
            img = background
        else:
            img = img.convert("RGB")

        img.thumbnail((MAX_WIDTH, MAX_HEIGHT), Image.Resampling.LANCZOS)

        if EXPORT_JPEG:
            jpg_path = output_dir / f"{path.stem}.jpg"
            img.save(
                jpg_path,
                "JPEG",
                quality=JPEG_QUALITY,
                optimize=True,
                progressive=True,
            )

        if EXPORT_WEBP:
            webp_path = output_dir / f"{path.stem}.webp"
            img.save(
                webp_path,
                "WEBP",
                quality=WEBP_QUALITY,
                method=6,
            )

        original = path.stat().st_size / 1024 / 1024

        if EXPORT_WEBP:
            new_size = webp_path.stat().st_size / 1024 / 1024
            out_file = webp_path.name
        else:
            new_size = jpg_path.stat().st_size / 1024 / 1024
            out_file = jpg_path.name

        print(
            f"✓ {path.name:30} "
            f"{original:6.2f} MB → {new_size:5.2f} MB "
            f"({out_file})"
        )


def main():
    OUTPUT_FOLDER.mkdir(exist_ok=True)

    images = [
        p
        for p in INPUT_FOLDER.rglob("*")
        if p.suffix.lower() in SUPPORTED
    ]

    print(f"\nFound {len(images)} images\n")

    for image in images:
        optimize_image(image)

    print("\nDone.")


if __name__ == "__main__":
    main()