"""
Sync user mobile numbers with employee mobile numbers
When HR updates an employee's mobile, the corresponding user login mobile should also update
"""
import boto3
import os
from dotenv import load_dotenv

load_dotenv()

def sync_mobiles():
    """Sync mobile numbers between users and employees tables"""
    try:
        dynamodb = boto3.resource('dynamodb',
            region_name=os.getenv('AWS_REGION'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'))
        
        users_table = dynamodb.Table('arbrit_workdesk_users')
        employees_table = dynamodb.Table('arbrit_workdesk_employees')
        
        print("=" * 80)
        print("Syncing User-Employee Mobile Numbers")
        print("=" * 80)
        
        # Get all employees
        emp_response = employees_table.scan()
        employees = emp_response['Items']
        
        # Get all users
        users_response = users_table.scan()
        users = users_response['Items']
        
        # Create mapping by ID (users and employees share same ID)
        user_map = {user['id']: user for user in users if user.get('id')}
        
        synced_count = 0
        mismatches = []
        
        for emp in employees:
            emp_id = emp.get('id')
            emp_mobile = emp.get('mobile')
            emp_name = emp.get('name')
            
            if not emp_id or not emp_mobile:
                continue
            
            # Find corresponding user
            user = user_map.get(emp_id)
            
            if user:
                user_mobile = user.get('mobile')
                
                if user_mobile != emp_mobile:
                    mismatches.append({
                        'name': emp_name,
                        'user_mobile': user_mobile,
                        'emp_mobile': emp_mobile
                    })
                    
                    print(f"\\nFound mismatch for: {emp_name}")
                    print(f"  User mobile (OLD): {user_mobile}")
                    print(f"  Employee mobile (NEW): {emp_mobile}")
                    print(f"  Updating user mobile...")
                    
                    # Update user mobile
                    # Need to delete old user and create new one since mobile is partition key
                    try:
                        # Get old user data
                        old_user_data = dict(user)
                        
                        # Delete old user
                        users_table.delete_item(Key={'mobile': user_mobile})
                        
                        # Create new user with updated mobile
                        old_user_data['mobile'] = emp_mobile
                        users_table.put_item(Item=old_user_data)
                        
                        print(f"  ✅ Successfully updated!")
                        synced_count += 1
                        
                    except Exception as e:
                        print(f"  ❌ Error updating: {str(e)}")
        
        print("\\n" + "=" * 80)
        if synced_count > 0:
            print(f"✅ Synced {synced_count} user-employee mobile number(s)")
        else:
            print("✅ All user-employee mobile numbers are already in sync")
        print("=" * 80)
        
        return True
        
    except Exception as e:
        print(f"\\n❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    success = sync_mobiles()
    exit(0 if success else 1)
