"""
Create comprehensive demo data for the complete certificate lifecycle
This script creates matching records in both training_library and certificate_tracking
to ensure perfect integration between certificate validity tracking and dispatch tracking
"""
import asyncio
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
import uuid

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from dynamodb_client import db

async def create_comprehensive_demo_data():
    """Create comprehensive demo data for certificate system"""
    
    print("🔄 Creating comprehensive certificate demo data...")
    
    # Clear existing demo data (keep production data safe)
    print("  ⏳ Clearing old demo certificate data...")
    try:
        # Delete test data only (those with specific demo company names)
        demo_companies = [
            "Al Mansouri Construction",
            "Dubai Steel Industries",
            "Emirates Tower Contracting",
            "Abu Dhabi Engineering Ltd",
            "Saudi Technical Services",
            "Gulf Safety Training Center"
        ]
        
        for company in demo_companies:
            await db.training_library.delete_many({"company_name": company})
            await db.certificate_tracking.delete_many({"company_name": company})
        
        print("  ✅ Old demo data cleared")
    except Exception as e:
        print(f"  ⚠️  Error clearing old data: {e}")
    
    # Demo data scenarios - covering the complete certificate lifecycle
    scenarios = [
        {
            "company_name": "Al Mansouri Construction",
            "contact_person": "Ahmed Al Mansouri",
            "contact_mobile": "971501234567",
            "course_name": "Fire Safety Management",
            "training_date": (datetime.now(timezone.utc) - timedelta(days=730)).strftime("%Y-%m-%d"),  # 2 years ago
            "participants_count": 15,
            "certificate_numbers": ["FSM-2023-001", "FSM-2023-002", "FSM-2023-003", "FSM-2023-004", "FSM-2023-005",
                                   "FSM-2023-006", "FSM-2023-007", "FSM-2023-008", "FSM-2023-009", "FSM-2023-010",
                                   "FSM-2023-011", "FSM-2023-012", "FSM-2023-013", "FSM-2023-014", "FSM-2023-015"],
            "dispatch_status": "delivered",
            "courier_service": "Aramex",
            "tracking_number": "ARM-AE-2023-12345",
            "dispatch_date": (datetime.now(timezone.utc) - timedelta(days=725)).strftime("%Y-%m-%d"),
            "expected_delivery_date": (datetime.now(timezone.utc) - timedelta(days=720)).strftime("%Y-%m-%d"),
            "actual_delivery_date": (datetime.now(timezone.utc) - timedelta(days=720)).strftime("%Y-%m-%d"),
            "delivery_note_photo": "https://via.placeholder.com/600x400/4ade80/ffffff?text=Delivery+Proof+FSM",
            "recipient_name": "Ahmed Al Mansouri"
        },
        {
            "company_name": "Dubai Steel Industries",
            "contact_person": "Mohammed Hassan",
            "contact_mobile": "971502345678",
            "course_name": "Industrial Safety Protocols",
            "training_date": (datetime.now(timezone.utc) - timedelta(days=365)).strftime("%Y-%m-%d"),  # 1 year ago
            "participants_count": 25,
            "certificate_numbers": [f"ISP-2024-{str(i).zfill(3)}" for i in range(1, 26)],
            "dispatch_status": "delivered",
            "courier_service": "DHL Express",
            "tracking_number": "DHL-UAE-2024-56789",
            "dispatch_date": (datetime.now(timezone.utc) - timedelta(days=360)).strftime("%Y-%m-%d"),
            "expected_delivery_date": (datetime.now(timezone.utc) - timedelta(days=357)).strftime("%Y-%m-%d"),
            "actual_delivery_date": (datetime.now(timezone.utc) - timedelta(days=357)).strftime("%Y-%m-%d"),
            "delivery_note_photo": "https://via.placeholder.com/600x400/3b82f6/ffffff?text=Delivery+Proof+ISP",
            "recipient_name": "Mohammed Hassan"
        },
        {
            "company_name": "Emirates Tower Contracting",
            "contact_person": "Khalid Rahman",
            "contact_mobile": "971503456789",
            "course_name": "Working at Heights Safety",
            "training_date": (datetime.now(timezone.utc) - timedelta(days=1050)).strftime("%Y-%m-%d"),  # ~3 years ago (expiring soon)
            "participants_count": 12,
            "certificate_numbers": [f"WAH-2022-{str(i).zfill(3)}" for i in range(1, 13)],
            "dispatch_status": "delivered",
            "courier_service": "FedEx",
            "tracking_number": "FDX-UAE-2022-11111",
            "dispatch_date": (datetime.now(timezone.utc) - timedelta(days=1045)).strftime("%Y-%m-%d"),
            "expected_delivery_date": (datetime.now(timezone.utc) - timedelta(days=1042)).strftime("%Y-%m-%d"),
            "actual_delivery_date": (datetime.now(timezone.utc) - timedelta(days=1042)).strftime("%Y-%m-%d"),
            "delivery_note_photo": "https://via.placeholder.com/600x400/f59e0b/ffffff?text=Delivery+Proof+WAH",
            "recipient_name": "Khalid Rahman"
        },
        {
            "company_name": "Abu Dhabi Engineering Ltd",
            "contact_person": "Fatima Al Hashmi",
            "contact_mobile": "971504567890",
            "course_name": "Electrical Safety Standards",
            "training_date": (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%d"),  # 1 month ago (recent)
            "participants_count": 8,
            "certificate_numbers": [f"ESS-2025-{str(i).zfill(3)}" for i in range(1, 9)],
            "dispatch_status": "in_transit",
            "courier_service": "Aramex",
            "tracking_number": "ARM-AE-2025-99999",
            "dispatch_date": (datetime.now(timezone.utc) - timedelta(days=5)).strftime("%Y-%m-%d"),
            "expected_delivery_date": (datetime.now(timezone.utc) + timedelta(days=2)).strftime("%Y-%m-%d"),
            "actual_delivery_date": None,
            "delivery_note_photo": None,
            "recipient_name": None
        },
        {
            "company_name": "Saudi Technical Services",
            "contact_person": "Abdullah Nasser",
            "contact_mobile": "966501234567",
            "course_name": "Confined Space Safety",
            "training_date": (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%d"),  # 1 week ago (very recent)
            "participants_count": 18,
            "certificate_numbers": [f"CSS-2025-{str(i).zfill(3)}" for i in range(1, 19)],
            "dispatch_status": "prepared",
            "courier_service": None,
            "tracking_number": None,
            "dispatch_date": None,
            "expected_delivery_date": None,
            "actual_delivery_date": None,
            "delivery_note_photo": None,
            "recipient_name": None
        },
        {
            "company_name": "Gulf Safety Training Center",
            "contact_person": "Rashid Al Maktoum",
            "contact_mobile": "971505678901",
            "course_name": "Hazardous Materials Handling",
            "training_date": (datetime.now(timezone.utc) - timedelta(days=2)).strftime("%Y-%m-%d"),  # 2 days ago (brand new)
            "participants_count": 20,
            "certificate_numbers": [f"HMH-2025-{str(i).zfill(3)}" for i in range(1, 21)],
            "dispatch_status": "initiated",
            "courier_service": None,
            "tracking_number": None,
            "dispatch_date": None,
            "expected_delivery_date": None,
            "actual_delivery_date": None,
            "delivery_note_photo": None,
            "recipient_name": None
        }
    ]
    
    print(f"  ⏳ Creating {len(scenarios)} comprehensive demo records...")
    
    for i, scenario in enumerate(scenarios, 1):
        try:
            record_id = str(uuid.uuid4())
            
            # 1. Create Training Library Record (for validity tracking)
            training_record = {
                "id": record_id,
                "company_name": scenario["company_name"],
                "contact_person": scenario["contact_person"],
                "contact_mobile": scenario["contact_mobile"],
                "course_name": scenario["course_name"],
                "training_date": scenario["training_date"],
                "training_location": "Dubai Main Branch",
                "training_mode": "Onsite",
                "trainer_name": "Khalid Rahman",
                "participants_count": scenario["participants_count"],
                "certificate_issued": True,  # CRITICAL: Mark as certificate issued
                "certificate_numbers": scenario["certificate_numbers"],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.training_library.insert_one(training_record)
            
            # 2. Create Certificate Tracking Record (for dispatch tracking)
            status_history = [{
                "status": "initiated",
                "timestamp": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
                "updated_by": "System Demo",
                "notes": "Certificate dispatch initiated"
            }]
            
            # Add status history based on current status
            if scenario["dispatch_status"] in ["prepared", "dispatched", "in_transit", "delivered"]:
                status_history.append({
                    "status": "prepared",
                    "timestamp": (datetime.now(timezone.utc) - timedelta(hours=20)).isoformat(),
                    "updated_by": "Academic Team",
                    "notes": "Certificates prepared and ready for dispatch"
                })
            
            if scenario["dispatch_status"] in ["dispatched", "in_transit", "delivered"]:
                status_history.append({
                    "status": "dispatched",
                    "timestamp": scenario["dispatch_date"] + "T09:00:00Z" if scenario["dispatch_date"] else datetime.now(timezone.utc).isoformat(),
                    "updated_by": "Dispatch Team",
                    "notes": f"Dispatched via {scenario['courier_service']}"
                })
            
            if scenario["dispatch_status"] in ["in_transit", "delivered"]:
                status_history.append({
                    "status": "in_transit",
                    "timestamp": scenario["dispatch_date"] + "T12:00:00Z" if scenario["dispatch_date"] else datetime.now(timezone.utc).isoformat(),
                    "updated_by": "System",
                    "notes": "Package in transit"
                })
            
            if scenario["dispatch_status"] == "delivered":
                status_history.append({
                    "status": "delivered",
                    "timestamp": scenario["actual_delivery_date"] + "T15:30:00Z" if scenario["actual_delivery_date"] else datetime.now(timezone.utc).isoformat(),
                    "updated_by": "Courier",
                    "notes": f"Delivered to {scenario['recipient_name']}"
                })
            
            certificate_tracking_record = {
                "id": record_id,  # Same ID to link records
                "company_name": scenario["company_name"],
                "contact_person": scenario["contact_person"],
                "contact_mobile": scenario["contact_mobile"],
                "course_name": scenario["course_name"],
                "training_date": scenario["training_date"],
                "certificate_numbers": scenario["certificate_numbers"],
                "participants_count": scenario["participants_count"],
                "status": scenario["dispatch_status"],
                "status_history": status_history,
                "dispatch_date": scenario["dispatch_date"],
                "expected_delivery_date": scenario["expected_delivery_date"],
                "actual_delivery_date": scenario["actual_delivery_date"],
                "courier_service": scenario["courier_service"],
                "tracking_number": scenario["tracking_number"],
                "delivery_note_photo": scenario["delivery_note_photo"],
                "recipient_name": scenario["recipient_name"],
                "recipient_signature": "Signed" if scenario["dispatch_status"] == "delivered" else None,
                "created_by": "demo-system",
                "created_by_name": "Demo System",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.certificate_tracking.insert_one(certificate_tracking_record)
            
            print(f"    ✅ [{i}/{len(scenarios)}] {scenario['company_name']} - {scenario['course_name']} ({scenario['dispatch_status']})")
            
        except Exception as e:
            print(f"    ❌ [{i}/{len(scenarios)}] Error creating {scenario['company_name']}: {e}")
    
    print("\n✅ Comprehensive demo data creation complete!")
    print("\n📊 Summary:")
    print(f"   • Training Library Records: {len(scenarios)} (with certificate_issued=true)")
    print(f"   • Certificate Tracking Records: {len(scenarios)}")
    print(f"   • Certificate Lifecycle Coverage:")
    print(f"     - Initiated: 1 record")
    print(f"     - Prepared: 1 record")
    print(f"     - In Transit: 1 record")
    print(f"     - Delivered: 3 records")
    print(f"   • Certificate Validity Coverage:")
    print(f"     - Expiring Soon (~3 years old): 1 record")
    print(f"     - Active (< 2 years old): 5 records")
    print("\n🎯 Both systems now have matching, integrated data!")

if __name__ == "__main__":
    asyncio.run(create_comprehensive_demo_data())
