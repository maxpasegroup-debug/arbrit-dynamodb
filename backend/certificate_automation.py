"""
Certificate Lifecycle Automation System
Handles automatic expiry tracking, renewal reminders, and lead generation
"""
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


def calculate_certificate_expiry(issue_date: str, validity_months: int = 12) -> Dict:
    """
    Calculate certificate expiry details
    
    Args:
        issue_date: ISO format date string
        validity_months: Certificate validity period in months (default 12)
    
    Returns:
        Dict with expiry_date, days_until_expiry, and status
    """
    try:
        if isinstance(issue_date, str):
            issue_dt = datetime.fromisoformat(issue_date.replace('Z', '+00:00'))
        else:
            issue_dt = issue_date
        
        # Calculate expiry date
        expiry_dt = issue_dt + timedelta(days=validity_months * 30)
        
        # Calculate days until expiry
        now = datetime.now(timezone.utc)
        days_until_expiry = (expiry_dt - now).days
        
        # Determine status
        if days_until_expiry < 0:
            status = "Expired"
            status_color = "red"
        elif days_until_expiry <= 15:
            status = "Critical - Expiring Soon"
            status_color = "orange"
        elif days_until_expiry <= 30:
            status = "Expiring Soon"
            status_color = "yellow"
        elif days_until_expiry <= 60:
            status = "Renewal Due Soon"
            status_color = "blue"
        else:
            status = "Active"
            status_color = "green"
        
        return {
            "expiry_date": expiry_dt.isoformat(),
            "days_until_expiry": days_until_expiry,
            "status": status,
            "status_color": status_color,
            "needs_renewal": days_until_expiry <= 60,
            "is_expired": days_until_expiry < 0
        }
    
    except Exception as e:
        logger.error(f"Error calculating certificate expiry: {e}")
        return {
            "expiry_date": None,
            "days_until_expiry": None,
            "status": "Unknown",
            "status_color": "gray",
            "needs_renewal": False,
            "is_expired": False
        }


def get_renewal_urgency(days_until_expiry: int) -> str:
    """Get renewal urgency level"""
    if days_until_expiry < 0:
        return "Overdue"
    elif days_until_expiry <= 7:
        return "Critical"
    elif days_until_expiry <= 15:
        return "Urgent"
    elif days_until_expiry <= 30:
        return "High"
    elif days_until_expiry <= 60:
        return "Medium"
    else:
        return "Low"


def should_send_reminder(days_until_expiry: int, last_reminder_sent: Optional[str]) -> bool:
    """
    Determine if a renewal reminder should be sent
    
    Reminder Schedule:
    - 90 days before: First reminder
    - 60 days before: Second reminder + create renewal lead
    - 30 days before: Third reminder
    - 15 days before: Urgent reminder
    - 7 days before: Critical reminder
    - Expiry date: Final reminder
    - 7 days after expiry: Overdue reminder
    """
    reminder_milestones = [90, 60, 30, 15, 7, 0, -7]
    
    # If never sent a reminder, check if we've hit any milestone
    if not last_reminder_sent:
        return days_until_expiry in reminder_milestones or days_until_expiry < 0
    
    # Check if enough time has passed since last reminder (at least 7 days)
    try:
        last_sent_dt = datetime.fromisoformat(last_reminder_sent.replace('Z', '+00:00'))
        days_since_last = (datetime.now(timezone.utc) - last_sent_dt).days
        
        # Send reminder if we've hit a milestone and it's been at least 7 days
        if days_since_last >= 7 and days_until_expiry in reminder_milestones:
            return True
    except:
        pass
    
    return False


def generate_renewal_lead_data(certificate: Dict, sales_exec_id: str, sales_exec_name: str) -> Dict:
    """
    Generate renewal lead data from certificate information
    
    Args:
        certificate: Certificate dictionary
        sales_exec_id: ID of sales executive to assign
        sales_exec_name: Name of sales executive
    
    Returns:
        Lead data dictionary ready for insertion
    """
    from uuid import uuid4
    
    expiry_info = calculate_certificate_expiry(
        certificate.get('issue_date'),
        certificate.get('validity_months', 12)
    )
    
    lead_data = {
        "id": str(uuid4()),
        "source": "Certificate Renewal (Auto)",
        "company_name": certificate.get('company_name', ''),
        "client_name": certificate.get('trainee_name', ''),
        "contact_person": certificate.get('trainee_name', ''),
        "contact_mobile": certificate.get('contact_mobile', ''),
        "email": certificate.get('email', ''),
        "training_location": certificate.get('training_location', 'Dubai'),
        "course_name": f"{certificate.get('course_name', '')} [RENEWAL]",
        "training_service_details": f"Certificate renewal for {certificate.get('trainee_name')}. Original certificate expires on {expiry_info['expiry_date'][:10]}",
        "num_trainees": 1,
        "lead_value": certificate.get('original_price', 0) * 0.9,  # 10% renewal discount
        "status": "Renewal - Pending Contact",
        "lead_score": "hot",
        "priority": "High" if expiry_info['days_until_expiry'] < 30 else "Medium",
        "assigned_to": sales_exec_id,
        "assigned_to_name": sales_exec_name,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": "System (Auto-Renewal)",
        "renewal_metadata": {
            "original_certificate_id": certificate.get('id'),
            "expiry_date": expiry_info['expiry_date'],
            "days_until_expiry": expiry_info['days_until_expiry'],
            "auto_generated": True,
            "discount_applied": 10  # 10% discount
        },
        "notes": f"🔄 AUTO-GENERATED RENEWAL OPPORTUNITY\n\nCertificate expires in {expiry_info['days_until_expiry']} days.\nOriginal course: {certificate.get('course_name')}\nIssue date: {certificate.get('issue_date')[:10]}\n\n✨ 10% renewal discount pre-applied!"
    }
    
    return lead_data


def get_certificate_dashboard_stats(certificates: List[Dict]) -> Dict:
    """
    Calculate dashboard statistics for certificates
    
    Args:
        certificates: List of certificate dictionaries
    
    Returns:
        Statistics dictionary for dashboard display
    """
    now = datetime.now(timezone.utc)
    
    stats = {
        "total_certificates": len(certificates),
        "active": 0,
        "expiring_this_week": 0,
        "expiring_this_month": 0,
        "expired": 0,
        "renewal_leads_needed": 0,
        "total_renewal_value": 0,
        "by_status": {
            "Active": 0,
            "Renewal Due Soon": 0,
            "Expiring Soon": 0,
            "Critical - Expiring Soon": 0,
            "Expired": 0
        },
        "expiring_soon_list": []
    }
    
    for cert in certificates:
        expiry_info = calculate_certificate_expiry(
            cert.get('issue_date'),
            cert.get('validity_months', 12)
        )
        
        days_until = expiry_info['days_until_expiry']
        status = expiry_info['status']
        
        # Count by status
        stats['by_status'][status] = stats['by_status'].get(status, 0) + 1
        
        # Active certificates
        if days_until > 60:
            stats['active'] += 1
        
        # Expiring this week
        if 0 <= days_until <= 7:
            stats['expiring_this_week'] += 1
            stats['expiring_soon_list'].append({
                "trainee_name": cert.get('trainee_name'),
                "course_name": cert.get('course_name'),
                "days_until_expiry": days_until,
                "company_name": cert.get('company_name')
            })
        
        # Expiring this month
        if 0 <= days_until <= 30:
            stats['expiring_this_month'] += 1
        
        # Expired
        if days_until < 0:
            stats['expired'] += 1
        
        # Renewal leads needed (60 days window)
        if 0 <= days_until <= 60 and not cert.get('renewal_lead_created'):
            stats['renewal_leads_needed'] += 1
            stats['total_renewal_value'] += cert.get('original_price', 0) * 0.9
    
    # Sort expiring soon list by urgency
    stats['expiring_soon_list'] = sorted(
        stats['expiring_soon_list'],
        key=lambda x: x['days_until_expiry']
    )[:10]  # Top 10 most urgent
    
    return stats


def format_renewal_email(certificate: Dict, expiry_info: Dict) -> Dict:
    """
    Format renewal reminder email content
    
    Args:
        certificate: Certificate dictionary
        expiry_info: Expiry calculation results
    
    Returns:
        Email data dictionary with subject and body
    """
    days_until = expiry_info['days_until_expiry']
    urgency = get_renewal_urgency(days_until)
    
    if days_until < 0:
        subject = f"🔴 EXPIRED: {certificate.get('course_name')} Certification"
        urgency_message = "Your certification has EXPIRED."
    elif days_until <= 7:
        subject = f"🔴 URGENT: Certification Expires in {days_until} Days"
        urgency_message = f"Your certification expires in just {days_until} days!"
    elif days_until <= 15:
        subject = f"⚠️ REMINDER: Certification Expires in {days_until} Days"
        urgency_message = f"Your certification expires in {days_until} days."
    elif days_until <= 30:
        subject = f"📅 Certification Renewal: {days_until} Days Remaining"
        urgency_message = f"Your certification expires in {days_until} days."
    else:
        subject = f"📋 Certification Renewal Reminder: {certificate.get('course_name')}"
        urgency_message = f"Your certification expires in {days_until} days."
    
    body = f"""
Dear {certificate.get('trainee_name', 'Valued Client')},

{urgency_message}

CERTIFICATION DETAILS:
- Course: {certificate.get('course_name')}
- Issue Date: {certificate.get('issue_date')[:10]}
- Expiry Date: {expiry_info['expiry_date'][:10]}
- Certificate ID: {certificate.get('certificate_number', 'N/A')}

WHY RENEW?
✅ Maintain compliance and certification status
✅ Stay updated with latest safety standards
✅ Avoid gaps in certification coverage
✅ Special 10% renewal discount available!

NEXT STEPS:
Contact your training coordinator to schedule your renewal session.

Best regards,
Arbrit Safety Training Team
"""
    
    return {
        "subject": subject,
        "body": body,
        "urgency": urgency,
        "recipient_name": certificate.get('trainee_name'),
        "recipient_email": certificate.get('email')
    }


# Batch operations for daily automation
async def process_daily_certificate_checks(db, logger):
    """
    Daily batch job to process all certificates
    - Update expiry statuses
    - Send reminders
    - Create renewal leads
    """
    try:
        # Get all certificates
        certificates = await db.certificates.find({}, {"_id": 0}).to_list(10000)
        
        stats = {
            "processed": 0,
            "reminders_sent": 0,
            "leads_created": 0,
            "errors": 0
        }
        
        for cert in certificates:
            try:
                # Calculate expiry info
                expiry_info = calculate_certificate_expiry(
                    cert.get('issue_date'),
                    cert.get('validity_months', 12)
                )
                
                # Update certificate with latest expiry info
                update_data = {
                    "expiry_date": expiry_info['expiry_date'],
                    "days_until_expiry": expiry_info['days_until_expiry'],
                    "status": expiry_info['status'],
                    "status_color": expiry_info['status_color'],
                    "last_checked": datetime.now(timezone.utc).isoformat()
                }
                
                await db.certificates.update_one(
                    {"id": cert['id']},
                    {"$set": update_data}
                )
                
                # Check if reminder needed
                if should_send_reminder(
                    expiry_info['days_until_expiry'],
                    cert.get('last_reminder_sent')
                ):
                    # Send reminder (implement email/SMS logic here)
                    await db.certificates.update_one(
                        {"id": cert['id']},
                        {"$set": {"last_reminder_sent": datetime.now(timezone.utc).isoformat()}}
                    )
                    stats['reminders_sent'] += 1
                    logger.info(f"Reminder sent for certificate {cert['id']}")
                
                # Check if renewal lead needed (60 days before expiry)
                if (expiry_info['days_until_expiry'] <= 60 and 
                    expiry_info['days_until_expiry'] > 0 and 
                    not cert.get('renewal_lead_created')):
                    
                    # Create renewal lead
                    lead_data = generate_renewal_lead_data(
                        cert,
                        cert.get('original_sales_exec_id', 'system'),
                        cert.get('original_sales_exec_name', 'Sales Team')
                    )
                    
                    await db.leads.insert_one(lead_data)
                    await db.certificates.update_one(
                        {"id": cert['id']},
                        {"$set": {
                            "renewal_lead_created": True,
                            "renewal_lead_id": lead_data['id'],
                            "renewal_lead_created_at": datetime.now(timezone.utc).isoformat()
                        }}
                    )
                    stats['leads_created'] += 1
                    logger.info(f"Renewal lead created for certificate {cert['id']}")
                
                stats['processed'] += 1
                
            except Exception as cert_error:
                logger.error(f"Error processing certificate {cert.get('id')}: {cert_error}")
                stats['errors'] += 1
        
        logger.info(f"Daily certificate check complete: {stats}")
        return stats
    
    except Exception as e:
        logger.error(f"Error in daily certificate check: {e}")
        return {"error": str(e)}
