#!/bin/bash
# EC2 Instance - DynamoDB Import Script
# Run this script on an EC2 instance to import MongoDB JSON data to DynamoDB
# 
# Prerequisites:
# 1. EC2 instance with IAM role that has DynamoDB full access
# 2. JSON backup files uploaded to the instance
# 3. Python 3 installed (Amazon Linux 2023 has it by default)

set -e

echo "============================================================"
echo "EC2 DynamoDB Import Script"
echo "============================================================"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo "⚠️  Running as root. Consider using a non-root user."
    echo ""
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    echo "🖥️  Operating System: $OS"
else
    echo "⚠️  Cannot detect OS"
    OS="Unknown"
fi
echo ""

# Step 1: Install dependencies
echo "============================================================"
echo "STEP 1: Installing Dependencies"
echo "============================================================"
echo ""

echo "Updating system packages..."
if [[ "$OS" == *"Amazon Linux"* ]]; then
    sudo yum update -y
    echo "Installing Python 3 and pip..."
    sudo yum install -y python3 python3-pip
elif [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    sudo apt-get update -y
    echo "Installing Python 3 and pip..."
    sudo apt-get install -y python3 python3-pip
elif [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"CentOS"* ]]; then
    sudo yum update -y
    echo "Installing Python 3 and pip..."
    sudo yum install -y python3 python3-pip
else
    echo "⚠️  Unknown OS. Attempting to continue..."
fi

echo ""
echo "Installing boto3..."
pip3 install boto3 --user --quiet

echo ""
echo "✅ Dependencies installed"
echo ""

# Step 2: Check AWS credentials/IAM role
echo "============================================================"
echo "STEP 2: Checking AWS Configuration"
echo "============================================================"
echo ""

# Try to get instance metadata (works if running on EC2)
echo "Checking if running on EC2 with IAM role..."
if curl -s --connect-timeout 2 http://169.254.169.254/latest/meta-data/iam/security-credentials/ > /dev/null 2>&1; then
    ROLE_NAME=$(curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/)
    if [ ! -z "$ROLE_NAME" ]; then
        echo "✅ EC2 instance has IAM role: $ROLE_NAME"
        echo "   Will use IAM role for AWS authentication"
        USE_IAM_ROLE=true
    else
        echo "⚠️  No IAM role found"
        USE_IAM_ROLE=false
    fi
else
    echo "⚠️  Not running on EC2 or no instance metadata available"
    USE_IAM_ROLE=false
fi

# If no IAM role, check for environment variables
if [ "$USE_IAM_ROLE" = false ]; then
    if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
        echo ""
        echo "❌ ERROR: No AWS credentials found!"
        echo ""
        echo "Options:"
        echo "1. Attach an IAM role to this EC2 instance (recommended)"
        echo "2. Set environment variables:"
        echo "   export AWS_ACCESS_KEY_ID='your-key'"
        echo "   export AWS_SECRET_ACCESS_KEY='your-secret'"
        echo "   export AWS_REGION='us-east-1'"
        echo ""
        exit 1
    else
        echo "✅ Using AWS credentials from environment variables"
    fi
fi

AWS_REGION=${AWS_REGION:-us-east-1}
echo "   AWS Region: $AWS_REGION"
echo ""

# Step 3: Locate JSON files
echo "============================================================"
echo "STEP 3: Locating JSON Backup Files"
echo "============================================================"
echo ""

# Check common locations
POSSIBLE_DIRS=(
    "$HOME/mongodb-backup"
    "$HOME/Json"
    "$HOME/arbrit-export/Json"
    "/home/ec2-user/mongodb-backup"
    "/home/ec2-user/Json"
    "/tmp/mongodb-backup"
    "./Json"
    "./mongodb-backup"
    "."
)

JSON_DIR=""
for dir in "${POSSIBLE_DIRS[@]}"; do
    if [ -d "$dir" ] && [ "$(ls -A $dir/*.json 2>/dev/null | wc -l)" -gt 0 ]; then
        JSON_DIR="$dir"
        echo "✅ Found JSON files in: $JSON_DIR"
        break
    fi
done

if [ -z "$JSON_DIR" ]; then
    echo "❌ ERROR: No JSON files found in common locations"
    echo ""
    echo "Please upload your JSON files to one of these locations:"
    echo "  - $HOME/mongodb-backup/"
    echo "  - $HOME/Json/"
    echo "  - /tmp/mongodb-backup/"
    echo ""
    echo "You can use SCP to upload files:"
    echo "  scp -i your-key.pem -r /path/to/Json/ ec2-user@your-ec2-ip:~/Json/"
    echo ""
    exit 1
fi

# Count JSON files
json_count=$(ls -1 "$JSON_DIR"/*.json 2>/dev/null | wc -l)
echo "   Found $json_count JSON file(s)"
echo ""

# Step 4: Prepare JSON files
echo "============================================================"
echo "STEP 4: Preparing JSON Files"
echo "============================================================"
echo ""

BACKUP_DIR="$HOME/mongodb-backup-prepared"
rm -rf "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

cd "$JSON_DIR"
for file in *.json; do
    if [ -f "$file" ]; then
        # Remove 'arbrit-workdesk.' prefix if present
        new_name="${file#arbrit-workdesk.}"
        echo "  Preparing: $file -> $new_name"
        cp "$file" "$BACKUP_DIR/$new_name"
    fi
done

echo ""
echo "✅ JSON files prepared in: $BACKUP_DIR"
echo ""

# Step 5: Create import script
echo "============================================================"
echo "STEP 5: Creating Import Script"
echo "============================================================"
echo ""

IMPORT_SCRIPT="$HOME/import-to-dynamodb.py"

cat > "$IMPORT_SCRIPT" << 'PYTHON_IMPORT_SCRIPT'
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
                    item[key] = value['$date']
                elif '$numberDecimal' in value:
                    item[key] = Decimal(value['$numberDecimal'])
                elif '$numberLong' in value:
                    item[key] = int(value['$numberLong'])
                elif '$numberInt' in value:
                    item[key] = int(value['$numberInt'])
                else:
                    item[key] = convert_mongodb_document(value)
            elif isinstance(value, list):
                item[key] = [convert_mongodb_document(v) if isinstance(v, dict) else v for v in value]
            else:
                item[key] = value
    
    item = convert_floats_to_decimal(item)
    return item


def import_file(dynamodb, json_file, table_name):
    """Import a JSON backup file into DynamoDB table"""
    print(f"\n📦 Importing {json_file.name} -> {table_name}")
    
    try:
        with open(json_file, 'r') as f:
            documents = json.load(f)
        
        if not documents:
            print(f"   ℹ️  No documents in file")
            return 0
        
        total = len(documents)
        print(f"   Found {total} documents")
        
        table = dynamodb.Table(table_name)
        
        batch_size = 25
        imported = 0
        failed = 0
        
        for i in range(0, total, batch_size):
            batch = documents[i:i + batch_size]
            
            with table.batch_writer() as writer:
                for doc in batch:
                    try:
                        item = convert_mongodb_document(doc)
                        
                        if 'id' not in item:
                            failed += 1
                            continue
                        
                        if table_name == 'arbrit-users':
                            if 'mobile' not in item:
                                failed += 1
                                continue
                        
                        writer.put_item(Item=item)
                        imported += 1
                        
                    except Exception as e:
                        print(f"   ❌ Error importing document: {str(e)}")
                        failed += 1
            
            progress = min(i + batch_size, total)
            print(f"   Progress: {progress}/{total} ({(progress/total)*100:.1f}%)")
        
        print(f"   ✅ Imported {imported} documents ({failed} failed)")
        return imported
        
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return 0


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 import-to-dynamodb.py <backup-directory>")
        sys.exit(1)
    
    backup_dir = Path(sys.argv[1])
    
    print("=" * 60)
    print("Import MongoDB Backup to DynamoDB")
    print("=" * 60)
    print()
    
    if not backup_dir.exists():
        print(f"❌ ERROR: Backup directory not found: {backup_dir}")
        sys.exit(1)
    
    print(f"📁 Backup directory: {backup_dir}")
    print(f"🔵 AWS Region: {AWS_REGION}")
    print()
    
    print("🔵 Connecting to DynamoDB...")
    try:
        dynamodb = boto3.resource('dynamodb', region_name=AWS_REGION)
        client = boto3.client('dynamodb', region_name=AWS_REGION)
        client.list_tables()
        print("   ✅ Connected")
    except Exception as e:
        print(f"   ❌ Connection failed: {str(e)}")
        sys.exit(1)
    
    json_files = list(backup_dir.glob("*.json"))
    if not json_files:
        print(f"❌ ERROR: No JSON files found in {backup_dir}")
        sys.exit(1)
    
    print(f"   Found {len(json_files)} backup files")
    
    print()
    print("🚀 Starting import...")
    print("=" * 60)
    
    total_imported = 0
    
    for json_file in sorted(json_files):
        collection_name = json_file.stem
        
        if collection_name in COLLECTION_TABLE_MAP:
            table_name = COLLECTION_TABLE_MAP[collection_name]
            count = import_file(dynamodb, json_file, table_name)
            total_imported += count
        else:
            print(f"\n⚠️  Skipping unknown collection: {collection_name}")
    
    print()
    print("=" * 60)
    print(f"✅ IMPORT COMPLETE!")
    print(f"Total documents imported: {total_imported}")
    print("=" * 60)


if __name__ == "__main__":
    main()

PYTHON_IMPORT_SCRIPT

chmod +x "$IMPORT_SCRIPT"
echo "✅ Import script created: $IMPORT_SCRIPT"
echo ""

# Step 6: Create DynamoDB tables
echo "============================================================"
echo "STEP 6: Creating DynamoDB Tables"
echo "============================================================"
echo ""

python3 << 'CREATE_TABLES'
import boto3
import os
import sys
from botocore.exceptions import ClientError

AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

TABLES = [
    {
        "TableName": "arbrit-users",
        "KeySchema": [{"AttributeName": "mobile", "KeyType": "HASH"}],
        "AttributeDefinitions": [
            {"AttributeName": "mobile", "AttributeType": "S"},
            {"AttributeName": "id", "AttributeType": "S"}
        ],
        "GlobalSecondaryIndexes": [{
            "IndexName": "id-index",
            "KeySchema": [{"AttributeName": "id", "KeyType": "HASH"}],
            "Projection": {"ProjectionType": "ALL"}
        }],
        "BillingMode": "PAY_PER_REQUEST"
    },
    {
        "TableName": "arbrit-employees",
        "KeySchema": [{"AttributeName": "id", "KeyType": "HASH"}],
        "AttributeDefinitions": [
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "mobile", "AttributeType": "S"},
            {"AttributeName": "department", "AttributeType": "S"}
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "mobile-index",
                "KeySchema": [{"AttributeName": "mobile", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"}
            },
            {
                "IndexName": "department-index",
                "KeySchema": [{"AttributeName": "department", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"}
            }
        ],
        "BillingMode": "PAY_PER_REQUEST"
    },
    {
        "TableName": "arbrit-attendance",
        "KeySchema": [{"AttributeName": "id", "KeyType": "HASH"}],
        "AttributeDefinitions": [
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": "employee_id", "AttributeType": "S"},
            {"AttributeName": "date", "AttributeType": "S"}
        ],
        "GlobalSecondaryIndexes": [
            {
                "IndexName": "employee_id-index",
                "KeySchema": [{"AttributeName": "employee_id", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"}
            },
            {
                "IndexName": "date-index",
                "KeySchema": [{"AttributeName": "date", "KeyType": "HASH"}],
                "Projection": {"ProjectionType": "ALL"}
            }
        ],
        "BillingMode": "PAY_PER_REQUEST"
    }
]

SIMPLE_TABLES = [
    "arbrit-employee-documents", "arbrit-company-documents", "arbrit-leads",
    "arbrit-quotations", "arbrit-invoices", "arbrit-invoice-requests",
    "arbrit-payments", "arbrit-training-sessions", "arbrit-certificate-requests",
    "arbrit-certificates", "arbrit-certificate-templates", "arbrit-certificate-candidates",
    "arbrit-trainer-requests", "arbrit-work-orders", "arbrit-assessment-forms",
    "arbrit-assessment-submissions", "arbrit-visit-logs", "arbrit-expense-claims",
    "arbrit-leave-requests", "arbrit-delivery-tasks"
]

try:
    dynamodb = boto3.client('dynamodb', region_name=AWS_REGION)
    existing_tables = dynamodb.list_tables()['TableNames']
    
    created = 0
    skipped = 0
    
    for table_def in TABLES:
        table_name = table_def['TableName']
        if table_name in existing_tables:
            print(f"   ⏭️  Table already exists: {table_name}")
            skipped += 1
        else:
            print(f"   Creating table: {table_name}...")
            dynamodb.create_table(**table_def)
            created += 1
            print(f"   ✅ Created: {table_name}")
    
    for table_name in SIMPLE_TABLES:
        if table_name in existing_tables:
            print(f"   ⏭️  Table already exists: {table_name}")
            skipped += 1
        else:
            print(f"   Creating table: {table_name}...")
            dynamodb.create_table(
                TableName=table_name,
                KeySchema=[{"AttributeName": "id", "KeyType": "HASH"}],
                AttributeDefinitions=[{"AttributeName": "id", "AttributeType": "S"}],
                BillingMode="PAY_PER_REQUEST"
            )
            created += 1
            print(f"   ✅ Created: {table_name}")
    
    print(f"\n✅ Tables created: {created}")
    print(f"⏭️  Tables skipped: {skipped}")
    
    if created > 0:
        print("\n⏳ Waiting 30 seconds for tables to become active...")
        import time
        time.sleep(30)
    
except Exception as e:
    print(f"\n❌ Error creating tables: {str(e)}")
    sys.exit(1)

CREATE_TABLES

echo ""

# Step 7: Import data
echo "============================================================"
echo "STEP 7: Importing Data to DynamoDB"
echo "============================================================"
echo ""

python3 "$IMPORT_SCRIPT" "$BACKUP_DIR"

echo ""
echo "============================================================"
echo "✅ EC2 IMPORT COMPLETE!"
echo "============================================================"
echo ""
echo "Your MongoDB data has been imported to DynamoDB."
echo ""
echo "View your data:"
echo "  https://console.aws.amazon.com/dynamodb/"
echo ""
echo "Verify import:"
echo "  aws dynamodb list-tables --region $AWS_REGION"
echo "  aws dynamodb scan --table-name arbrit-users --select COUNT --region $AWS_REGION"
echo ""

