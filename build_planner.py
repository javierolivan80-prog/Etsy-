from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.chart import DoughnutChart, LineChart, BarChart, Reference
from openpyxl.chart.series import DataPoint
from openpyxl.chart.label import DataLabelList
from openpyxl.chart.marker import Marker
from openpyxl.formatting.rule import CellIsRule, ColorScaleRule
from datetime import date

# ---------- design system ----------
SAGE = "7D9B76"; SAGE_D = "56744F"; SAGE_L = "EAF1E7"; SAGE_XL = "F5F9F3"
BEIGE = "F5F0E6"; BEIGE_D = "E4DAC6"; BEIGE_TXT = "8C7B5F"
CORAL = "E89A87"; CORAL_L = "FBEAE4"; CORAL_D = "C96F5B"
INK = "3B3B3B"; GRAY = "9C9C9C"; LINE = "EDEDED"; WHITE = "FFFFFF"
SUCCESS = "4C9A6C"; SUCCESS_L = "E6F3EB"; AMBER = "C99532"; AMBER_L = "FBF3DF"
DANGER = "C96F5B"; DANGER_L = "FBE9E5"
F = "Arial"
CUR = '$#,##0.00'; CUR0 = '$#,##0'; PCT = '0.0%'; DAT = 'mmm dd, yyyy'

# chart palette — validated (lightness band, chroma floor, CVD >= 12, contrast)
CH_GREEN = "4A8A2F"; CH_CORAL = "E0603A"; CH_TEAL = "00958A"
CH_AMBER = "B5830A"; CH_PLUM = "A559B5"; CH_BLUE = "3A6FD8"; CH_GRAY = "9C9C9C"

def fl(c): return PatternFill("solid", start_color=c)
thin = Side(style="thin", color=LINE)

wb = Workbook(); wb.remove(wb.active)

def new_sheet(name, tab=SAGE):
    ws = wb.create_sheet(name)
    ws.sheet_view.showGridLines = False
    ws.sheet_properties.tabColor = tab
    ws.column_dimensions['A'].width = 2
    return ws

def header(ws, t, sub, cmax=11):
    ws['B2'] = t
    ws['B2'].font = Font(name=F, size=24, bold=True, color=INK)
    ws['B3'] = sub
    ws['B3'].font = Font(name=F, size=10, color=GRAY)
    for c in range(2, cmax+1):
        ws.cell(row=4, column=c).fill = fl(SAGE)
    ws.row_dimensions[4].height = 3
    ws.row_dimensions[2].height = 30
    ws.row_dimensions[5].height = 8

def rect(ws, r1, c1, r2, c2, accent=SAGE):
    for r in range(r1, r2+1):
        for c in range(c1, c2+1):
            cell = ws.cell(row=r, column=c)
            cell.fill = fl(WHITE)
            left = Side(style="thick", color=accent) if c == c1 else thin
            cell.border = Border(left=left, right=thin if c == c2 else None,
                                 top=thin if r == r1 else None, bottom=thin if r == r2 else None)

def kpi(ws, r, c, label, formula, fmt, icon, accent=SAGE, trend=None, vcolor=INK):
    rect(ws, r, c, r+3, c+1, accent)
    lab = ws.cell(row=r, column=c, value=f"{icon}  {label}")
    lab.font = Font(name=F, size=8, bold=True, color=GRAY)
    lab.alignment = Alignment(horizontal="left", vertical="center", indent=1)
    ws.merge_cells(start_row=r+1, start_column=c, end_row=r+2, end_column=c+1)
    v = ws.cell(row=r+1, column=c, value=formula)
    v.font = Font(name=F, size=16, bold=True, color=vcolor)
    v.number_format = fmt
    v.alignment = Alignment(horizontal="left", vertical="center", indent=1)
    if trend:
        t = ws.cell(row=r+3, column=c, value=trend)
        t.font = Font(name=F, size=8, color=GRAY)
        t.alignment = Alignment(horizontal="left", vertical="center", indent=1)
        ws.merge_cells(start_row=r+3, start_column=c, end_row=r+3, end_column=c+1)
    ws.row_dimensions[r].height = 16
    ws.row_dimensions[r+1].height = 15
    ws.row_dimensions[r+2].height = 15
    ws.row_dimensions[r+3].height = 13

def th(ws, row, col, text, align="left"):
    c = ws.cell(row=row, column=col, value=text)
    c.font = Font(name=F, size=9, bold=True, color=SAGE_D)
    c.fill = fl(BEIGE)
    c.alignment = Alignment(horizontal=align, vertical="center", indent=1 if align == "left" else 0)
    c.border = Border(bottom=Side(style="medium", color=SAGE))
    ws.row_dimensions[row].height = 22
    return c

def cellv(ws, row, col, val, fmt=None, bold=False, color=INK, size=10, bg=None, align="left", inp=False):
    c = ws.cell(row=row, column=col, value=val)
    c.font = Font(name=F, size=size, bold=bold, color=BEIGE_TXT if inp else color)
    if fmt: c.number_format = fmt
    if bg or inp: c.fill = fl(BEIGE if inp else bg)
    c.alignment = Alignment(horizontal=align, vertical="center", indent=1 if align == "left" else 0)
    c.border = Border(bottom=thin)
    return c

def section(ws, row, col, text):
    c = ws.cell(row=row, column=col, value=text)
    c.font = Font(name=F, size=9, bold=True, color=SAGE_D)
    ws.row_dimensions[row].height = 20

def zebra(ws, r, c1, c2):
    for c in range(c1, c2+1): ws.cell(row=r, column=c).fill = fl(SAGE_XL)

def bar(pct, n=10, cap=True):
    p = f"MAX(0,MIN(1,{pct}))" if cap else f"MAX(0,{pct})"
    return f'=REPT("█",ROUND({p}*{n},0))&REPT("░",{n}-ROUND({p}*{n},0))'

ICONS = {"Income":"💰","Housing":"🏠","Food":"🍽️","Transportation":"🚗","Shopping":"🛍️",
         "Entertainment":"🎬","Health":"🩺","Insurance":"🛡️","Travel":"✈️","Education":"🎓",
         "Subscriptions":"🔁","Pets":"🐾","Children":"🧸","Taxes":"🏛️","Savings":"🌱",
         "Investments":"📈","Other":"📦"}
cats = ["Housing","Food","Transportation","Shopping","Entertainment","Health","Insurance","Travel",
        "Education","Subscriptions","Pets","Children","Taxes","Savings","Investments","Other"]
srcs = ["Salary","Freelance","Business","Investments","Gifts","Refunds","Other"]

# =============== SETTINGS ===============
st = new_sheet("⚙️ Settings", "B8B8B8")
header(st, "⚙️ Settings", "Edit the beige cells — every dropdown in the planner updates automatically", 8)
for col, w in zip("BCDEFG", [18, 6, 16, 16, 14, 12]): st.column_dimensions[col].width = w
th(st, 7, 2, "CATEGORY"); th(st, 7, 3, "ICON", "center"); th(st, 7, 4, "INCOME SOURCES")
th(st, 7, 5, "PAYMENT METHODS"); th(st, 7, 6, "ACCOUNTS"); th(st, 7, 7, "CURRENCY")
cats_dd = ["Income"] + cats
for i, v in enumerate(cats_dd):
    cellv(st, 8+i, 2, v, inp=True)
    cellv(st, 8+i, 3, ICONS[v], align="center", inp=True)
for i, v in enumerate(srcs): cellv(st, 8+i, 4, v, inp=True)
for i, v in enumerate(["Card","Cash","Bank Transfer","PayPal","Other"]): cellv(st, 8+i, 5, v, inp=True)
for i, v in enumerate(["Checking","Savings","Credit Card","Cash"]): cellv(st, 8+i, 6, v, inp=True)
cellv(st, 8, 7, "USD ($)", inp=True)
wb.defined_names.add(DefinedName("Categories", attr_text="'⚙️ Settings'!$B$8:$B$24"))
wb.defined_names.add(DefinedName("CatIcons", attr_text="'⚙️ Settings'!$B$8:$C$24"))
wb.defined_names.add(DefinedName("IncomeSources", attr_text="'⚙️ Settings'!$D$8:$D$14"))
wb.defined_names.add(DefinedName("PayMethods", attr_text="'⚙️ Settings'!$E$8:$E$12"))
wb.defined_names.add(DefinedName("Accounts", attr_text="'⚙️ Settings'!$F$8:$F$11"))

# =============== TRANSACTIONS ===============
TRN = "'💳 Transactions'"
DB = "'🏠 Dashboard'"
MONTH = f"{DB}!$C$6"
R0, R1 = 12, 5000
DATES = f"{TRN}!$B${R0}:$B${R1}"
CATS = f"{TRN}!$E${R0}:$E${R1}"
SUBSR = f"{TRN}!$F${R0}:$F${R1}"
INC = f"{TRN}!$I${R0}:$I${R1}"
EXP = f"{TRN}!$J${R0}:$J${R1}"
INMONTH = f'{DATES},">="&{MONTH},{DATES},"<"&EOMONTH({MONTH},0)+1'
INPREV = f'{DATES},">="&EDATE({MONTH},-1),{DATES},"<"&{MONTH}'

tr = new_sheet("💳 Transactions")
header(tr, "💳 Transactions", "The only page you type in — log it here, watch everything else update itself", 11)
for col, w in zip("BCDEFGHIJK", [13, 26, 5, 14, 14, 14, 12, 11, 11, 20]): tr.column_dimensions[col].width = w
kpi(tr, 6, 2, "TOTAL INCOME", f"=SUM(I{R0}:I{R1})", CUR, "💰", SAGE, '="All time"')
kpi(tr, 6, 4, "TOTAL EXPENSES", f"=SUM(J{R0}:J{R1})", CUR, "💸", CORAL, '="All time"', CORAL_D)
kpi(tr, 6, 6, "BALANCE", f"=SUM(I{R0}:I{R1})-SUM(J{R0}:J{R1})", CUR, "💼", "B8A96E", '="Income − expenses"')
heads = ["DATE","DESCRIPTION","","CATEGORY","SUBCATEGORY","PAYMENT","ACCOUNT","INCOME","EXPENSE","NOTES"]
for i, h in enumerate(heads): th(tr, 11, 2+i, h if h else " ", "right" if h in ("INCOME","EXPENSE") else "left")
tx = [
 (date(2026,5,1),"Monthly salary","Income","Salary","Bank Transfer","Checking",2600,None,""),
 (date(2026,5,1),"Rent","Housing","Rent","Bank Transfer","Checking",None,850,""),
 (date(2026,5,3),"Groceries — Mercadona","Food","Groceries","Card","Checking",None,86.40,""),
 (date(2026,5,5),"Gym membership","Health","Fitness","Card","Checking",None,29.90,""),
 (date(2026,5,7),"Freelance project","Income","Freelance","PayPal","Checking",420,None,""),
 (date(2026,5,8),"Gas","Transportation","Fuel","Card","Credit Card",None,52.00,""),
 (date(2026,5,10),"Netflix","Subscriptions","Streaming","Card","Credit Card",None,12.99,""),
 (date(2026,5,12),"Dinner out","Food","Restaurants","Card","Credit Card",None,43.50,""),
 (date(2026,5,15),"Transfer to savings","Savings","Emergency Fund","Bank Transfer","Savings",None,300,""),
 (date(2026,5,18),"New sneakers","Shopping","Clothing","Card","Credit Card",None,74.99,""),
 (date(2026,5,20),"Electricity bill","Housing","Utilities","Bank Transfer","Checking",None,64.20,""),
 (date(2026,5,22),"Pharmacy","Health","Medicine","Cash","Cash",None,18.35,""),
 (date(2026,5,25),"Index fund","Investments","Index Funds","Bank Transfer","Checking",None,200,""),
 (date(2026,5,28),"Groceries","Food","Groceries","Card","Checking",None,92.10,""),
 (date(2026,6,1),"Monthly salary","Income","Salary","Bank Transfer","Checking",2600,None,""),
 (date(2026,6,1),"Rent","Housing","Rent","Bank Transfer","Checking",None,850,""),
 (date(2026,6,2),"Groceries","Food","Groceries","Card","Checking",None,81.75,""),
 (date(2026,6,4),"Spotify","Subscriptions","Music","Card","Credit Card",None,10.99,""),
 (date(2026,6,6),"Freelance project","Income","Freelance","PayPal","Checking",380,None,""),
 (date(2026,6,8),"Bus pass","Transportation","Public Transit","Card","Checking",None,40.00,""),
 (date(2026,6,10),"Cinema","Entertainment","Movies","Card","Credit Card",None,22.00,""),
 (date(2026,6,12),"Groceries","Food","Groceries","Card","Checking",None,88.60,""),
 (date(2026,6,15),"Transfer to savings","Savings","Emergency Fund","Bank Transfer","Savings",None,300,""),
 (date(2026,6,17),"Car insurance","Insurance","Auto","Bank Transfer","Checking",None,58.00,""),
 (date(2026,6,20),"Birthday gift","Shopping","Gifts","Card","Credit Card",None,35.00,""),
 (date(2026,6,22),"Online course","Education","Courses","Card","Checking",None,49.00,""),
 (date(2026,6,25),"Index fund","Investments","Index Funds","Bank Transfer","Checking",None,200,""),
 (date(2026,6,27),"Weekend trip fuel","Travel","Road Trip","Card","Credit Card",None,45.30,""),
 (date(2026,7,1),"Monthly salary","Income","Salary","Bank Transfer","Checking",2600,None,""),
 (date(2026,7,1),"Rent","Housing","Rent","Bank Transfer","Checking",None,850,""),
 (date(2026,7,2),"Groceries","Food","Groceries","Card","Checking",None,79.40,""),
 (date(2026,7,3),"Refund — returned item","Income","Refunds","Card","Checking",24.99,None,""),
 (date(2026,7,4),"Gas","Transportation","Fuel","Card","Credit Card",None,50.00,""),
 (date(2026,7,5),"Brunch","Food","Restaurants","Card","Credit Card",None,28.50,""),
 (date(2026,7,5),"Transfer to savings","Savings","Emergency Fund","Bank Transfer","Savings",None,300,""),
 (date(2026,7,6),"Netflix","Subscriptions","Streaming","Card","Credit Card",None,12.99,""),
]
r = R0
for (d, desc, cat, sub, pay, acc, inc, exp, note) in tx:
    cellv(tr, r, 2, d, 'mmm dd')
    cellv(tr, r, 3, desc)
    cellv(tr, r, 4, f'=IF($E{r}="","",IFERROR(VLOOKUP($E{r},CatIcons,2,FALSE),""))', align="center")
    cellv(tr, r, 5, cat)
    cellv(tr, r, 6, sub, color=GRAY)
    cellv(tr, r, 7, pay, color=GRAY)
    cellv(tr, r, 8, acc, color=GRAY)
    cellv(tr, r, 9, inc, CUR, align="right", color=SUCCESS, bold=bool(inc))
    cellv(tr, r, 10, exp, CUR, align="right")
    cellv(tr, r, 11, note, color=GRAY)
    ws_r = tr.row_dimensions[r]; ws_r.height = 20
    if r % 2 == 0: zebra(tr, r, 2, 11)
    r += 1
for rr in range(r, r+50):
    tr.row_dimensions[rr].height = 20
    cellv(tr, rr, 4, f'=IF($E{rr}="","",IFERROR(VLOOKUP($E{rr},CatIcons,2,FALSE),""))', align="center")
    for i in [2,3,5,6,7,8,9,10,11]:
        c = tr.cell(row=rr, column=i); c.border = Border(bottom=thin)
        c.font = Font(name=F, size=10, color=INK)
        if i == 2: c.number_format = 'mmm dd'
        if i in (9,10): c.number_format = CUR; c.alignment = Alignment(horizontal="right")
    if rr % 2 == 0: zebra(tr, rr, 2, 11)
dv_cat = DataValidation(type="list", formula1="=Categories", allow_blank=True)
dv_pay = DataValidation(type="list", formula1="=PayMethods", allow_blank=True)
dv_acc = DataValidation(type="list", formula1="=Accounts", allow_blank=True)
for dv in (dv_cat, dv_pay, dv_acc): tr.add_data_validation(dv)
dv_cat.add(f"E{R0}:E{R1}"); dv_pay.add(f"G{R0}:G{R1}"); dv_acc.add(f"H{R0}:H{R1}")
tr.freeze_panes = "B12"

# ======================================================================
# PART 2 — Dashboard, Budget, Goals, Year at a Glance
# ======================================================================

def month_exp(cat, month_ref=MONTH):
    return (f'SUMIFS({EXP},{CATS},"{cat}",{DATES},">="&{month_ref},'
            f'{DATES},"<"&EOMONTH({month_ref},0)+1)')

INC_M = f'SUMIFS({INC},{INMONTH})'
EXP_M = f'SUMIFS({EXP},{INMONTH})'

# =============== DASHBOARD ===============
db = new_sheet("🏠 Dashboard")
header(db, "🏠 Dashboard", "Your month at a glance — pick a month below and every number follows", 11)
for col, w in zip("BCDEFGHIJK", [19, 12, 12, 12, 15, 3, 12, 14, 12, 12]):
    db.column_dimensions[col].width = w

# month selector
sel = db.cell(row=6, column=2, value="VIEWING MONTH")
sel.font = Font(name=F, size=9, bold=True, color=SAGE_D)
sel.alignment = Alignment(horizontal="left", vertical="center")
mc = cellv(db, 6, 3, date(2026, 7, 1), 'mmmm yyyy', bold=True, size=12, inp=True)
mc.alignment = Alignment(horizontal="center", vertical="center")
hint = db.cell(row=6, column=4, value="← type any date in a month (e.g. 6/1/2026) to travel there")
hint.font = Font(name=F, size=8, italic=True, color=GRAY)
db.row_dimensions[6].height = 22
db.row_dimensions[7].height = 8

# KPI row
kpi(db, 8, 2, "INCOME", f"={INC_M}", CUR, "💰", SAGE,
    f'="vs "&TEXT(SUMIFS({INC},{INPREV}),"$#,##0")&" last month"')
kpi(db, 8, 4, "EXPENSES", f"={EXP_M}", CUR, "💸", CORAL,
    f'="vs "&TEXT(SUMIFS({EXP},{INPREV}),"$#,##0")&" last month"', CORAL_D)
kpi(db, 8, 6, "NET", f"={INC_M}-{EXP_M}", CUR, "💼", "B8A96E", '="Income − expenses"')
kpi(db, 8, 8, "SAVINGS RATE", f'=IFERROR(({month_exp("Savings")}+{month_exp("Investments")}'
    f'+{INC_M}-{EXP_M})/{INC_M},0)', PCT, "🌱", SAGE_D,
    '="Saved + invested + leftover"')

# spending by category (selected month)
section(db, 13, 2, "WHERE THE MONEY WENT")
th(db, 14, 2, "CATEGORY"); th(db, 14, 3, "SPENT", "right")
th(db, 14, 4, "% OF SPEND", "right"); th(db, 14, 5, " ")
CAT_R0 = 15
for i, cat in enumerate(cats):
    rr = CAT_R0 + i
    cellv(db, rr, 2, f"{ICONS[cat]}  {cat}")
    cellv(db, rr, 3, f"={month_exp(cat)}", CUR, align="right")
    cellv(db, rr, 4, f'=IFERROR($C{rr}/{EXP_M},0)', PCT, align="right", color=GRAY)
    cellv(db, rr, 5, bar(f"$C{rr}/MAX($C${CAT_R0}:$C${CAT_R0+15})"), color=SAGE, size=9)
    db.row_dimensions[rr].height = 18
    if rr % 2 == 0: zebra(db, rr, 2, 5)
tot_r = CAT_R0 + len(cats)
cellv(db, tot_r, 2, "TOTAL", bold=True, color=SAGE_D)
cellv(db, tot_r, 3, f"={EXP_M}", CUR, align="right", bold=True, color=SAGE_D)
for c in (2, 3):
    db.cell(row=tot_r, column=c).border = Border(top=Side(style="medium", color=SAGE))

# --- chart helper block (far right; feeds the charts, safe to ignore) ---
hnote = db.cell(row=13, column=14, value="CHART DATA (auto — no need to touch)")
hnote.font = Font(name=F, size=8, bold=True, color=GRAY)
for i, cat in enumerate(cats):
    rr = CAT_R0 + i
    db.cell(row=rr, column=14, value=cat).font = Font(name=F, size=8, color=GRAY)
    a = db.cell(row=rr, column=15, value=f"={month_exp(cat)}+ROW()/10000000")
    a.font = Font(name=F, size=8, color=GRAY); a.number_format = CUR
HN, HV = "$O$15:$O$30", "$N$15:$N$30"
for k in range(5):
    rr = CAT_R0 + k
    n = db.cell(row=rr, column=17,
                value=f'=INDEX({HV},MATCH(LARGE({HN},{k+1}),{HN},0))')
    n.font = Font(name=F, size=8, color=GRAY)
    v = db.cell(row=rr, column=18, value=f'=ROUND(LARGE({HN},{k+1}),2)')
    v.font = Font(name=F, size=8, color=GRAY); v.number_format = CUR
db.cell(row=CAT_R0+5, column=17, value="Other").font = Font(name=F, size=8, color=GRAY)
ov = db.cell(row=CAT_R0+5, column=18, value=f'=MAX(0,ROUND({EXP_M}-SUM($R${CAT_R0}:$R${CAT_R0+4}),2))')
ov.font = Font(name=F, size=8, color=GRAY); ov.number_format = CUR

# doughnut — share of spend, top 5 + other
pie = DoughnutChart(holeSize=62)
labels = Reference(db, min_col=17, min_row=CAT_R0, max_row=CAT_R0+5)
data = Reference(db, min_col=18, min_row=CAT_R0, max_row=CAT_R0+5)
pie.add_data(data, titles_from_data=False)
pie.set_categories(labels)
pie.title = "Share of spending — top 5 categories"
slice_colors = [CH_GREEN, CH_CORAL, CH_TEAL, CH_AMBER, CH_PLUM, CH_GRAY]
pts = []
for i, col in enumerate(slice_colors):
    dp = DataPoint(idx=i)
    dp.graphicalProperties.solidFill = col
    dp.graphicalProperties.line.solidFill = WHITE
    dp.graphicalProperties.line.width = 28575  # 2.25pt white gap between slices
    pts.append(dp)
pie.series[0].data_points = pts
pie.dLbls = DataLabelList(showPercent=True, showVal=False, showCatName=False,
                          showSerName=False, showLegendKey=False)
pie.legend.position = 'r'
pie.width = 12.5; pie.height = 8.6
db.add_chart(pie, "G14")

# --- 6-month trend helper (rows below the doughnut helpers) ---
TRR = tot_r + 3  # helper rows
for j in range(6):
    off = -5 + j
    m = db.cell(row=TRR, column=15+j, value=f'=TEXT(EDATE({MONTH},{off}),"mmm")')
    m.font = Font(name=F, size=8, color=GRAY)
    iv = db.cell(row=TRR+1, column=15+j,
                 value=f'=SUMIFS({INC},{DATES},">="&EDATE({MONTH},{off}),'
                       f'{DATES},"<"&EDATE({MONTH},{off+1}))')
    ev = db.cell(row=TRR+2, column=15+j,
                 value=f'=SUMIFS({EXP},{DATES},">="&EDATE({MONTH},{off}),'
                       f'{DATES},"<"&EDATE({MONTH},{off+1}))')
    for cc in (iv, ev):
        cc.font = Font(name=F, size=8, color=GRAY); cc.number_format = CUR
db.cell(row=TRR+1, column=14, value="Income").font = Font(name=F, size=8, color=GRAY)
db.cell(row=TRR+2, column=14, value="Expenses").font = Font(name=F, size=8, color=GRAY)

section(db, tot_r + 2, 2, "SIX-MONTH TREND")
ln = LineChart()
ln.title = "Income vs expenses — last 6 months"
tr_data = Reference(db, min_col=14, max_col=20, min_row=TRR+1, max_row=TRR+2)
ln.add_data(tr_data, from_rows=True, titles_from_data=True)
ln.set_categories(Reference(db, min_col=15, max_col=20, min_row=TRR))
for s, col, sym in zip(ln.series, (CH_GREEN, CH_CORAL), ("circle", "square")):
    s.graphicalProperties.line.solidFill = col
    s.graphicalProperties.line.width = 22000
    s.smooth = False
    s.marker = Marker(symbol=sym, size=7)
    s.marker.graphicalProperties.solidFill = col
    s.marker.graphicalProperties.line.solidFill = WHITE
ln.legend.position = 'b'
ln.y_axis.numFmt = CUR0
ln.width = 21.5; ln.height = 8.2
db.add_chart(ln, f"B{tot_r + 3}")
for rr in range(tot_r + 3, tot_r + 20):
    db.row_dimensions[rr].height = 18

# =============== BUDGET ===============
bg = new_sheet("📊 Budget", CORAL)
header(bg, "📊 Budget", "Set a plan in the beige cells — actuals follow the month picked on the Dashboard", 9)
for col, w in zip("BCDEFGH", [19, 14, 14, 14, 10, 15, 13]): bg.column_dimensions[col].width = w
B_R0 = 13
B_RN = B_R0 + len(cats) - 1
kpi(bg, 6, 2, "PLANNED", f"=SUM(C{B_R0}:C{B_RN})", CUR, "🎯", SAGE, '="Total monthly budget"')
kpi(bg, 6, 4, "SPENT", f"=SUM(D{B_R0}:D{B_RN})", CUR, "💸", CORAL,
    f'=TEXT({MONTH},"mmmm yyyy")', CORAL_D)
kpi(bg, 6, 6, "LEFT TO SPEND", f"=SUM(C{B_R0}:C{B_RN})-SUM(D{B_R0}:D{B_RN})", CUR, "💼", "B8A96E",
    '="Planned − spent"')
th(bg, 12, 2, "CATEGORY"); th(bg, 12, 3, "BUDGET", "right"); th(bg, 12, 4, "ACTUAL", "right")
th(bg, 12, 5, "LEFT", "right"); th(bg, 12, 6, "% USED", "right"); th(bg, 12, 7, " ")
th(bg, 12, 8, "STATUS")
budget_vals = {"Housing":950,"Food":350,"Transportation":120,"Shopping":100,"Entertainment":60,
               "Health":80,"Insurance":60,"Travel":80,"Education":50,"Subscriptions":30,
               "Pets":0,"Children":0,"Taxes":0,"Savings":300,"Investments":200,"Other":50}
for i, cat in enumerate(cats):
    rr = B_R0 + i
    cellv(bg, rr, 2, f"{ICONS[cat]}  {cat}")
    cellv(bg, rr, 3, budget_vals[cat], CUR, align="right", inp=True)
    cellv(bg, rr, 4, f"={month_exp(cat)}", CUR, align="right")
    cellv(bg, rr, 5, f"=$C{rr}-$D{rr}", CUR, align="right", color=GRAY)
    cellv(bg, rr, 6, f'=IFERROR($D{rr}/$C{rr},0)', PCT, align="right", color=GRAY)
    cellv(bg, rr, 7, bar(f"IFERROR($D{rr}/$C{rr},0)"), color=SAGE, size=9)
    cellv(bg, rr, 8, f'=IF($C{rr}=0,"—",IF($D{rr}>$C{rr},"🔴 Over",'
                     f'IF($D{rr}>0.85*$C{rr},"🟡 Close","🟢 On track")))')
    bg.row_dimensions[rr].height = 18
    if rr % 2 == 0: zebra(bg, rr, 2, 8)
tot = B_RN + 1
cellv(bg, tot, 2, "TOTAL", bold=True, color=SAGE_D)
cellv(bg, tot, 3, f"=SUM(C{B_R0}:C{B_RN})", CUR, align="right", bold=True, color=SAGE_D)
cellv(bg, tot, 4, f"=SUM(D{B_R0}:D{B_RN})", CUR, align="right", bold=True, color=SAGE_D)
cellv(bg, tot, 5, f"=C{tot}-D{tot}", CUR, align="right", bold=True, color=SAGE_D)
for c in range(2, 9):
    bg.cell(row=tot, column=c).border = Border(top=Side(style="medium", color=SAGE))
bg.conditional_formatting.add(f"E{B_R0}:E{B_RN}",
    CellIsRule(operator="lessThan", formula=["0"],
               font=Font(name=F, size=10, bold=True, color=DANGER), fill=fl(DANGER_L)))
bg.conditional_formatting.add(f"F{B_R0}:F{B_RN}",
    CellIsRule(operator="greaterThan", formula=["1"],
               font=Font(name=F, size=10, bold=True, color=DANGER)))

# =============== GOALS ===============
gl = new_sheet("🌱 Goals", SAGE_D)
header(gl, "🌱 Goals", "Name it, price it, date it — the planner tells you what to put away each month", 10)
for col, w in zip("BCDEFGHI", [22, 13, 13, 14, 11, 14, 15, 9]): gl.column_dimensions[col].width = w
G_R0 = 13
G_RN = G_R0 + 7  # 3 sample + 5 spare rows
kpi(gl, 6, 2, "TOTAL TARGET", f"=SUM(C{G_R0}:C{G_RN})", CUR0, "🎯", SAGE)
kpi(gl, 6, 4, "SAVED SO FAR", f"=SUM(D{G_R0}:D{G_RN})", CUR0, "🌱", SAGE_D)
kpi(gl, 6, 6, "OVERALL PROGRESS",
    f"=IFERROR(SUM(D{G_R0}:D{G_RN})/SUM(C{G_R0}:C{G_RN}),0)", PCT, "🚀", "B8A96E")
th(gl, 12, 2, "GOAL"); th(gl, 12, 3, "TARGET", "right"); th(gl, 12, 4, "SAVED", "right")
th(gl, 12, 5, "TARGET DATE"); th(gl, 12, 6, "MONTHS LEFT", "right")
th(gl, 12, 7, "NEEDED / MO", "right"); th(gl, 12, 8, " "); th(gl, 12, 9, "%", "right")
goals = [("🛟 Emergency fund", 5000, 2100, date(2026,12,31)),
         ("✈️ Summer trip", 1200, 450, date(2027,6,1)),
         ("💻 New laptop", 1500, 600, date(2026,11,1))]
for i in range(8):
    rr = G_R0 + i
    if i < len(goals):
        nm, tgt, sav, dl = goals[i]
        cellv(gl, rr, 2, nm, inp=True)
        cellv(gl, rr, 3, tgt, CUR0, align="right", inp=True)
        cellv(gl, rr, 4, sav, CUR0, align="right", inp=True)
        cellv(gl, rr, 5, dl, DAT, inp=True)
    else:
        for cc, fmt in ((2, None), (3, CUR0), (4, CUR0), (5, DAT)):
            cellv(gl, rr, cc, None, fmt, align="right" if cc in (3,4) else "left", inp=True)
    cellv(gl, rr, 6, f'=IF($E{rr}="","",MAX(1,DATEDIF(TODAY(),$E{rr},"m")))', '0', align="right", color=GRAY)
    cellv(gl, rr, 7, f'=IF($B{rr}="","",MAX(0,$C{rr}-$D{rr})/IF($F{rr}="",1,$F{rr}))',
          CUR, align="right", bold=True)
    cellv(gl, rr, 8, f'=IF($B{rr}="","",REPT("█",ROUND(MAX(0,MIN(1,IFERROR($D{rr}/$C{rr},0)))*10,0))'
                     f'&REPT("░",10-ROUND(MAX(0,MIN(1,IFERROR($D{rr}/$C{rr},0)))*10,0)))', color=SAGE, size=9)
    cellv(gl, rr, 9, f'=IF($B{rr}="","",IFERROR($D{rr}/$C{rr},0))', PCT, align="right", color=GRAY)
    gl.row_dimensions[rr].height = 20
    if rr % 2 == 0: zebra(gl, rr, 6, 9)
gl.conditional_formatting.add(f"I{G_R0}:I{G_RN}",
    ColorScaleRule(start_type="num", start_value=0, start_color=CORAL_L,
                   end_type="num", end_value=1, end_color=SAGE_L))
tip = gl.cell(row=G_RN+2, column=2,
              value="💡 Log 'Transfer to savings' rows on the Transactions page, then update SAVED here.")
tip.font = Font(name=F, size=9, italic=True, color=GRAY)

# =============== YEAR AT A GLANCE ===============
yr = new_sheet("📅 Year", AMBER)
header(yr, "📅 Year at a Glance", "Every category, every month — darker cells mean heavier spending", 15)
yr.column_dimensions['B'].width = 19
for j in range(12):
    yr.column_dimensions[get_column_letter(3+j)].width = 9
yr.column_dimensions[get_column_letter(15)].width = 11
ylab = yr.cell(row=6, column=2, value="YEAR")
ylab.font = Font(name=F, size=9, bold=True, color=SAGE_D)
yc = cellv(yr, 6, 3, 2026, '0', bold=True, size=12, inp=True)
yc.alignment = Alignment(horizontal="center", vertical="center")
yr.row_dimensions[6].height = 22
YREF = "'📅 Year'!$C$6"
Y_R0 = 9
th(yr, 8, 2, "CATEGORY")
months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"]
for j, m in enumerate(months): th(yr, 8, 3+j, m, "right")
th(yr, 8, 15, "TOTAL", "right")
def ymun(rng, mcol):
    return (f'{DATES},">="&DATE({YREF},{mcol},1),{DATES},"<"&DATE({YREF},{mcol}+1,1)')
for i, cat in enumerate(cats):
    rr = Y_R0 + i
    cellv(yr, rr, 2, f"{ICONS[cat]}  {cat}", size=9)
    for j in range(12):
        cellv(yr, rr, 3+j, f'=SUMIFS({EXP},{CATS},"{cat}",{ymun(EXP, j+1)})',
              CUR0, align="right", size=9)
    cellv(yr, rr, 15, f"=SUM(C{rr}:N{rr})", CUR0, align="right", bold=True, size=9)
    yr.row_dimensions[rr].height = 17
Y_RN = Y_R0 + len(cats) - 1
sp = Y_RN + 1
cellv(yr, sp, 2, "TOTAL SPENDING", bold=True, color=CORAL_D, size=9)
inr = sp + 1
cellv(yr, inr, 2, "💰 INCOME", bold=True, color=SAGE_D, size=9)
ntr = sp + 2
cellv(yr, ntr, 2, "NET", bold=True, size=9)
for j in range(12):
    cellv(yr, sp, 3+j, f"=SUM({get_column_letter(3+j)}{Y_R0}:{get_column_letter(3+j)}{Y_RN})",
          CUR0, align="right", bold=True, color=CORAL_D, size=9)
    cellv(yr, inr, 3+j, f'=SUMIFS({INC},{ymun(INC, j+1)})', CUR0, align="right",
          bold=True, color=SAGE_D, size=9)
    cl = get_column_letter(3+j)
    cellv(yr, ntr, 3+j, f"={cl}{inr}-{cl}{sp}", CUR0, align="right", bold=True, size=9)
for rr, colr in ((sp, CORAL_D), (inr, SAGE_D), (ntr, INK)):
    cellv(yr, rr, 15, f"=SUM(C{rr}:N{rr})", CUR0, align="right", bold=True, color=colr, size=9)
    yr.cell(row=rr, column=2).border = Border(top=Side(style="medium", color=SAGE))
yr.conditional_formatting.add(f"C{Y_R0}:N{Y_RN}",
    ColorScaleRule(start_type="num", start_value=0, start_color=WHITE,
                   end_type="max", end_color="C4D6BD"))
yr.conditional_formatting.add(f"C{ntr}:N{ntr}",
    CellIsRule(operator="lessThan", formula=["0"],
               font=Font(name=F, size=9, bold=True, color=DANGER), fill=fl(DANGER_L)))

# yearly bar chart — income vs spending per month
bch = BarChart(); bch.type = "col"; bch.grouping = "clustered"
bch.title = "Income vs spending by month"
ydata = Reference(yr, min_col=2, max_col=14, min_row=inr, max_row=inr)
ydata2 = Reference(yr, min_col=2, max_col=14, min_row=sp, max_row=sp)
bch.add_data(ydata, from_rows=True, titles_from_data=True)
bch.add_data(ydata2, from_rows=True, titles_from_data=True)
bch.set_categories(Reference(yr, min_col=3, max_col=14, min_row=8))
for s, col in zip(bch.series, (CH_GREEN, CH_CORAL)):
    s.graphicalProperties.solidFill = col
    s.graphicalProperties.line.solidFill = WHITE
bch.gapWidth = 80
bch.legend.position = 'b'
bch.y_axis.numFmt = CUR0
bch.width = 25.5; bch.height = 8.5
yr.add_chart(bch, f"B{ntr + 3}")

# =============== finish ===============
order = ["🏠 Dashboard", "💳 Transactions", "📊 Budget", "🌱 Goals", "📅 Year", "⚙️ Settings"]
wb._sheets = [wb[n] for n in order]
wb.active = 0

import os
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "personal_finance_planner.xlsx")
wb.save(OUT)
print("saved:", OUT)
print("sheets:", wb.sheetnames)
