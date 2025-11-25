# 🖱️ AWS Console-Only Deployment Guide
## No Command Line Required - Pure AWS Console

This guide shows you how to deploy using **only your web browser** - no AWS CLI, no terminal commands!

---

## ✅ What You'll Need

- [ ] AWS Account (create at https://aws.amazon.com/free/)
- [ ] MongoDB Atlas account (create at https://cloud.mongodb.com - FREE)
- [ ] Your project files (already in: `/Users/sms01/Downloads/arbrit-safety-export`)
- [ ] A web browser
- [ ] 2-3 hours of time

**No command line tools required!**

---

## 🎯 Deployment Overview

Since we can't build Docker images without Docker Desktop, we have **two approaches**:

### Approach 1: Use AWS Cloud9 (Recommended - All in Browser)
AWS Cloud9 is a **browser-based IDE** with everything pre-installed!

### Approach 2: Use Docker Desktop Locally (Minimal CLI)
Just for building images, then everything else via console.

---

## 🌟 Approach 1: Complete Browser-Based (Recommended)

### Step 1: Setup MongoDB Atlas (10 minutes)

1. **Go to:** https://cloud.mongodb.com
2. **Create free account** or login
3. **Create a Cluster:**
   - Click "Build a Database"
   - Choose "FREE" tier (M0 Sandbox)
   - Provider: **AWS**
   - Region: **us-east-1** (N. Virginia)
   - Cluster Name: `arbrit-cluster`
   - Click "Create"

4. **Create Database User:**
   - In Security → Database Access
   - Click "Add New Database User"
   - Username: `arbrit_admin`
   - Password: Click "Autogenerate Secure Password" (save this!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

5. **Setup Network Access:**
   - In Security → Network Access
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

6. **Get Connection String:**
   - Go to Database → Connect
   - Choose "Connect your application"
   - Driver: Node.js, Version: 4.1 or later
   - Copy the connection string:
   ```
   mongodb+srv://arbrit_admin:<password>@arbrit-cluster.xxxxx.mongodb.net/arbrit-workdesk
   ```
   - Replace `<password>` with your actual password
   - **Save this string!**

---

### Step 2: Create AWS Cloud9 Environment (5 minutes)

1. **Login to AWS Console:** https://console.aws.amazon.com
2. **Search for:** "Cloud9" in the top search bar
3. **Click:** "Create environment"
4. **Settings:**
   - Name: `arbrit-builder`
   - Environment type: New EC2 instance
   - Instance type: t3.small (2 GB RAM)
   - Platform: Amazon Linux 2
   - Timeout: 30 minutes
5. **Click:** "Create"
6. **Wait:** 2-3 minutes for environment to be ready
7. **Click:** "Open" to open Cloud9 IDE in browser

---

### Step 3: Upload Your Project to Cloud9 (5 minutes)

In Cloud9 IDE (browser window):

1. **In the left sidebar:** Right-click → "Upload Local Files"
2. **Navigate to:** `/Users/sms01/Downloads/arbrit-safety-export`
3. **Select all files and folders** (Cmd+A or Ctrl+A)
4. **Click:** "Upload"
5. **Wait:** for upload to complete

**Alternative:** Use File → Upload ZIP if easier
- Zip your project folder first
- Upload the ZIP
- In Cloud9 terminal: `unzip arbrit-safety-export.zip`

---

### Step 4: Get Your AWS Account ID (1 minute)

In Cloud9 terminal (bottom pane):

```bash
aws sts get-caller-identity --query Account --output text
```

**Save this 12-digit number!** Example: `123456789012`

---

### Step 5: Create ECR Repositories (5 minutes)

**ECR = Elastic Container Registry** (where Docker images are stored)

1. **Go to:** [AWS ECR Console](https://console.aws.amazon.com/ecr)
2. **Region:** Make sure you're in **us-east-1** (top right)
3. **Create Backend Repository:**
   - Click "Create repository"
   - Repository name: `arbrit-backend`
   - Tag immutability: Disabled
   - Image scan on push: Disabled (optional)
   - Click "Create repository"

4. **Create Frontend Repository:**
   - Click "Create repository"
   - Repository name: `arbrit-frontend`
   - Click "Create repository"

---

### Step 6: Build and Push Docker Images (20 minutes)

Back in **Cloud9 terminal:**

```bash
# Navigate to project
cd arbrit-safety-export

# Get your AWS Account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "Your Account ID: $AWS_ACCOUNT_ID"

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build backend image
docker build -f Dockerfile.backend -t arbrit-backend:latest .

# Tag backend image
docker tag arbrit-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:latest

# Push backend image
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:latest

# Build frontend image
docker build -f Dockerfile.frontend -t arbrit-frontend:latest .

# Tag frontend image
docker tag arbrit-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/arbrit-frontend:latest

# Push frontend image
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/arbrit-frontend:latest
```

**This will take 15-20 minutes.** You'll see progress bars.

✅ **Success when you see:** "Pushed" messages for both images.

---

### Step 7: Create IAM Roles (5 minutes)

**We need roles for ECS to run your containers.**

1. **Go to:** [IAM Console](https://console.aws.amazon.com/iam)
2. **Click:** Roles → Create role

**A. Create ECS Task Execution Role:**

1. Select trusted entity: **AWS service**
2. Use case: **Elastic Container Service** → **Elastic Container Service Task**
3. Click "Next"
4. Search and add: `AmazonECSTaskExecutionRolePolicy`
5. Search and add: `CloudWatchLogsFullAccess`
6. Click "Next"
7. Role name: `ecsTaskExecutionRole`
8. Click "Create role"

**B. Create ECS Task Role:**

1. Create another role
2. Same trusted entity: ECS Task
3. No policies needed (click Next)
4. Role name: `ecsTaskRole`
5. Click "Create role"

---

### Step 8: Create ECS Cluster (3 minutes)

1. **Go to:** [ECS Console](https://console.aws.amazon.com/ecs)
2. **Click:** "Get Started" or "Create Cluster"
3. **Cluster configuration:**
   - Cluster name: `arbrit-cluster`
   - Infrastructure: AWS Fargate (serverless)
   - Leave other defaults
4. **Click:** "Create"

---

### Step 9: Create CloudWatch Log Groups (2 minutes)

1. **Go to:** [CloudWatch Console](https://console.aws.amazon.com/cloudwatch)
2. **Click:** Logs → Log groups
3. **Create backend log group:**
   - Click "Create log group"
   - Log group name: `/ecs/arbrit-backend`
   - Click "Create"

4. **Create frontend log group:**
   - Click "Create log group"
   - Log group name: `/ecs/arbrit-frontend`
   - Click "Create"

---

### Step 10: Create Task Definitions (10 minutes)

**A. Backend Task Definition:**

1. **Go to:** ECS → Task Definitions → Create new task definition
2. **Task definition family:** `arbrit-backend`
3. **Infrastructure:**
   - Launch type: AWS Fargate
   - Operating system: Linux
   - CPU: 0.5 vCPU
   - Memory: 1 GB
   - Task execution role: `ecsTaskExecutionRole`
   - Task role: `ecsTaskRole`

4. **Container - 1:**
   - Name: `backend`
   - Image URI: `<YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:latest`
     (Replace `<YOUR_ACCOUNT_ID>` with your actual account ID)
   - Port mappings: 
     - Container port: `8001`
     - Protocol: TCP
   
5. **Environment variables:**
   Click "Add environment variable" for each:
   - `MONGO_URL` = `your-mongodb-connection-string`
   - `DB_NAME` = `arbrit-workdesk`
   - `JWT_SECRET_KEY` = `your-random-32-character-string`
   - `CORS_ORIGINS` = `https://yourdomain.com,https://www.yourdomain.com`

6. **Logging:**
   - Log driver: awslogs
   - awslogs-group: `/ecs/arbrit-backend`
   - awslogs-region: `us-east-1`
   - awslogs-stream-prefix: `ecs`

7. **Click:** "Create"

**B. Frontend Task Definition:**

1. **Create another task definition**
2. **Task definition family:** `arbrit-frontend`
3. **Infrastructure:**
   - Launch type: AWS Fargate
   - CPU: 0.25 vCPU
   - Memory: 0.5 GB
   - Task execution role: `ecsTaskExecutionRole`
   - Task role: `ecsTaskRole`

4. **Container:**
   - Name: `frontend`
   - Image URI: `<YOUR_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/arbrit-frontend:latest`
   - Port mappings: 
     - Container port: `80`
     - Protocol: TCP

5. **Logging:**
   - awslogs-group: `/ecs/arbrit-frontend`
   - awslogs-region: `us-east-1`
   - awslogs-stream-prefix: `ecs`

6. **Click:** "Create"

---

### Step 11: Create VPC Security Group (5 minutes)

1. **Go to:** [VPC Console](https://console.aws.amazon.com/vpc)
2. **Click:** Security Groups → Create security group
3. **Settings:**
   - Name: `arbrit-ecs-sg`
   - Description: Security group for Arbrit ECS services
   - VPC: Select your default VPC
4. **Inbound rules:**
   - Click "Add rule"
   - Type: HTTP, Port: 80, Source: Anywhere (0.0.0.0/0)
   - Add rule: Custom TCP, Port: 8001, Source: Anywhere (0.0.0.0/0)
5. **Outbound rules:**
   - Leave default (All traffic)
6. **Click:** "Create security group"

---

### Step 12: Create Application Load Balancer (10 minutes)

1. **Go to:** [EC2 Console](https://console.aws.amazon.com/ec2) → Load Balancers
2. **Click:** "Create Load Balancer"
3. **Select:** Application Load Balancer
4. **Configuration:**
   - Name: `arbrit-alb`
   - Scheme: Internet-facing
   - IP address type: IPv4
5. **Network mapping:**
   - VPC: Select your default VPC
   - Mappings: Select at least 2 availability zones
6. **Security groups:**
   - Create new security group:
     - Name: `arbrit-alb-sg`
     - Allow: HTTP (80) from Anywhere
     - Allow: HTTPS (443) from Anywhere
7. **Listeners:**
   - Don't configure now (we'll add later)
8. **Click:** "Create load balancer"
9. **Copy the DNS name** (looks like: arbrit-alb-xxxxx.us-east-1.elb.amazonaws.com)

---

### Step 13: Create Target Groups (5 minutes)

**A. Backend Target Group:**

1. **Go to:** EC2 → Target Groups → Create target group
2. **Target type:** IP addresses
3. **Name:** `arbrit-backend-tg`
4. **Protocol:** HTTP, Port: 8001
5. **VPC:** Your default VPC
6. **Health check:**
   - Protocol: HTTP
   - Path: `/api/health`
   - Advanced: Healthy threshold: 2, Interval: 30
7. **Click:** "Next" → "Create target group"

**B. Frontend Target Group:**

1. **Create another target group**
2. **Target type:** IP addresses
3. **Name:** `arbrit-frontend-tg`
4. **Protocol:** HTTP, Port: 80
5. **Health check path:** `/`
6. **Click:** "Create target group"

---

### Step 14: Configure Load Balancer Listeners (3 minutes)

1. **Go back to:** Load Balancers → Select `arbrit-alb`
2. **Click:** Listeners tab → Add listener
3. **HTTP Listener:**
   - Protocol: HTTP, Port: 80
   - Default action: Forward to `arbrit-frontend-tg`
   - Click "Add"

4. **Add routing rule for API:**
   - Select the HTTP:80 listener
   - Click "View/edit rules"
   - Click "+" → "Insert rule"
   - Condition: Path is `/api/*`
   - Action: Forward to `arbrit-backend-tg`
   - Click "Save"

---

### Step 15: Create ECS Services (10 minutes)

**A. Backend Service:**

1. **Go to:** ECS → Clusters → `arbrit-cluster`
2. **Click:** Services tab → Create
3. **Environment:**
   - Compute options: Launch type
   - Launch type: FARGATE
4. **Deployment configuration:**
   - Family: `arbrit-backend`
   - Service name: `arbrit-backend-service`
   - Desired tasks: 1
5. **Networking:**
   - VPC: Default VPC
   - Subnets: Select at least 2
   - Security group: `arbrit-ecs-sg`
   - Public IP: ENABLED
6. **Load balancing:**
   - Load balancer type: Application Load Balancer
   - Load balancer: `arbrit-alb`
   - Container: backend 8001:8001
   - Use an existing target group: `arbrit-backend-tg`
7. **Click:** "Create"

**B. Frontend Service:**

1. **Create another service**
2. Same settings but:
   - Family: `arbrit-frontend`
   - Service name: `arbrit-frontend-service`
   - Container: frontend 80:80
   - Target group: `arbrit-frontend-tg`
3. **Click:** "Create"

---

### Step 16: Wait for Services to Start (5-10 minutes)

1. **Go to:** ECS → Clusters → arbrit-cluster → Services
2. **Watch:** Both services should show "Active" status
3. **Check tasks:** Should show "RUNNING" status
4. **Check target groups:**
   - EC2 → Target Groups
   - Select each target group
   - Targets tab should show "healthy"

**If not healthy after 5 minutes:**
- Check CloudWatch logs for errors
- Verify MongoDB connection string
- Check security group allows traffic

---

### Step 17: Test Your Deployment (3 minutes)

1. **Get Load Balancer DNS:**
   - EC2 → Load Balancers
   - Copy DNS name: `arbrit-alb-xxxxx.us-east-1.elb.amazonaws.com`

2. **Test Backend:**
   ```
   Open browser: http://arbrit-alb-xxxxx.us-east-1.elb.amazonaws.com/api/health
   ```
   Should show: `{"status":"healthy"}`

3. **Test Frontend:**
   ```
   Open browser: http://arbrit-alb-xxxxx.us-east-1.elb.amazonaws.com
   ```
   Should show: Login page

---

### Step 18: Setup SSL Certificate (10 minutes)

1. **Go to:** [Certificate Manager](https://console.aws.amazon.com/acm)
2. **Click:** "Request certificate"
3. **Certificate type:** Public certificate
4. **Domain names:**
   - Add: `yourdomain.com`
   - Add: `*.yourdomain.com`
5. **Validation:** DNS validation
6. **Click:** "Request"
7. **Click** on the certificate → View details
8. **Copy CNAME records** and add to your domain's DNS
9. **Wait** for validation (5-30 minutes)
10. **Once validated:**
    - Go to Load Balancers → arbrit-alb
    - Add listener: HTTPS:443
    - Certificate: Select your certificate
    - Default action: Forward to `arbrit-frontend-tg`
    - Add rule: Path `/api/*` → `arbrit-backend-tg`

---

### Step 19: Configure Your Domain (5 minutes)

In your domain registrar's DNS settings:

```
Type: CNAME
Host: www
Value: arbrit-alb-xxxxx.us-east-1.elb.amazonaws.com

Type: CNAME
Host: @
Value: arbrit-alb-xxxxx.us-east-1.elb.amazonaws.com
```

**Wait:** 5-30 minutes for DNS propagation

---

### Step 20: Final Verification ✅

1. **Test HTTPS:**
   ```
   https://yourdomain.com
   ```
   Should show login page with valid SSL

2. **Test Backend:**
   ```
   https://yourdomain.com/api/health
   ```
   Should return: `{"status":"healthy"}`

3. **Login:**
   - Mobile: `971564022503`
   - PIN: `2503`

4. **Success!** 🎉

---

## 🧹 Cleanup Cloud9 (Optional)

Once images are pushed, you can delete Cloud9:
1. Cloud9 Console → Select environment
2. Delete

This saves costs (~$0.02/hour when running)

---

## 💰 Total Cost

- **Fargate Tasks:** ~$40/month
- **Application Load Balancer:** ~$20/month
- **Data Transfer:** ~$10/month
- **CloudWatch:** ~$5/month
- **Cloud9 (temporary):** ~$0.50 for build time
- **Total:** **~$75-80/month**

---

## 🆘 Troubleshooting

### Tasks won't start
- Check CloudWatch Logs: `/ecs/arbrit-backend`
- Verify MongoDB connection string
- Check task definition environment variables

### Target groups unhealthy
- Verify security group allows traffic
- Check task logs for errors
- Ensure MongoDB is accessible

### Can't access via domain
- Check DNS propagation: `nslookup yourdomain.com`
- Verify CNAME records point to ALB
- Wait up to 24 hours for full propagation

---

## ✅ Success Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Cloud9 environment setup
- [ ] Docker images pushed to ECR
- [ ] IAM roles created
- [ ] ECS cluster created
- [ ] Task definitions created
- [ ] Load balancer created
- [ ] Target groups created
- [ ] ECS services running
- [ ] Services are healthy
- [ ] SSL certificate issued
- [ ] Domain configured
- [ ] Application accessible via HTTPS
- [ ] Can login with default credentials

---

## 🎉 You Did It!

Everything done through the AWS Console - no command line expertise needed!

**Next steps:**
1. Change default MD/COO passwords
2. Create employee records
3. Invite your team

---

**This is the most beginner-friendly approach!** Everything is visual and clickable.

*Last updated: November 20, 2025*

