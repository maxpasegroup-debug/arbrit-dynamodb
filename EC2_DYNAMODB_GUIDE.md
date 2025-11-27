# 🚀 EC2 DynamoDB Migration - Quick Guide

Run the DynamoDB migration script from your EC2 instance in just a few steps!

---

## 📋 What This Script Does

The `ec2-run-dynamodb.sh` script will:
1. ✅ Install all required dependencies
2. ✅ Test MongoDB connection
3. ✅ Verify DynamoDB tables exist
4. ✅ Export data from MongoDB
5. ✅ Import data to DynamoDB
6. ✅ Verify the migration

**Time:** 10-15 minutes  
**What you need:** MongoDB connection string

---

## 🚀 Quick Start (3 Steps)

### Step 1: Upload Script to EC2 (2 minutes)

**Option A: Direct Copy-Paste**

1. **Connect to EC2** via browser (EC2 Instance Connect)
2. **Create the script:**
```bash
nano ~/ec2-run-dynamodb.sh
```
3. **Copy the entire content** from `scripts/ec2-run-dynamodb.sh`
4. **Paste** into nano
5. **Save:** Ctrl+X, Y, Enter

**Option B: Upload via File Hosting**

1. Upload `scripts/ec2-run-dynamodb.sh` to Google Drive/Dropbox
2. Get download link
3. **In EC2 terminal:**
```bash
cd ~
wget "YOUR_DOWNLOAD_LINK" -O ec2-run-dynamodb.sh
chmod +x ec2-run-dynamodb.sh
```

---

### Step 2: Set Environment Variables (1 minute)

In EC2 terminal:

```bash
# Set your MongoDB connection string
export MONGO_URL="mongodb+srv://username:password@cluster.mongodb.net/arbrit-workdesk?retryWrites=true&w=majority"

# Set database name (optional, defaults to arbrit-workdesk)
export DB_NAME="arbrit-workdesk"

# Set AWS region (optional, defaults to us-east-1)
export AWS_REGION="us-east-1"

# Verify variables are set
echo "MongoDB: $MONGO_URL"
echo "Database: $DB_NAME"
echo "Region: $AWS_REGION"
```

⚠️ **Replace with your actual MongoDB credentials!**

---

### Step 3: Run the Script (10 minutes)

```bash
chmod +x ~/ec2-run-dynamodb.sh
~/ec2-run-dynamodb.sh
```

**What happens:**
1. Installs Python packages (pymongo, boto3)
2. Tests MongoDB connection
3. Checks DynamoDB tables
4. Asks for confirmation
5. Migrates all data
6. Shows summary

**Follow the prompts!**

---

## 📊 Expected Output

```
============================================
EC2 DynamoDB Setup & Import Script
============================================

[INFO] Checking environment...
[INFO] Running on EC2 instance: i-0123456789abcdef0
[INFO] Operating System: Amazon Linux

============================================
Step 1: Installing Dependencies
============================================

[INFO] Installing Python packages...
[INFO] Installing Python dependencies...
[INFO] ✅ Dependencies installed

============================================
Step 2: Configuration
============================================

[INFO] Configuration:
  Database: arbrit-workdesk
  AWS Region: us-east-1
  MongoDB: mongodb+srv://***@cluster.mongodb.net/arbrit-workdesk

============================================
Step 3: Creating Migration Script
============================================

[INFO] Creating Python migration script...
[INFO] ✅ Migration script created

============================================
Step 4: Verifying DynamoDB Tables
============================================

[INFO] Checking DynamoDB tables...
  ✅ arbrit-users exists
  ✅ arbrit-employees exists
  ✅ arbrit-leads exists
  ...
[INFO] ✅ Table verification complete

============================================
Step 5: Testing MongoDB Connection
============================================

[INFO] Testing connection to MongoDB...
✅ Connected successfully
   MongoDB version: 7.0.5
   Collections found: 11
     - users: 2 documents
     - employees: 15 documents
     - leads: 42 documents
     ...
[INFO] ✅ MongoDB connection successful

============================================
Step 6: Running Migration
============================================

[WARN] This will migrate data from MongoDB to DynamoDB
[WARN] Make sure you have:
  - Correct MongoDB connection string
  - DynamoDB tables created
  - Proper IAM permissions

Continue with migration? (y/n) y

[INFO] Starting migration...

============================================================
MongoDB to DynamoDB Migration
============================================================

📊 Connecting to MongoDB...
✅ Connected to MongoDB
📊 Connecting to DynamoDB...
✅ Connected to DynamoDB

📦 Processing: users
------------------------------------------------------------
   Found 2 documents
   ✅ Migrated: 2/2 documents

📦 Processing: employees
------------------------------------------------------------
   Found 15 documents
   ✅ Migrated: 15/15 documents

📦 Processing: leads
------------------------------------------------------------
   Found 42 documents
   ✅ Migrated: 42/42 documents

...

============================================================
🎉 Migration Complete!
   Total migrated: 156 documents
============================================================

[INFO] ✅ Migration completed successfully!

============================================
Step 7: Verifying Migration
============================================

[INFO] Checking DynamoDB tables for data...
  📊 arbrit-users: 2 items
  📊 arbrit-employees: 15 items
  📊 arbrit-leads: 42 items
  ...
[INFO] ✅ Verification complete

============================================
🎉 All Done!
============================================

Summary:
  ✅ Dependencies installed
  ✅ MongoDB connection tested
  ✅ DynamoDB tables verified
  ✅ Data migrated
  ✅ Migration verified

Next steps:
  1. Update your application to use DynamoDB
  2. Test the application thoroughly
  3. Keep MongoDB as backup until confident

Cleanup:
  rm /tmp/migrate_to_dynamodb.py

[INFO] Migration script completed successfully!
```

---

## 🆘 Troubleshooting

### Error: "MONGO_URL not set"

**Solution:**
```bash
export MONGO_URL="your-connection-string"
```

Make sure to set it before running the script!

---

### Error: "Failed to connect to MongoDB"

**Possible causes:**
1. Wrong connection string
2. Wrong password
3. Network access not configured in MongoDB Atlas

**Solution:**
```bash
# Test connection manually
python3 << EOF
from pymongo import MongoClient
client = MongoClient("$MONGO_URL", serverSelectionTimeoutMS=5000)
print(client.server_info())
EOF
```

If this fails, check:
- MongoDB Atlas → Network Access → Add 0.0.0.0/0
- Connection string has correct password
- Database name is correct

---

### Error: "Table not found"

**Solution:** Create DynamoDB tables first!

You need these tables:
- arbrit-users
- arbrit-employees
- arbrit-leads
- arbrit-quotations
- arbrit-courses
- arbrit-trainers
- arbrit-attendance
- arbrit-leave_requests
- arbrit-expense_claims
- arbrit-invoices
- arbrit-documents

See `DYNAMODB_CONVERSION_GUIDE.md` for table creation.

---

### Error: "Access Denied" (DynamoDB)

**Solution:** EC2 needs IAM role with DynamoDB permissions.

**Fix:**
1. Go to EC2 Console → Instances
2. Select your instance → Actions → Security → Modify IAM role
3. Create/attach role with `AmazonDynamoDBFullAccess`
4. Try again

---

### Script hangs or takes too long

**Possible causes:**
- Large amount of data
- Slow MongoDB connection
- DynamoDB throttling

**Solution:**
- Wait patiently (large datasets take time)
- Check CloudWatch for DynamoDB throttling
- Script shows progress for each collection

---

## 📝 Manual Verification

After migration, verify data in AWS Console:

1. **Go to:** DynamoDB Console
2. **Select:** arbrit-users table
3. **Click:** "Explore table items"
4. **Check:** Items exist

**Or via CLI:**
```bash
aws dynamodb scan --table-name arbrit-users --region us-east-1 --max-items 5
```

---

## 🔄 Re-Running the Migration

If you need to run again (overwrites existing data):

```bash
# Set variables again (they might be lost if you disconnected)
export MONGO_URL="your-connection-string"
export DB_NAME="arbrit-workdesk"
export AWS_REGION="us-east-1"

# Run script
~/ec2-run-dynamodb.sh
```

The script is **idempotent** - safe to run multiple times.

---

## 🧹 Cleanup After Migration

Once you've verified everything works:

```bash
# Remove temporary migration script
rm /tmp/migrate_to_dynamodb.py

# Keep the main script for future use
# ~/ec2-run-dynamodb.sh
```

---

## 📋 Checklist

Before running:
- [ ] EC2 instance running
- [ ] Connected via EC2 Instance Connect
- [ ] MongoDB connection string ready
- [ ] DynamoDB tables created
- [ ] EC2 has IAM role with DynamoDB access

After running:
- [ ] Migration completed successfully
- [ ] All collections migrated
- [ ] Verified data in DynamoDB Console
- [ ] Updated application to use DynamoDB
- [ ] Tested application with DynamoDB
- [ ] MongoDB kept as backup

---

## 💡 Pro Tips

1. **Test with small dataset first** - If you have lots of data, test on a dev environment

2. **Check IAM permissions early** - Make sure EC2 can access DynamoDB before running

3. **Keep MongoDB running** - Don't delete MongoDB until you're 100% confident DynamoDB works

4. **Monitor CloudWatch** - Check for any throttling or errors

5. **Backup first** - Export MongoDB data as backup before migration:
   ```bash
   # Optional: Create MongoDB backup
   mongoexport --uri="$MONGO_URL" --collection=users --out=users_backup.json
   ```

---

## 🎯 Next Steps After Migration

1. **Update backend environment variables:**
   ```bash
   # In your ECS task definition or EC2
   USE_DYNAMODB=true
   DYNAMODB_REGION=us-east-1
   ```

2. **Restart your application**

3. **Test all features:**
   - User login
   - Create employee
   - Create lead
   - All CRUD operations

4. **Monitor for errors:**
   - Check CloudWatch logs
   - Monitor DynamoDB metrics

5. **Keep MongoDB as backup for 1-2 weeks**

---

## 📚 Related Documentation

- `MONGODB_TO_DYNAMODB_MIGRATION.md` - Detailed migration guide
- `DYNAMODB_CONVERSION_GUIDE.md` - Table creation guide
- `scripts/setup-and-import-dynamodb.sh` - Alternative migration script

---

## 🆘 Need Help?

1. Check script output for specific errors
2. Review troubleshooting section above
3. Check CloudWatch logs in AWS Console
4. Verify IAM permissions
5. Test MongoDB connection separately

---

**Last updated:** November 20, 2025


