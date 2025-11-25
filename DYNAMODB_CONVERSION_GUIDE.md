# DynamoDB Conversion Deployment Guide

## ✅ What's Been Done

1. ✅ Identified 23 MongoDB collections
2. ✅ Designed DynamoDB table structure (1 table per collection)
3. ✅ Created DynamoDB abstraction layer (`dynamodb_layer.py`)
4. ✅ Updated `requirements.txt` (removed pymongo/motor, added aioboto3)
5. ✅ Updated `server.py` to use DynamoDB
6. ✅ Created table creation script

## 📋 Deployment Steps

### Step 1: Create DynamoDB Tables (AWS Console or CLI)

#### Option A: Using AWS CLI (Recommended)

```bash
# On your Mac or EC2
cd /Users/sms01/Downloads/arbrit-safety-export
chmod +x scripts/create-dynamodb-tables.sh
./scripts/create-dynamodb-tables.sh
```

#### Option B: Using AWS Console

1. Go to: https://console.aws.amazon.com/dynamodbv2/home?region=us-east-1#tables
2. Click **Create table** for each table:
   - **arbrit-users** (Primary key: `mobile` as String, GSI: `id`)
   - **arbrit-employees** (Primary key: `id` as String, GSI: `mobile`, `department`)
   - **arbrit-attendance** (Primary key: `id` as String, GSI: `employee_id`, `date`)
   - And 20 more simple tables with `id` as primary key
3. Use **On-demand** billing mode

### Step 2: Update Backend Files on EC2

```bash
# On your Mac - create tarball with new files
cd /Users/sms01/Downloads/arbrit-safety-export
tar -czf dynamodb-backend.tar.gz \
    backend/server.py \
    backend/requirements.txt \
    backend/dynamodb_layer.py \
    Dockerfile.backend

# Upload to EC2
scp -i /Users/sms01/Desktop/Max/arbrit-key.pem dynamodb-backend.tar.gz ec2-user@44.200.111.147:~/
```

```bash
# On EC2 - extract files
ssh -i /Users/sms01/Desktop/Max/arbrit-key.pem ec2-user@44.200.111.147
cd /home/ec2-user/arbrit-safety-export
tar -xzf ~/dynamodb-backend.tar.gz

# Verify files
ls -la backend/dynamodb_layer.py  # Should exist
grep "DynamoDBDatabase" backend/server.py  # Should show import
```

### Step 3: Rebuild Docker Image

```bash
# On EC2
cd /home/ec2-user/arbrit-safety-export

# Rebuild with DynamoDB support
docker build -f Dockerfile.backend -t arbrit-backend:latest --no-cache .

# Tag and push to ECR
docker tag arbrit-backend:latest 525610232738.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:dynamodb
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 525610232738.dkr.ecr.us-east-1.amazonaws.com
docker push 525610232738.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:dynamodb
```

### Step 4: Update ECS Task Definition

1. **Go to:** https://console.aws.amazon.com/ecs/v2/task-definitions/arbrit-backend
2. Click latest revision
3. Click **Create new revision**
4. **Container - backend:**
   - **Image URI:** Change to `525610232738.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:dynamodb`
5. **Environment variables:**
   - ❌ **REMOVE:** `MONGO_URL`
   - ❌ **REMOVE:** `DB_NAME`
   - ✅ **ADD:** `AWS_REGION` = `us-east-1`
   - ✅ **KEEP:** `JWT_SECRET_KEY`
   - ✅ **KEEP:** `CORS_ORIGINS`
6. **Task role:** Make sure it has DynamoDB permissions
7. Click **Create**

### Step 5: Update ECS Task IAM Role

The ECS task needs DynamoDB permissions:

1. **Go to:** https://console.aws.amazon.com/iam/home#/roles
2. Find the task role (e.g., `ecsTaskRole`)
3. Click **Attach policies**
4. Attach **AmazonDynamoDBFullAccess** (or create custom policy)
5. Click **Attach policy**

**Or create a custom policy with minimum permissions:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:525610232738:table/arbrit-*",
        "arn:aws:dynamodb:us-east-1:525610232738:table/arbrit-*/index/*"
      ]
    }
  ]
}
```

### Step 6: Deploy to ECS

1. **Go to:** https://console.aws.amazon.com/ecs/v2/clusters/arbrit-cluster/services/arbrit-backend-service
2. Click **Update**
3. **Revision:** Select the new revision with DynamoDB
4. Check **Force new deployment**
5. Click **Update**

### Step 7: Monitor Deployment

1. Go to **Tasks** tab
2. Watch new task start: **PENDING** → **RUNNING**
3. Click on the **RUNNING** task
4. Check **Logs** tab

**Expected logs:**
```
🔵 Initializing DynamoDB connection to region: us-east-1
✅ DynamoDB client initialized successfully for region: us-east-1
✅ Database connection verified
✅ DynamoDB tables configured with GSI indexes
INFO: Application startup complete
INFO: Uvicorn running on http://0.0.0.0:8001
```

### Step 8: Test the API

```bash
# Test health endpoint
curl http://arbrit-alb-1639046058.us-east-1.elb.amazonaws.com/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "message": "Backend and database are operational"
}
```

## 🎯 Benefits of DynamoDB Conversion

✅ **No SSL/TLS issues** - Native AWS integration
✅ **Better performance** - Single-digit millisecond latency  
✅ **Auto-scaling** - Handles any load automatically
✅ **Cost-effective** - Pay per request (on-demand)
✅ **Serverless** - No server management
✅ **High availability** - Multi-AZ replication

## 📊 DynamoDB Table Structure

| Table Name | Primary Key | GSI (Global Secondary Indexes) |
|------------|-------------|--------------------------------|
| arbrit-users | mobile | id |
| arbrit-employees | id | mobile, department |
| arbrit-attendance | id | employee_id, date |
| arbrit-* (others) | id | - |

## 🔧 Troubleshooting

### Issue: "AccessDeniedException"
**Solution:** Add DynamoDB permissions to ECS task role (Step 5)

### Issue: "ResourceNotFoundException: Requested resource not found"
**Solution:** Create DynamoDB tables (Step 1)

### Issue: "Module 'dynamodb_layer' not found"
**Solution:** Ensure `dynamodb_layer.py` is uploaded to EC2 and included in Docker build

### Issue: Old MongoDB errors still appearing
**Solution:** 
1. Verify new image was built: `docker images | grep dynamodb`
2. Verify task is using new revision
3. Stop all tasks to force fresh start

## 📝 Notes

- **Table prefix:** All tables use `arbrit-` prefix
- **Billing:** On-demand mode (no fixed costs)
- **Region:** us-east-1 (same as ECS)
- **Indexes:** Pre-configured GSIs for common queries
- **Migration:** No data migration needed (fresh start)

## ✅ Success Checklist

- [ ] DynamoDB tables created (23 tables)
- [ ] IAM role has DynamoDB permissions
- [ ] Backend files updated on EC2
- [ ] Docker image rebuilt and pushed
- [ ] Task definition updated (no MONGO_URL)
- [ ] Service deployed with new revision
- [ ] Logs show "DynamoDB client initialized"
- [ ] Health endpoint returns success
- [ ] Frontend can access backend APIs

---

**Ready to deploy? Start with Step 1!**

