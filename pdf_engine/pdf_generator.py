"""PDF Generation Engine for AI Job Search Assistant.

Generates high-precision, ATS-friendly, professional PDF resumes and cover letters
using ReportLab with zero external TeX dependencies.
"""

import os
import re
import sys
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# Root directory of the repository
ROOT_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT_DIR / "exported_pdfs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Two-color scheme matching user's canonical LaTeX document:
# Primary accent: Navy Blue (#1F3864) for name, section headers, and dividing rules
# Body text: Charcoal / Off-black (#222222) for content text
COLOR_PRIMARY = colors.HexColor("#1F3864")
COLOR_SECONDARY = colors.HexColor("#1F3864")
COLOR_TEXT = colors.HexColor("#222222")
COLOR_MUTED = colors.HexColor("#555555")
COLOR_LINE = colors.HexColor("#1F3864")


def get_base_styles():
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "CandidateName",
        fontName="Times-Bold",
        fontSize=18,
        leading=22,
        textColor=COLOR_PRIMARY,
        alignment=1,  # Center
        spaceAfter=4,
    )

    contact_style = ParagraphStyle(
        "ContactInfo",
        fontName="Times-Roman",
        fontSize=9,
        leading=13,
        textColor=COLOR_TEXT,
        alignment=1,
        spaceAfter=6,
    )

    section_heading_style = ParagraphStyle(
        "SectionHeading",
        fontName="Times-Bold",
        fontSize=11,
        leading=14,
        textColor=COLOR_PRIMARY,
        spaceBefore=10,
        spaceAfter=2,
        textTransform="uppercase",
    )

    item_title_style = ParagraphStyle(
        "ItemTitle",
        fontName="Times-Bold",
        fontSize=9.5,
        leading=13,
        textColor=COLOR_TEXT,
    )

    item_meta_style = ParagraphStyle(
        "ItemMeta",
        fontName="Times-Italic",
        fontSize=8.5,
        leading=12,
        textColor=COLOR_MUTED,
        alignment=2,  # Right-aligned
    )

    body_style = ParagraphStyle(
        "BodyDark",
        fontName="Times-Roman",
        fontSize=9.5,
        leading=13.5,
        textColor=COLOR_TEXT,
        spaceAfter=4,
    )

    bullet_style = ParagraphStyle(
        "BulletItem",
        fontName="Times-Roman",
        fontSize=9,
        leading=13,
        textColor=COLOR_TEXT,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=3,
    )

    styles.add(title_style)
    styles.add(contact_style)
    styles.add(section_heading_style)
    styles.add(item_title_style)
    styles.add(item_meta_style)
    styles.add(body_style)
    styles.add(bullet_style)

    return styles


def clean_markdown_formatting(text: str) -> str:
    """Convert common markdown elements to ReportLab-safe XML tags."""
    text = text.replace("&", "&amp;")
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"\*(.+?)\*", r"<i>\1</i>", text)
    # [label](url) -> <u><font color="#1F3864">label</font></u>
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<u><font color="#1F3864">\1</font></u>', text)
    return text


def build_resume_pdf(markdown_content: str, output_path: Path, candidate_name: str = "Vinay Kumar S"):
    styles = get_base_styles()
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=32,
        bottomMargin=32,
    )

    story = []
    lines = markdown_content.splitlines()
    in_bullets = False

    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue

        # Top candidate name
        if line.startswith("# ") and i < 3:
            name = line.replace("# ", "").strip()
            story.append(Paragraph(name, styles["CandidateName"]))
            i += 1
            continue

        # Contact Info
        if i <= 4 and ("|" in line or "@" in line or "LinkedIn" in line):
            cleaned = clean_markdown_formatting(line)
            story.append(Paragraph(cleaned, styles["ContactInfo"]))
            story.append(HRFlowable(width="100%", thickness=0.75, color=COLOR_PRIMARY, spaceBefore=2, spaceAfter=6))
            i += 1
            continue

        # Section Headings: ### Heading
        if line.startswith("### "):
            heading_text = line.replace("### ", "").strip()
            story.append(Spacer(1, 4))
            story.append(Paragraph(heading_text, styles["SectionHeading"]))
            story.append(HRFlowable(width="100%", thickness=0.75, color=COLOR_PRIMARY, spaceBefore=1, spaceAfter=5))
            i += 1
            continue

        # Sub-heading or Item: #### Title or **Company**
        if line.startswith("#### "):
            title_text = clean_markdown_formatting(line.replace("#### ", "").strip())
            # Check next line for location/dates (e.g. *Location* | **2024 - Present**)
            meta_text = ""
            if i + 1 < len(lines) and ("|" in lines[i + 1] or "20" in lines[i + 1]):
                meta_text = clean_markdown_formatting(lines[i + 1].strip())
                i += 1

            t_table = Table(
                [[Paragraph(title_text, styles["ItemTitle"]), Paragraph(meta_text, styles["ItemMeta"])]],
                colWidths=["70%", "30%"],
            )
            t_table.setStyle(
                TableStyle([
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                    ("TOPPADDING", (0, 0), (-1, -1), 2),
                ])
            )
            story.append(t_table)
            i += 1
            continue

        # Bullet points: - ...
        if line.startswith("- ") or line.startswith("* "):
            bullet_text = clean_markdown_formatting(line[2:].strip())
            p = Paragraph(f"&bull; &nbsp;{bullet_text}", styles["BulletItem"])
            story.append(p)
            i += 1
            continue

        # Horizontal rule in markdown: ---
        if line in ("---", "___", "***"):
            story.append(HRFlowable(width="100%", thickness=0.5, color=COLOR_LINE, spaceBefore=4, spaceAfter=4))
            i += 1
            continue

        # Standard Paragraph
        cleaned_para = clean_markdown_formatting(line)
        story.append(Paragraph(cleaned_para, styles["BodyDark"]))
        i += 1

    doc.build(story)
    return output_path


def build_cover_letter_pdf(markdown_content: str, output_path: Path):
    styles = get_base_styles()
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=44,
        rightMargin=44,
        topMargin=38,
        bottomMargin=38,
    )

    story = []
    lines = markdown_content.splitlines()

    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue

        # Document title: # Cover Letter...
        if line.startswith("# "):
            title = line.replace("# ", "").strip()
            # Split candidate vs company
            story.append(Paragraph("Vinay Kumar S", styles["CandidateName"]))
            story.append(
                Paragraph(
                    "Bengaluru, Karnataka, India | +91 96063 58639 | vinaykumarsrinivas1980@gmail.com",
                    styles["ContactInfo"],
                )
            )
            story.append(HRFlowable(width="100%", thickness=1, color=COLOR_PRIMARY, spaceBefore=2, spaceAfter=10))
            i += 1
            continue

        # Skip duplicate headers in markdown if already emitted
        if ("Vinay Kumar S" in line and i < 5) or ("vinaykumarsrinivas1980" in line and i < 6):
            i += 1
            continue

        if line.startswith("---"):
            i += 1
            continue

        # Bullets
        if line.startswith("- ") or line.startswith("* "):
            bullet_text = clean_markdown_formatting(line[2:].strip())
            story.append(Paragraph(f"&bull; &nbsp;{bullet_text}", styles["BulletItem"]))
            i += 1
            continue

        # Normal text
        cleaned_text = clean_markdown_formatting(line)
        story.append(Paragraph(cleaned_text, styles["BodyDark"]))
        story.append(Spacer(1, 3))
        i += 1

    doc.build(story)
    return output_path


try:
    from pdf_engine.tailor_engine import (
        generate_cover_letter_markdown,
        generate_cv_markdown,
    )
except ImportError:
    from tailor_engine import (
        generate_cover_letter_markdown,
        generate_cv_markdown,
    )


def export_company_application(company: str, role: str = "", snippet: str = "", location: str = "Bengaluru, India"):
    """Dynamically generates tailored CV and Cover Letter files and compiles PDFs."""
    # Clean names for filesystem
    clean_company = re.sub(r"[^\w\-_]", "", company.replace(" ", "_")) or "Company"
    clean_role = re.sub(r"[^\w\-_]", "", (role or "Intern").replace(" ", "_").replace("/", "_"))

    resume_pdf_name = f"Resume_VinayKumar_{clean_company}.pdf"
    cover_pdf_name = f"CoverLetter_VinayKumar_{clean_company}.pdf"

    resume_pdf_path = OUTPUT_DIR / resume_pdf_name
    cover_pdf_path = OUTPUT_DIR / cover_pdf_name

    results = {}

    # Check if a hand-crafted tailored file already exists (e.g. Scyverge)
    cv_md_candidates = list((ROOT_DIR / "cv").glob(f"*{clean_company}*.md"))
    cover_md_candidates = list((ROOT_DIR / "cover_letters").glob(f"*{clean_company}*.md"))

    # 1. Tailored Resume Generation
    if cv_md_candidates and clean_company.lower() in cv_md_candidates[0].name.lower():
        cv_content = cv_md_candidates[0].read_text(encoding="utf-8")
    else:
        # Dynamically generate tailored markdown for this exact company & role
        cv_content = generate_cv_markdown(company, role, snippet)
        # Save tailored markdown so user has full source transparency
        saved_cv_md = ROOT_DIR / "cv" / f"main_{clean_company}_{clean_role}.md"
        saved_cv_md.write_text(cv_content, encoding="utf-8")

    build_resume_pdf(cv_content, resume_pdf_path)
    results["resume_pdf"] = str(resume_pdf_path)

    # 2. Tailored Cover Letter Generation
    if cover_md_candidates and clean_company.lower() in cover_md_candidates[0].name.lower():
        cover_content = cover_md_candidates[0].read_text(encoding="utf-8")
    else:
        cover_content = generate_cover_letter_markdown(company, role, snippet, location)
        saved_cover_md = ROOT_DIR / "cover_letters" / f"cover_{clean_company}_{clean_role}.md"
        saved_cover_md.write_text(cover_content, encoding="utf-8")

    build_cover_letter_pdf(cover_content, cover_pdf_path)
    results["cover_pdf"] = str(cover_pdf_path)

    # 3. Record in job_search_tracker.csv if not already present
    tracker_path = ROOT_DIR / "job_search_tracker.csv"
    if tracker_path.exists():
        existing_lines = tracker_path.read_text(encoding="utf-8").splitlines()
        already_tracked = any(clean_company.lower() in line.lower() for line in existing_lines[1:])
        if not already_tracked:
            from datetime import date
            today_str = date.today().isoformat()
            new_row = f'{today_str},{company},Technology,{role},Internship,portal,drafted,,92,Tailored resume and cover letter generated.,cv/main_{clean_company}_{clean_role}.md,cover_letters/cover_{clean_company}_{clean_role}.md,web-ui,open'
            existing_lines.append(new_row)
            tracker_path.write_text("\n".join(existing_lines) + "\n", encoding="utf-8")

    return results


if __name__ == "__main__":
    company_arg = sys.argv[1] if len(sys.argv) > 1 else "Scyverge"
    role_arg = sys.argv[2] if len(sys.argv) > 2 else "AI/ML Intern"
    snippet_arg = sys.argv[3] if len(sys.argv) > 3 else ""
    res = export_company_application(company_arg, role_arg, snippet_arg)
    print("Generated PDFs:", res)
