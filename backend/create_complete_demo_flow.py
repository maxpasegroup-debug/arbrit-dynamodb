#!/usr/bin/env python3
"""
Create complete demo data flow: Sales → Training → Completion → Certificates
This demonstrates the full lifecycle of the CRM system
"""

import boto3
from datetime import datetime, timedelta
from uuid import uuid4
from decimal import Decimal
import os
import random

# Initialize DynamoDB
dynamodb = boto3.resource(
    'dynamodb',
    region_name=os.environ.get('AWS_REGION', 'us-east-1'),
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
)

def create_complete_flow():
    """Create end-to-end demo data showing complete flow"""
    
    print("🚀 Creating Complete Demo Flow: Sales → Training → Certificates\n")
    
    # Tables
    leads_table = dynamodb.Table('arbrit_workdesk_leads')
    work_orders_table = dynamodb.Table('arbrit_workdesk_work_orders')
    certificates_table = dynamodb.Table('arbrit_workdesk_certificate_tracking')
    
    # Sample companies and courses
    companies = [
        {"name": "Al Futtaim Group", "contact": "Ahmed Hassan", "phone": "971501234567", "trainees": 15},
        {"name": "Emirates Steel", "contact": "Mohammed Ali", "phone": "971509876543", "trainees": 20},
        {"name": "Dubai Municipality", "contact": "Sara Ahmed", "phone": "971551234567", "trainees": 12},
        {"name": "ADNOC Distribution", "contact": "Fatima Hassan", "phone": "971567891234", "trainees": 18},
    ]
    
    courses = [
        {"name": "Fire Safety & Prevention", "duration": "2 days", "fee": 1500},
        {"name": "First Aid Training", "duration": "1 day", "fee": 800},
        {"name": "Scaffolding Safety", "duration": "3 days", "fee": 2000},
        {"name": "Confined Space Entry", "duration": "2 days", "fee": 1800},
    ]
    
    flow_data = []
    
    for i, company in enumerate(companies):
        course = courses[i]
        
        # STEP 1: Create Sales Lead
        lead_id = str(uuid4())
        lead_data = {
            'id': lead_id,
            'lead_type': 'company',
            'company_name': company['name'],
            'contact_person': company['contact'],
            'phone': company['phone'],
            'course_name': course['name'],
            'num_trainees': company['trainees'],
            'lead_value': course['fee'] * company['trainees'],
            'status': 'converted',  # Already converted to work order
            'lead_owner': 'Mohammed Akbar',
            'source': 'Referral',
            'urgency': 'high',
            'created_at': (datetime.now() - timedelta(days=30-i*5)).isoformat(),
            'updated_at': (datetime.now() - timedelta(days=25-i*5)).isoformat(),
        }
        leads_table.put_item(Item=lead_data)
        print(f"✅ Created Lead: {company['name']} - {course['name']}")
        
        # STEP 2: Create Training Request (Work Order)
        work_order_id = str(uuid4())
        training_date = datetime.now() - timedelta(days=20-i*4)
        completion_date = training_date + timedelta(days=int(course['duration'].split()[0]))
        
        work_order_data = {
            'id': work_order_id,
            'lead_id': lead_id,  # LINKED to lead
            'client_name': company['name'],
            'course_name': course['name'],
            'num_trainees': company['trainees'],
            'training_date': training_date.strftime('%Y-%m-%d'),
            'completion_date': completion_date.strftime('%Y-%m-%d'),
            'status': 'completed',  # Training completed
            'trainer_assigned': 'John Smith',
            'training_site': 'On-site',
            'training_location': 'Dubai',
            'feedback_rating': Decimal(str(round(random.uniform(4.2, 4.9), 1))),
            'feedback': f"Excellent training session. Very informative and practical.",
            'created_at': training_date.isoformat(),
            'updated_at': completion_date.isoformat(),
        }
        work_orders_table.put_item(Item=work_order_data)
        print(f"✅ Created Work Order: {company['name']} - Completed on {completion_date.strftime('%Y-%m-%d')}")
        
        # STEP 3: Create Certificates for Each Trainee
        cert_count = 0
        for trainee_num in range(1, company['trainees'] + 1):
            cert_id = str(uuid4())
            
            # Generate trainee names
            first_names = ["Ahmed", "Mohammed", "Ali", "Hassan", "Omar", "Sara", "Fatima", "Ayesha", "Noor", "Layla"]
            last_names = ["Al-Mansoori", "Al-Mazrouei", "Al-Kaabi", "Al-Dhaheri", "Al-Shamsi"]
            trainee_name = f"{random.choice(first_names)} {random.choice(last_names)}"
            
            # Determine certificate status
            if trainee_num <= company['trainees'] * 0.7:  # 70% delivered
                status = 'delivered'
                delivery_date = (completion_date + timedelta(days=random.randint(3, 10))).strftime('%Y-%m-%d')
            elif trainee_num <= company['trainees'] * 0.9:  # 20% in-transit
                status = 'in-transit'
                delivery_date = None
            else:  # 10% dispatched
                status = 'dispatched'
                delivery_date = None
            
            cert_data = {
                'id': cert_id,
                'work_order_id': work_order_id,  # LINKED to work order
                'lead_id': lead_id,  # LINKED to original lead
                'student_name': trainee_name,
                'company_name': company['name'],
                'course_name': course['name'],
                'completion_date': completion_date.strftime('%Y-%m-%d'),
                'certificate_type': 'In-House' if i < 2 else 'International',
                'status': status,
                'generated_date': completion_date.strftime('%Y-%m-%d'),
                'dispatch_date': (completion_date + timedelta(days=2)).strftime('%Y-%m-%d') if status != 'initiated' else None,
                'delivery_date': delivery_date,
                'certificate_number': f"ARBT-{datetime.now().year}-{cert_id[:8].upper()}",
                'created_at': completion_date.isoformat(),
                'updated_at': datetime.now().isoformat(),
            }
            certificates_table.put_item(Item=cert_data)
            cert_count += 1
        
        print(f"✅ Created {cert_count} Certificates for {company['name']} trainees")
        
        flow_data.append({
            'company': company['name'],
            'lead_id': lead_id,
            'work_order_id': work_order_id,
            'certificates': cert_count,
            'status': 'Complete Flow'
        })
        print()
    
    # Summary
    print("=" * 70)
    print("✅ COMPLETE DEMO FLOW CREATED SUCCESSFULLY!")
    print("=" * 70)
    print("\n📊 Summary:")
    print(f"  📝 Sales Leads Created: {len(companies)}")
    print(f"  📋 Training Requests (Work Orders): {len(companies)}")
    print(f"  ✅ Completed Trainings: {len(companies)}")
    print(f"  🎓 Certificates Generated: {sum(c['trainees'] for c in companies)}")
    
    print("\n🔗 Data Connections:")
    for flow in flow_data:
        print(f"  • {flow['company']}")
        print(f"    Lead ID: {flow['lead_id'][:8]}...")
        print(f"    Work Order ID: {flow['work_order_id'][:8]}...")
        print(f"    Certificates: {flow['certificates']}")
    
    print("\n✨ Complete lifecycle demonstrated:")
    print("  1️⃣  Sales Lead → 2️⃣  Training Request → 3️⃣  Training Completion → 4️⃣  Certificates")
    print("\n🎯 You can now:")
    print("  - View leads in Sales dashboard")
    print("  - See completed trainings in Academics")
    print("  - Track certificates in Certificate Management")
    print("  - View training history in Arbrit's Journey")
    print("  - Check feedbacks for completed trainings")
    print("\n✅ All data is properly LINKED and CONNECTED!\n")

if __name__ == '__main__':
    try:
        create_complete_flow()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
