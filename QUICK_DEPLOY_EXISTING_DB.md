# 🚀 Quick Deploy - You Already Have Database!

## Simplified Path (60-90 minutes)

Since you already have MongoDB setup, we skip Step 1! Let's go straight to deployment.

---

## 📋 What You Need Ready

Before starting, have these ready:

1. ✅ **MongoDB Connection String** 
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/database-name`
   - Have it? Copy it to a note!

2. ✅ **Database Name**
   - What database name are you using?
   - Default: `arbrit-workdesk`

3. ⚠️ **JWT Secret Key** (we'll generate this)
4. ⚠️ **Domain name** (optional - can use AWS URL temporarily)

---

## 🎯 Deployment Steps

### Step 1: Create AWS Cloud9 Environment (5 minutes)

**This is your browser-based workspace - no local setup needed!**

1. **Login:** https://console.aws.amazon.com
2. **Search:** "Cloud9" in top search bar
3. **Region:** Select **us-east-1** (top right)
4. **Create environment:**
   - Name: `arbrit-builder`
   - Instance type: **t3.small** (2 GB RAM)
   - Platform: Amazon Linux 2023
   - Timeout: 30 minutes
5. **Click:** "Create"
6. **Wait:** 2-3 minutes
7. **Click:** "Open" when ready

✅ **You now have a browser-based IDE with Docker pre-installed!**

---

### Step 2: Upload Project to Cloud9 (5 minutes)

**In Cloud9 (browser window):**

1. **File → Upload Local Files**
2. **Browse to:** `/Users/sms01/Downloads/arbrit-safety-export`
3. **Select all** files and folders
4. **Upload**
5. **Wait:** 3-5 minutes for upload

**Or drag & drop files into Cloud9 file explorer (left panel)**

---

### Step 3: Get AWS Account ID (1 minute)

**In Cloud9 terminal (bottom pane), type:**

```bash
aws sts get-caller-identity --query Account --output text
```

**Save this 12-digit number!** Example: `123456789012`

---

### Step 4: Generate JWT Secret Key (30 seconds)

**In Cloud9 terminal, run:**

```bash
openssl rand -hex 32
```

**Copy the output** - this is your JWT secret key!  
Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2`

**Save this!**

---

### Step 5: Prepare Your Environment Variables

**Create a note with these values filled in:**

```
AWS_ACCOUNT_ID=123456789012
MONGO_URL=mongodb+srv://your-user:your-pass@cluster.mongodb.net/arbrit-workdesk
DB_NAME=arbrit-workdesk
JWT_SECRET_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Replace:**
- `123456789012` - with your AWS Account ID
- `mongodb+srv://...` - with your MongoDB connection string
- `arbrit-workdesk` - with your database name (if different)
- `a1b2c3d4...` - with your generated JWT secret
- `yourdomain.com` - with your domain (or leave as is for now)

---

### Step 6: Build & Push Docker Images (20 minutes)

**In Cloud9 terminal, copy-paste these commands:**

```bash
# Navigate to project
cd arbrit-safety-export

# Set your AWS Account ID (replace with YOUR number)
export AWS_ACCOUNT_ID=YOUR_12_DIGIT_NUMBER
echo "Account ID: $AWS_ACCOUNT_ID"

# Create ECR repositories
aws ecr create-repository --repository-name arbrit-backend --region us-east-1
aws ecr create-repository --repository-name arbrit-frontend --region us-east-1

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build backend (takes ~10 mins)
docker build -f Dockerfile.backend -t arbrit-backend:latest .

# Tag & push backend
docker tag arbrit-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:latest

# Build frontend (takes ~3 mins)
docker build -f Dockerfile.frontend -t arbrit-frontend:latest .

# Tag & push frontend
docker tag arbrit-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/arbrit-frontend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/arbrit-frontend:latest
```

✅ **When you see "Pushed" for both images, you're done with Cloud9!**

**You can close Cloud9 now.**

---

### Step 7: Create IAM Roles (5 minutes)

**These allow ECS to run your containers:**

1. **Go to:** [IAM Console](https://console.aws.amazon.com/iam) → Roles
2. **Create role:**
   - Trusted entity: **AWS service** → **Elastic Container Service Task**
   - Permissions: `AmazonECSTaskExecutionRolePolicy` + `CloudWatchLogsFullAccess`
   - Name: `ecsTaskExecutionRole`
   - Create

3. **Create another role:**
   - Same process
   - No policies needed
   - Name: `ecsTaskRole`
   - Create

---

### Step 8: Create ECS Cluster (2 minutes)

1. **Go to:** [ECS Console](https://console.aws.amazon.com/ecs)
2. **Click:** "Create Cluster"
3. **Name:** `arbrit-cluster`
4. **Infrastructure:** AWS Fargate (serverless)
5. **Click:** "Create"

---

### Step 9: Create CloudWatch Log Groups (2 minutes)

1. **Go to:** [CloudWatch Console](https://console.aws.amazon.com/cloudwatch) → Logs
2. **Create log group:**
   - Name: `/ecs/arbrit-backend`
   - Click "Create"
3. **Create another:**
   - Name: `/ecs/arbrit-frontend`
   - Click "Create"

---

### Step 10: Create Task Definitions (10 minutes)

**This is where you'll use your environment variables!**

#### A. Backend Task Definition

1. **Go to:** ECS → Task Definitions → Create new
2. **Family:** `arbrit-backend`
3. **Launch type:** AWS Fargate
4. **CPU:** 0.5 vCPU
5. **Memory:** 1 GB
6. **Task roles:**
   - Execution role: `ecsTaskExecutionRole`
   - Task role: `ecsTaskRole`

7. **Container - 1:**
   - Name: `backend`
   - Image: `YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:latest`
     *(Replace YOUR_ACCOUNT_ID)*
   - Port: `8001` (TCP)

8. **Environment variables** (Click "Add environment variable" for each):
   ```
   MONGO_URL = your-mongodb-connection-string
   DB_NAME = arbrit-workdesk
   JWT_SECRET_KEY = your-generated-jwt-secret
   CORS_ORIGINS = https://yourdomain.com,https://www.yourdomain.com
   ```

9. **Logging:**
   - Log driver: awslogs
   - awslogs-group: `/ecs/arbrit-backend`
   - awslogs-region: `us-east-1`
   - awslogs-stream-prefix: `ecs`

10. **Click:** "Create"

#### B. Frontend Task Definition

1. **Create another task:**
   - Family: `arbrit-frontend`
   - CPU: 0.25 vCPU
   - Memory: 0.5 GB
   - Image: `YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/arbrit-frontend:latest`
   - Port: `80` (TCP)
   - Same logging setup (use `/ecs/arbrit-frontend`)
   - **No environment variables needed**

2. **Click:** "Create"

---

### Step 11: Create Security Group (3 minutes)

1. **Go to:** [VPC Console](https://console.aws.amazon.com/vpc) → Security Groups
2. **Create security group:**
   - Name: `arbrit-ecs-sg`
   - VPC: Default VPC
3. **Inbound rules:**
   - HTTP (80) from Anywhere (0.0.0.0/0)
   - Custom TCP (8001) from Anywhere (0.0.0.0/0)
4. **Create**

---

### Step 12: Create Application Load Balancer (10 minutes)

1. **Go to:** [EC2 Console](https://console.aws.amazon.com/ec2) → Load Balancers
2. **Create Load Balancer** → Application Load Balancer
3. **Settings:**
   - Name: `arbrit-alb`
   - Scheme: Internet-facing
   - VPC: Default
   - Subnets: Select at least 2
4. **Security group:**
   - Create new: `arbrit-alb-sg`
   - Allow HTTP (80) and HTTPS (443)
5. **Create**
6. **Copy DNS name:** `arbrit-alb-xxxxx.us-east-1.elb.amazonaws.com`

---

### Step 13: Create Target Groups (5 minutes)

**Backend:**
- Name: `arbrit-backend-tg`
- Type: IP addresses
- Protocol: HTTP, Port: 8001
- Health check: `/api/health`

**Frontend:**
- Name: `arbrit-frontend-tg`
- Type: IP addresses
- Protocol: HTTP, Port: 80
- Health check: `/`

---

### Step 14: Configure ALB Listener (3 minutes)

1. **Load Balancers** → Select `arbrit-alb` → Listeners
2. **Add HTTP:80 listener:**
   - Default: Forward to `arbrit-frontend-tg`
   - Add rule: Path `/api/*` → Forward to `arbrit-backend-tg`

---

### Step 15: Create ECS Services (10 minutes)

**Backend Service:**
1. **ECS** → Clusters → `arbrit-cluster` → Create Service
2. **Settings:**
   - Launch type: FARGATE
   - Task definition: `arbrit-backend`
   - Service name: `arbrit-backend-service`
   - Desired tasks: 1
3. **Networking:**
   - VPC: Default
   - Subnets: At least 2
   - Security group: `arbrit-ecs-sg`
   - Public IP: ENABLED
4. **Load balancer:**
   - Type: Application Load Balancer
   - Load balancer: `arbrit-alb`
   - Container: backend 8001
   - Target group: `arbrit-backend-tg`
5. **Create**

**Frontend Service:**
- Same process
- Use `arbrit-frontend` task
- Service name: `arbrit-frontend-service`
- Container: frontend 80
- Target group: `arbrit-frontend-tg`

---

### Step 16: Wait & Verify (5-10 minutes)

**Check services are healthy:**

1. **ECS** → Clusters → Services → Check status = "Active"
2. **EC2** → Target Groups → Check targets = "healthy"

**Test your application:**

```
http://arbrit-alb-xxxxx.us-east-1.elb.amazonaws.com/api/health
```
Should return: `{"status":"healthy"}`

```
http://arbrit-alb-xxxxx.us-east-1.elb.amazonaws.com
```
Should show: Login page

**Try logging in:**
- Mobile: `971564022503`
- PIN: `2503`

---

### Step 17: Add SSL (Optional - 10 minutes)

1. **Certificate Manager** → Request certificate
2. **Add domains:** `yourdomain.com` and `*.yourdomain.com`
3. **Validate via DNS** (add CNAME records)
4. **Add HTTPS:443 listener** to ALB with certificate
5. **Update DNS** to point to ALB

---

## ✅ Success!

Your application is now running on AWS! 🎉

**Access via:**
- Temporary: `http://arbrit-alb-xxxxx.us-east-1.elb.amazonaws.com`
- Production: `https://yourdomain.com` (after SSL setup)

**Monthly cost:** ~$75-80

**Don't forget:**
1. Change default passwords after first login
2. Delete Cloud9 environment (saves $)
3. Setup backups for your database

---

## 🆘 Troubleshooting

**Tasks won't start:**
- Check CloudWatch logs: `/ecs/arbrit-backend`
- Verify MongoDB connection string is correct
- Check environment variables in task definition

**Can't access application:**
- Wait 10 minutes for everything to stabilize
- Check target groups are "healthy"
- Verify security groups allow traffic

**Need help?**
- See full guide: `AWS_CONSOLE_ONLY_GUIDE.md`
- Check: `AWS_DEPLOYMENT_GUIDE.md` for troubleshooting

---

**Last updated:** November 20, 2025



