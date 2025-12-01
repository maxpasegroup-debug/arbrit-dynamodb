"""
Script to create sample duplicate alert test data for demonstration
This will create a pending duplicate alert to trigger the RED ALERT on the Leads tab
"""
import boto3
import os
from datetime import datetime, timezone
from uuid import uuid4
import json

def create_test_duplicate_alert():
    """Create a sample duplicate alert for testing the RED ALERT feature"""
    
    # Initialize DynamoDB
    dynamodb = boto3.resource(
        'dynamodb',
        region_name=os.environ.get('AWS_REGION', 'us-east-1'),
        aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
    )
    
    TABLE_PREFIX = os.environ.get('DYNAMODB_TABLE_PREFIX', 'arbrit_workdesk')
    duplicate_alerts_table = dynamodb.Table(f'{TABLE_PREFIX}_duplicate_alerts')
    
    # Sample lead data that looks like a duplicate
    test_alert = {
        "id": str(uuid4()),
        "lead_ids": json.dumps([str(uuid4()), str(uuid4())]),  # IDs of the leads that match
        "new_lead_data": json.dumps({
            "company_name": "TEST COMPANY - DUPLICATE ALERT",
            "contact_person": "John Doe",
            "contact_mobile": "971501234567",
            "course_name": "Safety Training",
            "lead_value": 25000,
            "urgency": "high"
        }),
        "similarity_score": "0.92",  # 92% match - very high similarity (DynamoDB needs string for decimals)
        "status": "pending",  # This triggers the RED ALERT
        "created_at": datetime.now(timezone.utc).isoformat(),
        "detection_reason": "Company name match: 92% similar to existing lead"
    }
    
    print("🔴 Creating TEST duplicate alert...")
    duplicate_alerts_table.put_item(Item=test_alert)
    print("✅ Test duplicate alert created successfully!")
    print(f"   Alert ID: {test_alert['id']}")
    print(f"   Similarity: 92%")
    print(f"   Status: {test_alert['status']}")
    print("\n🎯 Result: The 'Leads' tab should now show a RED PULSING BADGE!")
    print("   Go to Sales Head Dashboard to see the RED ALERT in action!")
    print("\n📋 To create more test alerts, run this script again.")
    print("   Each run creates a new pending duplicate alert.")

if __name__ == "__main__":
    create_test_duplicate_alert()
