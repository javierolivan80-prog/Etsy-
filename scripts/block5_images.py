"""Block 5b: 30 listing images (annotated editorial infographic style), SVG 2700x2025 -> JPG."""
import os, base64, html, re, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "output", "imagenes")
SHOTS = os.path.join(IMG, "_shots")
SVGDIR = os.path.join(IMG, "_svg")
W, H = 2700, 2025
CREAM = "#FAF7F2"; BEIGE = "#E9DFD2"; SAGE = "#8A9B85"; TERRA = "#C98A6B"
INK = "#2E2A26"; WGRAY = "#4A443E"
SERIF = "Georgia, 'Liberation Serif', 'Times New Roman', serif"
SANS = "Helvetica, 'Liberation Sans', Arial, sans-serif"

def b64(path):
    with open(path, "rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode()

def esc(t): return html.escape(t, quote=True)

_uid = [0]
def uid():
    _uid[0] += 1
    return f"c{_uid[0]}"

# ---------------- primitives ----------------
def img_in_rect(shot, x, y, w, h, rx=10, align="xMidYMin"):
    cid = uid()
    return (f'<clipPath id="{cid}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}"/></clipPath>'
            f'<image href="{b64(os.path.join(SHOTS, shot + ".png"))}" x="{x}" y="{y}" '
            f'width="{w}" height="{h}" preserveAspectRatio="{align} slice" clip-path="url(#{cid})"/>')

def mock_browser(shot, cx, cy, w=1420, h=1010):
    x, y = cx - w/2, cy - h/2
    bar = 74
    s = f'<g filter="url(#shadow)"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="18" fill="#FFFFFF" stroke="{BEIGE}" stroke-width="3"/></g>'
    s += f'<rect x="{x}" y="{y}" width="{w}" height="{bar}" rx="18" fill="{BEIGE}"/>'
    s += f'<rect x="{x}" y="{y+bar-18}" width="{w}" height="18" fill="{BEIGE}"/>'
    for i, col in enumerate(("#C98A6B", "#D9B98A", "#8A9B85")):
        s += f'<circle cx="{x+46+i*44}" cy="{y+bar/2}" r="12" fill="{col}"/>'
    s += f'<rect x="{x+190}" y="{y+18}" width="{w-380}" height="{bar-36}" rx="{(bar-36)/2}" fill="#FFFFFF" opacity="0.85"/>'
    s += img_in_rect(shot, x+16, y+bar+6, w-32, h-bar-24, rx=8)
    return s

def mock_laptop(shot, cx, cy, w=1560):
    sw, sh = w, w * 0.615
    x, y = cx - sw/2, cy - sh/2 - 40
    s = f'<g filter="url(#shadow)"><rect x="{x-24}" y="{y-24}" width="{sw+48}" height="{sh+48}" rx="34" fill="{INK}"/></g>'
    s += img_in_rect(shot, x, y, sw, sh, rx=8)
    by = y + sh + 24
    s += f'<path d="M {x-150} {by} L {x+sw+150} {by} L {x+sw+110} {by+54} Q {x+sw+90} {by+70} {x+sw+60} {by+70} L {x-60} {by+70} Q {x-90} {by+70} {x-110} {by+54} Z" fill="#D9D2C6"/>'
    s += f'<rect x="{cx-130}" y="{by}" width="260" height="16" rx="8" fill="#C4BCAE"/>'
    return s

def mock_page(shot, cx, cy, ph=1560, rot=0):
    pw = ph * 0.773
    x, y = cx - pw/2, cy - ph/2
    s = f'<g transform="rotate({rot} {cx} {cy})">'
    s += f'<g filter="url(#shadow)"><rect x="{x}" y="{y}" width="{pw}" height="{ph}" rx="10" fill="#FFFFFF" stroke="{BEIGE}" stroke-width="3"/></g>'
    s += img_in_rect(shot, x+14, y+14, pw-28, ph-28, rx=6)
    s += '</g>'
    return s

def mock_fan(shots, cx, cy, ph=1350):
    pw = ph * 0.773
    n = len(shots)
    s = ""
    angles = [-10, 0, 10] if n == 3 else ([-7, 7] if n == 2 else [0])
    offs = [-260, 0, 260] if n == 3 else ([-150, 150] if n == 2 else [0])
    for shot, a, ox in zip(shots, angles, offs):
        x, y = cx + ox - pw/2, cy - ph/2
        s += f'<g transform="rotate({a} {cx+ox} {cy+ph/2})">'
        s += f'<g filter="url(#shadow)"><rect x="{x}" y="{y}" width="{pw}" height="{ph}" rx="10" fill="#FFFFFF" stroke="{BEIGE}" stroke-width="3"/></g>'
        s += img_in_rect(shot, x+12, y+12, pw-24, ph-24, rx=6)
        s += '</g>'
    return s

def mock_card(lines, cx, cy, w=1300, h=900):
    x, y = cx - w/2, cy - h/2
    s = f'<g filter="url(#shadow)"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="22" fill="#FFFFFF" stroke="{BEIGE}" stroke-width="3"/></g>'
    s += f'<rect x="{x}" y="{y}" width="{w}" height="86" rx="22" fill="{SAGE}"/><rect x="{x}" y="{y+64}" width="{w}" height="22" fill="{SAGE}"/>'
    s += f'<text x="{cx}" y="{y+58}" font-family="{SANS}" font-size="34" font-weight="bold" fill="#FFFFFF" text-anchor="middle" letter-spacing="4">{esc(lines[0])}</text>'
    yy = y + 190
    for before, mark, after in lines[1:]:
        s += (f'<text x="{x+70}" y="{yy}" font-family="{SANS}" font-size="42" fill="{WGRAY}">{esc(before)}'
              f'<tspan fill="{TERRA}" font-weight="bold">{esc(mark)}</tspan>{esc(after)}</text>')
        yy += 108
    return s

def badge(lines, cx, cy, color, r=175, rot=-8):
    s = f'<g transform="rotate({rot} {cx} {cy})" filter="url(#shadow)">'
    s += f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{color}"/>'
    s += f'<circle cx="{cx}" cy="{cy}" r="{r-16}" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/>'
    n = len(lines)
    fs = 52 if max(len(l) for l in lines) <= 8 else 40
    y0 = cy - (n-1) * (fs*0.62)
    for i, l in enumerate(lines):
        s += (f'<text x="{cx}" y="{y0 + i*fs*1.24}" font-family="{SANS}" font-size="{fs}" '
              f'font-weight="bold" fill="#FFFFFF" text-anchor="middle" letter-spacing="3" '
              f'dominant-baseline="middle">{esc(l)}</text>')
    s += '</g>'
    return s

def annot(text, tx, ty, ax, ay, anchor="end", color=None):
    """Annotation text at (tx,ty) with a thin curved arrow to (ax,ay)."""
    color = color or WGRAY
    mx = (tx + ax) / 2 + (140 if ax > tx else -140)
    my = min(ty, ay) - 90
    sx = tx + (30 if anchor == "start" else -30)
    s = (f'<text x="{tx}" y="{ty}" font-family="{SERIF}" font-size="47" font-style="italic" '
         f'fill="{color}" text-anchor="{anchor}">{esc(text)}</text>')
    s += (f'<path d="M {sx} {ty+16} Q {mx} {my} {ax} {ay}" fill="none" stroke="{TERRA}" '
          f'stroke-width="4.5" marker-end="url(#arrow)"/>')
    return s

def headline(lines, x=150, y=310, size=126, anchor="start", color=INK):
    s = ""
    for i, l in enumerate(lines):
        s += (f'<text x="{x}" y="{y + i*(size*1.14)}" font-family="{SERIF}" font-size="{size}" '
              f'font-weight="bold" fill="{color}" text-anchor="{anchor}" '
              f'letter-spacing="2">{esc(l.upper())}</text>')
    return s, y + (len(lines)-1)*(size*1.14)

def subline(text, x, y, anchor="start", size=57):
    return (f'<text x="{x}" y="{y}" font-family="{SANS}" font-size="{size}" fill="{WGRAY}" '
            f'text-anchor="{anchor}">{esc(text)}</text>')

def footer():
    return (f'<text x="{W/2}" y="{H-58}" font-family="{SANS}" font-size="46" font-weight="bold" '
            f'fill="{TERRA}" text-anchor="middle" letter-spacing="16">PLANARYSHOP</text>')

def shell(inner):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>
<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
<feDropShadow dx="0" dy="14" stdDeviation="26" flood-color="#2E2A26" flood-opacity="0.16"/>
</filter>
<marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
<path d="M 0 1 L 8 5 L 0 9" fill="none" stroke="{TERRA}" stroke-width="1.8" stroke-linecap="round"/>
</marker>
</defs>
<rect width="{W}" height="{H}" fill="{CREAM}"/>
<rect x="0" y="0" width="{W}" height="16" fill="{SAGE}"/>
<rect x="0" y="{H-16}" width="{W}" height="16" fill="{SAGE}"/>
{inner}
{footer()}
</svg>'''

# ---------------- layouts ----------------
def layout_hero(hl, sub, mock, badges, annots):
    s, yend = headline(hl, x=W/2, y=270, size=132, anchor="middle")
    s += subline(sub, W/2, yend + 105, anchor="middle")
    s += mock
    for b in badges: s += b
    for a in annots: s += a
    return shell(s)

def layout_feature(hl, sub, mock, annots, badges=()):
    s, yend = headline(hl, x=150, y=300, size=112)
    s += subline(sub, 150, yend + 95, size=53)
    s += mock
    for b in badges: s += b
    for a in annots: s += a
    return shell(s)

def layout_included(title, sub, items, fan):
    s, yend = headline([title], x=150, y=290, size=118)
    s += subline(sub, 150, yend + 92, size=53)
    y0 = yend + 220
    for i, it in enumerate(items):
        yy = y0 + i * 112
        s += f'<circle cx="188" cy="{yy-16}" r="30" fill="{SAGE}"/>'
        s += (f'<path d="M 174 {yy-16} L 184 {yy-6} L 204 {yy-28}" fill="none" stroke="#FFFFFF" '
              f'stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>')
        s += (f'<text x="248" y="{yy}" font-family="{SANS}" font-size="52" '
              f'fill="{INK}">{esc(it)}</text>')
    s += fan
    return shell(s)

def layout_download(title, sub, steps):
    s, yend = headline([title], x=W/2, y=300, size=124, anchor="middle")
    s += subline(sub, W/2, yend + 100, anchor="middle")
    cw = 660; gap = 90
    x0 = (W - (3*cw + 2*gap)) / 2
    cy = 1150
    icons = ["cart", "download", "print"]
    for i, (head, body) in enumerate(steps):
        x = x0 + i * (cw + gap)
        s += f'<g filter="url(#shadow)"><rect x="{x}" y="{cy-330}" width="{cw}" height="700" rx="26" fill="#FFFFFF" stroke="{BEIGE}" stroke-width="3"/></g>'
        col = SAGE if i != 1 else TERRA
        s += f'<circle cx="{x+cw/2}" cy="{cy-190}" r="86" fill="{col}"/>'
        s += (f'<text x="{x+cw/2}" y="{cy-158}" font-family="{SERIF}" font-size="86" font-weight="bold" '
              f'fill="#FFFFFF" text-anchor="middle">{i+1}</text>')
        s += (f'<text x="{x+cw/2}" y="{cy-20}" font-family="{SERIF}" font-size="56" font-weight="bold" '
              f'fill="{INK}" text-anchor="middle">{esc(head)}</text>')
        yy = cy + 60
        for ln in body:
            s += (f'<text x="{x+cw/2}" y="{yy}" font-family="{SANS}" font-size="42" fill="{WGRAY}" '
                  f'text-anchor="middle">{esc(ln)}</text>')
            yy += 58
        if i < 2:
            ax = x + cw + gap/2
            s += (f'<path d="M {ax-26} {cy} L {ax+18} {cy}" stroke="{TERRA}" stroke-width="6" '
                  f'marker-end="url(#arrow)" fill="none"/>')
    s += (f'<text x="{W/2}" y="{cy+520}" font-family="{SANS}" font-size="46" fill="{WGRAY}" '
          f'text-anchor="middle">Digital product — nothing ships. Files are yours in minutes.</text>')
    return shell(s)

def layout_social(title, sub, points):
    s, yend = headline([title], x=W/2, y=300, size=124, anchor="middle")
    s += subline(sub, W/2, yend + 100, anchor="middle")
    cx, cy, cw, ch = W/2, 1120, 1760, 760
    s += f'<g filter="url(#shadow)"><rect x="{cx-cw/2}" y="{cy-ch/2}" width="{cw}" height="{ch}" rx="30" fill="#FFFFFF" stroke="{BEIGE}" stroke-width="3"/></g>'
    star = "M 0 -46 L 13 -13 L 48 -13 L 20 8 L 30 42 L 0 22 L -30 42 L -20 8 L -48 -13 L -13 -13 Z"
    for i in range(5):
        sx = cx - 260 + i * 130
        s += f'<path d="{star}" transform="translate({sx} {cy-220})" fill="{TERRA}"/>'
    s += (f'<text x="{cx}" y="{cy-40}" font-family="{SERIF}" font-size="64" font-style="italic" '
          f'fill="{WGRAY}" text-anchor="middle">&#8220; Paste a real buyer review here &#8221;</text>')
    s += (f'<text x="{cx}" y="{cy+60}" font-family="{SANS}" font-size="40" fill="{WGRAY}" '
          f'text-anchor="middle">— happy customer, verified purchase</text>')
    yy = cy + 190
    for pt in points:
        s += f'<circle cx="{cx - 620}" cy="{yy-14}" r="10" fill="{SAGE}"/>'
        s += (f'<text x="{cx - 585}" y="{yy}" font-family="{SANS}" font-size="46" fill="{INK}" '
              f'text-anchor="start">{esc(pt)}</text>')
        yy += 88
    return shell(s)

# ---------------- image specs ----------------
def specs():
    S = {}
    # ============ PRODUCT 1 — Budget Planner ============
    S["producto-1/01-hero.jpg"] = layout_hero(
        ["Master your money", "in 2026"],
        "Budget spreadsheet for Excel & Google Sheets — the formulas are already done",
        mock_laptop("p1-dashboard", W/2, 1310, w=1500),
        [badge(["EXCEL +", "GOOGLE", "SHEETS"], 350, 1250, SAGE),
         badge(["ALL MATH", "DONE", "FOR YOU"], 2350, 1250, TERRA, rot=8)],
        [annot("two charts, drawn for you", 620, 1800, 1050, 1620),
         annot("your savings rate, live", 2930-770, 1830, 1720, 1660, anchor="start")])
    S["producto-1/02-dashboard.jpg"] = layout_feature(
        ["Your whole year,", "one screen"],
        "The Dashboard rebuilds itself every time you type a number",
        mock_browser("p1-dashboard", 1800, 1220, 1560, 1110),
        [annot("summary cards", 830, 800, 1180, 740),
         annot("income vs. spending bars", 750, 1180, 1090, 1120),
         annot("yearly category donut", 780, 1560, 1120, 1620)])
    S["producto-1/03-income.jpg"] = layout_feature(
        ["Every income stream,", "counted"],
        "Five sources across twelve months — totals fill themselves in",
        mock_browser("p1-income", 1760, 1250, 1620, 900),
        [annot("rename any source", 700, 950, 1050, 1010),
         annot("type in the white cells", 660, 1310, 990, 1260),
         annot("beige cells = automatic totals", 900, 1740, 1400, 1600)])
    S["producto-1/04-expenses.jpg"] = layout_feature(
        ["15 categories,", "ready to go"],
        "From housing to travel — just add what you spend each month",
        mock_browser("p1-expenses", 1760, 1250, 1620, 940),
        [annot("groceries, subscriptions & more", 830, 950, 1130, 1030),
         annot("monthly totals, automatic", 700, 1400, 1010, 1350),
         annot("yearly total per category", 880, 1750, 1480, 1620)])
    S["producto-1/05-savings.jpg"] = layout_feature(
        ["Goals that fill", "themselves"],
        "Set a target, log what you put aside — progress % appears on its own",
        mock_browser("p1-savings", 1780, 1230, 1440, 860),
        [annot("five savings goals", 720, 930, 1210, 990),
         annot("your target", 620, 1280, 1370, 1220),
         annot("progress calculated for you", 860, 1700, 1900, 1560)])
    S["producto-1/06-debts.jpg"] = layout_feature(
        ["Watch your debt", "shrink"],
        "Log each payment — the remaining balance updates by itself",
        mock_browser("p1-debts", 1780, 1230, 1440, 860),
        [annot("all your debts, one view", 740, 930, 1230, 990),
         annot("what you have paid", 640, 1300, 1440, 1240),
         annot("remaining balance, automatic", 880, 1700, 1930, 1560)])
    S["producto-1/07-annual.jpg"] = layout_feature(
        ["Your savings rate,", "every month"],
        "The Annual Summary reads from every other tab — nothing to type",
        mock_browser("p1-annual", 1800, 1230, 1400, 1060),
        [annot("income and spending, month by month", 900, 900, 1300, 960),
         annot("net savings", 620, 1300, 1400, 1260),
         annot("savings rate %", 660, 1660, 1560, 1580)])
    S["producto-1/08-included.jpg"] = layout_included(
        "What's included", "One purchase — everything below, instantly",
        ["2026 Budget Planner (.xlsx) — Excel & Google Sheets",
         "Dashboard with 2 automatic charts",
         "Income · Expenses · Savings · Debts tabs",
         "Annual Summary with savings rate",
         "1-page Quick-Start Guide (PDF)",
         "Bonus: full Spanish version included"],
        mock_fan(["p1-dashboard", "p1-annual"], 2080, 1330, ph=1150))
    S["producto-1/09-download.jpg"] = layout_download(
        "Instant download", "From checkout to budgeting in three small steps",
        [("Buy", ["Purchase the listing —", "Etsy prepares your", "files immediately"]),
         ("Download", ["Get the files from", "your Etsy account,", "on any computer"]),
         ("Start", ["Open in Excel or import", "to Google Sheets and", "type your first number"])])
    S["producto-1/10-social.jpg"] = layout_social(
        "Loved by planners", "Replace this placeholder with your first review",
        ["Works in Excel and Google Sheets",
         "All formulas pre-built and protected by design",
         "Spanish version included at no extra cost"])

    # ============ PRODUCT 2 — Weekly Planner ============
    S["producto-2/01-hero.jpg"] = layout_hero(
        ["Plan calmer weeks"],
        "Undated weekly planner + habit tracker — print it forever, start any week",
        mock_fan(["p2-cover", "p2-weekly", "p2-habits"], W/2, 1300, ph=1240),
        [badge(["17", "PAGES"], 330, 1130, SAGE),
         badge(["US LETTER", "+ A4"], 2370, 1130, TERRA, rot=8)],
        [annot("no dates — it never expires", 640, 1870, 990, 1760),
         annot("15 habits × 31 days", 2160, 1870, 1850, 1780, anchor="start")])
    S["producto-2/02-weekly.jpg"] = layout_feature(
        ["Start any week", "you like"],
        "Monday to Sunday, anchored by your Top 3 priorities",
        mock_page("p2-weekly", 1850, 1220, ph=1500),
        [annot("room for every day", 700, 950, 1300, 1010),
         annot("your top 3, front and center", 800, 1330, 2200, 900),
         annot("notes and loose ends", 700, 1700, 2200, 1500)])
    S["producto-2/03-habits.jpg"] = layout_feature(
        ["Make habits", "visible"],
        "15 habits × 31 days — one glance tells the story of your month",
        mock_page("p2-habits", 1850, 1220, ph=1500),
        [annot("write each habit once", 680, 950, 1330, 1050),
         annot("one square per day", 660, 1330, 1450, 1280),
         annot("watch the chains grow", 700, 1700, 1700, 1560)])
    S["producto-2/04-monthly.jpg"] = layout_feature(
        ["Give every week", "one focus"],
        "Two monthly pages — plan the month before it runs you",
        mock_page("p2-monthly", 1850, 1220, ph=1500),
        [annot("week-by-week focus boxes", 760, 950, 1350, 1060),
         annot("the month's top 3", 640, 1330, 2240, 950),
         annot("notes to self", 620, 1700, 2240, 1500)])
    S["producto-2/05-goals.jpg"] = layout_feature(
        ["Dream first,", "then decide"],
        "Four life areas on one calm page — personal, health, work, joy",
        mock_page("p2-goals", 1850, 1220, ph=1500),
        [annot("four gentle quadrants", 700, 950, 1350, 1030),
         annot("write like nobody's judging", 780, 1400, 1300, 1330)])
    S["producto-2/06-action.jpg"] = layout_feature(
        ["From goal to", "first step"],
        "Break every goal into three steps and give it a season",
        mock_page("p2-action", 1850, 1220, ph=1500),
        [annot("one goal per row", 640, 950, 1330, 1030),
         annot("first three steps", 640, 1330, 1750, 1260),
         annot("when you'll do it", 660, 1700, 2270, 1500)])
    S["producto-2/07-notes.jpg"] = layout_feature(
        ["Room to think"],
        "Two lined pages and one dotted page — for lists, ideas and sketches",
        mock_fan(["p2-notes", "p2-dotted"], 1850, 1250, ph=1330),
        [annot("classic lined paper", 640, 1000, 1350, 1060),
         annot("dot grid for sketching", 680, 1600, 2300, 1400)])
    S["producto-2/08-included.jpg"] = layout_included(
        "What's included", "17 pages — in US Letter and A4, both in your download",
        ["Cover + how-to-use page",
         "Yearly goals + action plan pages",
         "2 monthly plan pages",
         "6 weekly plan pages (Mon–Sun)",
         "2 habit trackers — 15 habits × 31 days",
         "3 notes pages (lined + dotted)"],
        mock_fan(["p2-monthly", "p2-weekly"], 2080, 1330, ph=1150))
    S["producto-2/09-download.jpg"] = layout_download(
        "Instant download", "No shipping, no waiting — print tonight",
        [("Buy", ["Purchase the listing —", "both paper sizes are", "included"]),
         ("Download", ["Two PDFs: US Letter", "and A4, from your", "Etsy account"]),
         ("Print", ["Print only the pages", "you need — reprint", "any time, forever"])])
    S["producto-2/10-social.jpg"] = layout_social(
        "Made for real weeks", "Replace this placeholder with your first review",
        ["Undated — start in January or in August",
         "Works printed, or on iPad with GoodNotes",
         "Reprint favorite pages as often as you like"])

    # ============ PRODUCT 3 — Business Kit ============
    S["producto-3/01-hero.jpg"] = layout_hero(
        ["Look professional", "from day one"],
        "Invoice, quote, contract, policy & client tracker — matching and editable",
        mock_fan(["p3-invoice", "p3-quote", "p3-agreement"], W/2, 1310, ph=1220),
        [badge(["5", "TEMPLATES"], 330, 1130, SAGE),
         badge(["WORD +", "EXCEL"], 2370, 1130, TERRA, rot=8)],
        [annot("fill in the brackets, send", 620, 1870, 980, 1760),
         annot("plain-English contract", 2140, 1870, 1840, 1780, anchor="start")])
    S["producto-3/02-invoice.jpg"] = layout_feature(
        ["Invoices clients", "take seriously"],
        "Business header, itemized table, tax and total — ready to send",
        mock_page("p3-invoice", 1850, 1220, ph=1500),
        [annot("your business details here", 760, 950, 1350, 1010),
         annot("itemized services table", 700, 1330, 1400, 1280),
         annot("clear payment terms", 680, 1700, 1450, 1620)])
    S["producto-3/03-quote.jpg"] = layout_feature(
        ["Quotes that close", "the deal"],
        "Price, validity window, what's included — and a line to sign",
        mock_page("p3-quote", 1850, 1220, ph=1500),
        [annot("valid-until date", 620, 950, 1350, 1010),
         annot("included vs. not included", 720, 1330, 1380, 1300),
         annot("client signs right here", 700, 1700, 1450, 1650)])
    S["producto-3/04-agreement.jpg"] = layout_feature(
        ["A contract in", "plain English"],
        "Nine short clauses — payment, cancellations, ownership and more",
        mock_page("p3-agreement", 1850, 1220, ph=1500),
        [annot("no legal jargon", 620, 950, 1340, 1010),
         annot("who owns the work", 660, 1330, 1380, 1300),
         annot("liability, capped and clear", 760, 1700, 1420, 1620)])
    S["producto-3/05-cancellation.jpg"] = layout_feature(
        ["No more no-show", "losses"],
        "48-hour, 24-hour and no-show tiers — deposits and refunds, spelled out",
        mock_page("p3-cancel", 1850, 1220, ph=1500),
        [annot("three simple time windows", 760, 950, 1350, 1080),
         annot("deposit rules", 620, 1330, 1360, 1300),
         annot("refund timelines", 640, 1700, 1400, 1620)])
    S["producto-3/06-tracker.jpg"] = layout_feature(
        ["Every client,", "one sheet"],
        "30 ready rows — the balance column and totals do their own math",
        mock_browser("p3-tracker", 1780, 1250, 1600, 950),
        [annot("status dropdown per client", 780, 950, 1150, 1030),
         annot("quoted, invoiced, paid", 700, 1330, 1500, 1280),
         annot("balance = automatic", 680, 1740, 1900, 1620)])
    S["producto-3/07-brackets.jpg"] = layout_feature(
        ["Fill in the brackets.", "That's it."],
        "Every template uses clear [BRACKETED FIELDS] — replace and send",
        mock_card(["HOW EDITING WORKS",
                   ("Payment is due by ", "[DUE DATE]", " via bank transfer."),
                   ("", "[YOUR BUSINESS NAME]", " will deliver the"),
                   ("services above starting ", "[START DATE]", "."),
                   ("A deposit of ", "[DEPOSIT %]", " reserves your spot.")],
                  1800, 1250, w=1450, h=880),
        [annot("search for [ and replace", 700, 950, 1250, 1050),
         annot("works in Word & Google Docs", 800, 1750, 1500, 1660)])
    S["producto-3/08-included.jpg"] = layout_included(
        "What's included", "Five matching files, one ZIP, one download",
        ["Invoice template (.docx)",
         "Quote template (.docx)",
         "Service agreement — 9 clauses (.docx)",
         "Cancellation policy (.docx)",
         "Client tracker with formulas (.xlsx)",
         "Templates, not legal advice — attorney review advised"],
        mock_fan(["p3-invoice", "p3-tracker"], 2080, 1330, ph=1150))
    S["producto-3/09-download.jpg"] = layout_download(
        "Instant download", "Be ready to invoice tonight",
        [("Buy", ["Purchase the listing —", "your ZIP is prepared", "immediately"]),
         ("Download", ["One ZIP with all five", "templates, from your", "Etsy account"]),
         ("Customize", ["Replace the bracketed", "fields, save as PDF,", "send to your client"])])
    S["producto-3/10-social.jpg"] = layout_social(
        "Built for solo businesses", "Replace this placeholder with your first review",
        ["Five templates share one clean, professional look",
         "Plain-English clauses your clients actually read",
         "Tracker formulas keep balances up to date"])
    return S

def write_svgs():
    S = specs()
    for rel, svg in S.items():
        path = os.path.join(SVGDIR, rel.replace(".jpg", ".svg"))
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(svg)
    print(f"wrote {len(S)} SVGs")
    return S

def convert():
    from playwright.sync_api import sync_playwright
    svgs = []
    for root, _, files in os.walk(SVGDIR):
        for f in sorted(files):
            if f.endswith(".svg"): svgs.append(os.path.join(root, f))
    with sync_playwright() as p:
        b = p.chromium.launch(
            executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
        page = b.new_page(viewport={"width": W, "height": H})
        for svg in sorted(svgs):
            rel = os.path.relpath(svg, SVGDIR).replace(".svg", ".jpg")
            out = os.path.join(IMG, rel)
            os.makedirs(os.path.dirname(out), exist_ok=True)
            page.goto("file://" + svg)
            page.screenshot(path=out, type="jpeg", quality=90,
                            clip={"x": 0, "y": 0, "width": W, "height": H})
            print("jpg:", rel)
        b.close()

def qa():
    from spellchecker import SpellChecker
    sp = SpellChecker()
    WHITELIST = {"planaryshop", "undated", "xlsx", "docx", "pdf", "pdfs", "zip", "etsy",
                 "goodnotes", "ipad", "dropdown", "reprint", "vs", "mon", "sun", "a4",
                 "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "oct", "nov",
                 "dec", "checkout", "invoiced", "rebuild", "rebuilds", "sketching",
                 "pre", "timelines"}  # "pre" from hyphen-split "pre-built"; both valid English
    fails = []
    n_jpg = 0
    for root, _, files in os.walk(SVGDIR):
        for f in sorted(files):
            if not f.endswith(".svg"): continue
            svg = open(os.path.join(root, f)).read()
            texts = re.findall(r"<text[^>]*>(.*?)</text>", svg, re.S)
            words = []
            for t in texts:
                t = re.sub(r"<[^>]+>", " ", t)
                t = html.unescape(t)
                words += re.findall(r"[A-Za-z']{2,}", t)
            unknown = {w for w in words
                       if w.lower() not in WHITELIST and sp.unknown([w.lower()])}
            if unknown:
                fails.append((f, sorted(unknown)))
    for root, _, files in os.walk(IMG):
        if "_shots" in root or "_svg" in root: continue
        for f in sorted(files):
            if not f.endswith(".jpg"): continue
            im = Image.open(os.path.join(root, f))
            n_jpg += 1
            if im.size != (W, H):
                fails.append((f, f"size {im.size} != (2700, 2025)"))
    print(f"JPGs verificados: {n_jpg} (esperados 30)")
    if n_jpg != 30:
        fails.append(("count", f"{n_jpg} jpgs"))
    if fails:
        for f, why in fails: print("FAIL:", f, why)
        sys.exit(1)
    print("QA BLOCK 5: PASS — 30 imágenes 2700×2025, textos sin erratas")

if __name__ == "__main__":
    stage = sys.argv[1] if len(sys.argv) > 1 else "all"
    if stage in ("all", "svg"): write_svgs()
    if stage in ("all", "jpg"): convert()
    if stage in ("all", "qa"): qa()
