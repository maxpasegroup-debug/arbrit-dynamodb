#!/bin/bash

###############################################################################
# Fix All User PINs in DynamoDB (Run on EC2)
# Updates all non-admin users to PIN "1234"
# Preserves MD (971564022503) and COO (971566374020)
###############################################################################

set -e

echo "========================================================================"
echo "🔧 FIXING ALL USER PINS IN DYNAMODB"
echo "========================================================================"
echo "Region: us-east-1"
echo "Table: arbrit-users"
echo "New PIN: 1234"
echo "Admin accounts (preserved): MD (971564022503), COO (971566374020)"
echo "========================================================================"
echo ""

# Install dependencies
echo "📦 Installing Python dependencies..."
sudo yum install -y python3-pip > /dev/null 2>&1 || true
pip3 install --user passlib bcrypt boto3 > /dev/null 2>&1 || true
echo "✅ Dependencies installed"
echo ""

# Create Python script
cat > /tmp/fix_pins.py << 'PYTHON_SCRIPT'
import boto3
from passlib.context import CryptContext

# Configuration
AWS_REGION = 'us-east-1'
TABLE_NAME = 'arbrit-users'
NEW_PIN = '1234'
ADMIN_MOBILES = ['971564022503', '971566374020']

# Initialize
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
table = dynamodb.Table(TABLE_NAME)

# Generate new PIN hash
new_pin_hash = pwd_context.hash(NEW_PIN)
print(f"✅ Generated bcrypt hash for PIN '{NEW_PIN}'")
print()

# Scan all users
print("📥 Scanning all users from DynamoDB...")
response = table.scan()
users = response.get('Items', [])

while 'LastEvaluatedKey' in response:
    response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
    users.extend(response.get('Items', []))

print(f"✅ Found {len(users)} users in database")
print()

# Filter users
regular_users = [u for u in users if u.get('mobile') not in ADMIN_MOBILES]
admin_users = [u for u in users if u.get('mobile') in ADMIN_MOBILES]

print(f"👤 Admin users (will be skipped): {len(admin_users)}")
for admin in admin_users:
    print(f"   - {admin.get('name')} ({admin.get('mobile')}) - Role: {admin.get('role')}")
print()

print(f"👥 Regular users (will be updated): {len(regular_users)}")
print()

# Update each user
print("="*70)
print("🚀 UPDATING USERS")
print("="*70)
print()

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
        table.update_item(
            Key={'id': user_id},
            UpdateExpression='SET pin_hash = :hash',
            ExpressionAttributeValues={':hash': new_pin_hash}
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

PYTHON_SCRIPT

# Run the Python script
echo "🚀 Running PIN fix script..."
echo ""
python3 /tmp/fix_pins.py

# Cleanup
rm -f /tmp/fix_pins.py

echo ""
echo "========================================================================"
echo "✅ PROCESS COMPLETE"
echo "========================================================================"
echo ""
echo "Next steps:"
echo "1. Go to your application"
echo "2. Try logging in with any user mobile number"
echo "3. Use PIN: 1234"
echo ""
echo "Admin accounts still use their original PINs:"
echo "- MD: 971564022503 / PIN: 2503"
echo "- COO: 971566374020 / PIN: 4020"
echo ""


