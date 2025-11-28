"""
Create courses table and training_sessions table for the new CRM system
"""
import boto3
import os
from uuid import uuid4
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

def create_tables():
    """Create courses and training_sessions tables"""
    try:
        dynamodb = boto3.client('dynamodb',
            region_name=os.getenv('AWS_REGION'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'))
        
        print("=" * 80)
        print("Creating CRM Tables")
        print("=" * 80)
        
        # Create courses table
        try:
            dynamodb.create_table(
                TableName='arbrit_workdesk_courses',
                KeySchema=[{'AttributeName': 'id', 'KeyType': 'HASH'}],
                AttributeDefinitions=[{'AttributeName': 'id', 'AttributeType': 'S'}],
                BillingMode='PAY_PER_REQUEST'
            )
            print("\n✅ Created: arbrit_workdesk_courses")
        except dynamodb.exceptions.ResourceInUseException:
            print("\n✅ Table arbrit_workdesk_courses already exists")
        
        # Create booking_requests table
        try:
            dynamodb.create_table(
                TableName='arbrit_workdesk_booking_requests',
                KeySchema=[{'AttributeName': 'id', 'KeyType': 'HASH'}],
                AttributeDefinitions=[{'AttributeName': 'id', 'AttributeType': 'S'}],
                BillingMode='PAY_PER_REQUEST'
            )
            print("✅ Created: arbrit_workdesk_booking_requests")
        except dynamodb.exceptions.ResourceInUseException:
            print("✅ Table arbrit_workdesk_booking_requests already exists")
        
        print("\n" + "=" * 80)
        print("Tables Created Successfully!")
        print("=" * 80)
        
        # Add sample courses
        resource = boto3.resource('dynamodb',
            region_name=os.getenv('AWS_REGION'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'))
        
        courses_table = resource.Table('arbrit_workdesk_courses')
        
        sample_courses = [
            {
                "id": str(uuid4()),
                "name": "Fire Safety Training",
                "description": "Comprehensive fire safety and emergency response training",
                "category": "Safety Training",
                "duration": "1 Day",
                "base_fee": "500",
                "pricing_tiers": {
                    "individual": "500",
                    "group_5_10": "450",
                    "group_10_plus": "400",
                    "corporate": "negotiable"
                },
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid4()),
                "name": "First Aid Training",
                "description": "Basic and advanced first aid response training",
                "category": "First Aid",
                "duration": "2 Days",
                "base_fee": "800",
                "pricing_tiers": {
                    "individual": "800",
                    "group_5_10": "720",
                    "group_10_plus": "650",
                    "corporate": "negotiable"
                },
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid4()),
                "name": "HSE Training",
                "description": "Health, Safety & Environment management training",
                "category": "HSE",
                "duration": "3 Days",
                "base_fee": "1200",
                "pricing_tiers": {
                    "individual": "1200",
                    "group_5_10": "1080",
                    "group_10_plus": "1000",
                    "corporate": "negotiable"
                },
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid4()),
                "name": "Scaffolding Safety",
                "description": "Safe scaffolding practices and regulations",
                "category": "Safety Training",
                "duration": "1 Day",
                "base_fee": "600",
                "pricing_tiers": {
                    "individual": "600",
                    "group_5_10": "540",
                    "group_10_plus": "500",
                    "corporate": "negotiable"
                },
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid4()),
                "name": "Defensive Driving",
                "description": "Advanced defensive driving techniques",
                "category": "Safety Training",
                "duration": "1 Day",
                "base_fee": "700",
                "pricing_tiers": {
                    "individual": "700",
                    "group_5_10": "630",
                    "group_10_plus": "600",
                    "corporate": "negotiable"
                },
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        
        print("\n" + "=" * 80)
        print("Adding Sample Courses")
        print("=" * 80)
        
        for course in sample_courses:
            courses_table.put_item(Item=course)
            print(f"✅ Added: {course['name']} - {course['base_fee']} AED")
        
        print("\n" + "=" * 80)
        print("✅ Successfully created tables and added 5 sample courses!")
        print("=" * 80)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    success = create_tables()
    exit(0 if success else 1)
