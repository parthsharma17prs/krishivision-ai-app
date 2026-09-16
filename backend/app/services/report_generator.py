import os
import time
from datetime import datetime, timezone
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.core.config import settings

class PDFReportGenerator:
    """
    Generates professional AgriTech PDF Diagnostic Reports for farmers.
    """

    def generate_diagnostic_report(
        self,
        farm_name: str = "Farm 01 — Indore",
        farmer_name: str = "Demo Farmer",
        location: str = "Indore, Madhya Pradesh",
        crop_name: str = "Tomato",
        disease_name: str = "Tomato Early Blight",
        confidence_pct: float = 91.4,
        severity: str = "Moderate",
        soil_moisture_pct: float = 28.0,
        irrigation_recommendation: str = "Irrigation recommended within 4 hours",
        output_dir: str = "./uploads/reports"
    ) -> str:
        os.makedirs(output_dir, exist_ok=True)
        filename = f"KrishiVision_Report_{int(time.time())}.pdf"
        filepath = os.path.join(output_dir, filename)

        doc = SimpleDocTemplate(
            filepath,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom Styles
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#064e3b")  # Deep Emerald
        )
        
        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#047857")
        )

        heading_style = ParagraphStyle(
            "DocHeading",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=14,
            leading=18,
            textColor=colors.HexColor("#065f46"),
            spaceBefore=12,
            spaceAfter=6
        )

        body_style = ParagraphStyle(
            "DocBody",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#1f2937")
        )

        elements = []

        # Header Title
        elements.append(Paragraph("KrishiVision AI", title_style))
        elements.append(Paragraph("AI-Powered Smart Farming Intelligence | Field Diagnostic Report", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#059669"), spaceBefore=8, spaceAfter=12))

        # Metadata Table
        now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        meta_data = [
            [Paragraph("<b>Farm Name:</b>", body_style), Paragraph(farm_name, body_style), Paragraph("<b>Date:</b>", body_style), Paragraph(now_str, body_style)],
            [Paragraph("<b>Farmer Name:</b>", body_style), Paragraph(farmer_name, body_style), Paragraph("<b>Location:</b>", body_style), Paragraph(location, body_style)],
            [Paragraph("<b>Crop:</b>", body_style), Paragraph(crop_name, body_style), Paragraph("<b>Field Size:</b>", body_style), Paragraph("5.0 Acres", body_style)]
        ]
        t_meta = Table(meta_data, colWidths=[100, 170, 80, 170])
        t_meta.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0fdf4")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#a7f3d0")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#d1fae5")),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t_meta)
        elements.append(Spacer(1, 14))

        # Disease Diagnosis Section
        elements.append(Paragraph("1. Plant Health & Disease Analysis (YOLOv11 + ViT)", heading_style))
        diag_data = [
            [Paragraph("<b>Primary Diagnosis</b>", body_style), Paragraph(f"<b>{disease_name}</b>", body_style)],
            [Paragraph("<b>Confidence Score</b>", body_style), Paragraph(f"{confidence_pct:.1f}%", body_style)],
            [Paragraph("<b>Severity Rating</b>", body_style), Paragraph(severity, body_style)],
            [Paragraph("<b>Model Architecture</b>", body_style), Paragraph("YOLOv11 Leaf ROI + Vision Transformer Patch16 224", body_style)],
            [Paragraph("<b>Explainability Artifacts</b>", body_style), Paragraph("Bounding Box & Grad-CAM Heatmap overlay generated", body_style)]
        ]
        t_diag = Table(diag_data, colWidths=[180, 340])
        t_diag.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,-1), colors.HexColor("#ecfdf5")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#6ee7b7")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#a7f3d0")),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t_diag)
        elements.append(Spacer(1, 14))

        # Irrigation & Soil Telemetry
        elements.append(Paragraph("2. Soil Telemetry & Smart Irrigation Schedule", heading_style))
        irrig_data = [
            [Paragraph("<b>Current Soil Moisture</b>", body_style), Paragraph(f"{soil_moisture_pct:.1f}%", body_style)],
            [Paragraph("<b>Irrigation Status</b>", body_style), Paragraph(irrigation_recommendation, body_style)],
            [Paragraph("<b>Water Efficiency Note</b>", body_style), Paragraph("Targeted drip window saves up to 35% water vs flood irrigation.", body_style)]
        ]
        t_irrig = Table(irrig_data, colWidths=[180, 340])
        t_irrig.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,-1), colors.HexColor("#f0fdf4")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#a7f3d0")),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#d1fae5")),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t_irrig)
        elements.append(Spacer(1, 14))

        # Recommended Advisory Actions
        elements.append(Paragraph("3. Recommended Advisory Actions", heading_style))
        actions = [
            "• Remove lower leaves showing brown concentric spots to reduce spore count.",
            "• Avoid overhead watering; maintain foliage dryness via drip lines.",
            "• Apply bio-fungicide or consult local KVK agricultural officer for approved treatments.",
            "• Execute recommended drip irrigation window to prevent plant water stress."
        ]
        for act in actions:
            elements.append(Paragraph(act, body_style))
            elements.append(Spacer(1, 3))

        elements.append(Spacer(1, 14))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#9ca3af"), spaceBefore=10, spaceAfter=10))

        # Disclaimer
        disclaimer_text = (
            "<b>Disclaimer:</b> KrishiVision AI is an advisory decision-support system. Recommendations are generated "
            "using machine learning and rule-based environmental models. Always confirm critical crop diseases with a qualified "
            "agricultural extension officer before applying chemical control measures."
        )
        disclaimer_style = ParagraphStyle(
            "DocDisclaimer",
            parent=styles["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#6b7280")
        )
        elements.append(Paragraph(disclaimer_text, disclaimer_style))

        doc.build(elements)
        return filename

report_generator = PDFReportGenerator()
