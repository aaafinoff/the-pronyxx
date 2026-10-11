"""
Готовит картинки бренда для сайта.

Берёт оригиналы из images/originals/ и раскладывает обработанные версии по папкам:
images/brand/, images/icons/, images/directions/, images/backgrounds/, images/social/.

Запуск (из папки проекта):
    py tools/process_images.py

Оригиналы скрипт не меняет. Если заменить картинку в images/originals/ (с тем же именем)
и запустить скрипт ещё раз — все версии пересоберутся сами.
Нужна библиотека Pillow:  py -m pip install Pillow
"""

from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "images" / "originals"
OUT = ROOT / "images"

WEBP_QUALITY = 92  # высокое качество: разницу с оригиналом глазом не видно


# ---------- Помощники ----------

def load(name):
    return Image.open(SRC / name)


def brightness(image):
    """Яркость каждого пикселя (самый яркий из каналов R, G, B) — чёрно-белая картинка."""
    r, g, b = image.convert("RGB").split()
    return ImageChops.lighter(ImageChops.lighter(r, g), b)


def content_box(image, threshold=30):
    """Рамка вокруг всего, что ярче порога, то есть вокруг содержимого на чёрном фоне."""
    return brightness(image).point(lambda v: 255 if v > threshold else 0).getbbox()


def black_to_alpha(image):
    """
    Превращает чёрный фон в прозрачный.
    Чем темнее пиксель, тем он прозрачнее: чёрный исчезает совсем, а свечение остаётся мягким.
    Так картинка одинаково хорошо ложится и на фон сайта, и на карточку.
    """
    rgb = image.convert("RGB")
    r, g, b = rgb.split()
    # Режим "RGBa" значит «цвет уже умножен на прозрачность» — Pillow сам пересчитает его обратно
    return Image.merge("RGBa", (r, g, b, brightness(rgb))).convert("RGBA")


def fade_sides(image, left, right):
    """Плавно растворяет левый и правый края (чтобы луч не обрывался резко). left/right — в пикселях."""
    width, height = image.size
    row = Image.new("L", (width, 1), 255)
    for x in range(width):
        k = 1.0
        if left and x < left:
            k = x / left
        elif right and x >= width - right:
            k = (width - 1 - x) / right
        row.putpixel((x, 0), round(255 * k))
    mask = row.resize((width, height))
    result = image.copy()
    result.putalpha(ImageChops.multiply(image.getchannel("A"), mask))
    return result


def fit_height(image, height):
    """Уменьшает картинку до нужной высоты, сохраняя пропорции."""
    if image.height <= height:
        return image
    return image.resize((round(image.width * height / image.height), height), Image.LANCZOS)


def fit_width(image, width):
    if image.width <= width:
        return image
    return image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)


def square_around(image, box, fill):
    """
    Вырезает квадрат, в котором содержимое (box) стоит ровно по центру
    и занимает долю fill от высоты квадрата.
    """
    left, top, right, bottom = box
    side = (bottom - top) / fill
    cx, cy = (left + right) / 2, (top + bottom) / 2
    crop = (round(cx - side / 2), round(cy - side / 2), round(cx + side / 2), round(cy + side / 2))
    return image.convert("RGB").crop(crop)  # всё, что вышло за край, Pillow заполнит чёрным


def save(image, folder, name, **options):
    path = OUT / folder / name
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.suffix == ".webp":
        options = {"quality": WEBP_QUALITY, "method": 6, **options}
    elif path.suffix == ".png":
        options = {"optimize": True, **options}
    image.save(path, **options)
    print(f"  {path.relative_to(ROOT).as_posix():44} {image.width}x{image.height}  {path.stat().st_size // 1024 or 1} КБ")


# ---------- Логотипы ----------

def horizontal_logo():
    """Горизонтальный логотип: плотная обрезка + отдельная компактная версия для шапки."""
    image = load("logo-horizontal.webp")
    left, top, right, bottom = content_box(image, threshold=12)
    pad = round((bottom - top) * 0.06)  # небольшой отступ вокруг содержимого
    box = (max(left - pad, 0), max(top - pad, 0), min(right + pad, image.width), min(bottom + pad, image.height))
    save(fit_height(black_to_alpha(image.crop(box)), 240), "brand", "logo-horizontal.webp")

    # Версия для шапки. В оригинале надпись очень маленькая по сравнению с кристаллом:
    # при высоте шапки буквы получаются около 6 пикселей и не читаются.
    # Поэтому собираем компактный вариант из тех же частей: кристалл уменьшаем,
    # надпись оставляем как есть, луч между ними сжимаем по ширине.
    light = brightness(image)
    width, height = image.size

    # 1) Строка луча — самая яркая строка картинки
    rows = light.resize((1, height), Image.BOX)
    beam_y = max(range(height), key=lambda y: rows.getpixel((0, y)))

    # 2) Кристалл: закрашиваем полосу с лучом и надписью — остаётся только кристалл
    band = round(height * 0.06)
    no_band = light.point(lambda v: 255 if v > 60 else 0)
    no_band.paste(0, (0, beam_y - band, width, beam_y + band))
    c_left, c_top, c_right, c_bottom = no_band.getbbox()
    crystal_h = c_bottom - c_top

    # 3) Надпись: в полосе луча ищем самый правый столбец, где светлого больше, чем у тонкого луча
    strip = light.crop((0, beam_y - band, width, beam_y + band)).point(lambda v: 255 if v > 110 else 0)
    columns = strip.resize((width, 1), Image.BOX)
    letter = 255 * 12 / (band * 2)  # столбец буквы: хотя бы 12 светлых пикселей по высоте
    text_cols = [x for x in range(c_right + crystal_h // 6, width) if columns.getpixel((x, 0)) >= letter]
    if not text_cols:
        print("  ! не нашёл надпись в логотипе — версия для шапки не собрана")
        return
    text_left, text_right = min(text_cols), max(text_cols) + 1

    rgb = image.convert("RGB")
    canvas_h = 160
    mid = canvas_h // 2          # на этой высоте идёт луч
    flare = crystal_h // 10      # блики по бокам кристалла
    tail_w, gap_w, end_w = 56, 34, 12  # луч слева, луч между кристаллом и надписью, отступ справа

    # Кристалл уменьшаем так, чтобы он занял всю высоту
    crystal = rgb.crop((c_left - flare, c_top - pad, c_right + flare, c_bottom + pad))
    k = canvas_h / crystal.height
    crystal = crystal.resize((round(crystal.width * k), canvas_h), Image.LANCZOS)

    text = rgb.crop((text_left, beam_y - band, text_right, beam_y + band))
    strip_h = band * 2

    def beam(x0, x1, new_width):
        """Кусок луча из оригинала, сжатый по ширине (горизонтальной линии это не вредит)."""
        return rgb.crop((x0, beam_y - band, x1, beam_y + band)).resize((new_width, strip_h), Image.LANCZOS)

    crystal_x = tail_w - round(flare * k)
    text_x = crystal_x + crystal.width + gap_w - round(flare * k)
    canvas = Image.new("RGB", (text_x + text.width + end_w, canvas_h))

    def put(piece, x, y):
        """Кладёт кусок на холст, оставляя в каждой точке более яркий пиксель (чёрное ничего не закрывает)."""
        area = (x, y, x + piece.width, y + piece.height)
        canvas.paste(ImageChops.lighter(canvas.crop(area), piece), area)

    crystal_right_x = crystal_x + crystal.width - round(flare * k)
    put(beam(c_left - crystal_h, c_left - flare, tail_w), 0, mid - band)
    put(beam(c_right + flare, text_left - 4, text_x - crystal_right_x), crystal_right_x, mid - band)
    put(crystal, crystal_x, 0)
    put(text, text_x, mid - band)

    save(fade_sides(black_to_alpha(canvas), left=tail_w - 8, right=0), "brand", "logo-header.webp")


def vertical_logo():
    image = load("logo-vertical.webp")
    _, top, _, bottom = content_box(image)
    pad = round((bottom - top) * 0.05)
    cropped = image.crop((0, max(top - pad, 0), image.width, min(bottom + pad, image.height)))
    faded = fade_sides(black_to_alpha(cropped), left=image.width // 5, right=image.width // 5)
    save(fit_width(faded, 900), "brand", "logo-vertical.webp")


def light_logo():
    """Светлая версия (для белых фонов: документы, презентации). На сайте пока не используется."""
    save(fit_width(load("logo-light.webp").convert("RGBA"), 800), "brand", "logo-light.webp")


# ---------- Иконки ----------

def favicons():
    image = load("favicon.webp")
    square = square_around(image, content_box(image), fill=0.9)

    for size, name in ((16, "favicon-16.png"), (32, "favicon-32.png"), (180, "apple-touch-icon.png")):
        save(square.resize((size, size), Image.LANCZOS), "icons", name)

    # .ico — старый формат, внутри сразу несколько размеров
    save(square.resize((256, 256), Image.LANCZOS), "icons", "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

    # Тот же кристалл с прозрачным фоном — чтобы ставить его прямо на страницу
    save(fit_height(black_to_alpha(square), 480), "brand", "crystal.webp")


def app_icon():
    """Иконка мобильного приложения (этап 2). PNG 1024x1024 — такой размер просят магазины приложений."""
    save(load("app-icon.webp").convert("RGB").resize((1024, 1024), Image.LANCZOS), "icons", "app-icon-1024.png")


# ---------- Значки направлений ----------

def direction_icons():
    """Три значка обрезаются одинаково: кристалл по центру и одной высоты на всех трёх."""
    for name in ("prism", "security", "apps"):
        image = load(f"direction-{name}.webp")
        square = square_around(image, content_box(image, threshold=60), fill=0.8)
        save(black_to_alpha(square.resize((512, 512), Image.LANCZOS)), "directions", f"{name}.webp")


# ---------- Фоны и превью ----------

def backgrounds():
    save(load("hero-bg.webp").convert("RGB"), "backgrounds", "hero-beam.webp", quality=88)
    save(fit_width(load("coming-soon.webp").convert("RGB"), 960), "backgrounds", "coming-soon.webp", quality=88)


def social_preview():
    """Превью для ссылок: 1200x630 — стандартный размер карточки в Telegram, Discord и соцсетях."""
    image = load("social-preview.webp").convert("RGB")
    target = 1200 / 630
    width = min(image.width, round(image.height * target))
    height = min(image.height, round(image.width / target))
    left, top = (image.width - width) // 2, (image.height - height) // 2
    cropped = image.crop((left, top, left + width, top + height))
    save(cropped.resize((1200, 630), Image.LANCZOS), "social", "og-preview.png")


if __name__ == "__main__":
    print("Обрабатываю картинки из images/originals/ ...")
    horizontal_logo()
    vertical_logo()
    light_logo()
    favicons()
    app_icon()
    direction_icons()
    backgrounds()
    social_preview()
    print("Готово.")
