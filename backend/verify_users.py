"""
User Verification and Protection Script
Verifies all 35 users are intact and creates a backup reference
"""
import boto3
import os
import json
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# DynamoDB connection
dynamodb = boto3.resource(
    'dynamodb',
    region_name=os.getenv('AWS_REGION'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

def verify_users():
    """Verify all 35 users are present and intact"""
    try:
        table = dynamodb.Table('arbrit_workdesk_users')
        response = table.scan()
        users = response['Items']
        
        print("=" * 80)
        print(f"USER VERIFICATION REPORT - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        print(f"\n✅ Total Users Found: {len(users)}")
        
        # Expected count
        expected_count = 35
        if len(users) != expected_count:
            print(f"⚠️  WARNING: Expected {expected_count} users but found {len(users)}")
        else:
            print(f"✅ User count matches expected: {expected_count}")
        
        # Verify each user has required fields
        print("\n" + "=" * 80)
        print("USER DATA INTEGRITY CHECK")
        print("=" * 80)
        
        required_fields = ['id', 'mobile', 'name', 'role', 'pin_hash']
        corrupted_users = []
        
        for idx, user in enumerate(users, 1):
            missing_fields = [field for field in required_fields if not user.get(field)]
            if missing_fields:
                corrupted_users.append({
                    'mobile': user.get('mobile', 'UNKNOWN'),
                    'name': user.get('name', 'UNKNOWN'),
                    'missing_fields': missing_fields
                })
        
        if corrupted_users:
            print(f"\n❌ CRITICAL: Found {len(corrupted_users)} users with missing data:")
            for user in corrupted_users:
                print(f"   - {user['name']} ({user['mobile']}): Missing {user['missing_fields']}")
        else:
            print(f"\n✅ All {len(users)} users have complete data")
        
        # Role distribution
        print("\n" + "=" * 80)
        print("ROLE DISTRIBUTION")
        print("=" * 80)
        
        role_count = {}
        for user in users:
            role = user.get('role', 'Unknown')
            role_count[role] = role_count.get(role, 0) + 1
        
        for role, count in sorted(role_count.items()):
            print(f"   {role}: {count}")
        
        # Critical roles check
        critical_roles = ['MD', 'COO', 'Sales Head', 'Accounts Head']
        print("\n" + "=" * 80)
        print("CRITICAL ROLES VERIFICATION")
        print("=" * 80)
        
        for role in critical_roles:
            users_with_role = [u for u in users if u.get('role') == role]
            if users_with_role:
                print(f"✅ {role}: {len(users_with_role)} user(s)")
                for u in users_with_role:
                    print(f"   - {u.get('name')} ({u.get('mobile')})")
            else:
                print(f"❌ {role}: NO USERS FOUND")
        
        # Create backup file
        backup_file = '/app/USER_BACKUP_REFERENCE.json'
        backup_data = {
            'timestamp': datetime.now().isoformat(),
            'total_users': len(users),
            'users': [
                {
                    'id': u.get('id'),
                    'mobile': u.get('mobile'),
                    'name': u.get('name'),
                    'role': u.get('role')
                }
                for u in users
            ]
        }
        
        with open(backup_file, 'w') as f:
            json.dump(backup_data, f, indent=2)
        
        print("\n" + "=" * 80)
        print(f"✅ Backup reference saved to: {backup_file}")
        print("=" * 80)
        
        return len(users) == expected_count and len(corrupted_users) == 0
        
    except Exception as e:
        print(f"\n❌ ERROR: Failed to verify users: {str(e)}")
        return False

if __name__ == "__main__":
    success = verify_users()
    exit(0 if success else 1)
