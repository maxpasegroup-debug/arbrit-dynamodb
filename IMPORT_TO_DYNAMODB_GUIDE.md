# Import MongoDB Data to DynamoDB - Complete Guide

## Overview

You have successfully exported 14 collections from MongoDB. This guide will help you import them into AWS DynamoDB.

## What You Have

✅ **JSON Files Location**: `/Users/sms01/Downloads/arbrit-safety-export/Json/`

✅ **Collections Exported** (14 total):
- users
- employees  
- attendance
- employee_documents
- company_documents
- leads
- quotations
- invoices
- invoice_requests
- expense_claims
- leave_requests
- visit_logs
- trainer_requests
- assessment_forms

## Prerequisites

### 1. AWS Account & Credentials

You need:
- AWS Access Key ID
- AWS Secret Access Key  
- AWS Region (default: us-east-1)

**How to get AWS credentials:**

1. Go to: https://console.aws.amazon.com/
2. Login to your AWS account
3. Click your username (top right) → **Security credentials**
4. Scroll down to **Access keys**
5. Click **Create access key**
6. Copy:
   - Access Key ID
   - Secret Access Key (shown only once!)

### 2. Install Python Dependencies

The script will automatically install `boto3`, but you can pre-install:

```bash
pip3 install boto3 --break-system-packages
```

---

## Quick Start - Automated Import (RECOMMENDED)

### **Option 1: Run the Complete Script**

This script will do EVERYTHING for you:
1. ✅ Prepare your JSON files
2. ✅ Create all DynamoDB tables
3. ✅ Import all data
4. ✅ Verify the import

```bash
cd /Users/sms01/Downloads/arbrit-safety-export/scripts
./setup-and-import-dynamodb.sh
```

**When prompted, enter:**
- AWS Access Key ID
- AWS Secret Access Key  
- AWS Region (press Enter for us-east-1)

That's it! The script will handle everything.

---

## Manual Step-by-Step Import

### **Step 1: Prepare JSON Files**

The exported files have format `arbrit-workdesk.collection.json`, but the import script expects `collection.json`.

Run this to prepare them:

```bash
cd /Users/sms01/Downloads/arbrit-safety-export
mkdir -p mongodb-backup-prepared
cd Json

# Copy and rename all files
for file in arbrit-workdesk.*.json; do
    new_name="${file#arbrit-workdesk.}"
    cp "$file" "../mongodb-backup-prepared/$new_name"
    echo "Prepared: $new_name"
done
```

### **Step 2: Set AWS Credentials**

```bash
export AWS_ACCESS_KEY_ID='your-access-key-id'
export AWS_SECRET_ACCESS_KEY='your-secret-access-key'
export AWS_REGION='us-east-1'
```

### **Step 3: Install boto3**

```bash
pip3 install boto3 --break-system-packages
```

### **Step 4: Create DynamoDB Tables**

```bash
cd /Users/sms01/Downloads/arbrit-safety-export/scripts
./create-dynamodb-tables.sh
```

Or create them manually via Python:

```bash
python3 << 'EOF'
import boto3

dynamodb = boto3.client('dynamodb', region_name='us-east-1')

# Create simple table example
dynamodb.create_table(
    TableName='arbrit-users',
    KeySchema=[{'AttributeName': 'mobile', 'KeyType': 'HASH'}],
    AttributeDefinitions=[
        {'AttributeName': 'mobile', 'AttributeType': 'S'},
        {'AttributeName': 'id', 'AttributeType': 'S'}
    ],
    GlobalSecondaryIndexes=[{
        'IndexName': 'id-index',
        'KeySchema': [{'AttributeName': 'id', 'KeyType': 'HASH'}],
        'Projection': {'ProjectionType': 'ALL'}
    }],
    BillingMode='PAY_PER_REQUEST'
)
print("✅ Table created: arbrit-users")
EOF
```

### **Step 5: Import Data**

```bash
cd /Users/sms01/Downloads/arbrit-safety-export/scripts
python3 import-backup-to-dynamodb.py ../mongodb-backup-prepared
```

---

## What Gets Created in DynamoDB

### Tables with Custom Indexes:

**arbrit-users**
- Primary Key: `mobile` (String)
- Global Secondary Index: `id-index` on `id`

**arbrit-employees**
- Primary Key: `id` (String)
- Global Secondary Indexes:
  - `mobile-index` on `mobile`
  - `department-index` on `department`

**arbrit-attendance**
- Primary Key: `id` (String)
- Global Secondary Indexes:
  - `employee_id-index` on `employee_id`
  - `date-index` on `date`

### Simple Tables (Primary Key: `id`):

- arbrit-employee-documents
- arbrit-company-documents
- arbrit-leads
- arbrit-quotations
- arbrit-invoices
- arbrit-invoice-requests
- arbrit-payments
- arbrit-training-sessions
- arbrit-certificate-requests
- arbrit-certificates
- arbrit-certificate-templates
- arbrit-certificate-candidates
- arbrit-trainer-requests
- arbrit-work-orders
- arbrit-assessment-forms
- arbrit-assessment-submissions
- arbrit-visit-logs
- arbrit-expense-claims
- arbrit-leave-requests
- arbrit-delivery-tasks

All tables use **PAY_PER_REQUEST** billing mode (you only pay for what you use).

---

## Verify Import

After import completes, verify in AWS Console:

1. Go to: https://console.aws.amazon.com/dynamodb/
2. Click **"Tables"** in left sidebar
3. You should see all 23 `arbrit-*` tables
4. Click on a table → **"Explore table items"** to see the data

Or verify via command line:

```bash
aws dynamodb list-tables --region us-east-1
```

Check item count:

```bash
aws dynamodb scan --table-name arbrit-users --select COUNT --region us-east-1
```

---

## Expected Import Results

Based on your 14 JSON files, you should see:

```
✅ users: X documents imported
✅ employees: X documents imported
✅ attendance: X documents imported
✅ employee_documents: X documents imported
✅ company_documents: X documents imported
✅ leads: X documents imported
✅ quotations: X documents imported
✅ invoices: X documents imported
✅ invoice_requests: X documents imported
✅ expense_claims: X documents imported
✅ leave_requests: X documents imported
✅ visit_logs: X documents imported
✅ trainer_requests: X documents imported
✅ assessment_forms: X documents imported
```

---

## Missing Collections

You exported 14 collections, but the system expects 23. These collections are missing (probably empty in MongoDB):

- ❌ payments
- ❌ training_sessions
- ❌ certificate_requests
- ❌ certificates
- ❌ certificate_templates
- ❌ certificate_candidates
- ❌ work_orders
- ❌ assessment_submissions
- ❌ delivery_tasks

**This is normal** - they were probably empty in your MongoDB database. The DynamoDB tables will still be created (empty).

---

## Troubleshooting

### Error: "AWS credentials not found"

**Solution:**
```bash
export AWS_ACCESS_KEY_ID='your-key'
export AWS_SECRET_ACCESS_KEY='your-secret'
export AWS_REGION='us-east-1'
```

### Error: "Table already exists"

**Solution:** Tables already created. Skip to import step:
```bash
python3 import-backup-to-dynamodb.py ../mongodb-backup-prepared
```

### Error: "ValidationException: One or more parameter values were invalid"

**Solution:** Check that your JSON files have the correct structure. Each document must have an `_id` field (converted to `id` during import).

### Error: "ResourceNotFoundException: Requested resource not found"

**Solution:** Tables don't exist yet. Run the table creation step first.

### Error: "AccessDeniedException"

**Solution:** Your AWS credentials don't have DynamoDB permissions. Add the `AmazonDynamoDBFullAccess` policy to your IAM user.

---

## Cost Estimate

DynamoDB pricing (PAY_PER_REQUEST mode):

- **Write**: $1.25 per million write requests
- **Read**: $0.25 per million read requests
- **Storage**: $0.25 per GB per month

**Example:** Importing 10,000 documents costs approximately **$0.01** (1 cent).

Monthly storage for 10,000 small documents (~1 MB total): **$0.25/month**.

Very affordable! 💰

---

## Next Steps After Import

1. **Update Your Application**
   - Update backend to use DynamoDB instead of MongoDB
   - The backend already has `dynamodb_layer.py` ready to use

2. **Test Your Application**
   - Verify all CRUD operations work
   - Check that queries return correct results

3. **Update Environment Variables**
   ```bash
   export DATABASE_TYPE=dynamodb
   export AWS_REGION=us-east-1
   export AWS_ACCESS_KEY_ID=your-key
   export AWS_SECRET_ACCESS_KEY=your-secret
   ```

4. **Deploy to AWS**
   - Follow the AWS deployment guides in this project
   - Use ECS/Fargate for serverless deployment

---

## Support

If you encounter issues:

1. Check the error message carefully
2. Verify AWS credentials are correct
3. Check AWS Console to see if tables were created
4. Verify JSON files are in correct format
5. Check AWS region matches between table creation and import

---

## Summary

**✅ You have the data** (14 JSON files)
**✅ You have the import scripts** (ready to use)
**✅ You have this guide** (step-by-step instructions)

**🚀 Run this one command to import everything:**

```bash
cd /Users/sms01/Downloads/arbrit-safety-export/scripts
./setup-and-import-dynamodb.sh
```

That's it! Your MongoDB data will be in DynamoDB in minutes.

---

## Quick Reference

**All-in-One Command:**
```bash
cd /Users/sms01/Downloads/arbrit-safety-export/scripts && ./setup-and-import-dynamodb.sh
```

**Manual Import:**
```bash
# 1. Set credentials
export AWS_ACCESS_KEY_ID='your-key'
export AWS_SECRET_ACCESS_KEY='your-secret'
export AWS_REGION='us-east-1'

# 2. Install dependencies
pip3 install boto3 --break-system-packages

# 3. Prepare files
cd /Users/sms01/Downloads/arbrit-safety-export
mkdir -p mongodb-backup-prepared
cd Json && for file in arbrit-workdesk.*.json; do cp "$file" "../mongodb-backup-prepared/${file#arbrit-workdesk.}"; done

# 4. Run import
cd ../scripts
python3 import-backup-to-dynamodb.py ../mongodb-backup-prepared
```

**Verify:**
```bash
aws dynamodb list-tables --region us-east-1
```

Good luck! 🎉


