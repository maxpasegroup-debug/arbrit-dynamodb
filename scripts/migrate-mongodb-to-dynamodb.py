#!/usr/bin/env python3
"""
MongoDB to DynamoDB Migration Script for Arbrit Safety
This script migrates all data from MongoDB to DynamoDB tables
"""

import os
import sys
from datetime import datetime
import boto3
from pymongo import MongoClient
from botocore.exceptions import ClientError
import json
from decimal import Decimal

# Configuration
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb+srv://username:password@cluster.mongodb.net/arbrit-workdesk?retryWrites=true&w=majority')
DB_NAME = os.environ.get('DB_NAME', 'arbrit-workdesk')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

# Collection to DynamoDB table mapping
COLLECTION_TABLE_MAP = {
    'users': 'arbrit-users',
    'employees': 'arbrit-employees',
    'attendance': 'arbrit-attendance',
    'employee_documents': 'arbrit-employee-documents',
    'company_documents': 'arbrit-company-documents',
    'leads': 'arbrit-leads',
    'quotations': 'arbrit-quotations',
    'invoices': 'arbrit-invoices',
    'invoice_requests': 'arbrit-invoice-requests',
    'payments': 'arbrit-payments',
    'training_sessions': 'arbrit-training-sessions',
    'certificate_requests': 'arbrit-certificate-requests',
    'certificates': 'arbrit-certificates',
    'certificate_templates': 'arbrit-certificate-templates',
    'certificate_candidates': 'arbrit-certificate-candidates',
    'trainer_requests': 'arbrit-trainer-requests',
    'work_orders': 'arbrit-work-orders',
    'assessment_forms': 'arbrit-assessment-forms',
    'assessment_submissions': 'arbrit-assessment-submissions',
    'visit_logs': 'arbrit-visit-logs',
    'expense_claims': 'arbrit-expense-claims',
    'leave_requests': 'arbrit-leave-requests',
    'delivery_tasks': 'arbrit-delivery-tasks'
}


def convert_floats_to_decimal(obj):
    """Convert float values to Decimal for DynamoDB"""
    if isinstance(obj, list):
        return [convert_floats_to_decimal(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: convert_floats_to_decimal(value) for key, value in obj.items()}
    elif isinstance(obj, float):
        return Decimal(str(obj))
    return obj


def convert_objectid_to_string(obj):
    """Convert MongoDB ObjectId to string"""
    if isinstance(obj, dict):
        result = {}
        for key, value in obj.items():
            if key == '_id':
                # Convert MongoDB _id to string, but keep it as 'id' field
                result['id'] = str(value)
            else:
                result[key] = convert_objectid_to_string(value)
        return result
    elif isinstance(obj, list):
        return [convert_objectid_to_string(item) for item in obj]
    else:
        # Try to convert if it's an ObjectId
        if hasattr(obj, '__class__') and obj.__class__.__name__ == 'ObjectId':
            return str(obj)
        return obj


def migrate_collection(mongo_db, dynamodb, collection_name, table_name):
    """Migrate a single MongoDB collection to DynamoDB table"""
    print(f"\n📦 Migrating {collection_name} -> {table_name}")
    
    try:
        collection = mongo_db[collection_name]
        table = dynamodb.Table(table_name)
        
        # Get all documents from MongoDB
        documents = list(collection.find())
        total = len(documents)
        
        if total == 0:
            print(f"   ℹ️  No documents found in {collection_name}")
            return 0
        
        print(f"   Found {total} documents")
        
        # Migrate in batches
        batch_size = 25  # DynamoDB batch limit
        migrated = 0
        failed = 0
        
        for i in range(0, total, batch_size):
            batch = documents[i:i + batch_size]
            
            with table.batch_writer() as writer:
                for doc in batch:
                    try:
                        # Convert MongoDB document to DynamoDB item
                        item = convert_objectid_to_string(doc)
                        item = convert_floats_to_decimal(item)
                        
                        # Ensure 'id' field exists (from _id)
                        if 'id' not in item and '_id' in doc:
                            item['id'] = str(doc['_id'])
                        
                        # Special handling for users table (uses 'mobile' as primary key)
                        if table_name == 'arbrit-users':
                            if 'mobile' not in item:
                                print(f"   ⚠️  Skipping user without mobile: {item.get('id', 'unknown')}")
                                failed += 1
                                continue
                        
                        # Write to DynamoDB
                        writer.put_item(Item=item)
                        migrated += 1
                        
                    except Exception as e:
                        print(f"   ❌ Error migrating document {doc.get('_id')}: {str(e)}")
                        failed += 1
            
            # Progress update
            progress = min(i + batch_size, total)
            print(f"   Progress: {progress}/{total} ({(progress/total)*100:.1f}%)")
        
        print(f"   ✅ Migrated {migrated} documents ({failed} failed)")
        return migrated
        
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return 0


def verify_migration(mongo_db, dynamodb, collection_name, table_name):
    """Verify migration by comparing counts"""
    try:
        collection = mongo_db[collection_name]
        table = dynamodb.Table(table_name)
        
        mongo_count = collection.count_documents({})
        
        # Get DynamoDB count (approximate)
        response = table.scan(Select='COUNT')
        dynamo_count = response['Count']
        
        # Handle pagination for accurate count
        while 'LastEvaluatedKey' in response:
            response = table.scan(
                Select='COUNT',
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            dynamo_count += response['Count']
        
        match = "✅" if mongo_count == dynamo_count else "⚠️"
        print(f"   {match} MongoDB: {mongo_count} | DynamoDB: {dynamo_count}")
        
        return mongo_count == dynamo_count
        
    except Exception as e:
        print(f"   ❌ Verification error: {str(e)}")
        return False


def main():
    """Main migration function"""
    print("=" * 60)
    print("MongoDB to DynamoDB Migration")
    print("Arbrit Safety Management System")
    print("=" * 60)
    
    # Check environment variables
    if MONGO_URL == 'mongodb+srv://username:password@cluster.mongodb.net/arbrit-workdesk?retryWrites=true&w=majority':
        print("\n❌ ERROR: Please set MONGO_URL environment variable")
        print("   export MONGO_URL='your-mongodb-connection-string'")
        sys.exit(1)
    
    # Connect to MongoDB
    print(f"\n🔵 Connecting to MongoDB...")
    print(f"   Database: {DB_NAME}")
    try:
        mongo_client = MongoClient(MONGO_URL)
        mongo_db = mongo_client[DB_NAME]
        # Test connection
        mongo_client.server_info()
        print("   ✅ MongoDB connected")
    except Exception as e:
        print(f"   ❌ MongoDB connection failed: {str(e)}")
        sys.exit(1)
    
    # Connect to DynamoDB
    print(f"\n🔵 Connecting to DynamoDB...")
    print(f"   Region: {AWS_REGION}")
    try:
        dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
        print("   ✅ DynamoDB connected")
    except Exception as e:
        print(f"   ❌ DynamoDB connection failed: {str(e)}")
        sys.exit(1)
    
    # Get list of MongoDB collections
    print(f"\n🔍 Scanning MongoDB collections...")
    mongo_collections = mongo_db.list_collection_names()
    print(f"   Found {len(mongo_collections)} collections")
    
    # Migrate each collection
    print(f"\n🚀 Starting migration...")
    total_migrated = 0
    
    for collection_name, table_name in COLLECTION_TABLE_MAP.items():
        if collection_name in mongo_collections:
            count = migrate_collection(mongo_db, dynamodb, collection_name, table_name)
            total_migrated += count
        else:
            print(f"\n⚠️  Collection '{collection_name}' not found in MongoDB")
    
    # Verification
    print(f"\n\n🔍 Verifying migration...")
    print("=" * 60)
    all_verified = True
    
    for collection_name, table_name in COLLECTION_TABLE_MAP.items():
        if collection_name in mongo_collections:
            print(f"\n{collection_name} -> {table_name}:")
            verified = verify_migration(mongo_db, dynamodb, collection_name, table_name)
            all_verified = all_verified and verified
    
    # Summary
    print("\n" + "=" * 60)
    print("MIGRATION SUMMARY")
    print("=" * 60)
    print(f"Total documents migrated: {total_migrated}")
    print(f"Verification status: {'✅ PASSED' if all_verified else '⚠️ REVIEW NEEDED'}")
    print("\nNext steps:")
    print("1. Update your backend environment to use DynamoDB")
    print("2. Test the application thoroughly")
    print("3. Keep MongoDB as backup until confident")
    print("=" * 60)
    
    mongo_client.close()


if __name__ == "__main__":
    main()


