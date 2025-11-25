#!/usr/bin/env python3
"""
Import MongoDB Backup to DynamoDB
Reads JSON backup files and imports them into DynamoDB tables
"""

import os
import sys
import json
from pathlib import Path
from decimal import Decimal
import boto3
from botocore.exceptions import ClientError

# Configuration
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


def convert_mongodb_document(doc):
    """Convert MongoDB document to DynamoDB item"""
    item = {}
    
    for key, value in doc.items():
        if key == '_id':
            # Convert MongoDB _id to string id
            if isinstance(value, dict) and '$oid' in value:
                item['id'] = value['$oid']
            elif isinstance(value, str):
                item['id'] = value
            else:
                item['id'] = str(value)
        else:
            # Handle MongoDB-specific types
            if isinstance(value, dict):
                if '$date' in value:
                    # MongoDB date -> ISO string
                    item[key] = value['$date']
                elif '$numberDecimal' in value:
                    # MongoDB Decimal128 -> DynamoDB Decimal
                    item[key] = Decimal(value['$numberDecimal'])
                elif '$numberLong' in value:
                    # MongoDB Long -> Python int
                    item[key] = int(value['$numberLong'])
                elif '$numberInt' in value:
                    # MongoDB Int -> Python int
                    item[key] = int(value['$numberInt'])
                else:
                    # Regular nested dict
                    item[key] = convert_mongodb_document(value)
            elif isinstance(value, list):
                # Process lists recursively
                item[key] = [convert_mongodb_document(v) if isinstance(v, dict) else v for v in value]
            else:
                item[key] = value
    
    # Convert floats to Decimal
    item = convert_floats_to_decimal(item)
    
    return item


def import_file(dynamodb, json_file, table_name):
    """Import a JSON backup file into DynamoDB table"""
    print(f"\n📦 Importing {json_file.name} -> {table_name}")
    
    try:
        # Read JSON file
        with open(json_file, 'r') as f:
            documents = json.load(f)
        
        if not documents:
            print(f"   ℹ️  No documents in file")
            return 0
        
        total = len(documents)
        print(f"   Found {total} documents")
        
        table = dynamodb.Table(table_name)
        
        # Import in batches
        batch_size = 25  # DynamoDB batch limit
        imported = 0
        failed = 0
        
        for i in range(0, total, batch_size):
            batch = documents[i:i + batch_size]
            
            with table.batch_writer() as writer:
                for doc in batch:
                    try:
                        # Convert MongoDB document to DynamoDB item
                        item = convert_mongodb_document(doc)
                        
                        # Ensure 'id' field exists
                        if 'id' not in item:
                            print(f"   ⚠️  Skipping document without id: {doc}")
                            failed += 1
                            continue
                        
                        # Special handling for users table (uses 'mobile' as primary key)
                        if table_name == 'arbrit-users':
                            if 'mobile' not in item:
                                print(f"   ⚠️  Skipping user without mobile: {item.get('id', 'unknown')}")
                                failed += 1
                                continue
                        
                        # Write to DynamoDB
                        writer.put_item(Item=item)
                        imported += 1
                        
                    except Exception as e:
                        print(f"   ❌ Error importing document: {str(e)}")
                        if 'id' in item:
                            print(f"      Document ID: {item['id']}")
                        failed += 1
            
            # Progress update
            progress = min(i + batch_size, total)
            print(f"   Progress: {progress}/{total} ({(progress/total)*100:.1f}%)")
        
        print(f"   ✅ Imported {imported} documents ({failed} failed)")
        return imported
        
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return 0


def verify_import(dynamodb, table_name, expected_count):
    """Verify import by checking DynamoDB table count"""
    try:
        table = dynamodb.Table(table_name)
        
        response = table.scan(Select='COUNT')
        actual_count = response['Count']
        
        # Handle pagination
        while 'LastEvaluatedKey' in response:
            response = table.scan(
                Select='COUNT',
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            actual_count += response['Count']
        
        match = "✅" if expected_count == actual_count else "⚠️"
        print(f"   {match} Expected: {expected_count} | Actual: {actual_count}")
        
        return expected_count == actual_count
        
    except Exception as e:
        print(f"   ❌ Verification error: {str(e)}")
        return False


def main():
    """Main import function"""
    
    # Check command line arguments
    if len(sys.argv) < 2:
        print("=" * 60)
        print("Import MongoDB Backup to DynamoDB")
        print("=" * 60)
        print()
        print("Usage:")
        print(f"  python3 {sys.argv[0]} <backup-directory>")
        print()
        print("Example:")
        print(f"  python3 {sys.argv[0]} mongodb-backup-20241121-143000")
        print()
        sys.exit(1)
    
    backup_dir = Path(sys.argv[1])
    
    print("=" * 60)
    print("Import MongoDB Backup to DynamoDB")
    print("=" * 60)
    print()
    
    # Check if backup directory exists
    if not backup_dir.exists():
        print(f"❌ ERROR: Backup directory not found: {backup_dir}")
        sys.exit(1)
    
    print(f"📁 Backup directory: {backup_dir}")
    print(f"🔵 AWS Region: {AWS_REGION}")
    print()
    
    # Connect to DynamoDB
    print("🔵 Connecting to DynamoDB...")
    try:
        dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
        # Test connection by listing tables
        client = boto3.client('dynamodb', region_name=AWS_REGION)
        client.list_tables()
        print("   ✅ Connected")
    except Exception as e:
        print(f"   ❌ Connection failed: {str(e)}")
        sys.exit(1)
    
    # Find JSON files
    json_files = list(backup_dir.glob("*.json"))
    if not json_files:
        print(f"❌ ERROR: No JSON files found in {backup_dir}")
        sys.exit(1)
    
    print(f"   Found {len(json_files)} backup files")
    
    # Import files
    print()
    print("🚀 Starting import...")
    print("=" * 60)
    
    import_summary = []
    total_imported = 0
    
    for json_file in sorted(json_files):
        collection_name = json_file.stem  # filename without .json
        
        if collection_name in COLLECTION_TABLE_MAP:
            table_name = COLLECTION_TABLE_MAP[collection_name]
            count = import_file(dynamodb, json_file, table_name)
            total_imported += count
            import_summary.append({
                'collection': collection_name,
                'table': table_name,
                'count': count,
                'file': json_file
            })
        else:
            print(f"\n⚠️  Skipping unknown collection: {collection_name}")
    
    # Verification
    print()
    print()
    print("🔍 Verifying import...")
    print("=" * 60)
    all_verified = True
    
    for item in import_summary:
        print(f"\n{item['collection']} -> {item['table']}:")
        verified = verify_import(dynamodb, item['table'], item['count'])
        all_verified = all_verified and verified
    
    # Summary
    print()
    print("=" * 60)
    print("IMPORT SUMMARY")
    print("=" * 60)
    print(f"Total documents imported: {total_imported}")
    print(f"Tables updated: {len(import_summary)}")
    print(f"Verification status: {'✅ PASSED' if all_verified else '⚠️ REVIEW NEEDED'}")
    print()
    print("Imported collections:")
    for item in import_summary:
        print(f"  ✅ {item['collection']}: {item['count']} documents")
    print()
    print("Next steps:")
    print("1. Test your application with DynamoDB")
    print("2. Verify all functionality works")
    print("3. Keep MongoDB backup files safe")
    print("=" * 60)


if __name__ == "__main__":
    main()


