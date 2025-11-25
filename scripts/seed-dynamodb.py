#!/usr/bin/env python3
"""
Seed DynamoDB with Initial Data
Creates a sample admin user for testing
"""

import boto3
import uuid
from datetime import datetime
import sys
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

AWS_REGION = 'us-east-1'

def create_admin_user():
    """Create an admin user in DynamoDB"""
    dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
    users_table = dynamodb.Table('arbrit-users')
    employees_table = dynamodb.Table('arbrit-employees')
    
    user_id = str(uuid.uuid4())
    mobile = "9876543210"  # Default admin mobile
    password_hash = pwd_context.hash("admin123")  # Default password
    
    # Create user record
    user_item = {
        'id': user_id,
        'mobile': mobile,
        'password': password_hash,
        'role': 'MD',  # Managing Director
        'name': 'Admin User',
        'email': 'admin@arbrit.com',
        'is_active': True,
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat()
    }
    
    # Create employee record
    employee_item = {
        'id': user_id,
        'name': 'Admin User',
        'mobile': mobile,
        'email': 'admin@arbrit.com',
        'department': 'Management',
        'designation': 'Managing Director',
        'role': 'MD',
        'status': 'active',
        'joining_date': datetime.now().date().isoformat(),
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat()
    }
    
    try:
        # Insert user
        users_table.put_item(Item=user_item)
        print(f"✅ Created admin user")
        print(f"   Mobile: {mobile}")
        print(f"   Password: admin123")
        print(f"   Role: MD (Managing Director)")
        
        # Insert employee
        employees_table.put_item(Item=employee_item)
        print(f"✅ Created admin employee record")
        
        return True
    except Exception as e:
        print(f"❌ Error creating admin user: {str(e)}")
        return False


def main():
    print("=" * 60)
    print("DynamoDB Seeder - Create Admin User")
    print("=" * 60)
    print()
    
    print("This will create a default admin user:")
    print("  Mobile: 9876543210")
    print("  Password: admin123")
    print("  Role: MD (Managing Director)")
    print()
    
    response = input("Continue? (yes/no): ")
    if response.lower() != 'yes':
        print("Cancelled.")
        sys.exit(0)
    
    print()
    print("Creating admin user...")
    
    if create_admin_user():
        print()
        print("=" * 60)
        print("✅ SUCCESS!")
        print("=" * 60)
        print()
        print("You can now login with:")
        print("  Mobile: 9876543210")
        print("  Password: admin123")
        print()
        print("⚠️  IMPORTANT: Change this password after first login!")
        print("=" * 60)
    else:
        print()
        print("=" * 60)
        print("❌ FAILED")
        print("=" * 60)
        sys.exit(1)


if __name__ == "__main__":
    main()


