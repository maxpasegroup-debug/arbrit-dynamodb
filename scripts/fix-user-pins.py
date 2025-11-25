#!/usr/bin/env python3
"""
Fix User PIN Hashes in DynamoDB
This script updates all users with a correct bcrypt hash for PIN "1234"
"""

import boto3
from passlib.context import CryptContext
from decimal import Decimal

# Configuration
AWS_REGION = 'us-east-1'
TABLE_NAME = 'arbrit-users'
DEFAULT_PIN = '1234'  # Change this if needed

# Initialize
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
table = dynamodb.Table(TABLE_NAME)

def main():
    print("=" * 60)
    print("Fix User PIN Hashes in DynamoDB")
    print("=" * 60)
    print()
    
    # Generate correct PIN hash for "1234"
    print(f"Generating bcrypt hash for PIN: {DEFAULT_PIN}")
    correct_pin_hash = pwd_context.hash(DEFAULT_PIN)
    print(f"Hash: {correct_pin_hash[:50]}...")
    print()
    
    # Scan all users
    print("Scanning users...")
    response = table.scan()
    users = response.get('Items', [])
    
    # Handle pagination
    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        users.extend(response.get('Items', []))
    
    print(f"Found {len(users)} users")
    print()
    
    # Skip MD and COO (they already work)
    skip_mobiles = ['971564022503', '971566374020']
    
    print("Users to update:")
    update_count = 0
    
    for user in users:
        mobile = user.get('mobile', 'N/A')
        name = user.get('name', 'N/A')
        user_id = user.get('id')
        current_hash = user.get('pin_hash', '')
        
        # Skip if no ID
        if not user_id:
            print(f"⚠️  Skipping {name} ({mobile}) - No ID")
            continue
        
        # Skip MD and COO
        if mobile in skip_mobiles:
            print(f"✓  Skipping {name} ({mobile}) - Already works")
            continue
        
        # Check if hash needs updating
        if current_hash == correct_pin_hash:
            print(f"✓  {name} ({mobile}) - Already has correct hash")
            continue
        
        print(f"📝 Will update: {name} ({mobile})")
        update_count += 1
    
    print()
    print(f"Total users to update: {update_count}")
    
    if update_count == 0:
        print("No users need updating!")
        return
    
    # Ask for confirmation
    print()
    confirm = input("Update all users with PIN '1234'? (yes/no): ")
    
    if confirm.lower() != 'yes':
        print("Cancelled.")
        return
    
    print()
    print("Updating users...")
    print("-" * 60)
    
    updated = 0
    failed = 0
    
    for user in users:
        mobile = user.get('mobile', 'N/A')
        name = user.get('name', 'N/A')
        user_id = user.get('id')
        current_hash = user.get('pin_hash', '')
        
        # Skip conditions
        if not user_id or mobile in skip_mobiles or current_hash == correct_pin_hash:
            continue
        
        try:
            # Update pin_hash
            table.update_item(
                Key={'id': user_id},
                UpdateExpression='SET pin_hash = :hash',
                ExpressionAttributeValues={
                    ':hash': correct_pin_hash
                }
            )
            print(f"✅ Updated: {name} ({mobile})")
            updated += 1
            
        except Exception as e:
            print(f"❌ Failed: {name} ({mobile}) - {e}")
            failed += 1
    
    print()
    print("=" * 60)
    print("Update Complete!")
    print("=" * 60)
    print(f"✅ Updated: {updated} users")
    if failed > 0:
        print(f"❌ Failed: {failed} users")
    print()
    print("All users can now login with:")
    print(f"  PIN: {DEFAULT_PIN}")
    print()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nCancelled by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


