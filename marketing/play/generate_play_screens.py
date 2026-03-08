from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1080, 1920
OUT_DIR = "marketing/play/png"

FONT_REG_PATH = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"
FONT_BOLD_PATH = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


F_TITLE = font(FONT_BOLD_PATH, 62)
F_SUB = font(FONT_REG_PATH, 30)
F_APPBAR = font(FONT_BOLD_PATH, 34)
F_CARD_TITLE = font(FONT_BOLD_PATH, 29)
F_TEXT = font(FONT_REG_PATH, 24)
F_SMALL = font(FONT_REG_PATH, 20)
F_BOLD = font(FONT_BOLD_PATH, 24)


def draw_gradient(img, top_color, bottom_color):
    draw = ImageDraw.Draw(img)
    for y in range(H):
        t = y / (H - 1)
        r = int(top_color[0] * (1 - t) + bottom_color[0] * t)
        g = int(top_color[1] * (1 - t) + bottom_color[1] * t)
        b = int(top_color[2] * (1 - t) + bottom_color[2] * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))


def rounded_box(draw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def text_center(draw, y, text, fnt, fill=(255, 255, 255, 255)):
    x0, y0, x1, y1 = draw.textbbox((0, 0), text, font=fnt)
    tw = x1 - x0
    draw.text(((W - tw) // 2, y), text, font=fnt, fill=fill)


def wrap_text(draw, text, fnt, max_width):
    words = text.split()
    lines = []
    cur = []
    for w in words:
        test = " ".join(cur + [w])
        x0, y0, x1, y1 = draw.textbbox((0, 0), test, font=fnt)
        if (x1 - x0) <= max_width:
            cur.append(w)
        else:
            if cur:
                lines.append(" ".join(cur))
            cur = [w]
    if cur:
        lines.append(" ".join(cur))
    return lines


def draw_phone_shell(base, section_title):
    phone_x, phone_y, phone_w, phone_h = 90, 300, 900, 1500

    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sh = ImageDraw.Draw(shadow)
    rounded_box(sh, (phone_x + 10, phone_y + 16, phone_x + phone_w + 10, phone_y + phone_h + 16), 70, (0, 0, 0, 80))
    shadow = shadow.filter(ImageFilter.GaussianBlur(10))
    base.alpha_composite(shadow)

    draw = ImageDraw.Draw(base)
    rounded_box(draw, (phone_x, phone_y, phone_x + phone_w, phone_y + phone_h), 70, (15, 23, 42, 255))
    screen = (phone_x + 22, phone_y + 22, phone_x + phone_w - 22, phone_y + phone_h - 22)
    rounded_box(draw, screen, 52, (248, 250, 252, 255))

    sx0, sy0, sx1, sy1 = screen
    draw.rectangle((sx0, sy0, sx1, sy0 + 58), fill=(248, 250, 252, 255))
    draw.text((sx0 + 24, sy0 + 17), "9:41", font=F_SMALL, fill=(15, 23, 42, 255))
    draw.text((sx1 - 165, sy0 + 17), "5G 87%", font=F_SMALL, fill=(15, 23, 42, 255))

    appbar_y0 = sy0 + 58
    rounded_box(draw, (sx0 + 12, appbar_y0 + 8, sx1 - 12, appbar_y0 + 96), 26, (255, 255, 255, 255), outline=(226, 232, 240, 255))
    draw.text((sx0 + 36, appbar_y0 + 36), "Ministranci.net", font=F_APPBAR, fill=(15, 23, 42, 255))
    draw.text((sx1 - 210, appbar_y0 + 42), section_title, font=F_TEXT, fill=(71, 85, 105, 255))

    content = (sx0 + 24, appbar_y0 + 118, sx1 - 24, sy1 - 22)
    return content


def draw_bottom_nav(draw, content_box, active_index=0):
    x0, y0, x1, y1 = content_box
    nav_h = 96
    rounded_box(draw, (x0, y1 - nav_h, x1, y1), 24, (255, 255, 255, 255), outline=(226, 232, 240, 255))
    labels = ["Start", "Grafik", "Ranking", "Grupa"]
    for i, label in enumerate(labels):
        cx = x0 + 110 + i * 180
        color = (30, 64, 175, 255) if i == active_index else (100, 116, 139, 255)
        draw.ellipse((cx - 14, y1 - 72, cx + 14, y1 - 44), fill=color)
        draw.text((cx - 28, y1 - 38), label, font=F_SMALL, fill=color)


def screen_home(path):
    img = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    draw_gradient(img, (37, 99, 235), (14, 116, 144))
    d = ImageDraw.Draw(img)

    text_center(d, 78, "Wszystko dla ministrantów w jednym miejscu", F_TITLE)
    text_center(d, 156, "Aktualności, wydarzenia i ogłoszenia parafii", F_SUB)

    c = draw_phone_shell(img, "Start")
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = c

    rounded_box(d, (x0, y0, x1, y0 + 170), 26, (239, 246, 255, 255), outline=(191, 219, 254, 255))
    d.text((x0 + 24, y0 + 22), "Aktualności parafialne", font=F_CARD_TITLE, fill=(30, 64, 175, 255))
    d.text((x0 + 24, y0 + 66), "• Rekolekcje wielkopostne: 18-20 marca", font=F_TEXT, fill=(30, 41, 59, 255))
    d.text((x0 + 24, y0 + 100), "• Zbiórka ministrantów: sobota 10:00", font=F_TEXT, fill=(30, 41, 59, 255))
    d.text((x0 + 24, y0 + 134), "• Nowe materiały formacyjne", font=F_TEXT, fill=(30, 41, 59, 255))

    rounded_box(d, (x0, y0 + 190, x1, y0 + 390), 26, (255, 255, 255, 255), outline=(226, 232, 240, 255))
    d.text((x0 + 24, y0 + 214), "Nadchodzące wydarzenia", font=F_CARD_TITLE, fill=(15, 23, 42, 255))
    events = [
        ("19 mar", "Msza szkolna", "17:30"),
        ("22 mar", "Droga Krzyżowa", "18:00"),
        ("25 mar", "Uroczystość", "11:00"),
    ]
    yy = y0 + 258
    for date, name, hour in events:
        rounded_box(d, (x0 + 20, yy, x1 - 20, yy + 40), 14, (248, 250, 252, 255))
        d.text((x0 + 30, yy + 8), date, font=F_BOLD, fill=(30, 64, 175, 255))
        d.text((x0 + 165, yy + 8), name, font=F_TEXT, fill=(15, 23, 42, 255))
        d.text((x1 - 110, yy + 8), hour, font=F_TEXT, fill=(51, 65, 85, 255))
        yy += 50

    rounded_box(d, (x0, y0 + 410, x1, y1 - 116), 26, (255, 255, 255, 255), outline=(226, 232, 240, 255))
    d.text((x0 + 24, y0 + 434), "Ogłoszenia", font=F_CARD_TITLE, fill=(15, 23, 42, 255))
    lines = [
        "• Próba liturgiczna przed Triduum: piątek 19:15",
        "• Prosimy o punktualne potwierdzanie obecności",
        "• Nowe stroje liturgiczne do odbioru w zakrystii",
    ]
    yy = y0 + 482
    for line in lines:
        d.text((x0 + 24, yy), line, font=F_TEXT, fill=(51, 65, 85, 255))
        yy += 44

    draw_bottom_nav(d, c, active_index=0)
    img.convert("RGB").save(path, "PNG")


def screen_schedule(path):
    img = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    draw_gradient(img, (2, 132, 199), (20, 184, 166))
    d = ImageDraw.Draw(img)

    text_center(d, 78, "Łatwe planowanie służby", F_TITLE)
    text_center(d, 156, "Grafik służb przy Mszy zawsze pod ręką", F_SUB)

    c = draw_phone_shell(img, "Grafik")
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = c

    rounded_box(d, (x0, y0, x1, y0 + 430), 26, (255, 255, 255, 255), outline=(226, 232, 240, 255))
    d.text((x0 + 24, y0 + 20), "Marzec 2026", font=F_CARD_TITLE, fill=(15, 23, 42, 255))

    days = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"]
    for i, day in enumerate(days):
        d.text((x0 + 30 + i * 112, y0 + 66), day, font=F_SMALL, fill=(100, 116, 139, 255))

    start_x, start_y = x0 + 24, y0 + 98
    n = 1
    for r in range(5):
        for cidx in range(7):
            bx = start_x + cidx * 112
            by = start_y + r * 58
            rounded_box(d, (bx, by, bx + 96, by + 48), 12, (248, 250, 252, 255))
            if n <= 31:
                color = (255, 255, 255, 255) if n in [7, 14, 21, 28] else (30, 41, 59, 255)
                fill = (37, 99, 235, 255) if n in [7, 14, 21, 28] else (248, 250, 252, 255)
                rounded_box(d, (bx, by, bx + 96, by + 48), 12, fill)
                d.text((bx + 10, by + 12), str(n), font=F_TEXT, fill=color)
                n += 1

    rounded_box(d, (x0, y0 + 450, x1, y1 - 116), 26, (255, 255, 255, 255), outline=(226, 232, 240, 255))
    d.text((x0 + 24, y0 + 474), "Najbliższe służby", font=F_CARD_TITLE, fill=(15, 23, 42, 255))
    slots = [
        ("Nd 14.03", "7:30", "Lektor: Jan, Ołtarz: Michał"),
        ("Nd 14.03", "11:00", "Kadzidło: Paweł, Krzyż: Kuba"),
        ("Śr 17.03", "18:00", "Lektor: Adam, Świece: Mateusz"),
        ("Sb 20.03", "19:00", "Asysta: Szymon, Nikodem"),
    ]
    yy = y0 + 524
    for day, hour, who in slots:
        rounded_box(d, (x0 + 20, yy, x1 - 20, yy + 70), 16, (239, 246, 255, 255))
        d.text((x0 + 32, yy + 12), day, font=F_BOLD, fill=(30, 64, 175, 255))
        d.text((x0 + 175, yy + 12), hour, font=F_BOLD, fill=(15, 23, 42, 255))
        d.text((x0 + 250, yy + 12), who, font=F_SMALL, fill=(51, 65, 85, 255))
        yy += 82

    draw_bottom_nav(d, c, active_index=1)
    img.convert("RGB").save(path, "PNG")


def screen_ranking(path):
    img = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    draw_gradient(img, (22, 163, 74), (16, 185, 129))
    d = ImageDraw.Draw(img)

    text_center(d, 78, "Motywujący system punktów", F_TITLE)
    text_center(d, 156, "Ranking i osiągnięcia ministrantów", F_SUB)

    c = draw_phone_shell(img, "Ranking")
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = c

    rounded_box(d, (x0, y0, x1, y0 + 250), 26, (255, 255, 255, 255), outline=(226, 232, 240, 255))
    d.text((x0 + 24, y0 + 22), "Top 3 tygodnia", font=F_CARD_TITLE, fill=(15, 23, 42, 255))

    podium = [
        ("1", "Jan K.", "1240 pkt", (250, 204, 21, 255)),
        ("2", "Michał R.", "1180 pkt", (148, 163, 184, 255)),
        ("3", "Kuba P.", "1120 pkt", (251, 146, 60, 255)),
    ]
    px = x0 + 24
    for i, (rank, name, pts, color) in enumerate(podium):
        card_w = 250
        bx = px + i * 268
        rounded_box(d, (bx, y0 + 70, bx + card_w, y0 + 220), 22, (248, 250, 252, 255), outline=(226, 232, 240, 255))
        d.ellipse((bx + 88, y0 + 82, bx + 162, y0 + 156), fill=color)
        d.text((bx + 118, y0 + 100), rank, font=F_BOLD, fill=(17, 24, 39, 255))
        d.text((bx + 24, y0 + 166), name, font=F_TEXT, fill=(15, 23, 42, 255))
        d.text((bx + 24, y0 + 194), pts, font=F_SMALL, fill=(71, 85, 105, 255))

    rounded_box(d, (x0, y0 + 270, x1, y1 - 116), 26, (255, 255, 255, 255), outline=(226, 232, 240, 255))
    d.text((x0 + 24, y0 + 294), "Pełny ranking", font=F_CARD_TITLE, fill=(15, 23, 42, 255))
    rows = [
        ("4", "Szymon L.", "1065", "🔥 5 służb"),
        ("5", "Adam N.", "1040", "⭐ Lektor miesiąca"),
        ("6", "Mateusz Z.", "995", "🎯 100% obecności"),
        ("7", "Nikodem W.", "920", "🏅 2 odznaki"),
        ("8", "Tomasz C.", "880", "📈 +80 w tygodniu"),
    ]
    yy = y0 + 346
    for rank, name, points, badge in rows:
        rounded_box(d, (x0 + 20, yy, x1 - 20, yy + 84), 18, (248, 250, 252, 255))
        d.text((x0 + 36, yy + 26), f"#{rank}", font=F_BOLD, fill=(30, 64, 175, 255))
        d.text((x0 + 120, yy + 20), name, font=F_BOLD, fill=(15, 23, 42, 255))
        d.text((x0 + 120, yy + 50), badge, font=F_SMALL, fill=(71, 85, 105, 255))
        d.text((x1 - 150, yy + 30), f"{points} pkt", font=F_TEXT, fill=(15, 23, 42, 255))
        yy += 96

    draw_bottom_nav(d, c, active_index=2)
    img.convert("RGB").save(path, "PNG")


def screen_group(path):
    img = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    draw_gradient(img, (124, 58, 237), (59, 130, 246))
    d = ImageDraw.Draw(img)

    text_center(d, 78, "Zarządzaj grupą ministrantów", F_TITLE)
    text_center(d, 156, "Lista profili i szybki kontakt", F_SUB)

    c = draw_phone_shell(img, "Grupa")
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = c

    rounded_box(d, (x0, y0, x1, y0 + 78), 22, (255, 255, 255, 255), outline=(226, 232, 240, 255))
    d.text((x0 + 24, y0 + 24), "Szukaj: Jan, lektor, grupa starsza...", font=F_SMALL, fill=(100, 116, 139, 255))

    rounded_box(d, (x0, y0 + 96, x1, y1 - 116), 26, (255, 255, 255, 255), outline=(226, 232, 240, 255))
    d.text((x0 + 24, y0 + 120), "Ministranci parafii (32)", font=F_CARD_TITLE, fill=(15, 23, 42, 255))

    people = [
        ("JK", "Jan Kowalski", "Lektor • Grupa starsza"),
        ("MR", "Michał Rybak", "Ceremoniarz • Lider"),
        ("KP", "Kuba Piotrowski", "Ministrant • Grupa młodsza"),
        ("AN", "Adam Nowak", "Lektor • Grupa starsza"),
        ("MZ", "Mateusz Zając", "Kadzidło • Grupa średnia"),
        ("SW", "Szymon Wilk", "Krzyż • Grupa średnia"),
    ]
    yy = y0 + 170
    colors = [(37, 99, 235, 255), (22, 163, 74, 255), (124, 58, 237, 255), (245, 158, 11, 255)]
    for i, (ini, name, role) in enumerate(people):
        rounded_box(d, (x0 + 20, yy, x1 - 20, yy + 110), 18, (248, 250, 252, 255))
        col = colors[i % len(colors)]
        d.ellipse((x0 + 38, yy + 22, x0 + 98, yy + 82), fill=col)
        d.text((x0 + 53, yy + 40), ini, font=F_SMALL, fill=(255, 255, 255, 255))
        d.text((x0 + 120, yy + 30), name, font=F_BOLD, fill=(15, 23, 42, 255))
        d.text((x0 + 120, yy + 62), role, font=F_SMALL, fill=(71, 85, 105, 255))
        rounded_box(d, (x1 - 125, yy + 34, x1 - 35, yy + 74), 12, (219, 234, 254, 255))
        d.text((x1 - 105, yy + 45), "Profil", font=F_SMALL, fill=(30, 64, 175, 255))
        yy += 120

    draw_bottom_nav(d, c, active_index=3)
    img.convert("RGB").save(path, "PNG")


def screen_prayer(path):
    img = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    draw_gradient(img, (217, 119, 6), (234, 88, 12))
    d = ImageDraw.Draw(img)

    text_center(d, 78, "Modlitwy i materiały formacyjne", F_TITLE)
    text_center(d, 156, "Wsparcie duchowe i formacja na co dzień", F_SUB)

    c = draw_phone_shell(img, "Formacja")
    d = ImageDraw.Draw(img)
    x0, y0, x1, y1 = c

    rounded_box(d, (x0, y0, x1, y0 + 90), 24, (255, 255, 255, 255), outline=(226, 232, 240, 255))
    rounded_box(d, (x0 + 20, y0 + 18, x0 + 240, y0 + 72), 18, (255, 237, 213, 255))
    d.text((x0 + 82, y0 + 34), "Modlitwy", font=F_BOLD, fill=(154, 52, 18, 255))
    rounded_box(d, (x0 + 250, y0 + 18, x0 + 480, y0 + 72), 18, (248, 250, 252, 255))
    d.text((x0 + 323, y0 + 34), "Formacja", font=F_BOLD, fill=(71, 85, 105, 255))

    rounded_box(d, (x0, y0 + 108, x1, y1 - 116), 26, (255, 255, 255, 255), outline=(226, 232, 240, 255))
    d.text((x0 + 24, y0 + 132), "Najczęściej używane", font=F_CARD_TITLE, fill=(15, 23, 42, 255))

    prayers = [
        ("✝", "Modlitwa ministranta", "Panie Jezu, chcę służyć przy ołtarzu..."),
        ("🕯", "Przed Mszą Świętą", "Panie, daj mi skupienie i godną służbę..."),
        ("⛪", "Po Mszy Świętej", "Dziękuję Ci za łaskę i obecność..."),
        ("📖", "Formacja tygodnia", "Służba liturgiczna i odpowiedzialność..."),
    ]
    yy = y0 + 184
    for icon, title, preview in prayers:
        rounded_box(d, (x0 + 20, yy, x1 - 20, yy + 130), 20, (255, 247, 237, 255))
        d.text((x0 + 40, yy + 42), icon, font=F_CARD_TITLE, fill=(194, 65, 12, 255))
        d.text((x0 + 108, yy + 28), title, font=F_BOLD, fill=(124, 45, 18, 255))
        lines = wrap_text(d, preview, F_SMALL, x1 - x0 - 180)
        d.text((x0 + 108, yy + 62), lines[0], font=F_SMALL, fill=(120, 53, 15, 255))
        yy += 142

    draw_bottom_nav(d, c, active_index=0)
    img.convert("RGB").save(path, "PNG")


def main():
    screen_home(f"{OUT_DIR}/01-ekran-glowny-1080x1920.png")
    screen_schedule(f"{OUT_DIR}/02-grafik-sluzb-1080x1920.png")
    screen_ranking(f"{OUT_DIR}/03-ranking-ministrantow-1080x1920.png")
    screen_group(f"{OUT_DIR}/04-lista-ministrantow-1080x1920.png")
    screen_prayer(f"{OUT_DIR}/05-modlitwy-formacja-1080x1920.png")


if __name__ == "__main__":
    main()
