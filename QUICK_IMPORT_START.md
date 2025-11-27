# 🚀 Quick Start - Import to DynamoDB

## You Have: 14 JSON Files ✅
## You Need: Import to DynamoDB ✅

---

## ONE-COMMAND IMPORT (Easiest!)

```bash
cd /Users/sms01/Downloads/arbrit-safety-export/scripts
./setup-and-import-dynamodb.sh
```

**When prompted, enter:**
1. AWS Access Key ID
2. AWS Secret Access Key  
3. AWS Region (or press Enter for us-east-1)

**Done!** ✅ The script will:
- ✅ Prepare your 14 JSON files
- ✅ Create 23 DynamoDB tables
- ✅ Import all data
- ✅ Verify everything worked

---

## Don't Have AWS Credentials?

### Get them here:

1. Go to: https://console.aws.amazon.com/
2. Login → Click your name (top right) → **Security credentials**
3. Scroll to **Access keys** → **Create access key**
4. Copy both:
   - **Access Key ID**
   - **Secret Access Key**

---

## What Gets Imported

Your 14 JSON files from `/Json/` folder:
- ✅ users.json
- ✅ employees.json
- ✅ attendance.json
- ✅ employee_documents.json
- ✅ company_documents.json
- ✅ leads.json
- ✅ quotations.json
- ✅ invoices.json
- ✅ invoice_requests.json
- ✅ expense_claims.json
- ✅ leave_requests.json
- ✅ visit_logs.json
- ✅ trainer_requests.json
- ✅ assessment_forms.json

---

## Cost

**Very cheap!** 💰
- Import ~10,000 documents: ~$0.01 (1 cent)
- Monthly storage (1 MB): ~$0.25/month

---

## Problems?

See the detailed guide: `IMPORT_TO_DYNAMODB_GUIDE.md`

---

## That's It!

**Just run:**
```bash
cd /Users/sms01/Downloads/arbrit-safety-export/scripts
./setup-and-import-dynamodb.sh
```

Your MongoDB data will be in DynamoDB in 5-10 minutes! 🎉


