"""
Quotation PDF Generator
Generate professional PDF quotations
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from datetime import datetime
import os


def generate_quotation_pdf(quotation_data, output_path):
    """
    Generate a professional quotation PDF
    
    Args:
        quotation_data: Dictionary containing quotation details
        output_path: Path where PDF will be saved
    
    Returns:
        Path to generated PDF
    """
    # Create PDF document
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=0.5*inch,
        leftMargin=0.5*inch,
        topMargin=0.5*inch,
        bottomMargin=0.5*inch
    )
    
    # Container for PDF elements
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=12,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=6
    )
    
    # Company Header
    header_data = [
        [Paragraph('<b>ARBRIT SAFETY</b>', title_style)],
        [Paragraph('Professional Safety Training & Consulting', styles['Normal'])]
    ]
    
    header_table = Table(header_data, colWidths=[7*inch])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Quotation Title
    elements.append(Paragraph('<b>QUOTATION</b>', title_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Quotation Details
    quotation_info = [
        ['Quotation Ref:', quotation_data.get('quotation_ref', 'N/A')],
        ['Date:', datetime.now().strftime('%d %B %Y')],
        ['Valid Until:', quotation_data.get('validity_period', '30 days')],
    ]
    
    info_table = Table(quotation_info, colWidths=[2*inch, 4*inch])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Client Information
    elements.append(Paragraph('<b>To:</b>', heading_style))
    client_info = [
        [f"{quotation_data.get('client_name', 'N/A')}"],
        [f"Contact: {quotation_data.get('contact_person', 'N/A')}"],
    ]
    
    if quotation_data.get('client_email'):
        client_info.append([f"Email: {quotation_data.get('client_email')}"])
    
    client_table = Table(client_info, colWidths=[7*inch])
    client_table.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(client_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Items/Services Table
    elements.append(Paragraph('<b>Quotation Details:</b>', heading_style))
    elements.append(Spacer(1, 0.1*inch))
    
    # Parse items
    items_text = quotation_data.get('items', 'Training Services')
    
    # Create items table
    items_data = [
        ['#', 'Description', 'Quantity', 'Unit Price', 'Amount']
    ]
    
    # Simple parsing - can be enhanced
    items_data.append([
        '1',
        items_text,
        quotation_data.get('num_trainees', '1'),
        f"AED {float(quotation_data.get('total_amount', 0)) / int(quotation_data.get('num_trainees', 1)):.2f}",
        f"AED {float(quotation_data.get('total_amount', 0)):.2f}"
    ])
    
    items_table = Table(items_data, colWidths=[0.5*inch, 3.5*inch, 1*inch, 1.5*inch, 1.5*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ALIGN', (1, 1), (1, -1), 'LEFT'),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Total
    total_data = [
        ['', '', '', 'Subtotal:', f"AED {float(quotation_data.get('total_amount', 0)):.2f}"],
        ['', '', '', 'VAT (5%):', f"AED {float(quotation_data.get('total_amount', 0)) * 0.05:.2f}"],
        ['', '', '', 'Total:', f"AED {float(quotation_data.get('total_amount', 0)) * 1.05:.2f}"],
    ]
    
    total_table = Table(total_data, colWidths=[0.5*inch, 3.5*inch, 1*inch, 1.5*inch, 1.5*inch])
    total_table.setStyle(TableStyle([
        ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (3, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('LINEABOVE', (3, -1), (-1, -1), 2, colors.black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(total_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Terms and Conditions
    elements.append(Paragraph('<b>Terms & Conditions:</b>', heading_style))
    terms = quotation_data.get('terms', '''
    1. Payment terms: 50% advance, 50% upon completion
    2. Training will be conducted at client location or our training center
    3. Certificates will be issued upon successful completion
    4. This quotation is valid for 30 days from the date of issue
    5. All prices are in UAE Dirhams (AED)
    ''')
    
    elements.append(Paragraph(terms, styles['Normal']))
    elements.append(Spacer(1, 0.3*inch))
    
    # Footer
    footer_text = '''
    <b>Thank you for your business!</b><br/>
    For any queries, please contact us:<br/>
    Email: info@arbritsafety.com | Phone: +971 XX XXX XXXX
    '''
    
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph(footer_text, styles['Normal']))
    
    # Build PDF
    doc.build(elements)
    
    return output_path


def get_quotation_pdf_path(quotation_id):
    """Get the file path for a quotation PDF"""
    pdf_dir = '/tmp/quotation_pdfs'
    os.makedirs(pdf_dir, exist_ok=True)
    return os.path.join(pdf_dir, f'quotation_{quotation_id}.pdf')
