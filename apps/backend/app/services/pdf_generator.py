"""
PDF generation service for PS 26034 Legal Metrology inspection reports.

Produces a clean, printable PDF report using fpdf2 with Unicode font support.
Preserves all extracted evidence values and states without substitution or invented data.
Uses official Noto Sans Devanagari font for Devanagari/Hindi and standard text.
CONTRACTS.md §7: Reports are append-only and guarantee completeness.
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import TYPE_CHECKING

from fpdf import FPDF
from fpdf.fonts import FontFace

if TYPE_CHECKING:
    from app.schemas.inspection import InspectionReportOut

FONT_DIR = Path(__file__).resolve().parent.parent / "assets" / "fonts"
FONT_PATH = FONT_DIR / "NotoSansDevanagari-Regular.ttf"
FONT_FAMILY = "NotoSansDevanagari"


def _resolve_unicode_font() -> Path:
    """
    Resolve and verify existence of required Noto Sans Devanagari font.
    Fails explicitly if font is missing; never falls back to a lossy font.
    """
    if not FONT_PATH.is_file():
        raise FileNotFoundError(
            f"Required Unicode font 'NotoSansDevanagari-Regular.ttf' not found at {FONT_PATH}. "
            "Cannot generate PDF report without official Unicode font."
        )
    return FONT_PATH


class InspectionPDF(FPDF):
    """Custom PDF class with Legal Metrology header and footer using Unicode font."""

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        font_path = _resolve_unicode_font()
        # Register font for regular, bold, and italic styles
        self.add_font(FONT_FAMILY, "", str(font_path))
        self.add_font(FONT_FAMILY, "B", str(font_path))
        self.add_font(FONT_FAMILY, "I", str(font_path))

    def header(self) -> None:
        self.set_font(FONT_FAMILY, "B", 14)
        self.set_text_color(24, 43, 73)  # Dark navy
        self.cell(
            0,
            8,
            "Legal Metrology Packaging Compliance Inspection Report",
            align="C",
            new_x="LMARGIN",
            new_y="NEXT",
        )
        self.set_font(FONT_FAMILY, "I", 9)
        self.set_text_color(100, 100, 100)
        self.cell(
            0,
            5,
            "Government of India - Department of Consumer Affairs | Statutory Compliance Review",
            align="C",
            new_x="LMARGIN",
            new_y="NEXT",
        )
        self.set_draw_color(200, 200, 200)
        self.set_line_width(0.3)
        self.line(10, self.get_y() + 2, 200, self.get_y() + 2)
        self.ln(6)

    def footer(self) -> None:
        self.set_y(-15)
        self.set_font(FONT_FAMILY, "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(
            0,
            10,
            f"Page {self.page_no()}/{{nb}} - Append-Only Compliance Record (PS 26034)",
            align="C",
        )


def build_inspection_pdf(report: InspectionReportOut) -> bytes:
    """
    Render an InspectionReportOut to printable PDF bytes using Unicode font.
    Preserves all extracted values exactly as provided without sanitization or lossy fallback.
    Does not validate completeness; caller must assert completeness first.
    """
    pdf = InspectionPDF(orientation="P", unit="mm", format="A4")
    pdf.set_compression(False)
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()

    # --- Section: Inspection Overview ---
    pdf.set_font(FONT_FAMILY, "B", 11)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 6, "Inspection Overview", new_x="LMARGIN", new_y="NEXT")

    pdf.set_font(FONT_FAMILY, "", 9)
    pdf.set_text_color(50, 50, 50)

    # Format coverage string
    cov = report.coverage or {}
    cov_str = f"Front: {'Yes' if cov.get('front') else 'No'}, "
    cov_str += f"Back: {'Yes' if cov.get('back') else 'No'}, "
    cov_str += f"Close-up: {'Yes' if cov.get('close_up') else 'No'}"

    # Decision display
    dec_obj = report.overall_decision
    dec_val = dec_obj.value if hasattr(dec_obj, "value") else str(dec_obj)
    if dec_val == "PASS":
        dec_display = "PASS (Compliant)"
    elif dec_val == "FAIL":
        dec_display = "FAIL (Non-Compliant)"
    else:
        dec_display = "REVIEW (Requires Human Verification)"

    meta_left = [
        f"Inspection ID: {report.inspection_id}",
        f"Product Category: {report.category or 'Not specified'}",
        f"Rule Version: {report.rule_version}",
    ]
    meta_right = [
        f"Overall Decision: {dec_display}",
        f"Coverage: {cov_str}",
        f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}",
    ]

    y_start = pdf.get_y()
    for item in meta_left:
        pdf.cell(95, 5, item, new_x="LMARGIN", new_y="NEXT")
    y_after_left = pdf.get_y()

    pdf.set_xy(105, y_start)
    for item in meta_right:
        pdf.cell(95, 5, item, new_x="LMARGIN", new_y="NEXT")
        pdf.set_x(105)

    pdf.set_y(max(y_after_left, pdf.get_y()) + 4)

    # --- Section: Field Findings Table ---
    pdf.set_font(FONT_FAMILY, "B", 11)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 6, "Declared Label Findings & Evidence", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(1)

    # Col widths: Field(28), Rule ID(25), Extracted Value(45), State(24), Decision(20), Reason(48)
    # Total width = 190 mm
    col_widths = (28, 25, 45, 24, 20, 48)
    head_style = FontFace(emphasis="B", fill_color=(240, 244, 248), color=(40, 40, 40))

    pdf.set_font(FONT_FAMILY, "", 8)
    with pdf.table(
        col_widths=col_widths,
        headings_style=head_style,
        line_height=4.5,
        text_align="LEFT",
    ) as table:
        header = table.row()
        for h in ["Field", "Rule ID", "Extracted Value", "Evidence State", "Decision", "Reason"]:
            header.cell(h, align="C")

        for fr in report.field_results:
            f_name = fr.field_name or ""
            r_id = fr.rule_id or ""
            ev = fr.evidence
            val = ev.value if ev and ev.value is not None else "--"
            st = ev.state.value if ev and hasattr(ev.state, "value") else (
                str(ev.state) if ev else "--"
            )
            dec = fr.decision.value if hasattr(fr.decision, "value") else str(fr.decision)
            reason = fr.reason or ""

            # Color-code decision
            if dec == "PASS":
                dec_style = FontFace(emphasis="B", color=(0, 128, 0))
            elif dec == "FAIL":
                dec_style = FontFace(emphasis="B", color=(180, 0, 0))
            elif dec == "REVIEW":
                dec_style = FontFace(emphasis="B", color=(180, 110, 0))
            else:
                dec_style = FontFace(color=(80, 80, 80))

            row = table.row()
            row.cell(f_name)
            row.cell(r_id)
            row.cell(val)
            row.cell(st, align="C")
            row.cell(dec, align="C", style=dec_style)
            row.cell(reason)

    # --- Section: Corrections & Resolutions (if any) ---
    corrections = [fr.correction for fr in report.field_results if fr.correction is not None]
    if corrections:
        pdf.ln(3)
        pdf.set_font(FONT_FAMILY, "B", 11)
        pdf.set_text_color(30, 30, 30)
        pdf.cell(0, 6, "Field Resolutions & Inspector Corrections", new_x="LMARGIN", new_y="NEXT")
        pdf.ln(1)

        corr_head_style = FontFace(emphasis="B", fill_color=(240, 244, 248), color=(40, 40, 40))
        # Total = 35 + 25 + 45 + 40 + 45 = 190 mm
        with pdf.table(
            col_widths=(35, 25, 45, 40, 45),
            headings_style=corr_head_style,
            line_height=4.5,
            text_align="LEFT",
        ) as corr_table:
            c_header = corr_table.row()
            for ch in ["Field", "Action", "Resolved Value", "Reviewer ID", "Timestamp"]:
                c_header.cell(ch, align="C")

            for c in corrections:
                c_val = c.corrected_value or c.ai_value or "--"
                if hasattr(c.timestamp, "strftime"):
                    ts = c.timestamp.strftime("%Y-%m-%d %H:%M")
                else:
                    ts = str(c.timestamp)[:16]
                c_row = corr_table.row()
                c_row.cell(c.field_name or "")
                c_row.cell(c.action or "", align="C")
                c_row.cell(c_val)
                c_row.cell(c.reviewer_id or "")
                c_row.cell(ts, align="C")

    # --- Section: Statutory Notice ---
    pdf.ln(4)
    pdf.set_font(FONT_FAMILY, "I", 8)
    pdf.set_text_color(110, 110, 110)
    notice = (
        "Statutory Notice: This report represents an AI-assisted preliminary assessment "
        "under the Legal Metrology (Packaged Commodities) Rules, 2011. Evidence values "
        "trace back to captured packaging images and dual-engine OCR verification. "
        "Reports are append-only; revisions generate a new report version."
    )
    pdf.multi_cell(0, 4.5, notice)

    return bytes(pdf.output())
