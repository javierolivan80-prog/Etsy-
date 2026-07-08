"""PlanaryShop — Block 4: Etsy listings (title <=140, 13 tags <=20 chars, description, prices)."""
import os, sys

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "output", "listings")

LISTINGS = {
 "listing-1-budget-planner.txt": dict(
   title=("Budget Planner 2026 Excel Google Sheets, Monthly Budget Spreadsheet for "
          "Beginners, Digital Download, Track Income Expenses Savings Debt"),
   tags=["budget planner 2026","budget spreadsheet","excel budget","google sheets budget",
         "monthly budget","finance planner","expense tracker","savings tracker",
         "debt payoff tracker","budget template","personal finance","money management",
         "digital download"],
   price_launch="7.99", price_regular="12.99",
   description="""Know exactly where your money goes in 2026 — without building a spreadsheet yourself.
Type your numbers in the white cells and watch the Dashboard, totals, and savings rate update on their own.

WHAT'S INCLUDED
• 2026 Budget Planner (.xlsx) — works in Microsoft Excel & Google Sheets
• Dashboard with summary cards + 2 automatic charts (monthly bars & yearly category donut)
• Income tab — 5 income sources × 12 months, totals calculated for you
• Expenses tab — 15 ready-made categories × 12 months
• Savings tab — 5 goals with automatic progress %
• Debts tab — 5 debts with automatic remaining balance
• Annual Summary — income, expenses, net savings & savings rate per month
• 1-page Quick-Start Guide (PDF)
• BONUS: full Spanish version of the planner and guide

HOW IT WORKS
1. Purchase and download the files instantly from Etsy (no shipping, nothing physical).
2. Open in Excel, or upload to Google Sheets (File > Import > Upload).
3. Type income and expenses in the white cells — beige cells are formulas and do the math.
4. Check the Dashboard and Annual Summary any time for your savings rate and charts.

FAQ
Q: Does it work with Google Sheets?
A: Yes — upload the .xlsx to Google Drive and open with Sheets. All formulas work.
Q: Do I need Excel knowledge?
A: No. If you can type a number in a cell, you can use this planner.
Q: Is it only for 2026?
A: The months are generic January–December columns, so you can reuse the layout any year.
Q: Can I add my own categories?
A: Yes — every category and income source name is editable text.

DIGITAL PRODUCT — nothing ships. Instant download after purchase.
For personal use only. Not for resale or redistribution.

Thank you for supporting PlanaryShop!"""),

 "listing-2-weekly-planner.txt": dict(
   title=("Weekly Planner Printable and Habit Tracker PDF, Undated Planner Pages for "
          "Busy Adults, US Letter A4, Instant Download, Plan Calmer Weeks"),
   tags=["weekly planner","habit tracker","printable planner","undated planner",
         "planner pdf","weekly schedule","productivity","goal planner","monthly planner",
         "planner pages","instant download","a4 planner","letter planner"],
   price_launch="4.99", price_regular="7.49",
   description="""A calm, minimalist planner that starts whenever you do — no dates, no wasted pages.
Print only what you need, as often as you need it, forever.

WHAT'S INCLUDED (17 pages, in both US Letter 8.5x11" and A4)
• Cover page + "How to use this planner" page
• Yearly Goals page (4 life areas)
• Action Plan page — break each goal into first steps
• 2 Monthly Plan pages — week-by-week focus + monthly Top 3
• 6 Weekly Plan pages — Monday to Sunday, Top 3 priorities, notes
• 2 Habit Tracker pages — 15 habits × 31 days each
• 2 lined notes pages + 1 dotted notes page

HOW IT WORKS
1. Purchase and download both PDFs instantly (no shipping, nothing physical).
2. Pick your paper size — US Letter or A4, both included.
3. Print the pages you want (tip: print weekly pages 6 at a time).
4. Reprint any page, any time — undated means it never expires.

FAQ
Q: Is this a physical planner?
A: No — it is a digital PDF you print at home or at any print shop.
Q: Can I write on it on my iPad?
A: Yes — it works in GoodNotes, Notability, and any PDF annotation app.
Q: Does it have dates?
A: No. Every page is undated on purpose, so you can start any week of any year.
Q: What paper sizes are included?
A: Both US Letter (8.5x11 in) and A4 versions of all 17 pages.

DIGITAL PRODUCT — nothing ships. Instant download after purchase.
For personal use only. Not for resale or redistribution.

Thank you for supporting PlanaryShop!"""),

 "listing-3-business-kit.txt": dict(
   title=("Small Business Starter Kit, Invoice Quote Contract Templates for Freelancers, "
          "Editable Word Excel Forms, Look Professional from Day One"),
   tags=["invoice template","contract template","small business","freelancer forms",
         "service agreement","quote template","client tracker","business templates",
         "cancellation policy","editable invoice","word template","business kit",
         "new business"],
   price_launch="19.99", price_regular="29.99",
   description="""Send polished invoices, quotes, and contracts this week — not after a month of Googling.
Five matching, fill-in-the-blank templates that make a one-person business look established.

WHAT'S INCLUDED (delivered as one ZIP)
• Invoice Template (.docx) — business header, itemized table, subtotal/tax/total, payment terms
• Quote Template (.docx) — validity window, what's included / not included, signature acceptance
• Service Agreement Template (.docx) — 9 plain-English clauses: services, schedule, payment, cancellations, client responsibilities, ownership, liability, termination, governing law
• Cancellation Policy Template (.docx) — 48h / 24h / no-show tiers, deposits, rescheduling, refunds
• Client Tracker (.xlsx) — 30 rows with automatic Balance column and TOTALS row

HOW IT WORKS
1. Purchase and download the ZIP instantly (no shipping, nothing physical).
2. Open the .docx files in Word or Google Docs, the .xlsx in Excel or Google Sheets.
3. Replace every [BRACKETED FIELD] with your business details.
4. Save as PDF and send to your client — done.

FAQ
Q: Can I edit everything?
A: Yes — all wording, colors, and fields are fully editable.
Q: Will these work for my industry?
A: They are written for any service business: cleaning, design, coaching, photography, repairs, and more.
Q: Are the contracts legally binding?
A: They are professional templates, not legal advice — have a local attorney review before relying on them.
Q: Does it work in Google Docs?
A: Yes — upload the .docx files to Google Drive and open with Docs.

DIGITAL PRODUCT — nothing ships. Instant download after purchase.
For personal use only (use with unlimited clients of your own business). Not for resale.

Thank you for supporting PlanaryShop!"""),
}

def write_and_check():
    os.makedirs(OUT, exist_ok=True)
    failed = False
    for fname, d in LISTINGS.items():
        t = d["title"]
        if len(t) > 140:
            print(f"FAIL {fname}: título {len(t)} > 140"); failed = True
        if len(d["tags"]) != 13:
            print(f"FAIL {fname}: {len(d['tags'])} tags (deben ser 13)"); failed = True
        for tag in d["tags"]:
            if len(tag) > 20:
                print(f"FAIL {fname}: tag '{tag}' tiene {len(tag)} > 20"); failed = True
        content = (
            f"=== TITLE ({len(t)}/140 chars) ===\n{t}\n\n"
            f"=== TAGS (13, max 20 chars each) ===\n" +
            "\n".join(f"{i+1:2d}. {tag}  ({len(tag)})" for i, tag in enumerate(d["tags"])) +
            f"\n\n=== PRICE ===\nLaunch price: ${d['price_launch']}   ·   Regular price: ${d['price_regular']}\n"
            f"(Start at launch price for the first 2-3 weeks / first 10 sales, then raise.)\n\n"
            f"=== DESCRIPTION ===\n{d['description']}\n")
        with open(os.path.join(OUT, fname), "w", encoding="utf-8") as f:
            f.write(content)
        print(f"OK  {fname}: título {len(t)}/140 · 13 tags <=20 · precio ${d['price_launch']}/{d['price_regular']}")
    if failed:
        print("\nQA BLOCK 4: FAILED"); sys.exit(1)
    print("\nQA BLOCK 4: PASS")

if __name__ == "__main__":
    write_and_check()
