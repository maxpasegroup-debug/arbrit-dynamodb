# Next Steps: MongoDB to DynamoDB Migration

## Current Status ✅

You have successfully:
- ✅ Created all 23 DynamoDB tables
- ✅ Fixed IAM permissions for DynamoDB access
- ✅ Backend code already supports DynamoDB (`dynamodb_layer.py`)

## What You Need to Do Next

### Option 1: Migrate Existing MongoDB Data (If You Have MongoDB Data)

#### Step 1: Upload Migration Script

From your **Mac**, run:

```bash
cd /Users/sms01/Downloads/arbrit-safety-export
scp -i /Users/sms01/Desktop/Max/arbrit-key.pem scripts/migrate-mongodb-to-dynamodb.py ec2-user@44.200.111.147:~/
scp -i /Users/sms01/Desktop/Max/arbrit-key.pem scripts/quick-migrate.sh ec2-user@44.200.111.147:~/
```

#### Step 2: Run Migration

On your **EC2 instance**:

```bash
# Set your MongoDB connection string
export MONGO_URL="mongodb+srv://username:password@cluster.mongodb.net/arbrit-workdesk?retryWrites=true&w=majority"
export DB_NAME="arbrit-workdesk"

# Run the quick migration script
chmod +x quick-migrate.sh
./quick-migrate.sh
```

The script will:
- Install required Python packages (pymongo, boto3)
- Connect to both MongoDB and DynamoDB
- Migrate all data with progress updates
- Verify the migration succeeded
- Show summary

---

### Option 2: Start Fresh with Seed Data (If No MongoDB or Testing)

#### Step 1: Upload Seed Script

From your **Mac**:

```bash
cd /Users/sms01/Downloads/arbrit-safety-export
scp -i /Users/sms01/Desktop/Max/arbrit-key.pem scripts/seed-dynamodb.py ec2-user@44.200.111.147:~/
```

#### Step 2: Create Admin User

On your **EC2 instance**:

```bash
# Install dependencies
pip3 install boto3 passlib bcrypt --user

# Run seed script
python3 seed-dynamodb.py
```

This creates an admin user:
- **Mobile:** 9876543210
- **Password:** admin123
- **Role:** MD (Managing Director)

---

## After Migration/Seeding

### Test Your Application

1. **Check backend is using DynamoDB:**

```bash
# On EC2
docker logs arbrit-backend 2>&1 | grep -i dynamodb
```

Look for:
```
🔵 Initializing DynamoDB connection to region: us-east-1
✅ DynamoDB client initialized successfully
```

2. **Test login:**

```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobile": "9876543210", "password": "admin123"}'
```

3. **Access your application:** Open in browser and test all features

---

## Deployment to ECS (If Using ECS)

If your backend is running on ECS, you need to rebuild and deploy:

```bash
# On EC2
cd ~/arbrit-safety-export

# Rebuild Docker image
docker build -f Dockerfile.backend -t arbrit-backend:dynamodb --no-cache .

# Tag for ECR
docker tag arbrit-backend:dynamodb 525610232738.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:latest

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 525610232738.dkr.ecr.us-east-1.amazonaws.com

# Push to ECR
docker push 525610232738.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:latest

# Update ECS service
aws ecs update-service \
  --cluster arbrit-cluster \
  --service arbrit-backend-service \
  --force-new-deployment \
  --region us-east-1
```

---

## Verification Checklist

After migration, verify:

- [ ] DynamoDB tables have data:
  ```bash
  aws dynamodb scan --table-name arbrit-users --select COUNT --region us-east-1
  ```

- [ ] Backend connects to DynamoDB (check logs)

- [ ] Login works

- [ ] Can view employees/leads/other data

- [ ] Can create new records

- [ ] Can update existing records

- [ ] Can delete records

---

## Important Notes

### Keep MongoDB as Backup

- **Do NOT delete MongoDB yet**
- Keep it running for at least 2-4 weeks
- Monitor DynamoDB performance
- Verify all functionality works

### DynamoDB Costs

- Using **On-Demand** billing mode
- Pay only for what you use
- Typically much cheaper than MongoDB Atlas
- Monitor costs in AWS Cost Explorer

### Point-in-Time Recovery (Backups)

Enable backups for production:

```bash
# Enable for all tables
for table in arbrit-users arbrit-employees arbrit-attendance arbrit-leads; do
  aws dynamodb update-continuous-backups \
    --table-name $table \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
    --region us-east-1
done
```

---

## Troubleshooting

### Issue: "Cannot connect to MongoDB"

**Solution:** 
- Check MongoDB connection string
- Whitelist EC2 IP in MongoDB Atlas
- Verify credentials

### Issue: "No such file or directory: pymongo"

**Solution:**
```bash
pip3 install pymongo boto3 --user
```

### Issue: "DynamoDB tables empty after migration"

**Solution:**
- Check migration script output for errors
- Verify IAM permissions
- Re-run migration script

### Issue: "Backend still using MongoDB"

**Solution:**
- Check environment variables
- Ensure `dynamodb_layer.py` exists
- Rebuild Docker container
- Check backend logs

---

## Get MongoDB Connection String

If you don't have your MongoDB connection string:

### MongoDB Atlas:
1. Go to: https://cloud.mongodb.com/
2. Select your cluster
3. Click **Connect** → **Connect your application**
4. Copy connection string
5. Replace `<password>` with actual password

### Self-Hosted:
```bash
export MONGO_URL="mongodb://username:password@host:27017/arbrit-workdesk"
```

---

## Quick Commands Reference

```bash
# Check DynamoDB tables
aws dynamodb list-tables --region us-east-1

# Count items in a table
aws dynamodb scan --table-name arbrit-users --select COUNT --region us-east-1

# Get a specific user
aws dynamodb get-item \
  --table-name arbrit-users \
  --key '{"mobile": {"S": "9876543210"}}' \
  --region us-east-1

# Check backend logs
docker logs -f arbrit-backend

# Restart backend
docker restart arbrit-backend
```

---

## Summary

**Current Step:** Migration ready to execute

**Choose your path:**
1. **Have MongoDB data?** → Use migration script (Option 1)
2. **Fresh start?** → Use seed script (Option 2)

**After migration:**
- Test thoroughly
- Keep MongoDB backup
- Monitor for 2-4 weeks
- Enable DynamoDB backups

**Need help?** Check `MONGODB_TO_DYNAMODB_MIGRATION.md` for detailed guide.

---

## Files Created

- ✅ `scripts/migrate-mongodb-to-dynamodb.py` - Main migration script
- ✅ `scripts/quick-migrate.sh` - Quick migration helper
- ✅ `scripts/seed-dynamodb.py` - Create admin user for testing
- ✅ `MONGODB_TO_DYNAMODB_MIGRATION.md` - Detailed migration guide
- ✅ `NEXT_STEPS_MIGRATION.md` - This file (quick reference)

**You're all set! Pick your option and proceed! 🚀**


