# Backup-Based MongoDB to DynamoDB Migration

This guide shows you how to migrate using JSON backup files. This method is safer because you get permanent backup files!

## 🎯 Overview

**Process:**
1. Export MongoDB data to JSON files (backup)
2. Import JSON files into DynamoDB
3. Keep JSON files as permanent backup

**Advantages:**
- ✅ You get permanent backup files
- ✅ Can review data before importing
- ✅ Can re-import if something goes wrong
- ✅ Works offline after export
- ✅ No need to keep MongoDB connection open during import

---

## 📋 Prerequisites

**On your Mac or EC2:**
- Python 3.8+
- pymongo library (for backup)
- boto3 library (for import)
- Access to MongoDB
- AWS credentials configured

---

## 🚀 Step-by-Step Migration

### Step 1: Export MongoDB Data (Create Backup)

You have two options:

#### Option A: Python Script (Recommended - Works Everywhere)

```bash
# Install dependencies
pip3 install pymongo boto3 --user

# Set MongoDB connection
export MONGO_URL="mongodb+srv://username:password@cluster.mongodb.net/arbrit-workdesk?retryWrites=true&w=majority"
export DB_NAME="arbrit-workdesk"

# Run backup
python3 backup-mongodb.py
```

#### Option B: Shell Script (Requires mongoexport tool)

```bash
# Set MongoDB connection
export MONGO_URL="mongodb+srv://username:password@cluster.mongodb.net/arbrit-workdesk?retryWrites=true&w=majority"
export DB_NAME="arbrit-workdesk"

# Run backup
chmod +x backup-mongodb.sh
./backup-mongodb.sh
```

**Expected Output:**

```
============================================================
MongoDB Backup Script (Python)
============================================================

📁 Backup directory: mongodb-backup-20241121-143000
🔵 Database: arbrit-workdesk

🔵 Connecting to MongoDB...
   ✅ Connected

🚀 Starting backup...
============================================================

[1/23] Backing up: users
   ✅ Exported 15 documents (12.5KB)

[2/23] Backing up: employees
   ✅ Exported 45 documents (89.2KB)

[3/23] Backing up: leads
   ✅ Exported 127 documents (234.1KB)

... [continues for all collections]

============================================================
✅ Backup Complete!
============================================================

Backup location: mongodb-backup-20241121-143000
Total documents: 1,234

Files created:
  - users.json (12.5KB)
  - employees.json (89.2KB)
  - leads.json (234.1KB)
  ... [all files]

To import to DynamoDB:
  python3 import-backup-to-dynamodb.py mongodb-backup-20241121-143000

============================================================
```

**Result:** You now have a directory with 23 JSON files (one per collection)

---

### Step 2: Upload Backup to EC2 (If Backup Created on Mac)

If you created the backup on your Mac, upload it to EC2:

```bash
# On your Mac
cd /path/where/backup/was/created

# Upload the entire backup directory
scp -i /Users/sms01/Desktop/Max/arbrit-key.pem -r mongodb-backup-20241121-143000 ec2-user@44.200.111.147:~/

# Also upload the import script
cd /Users/sms01/Downloads/arbrit-safety-export
scp -i /Users/sms01/Desktop/Max/arbrit-key.pem scripts/import-backup-to-dynamodb.py ec2-user@44.200.111.147:~/
```

---

### Step 3: Import Backup to DynamoDB

**On EC2:**

```bash
# Install dependencies (if not already installed)
pip3 install boto3 --user

# Set AWS region
export AWS_REGION="us-east-1"

# Run import
python3 import-backup-to-dynamodb.py mongodb-backup-20241121-143000
```

**Expected Output:**

```
============================================================
Import MongoDB Backup to DynamoDB
============================================================

📁 Backup directory: mongodb-backup-20241121-143000
🔵 AWS Region: us-east-1

🔵 Connecting to DynamoDB...
   ✅ Connected
   Found 23 backup files

🚀 Starting import...
============================================================

📦 Importing users.json -> arbrit-users
   Found 15 documents
   Progress: 15/15 (100.0%)
   ✅ Imported 15 documents (0 failed)

📦 Importing employees.json -> arbrit-employees
   Found 45 documents
   Progress: 45/45 (100.0%)
   ✅ Imported 45 documents (0 failed)

... [continues for all files]

🔍 Verifying import...
============================================================

users -> arbrit-users:
   ✅ Expected: 15 | Actual: 15

employees -> arbrit-employees:
   ✅ Expected: 45 | Actual: 45

... [continues for all tables]

============================================================
IMPORT SUMMARY
============================================================
Total documents imported: 1,234
Tables updated: 23
Verification status: ✅ PASSED

Imported collections:
  ✅ users: 15 documents
  ✅ employees: 45 documents
  ✅ leads: 127 documents
  ... [all collections]

Next steps:
1. Test your application with DynamoDB
2. Verify all functionality works
3. Keep MongoDB backup files safe
============================================================
```

---

## 🔍 Verification

After import, verify the data:

```bash
# Count items in DynamoDB tables
aws dynamodb scan --table-name arbrit-users --select COUNT --region us-east-1
aws dynamodb scan --table-name arbrit-employees --select COUNT --region us-east-1

# Get a specific item
aws dynamodb get-item \
  --table-name arbrit-users \
  --key '{"mobile": {"S": "9876543210"}}' \
  --region us-east-1
```

---

## 📦 Backup File Structure

Your backup directory will look like this:

```
mongodb-backup-20241121-143000/
├── users.json                    (15 documents)
├── employees.json                (45 documents)
├── attendance.json               (234 documents)
├── leads.json                    (127 documents)
├── quotations.json               (89 documents)
├── invoices.json                 (156 documents)
├── payments.json                 (203 documents)
├── training_sessions.json        (78 documents)
├── certificates.json             (142 documents)
├── ... (and 14 more files)
```

Each JSON file contains an array of documents:

```json
[
  {
    "_id": {"$oid": "507f1f77bcf86cd799439011"},
    "name": "John Doe",
    "mobile": "9876543210",
    "role": "employee",
    "created_at": {"$date": "2024-01-15T10:30:00.000Z"}
  },
  {
    "_id": {"$oid": "507f1f77bcf86cd799439012"},
    "name": "Jane Smith",
    "mobile": "9876543211",
    "role": "manager",
    "created_at": {"$date": "2024-01-16T11:45:00.000Z"}
  }
]
```

---

## 🔄 Data Transformations

The import script automatically handles:

### MongoDB → DynamoDB Conversions

| MongoDB Type | Example | DynamoDB Type |
|--------------|---------|---------------|
| ObjectId | `{"$oid": "507f..."}` | String `"507f..."` |
| Date | `{"$date": "2024-01-15..."}` | String (ISO 8601) |
| Decimal128 | `{"$numberDecimal": "19.99"}` | Decimal |
| Long | `{"$numberLong": "12345"}` | Number |
| Int | `{"$numberInt": "42"}` | Number |
| Float | `1.5` | Decimal `1.5` |
| String | `"hello"` | String `"hello"` |
| Array | `[1, 2, 3]` | List `[1, 2, 3]` |
| Object | `{"key": "value"}` | Map `{"key": "value"}` |

### Special Field Handling

- `_id` → Converted to `id` (String)
- `mobile` → Primary key for `arbrit-users` table
- `id` → Primary key for all other tables

---

## 🛠️ Troubleshooting

### Issue: "MONGO_URL not set"

**Solution:**
```bash
export MONGO_URL="mongodb+srv://user:pass@cluster.mongodb.net/arbrit-workdesk"
```

### Issue: "mongoexport not found"

**Solution:** Use the Python script instead:
```bash
python3 backup-mongodb.py
```

### Issue: "No module named 'pymongo'"

**Solution:**
```bash
pip3 install pymongo boto3 --user
```

### Issue: "Access Denied" when importing to DynamoDB

**Solution:** Make sure your EC2 IAM role has DynamoDB permissions (you already fixed this!)

### Issue: "Skipping user without mobile"

**Solution:** The users table requires a `mobile` field. Check your source data. You can:
- Fix the source document in MongoDB and re-export
- Manually add mobile field to the JSON file
- Skip that user (it will be logged)

### Issue: Import fails halfway through

**Solution:** The import script is idempotent (safe to re-run). Just run it again:
```bash
python3 import-backup-to-dynamodb.py mongodb-backup-20241121-143000
```

DynamoDB will overwrite duplicate items, so no duplicates will be created.

---

## 💰 Cost Considerations

### Storage

- **MongoDB Backup Files:** ~10-100MB (stored on EC2 or Mac)
- **DynamoDB Storage:** $0.25 per GB/month
- **S3 Backup (Optional):** $0.023 per GB/month

### Import Cost

- **DynamoDB Write Requests:** On-demand billing
- **Typical import cost:** $0.50 - $2.00 for 10,000 items
- **Free tier eligible:** First 25 GB storage, 25 WCU free

---

## 🔐 Best Practices

### 1. Keep Backup Files Safe

```bash
# On EC2 - compress and archive
cd ~
tar -czf mongodb-backup-20241121-143000.tar.gz mongodb-backup-20241121-143000/

# Copy to S3 for long-term storage
aws s3 cp mongodb-backup-20241121-143000.tar.gz s3://your-backup-bucket/

# Or download to your Mac
# On Mac:
scp -i /Users/sms01/Desktop/Max/arbrit-key.pem \
  ec2-user@44.200.111.147:~/mongodb-backup-20241121-143000.tar.gz \
  ~/Desktop/Backups/
```

### 2. Enable DynamoDB Backups

```bash
# Enable Point-in-Time Recovery for important tables
aws dynamodb update-continuous-backups \
  --table-name arbrit-users \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --region us-east-1

aws dynamodb update-continuous-backups \
  --table-name arbrit-employees \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --region us-east-1
```

### 3. Test Before Full Migration

Test with a single collection first:

```bash
# Create a test directory with one file
mkdir mongodb-test
cp mongodb-backup-20241121-143000/users.json mongodb-test/

# Import just users
python3 import-backup-to-dynamodb.py mongodb-test

# Verify it worked
aws dynamodb scan --table-name arbrit-users --select COUNT --region us-east-1
```

### 4. Document Your Migration

Keep a migration log:

```bash
# Create a migration record
cat > migration-log.txt << EOF
Migration Date: $(date)
Backup Directory: mongodb-backup-20241121-143000
MongoDB URL: ${MONGO_URL}
MongoDB Documents: 1,234
DynamoDB Region: us-east-1
Import Status: Success
Verification: Passed

Collections Migrated:
- users: 15 docs
- employees: 45 docs
- leads: 127 docs
... (list all)

Performed by: $(whoami)
EOF
```

---

## 🔄 Re-importing or Updating Data

If you need to update DynamoDB with new MongoDB data:

1. **Create a new backup** from MongoDB
2. **Import the new backup** (will overwrite existing items with same keys)
3. **Verify the changes**

```bash
# New backup
python3 backup-mongodb.py

# Import (overwrites existing data)
python3 import-backup-to-dynamodb.py mongodb-backup-20241121-153000

# Verify
aws dynamodb scan --table-name arbrit-users --select COUNT --region us-east-1
```

---

## 📊 Comparison: Direct vs Backup-Based Migration

| Feature | Direct Migration | Backup-Based |
|---------|------------------|--------------|
| **Speed** | Faster | Slightly slower |
| **Backup Files** | No | Yes (permanent) |
| **MongoDB Connection** | Needed throughout | Only during export |
| **Review Before Import** | No | Yes |
| **Re-import if Failed** | Must reconnect | Easy |
| **Portability** | No | Yes (JSON files) |
| **Recommended For** | Quick migration | Production systems |

---

## ✅ Migration Checklist

- [ ] Install Python and dependencies
- [ ] Set MongoDB connection string
- [ ] Run backup script successfully
- [ ] Review backup files (optional)
- [ ] Upload backup to EC2 (if needed)
- [ ] Run import script successfully
- [ ] Verify all tables have correct counts
- [ ] Test application with DynamoDB
- [ ] Archive backup files safely
- [ ] Enable DynamoDB backups
- [ ] Document migration details
- [ ] Keep MongoDB running as fallback (2-4 weeks)

---

## 🎯 Quick Commands Summary

```bash
# STEP 1: Backup MongoDB
export MONGO_URL="mongodb+srv://user:pass@cluster.mongodb.net/arbrit-workdesk"
python3 backup-mongodb.py

# STEP 2: Upload to EC2 (if on Mac)
scp -i key.pem -r mongodb-backup-* ec2-user@YOUR-IP:~/
scp -i key.pem import-backup-to-dynamodb.py ec2-user@YOUR-IP:~/

# STEP 3: Import to DynamoDB (on EC2)
python3 import-backup-to-dynamodb.py mongodb-backup-*

# STEP 4: Verify
aws dynamodb list-tables --region us-east-1
aws dynamodb scan --table-name arbrit-users --select COUNT --region us-east-1

# STEP 5: Archive backup
tar -czf mongodb-backup.tar.gz mongodb-backup-*/
```

---

## 🆘 Getting Help

If you encounter issues:

1. **Check backup files:** Open a JSON file and verify it has data
2. **Test MongoDB connection:**
   ```bash
   python3 -c "from pymongo import MongoClient; print(MongoClient('$MONGO_URL').server_info())"
   ```
3. **Test DynamoDB connection:**
   ```bash
   aws dynamodb list-tables --region us-east-1
   ```
4. **Check import logs:** Look for specific error messages
5. **Verify IAM permissions:** EC2 role needs DynamoDB permissions

---

## 📚 Related Documentation

- `NEXT_STEPS_MIGRATION.md` - Quick start guide
- `MONGODB_TO_DYNAMODB_MIGRATION.md` - Direct migration guide
- `DYNAMODB_CONVERSION_GUIDE.md` - DynamoDB setup
- `scripts/migrate-mongodb-to-dynamodb.py` - Direct migration script
- `scripts/backup-mongodb.py` - This backup script
- `scripts/import-backup-to-dynamodb.py` - This import script

---

**You're ready to migrate! Start with Step 1: Backup your MongoDB data! 🚀**


