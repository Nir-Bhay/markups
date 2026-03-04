#!/usr/bin/env python3
"""
Business Document Generator Script

This script generates professional business documents (Proposals, Business Plans, Budgets)
by filling in PDF templates with user-provided data.
"""

import json
import sys
import os
from datetime import datetime
from pathlib import Path

try:
    from pypdf import PdfReader, PdfWriter
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.lib.colors import HexColor
    import io
except ImportError:
    print("ERROR: Required packages not installed.")
    print("Please run: pip install pypdf reportlab")
    sys.exit(1)


class DocumentGenerator:
    """Generate business documents from templates and JSON data"""

    TEMPLATE_MAP = {
        'proposal': 'Professional Proposal Template.pdf',
        'business_plan': 'Comprehensive Business Plan Template.pdf',
        'budget': 'Annual Budget Plan Template.pdf'
    }

    def __init__(self, templates_dir, output_dir=None):
        self.templates_dir = Path(templates_dir)
        self.output_dir = Path(output_dir) if output_dir else Path.cwd()
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate_from_json(self, document_type, data_file, output_filename=None):
        """
        Generate a document from a template and JSON data file

        Args:
            document_type: 'proposal', 'business_plan', or 'budget'
            data_file: Path to JSON file containing document data
            output_filename: Optional custom output filename

        Returns:
            Path to generated PDF file
        """
        # Load data
        with open(data_file, 'r') as f:
            data = json.load(f)

        return self.generate(document_type, data, output_filename)

    def generate(self, document_type, data, output_filename=None):
        """
        Generate a document from a template and data dictionary

        Args:
            document_type: 'proposal', 'business_plan', or 'budget'
            data: Dictionary containing document data
            output_filename: Optional custom output filename

        Returns:
            Path to generated PDF file
        """
        if document_type not in self.TEMPLATE_MAP:
            raise ValueError(f"Invalid document type: {document_type}. "
                           f"Must be one of: {list(self.TEMPLATE_MAP.keys())}")

        template_name = self.TEMPLATE_MAP[document_type]
        template_path = self.templates_dir / template_name

        if not template_path.exists():
            raise FileNotFoundError(f"Template not found: {template_path}")

        # Generate output filename
        if not output_filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_filename = f"{document_type}_{timestamp}.pdf"

        output_path = self.output_dir / output_filename

        # Generate the document based on type
        if document_type == 'proposal':
            self._generate_proposal(template_path, data, output_path)
        elif document_type == 'business_plan':
            self._generate_business_plan(template_path, data, output_path)
        elif document_type == 'budget':
            self._generate_budget(template_path, data, output_path)

        return output_path

    def _generate_proposal(self, template_path, data, output_path):
        """Generate a project proposal document"""
        # Read template
        reader = PdfReader(template_path)
        writer = PdfWriter()

        # Create overlay with user data
        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=letter)

        # Page 1 - Cover page
        can.setFont("Helvetica-Bold", 16)
        can.setFillColor(HexColor("#1e3a5f"))

        # Title
        title = data.get('title', 'Project Proposal Title Here')
        can.drawCentredString(306, 650, title)

        # Subtitle
        can.setFont("Helvetica", 14)
        subtitle = data.get('subtitle', 'A Comprehensive Plan')
        can.drawCentredString(306, 625, subtitle)

        # Prepared For
        can.setFont("Helvetica-Bold", 12)
        can.drawCentredString(306, 520, "Prepared For:")
        can.setFont("Helvetica", 11)
        can.drawCentredString(306, 500, data.get('client_org', 'Client/Organization Name'))
        can.drawCentredString(306, 485, data.get('client_contact', "Contact Person's Name"))

        # Prepared By
        can.setFont("Helvetica-Bold", 12)
        can.drawCentredString(306, 440, "Prepared By:")
        can.setFont("Helvetica", 11)
        can.drawCentredString(306, 420, data.get('company_name', 'Your Company/Name'))
        can.drawCentredString(306, 405, data.get('contact_info', 'Contact Email or Phone'))

        # Date
        can.setFont("Helvetica", 12)
        date_str = data.get('date', datetime.now().strftime("%B %d, %Y"))
        can.drawCentredString(306, 340, date_str)

        can.showPage()
        can.save()

        # Merge with template
        packet.seek(0)
        overlay = PdfReader(packet)

        for i, page in enumerate(reader.pages):
            if i < len(overlay.pages):
                page.merge_page(overlay.pages[i])
            writer.add_page(page)

        # Write output
        with open(output_path, 'wb') as output_file:
            writer.write(output_file)

    def _generate_business_plan(self, template_path, data, output_path):
        """Generate a business plan document"""
        # Similar approach - overlay data on template
        reader = PdfReader(template_path)
        writer = PdfWriter()

        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=letter)

        # Page 1 - Cover page
        can.setFont("Helvetica-Bold", 18)
        can.setFillColor(HexColor("#000000"))

        company_name = data.get('company_name', 'Your Company Name')
        can.drawCentredString(306, 650, company_name)

        can.setFont("Helvetica", 12)
        date_str = data.get('date', datetime.now().strftime("%B %d, %Y"))
        can.drawCentredString(306, 600, date_str)

        can.showPage()
        can.save()

        packet.seek(0)
        overlay = PdfReader(packet)

        for i, page in enumerate(reader.pages):
            if i < len(overlay.pages):
                page.merge_page(overlay.pages[i])
            writer.add_page(page)

        with open(output_path, 'wb') as output_file:
            writer.write(output_file)

    def _generate_budget(self, template_path, data, output_path):
        """Generate a budget plan document"""
        reader = PdfReader(template_path)
        writer = PdfWriter()

        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=letter)

        # Page 1 - Cover page
        # Draw white rectangles to cover template text
        can.setFillColor(HexColor("#FFFFFF"))
        can.rect(200, 655, 220, 30, fill=1, stroke=0)  # Cover "Fiscal Year [YYYY]"
        can.rect(200, 625, 220, 25, fill=1, stroke=0)  # Cover "Your Company Name"
        can.rect(200, 595, 220, 25, fill=1, stroke=0)  # Cover date

        # Add new text
        can.setFillColor(HexColor("#000000"))
        can.setFont("Helvetica-Bold", 16)

        fiscal_year = data.get('fiscal_year', 'YYYY')
        can.drawCentredString(306, 665, f"Fiscal Year {fiscal_year}")

        can.setFont("Helvetica", 12)
        company_name = data.get('company_name', 'Your Company Name')
        can.drawCentredString(306, 635, company_name)

        date_str = data.get('date', datetime.now().strftime("%B %d, %Y"))
        can.drawCentredString(306, 610, date_str)

        can.showPage()
        can.save()

        packet.seek(0)
        overlay = PdfReader(packet)

        for i, page in enumerate(reader.pages):
            if i < len(overlay.pages):
                page.merge_page(overlay.pages[i])
            writer.add_page(page)

        with open(output_path, 'wb') as output_file:
            writer.write(output_file)


def main():
    """Command-line interface for document generation"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Generate professional business documents from templates'
    )
    parser.add_argument(
        'document_type',
        choices=['proposal', 'business_plan', 'budget'],
        help='Type of document to generate'
    )
    parser.add_argument(
        'data_file',
        help='JSON file containing document data'
    )
    parser.add_argument(
        '--templates-dir',
        default='templates',
        help='Directory containing PDF templates (default: templates)'
    )
    parser.add_argument(
        '--output-dir',
        default='output',
        help='Directory for generated PDFs (default: output)'
    )
    parser.add_argument(
        '--output-filename',
        help='Custom output filename (optional)'
    )

    args = parser.parse_args()

    try:
        generator = DocumentGenerator(args.templates_dir, args.output_dir)
        output_path = generator.generate_from_json(
            args.document_type,
            args.data_file,
            args.output_filename
        )
        print(f"✅ Document generated successfully: {output_path}")
    except Exception as e:
        print(f"❌ Error generating document: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
