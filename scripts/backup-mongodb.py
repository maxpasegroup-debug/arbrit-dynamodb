#!/usr/bin/env python3
"""
MongoDB Backup Script (Python version)
Exports all MongoDB collections to JSON files
Works without mongoexport command-line tool
"""

import os
import sys
import json
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId, json_util
from pathlib import Path

# Configuration
MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'arbrit-workdesk')

# Collections to backup
COLLECTIONS = [
    'users', 'employees', 'attendance', 'employee_documents',
    'company_documents', 'leads', 'quotations', 'invoices',
    'invoice_requests', 'payments', 'training_sessions',
    'certificate_requests', 'certificates', 'certificate_templates',
    'certificate_candidates', 'trainer_requests', 'work_orders',
    'assessment_forms', 'assessment_submissions', 'visit_logs',
    'expense_claims', 'leave_requests', 'delivery_tasks'
]


def backup_collection(db, collection_name, backup_dir):
    """Backup a single collection to JSON file"""
    try:
        collection = db[collection_name]
        documents = list(collection.find())
        
        if not documents:
            print(f"   ℹ️  No documents in {collection_name}")
            return 0
        
        # Convert to JSON (handling MongoDB types)
        json_data = json.loads(json_util.dumps(documents))
        
        # Save to file
        output_file = backup_dir / f"{collection_name}.json"
        with open(output_file, 'w') as f:
            json.dump(json_data, f, indent=2)
        
        file_size = output_file.stat().st_size
        size_str = f"{file_size / 1024:.1f}KB" if file_size < 1024*1024 else f"{file_size / (1024*1024):.1f}MB"
        
        print(f"   ✅ Exported {len(documents)} documents ({size_str})")
        return len(documents)
        
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return 0


def main():
    print("=" * 60)
    print("MongoDB Backup Script (Python)")
    print("=" * 60)
    print()
    
    # Check MONGO_URL
    if not MONGO_URL:
        print("❌ ERROR: MONGO_URL environment variable not set")
        print()
        print("Please set your MongoDB connection string:")
        print("  export MONGO_URL='mongodb+srv://user:pass@cluster.mongodb.net/db'")
        print()
        sys.exit(1)
    
    # Create backup directory
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_dir = Path(f"mongodb-backup-{timestamp}")
    backup_dir.mkdir(exist_ok=True)
    
    print(f"📁 Backup directory: {backup_dir}")
    print(f"🔵 Database: {DB_NAME}")
    print()
    
    # Connect to MongoDB
    print("🔵 Connecting to MongoDB...")
    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        # Test connection
        client.server_info()
        print("   ✅ Connected")
    except Exception as e:
        print(f"   ❌ Connection failed: {str(e)}")
        sys.exit(1)
    
    # Backup collections
    print()
    print("🚀 Starting backup...")
    print("=" * 60)
    
    total_docs = 0
    total_collections = len(COLLECTIONS)
    
    for idx, collection_name in enumerate(COLLECTIONS, 1):
        print()
        print(f"[{idx}/{total_collections}] Backing up: {collection_name}")
        count = backup_collection(db, collection_name, backup_dir)
        total_docs += count
    
    # Summary
    print()
    print("=" * 60)
    print("✅ Backup Complete!")
    print("=" * 60)
    print()
    print(f"Backup location: {backup_dir}")
    print(f"Total documents: {total_docs}")
    
    # List files
    print()
    print("Files created:")
    for file in sorted(backup_dir.glob("*.json")):
        size = file.stat().st_size
        size_str = f"{size / 1024:.1f}KB" if size < 1024*1024 else f"{size / (1024*1024):.1f}MB"
        print(f"  - {file.name} ({size_str})")
    
    print()
    print("To import to DynamoDB:")
    print(f"  python3 import-backup-to-dynamodb.py {backup_dir}")
    print()
    print("=" * 60)
    
    client.close()


if __name__ == "__main__":
    main()


