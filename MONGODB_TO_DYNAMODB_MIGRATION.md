# MongoDB to DynamoDB Migration Guide

This guide will help you migrate your existing MongoDB data to DynamoDB.

## Overview

You need to:
1. ✅ **DONE**: Create DynamoDB tables (you've already done this!)
2. 🔄 **NEXT**: Export data from MongoDB
3. 🔄 **NEXT**: Import data into DynamoDB
4. ✅ Test the application with DynamoDB
5. ✅ Keep MongoDB as backup until confident

---

## Prerequisites

Before starting, you need:

1. **MongoDB Connection String**: Your existing MongoDB URL
2. **AWS Credentials**: Already configured on your EC2 instance
3. **Python 3.8+**: Already installed
4. **DynamoDB Tables**: ✅ Already created!

---

## Migration Options

### Option A: Automated Migration (Recommended)

Use the provided Python script to migrate all data automatically.

#### Step 1: Install Migration Dependencies

On your EC2 instance:

```bash
cd /home/ec2-user
pip3 install pymongo boto3 python-dotenv --user
```

#### Step 2: Set MongoDB Connection

```bash
# Export your MongoDB connection string
export MONGO_URL="mongodb+srv://username:password@cluster.mongodb.net/arbrit-workdesk?retryWrites=true&w=majority"
export DB_NAME="arbrit-workdesk"
export AWS_REGION="us-east-1"
```

**IMPORTANT:** Replace the MONGO_URL with your actual MongoDB connection string!

#### Step 3: Upload Migration Script

From your Mac:

```bash
cd /Users/sms01/Downloads/arbrit-safety-export
scp -i /Users/sms01/Desktop/Max/arbrit-key.pem scripts/migrate-mongodb-to-dynamodb.py ec2-user@44.200.111.147:~/
```

#### Step 4: Run Migration

On EC2:

```bash
cd /home/ec2-user
chmod +x migrate-mongodb-to-dynamodb.py
python3 migrate-mongodb-to-dynamodb.py
```

The script will:
- Connect to MongoDB and DynamoDB
- Migrate all collections to corresponding DynamoDB tables
- Show progress for each collection
- Verify counts match
- Provide a summary

#### Expected Output:

```
============================================================
MongoDB to DynamoDB Migration
Arbrit Safety Management System
============================================================

🔵 Connecting to MongoDB...
   Database: arbrit-workdesk
   ✅ MongoDB connected

🔵 Connecting to DynamoDB...
   Region: us-east-1
   ✅ DynamoDB connected

🔍 Scanning MongoDB collections...
   Found 23 collections

🚀 Starting migration...

📦 Migrating users -> arbrit-users
   Found 15 documents
   Progress: 15/15 (100.0%)
   ✅ Migrated 15 documents (0 failed)

📦 Migrating employees -> arbrit-employees
   Found 45 documents
   Progress: 45/45 (100.0%)
   ✅ Migrated 45 documents (0 failed)

... [continues for all collections]

🔍 Verifying migration...
============================================================

users -> arbrit-users:
   ✅ MongoDB: 15 | DynamoDB: 15

employees -> arbrit-employees:
   ✅ MongoDB: 45 | DynamoDB: 45

... [continues for all collections]

============================================================
MIGRATION SUMMARY
============================================================
Total documents migrated: 1,234
Verification status: ✅ PASSED

Next steps:
1. Update your backend environment to use DynamoDB
2. Test the application thoroughly
3. Keep MongoDB as backup until confident
============================================================
```

---

### Option B: Manual Export/Import

If you prefer manual control or the automated script doesn't work.

#### Step 1: Export from MongoDB

```bash
# On a machine with mongoexport installed
mongoexport --uri="mongodb+srv://username:password@cluster.mongodb.net/arbrit-workdesk" \
  --collection=users --out=users.json

mongoexport --uri="mongodb+srv://username:password@cluster.mongodb.net/arbrit-workdesk" \
  --collection=employees --out=employees.json

# Repeat for all collections...
```

#### Step 2: Convert and Import to DynamoDB

Create a simple Python script to read JSON and write to DynamoDB:

```python
import json
import boto3

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('arbrit-users')

with open('users.json', 'r') as f:
    for line in f:
        doc = json.loads(line)
        # Convert _id to id
        doc['id'] = str(doc.pop('_id')['$oid'])
        table.put_item(Item=doc)

print("Done!")
```

---

## Data Mapping

The migration handles these transformations automatically:

### Collection → Table Mapping

| MongoDB Collection | DynamoDB Table | Primary Key |
|-------------------|----------------|-------------|
| users | arbrit-users | mobile |
| employees | arbrit-employees | id |
| attendance | arbrit-attendance | id |
| employee_documents | arbrit-employee-documents | id |
| company_documents | arbrit-company-documents | id |
| leads | arbrit-leads | id |
| quotations | arbrit-quotations | id |
| invoices | arbrit-invoices | id |
| invoice_requests | arbrit-invoice-requests | id |
| payments | arbrit-payments | id |
| training_sessions | arbrit-training-sessions | id |
| certificate_requests | arbrit-certificate-requests | id |
| certificates | arbrit-certificates | id |
| certificate_templates | arbrit-certificate-templates | id |
| certificate_candidates | arbrit-certificate-candidates | id |
| trainer_requests | arbrit-trainer-requests | id |
| work_orders | arbrit-work-orders | id |
| assessment_forms | arbrit-assessment-forms | id |
| assessment_submissions | arbrit-assessment-submissions | id |
| visit_logs | arbrit-visit-logs | id |
| expense_claims | arbrit-expense-claims | id |
| leave_requests | arbrit-leave-requests | id |
| delivery_tasks | arbrit-delivery-tasks | id |

### Data Transformations

1. **ObjectId → String**: MongoDB `_id` (ObjectId) → DynamoDB `id` (String)
2. **Float → Decimal**: All floating-point numbers converted to Decimal
3. **Nested Objects**: Preserved as-is (DynamoDB supports nested JSON)
4. **Arrays**: Preserved as-is
5. **Dates**: Kept as ISO strings

---

## Verification

After migration, verify data:

```bash
# Check table item counts
aws dynamodb scan --table-name arbrit-users --select COUNT --region us-east-1
aws dynamodb scan --table-name arbrit-employees --select COUNT --region us-east-1
# ... repeat for other tables
```

Or check specific items:

```bash
# Get a specific user by mobile number
aws dynamodb get-item \
  --table-name arbrit-users \
  --key '{"mobile": {"S": "9876543210"}}' \
  --region us-east-1
```

---

## Testing

1. **Update Backend Configuration** (if not already using DynamoDB):
   - Your backend already uses `dynamodb_layer.py`
   - It will automatically use DynamoDB

2. **Test Critical Operations**:
   - Login
   - View employee list
   - Create a new lead
   - Generate a certificate
   - Submit attendance

3. **Monitor Logs**:
   ```bash
   docker logs -f arbrit-backend
   ```

---

## Rollback Plan

If something goes wrong:

1. **MongoDB is Still Running**: Just switch back to MongoDB connection
2. **Change environment variables**:
   ```bash
   # Uncomment MONGO_URL in your environment
   # Comment out DynamoDB settings
   ```
3. **Restart backend**
4. **No data lost** - MongoDB remains unchanged

---

## Common Issues

### Issue: "User not authorized to perform dynamodb:PutItem"

**Solution**: Add DynamoDB permissions to your EC2 IAM role (already done!)

### Issue: "ValidationException: One or more parameter values were invalid"

**Solution**: Usually means a required attribute is missing. Check:
- Users table requires `mobile` field
- All other tables require `id` field

### Issue: Migration script can't connect to MongoDB

**Solution**: Check:
- MongoDB connection string is correct
- Network allows connection (whitelist EC2 IP in MongoDB Atlas)
- Credentials are valid

### Issue: "ProvisionedThroughputExceededException"

**Solution**: We're using On-Demand billing, so this shouldn't happen. If it does:
```bash
aws dynamodb update-table \
  --table-name arbrit-users \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

---

## Performance Notes

- **Migration Time**: ~1-5 minutes for typical dataset (< 10,000 documents)
- **Batch Size**: 25 items per batch (DynamoDB limit)
- **Cost**: Minimal (mostly free tier eligible)
- **Downtime**: None required - MongoDB stays online

---

## Getting MongoDB Connection String

### If Using MongoDB Atlas:

1. Go to: https://cloud.mongodb.com/
2. Click your cluster
3. Click **Connect**
4. Choose **Connect your application**
5. Copy the connection string
6. Replace `<password>` with your actual password
7. Replace `<dbname>` with `arbrit-workdesk`

### If Using Self-Hosted MongoDB:

```bash
# Local MongoDB
export MONGO_URL="mongodb://localhost:27017/arbrit-workdesk"

# Remote MongoDB with auth
export MONGO_URL="mongodb://username:password@your-server:27017/arbrit-workdesk"
```

---

## Need Help?

If you encounter issues:

1. Check MongoDB connection from EC2:
   ```bash
   python3 -c "from pymongo import MongoClient; client = MongoClient('YOUR_MONGO_URL'); print(client.server_info())"
   ```

2. Check DynamoDB access:
   ```bash
   aws dynamodb list-tables --region us-east-1
   ```

3. Check migration script errors:
   ```bash
   python3 migrate-mongodb-to-dynamodb.py 2>&1 | tee migration.log
   ```

---

## After Successful Migration

1. ✅ Test application thoroughly (1-2 weeks)
2. ✅ Monitor DynamoDB metrics in CloudWatch
3. ✅ Verify costs are acceptable
4. ✅ Update documentation
5. ✅ **Keep MongoDB backup for 30 days** before considering deletion
6. ✅ Set up DynamoDB backups (Point-in-Time Recovery)

```bash
# Enable point-in-time recovery
aws dynamodb update-continuous-backups \
  --table-name arbrit-users \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --region us-east-1
```

---

## Summary Checklist

- [ ] DynamoDB tables created (✅ DONE!)
- [ ] Migration script uploaded to EC2
- [ ] MongoDB connection string configured
- [ ] Migration script executed successfully
- [ ] Verification passed
- [ ] Application tested
- [ ] MongoDB kept as backup
- [ ] DynamoDB backups enabled
- [ ] Documentation updated

**You're currently at step 1 (tables created). Next step: Run the migration!**


