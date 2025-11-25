#!/usr/bin/env python3
"""
Fix All User PINs in DynamoDB
Updates all non-admin users to use PIN "1234"
Preserves MD (971564022503) and COO (971566374020)
"""

import boto3
from passlib.context import CryptContext
from datetime import datetime

# Configuration
AWS_REGION = 'us-east-1'
TABLE_NAME = 'arbrit-users'
NEW_PIN = '1234'

# Admin accounts to preserve
ADMIN_MOBILES = ['971564022503', '971566374020']

# Initialize
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
table = dynamodb.Table(TABLE_NAME)

print("="*70)
print(" 🔧 FIXING ALL USER PINS IN DYNAMODB")
print("="*70)
print(f"Region: {AWS_REGION}")
print(f"Table: {TABLE_NAME}")
print(f"New PIN: {NEW_PIN}")
print(f"Admin accounts (will be skipped): {', '.join(ADMIN_MOBILES)}")
print("="*70)
print()

# Generate new PIN hash
new_pin_hash = pwd_context.hash(NEW_PIN)
print(f"✅ Generated bcrypt hash for PIN '{NEW_PIN}'")
print(f"   Hash: {new_pin_hash}")
print()

# Scan all users
print("📥 Scanning all users from DynamoDB...")
response = table.scan()
users = response.get('Items', [])

# Handle pagination if more than 1MB of data
while 'LastEvaluatedKey' in response:
    response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
    users.extend(response.get('Items', []))

print(f"✅ Found {len(users)} users in database")
print()

# Filter out admin users
regular_users = [u for u in users if u.get('mobile') not in ADMIN_MOBILES]
admin_users = [u for u in users if u.get('mobile') in ADMIN_MOBILES]

print(f"👤 Admin users (will be skipped): {len(admin_users)}")
for admin in admin_users:
    print(f"   - {admin.get('name')} ({admin.get('mobile')}) - Role: {admin.get('role')}")
print()

print(f"👥 Regular users (will be updated): {len(regular_users)}")
print()

# Confirm before proceeding
print("⚠️  WARNING: This will update PIN hashes for all non-admin users!")
print(f"   {len(regular_users)} users will be updated to use PIN: {NEW_PIN}")
print()
response = input("Do you want to continue? (yes/no): ")

if response.lower() != 'yes':
    print("❌ Aborted by user")
    exit(0)

print()
print("="*70)
print("🚀 STARTING UPDATES")
print("="*70)
print()

# Update each user
updated_count = 0
failed_count = 0
skipped_count = 0

for user in users:
    user_id = user.get('id')
    mobile = user.get('mobile')
    name = user.get('name', 'Unknown')
    role = user.get('role', 'Unknown')
    
    # Skip admin users
    if mobile in ADMIN_MOBILES:
        print(f"⏭️  SKIPPED: {name} ({mobile}) - Admin user")
        skipped_count += 1
        continue
    
    try:
        # Update the user's pin_hash
        table.update_item(
            Key={'id': user_id},
            UpdateExpression='SET pin_hash = :hash',
            ExpressionAttributeValues={
                ':hash': new_pin_hash
            }
        )
        
        print(f"✅ UPDATED: {name} ({mobile}) - Role: {role}")
        updated_count += 1
        
    except Exception as e:
        print(f"❌ FAILED: {name} ({mobile}) - Error: {str(e)}")
        failed_count += 1

print()
print("="*70)
print("📊 SUMMARY")
print("="*70)
print(f"Total users in database: {len(users)}")
print(f"✅ Successfully updated: {updated_count}")
print(f"⏭️  Skipped (admin): {skipped_count}")
print(f"❌ Failed: {failed_count}")
print("="*70)
print()

if updated_count > 0:
    print("✨ ALL DONE!")
    print()
    print("🔐 You can now login with:")
    print(f"   PIN: {NEW_PIN}")
    print()
    print("Example logins:")
    
    # Show first 5 non-admin users as examples
    example_users = regular_users[:5]
    for user in example_users:
        print(f"   - {user.get('name')} ({user.get('mobile')}) / PIN: {NEW_PIN}")
    
    if len(regular_users) > 5:
        print(f"   ... and {len(regular_users) - 5} more users")
    
    print()
    print("Admin accounts unchanged:")
    print("   - MD: 971564022503 / PIN: 2503")
    print("   - COO: 971566374020 / PIN: 4020")
    print()

print("="*70)


