"""
Script to create sample duplicate alert test data for demonstration
This will create a pending duplicate alert to trigger the RED ALERT on the Leads tab
"""
import asyncio
from datetime import datetime, timezone
from uuid import uuid4
from dynamodb_client import get_dynamodb_client

async def create_test_duplicate_alert():
    """Create a sample duplicate alert for testing the RED ALERT feature"""
    db = await get_dynamodb_client()
    
    # Sample lead data that looks like a duplicate
    test_alert = {
        "id": str(uuid4()),
        "lead_ids": [str(uuid4()), str(uuid4())],  # IDs of the leads that match
        "new_lead_data": {
            "company_name": "TEST COMPANY - DUPLICATE ALERT",
            "contact_person": "John Doe",
            "contact_mobile": "971501234567",
            "course_name": "Safety Training",
            "lead_value": 25000,
            "urgency": "high"
        },
        "similarity_score": 0.92,  # 92% match - very high similarity
        "status": "pending",  # This triggers the RED ALERT
        "created_at": datetime.now(timezone.utc).isoformat(),
        "detection_reason": "Company name match: 92% similar to existing lead"
    }
    
    print("🔴 Creating TEST duplicate alert...")
    await db.arbrit_workdesk_duplicate_alerts.insert_one(test_alert)
    print("✅ Test duplicate alert created successfully!")
    print(f"   Alert ID: {test_alert['id']}")
    print(f"   Company: {test_alert['new_lead_data']['company_name']}")
    print(f"   Similarity: {test_alert['similarity_score']*100:.0f}%")
    print(f"   Status: {test_alert['status']}")
    print("\n🎯 Result: The 'Leads' tab should now show a RED PULSING BADGE!")
    print("   Go to Sales Head Dashboard to see the RED ALERT in action!")

if __name__ == "__main__":
    asyncio.run(create_test_duplicate_alert())
