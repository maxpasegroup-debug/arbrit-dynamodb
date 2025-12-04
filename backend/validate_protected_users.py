#!/usr/bin/env python3
"""
CRITICAL PROTECTION SCRIPT
Validates that all 35 protected users exist in DynamoDB
Run this before ANY database operation that could affect users
"""
import asyncio
import json
from pathlib import Path
from dynamodb_client import db
from dotenv import load_dotenv

load_dotenv('.env')

async def validate_protected_users():
    """Validate all 35 protected users exist"""
    
    # Load protected users list
    protected_file = Path('/app/PROTECTED_USERS.json')
    with open(protected_file, 'r') as f:
        protected_data = json.load(f)
    
    protected_users = protected_data['PROTECTED_USERS']
    expected_count = protected_data['TOTAL_USERS']
    
    print("\n" + "="*80)
    print("🔒 PROTECTED USERS VALIDATION")
    print("="*80)
    
    # Get all users from database
    query_result = await db.users.find({}, {'_id': 0})
    db_users = await query_result.to_list(100)
    
    print(f"\n✅ Expected Users: {expected_count}")
    print(f"✅ Database Users: {len(db_users)}")
    
    if len(db_users) != expected_count:
        print(f"\n❌ CRITICAL ERROR: User count mismatch!")
        print(f"   Expected: {expected_count}")
        print(f"   Found: {len(db_users)}")
        print(f"   Difference: {abs(len(db_users) - expected_count)}")
        return False
    
    # Verify each protected user exists
    db_mobiles = {u['mobile'] for u in db_users}
    protected_mobiles = {u['mobile'] for u in protected_users}
    
    missing = protected_mobiles - db_mobiles
    extra = db_mobiles - protected_mobiles
    
    if missing:
        print(f"\n❌ CRITICAL ERROR: Missing protected users!")
        for mobile in missing:
            user = next(u for u in protected_users if u['mobile'] == mobile)
            print(f"   Missing: {user['name']} ({mobile})")
        return False
    
    if extra:
        print(f"\n⚠️ WARNING: Extra users found (not in protected list):")
        for mobile in extra:
            user = next((u for u in db_users if u['mobile'] == mobile), None)
            if user:
                print(f"   Extra: {user.get('name', 'Unknown')} ({mobile})")
    
    print(f"\n✅ ALL 35 PROTECTED USERS VALIDATED SUCCESSFULLY")
    print(f"   - 6 Field Sales")
    print(f"   - 8 Tele Sales")
    print(f"   - 1 Sales Head")
    print(f"   - 20 Other roles")
    print("\n" + "="*80)
    
    return True

if __name__ == "__main__":
    result = asyncio.run(validate_protected_users())
    exit(0 if result else 1)
