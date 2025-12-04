#!/usr/bin/env python3
"""
EXECUTE FULL CLEANUP
Delete all demo data while protecting 35 users/employees
"""
import asyncio
import json
from datetime import datetime, timezone
from dynamodb_client import db
from dotenv import load_dotenv
import requests

load_dotenv('.env')

async def verify_user_count():
    """Critical: Verify 35 users exist"""
    try:
        response = requests.get('http://localhost:8001/api/health', timeout=5)
        data = response.json()
        return data.get('user_count', 0) == 35
    except:
        return False

async def execute_cleanup():
    print("\n" + "="*80)
    print("🧹 PHASE 2 & 3: DATA COUNTING & CLEANUP EXECUTION")
    print("="*80)
    
    # Verify user count before starting
    if not await verify_user_count():
        print("❌ CRITICAL: User count verification failed!")
        print("❌ ABORTING CLEANUP!")
        return False
    
    print("✅ User count verified: 35")
    
    cleanup_log = {
        "timestamp_start": datetime.now(timezone.utc).isoformat(),
        "deleted": {},
        "errors": [],
        "user_count_verified": True
    }
    
    # Define cleanup order (dependencies first)
    cleanup_order = [
        "payments",
        "invoice_requests",
        "quotations",
        "training_schedules",
        "training_requests",
        "visit_logs",
        "leave_requests",
        "expense_claims",
        "attendance",
        "certificates",
        "certificate_candidates",
        "duplicate_alerts",
        "lead_history",
        "leads"  # LAST - everything depends on this
    ]
    
    total_deleted = 0
    
    for table_name in cleanup_order:
        try:
            print(f"\n🧹 Cleaning {table_name}...")
            
            table = getattr(db, table_name)
            
            # Get all records
            query_result = await table.find({}, {'_id': 0})
            records = await query_result.to_list(10000)
            
            if len(records) == 0:
                print(f"   ✅ {table_name}: Already empty (0 records)")
                cleanup_log["deleted"][table_name] = 0
                continue
            
            print(f"   Found {len(records)} records to delete...")
            
            # Delete one by one
            deleted_count = 0
            for record in records:
                try:
                    record_id = record.get('id')
                    if record_id:
                        await table.delete_one({"id": record_id})
                        deleted_count += 1
                except Exception as e:
                    error_msg = f"Error deleting from {table_name}: {str(e)}"
                    cleanup_log["errors"].append(error_msg)
                    print(f"   ⚠️ {error_msg}")
            
            cleanup_log["deleted"][table_name] = deleted_count
            total_deleted += deleted_count
            print(f"   ✅ {table_name}: Deleted {deleted_count} records")
            
            # Verify user count after each table
            if not await verify_user_count():
                print(f"\n❌ CRITICAL: User count changed after deleting {table_name}!")
                print("❌ ABORTING CLEANUP!")
                cleanup_log["user_count_verified"] = False
                cleanup_log["aborted_at"] = table_name
                return False
                
        except Exception as e:
            error_msg = f"Error with table {table_name}: {str(e)}"
            cleanup_log["errors"].append(error_msg)
            print(f"   ⚠️ {error_msg}")
            cleanup_log["deleted"][table_name] = 0
    
    cleanup_log["timestamp_end"] = datetime.now(timezone.utc).isoformat()
    cleanup_log["total_deleted"] = total_deleted
    
    # Save cleanup log
    with open('/tmp/cleanup_execution_log.json', 'w') as f:
        json.dump(cleanup_log, f, indent=2)
    
    print(f"\n" + "="*80)
    print(f"✅ CLEANUP COMPLETED")
    print(f"   Total records deleted: {total_deleted}")
    print(f"   Errors encountered: {len(cleanup_log['errors'])}")
    print(f"   User count still 35: {await verify_user_count()}")
    print("="*80)
    
    return True

if __name__ == "__main__":
    result = asyncio.run(execute_cleanup())
    exit(0 if result else 1)
