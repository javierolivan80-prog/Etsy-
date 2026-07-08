"""PlanaryShop — Block 2: Weekly Planner + Habit Tracker PDF (17 pages, Letter + A4)."""
import os
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas

CREAM = HexColor("#FAF7F2"); BEIGE = HexColor("#E9DFD2"); SAGE = HexColor("#8A9B85")
TERRA = HexColor("#C98A6B"); INK = HexColor("#2E2A26"); WGRAY = HexColor("#4A443E")
WHITE = HexColor("#FFFFFF")
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "output", "producto-2")
M = 44  # page margin (pt)

def bounds_check(x, y, w, h, W, H, what):
    if x < M - 1 or y < M - 1 or x + w > W - M + 1 or y + h > H - M + 1:
        raise AssertionError(f"element '{what}' out of printable area: {x},{y},{w},{h}")

class Pg:
    def __init__(self, c, W, H):
        self.c, self.W, self.H = c, W, H
    def bg(self):
        self.c.setFillColor(CREAM); self.c.rect(0, 0, self.W, self.H, stroke=0, fill=1)
    def head(self, title, sub=None):
        c = self.c
        c.setFillColor(INK); c.setFont("Times-Bold", 22)
        c.drawString(M, self.H - M - 18, title.upper())
        if sub:
            c.setFillColor(WGRAY); c.setFont("Helvetica", 9)
            c.drawString(M, self.H - M - 34, sub)
        c.setFillColor(SAGE)
        c.rect(M, self.H - M - 44, self.W - 2*M, 2.2, stroke=0, fill=1)
        return self.H - M - 60  # content top y
    def foot(self):
        c = self.c
        c.setFillColor(TERRA); c.setFont("Times-Italic", 8)
        c.drawCentredString(self.W/2, M - 14, "PLANARYSHOP")
    def box(self, x, y, w, h, title=None, fill=WHITE, accent=SAGE, what="box"):
        bounds_check(x, y, w, h, self.W, self.H, what)
        c = self.c
        c.setFillColor(fill); c.setStrokeColor(BEIGE); c.setLineWidth(1)
        c.roundRect(x, y, w, h, 6, stroke=1, fill=1)
        if title:
            c.setFillColor(accent); c.setFont("Helvetica-Bold", 8.5)
            c.drawString(x + 10, y + h - 16, title.upper())
    def lines(self, x, y, w, h, gap=20, start_off=30):
        c = self.c
        c.setStrokeColor(BEIGE); c.setLineWidth(0.8)
        yy = y + h - start_off
        while yy > y + 8:
            c.line(x + 10, yy, x + w - 10, yy); yy -= gap
    def dots(self, x, y, w, h, gap=14):
        c = self.c
        c.setFillColor(HexColor("#D8CDBC"))
        yy = y + h - 14
        while yy > y + 8:
            xx = x + 12
            while xx < x + w - 8:
                c.circle(xx, yy, 0.9, stroke=0, fill=1)
                xx += gap
            yy -= gap

def p_cover(p):
    c, W, H = p.c, p.W, p.H
    p.bg()
    c.setFillColor(BEIGE); c.rect(0, H-110, W, 110, stroke=0, fill=1)
    c.setFillColor(SAGE); c.rect(0, H-114, W, 4, stroke=0, fill=1)
    c.setFillColor(TERRA); c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(W/2, H-64, "P L A N A R Y S H O P")
    c.setFillColor(INK); c.setFont("Times-Bold", 40)
    c.drawCentredString(W/2, H/2 + 60, "WEEKLY PLANNER")
    c.setFillColor(WGRAY); c.setFont("Times-Bold", 22)
    c.drawCentredString(W/2, H/2 + 24, "&  HABIT  TRACKER")
    c.setStrokeColor(SAGE); c.setLineWidth(1.4)
    c.line(W/2 - 90, H/2 - 2, W/2 + 90, H/2 - 2)
    c.setFillColor(WGRAY); c.setFont("Helvetica", 11)
    c.drawCentredString(W/2, H/2 - 30, "Undated — start any week you like")
    c.setFillColor(SAGE); c.circle(W/2, H/2 - 70, 26, stroke=0, fill=1)
    c.setFillColor(WHITE); c.setFont("Times-Bold", 22)
    c.drawCentredString(W/2, H/2 - 78, "17")
    c.setFillColor(WGRAY); c.setFont("Helvetica", 9)
    c.drawCentredString(W/2, H/2 - 110, "pages of calm, focused planning")
    c.setFillColor(TERRA); c.setFont("Times-Italic", 9)
    c.drawCentredString(W/2, 60, "For personal use only")

def p_howto(p):
    c, W, H = p.c, p.W, p.H
    p.bg(); y0 = p.head("How to use this planner", "Three simple layers — use the ones that serve you")
    items = [
        ("1 · Dream", "Yearly Goals page", "Write down what you want this year to look like. Big, small — all of it counts."),
        ("2 · Decide", "Action Plan + Monthly pages", "Break each goal into steps, then park those steps on a month. No dates printed, so nothing expires."),
        ("3 · Do", "Weekly pages + Habit Tracker", "Plan the week around your Top 3 priorities, and let the tracker make your habits visible."),
    ]
    bh = (y0 - M - 70) / 3
    for i, (k, wsub, body) in enumerate(items):
        by = y0 - (i+1)*bh - i*10
        p.box(M, by, W - 2*M, bh, what="howto")
        c.setFillColor(SAGE if i != 1 else TERRA)
        c.circle(M + 34, by + bh/2, 17, stroke=0, fill=1)
        c.setFillColor(WHITE); c.setFont("Times-Bold", 14)
        c.drawCentredString(M + 34, by + bh/2 - 5, str(i+1))
        c.setFillColor(INK); c.setFont("Times-Bold", 15)
        c.drawString(M + 64, by + bh - 34, k)
        c.setFillColor(TERRA); c.setFont("Helvetica-Bold", 8.5)
        c.drawString(M + 64, by + bh - 48, wsub.upper())
        c.setFillColor(WGRAY); c.setFont("Helvetica", 9.5)
        words = body.split(); line = ""; yy = by + bh - 66
        for w_ in words:
            if len(line + " " + w_) > 78:
                c.drawString(M + 64, yy, line.strip()); yy -= 12; line = w_
            else: line += " " + w_
        c.drawString(M + 64, yy, line.strip())
    c.setFillColor(WGRAY); c.setFont("Helvetica-Oblique", 9)
    c.drawString(M, M + 28, "Tip: print only the pages you need this week — the planner is undated on purpose.")
    p.foot()

def p_goals(p):
    c, W, H = p.c, p.W, p.H
    p.bg(); y0 = p.head("Yearly goals", "If this year went beautifully, what would be true?")
    cw = (W - 2*M - 16) / 2
    ch = (y0 - M - 20 - 12) / 2
    quads = [("Personal", SAGE), ("Health", TERRA), ("Work & money", TERRA), ("Learning & joy", SAGE)]
    for i, (t, a) in enumerate(quads):
        x = M + (i % 2) * (cw + 16)
        y = y0 - ch - (i // 2) * (ch + 12)
        p.box(x, y, cw, ch, t, accent=a, what="goalquad")
        p.lines(x, y, cw, ch - 14)
    p.foot()

def p_action(p):
    c, W, H = p.c, p.W, p.H
    p.bg(); y0 = p.head("Action plan", "One goal per row — break it down, give it a season")
    rows = 6
    rh = (y0 - M - 24) / rows
    x = M; w = W - 2*M
    c1, c2 = w * 0.30, w * 0.52  # goal | first steps | season
    c.setFont("Helvetica-Bold", 8.5)
    for i in range(rows):
        y = y0 - (i+1)*rh
        p.box(x, y, w, rh - 6, what="actionrow")
        c.setStrokeColor(BEIGE); c.setLineWidth(1)
        c.line(x + c1, y + 6, x + c1, y + rh - 12)
        c.line(x + c1 + c2, y + 6, x + c1 + c2, y + rh - 12)
        c.setFillColor(SAGE)
        c.drawString(x + 10, y + rh - 20, "GOAL")
        c.setFillColor(TERRA)
        c.drawString(x + c1 + 10, y + rh - 20, "FIRST THREE STEPS")
        c.setFillColor(WGRAY)
        c.drawString(x + c1 + c2 + 10, y + rh - 20, "WHEN")
        p.lines(x + c1 + 4, y, c2 - 8, rh - 22, gap=15, start_off=32)
    p.foot()

def p_monthly(p, n):
    c, W, H = p.c, p.W, p.H
    p.bg(); y0 = p.head(f"Monthly plan", "Write the month at the top — then give every week one focus")
    c.setFillColor(WGRAY); c.setFont("Helvetica-Bold", 9)
    c.drawString(M, y0 - 6, "MONTH:")
    c.setStrokeColor(BEIGE); c.setLineWidth(1)
    c.line(M + 52, y0 - 8, M + 220, y0 - 8)
    top = y0 - 26
    lw = (W - 2*M) * 0.62
    rw = W - 2*M - lw - 14
    rows = 5
    rh = (top - M - 20) / rows
    for i in range(rows):
        y = top - (i+1)*rh
        p.box(M, y, lw, rh - 8, f"Week {i+1} focus", what="monthweek")
        p.lines(M, y, lw, rh - 22, gap=15)
    p.box(M + lw + 14, top - 3*rh, rw, 3*rh - 8, "This month's top 3", accent=TERRA, what="monthtop3")
    for i in range(3):
        yy = top - 3*rh + (3*rh - 8) - 44 - i*34
        c.setFillColor(TERRA); c.circle(M + lw + 30, yy + 3, 7, stroke=0, fill=1)
        c.setFillColor(WHITE); c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(M + lw + 30, yy, str(i+1))
        c.setStrokeColor(BEIGE); c.line(M + lw + 44, yy - 2, M + lw + rw - 12, yy - 2)
    p.box(M + lw + 14, M + 12, rw, 2*rh - 12, "Notes to self", what="monthnotes")
    p.lines(M + lw + 14, M + 12, rw, 2*rh - 26, gap=16)
    p.foot()

def p_weekly(p, n):
    c, W, H = p.c, p.W, p.H
    p.bg(); y0 = p.head("Weekly plan", "Monday to Sunday — anchored by your Top 3")
    c.setFillColor(WGRAY); c.setFont("Helvetica-Bold", 9)
    c.drawString(M, y0 - 6, "WEEK OF:")
    c.setStrokeColor(BEIGE); c.line(M + 62, y0 - 8, M + 220, y0 - 8)
    top = y0 - 26
    lw = (W - 2*M) * 0.60
    rw = W - 2*M - lw - 14
    days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
    rh = (top - M - 16) / 7
    for i, d in enumerate(days):
        y = top - (i+1)*rh
        p.box(M, y, lw, rh - 5, what="dayrow")
        c.setFillColor(SAGE if i < 5 else TERRA); c.setFont("Times-Bold", 10.5)
        c.drawString(M + 10, y + rh - 21, d)
        c.setStrokeColor(BEIGE); c.setLineWidth(0.8)
        c.line(M + 86, y + 6, M + 86, y + rh - 11)
        p.lines(M + 88, y, lw - 92, rh - 5, gap=13, start_off=18)
    th = (top - M - 16) * 0.42
    p.box(M + lw + 14, top - th, rw, th - 5, "Top 3 priorities", accent=TERRA, what="weektop3")
    for i in range(3):
        yy = top - 30 - i * ((th - 40) / 3)
        c.setFillColor(WHITE); c.setStrokeColor(TERRA); c.setLineWidth(1.2)
        c.rect(M + lw + 26, yy - 14, 10, 10, stroke=1, fill=1)
        c.setStrokeColor(BEIGE)
        c.line(M + lw + 44, yy - 12, M + lw + rw - 12, yy - 12)
    nh = (top - M - 16) - th - 9
    p.box(M + lw + 14, M + 16, rw, nh, "Notes & loose ends", what="weeknotes")
    p.lines(M + lw + 14, M + 16, rw, nh - 14, gap=15)
    p.foot()

def p_habits(p, n):
    c, W, H = p.c, p.W, p.H
    p.bg(); y0 = p.head("Habit tracker", "15 habits × 31 days — one glance tells the story")
    c.setFillColor(WGRAY); c.setFont("Helvetica-Bold", 9)
    c.drawString(M, y0 - 6, "MONTH:")
    c.setStrokeColor(BEIGE); c.line(M + 52, y0 - 8, M + 200, y0 - 8)
    top = y0 - 24
    x = M; w = W - 2*M
    name_w = 108
    cell_w = (w - name_w) / 31
    rows = 15
    rh = (top - M - 30) / (rows + 1)
    bounds_check(x, M + 30, w, top - M - 30, W, H, "habitgrid")
    # header row: day numbers
    c.setFillColor(SAGE)
    c.rect(x, top - rh, w, rh, stroke=0, fill=1)
    c.setFillColor(WHITE); c.setFont("Helvetica-Bold", 6.5)
    c.drawString(x + 8, top - rh + rh/2 - 2.5, "HABIT")
    for d in range(31):
        cx = x + name_w + d*cell_w + cell_w/2
        c.drawCentredString(cx, top - rh + rh/2 - 2.5, str(d+1))
    for i in range(rows):
        y = top - (i+2)*rh
        if i % 2 == 0:
            c.setFillColor(HexColor("#F2ECE2"))
            c.rect(x, y, w, rh, stroke=0, fill=1)
        c.setStrokeColor(BEIGE); c.setLineWidth(0.6)
        c.line(x + 8, y + 5, x + name_w - 8, y + 5)
    # grid lines
    c.setStrokeColor(HexColor("#D8CDBC")); c.setLineWidth(0.5)
    for d in range(32):
        gx = x + name_w + d*cell_w
        c.line(gx, top - (rows+1)*rh, gx, top - rh)
    for i in range(rows + 2):
        gy = top - rh - i*rh + rh
        c.line(x, top - rh*(i+1) + rh, x + w, top - rh*(i+1) + rh) if False else None
    for i in range(rows + 1):
        gy = top - rh*(i+1)
        c.line(x, gy, x + w, gy)
    c.setStrokeColor(BEIGE); c.setLineWidth(1)
    c.rect(x, top - (rows+1)*rh, w, (rows+1)*rh, stroke=1, fill=0)
    c.setFillColor(WGRAY); c.setFont("Helvetica-Oblique", 8.5)
    c.drawString(M, M + 12, "Fill the square on the days you show up. Chains are motivating — but a missed day never erases your progress.")
    p.foot()

def p_notes_lined(p, n):
    c, W, H = p.c, p.W, p.H
    p.bg(); y0 = p.head("Notes")
    p.box(M, M + 16, W - 2*M, y0 - M - 20, what="linednotes")
    p.lines(M, M + 16, W - 2*M, y0 - M - 34, gap=22)
    p.foot()

def p_notes_dotted(p):
    c, W, H = p.c, p.W, p.H
    p.bg(); y0 = p.head("Ideas & sketches")
    p.box(M, M + 16, W - 2*M, y0 - M - 20, what="dottednotes")
    p.dots(M, M + 16, W - 2*M, y0 - M - 34)
    p.foot()

def build(pagesize, path):
    W, H = pagesize
    c = canvas.Canvas(path, pagesize=pagesize)
    p = Pg(c, W, H)
    p_cover(p); c.showPage()
    p_howto(p); c.showPage()
    p_goals(p); c.showPage()
    p_action(p); c.showPage()
    for i in range(2): p_monthly(p, i+1); c.showPage()
    for i in range(6): p_weekly(p, i+1); c.showPage()
    for i in range(2): p_habits(p, i+1); c.showPage()
    for i in range(2): p_notes_lined(p, i+1); c.showPage()
    p_notes_dotted(p); c.showPage()
    c.save()
    return path

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    build(letter, os.path.join(OUT, "PlanaryShop-Weekly-Planner-US-Letter.pdf"))
    build(A4, os.path.join(OUT, "PlanaryShop-Weekly-Planner-A4.pdf"))
    print("built Letter + A4 weekly planners (17 pages each, bounds-checked)")
