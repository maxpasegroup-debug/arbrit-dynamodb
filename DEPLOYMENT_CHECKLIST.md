# AWS ECS Deployment Checklist - Arbrit CRM

## ✅ Pre-Deployment Verification (Completed)

### Backend
- [x] All syntax errors fixed in `backend/server.py`
- [x] DynamoDB wrapper methods added to `backend/dynamodb_layer.py`
- [x] Python files compile without errors
- [x] Requirements.txt has all dependencies

### Frontend
- [x] Production build generated (`frontend/build/`)
- [x] Backend URL configured for HTTPS
- [x] All static assets present

### Docker
- [x] `Dockerfile.backend` configured correctly
- [x] `Dockerfile.frontend` configured correctly
- [x] `nginx.conf` present and valid

### Git
- [x] All changes committed to `Arbrit-Dynamo-25112025` branch
- [x] Branch pushed to remote

## 📋 Deployment Commands (EC2)

### 1. Connect to EC2
```bash
ssh -i /Users/sms01/Desktop/Max/arbrit-key.pem ec2-user@<EC2_IP>
cd /home/ec2-user/arbrit-dynamodb
```

### 2. Pull Latest Code
```bash
git fetch origin Arbrit-Dynamo-25112025
git reset --hard origin/Arbrit-Dynamo-25112025
git pull origin Arbrit-Dynamo-25112025
```

### 3. Verify Files
```bash
# Check backend fix
grep -n "async def get_item" backend/dynamodb_layer.py

# Check frontend build
ls -la frontend/build/index.html

# Verify Python syntax
python3 -m py_compile backend/server.py backend/dynamodb_layer.py
```

### 4. Build Backend Docker Image
```bash
# Build with unique tag
BACKEND_TAG="v1.0-$(date +%Y%m%d-%H%M)"
sudo docker build --no-cache -f Dockerfile.backend \
  -t 525610232738.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:$BACKEND_TAG \
  .

# Test locally
sudo docker run -d --name test-backend -p 8001:8001 \
  -e AWS_REGION=us-east-1 \
  525610232738.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:$BACKEND_TAG

sleep 10
curl http://localhost:8001/api/health
sudo docker rm -f test-backend
```

### 5. Build Frontend Docker Image
```bash
# Build with unique tag
FRONTEND_TAG="v1.0-$(date +%Y%m%d-%H%M)"
sudo docker build --no-cache -f Dockerfile.frontend \
  -t 525610232738.dkr.ecr.us-east-1.amazonaws.com/arbrit-frontend:$FRONTEND_TAG \
  .

# Verify build folder in image
sudo docker run --rm 525610232738.dkr.ecr.us-east-1.amazonaws.com/arbrit-frontend:$FRONTEND_TAG \
  ls -la /usr/share/nginx/html/
```

### 6. Push to ECR
```bash
# Login
aws ecr get-login-password --region us-east-1 | \
  sudo docker login --username AWS --password-stdin \
  525610232738.dkr.ecr.us-east-1.amazonaws.com

# Push backend
sudo docker push 525610232738.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:$BACKEND_TAG

# Push frontend
sudo docker push 525610232738.dkr.ecr.us-east-1.amazonaws.com/arbrit-frontend:$FRONTEND_TAG
```

### 7. Update ECS Task Definitions

#### Backend Task Definition
```bash
cat > /tmp/backend-taskdef.json << 'TASKDEF'
{
  "family": "arbrit-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "taskRoleArn": "arn:aws:iam::525610232738:role/ecsTaskRole",
  "executionRoleArn": "arn:aws:iam::525610232738:role/ecsTaskExecutionRole",
  "containerDefinitions": [{
    "name": "backend",
    "image": "525610232738.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:BACKEND_TAG_PLACEHOLDER",
    "essential": true,
    "portMappings": [{"containerPort": 8001, "protocol": "tcp"}],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/arbrit-backend",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "ecs",
        "awslogs-create-group": "true"
      }
    }
  }]
}
TASKDEF

# Replace placeholder with actual tag
sed -i "s/BACKEND_TAG_PLACEHOLDER/$BACKEND_TAG/" /tmp/backend-taskdef.json

# Register new task definition
aws ecs register-task-definition \
  --cli-input-json file:///tmp/backend-taskdef.json \
  --region us-east-1
```

#### Frontend Task Definition
```bash
cat > /tmp/frontend-taskdef.json << 'TASKDEF'
{
  "family": "arbrit-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "taskRoleArn": "arn:aws:iam::525610232738:role/ecsTaskRole",
  "executionRoleArn": "arn:aws:iam::525610232738:role/ecsTaskExecutionRole",
  "containerDefinitions": [{
    "name": "frontend",
    "image": "525610232738.dkr.ecr.us-east-1.amazonaws.com/arbrit-frontend:FRONTEND_TAG_PLACEHOLDER",
    "essential": true,
    "portMappings": [{"containerPort": 80, "protocol": "tcp"}],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/arbrit-frontend",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "ecs",
        "awslogs-create-group": "true"
      }
    }
  }]
}
TASKDEF

# Replace placeholder
sed -i "s/FRONTEND_TAG_PLACEHOLDER/$FRONTEND_TAG/" /tmp/frontend-taskdef.json

# Register
aws ecs register-task-definition \
  --cli-input-json file:///tmp/frontend-taskdef.json \
  --region us-east-1
```

### 8. Deploy to ECS
```bash
# Update backend service
aws ecs update-service \
  --cluster arbrit-cluster \
  --service arbrit-backend-service \
  --task-definition arbrit-backend \
  --force-new-deployment \
  --region us-east-1

# Update frontend service
aws ecs update-service \
  --cluster arbrit-cluster \
  --service arbrit-frontend-service \
  --task-definition arbrit-frontend \
  --force-new-deployment \
  --region us-east-1

# Stop old tasks
for task in $(aws ecs list-tasks --cluster arbrit-cluster --service-name arbrit-backend-service --region us-east-1 --query 'taskArns[]' --output text); do
  aws ecs stop-task --cluster arbrit-cluster --task $task --region us-east-1
done

for task in $(aws ecs list-tasks --cluster arbrit-cluster --service-name arbrit-frontend-service --region us-east-1 --query 'taskArns[]' --output text); do
  aws ecs stop-task --cluster arbrit-cluster --task $task --region us-east-1
done
```

### 9. Monitor Deployment
```bash
# Wait for tasks to start
sleep 120

# Check backend logs
aws logs tail /ecs/arbrit-backend --since 3m --region us-east-1 | grep -E "Database initialized|Application startup|ERROR"

# Check frontend logs
aws logs tail /ecs/arbrit-frontend --since 3m --region us-east-1

# Verify services
aws ecs describe-services \
  --cluster arbrit-cluster \
  --services arbrit-backend-service arbrit-frontend-service \
  --region us-east-1 \
  --query 'services[*].{name:serviceName,running:runningCount,desired:desiredCount}' \
  --output table
```

### 10. Test Application
```bash
# Test backend health
curl https://iceconnect.in/api/health

# Test login page
curl -I https://iceconnect.in/login
```

## 🔄 Rollback Procedure (If Needed)

### Quick Rollback
```bash
# Rollback to previous task definition
aws ecs update-service \
  --cluster arbrit-cluster \
  --service arbrit-backend-service \
  --task-definition arbrit-backend:11 \
  --force-new-deployment \
  --region us-east-1
```

## 📝 Current Production State

- **Backend Image**: `v1.0-20251127` (working)
- **Frontend Build**: Latest with HTTPS configuration
- **Database**: DynamoDB with 35 users
- **Domain**: https://iceconnect.in
- **Status**: ✅ Healthy

## ⚠️ Important Notes

1. **Always test images locally before pushing**
2. **Use unique tags for each deployment** (not `latest`)
3. **Keep old task definitions** for quick rollback
4. **Monitor logs for at least 5 minutes** after deployment
5. **Verify health checks pass** before considering deployment complete

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check logs
aws logs tail /ecs/arbrit-backend --since 10m --region us-east-1

# Common issues:
# - Missing environment variables
# - DynamoDB permissions
# - Syntax errors (run: python3 -m py_compile backend/server.py)
```

### Frontend shows old content
```bash
# Verify build folder was included in image
sudo docker run --rm IMAGE_NAME ls -la /usr/share/nginx/html/

# If missing, rebuild locally and transfer
cd /Users/sms01/Downloads/ARBRIT-CRM-AWS-FINAL-main/frontend
npm run build
scp -r build/ ec2-user@EC2_IP:/home/ec2-user/arbrit-dynamodb/frontend/
```

### Health checks failing
```bash
# Check target group health
aws elbv2 describe-target-health \
  --target-group-arn TARGET_GROUP_ARN \
  --region us-east-1
```

---

**Deployment prepared by**: Cursor AI Assistant
**Last verified**: November 27, 2025
**Branch**: Arbrit-Dynamo-25112025
