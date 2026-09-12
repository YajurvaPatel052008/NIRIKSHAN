"""ReportLab PDF generation for completed NIRIKSHA inspections."""

from __future__ import annotations

import logging
import re
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.supabase_client import supabase

logger = logging.getLogger(__name__)


def _safe_text(value) -> str:
    """Keep report text compatible with ReportLab's built-in fonts."""
    return re.sub(r"[^\x00-\x7F]", "", str(value or "")).strip()


def _fetch_inspection_data(inspection_id: str) -> dict:
    if supabase is None:
        raise RuntimeError("Supabase is not configured")
    inspection_response = (
        supabase.table("inspections")
        .select("*, products(name, category)")
        .eq("id", inspection_id)
        .maybe_single()
        .execute()
    )
    inspection = inspection_response.data
    if not inspection:
        raise LookupError("Inspection was not found")

    def related(table: str):
        return (
            supabase.table(table)
            .select("*")
            .eq("inspection_id", inspection_id)
            .execute()
        ).data or []

    declarations = related("extracted_declarations")
    violations = related("violations")
    images = related("inspection_images")
    inspector = {}
    inspector_id = inspection.get("inspector_id")
    if inspector_id:
        inspector_response = (
            supabase.table("profiles")
            .select("full_name")
            .eq("id", inspector_id)
            .maybe_single()
            .execute()
        )
        inspector = inspector_response.data or {}
    return {
        "inspection": inspection,
        "declarations": declarations,
        "violations": violations,
        "images": images,
        "inspector": inspector,
    }


def _styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="NirikshaTitle",
        parent=styles["Title"],
        textColor=colors.HexColor("#0F3D63"),
        alignment=TA_CENTER,
        spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        name="SectionTitle",
        parent=styles["Heading1"],
        textColor=colors.HexColor("#0F3D63"),
        spaceAfter=12,
    ))
    styles.add(ParagraphStyle(name="Small", parent=styles["BodyText"], fontSize=8, leading=10))
    return styles


def _header(story, styles, title: str):
    story.append(Paragraph("NIRIKSHA", styles["NirikshaTitle"]))
    story.append(Paragraph("Legal Metrology Compliance Report", styles["Normal"]))
    story.append(Spacer(1, 18))
    story.append(Paragraph(title, styles["SectionTitle"]))


def generate_pdf(inspection_id: str) -> bytes:
    """Fetch an inspection and generate its four-section compliance PDF."""
    data = _fetch_inspection_data(inspection_id)
    inspection = data["inspection"]
    product = inspection.get("products") or {}
    styles = _styles()
    story = []

    _header(story, styles, "1. Inspection Summary")
    summary = [
        ["Inspection ID", _safe_text(inspection.get("id", inspection_id))],
        ["Product", _safe_text(product.get("name") or inspection.get("manufacturer"))],
        ["Category", _safe_text(inspection.get("category"))],
        ["Date", _safe_text(inspection.get("created_at"))],
        ["Inspector", _safe_text(data["inspector"].get("full_name"))],
        ["Compliance Status", _safe_text(inspection.get("compliance_status", "Pending"))],
        ["Compliance Score", f"{inspection.get('compliance_score', 'N/A')}/100"],
    ]
    table = Table(summary, colWidths=[1.6 * inch, 4.8 * inch])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#EAF3F8")),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#0F3D63")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#C9D8E2")),
        ("PADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(table)
    story.append(PageBreak())

    _header(story, styles, "2. Declaration Analysis")
    declaration_rows = [["Declaration Type", "Extracted Value", "Status"]]
    violation_types = {str(item.get("declaration_type", "")).casefold() for item in data["violations"]}
    for declaration in data["declarations"]:
        declaration_type = str(declaration.get("declaration_type", ""))
        status_text = "Violation" if declaration_type.casefold() in violation_types else "Compliant"
        declaration_rows.append([
            Paragraph(_safe_text(declaration_type), styles["Small"]),
            Paragraph(_safe_text(declaration.get("normalized_value") or declaration.get("extracted_value")), styles["Small"]),
            status_text,
        ])
    if len(declaration_rows) == 1:
        declaration_rows.append(["No declarations", "", "Pending"])
    declaration_table = Table(declaration_rows, colWidths=[2.2 * inch, 2.8 * inch, 1.4 * inch], repeatRows=1)
    declaration_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F3D63")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#C9D8E2")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("PADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(declaration_table)
    story.append(PageBreak())

    _header(story, styles, "3. Violations and Applicable Rules")
    violation_rows = [["Declaration", "Severity", "Description", "Rule Reference"]]
    for violation in data["violations"]:
        violation_rows.append([
            Paragraph(_safe_text(violation.get("declaration_type")), styles["Small"]),
            _safe_text(violation.get("severity")),
            Paragraph(_safe_text(violation.get("description")), styles["Small"]),
            Paragraph(_safe_text(violation.get("rule_id") or "Applicable rule"), styles["Small"]),
        ])
    if len(violation_rows) == 1:
        violation_rows.append(["None", "", "No violations recorded.", ""])
    violations_table = Table(violation_rows, colWidths=[1.5 * inch, 0.9 * inch, 2.6 * inch, 1.4 * inch], repeatRows=1)
    violations_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F3D63")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#C9D8E2")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("PADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(violations_table)
    story.append(PageBreak())

    _header(story, styles, "4. Evidence")
    evidence_flowables = []
    for violation in data["violations"]:
        path = violation.get("evidence_image_path")
        if not path:
            continue
        try:
            image_bytes = supabase.storage.from_("inspection-images").download(path)
            evidence_flowables.append([
                Image(BytesIO(image_bytes), width=2.7 * inch, height=1.8 * inch),
                Paragraph(_safe_text(violation.get("description")), styles["Small"]),
            ])
        except Exception as exc:
            logger.warning("Unable to include evidence image %s: %s", path, exc)
    if evidence_flowables:
        evidence_table = Table(evidence_flowables, colWidths=[3.0 * inch, 3.4 * inch])
        evidence_table.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#C9D8E2")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("PADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(evidence_table)
    else:
        story.append(Paragraph("No evidence images were attached to this inspection.", styles["Normal"]))

    output = BytesIO()
    document = SimpleDocTemplate(output, pagesize=A4, rightMargin=42, leftMargin=42, topMargin=42, bottomMargin=42)
    document.build(story)
    return output.getvalue()
