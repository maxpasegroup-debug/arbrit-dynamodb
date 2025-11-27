#!/usr/bin/env python3
"""
Diagnose DynamoDB User Data
Shows what's wrong with user records
"""

import boto3
from passlib.context import CryptContext

# Configuration
AWS_REGION = 'us-east-1'
TABLE_NAME = 'arbrit-users'

# Initialize
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
table = dynamodb.Table(TABLE_NAME)

def check_pin_hash(pin_hash, test_pin='1234'):
    """Check if a PIN hash is valid"""
    try:
        # Check if it's a bcrypt hash
        if not pin_hash.startswith('$2b$') and not pin_hash.startswith('$2a$'):
            return False, "Not a bcrypt hash"
        
        # Try to verify with test PIN
        if pwd_context.verify(test_pin, pin_hash):
            return True, f"Valid (matches PIN: {test_pin})"
        else:
            return False, f"Valid hash but doesn't match PIN: {test_pin}"
    except Exception as e:
        return False, f"Invalid hash: {str(e)}"

def main():
    print("=" * 70)
    print("DynamoDB User Diagnostic")
    print("=" * 70)
    print()
    
    # Scan all users
    print("Scanning users...")
    response = table.scan()
    users = response.get('Items', [])
    
    # Handle pagination
    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        users.extend(response.get('Items', []))
    
    print(f"Total users found: {len(users)}")
    print()
    print("=" * 70)
    print()
    
    # Analyze each user
    issues = {
        'missing_id': [],
        'missing_mobile': [],
        'missing_pin_hash': [],
        'invalid_pin_hash': [],
        'wrong_pin': [],
        'ok': []
    }
    
    for user in users:
        user_id = user.get('id', 'N/A')
        mobile = user.get('mobile', 'N/A')
        name = user.get('name', 'N/A')
        role = user.get('role', 'N/A')
        pin_hash = user.get('pin_hash', '')
        
        # Check for issues
        has_issues = False
        
        print(f"User: {name} ({mobile}) - Role: {role}")
        print(f"  ID: {user_id}")
        
        # Check ID
        if not user.get('id'):
            print("  ❌ Missing ID field!")
            issues['missing_id'].append(mobile)
            has_issues = True
        
        # Check mobile
        if not user.get('mobile'):
            print("  ❌ Missing mobile field!")
            issues['missing_mobile'].append(name)
            has_issues = True
        
        # Check pin_hash
        if not pin_hash:
            print("  ❌ Missing pin_hash field!")
            issues['missing_pin_hash'].append(mobile)
            has_issues = True
        else:
            # Validate pin_hash
            is_valid, message = check_pin_hash(pin_hash, '1234')
            if is_valid:
                print(f"  ✅ PIN Hash: {message}")
                issues['ok'].append(mobile)
            else:
                print(f"  ⚠️  PIN Hash: {message}")
                if "doesn't match" in message:
                    issues['wrong_pin'].append(mobile)
                else:
                    issues['invalid_pin_hash'].append(mobile)
                has_issues = True
        
        # Check other fields
        if not user.get('role'):
            print("  ⚠️  Missing role field")
            has_issues = True
        
        if not user.get('name'):
            print("  ⚠️  Missing name field")
            has_issues = True
        
        if not has_issues and pin_hash:
            # Check if it matches MD or COO (the working ones)
            if mobile in ['971564022503', '971566374020']:
                print("  ✓  This user should work (MD/COO)")
        
        print()
    
    # Summary
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print()
    print(f"Total Users: {len(users)}")
    print()
    print(f"✅ Working users (correct PIN hash): {len(issues['ok'])}")
    print(f"❌ Missing ID: {len(issues['missing_id'])}")
    print(f"❌ Missing mobile: {len(issues['missing_mobile'])}")
    print(f"❌ Missing pin_hash: {len(issues['missing_pin_hash'])}")
    print(f"❌ Invalid pin_hash format: {len(issues['invalid_pin_hash'])}")
    print(f"⚠️  Wrong PIN (valid hash, but not '1234'): {len(issues['wrong_pin'])}")
    print()
    
    # Show problematic users
    total_issues = (len(issues['missing_id']) + len(issues['missing_mobile']) + 
                    len(issues['missing_pin_hash']) + len(issues['invalid_pin_hash']) + 
                    len(issues['wrong_pin']))
    
    if total_issues > 0:
        print("=" * 70)
        print("RECOMMENDATIONS")
        print("=" * 70)
        print()
        
        if len(issues['invalid_pin_hash']) > 0 or len(issues['wrong_pin']) > 0:
            print("❗ PIN Hash Issues Detected!")
            print()
            print("The users were imported but their PIN hashes don't match '1234'")
            print()
            print("Solutions:")
            print("  1. Run fix-user-pins.py to update all users with correct PIN hash")
            print("  2. Or create new users through the HR Dashboard")
            print()
        
        if len(issues['missing_pin_hash']) > 0:
            print("❗ Some users are missing pin_hash field!")
            print("   These users cannot login until pin_hash is added")
            print()
        
        if len(issues['missing_id']) > 0:
            print("❗ Some users are missing ID field!")
            print("   These records are invalid and should be removed")
            print()
    else:
        print("✅ All users look good!")
        print()
        print("If login still doesn't work:")
        print("  1. Check backend logs during login attempt")
        print("  2. Verify mobile number format matches exactly")
        print("  3. Check if backend is using correct DynamoDB table")
    
    print()

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


