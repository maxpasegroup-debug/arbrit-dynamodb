# 📦 Import JSON Files to DynamoDB - Quick Guide

Import your MongoDB JSON exports directly to DynamoDB - No MongoDB connection needed!

---

## 🎯 What This Does

This script:
1. ✅ Reads JSON files from your `JSON` folder
2. ✅ Automatically maps files to DynamoDB tables
3. ✅ Converts MongoDB format to DynamoDB format
4. ✅ Imports all data
5. ✅ Verifies the import

**No MongoDB connection required!**

---

## 📋 Prerequisites

1. ✅ JSON files in a `JSON` folder
2. ✅ DynamoDB tables created (with `arbrit-` prefix)
3. ✅ EC2 instance with IAM role for DynamoDB access
4. ✅ Python 3 installed (Amazon Linux has it)

---

## 🚀 Quick Start (3 Steps)

### Step 1: Upload Files to EC2 (5 minutes)

**Upload both the script AND JSON folder:**

**Option A: Create ZIP and Upload**

On your Mac:
```bash
cd /Users/sms01/Downloads/arbrit-safety-export

# Create a ZIP with script and JSON folder
zip -r import-package.zip scripts/import-json-to-dynamodb.sh JSON/
```

Upload `import-package.zip` to Google Drive/Dropbox, get link.

On EC2:
```bash
cd ~
wget "YOUR_DOWNLOAD_LINK" -O import-package.zip
unzip import-package.zip
```

**Option B: Upload Separately**

Upload script:
```bash
# On EC2, create the script
nano ~/import-json-to-dynamodb.sh
# Paste content from scripts/import-json-to-dynamodb.sh
# Save: Ctrl+X, Y, Enter
```

Upload JSON folder - create ZIP of just the JSON folder, upload, then:
```bash
cd ~
wget "JSON_FOLDER_LINK" -O json-files.zip
unzip json-files.zip
```

---

### Step 2: Set AWS Region (30 seconds)

```bash
# Set AWS region (optional, defaults to us-east-1)
export AWS_REGION="us-east-1"
```

---

### Step 3: Run the Script (5-10 minutes)

```bash
# Make executable
chmod +x ~/import-json-to-dynamodb.sh

# Run it!
~/import-json-to-dynamodb.sh
```

**That's it!**

---

## 📁 Expected Folder Structure

Your EC2 instance should have:

```
/home/ec2-user/
├── import-json-to-dynamodb.sh          ← The script
└── JSON/                               ← Your JSON files
    ├── arbrit-workdesk.users.json
    ├── arbrit-workdesk.employees.json
    ├── arbrit-workdesk.leads.json
    ├── arbrit-workdesk.quotations.json
    └── ... (all other JSON files)
```

---

## 🗺️ File to Table Mapping

The script automatically maps your JSON files to DynamoDB tables:

| JSON File | DynamoDB Table |
|-----------|----------------|
| arbrit-workdesk.users.json | arbrit-users |
| arbrit-workdesk.employees.json | arbrit-employees |
| arbrit-workdesk.leads.json | arbrit-leads |
| arbrit-workdesk.quotations.json | arbrit-quotations |
| arbrit-workdesk.courses.json | arbrit-courses |
| arbrit-workdesk.trainers.json | arbrit-trainers |
| arbrit-workdesk.attendance.json | arbrit-attendance |
| arbrit-workdesk.leave_requests.json | arbrit-leave_requests |
| arbrit-workdesk.expense_claims.json | arbrit-expense_claims |
| arbrit-workdesk.invoices.json | arbrit-invoices |
| arbrit-workdesk.employee_documents.json | arbrit-employee_documents |
| arbrit-workdesk.company_documents.json | arbrit-company_documents |
| arbrit-workdesk.assessment_forms.json | arbrit-assessment_forms |
| arbrit-workdesk.trainer_requests.json | arbrit-trainer_requests |
| arbrit-workdesk.invoice_requests.json | arbrit-invoice_requests |
| arbrit-workdesk.visit_logs.json | arbrit-visit_logs |

---

## 📊 Expected Output

```bash
============================================
Import JSON Files to DynamoDB
============================================

[INFO] JSON directory found: ./JSON
[INFO] AWS Region: us-east-1

============================================
Step 1: Installing Dependencies
============================================

[INFO] Checking Python installation...
[INFO] Installing required Python packages...
[INFO] ✅ Dependencies installed

============================================
Step 2: Scanning JSON Files
============================================

[INFO] Found JSON files:
  📄 arbrit-workdesk.users.json (2.1K)
  📄 arbrit-workdesk.employees.json (45K)
  📄 arbrit-workdesk.leads.json (128K)
  📄 arbrit-workdesk.quotations.json (87K)
  ...

[INFO] Total files found: 14

============================================
Step 3: Creating Python Import Script
============================================

[INFO] Creating Python import script...
[INFO] ✅ Import script created

============================================
Step 4: Verifying DynamoDB Tables
============================================

[INFO] Checking which DynamoDB tables exist...
  ✅ arbrit-users
  ✅ arbrit-employees
  ✅ arbrit-leads
  ✅ arbrit-quotations
  ...

[INFO] Tables found: 14

============================================
Step 5: Importing Data
============================================

[WARN] This will import JSON files to DynamoDB tables
[WARN] Existing data with same IDs will be overwritten!

Continue with import? (y/n) y

[INFO] Starting import...

============================================================
Import JSON Files to DynamoDB
============================================================

📊 Connecting to DynamoDB...
✅ Connected to DynamoDB (region: us-east-1)

Found 14 JSON files

📦 Processing: arbrit-workdesk.users.json
   Target table: arbrit-users
------------------------------------------------------------
   Found 2 documents
   ✅ Migrated: 2/2 documents

📦 Processing: arbrit-workdesk.employees.json
   Target table: arbrit-employees
------------------------------------------------------------
   Found 15 documents
   ✅ Migrated: 15/15 documents

📦 Processing: arbrit-workdesk.leads.json
   Target table: arbrit-leads
------------------------------------------------------------
   Found 42 documents
   ✅ Migrated: 42/42 documents

...

============================================================
🎉 Import Complete!
   Total imported: 156 documents
   Files processed: 14
============================================================

[INFO] ✅ Import completed successfully!

============================================
Step 6: Verifying Import
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
  ✅ JSON files processed
  ✅ Data imported to DynamoDB
  ✅ Import verified

Next steps:
  1. Verify data in DynamoDB Console
  2. Update your application to use DynamoDB
  3. Test all application features

Cleanup:
  rm /tmp/import_json_to_dynamodb.py

[INFO] Import completed successfully!
```

---

## 🆘 Troubleshooting

### Error: "JSON directory not found"

**Solution:** Make sure JSON folder is in the same directory as the script.

```bash
# Check current directory
pwd

# List files
ls -la

# Should see:
# import-json-to-dynamodb.sh
# JSON/

# If JSON folder is elsewhere, move it:
mv /path/to/JSON ./
```

---

### Error: "Permission denied"

**Solution:** Make script executable

```bash
chmod +x import-json-to-dynamodb.sh
```

---

### Error: "Table not found"

**Solution:** Create the DynamoDB table first.

The script will skip tables that don't exist. If you see:
```
⚠️  arbrit-users (not found - will skip)
```

You need to create that table first. See `DYNAMODB_CONVERSION_GUIDE.md`.

---

### Error: "Access Denied" (DynamoDB)

**Solution:** EC2 needs IAM role with DynamoDB permissions.

1. Go to EC2 Console → Instances
2. Select instance → Actions → Security → Modify IAM role
3. Attach role with `AmazonDynamoDBFullAccess`
4. Try again

---

### Some documents failed to import

**Common reasons:**
- Documents missing `_id` field
- Corrupted JSON file
- Data type incompatibility

**Check:**
```bash
# Validate JSON file
python3 -m json.tool JSON/arbrit-workdesk.users.json
```

If valid, the first 3 errors will be shown in output.

---

## 📋 Verification

After import, verify in AWS Console:

1. **Go to:** DynamoDB Console
2. **Select:** arbrit-users table
3. **Click:** "Explore table items"
4. **Check:** Data exists and looks correct

**Or via CLI:**
```bash
# Get item count
aws dynamodb scan --table-name arbrit-users --select COUNT --region us-east-1

# Get sample items
aws dynamodb scan --table-name arbrit-users --max-items 3 --region us-east-1
```

---

## 🔄 Re-Running the Import

The import is **idempotent** - safe to run multiple times.

**⚠️ Warning:** Re-running will **overwrite** existing data with same IDs!

```bash
# Just run again
~/import-json-to-dynamodb.sh
```

---

## 🧹 Cleanup

After successful import:

```bash
# Remove temporary Python script
rm /tmp/import_json_to_dynamodb.py

# Optional: Keep JSON files as backup
# Or remove them to save space
# rm -rf ~/JSON/
```

---

## ✅ Complete Checklist

**Before running:**
- [ ] JSON files uploaded to EC2
- [ ] JSON folder in correct location
- [ ] Script uploaded and made executable
- [ ] DynamoDB tables created
- [ ] EC2 has IAM role with DynamoDB access

**After running:**
- [ ] All JSON files processed
- [ ] No critical errors
- [ ] Verified data in DynamoDB Console
- [ ] Updated application to use DynamoDB
- [ ] Tested application features

---

## 🎯 What Gets Converted

The script automatically handles MongoDB → DynamoDB conversions:

### ObjectId → String
```json
// MongoDB
{"_id": {"$oid": "507f1f77bcf86cd799439011"}}

// DynamoDB
{"id": "507f1f77bcf86cd799439011"}
```

### Dates → ISO Strings
```json
// MongoDB
{"created_at": {"$date": "2024-01-15T10:30:00Z"}}

// DynamoDB
{"created_at": "2024-01-15T10:30:00Z"}
```

### Floats → Decimals
```json
// MongoDB
{"price": 99.99}

// DynamoDB (uses Decimal)
{"price": Decimal('99.99')}
```

---

## 💡 Pro Tips

### Tip 1: Test with Small Dataset First

If you have large JSON files, test with a small file first:

```bash
# Create test folder
mkdir ~/JSON-test
cp ~/JSON/arbrit-workdesk.users.json ~/JSON-test/

# Modify script to use JSON-test
# Then run
```

### Tip 2: Check File Sizes

```bash
# See which files are largest
cd ~/JSON
ls -lh *.json | sort -k5 -h
```

Large files take longer to import.

### Tip 3: Monitor DynamoDB

Watch CloudWatch metrics during import for:
- Throttling
- Consumed capacity
- Errors

### Tip 4: Backup Before Import

If you have existing data in DynamoDB:

```bash
# Export existing data first
aws dynamodb scan --table-name arbrit-users --region us-east-1 > backup-users.json
```

---

## 📊 Performance

**Import speed depends on:**
- Number of files
- File sizes
- Number of documents
- DynamoDB table capacity

**Typical times:**
- Small dataset (< 1000 items): 1-2 minutes
- Medium dataset (1000-10000 items): 5-10 minutes
- Large dataset (> 10000 items): 15-30 minutes

---

## 🎉 Success!

Once import completes:

1. ✅ **Verify data** in DynamoDB Console
2. ✅ **Update application** environment variables
3. ✅ **Test thoroughly**
4. ✅ **Monitor for errors**
5. ✅ **Keep JSON files as backup**

---

**Last updated:** November 20, 2025


