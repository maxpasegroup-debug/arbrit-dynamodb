#!/usr/bin/env python3
"""
PRE-CLEANUP AUDIT
Count all records before cleanup and verify user count
"""
import asyncio
import json
from datetime import datetime, timezone
from dynamodb_client import db
from dotenv import load_dotenv

load_dotenv('.env')

async def pre_cleanup_audit():
    print("\n" + "="*80)
    print("🔍 PHASE 1: PRE-CLEANUP VALIDATION")
    print("="*80)
    
    audit_data = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "phase": "PRE_CLEANUP",
        "counts": {}
    }
    
    # Count users - CRITICAL
    query_result = await db.users.find({}, {'_id': 0})
    users = await query_result.to_list(100)
    user_count = len(users)
    audit_data["counts"]["users"] = user_count
    
    print(f"\n🔒 PROTECTED: Users = {user_count}")
    
    if user_count != 35:
        print(f"\n❌ CRITICAL ERROR: User count is {user_count}, expected 35!")
        print("❌ ABORTING CLEANUP!")
        return False, audit_data
    
    print("✅ User count verified: 35")
    
    # Count employees
    query_result = await db.employees.find({}, {'_id': 0})
    employees = await query_result.to_list(100)
    audit_data["counts"]["employees"] = len(employees)
    print(f"🔒 PROTECTED: Employees = {len(employees)}")
    
    # Count demo data tables
    tables_to_count = [
        "leads", "quotations", "invoice_requests", "payments",
        "leave_requests", "expense_claims", "training_requests",
        "visit_logs", "attendance", "certificates", "certificate_candidates",
        "training_schedules", "duplicate_alerts", "lead_history"
    ]
    
    print(f"\n📊 DEMO DATA TO BE CLEANED:")
    total_records = 0
    
    for table_name in tables_to_count:
        try:
            table = getattr(db, table_name)
            query_result = await table.find({}, {'_id': 0})
            records = await query_result.to_list(10000)
            count = len(records)
            audit_data["counts"][table_name] = count
            total_records += count
            
            if count > 0:
                print(f"   - {table_name}: {count} records")
        except Exception as e:
            audit_data["counts"][table_name] = 0
            if "does not exist" not in str(e):
                print(f"   - {table_name}: 0 records (table may not exist)")
    
    print(f"\n📊 TOTAL DEMO RECORDS: {total_records}")
    
    # Save audit
    with open('/tmp/pre_cleanup_audit.json', 'w') as f:
        json.dump(audit_data, f, indent=2)
    
    print(f"\n✅ Pre-cleanup audit saved to: /tmp/pre_cleanup_audit.json")
    print("✅ System validated - Safe to proceed with cleanup")
    print("="*80)
    
    return True, audit_data

if __name__ == "__main__":
    result, data = asyncio.run(pre_cleanup_audit())
    exit(0 if result else 1)
