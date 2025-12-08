"""
Arbrit Quotation PDF Generator
Generates location-specific quotations for Dubai, Abu Dhabi, and Saudi Arabia
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch, mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.pdfgen import canvas
from datetime import datetime
import os

# Location-specific company details
LOCATIONS = {
    "dubai": {
        "company_name": "ARBRIT SAFETY TRAINING AND CONSULTANCY LLC",
        "address": "F-12, 1ST FLOOR - AL NAHDA ST - AL TWAR",
        "city": "DUBAI, UAE",
        "bank_name": "ADCB - ABU DHABI COMMERCIAL BANK",
        "account_no": "10405108020001",
        "branch": "ABUDHABI",
        "swift_code": "ADCBAEAA"
    },
    "abu_dhabi": {
        "company_name": "ARBRIT CONSULTANCY AND SAFETY TRAINING LLC",
        "address": "F-12, 1ST FLOOR - AL NAHDA ST - AL TWAR",
        "city": "ABU DHABI, UAE",
        "bank_name": "ADCB - ABU DHABI COMMERCIAL BANK",
        "account_no": "10405108020001",
        "branch": "ABUDHABI",
        "swift_code": "ADCBAEAA"
    },
    "saudi": {
        "company_name": "ARBRIT SAFETY TRAINING COMPANY",
        "address": "RIYADH",
        "city": "KINGDOM OF SAUDI ARABIA",
        "bank_name": "TO BE PROVIDED",
        "account_no": "TO BE PROVIDED",
        "branch": "TO BE PROVIDED",
        "swift_code": "TO BE PROVIDED"
    }
}


def generate_arbrit_quotation_pdf(quotation_data, output_path, location="dubai", signature_path=None):
    """
    Generate location-specific Arbrit quotation PDF
    
    Args:
        quotation_data: Dictionary containing quotation details
        output_path: Path where PDF will be saved
        location: "dubai", "abu_dhabi", or "saudi"
        signature_path: Path to digital signature image (optional)
    
    Returns:
        Path to generated PDF
    """
    # Get location-specific details
    loc_details = LOCATIONS.get(location.lower(), LOCATIONS["dubai"])
    
    # Create PDF document
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=15*mm,
        bottomMargin=15*mm
    )
    
    # Container for PDF elements
    elements = []
    styles = getSampleStyleSheet()
    
    # Custom styles
    company_style = ParagraphStyle(
        'CompanyName',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.black,
        alignment=TA_RIGHT,
        fontName='Helvetica-Bold'
    )
    
    title_style = ParagraphStyle(
        'QuotationTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e3a8a'),
        spaceAfter=10,
        spaceBefore=10,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.black,
        fontName='Helvetica-Bold',
        spaceAfter=6
    )
    
    normal_style = ParagraphStyle(
        'Normal',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.black,
        fontName='Helvetica'
    )
    
    # Header Section with Logo and Company Info
    header_data = []
    
    # Logo placeholder (if logo exists, add it)
    logo_path = "/app/backend/arbrit_logo.png"
    if os.path.exists(logo_path):
        logo = Image(logo_path, width=50*mm, height=15*mm)
        company_info = Paragraph(
            f"""<b>{loc_details['company_name']}</b><br/>
            {loc_details['address']}<br/>
            {loc_details['city']}""",
            company_style
        )
        header_table = Table([[logo, company_info]], colWidths=[60*mm, 110*mm])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ]))
        elements.append(header_table)
    else:
        # No logo, just company info
        company_info = Paragraph(
            f"""<b>{loc_details['company_name']}</b><br/>
            {loc_details['address']}<br/>
            {loc_details['city']}""",
            company_style
        )
        elements.append(company_info)
    
    elements.append(Spacer(1, 10*mm))
    
    # Title
    elements.append(Paragraph("QUOTATION", title_style))
    elements.append(Spacer(1, 5*mm))
    
    # Customer and Quotation Details (Side by side)
    customer_details = f"""<b>Customer Detail:</b><br/>
    <b>Company Name:</b> {quotation_data.get('client_name', 'N/A')}<br/>
    <b>Contact Person:</b> {quotation_data.get('contact_person', 'N/A')}<br/>
    <b>City:</b> {quotation_data.get('city', 'N/A')}<br/>
    <b>Country:</b> {quotation_data.get('country', 'United Arab Emirates')}"""
    
    quotation_details = f"""<b>Quotation Detail:</b><br/>
    <b>Date:</b> {quotation_data.get('created_at', datetime.now().strftime('%b %d, %Y'))}<br/>
    <b>Quote #:</b> {quotation_data.get('quotation_number', 'QT-XXXXX')}<br/>
    <b>Valid Till:</b> {quotation_data.get('valid_till', 'Dec 31, 2025')}"""
    
    details_table = Table([
        [Paragraph(customer_details, normal_style), Paragraph(quotation_details, normal_style)]
    ], colWidths=[85*mm, 85*mm])
    
    details_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0f0f0')),
        ('PADDING', (0, 0), (-1, -1), 8)
    ]))
    
    elements.append(details_table)
    elements.append(Spacer(1, 5*mm))
    
    # Items Table
    items = quotation_data.get('items', [])
    if not items:
        items = [{
            'description': quotation_data.get('description', 'Training Service'),
            'list_price': quotation_data.get('amount', 0),
            'qty': quotation_data.get('num_trainees', 1),
            'amount': quotation_data.get('amount', 0)
        }]
    
    items_data = [['Item & Description', 'List Price', 'Qty', 'Amount']]
    
    for item in items:
        items_data.append([
            item.get('description', 'Training Service'),
            f"AED {float(item.get('list_price', 0)):.2f}",
            str(item.get('qty', 1)),
            f"AED {float(item.get('amount', 0)):.2f}"
        ])
    
    items_table = Table(items_data, colWidths=[90*mm, 30*mm, 20*mm, 30*mm])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a8a')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')])
    ]))
    
    elements.append(items_table)
    elements.append(Spacer(1, 5*mm))
    
    # Totals Section (REMOVED: Reference No, Sub Total, Paid Amount)
    total_amount = sum([float(item.get('amount', 0)) for item in items])
    
    # LOCATION-BASED VAT CALCULATION
    location = quotation_data.get('location', 'dubai').lower()
    if location == 'saudi':
        vat_rate = 0.15  # 15% VAT for Saudi Arabia
        vat_label = 'VAT (15%):'
    else:
        vat_rate = 0.05  # 5% VAT for UAE (Dubai/Abu Dhabi)
        vat_label = 'VAT (5%):'
    
    vat_amount = total_amount * vat_rate
    grand_total = total_amount + vat_amount
    
    totals_data = [
        [vat_label, f"AED {vat_amount:.2f}"],
        ['', '']  # Empty row for spacing
    ]
    
    totals_table = Table(totals_data, colWidths=[140*mm, 30*mm])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
    ]))
    
    elements.append(totals_table)
    
    # Grand Total Bar
    grand_total_table = Table([[f"Grand Total: AED {grand_total:.2f}"]], colWidths=[170*mm])
    grand_total_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#1e3a8a')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 14),
        ('PADDING', (0, 0), (-1, -1), 10)
    ]))
    
    elements.append(grand_total_table)
    elements.append(Spacer(1, 8*mm))
    
    # Payment Details Section (if provided)
    payment_mode = quotation_data.get('payment_mode', '')
    payment_terms = quotation_data.get('payment_terms', '')
    
    payment_details_text = ""
    if payment_mode or payment_terms:
        payment_details_text = f"""<b>Payment Details:</b><br/>"""
        if payment_mode:
            payment_details_text += f"""<b>Payment Mode:</b> {payment_mode}<br/>"""
        if payment_terms:
            payment_details_text += f"""<b>Payment Terms:</b> {payment_terms}<br/><br/>"""
    else:
        payment_details_text = """<b>Payment Terms:</b><br/>
    Payment to be confirmed prior to training date or on training day<br/><br/>"""
    
    # Terms & Conditions (REMOVED: Emirates ID, LPO Signed text)
    terms_text = f"""<b>Terms & Conditions</b><br/><br/>
    <b>PREREQUISITE:</b><br/>
    • FILLED REGISTRATION FORM<br/><br/>
    
    {payment_details_text}
    
    <b>Bank Details:</b><br/>
    {loc_details['company_name']}<br/>
    <b>BANK NAME:</b> {loc_details['bank_name']}<br/>
    <b>ACCOUNT NO:</b> {loc_details['account_no']}<br/>
    <b>BRANCH:</b> {loc_details['branch']}<br/>
    <b>SWIFT CODE:</b> {loc_details['swift_code']}<br/><br/>"""
    
    elements.append(Paragraph(terms_text, normal_style))
    elements.append(Spacer(1, 5*mm))
    
    # Authorized Signature Section
    auth_text = f"""<b>For {loc_details['company_name']}</b><br/><br/>"""
    elements.append(Paragraph(auth_text, normal_style))
    
    # Digital Signature (if provided)
    if signature_path and os.path.exists(signature_path):
        sig_image = Image(signature_path, width=40*mm, height=15*mm)
        elements.append(sig_image)
    else:
        elements.append(Spacer(1, 10*mm))
    
    # Submitted by details
    submitted_by = quotation_data.get('submitted_by_name', 'Sales Executive')
    submitted_phone = quotation_data.get('submitted_by_phone', '+971 XX XXX XXXX')
    submitted_email = quotation_data.get('submitted_by_email', 'sales@arbritsafety.com')
    
    contact_text = f"""<br/>{submitted_by}<br/>
    <b>Phone:</b> {submitted_phone}<br/>
    <b>Email:</b> {submitted_email}"""
    
    elements.append(Paragraph(contact_text, normal_style))
    elements.append(Spacer(1, 5*mm))
    
    # Footer disclaimer
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        alignment=TA_CENTER,
        fontName='Helvetica'
    )
    
    elements.append(Paragraph("Note: This is system generated document. Signature is not required.", disclaimer_style))
    
    # Build PDF
    doc.build(elements)
    
    return output_path
