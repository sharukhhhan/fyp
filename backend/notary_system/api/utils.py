import os
import uuid
import hashlib
import tempfile
from datetime import datetime
from venv import logger

from django.utils import timezone
from django.conf import settings
from io import BytesIO

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.pdfbase import pdfmetrics
    from PyPDF2 import PdfReader, PdfWriter
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


def generate_unique_filename(original_filename):
    """Generate a unique filename based on UUID"""
    ext = os.path.splitext(original_filename)[1]
    return f"{uuid.uuid4().hex}{ext}"


def calculate_file_hash(file_obj):
    """Calculate SHA-256 hash of a file"""
    file_obj.seek(0)
    file_hash = hashlib.sha256()
    
    # Read file in chunks to handle large files
    for chunk in iter(lambda: file_obj.read(4096), b''):
        file_hash.update(chunk)
    
    file_obj.seek(0)
    return file_hash.hexdigest()


def create_digital_signature(user_id, document_id, timestamp=None):
    """Create a digital signature hash"""
    if timestamp is None:
        timestamp = timezone.now().isoformat()
    
    signature_string = f"{user_id}:{document_id}:{timestamp}"
    return hashlib.sha256(signature_string.encode()).hexdigest()


def generate_signed_pdf(original_pdf_content, notary, document, verification_request):
    """Generate a signed version of the PDF with notary signature and details"""
    if not REPORTLAB_AVAILABLE:
        raise ImportError("Required PDF libraries (reportlab, PyPDF2) are not installed")
    
    # Create PDF writers and readers
    reader = PdfReader(BytesIO(original_pdf_content))
    writer = PdfWriter()
    
    # Copy original pages
    for page in reader.pages:
        writer.add_page(page)
    
    # Create signature page in memory
    signature_buffer = BytesIO()
    doc = SimpleDocTemplate(
        signature_buffer,
        pagesize=A4,
        title="Digital Signature"
    )
    
    # Register fonts
    try:
        font_path = os.path.join(settings.BASE_DIR, 'fonts')
        arial_font_path = os.path.join(font_path, 'arial.ttf')
        arial_bold_path = os.path.join(font_path, 'arialbd.ttf')
        
        # Check fonts directory
        if not os.path.exists(font_path):
            os.makedirs(font_path)
        
        # Register fonts if available
        if os.path.exists(arial_font_path):
            pdfmetrics.registerFont(TTFont('Arial', arial_font_path))
        else:
            # Fallback to DejaVuSans if Arial not available
            pdfmetrics.registerFont(TTFont('DejaVuSans', 'DejaVuSans.ttf'))
            arial_font_path = 'DejaVuSans.ttf'
            
        if os.path.exists(arial_bold_path):
            pdfmetrics.registerFont(TTFont('Arial-Bold', arial_bold_path))
    except Exception as e:
        logger.warning(f"Failed to register custom fonts: {str(e)}")
    
    # Create styles with proper font support
    styles = getSampleStyleSheet()
    
    # Set up font names based on availability
    font_name = 'Arial' if 'Arial' in pdfmetrics.getRegisteredFontNames() else 'DejaVuSans'
    bold_font = 'Arial-Bold' if 'Arial-Bold' in pdfmetrics.getRegisteredFontNames() else font_name
    
    # Create custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontName=bold_font,
        fontSize=16,
        spaceAfter=30,
        encoding='utf-8'
    )
    
    content_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontName=font_name,
        fontSize=12,
        leading=16,
        encoding='utf-8'
    )
    
    # Create content for signature page
    story = []
    
    # Add title with proper styling
    story.append(Paragraph("DIGITAL NOTARIZATION CERTIFICATE", title_style))
    story.append(Spacer(1, 20))
    
    # Add notarization information with proper styling
    story.append(Paragraph(f"This document has been notarized by: {notary.full_name}", content_style))
    story.append(Paragraph(f"Notary License: {notary.notary_profile.license_number}", content_style))
    story.append(Paragraph(f"Jurisdiction: {notary.notary_profile.jurisdiction}", content_style))
    story.append(Spacer(1, 10))
    
    timestamp = timezone.now().strftime("%d %B %Y, %H:%M:%S %Z")
    story.append(Paragraph(f"Date and time of notarization: {timestamp}", content_style))
    story.append(Spacer(1, 10))
    
    # Add document information
    story.append(Paragraph(f"Document Title: {document.title}", content_style))
    story.append(Paragraph(f"Document ID: {document.id}", content_style))
    story.append(Paragraph(f"Verification Request ID: {verification_request.id}", content_style))
    story.append(Spacer(1, 10))
    
    # Create and add signature hash
    signature_hash = hashlib.sha256(
        f"{document.id}:{notary.id}:{timezone.now().isoformat()}".encode()
    ).hexdigest()
    story.append(Paragraph(f"Digital Signature Hash: {signature_hash}", content_style))
    story.append(Spacer(1, 10))
    
    # Add legal text
    story.append(Paragraph(
        "This digital signature has been created in accordance with applicable regulations "
        "for electronic notarization. The integrity and authenticity of this document "
        "can be verified using the signature hash above.",
        content_style
    ))
    
    # Build the signature page
    doc.build(story)
    
    # Add signature page to document
    signature_buffer.seek(0)
    signature_page = PdfReader(signature_buffer)
    writer.add_page(signature_page.pages[0])
    
    # Write the final PDF to bytes
    output_buffer = BytesIO()
    writer.write(output_buffer)
    output_buffer.seek(0)
    
    return output_buffer.getvalue()


def generate_document_from_template(template_content, context_data):
    """
    Generate document content by filling a template with context data
    
    Args:
        template_content (str): Template content with placeholders
        context_data (dict): Data to fill the placeholders with
        
    Returns:
        str: Generated document content
    """
    # This is a simple placeholder replacement
    # In a real system, you might want to use a proper template engine
    content = template_content
    
    for key, value in context_data.items():
        placeholder = f"{{{{ {key} }}}}"
        content = content.replace(placeholder, str(value))
    
    return content


def generate_room_url():
    """Generate a unique room URL for video conferences"""
    room_id = f"notary-{uuid.uuid4().hex[:12]}"
    base_url = settings.VIDEO_CONFERENCE_BASE_URL.rstrip('/')
    room_url = f"{base_url}/{room_id}"
    
    return room_id, room_url