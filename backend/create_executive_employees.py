"""
Create employee records for executives (MD, COO, CEO) who don't have them
This is needed for expense claims and other employee-related operations
"""
import boto3
import os
from uuid import uuid4
from dotenv import load_dotenv

load_dotenv()

def create_executive_employees():
    """Create employee records for executives without them"""
    try:
        dynamodb = boto3.resource('dynamodb',
            region_name=os.getenv('AWS_REGION'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'))
        
        users_table = dynamodb.Table('arbrit_workdesk_users')
        employees_table = dynamodb.Table('arbrit_workdesk_employees')
        
        print("=" * 80)
        print("Creating Employee Records for Executives")
        print("=" * 80)
        
        # Get all users
        users_response = users_table.scan()
        users = users_response['Items']
        
        # Get all employees
        employees_response = employees_table.scan()
        employees = employees_response['Items']
        employee_mobiles = {emp.get('mobile') for emp in employees if emp.get('mobile')}
        
        # Find executives without employee records
        executives_to_create = []
        for user in users:
            role = user.get('role', '')
            if role in ['MD', 'COO', 'CEO']:
                mobile = user.get('mobile')
                if mobile not in employee_mobiles:
                    executives_to_create.append(user)
        
        if not executives_to_create:
            print("\n✅ All executives already have employee records")
            return True
        
        print(f"\nFound {len(executives_to_create)} executive(s) without employee records:\n")
        
        for user in executives_to_create:
            print(f"Creating employee record for:")
            print(f"  Name: {user.get('name')}")
            print(f"  Role: {user.get('role')}")
            print(f"  Mobile: {user.get('mobile')}")
            
            # Create employee record
            employee = {
                'id': str(uuid4()),
                'name': user.get('name'),
                'mobile': user.get('mobile'),
                'branch': 'Dubai',  # Default branch
                'email': f"{user.get('name', '').lower().replace(' ', '.')}@arbritsafety.com",
                'designation': user.get('role'),
                'department': 'Management',
                'badge_title': user.get('role'),
                'sales_type': 'none'
            }
            
            employees_table.put_item(Item=employee)
            print(f"  ✅ Employee record created with ID: {employee['id']}\n")
        
        print("=" * 80)
        print(f"✅ Created {len(executives_to_create)} employee record(s)")
        print("=" * 80)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    success = create_executive_employees()
    exit(0 if success else 1)
