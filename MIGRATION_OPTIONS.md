# MongoDB to DynamoDB Migration - All Options

## 🎯 Quick Status

✅ **DynamoDB Tables Created:** 23 tables ready
✅ **IAM Permissions:** EC2 can access DynamoDB
✅ **Backend Code:** Already supports DynamoDB
✅ **Migration Scripts:** Ready to use

**What you need to do:** Choose a migration option below and execute!

---

## 📋 Choose Your Migration Method

### Option 1: Backup-Based Migration ⭐ **RECOMMENDED**

**Best for:** Production systems, when you want permanent backup files

**Advantages:**
- ✅ Get permanent JSON backup files
- ✅ Can review data before importing
- ✅ Can re-import if something goes wrong
- ✅ Don't need MongoDB connection during import
- ✅ Safest approach

**Steps:**

```bash
# STEP 1: Backup MongoDB (run on Mac or EC2)
export MONGO_URL="mongodb+srv://user:pass@cluster.mongodb.net/arbrit-workdesk"
python3 backup-mongodb.py
# → Creates: mongodb-backup-20241121-143000/

# STEP 2: Upload to EC2 (if backup on Mac)
scp -i key.pem -r mongodb-backup-* ec2-user@44.200.111.147:~/
scp -i key.pem scripts/import-backup-to-dynamodb.py ec2-user@44.200.111.147:~/

# STEP 3: Import to DynamoDB (on EC2)
python3 import-backup-to-dynamodb.py mongodb-backup-20241121-143000

# DONE! ✅
```

**Scripts needed:**
- `scripts/backup-mongodb.py` - Export MongoDB to JSON
- `scripts/import-backup-to-dynamodb.py` - Import JSON to DynamoDB

**Full Guide:** `BACKUP_MIGRATION_GUIDE.md`

---

### Option 2: Direct Migration

**Best for:** Quick migration, testing, development

**Advantages:**
- ✅ Single command migration
- ✅ Faster (no intermediate files)
- ✅ Automatic data conversion

**Disadvantages:**
- ❌ No permanent backup files
- ❌ Need MongoDB connection throughout
- ❌ Can't review data before import

**Steps:**

```bash
# STEP 1: Upload script to EC2
scp -i key.pem scripts/migrate-mongodb-to-dynamodb.py ec2-user@44.200.111.147:~/
scp -i key.pem scripts/quick-migrate.sh ec2-user@44.200.111.147:~/

# STEP 2: Run migration (on EC2)
export MONGO_URL="mongodb+srv://user:pass@cluster.mongodb.net/arbrit-workdesk"
chmod +x quick-migrate.sh
./quick-migrate.sh

# DONE! ✅
```

**Scripts needed:**
- `scripts/migrate-mongodb-to-dynamodb.py` - Direct migration
- `scripts/quick-migrate.sh` - Helper script

**Full Guide:** `MONGODB_TO_DYNAMODB_MIGRATION.md`

---

### Option 3: Start Fresh (No Migration)

**Best for:** Testing, new deployment, no existing data

**Advantages:**
- ✅ Quickest setup
- ✅ Clean start
- ✅ No MongoDB needed

**Steps:**

```bash
# STEP 1: Upload seed script to EC2
scp -i key.pem scripts/seed-dynamodb.py ec2-user@44.200.111.147:~/

# STEP 2: Create admin user (on EC2)
pip3 install boto3 passlib bcrypt --user
python3 seed-dynamodb.py

# Creates admin user:
# Mobile: 9876543210
# Password: admin123
# Role: MD (Managing Director)

# DONE! ✅
```

**Scripts needed:**
- `scripts/seed-dynamodb.py` - Create test admin user

**Full Guide:** `NEXT_STEPS_MIGRATION.md`

---

## 🔍 Comparison Table

| Feature | Backup-Based | Direct | Start Fresh |
|---------|--------------|--------|-------------|
| **Time Required** | 5-15 min | 3-10 min | 1-2 min |
| **MongoDB Needed** | Only for export | Yes, throughout | No |
| **Backup Files** | ✅ Yes | ❌ No | N/A |
| **Re-import** | ✅ Easy | ❌ Must reconnect | N/A |
| **Production Ready** | ✅ Yes | ⚠️ Maybe | ❌ No |
| **Existing Data** | ✅ Preserved | ✅ Preserved | ❌ Lost |
| **Complexity** | Medium | Low | Very Low |
| **Safety** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 📦 Scripts Overview

### Backup & Migration Scripts

| Script | Purpose | Input | Output |
|--------|---------|-------|--------|
| `backup-mongodb.sh` | Export MongoDB (shell) | MongoDB URL | JSON files |
| `backup-mongodb.py` | Export MongoDB (Python) | MongoDB URL | JSON files |
| `import-backup-to-dynamodb.py` | Import JSON to DynamoDB | JSON files | DynamoDB data |
| `migrate-mongodb-to-dynamodb.py` | Direct migration | MongoDB URL | DynamoDB data |
| `quick-migrate.sh` | Helper for direct migration | MongoDB URL | DynamoDB data |
| `seed-dynamodb.py` | Create test admin user | None | Admin user |

### Helper Scripts

| Script | Purpose |
|--------|---------|
| `create-dynamodb-tables.sh` | ✅ Already done! |
| `health-check.sh` | Test backend health |
| `deploy-to-ecs.sh` | Deploy to ECS |

---

## 🚀 Quick Start Commands

### For Backup-Based Migration (Recommended):

```bash
# === ON YOUR MAC OR EC2 ===
# Install dependencies
pip3 install pymongo boto3 --user

# Set MongoDB connection
export MONGO_URL="mongodb+srv://username:password@cluster.mongodb.net/arbrit-workdesk"
export DB_NAME="arbrit-workdesk"

# Run backup
cd /Users/sms01/Downloads/arbrit-safety-export/scripts
python3 backup-mongodb.py

# === IF BACKUP ON MAC, UPLOAD TO EC2 ===
scp -i /Users/sms01/Desktop/Max/arbrit-key.pem -r mongodb-backup-* ec2-user@44.200.111.147:~/
scp -i /Users/sms01/Desktop/Max/arbrit-key.pem import-backup-to-dynamodb.py ec2-user@44.200.111.147:~/

# === ON EC2 ===
# Install dependencies
pip3 install boto3 --user

# Run import
python3 import-backup-to-dynamodb.py mongodb-backup-20241121-143000

# Verify
aws dynamodb scan --table-name arbrit-users --select COUNT --region us-east-1
```

### For Direct Migration:

```bash
# === UPLOAD TO EC2 (from Mac) ===
cd /Users/sms01/Downloads/arbrit-safety-export
scp -i /Users/sms01/Desktop/Max/arbrit-key.pem scripts/migrate-mongodb-to-dynamodb.py ec2-user@44.200.111.147:~/
scp -i /Users/sms01/Desktop/Max/arbrit-key.pem scripts/quick-migrate.sh ec2-user@44.200.111.147:~/

# === ON EC2 ===
# Set MongoDB URL
export MONGO_URL="mongodb+srv://username:password@cluster.mongodb.net/arbrit-workdesk"

# Run migration
chmod +x quick-migrate.sh
./quick-migrate.sh

# Verify
aws dynamodb scan --table-name arbrit-users --select COUNT --region us-east-1
```

### For Fresh Start:

```bash
# === UPLOAD TO EC2 (from Mac) ===
cd /Users/sms01/Downloads/arbrit-safety-export
scp -i /Users/sms01/Desktop/Max/arbrit-key.pem scripts/seed-dynamodb.py ec2-user@44.200.111.147:~/

# === ON EC2 ===
# Install dependencies
pip3 install boto3 passlib bcrypt --user

# Create admin user
python3 seed-dynamodb.py

# Login with:
# Mobile: 9876543210
# Password: admin123
```

---

## 📚 Documentation Files

| File | Description |
|------|-------------|
| **`MIGRATION_OPTIONS.md`** | ⭐ This file - Overview of all options |
| **`BACKUP_MIGRATION_GUIDE.md`** | Detailed backup-based migration guide |
| **`MONGODB_TO_DYNAMODB_MIGRATION.md`** | Direct migration guide |
| **`NEXT_STEPS_MIGRATION.md`** | Quick reference with next steps |
| **`DYNAMODB_CONVERSION_GUIDE.md`** | DynamoDB setup guide |
| **`dynamodb-tables.json`** | Table definitions |

---

## ✅ Post-Migration Checklist

After migrating (any option):

```bash
# 1. Verify tables have data
aws dynamodb list-tables --region us-east-1
aws dynamodb scan --table-name arbrit-users --select COUNT --region us-east-1

# 2. Check backend is using DynamoDB
docker logs arbrit-backend 2>&1 | grep -i dynamodb
# Should see: "✅ DynamoDB client initialized successfully"

# 3. Test login
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobile": "9876543210", "password": "YOUR_PASSWORD"}'

# 4. Test in browser
# Open your application and verify all features work

# 5. Enable DynamoDB backups (production)
aws dynamodb update-continuous-backups \
  --table-name arbrit-users \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --region us-east-1
```

---

## 🆘 Troubleshooting

### Common Issues:

| Error | Solution |
|-------|----------|
| "MONGO_URL not set" | `export MONGO_URL="..."` |
| "No module named pymongo" | `pip3 install pymongo boto3 --user` |
| "Access Denied DynamoDB" | Check IAM role permissions (should be fixed!) |
| "mongoexport not found" | Use Python scripts instead |
| "Connection timeout MongoDB" | Check firewall, whitelist IP in MongoDB Atlas |
| Tables empty after import | Check import script output for errors |

### Get MongoDB Connection String:

**MongoDB Atlas:**
1. Go to: https://cloud.mongodb.com/
2. Click cluster → Connect → Connect your application
3. Copy connection string
4. Replace `<password>` with actual password

**Self-Hosted:**
```bash
export MONGO_URL="mongodb://username:password@host:27017/arbrit-workdesk"
```

---

## 🎓 Recommendations

### For Production Systems:
✅ **Use Option 1 (Backup-Based Migration)**
- Creates permanent backup files
- Safest approach
- Can review and re-import

### For Development/Testing:
✅ **Use Option 2 (Direct Migration)** or **Option 3 (Start Fresh)**
- Faster setup
- Less complexity
- Easy to reset

### For New Deployments:
✅ **Use Option 3 (Start Fresh)**
- No migration needed
- Quick setup
- Clean start

---

## 💡 Pro Tips

1. **Always keep MongoDB running** for 2-4 weeks after migration as backup
2. **Test thoroughly** before shutting down MongoDB
3. **Enable DynamoDB backups** (Point-in-Time Recovery)
4. **Archive backup files** to S3 or local storage
5. **Document your migration** with dates and details
6. **Monitor costs** in AWS Cost Explorer

---

## 🎯 What's Your Situation?

Choose based on your needs:

| Your Situation | Recommended Option |
|----------------|-------------------|
| "I have production MongoDB data" | **Option 1: Backup-Based** ⭐ |
| "I want to migrate quickly" | **Option 2: Direct Migration** |
| "I'm just testing" | **Option 3: Start Fresh** |
| "I want backup files" | **Option 1: Backup-Based** ⭐ |
| "No MongoDB connection available" | **Option 1** (backup elsewhere first) |
| "I want the safest method" | **Option 1: Backup-Based** ⭐ |

---

## 📞 Need Help?

1. Read the detailed guides (links above)
2. Check troubleshooting section
3. Verify prerequisites are met
4. Review error messages carefully
5. Test with single table first

---

**Ready to migrate? Pick your option and follow the steps! 🚀**

**My recommendation: Option 1 (Backup-Based Migration) - It's the safest!**


