#!/usr/bin/env python3
"""
Cleanup demo data and create fresh test lead
"""
import asyncio
import os
from pathlib import Path
from datetime import datetime, timezone
from decimal import Decimal
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from dynamodb_client import db


async def cleanup_and_seed():
    """Clean all quotations, invoices, and create 1 fresh test lead"""
    
    print("🧹 Starting cleanup...")
    
    # Clean quotations
    query_result = await db.quotations.find({}, {"_id": 0})
    quotations = await query_result.to_list(10000)
    for quot in quotations:
        await db.quotations.delete_one({"id": quot["id"]})
    print(f"✅ Deleted {len(quotations)} quotations")
    
    # Clean invoice requests
    query_result = await db.invoice_requests.find({}, {"_id": 0})
    invoices = await query_result.to_list(10000)
    for inv in invoices:
        await db.invoice_requests.delete_one({"id": inv["id"]})
    print(f"✅ Deleted {len(invoices)} invoice requests")
    
    # Clean payments
    query_result = await db.payments.find({}, {"_id": 0})
    payments = await query_result.to_list(10000)
    for pay in payments:
        await db.payments.delete_one({"id": pay["id"]})
    print(f"✅ Deleted {len(payments)} payments")
    
    # Delete existing test leads (optional - keeps real leads)
    query_result = await db.leads.find({"company_name": "TEST COMPANY"}, {"_id": 0})
    test_leads = await query_result.to_list(1000)
    for lead in test_leads:
        await db.leads.delete_one({"id": lead["id"]})
    print(f"✅ Deleted {len(test_leads)} test leads")
    
    print("\n🌱 Creating fresh test lead...")
    
    # Create a test lead with new ID format
    test_lead = {
        "id": "ARBRIT-DEC24-DUBAI-001",
        "source": "Self",
        "lead_type": "company",
        "company_name": "TEST COMPANY",
        "client_name": "TEST COMPANY",
        "contact_person": "Jason (TEST)",
        "contact_designation": "CEO",
        "contact_mobile": "+971501234567",
        "contact_email": "jason@testcompany.com",
        "phone": "+97143334444",
        "training_location": "DUBAI",
        "branch": "DUBAI",
        "requirement": "Fire Safety Training",
        "course_name": "Fire Safety Training",
        "num_trainees": 10,
        "lead_value": "5000",
        "lead_score": "hot",
        "urgency": "high",
        "status": "New",
        "quotation_sent": False,
        "quotation_id": None,
        "quotation_status": None,
        "invoice_sent": False,
        "invoice_id": None,
        "invoice_status": None,
        "assigned_to": None,  # Will be assigned to Afshaan (Tele Sales)
        "assigned_to_name": "Afshaan Syeda",
        "assigned_by": None,
        "assigned_by_name": "Mohammad Akbar",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Find Afshaan's employee ID to assign the lead
    afshaan = await db.employees.find_one({"name": "Afshaan Syeda"}, {"_id": 0})
    if afshaan:
        test_lead["assigned_to"] = afshaan["id"]
        print(f"✅ Assigned lead to: {afshaan['name']} ({afshaan['id']})")
    
    # Find Mohammad Akbar (Sales Head) as the creator
    mohammad = await db.users.find_one({"name": "Mohammad Akbar"}, {"_id": 0})
    if mohammad:
        test_lead["assigned_by"] = mohammad["id"]
    
    # Convert floats to Decimals
    test_lead["lead_value"] = Decimal(test_lead["lead_value"])
    
    await db.leads.insert_one(test_lead)
    print(f"✅ Created test lead: {test_lead['id']} - {test_lead['company_name']}")
    
    print("\n📊 Final Status:")
    print(f"   - Leads: {await db.leads.count_documents({})}")
    print(f"   - Quotations: {await db.quotations.count_documents({})}")
    print(f"   - Invoices: {await db.invoice_requests.count_documents({})}")
    print(f"   - Payments: {await db.payments.count_documents({})}")
    
    print("\n✅ Cleanup and seeding complete!")
    print("\n📝 Test Instructions:")
    print("   1. Login as Afshaan Syeda (Tele Sales): 971556358155 / PIN: 8155")
    print("   2. Find lead: TEST COMPANY - ARBRIT-DEC24-DUBAI-001")
    print("   3. Create Quotation Request")
    print("   4. Create Invoice Request")
    print("   5. Login as Mohammad Akbar (Sales Head): 971545844387 / PIN: 4387")
    print("   6. Approve quotation and invoice from lead tracker")
    print("   7. Login as Kiron George (Accounts Head): 971526217577 / PIN: 7577")
    print("   8. Process payment")


if __name__ == "__main__":
    asyncio.run(cleanup_and_seed())
