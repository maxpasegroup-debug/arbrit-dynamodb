# EC2 Import to DynamoDB - Complete Guide

## Overview

This guide shows you how to import your MongoDB data to DynamoDB using an EC2 instance. This is useful when:
- You want to run the import from AWS infrastructure
- You have large data files
- You want to use IAM roles instead of access keys

---

## Prerequisites

### 1. AWS Account
- Access to AWS Console
- Permissions to create EC2 instances and DynamoDB tables

### 2. Your Data
- 14 JSON files exported from MongoDB (in `/Json/` folder)
- Located at: `/Users/sms01/Downloads/arbrit-safety-export/Json/`

---

## Quick Start (3 Steps)

### **Step 1: Launch EC2 Instance**

1. Go to AWS Console: https://console.aws.amazon.com/ec2/
2. Click **"Launch Instance"**
3. Configure:
   - **Name**: `arbrit-dynamodb-import`
   - **AMI**: Amazon Linux 2023 (or Ubuntu 22.04)
   - **Instance type**: t2.micro (free tier eligible)
   - **Key pair**: Create new or select existing
   - **Security group**: Default (we only need outbound access)
4. Click **"Launch instance"**

### **Step 2: Attach IAM Role to EC2**

1. In EC2 Console, select your instance
2. Click **Actions → Security → Modify IAM role**
3. If no role exists:
   - Click **"Create new IAM role"**
   - Service: **EC2**
   - Permissions: **AmazonDynamoDBFullAccess**
   - Role name: `EC2-DynamoDB-Import-Role`
4. Select the role and click **"Update IAM role"**

### **Step 3: Upload Files and Run Script**

```bash
# Upload JSON files to EC2
scp -i your-key.pem -r /Users/sms01/Downloads/arbrit-safety-export/Json/ ec2-user@YOUR-EC2-IP:~/Json/

# Upload the import script
scp -i your-key.pem /Users/sms01/Downloads/arbrit-safety-export/scripts/ec2-import-dynamodb.sh ec2-user@YOUR-EC2-IP:~/

# SSH into EC2
ssh -i your-key.pem ec2-user@YOUR-EC2-IP

# Run the import script
chmod +x ~/ec2-import-dynamodb.sh
./ec2-import-dynamodb.sh
```

**Done!** ✅

---

## Detailed Step-by-Step Guide

### **Part 1: Create and Configure EC2 Instance**

#### 1.1 Launch EC2 Instance

1. **Open EC2 Console**: https://console.aws.amazon.com/ec2/
2. **Click "Launch Instance"**
3. **Configure Instance**:

   **Name and tags:**
   - Name: `arbrit-dynamodb-import`

   **Application and OS Images (Amazon Machine Image):**
   - Select: **Amazon Linux 2023 AMI** (recommended)
   - OR: **Ubuntu Server 22.04 LTS**

   **Instance type:**
   - Select: **t2.micro** (1 GB RAM, free tier eligible)
   - For large datasets, use **t3.small** or **t3.medium**

   **Key pair (login):**
   - Click **"Create new key pair"** if you don't have one
   - Name: `arbrit-import-key`
   - Type: **RSA**
   - Format: **.pem** (for Mac/Linux) or **.ppk** (for Windows PuTTY)
   - Click **"Create key pair"** → Save the file securely

   **Network settings:**
   - VPC: Default
   - Subnet: No preference
   - Auto-assign public IP: **Enable**
   - Firewall: **Create security group**
   - Security group name: `dynamodb-import-sg`
   - Rules: Default SSH (port 22) is enough

   **Configure storage:**
   - 8 GB (default) is sufficient for small datasets
   - For large datasets (>1 GB), use 20-30 GB

4. **Click "Launch instance"**
5. **Wait 2-3 minutes** for instance to be in "Running" state

#### 1.2 Create IAM Role for DynamoDB Access

**Option A: Create Role First (Recommended)**

1. Go to **IAM Console**: https://console.aws.amazon.com/iam/
2. Click **"Roles"** in left sidebar
3. Click **"Create role"**
4. **Select trusted entity:**
   - Trusted entity type: **AWS service**
   - Use case: **EC2**
   - Click **"Next"**
5. **Add permissions:**
   - Search for: `AmazonDynamoDBFullAccess`
   - ✅ Check the box
   - Click **"Next"**
6. **Name role:**
   - Role name: `EC2-DynamoDB-Import-Role`
   - Description: `Allows EC2 to access DynamoDB for data import`
   - Click **"Create role"**

**Option B: Attach Existing Role**

1. In EC2 Console, select your instance
2. Click **Actions → Security → Modify IAM role**
3. Select role: `EC2-DynamoDB-Import-Role`
4. Click **"Update IAM role"**

#### 1.3 Get EC2 Public IP Address

1. In EC2 Console, select your instance
2. Copy the **Public IPv4 address** (e.g., `54.123.45.67`)
3. Save this IP - you'll need it for SSH/SCP

---

### **Part 2: Upload Your JSON Files to EC2**

#### 2.1 Prepare Files Locally

```bash
# Navigate to your export directory
cd /Users/sms01/Downloads/arbrit-safety-export

# Verify JSON files exist
ls -lh Json/*.json

# You should see 14 files
```

#### 2.2 Upload Files Using SCP

**Replace these values:**
- `YOUR-KEY.pem` → Your actual key file name
- `YOUR-EC2-IP` → Your EC2 public IP address

```bash
# Upload JSON folder
scp -i ~/Downloads/YOUR-KEY.pem -r /Users/sms01/Downloads/arbrit-safety-export/Json/ ec2-user@YOUR-EC2-IP:~/Json/

# Upload import script
scp -i ~/Downloads/YOUR-KEY.pem /Users/sms01/Downloads/arbrit-safety-export/scripts/ec2-import-dynamodb.sh ec2-user@YOUR-EC2-IP:~/
```

**For Ubuntu instances, use `ubuntu` instead of `ec2-user`:**
```bash
scp -i ~/Downloads/YOUR-KEY.pem -r Json/ ubuntu@YOUR-EC2-IP:~/Json/
```

#### 2.3 Verify Upload

```bash
# SSH into EC2
ssh -i ~/Downloads/YOUR-KEY.pem ec2-user@YOUR-EC2-IP

# Check files
ls -lh ~/Json/
# Should show 14 JSON files

# Check script
ls -lh ~/ec2-import-dynamodb.sh
```

---

### **Part 3: Run Import on EC2**

#### 3.1 SSH into EC2 Instance

```bash
ssh -i ~/Downloads/YOUR-KEY.pem ec2-user@YOUR-EC2-IP
```

#### 3.2 Make Script Executable

```bash
chmod +x ~/ec2-import-dynamodb.sh
```

#### 3.3 Run Import Script

```bash
./ec2-import-dynamodb.sh
```

**What the script does:**
1. ✅ Installs Python 3 and boto3
2. ✅ Checks for IAM role or AWS credentials
3. ✅ Locates your JSON files
4. ✅ Prepares files (removes prefixes)
5. ✅ Creates 23 DynamoDB tables
6. ✅ Imports all data (with progress tracking)
7. ✅ Shows completion summary

**Expected output:**
```
============================================================
EC2 DynamoDB Import Script
============================================================

🖥️  Operating System: Amazon Linux 2023

============================================================
STEP 1: Installing Dependencies
============================================================

Updating system packages...
Installing Python 3 and pip...
Installing boto3...
✅ Dependencies installed

============================================================
STEP 2: Checking AWS Configuration
============================================================

Checking if running on EC2 with IAM role...
✅ EC2 instance has IAM role: EC2-DynamoDB-Import-Role
   Will use IAM role for AWS authentication
   AWS Region: us-east-1

============================================================
STEP 3: Locating JSON Backup Files
============================================================

✅ Found JSON files in: /home/ec2-user/Json
   Found 14 JSON file(s)

... (continues with import)
```

#### 3.4 Monitor Import Progress

The script will show progress for each collection:
```
📦 Importing users.json -> arbrit-users
   Found 150 documents
   Progress: 25/150 (16.7%)
   Progress: 50/150 (33.3%)
   Progress: 75/150 (50.0%)
   ...
   ✅ Imported 150 documents (0 failed)
```

#### 3.5 Import Complete

When finished:
```
============================================================
✅ EC2 IMPORT COMPLETE!
============================================================

Your MongoDB data has been imported to DynamoDB.

View your data:
  https://console.aws.amazon.com/dynamodb/

Verify import:
  aws dynamodb list-tables --region us-east-1
```

---

### **Part 4: Verify Import**

#### 4.1 Verify via AWS Console

1. Go to: https://console.aws.amazon.com/dynamodb/
2. Click **"Tables"** in left sidebar
3. You should see 23 tables starting with `arbrit-`
4. Click on `arbrit-users` → **"Explore table items"**
5. Verify data is present

#### 4.2 Verify via Command Line (on EC2)

```bash
# List all tables
aws dynamodb list-tables --region us-east-1

# Count items in a table
aws dynamodb scan --table-name arbrit-users --select COUNT --region us-east-1

# Get sample item
aws dynamodb scan --table-name arbrit-users --limit 1 --region us-east-1
```

---

### **Part 5: Cleanup (Optional)**

#### After Import is Complete:

1. **Download logs** (if you want to keep them):
   ```bash
   # On your local machine
   scp -i ~/Downloads/YOUR-KEY.pem ec2-user@YOUR-EC2-IP:~/import.log ~/Downloads/
   ```

2. **Terminate EC2 instance** (to avoid charges):
   - Go to EC2 Console
   - Select your instance
   - Click **Instance state → Terminate instance**
   - Confirm termination

3. **Keep the JSON backup** on your local machine

---

## Alternative: Upload Files Using AWS S3

If files are too large for direct SCP:

### Upload to S3 from Local Machine:

```bash
# Create S3 bucket
aws s3 mb s3://arbrit-mongodb-backup

# Upload files
aws s3 cp /Users/sms01/Downloads/arbrit-safety-export/Json/ s3://arbrit-mongodb-backup/Json/ --recursive

# Upload script
aws s3 cp /Users/sms01/Downloads/arbrit-safety-export/scripts/ec2-import-dynamodb.sh s3://arbrit-mongodb-backup/
```

### Download on EC2:

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@YOUR-EC2-IP

# Download files
aws s3 cp s3://arbrit-mongodb-backup/Json/ ~/Json/ --recursive
aws s3 cp s3://arbrit-mongodb-backup/ec2-import-dynamodb.sh ~/

# Run import
chmod +x ~/ec2-import-dynamodb.sh
./ec2-import-dynamodb.sh
```

---

## Using AWS Credentials Instead of IAM Role

If you prefer to use AWS credentials instead of IAM role:

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@YOUR-EC2-IP

# Set environment variables
export AWS_ACCESS_KEY_ID='your-access-key-id'
export AWS_SECRET_ACCESS_KEY='your-secret-access-key'
export AWS_REGION='us-east-1'

# Run import script
./ec2-import-dynamodb.sh
```

---

## Troubleshooting

### Error: "Permission denied (publickey)"

**Solution:** Check your key file permissions:
```bash
chmod 400 ~/Downloads/YOUR-KEY.pem
```

### Error: "Connection timed out"

**Solutions:**
1. Check security group allows SSH (port 22) from your IP
2. Verify instance is running
3. Check public IP is correct

### Error: "No AWS credentials found"

**Solutions:**
1. Attach IAM role to EC2 instance
2. Or set environment variables (see above)

### Error: "Access Denied" when creating tables

**Solution:** IAM role needs `AmazonDynamoDBFullAccess` policy

### Error: "No JSON files found"

**Solution:** 
1. Verify files were uploaded: `ls -lh ~/Json/`
2. Re-upload if missing

---

## Cost Estimate

### EC2 Costs:
- **t2.micro**: $0.0116/hour (~$0.12 for 10-hour session)
- **t3.small**: $0.0208/hour (~$0.21 for 10-hour session)
- **Free Tier**: First 750 hours/month free (t2.micro)

### DynamoDB Costs:
- **Import**: ~$0.01 for 10,000 documents
- **Storage**: $0.25/GB/month

### Total:
For small to medium datasets: **< $1.00 total**

---

## Summary

### **Quick Commands:**

```bash
# 1. Upload files
scp -i YOUR-KEY.pem -r Json/ ec2-user@YOUR-EC2-IP:~/Json/
scp -i YOUR-KEY.pem ec2-import-dynamodb.sh ec2-user@YOUR-EC2-IP:~/

# 2. SSH and run
ssh -i YOUR-KEY.pem ec2-user@YOUR-EC2-IP
chmod +x ~/ec2-import-dynamodb.sh
./ec2-import-dynamodb.sh

# 3. Verify
aws dynamodb list-tables --region us-east-1
```

### **Key Points:**
- ✅ Use IAM role for security (no credentials in environment)
- ✅ t2.micro is sufficient for most imports
- ✅ Script is fully automated
- ✅ Terminate EC2 after import to save costs

---

## Next Steps

After successful import:
1. ✅ Verify data in DynamoDB console
2. ✅ Update your application to use DynamoDB
3. ✅ Deploy your application to AWS
4. ✅ Keep JSON backups safe
5. ✅ Terminate the import EC2 instance

Good luck! 🚀


