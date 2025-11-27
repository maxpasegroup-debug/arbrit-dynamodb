# 🖱️ 100% AWS Console Deployment
## No Local Tools Required - Pure Browser Experience

Everything done in your web browser. No terminal, no AWS CLI, no Docker Desktop needed!

**Time:** 75-90 minutes  
**Tools needed:** Just a web browser!

---

## 🎯 Strategy

We'll use a **temporary EC2 instance** as your "build server" to create Docker images, then do everything else through AWS Console.

**Flow:**
1. Create temporary EC2 instance (has Docker pre-installed)
2. Upload your files to EC2
3. Build images via EC2's web-based terminal
4. Push images to ECR
5. Create all infrastructure via AWS Console
6. Delete the temporary EC2 (save costs)

---

## 📋 Part 1: Setup Build Server (15 minutes)

### Step 1: Launch EC2 Instance (5 minutes)

1. **Login to AWS Console:** https://console.aws.amazon.com
2. **Make sure region is:** us-east-1 (top right corner)
3. **Search for:** "EC2" in the search bar
4. **Click:** EC2 service

5. **Click:** "Launch instance" (orange button)

**Configure instance:**

**Name and tags:**
- Name: `arbrit-builder-temp`

**Application and OS Images:**
- **Quick Start:** Amazon Linux
- **Amazon Machine Image (AMI):** Amazon Linux 2023 AMI (default)

**Instance type:**
- Select: **t3.medium** (2 vCPU, 4 GB RAM)
- Why: Needed for building Docker images

**Key pair:**
- Click "Create new key pair"
- Name: `arbrit-key`
- Type: RSA
- Format: `.pem`
- Click "Create key pair"
- **File downloads automatically** - save it!

**Network settings:**
- Click "Edit"
- **Auto-assign public IP:** Enable
- **Firewall (security groups):** Create new
  - Security group name: `arbrit-builder-sg`
  - Description: Temporary build server
  - Keep SSH rule (Type: SSH, Source: My IP)

**Configure storage:**
- Size: **30 GiB** (need space for Docker images)
- Leave other defaults

**Advanced details:**
- Scroll down to "User data" (at the very bottom)
- Paste this script:
```bash
#!/bin/bash
yum update -y
yum install -y docker git
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user
```
This auto-installs Docker when the instance starts!

6. **Click:** "Launch instance"

⏱️ **Wait 2-3 minutes** for instance to start...

7. **Click:** "View all instances"
8. **Wait until Status check:** 2/2 checks passed

---

### Step 2: Connect to EC2 via Browser (2 minutes)

**No SSH client needed! Use browser-based terminal:**

1. **Select your instance** (check the box)
2. **Click:** "Connect" button (top right)
3. **Choose:** "EC2 Instance Connect" tab
4. **Click:** "Connect" (orange button)

✅ **A new browser tab opens with a terminal!**

This is your build server terminal - all in the browser!

---

### Step 2.5: Verify Docker Installation (3 minutes)

**The User Data script should have installed Docker automatically, but let's verify:**

In the EC2 terminal:

```bash
# Check if Docker is running
sudo systemctl status docker
```

**If Docker is running:** ✅ Skip to Step 3

**If Docker is NOT installed or not running, run these commands:**

```bash
#!/bin/bash

# Update system
sudo yum update -y

# Install Docker and Git
sudo yum install -y docker git

# Start Docker service
sudo systemctl start docker

# Enable Docker to start on boot
sudo systemctl enable docker

# Add ec2-user to docker group (allows running docker without sudo)
sudo usermod -a -G docker ec2-user

# Verify installation
docker --version
```

**⚠️ Important:** If you just ran these commands, **logout and login again** for group permissions to take effect:

```bash
# Logout
exit
```

Then reconnect via EC2 Instance Connect (repeat Step 2).

Test Docker works without sudo:

```bash
docker ps
```

Should run without errors!

---

### Step 3: Upload Your Project Files (8 minutes)

**You have two options:**

#### Option A: Direct Upload (Easier for Small Files)

In the EC2 terminal (browser), create a directory:

```bash
mkdir -p ~/arbrit-safety-export
cd ~/arbrit-safety-export
```

Now you'll need to upload files one by one or create them:

**For key files, you can use `nano` editor:**

```bash
# Create Dockerfile.backend
nano Dockerfile.backend
```

Paste the content (from your local file), then:
- Press `Ctrl+X`
- Press `Y`
- Press `Enter`

**This is tedious for many files...**

#### Option B: GitHub/Upload Service (Recommended)

**Best approach: Use a temporary GitHub repo or file hosting**

1. **On your Mac**, create a ZIP of your project:
   - Right-click `arbrit-safety-export` folder
   - Click "Compress"
   - Creates `arbrit-safety-export.zip`

2. **Upload to temporary location:**
   - Use Google Drive, Dropbox, or WeTransfer
   - Get a download link

3. **Download in EC2 terminal:**
```bash
# Example with a download link
cd ~
wget "YOUR_DOWNLOAD_LINK" -O arbrit.zip
unzip arbrit.zip
cd arbrit-safety-export
```

#### Option C: Use Git (If You Have GitHub)

If your project is in GitHub:

```bash
cd ~
git clone https://github.com/yourusername/arbrit-safety-export.git
cd arbrit-safety-export
```

---

### Step 4: Get AWS Account ID (1 minute)

In EC2 terminal:

```bash
aws sts get-caller-identity --query Account --output text
```

**Copy this 12-digit number!** Save it in a note.

```bash
# Save as variable
export AWS_ACCOUNT_ID=YOUR_12_DIGIT_NUMBER
echo "Account ID: $AWS_ACCOUNT_ID"
```

---

## 📋 Part 2: Build & Push Images (25 minutes)

### Step 5: Create ECR Repositories (2 minutes)

In EC2 terminal:

```bash
# Create backend repository
aws ecr create-repository --repository-name arbrit-backend --region us-east-1

# Create frontend repository
aws ecr create-repository --repository-name arbrit-frontend --region us-east-1
```

✅ You should see JSON output for each.

---

### Step 6: Login to ECR (1 minute)

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

✅ Should see: **"Login Succeeded"**

---

### Step 7: Build Backend Image (10 minutes)

```bash
cd ~/arbrit-safety-export
docker build -f Dockerfile.backend -t arbrit-backend:latest .
```

⏱️ **This takes about 10 minutes.** You'll see lots of output.

---

### Step 8: Tag & Push Backend (5 minutes)

```bash
# Tag
docker tag arbrit-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:latest

# Push
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:latest
```

⏱️ **Takes ~5 minutes.** Wait for "Pushed"

---

### Step 9: Build Frontend Image (4 minutes)

```bash
docker build -f Dockerfile.frontend -t arbrit-frontend:latest .
```

⏱️ **Takes ~3-4 minutes.**

---

### Step 10: Tag & Push Frontend (3 minutes)

```bash
# Tag
docker tag arbrit-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/arbrit-frontend:latest

# Push
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/arbrit-frontend:latest
```

⏱️ **Takes ~2-3 minutes.** Wait for "Pushed"

---

### Step 11: Generate JWT Secret (30 seconds)

While we're here, generate your JWT secret:

```bash
openssl rand -hex 32
```

**⚠️ Copy this output and save it!** You'll need it later.

---

### ✅ Part 2 Complete!

**You can now close the EC2 terminal tab.**

Images are in AWS ECR. We'll delete this EC2 instance later to save costs.

---

## 📋 Part 3: Create Your Environment Notes (2 minutes)

**Open a text editor and save these values:**

```
AWS_ACCOUNT_ID: [12-digit number from Step 4]
MONGO_URL: mongodb+srv://arbrit_admin:PASSWORD@cluster...
DB_NAME: arbrit-workdesk
JWT_SECRET_KEY: [from Step 11]
CORS_ORIGINS: https://yourdomain.com,https://www.yourdomain.com
```

**⚠️ Keep this note open - you'll use it in Step 17!**

---

## 📋 Part 4: AWS Infrastructure Setup (40 minutes)

**Everything from here is pure AWS Console clicking!**

### Step 12: Create IAM Roles (5 minutes)

1. **Open:** https://console.aws.amazon.com/iam/home?region=us-east-1#/roles
2. **Click:** "Create role"

**A. Task Execution Role:**
- **Trusted entity:** AWS service
- **Use case:** Elastic Container Service → Elastic Container Service Task
- Click "Next"
- **Add policies:**
  - Search: `AmazonECSTaskExecutionRolePolicy` ✓
  - Search: `CloudWatchLogsFullAccess` ✓
- Click "Next"
- **Role name:** `ecsTaskExecutionRole`
- Click "Create role"

**B. Task Role:**
- Click "Create role" again
- **Trusted entity:** AWS service → ECS Task
- Click "Next"
- **No policies** (skip)
- Click "Next"
- **Role name:** `ecsTaskRole`
- Click "Create role"

---

### Step 13: Create ECS Cluster (2 minutes)

1. **Open:** https://console.aws.amazon.com/ecs/v2/clusters
2. **Click:** "Create Cluster"
3. **Cluster name:** `arbrit-cluster`
4. **Infrastructure:** AWS Fargate (serverless) - default
5. Click "Create"

✅ Cluster created in 30 seconds!

---

### Step 14: Create CloudWatch Log Groups (2 minutes)

1. **Open:** https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups
2. **Click:** "Create log group"
3. **Name:** `/ecs/arbrit-backend`
4. Click "Create"
5. **Click:** "Create log group" again
6. **Name:** `/ecs/arbrit-frontend`
7. Click "Create"

---

### Step 15: Create Security Group for ECS (3 minutes)

1. **Open:** https://console.aws.amazon.com/vpc/home?region=us-east-1#SecurityGroups:
2. **Click:** "Create security group"
3. **Name:** `arbrit-ecs-sg`
4. **Description:** `Security group for ECS tasks`
5. **VPC:** Default VPC

**Inbound rules:**
- Click "Add rule"
  - Type: HTTP (80)
  - Source: Anywhere-IPv4 (0.0.0.0/0)
- Click "Add rule"
  - Type: Custom TCP
  - Port: 8001
  - Source: Anywhere-IPv4 (0.0.0.0/0)

**Outbound:** Leave default (all traffic)

6. Click "Create security group"

---

### Step 16: Create Application Load Balancer (8 minutes)

1. **Open:** https://console.aws.amazon.com/ec2/home?region=us-east-1#LoadBalancers:
2. **Click:** "Create load balancer"
3. **Select:** Application Load Balancer → Create

**Basic configuration:**
- **Name:** `arbrit-alb`
- **Scheme:** Internet-facing
- **IP type:** IPv4

**Network mapping:**
- **VPC:** Default VPC
- **Mappings:** Check at least 2 availability zones

**Security groups:**
- Click "Create new security group" (opens new tab)
  - Name: `arbrit-alb-sg`
  - VPC: Default
  - Inbound: HTTP (80) and HTTPS (443) from Anywhere
  - Click "Create security group"
- Go back to ALB tab, click refresh
- Select `arbrit-alb-sg` (remove default if present)

**Listeners:** Leave HTTP:80 default

4. Click "Create load balancer"

⏱️ Wait 2-3 minutes for ALB to become active.

**⚠️ Copy the DNS name:** `arbrit-alb-xxxxx.us-east-1.elb.amazonaws.com`

---

### Step 17: Create Task Definitions (10 minutes)

**🔥 THIS IS WHERE YOU USE YOUR ENVIRONMENT VARIABLES!**

#### A. Backend Task Definition

1. **Open:** https://console.aws.amazon.com/ecs/v2/task-definitions
2. **Click:** "Create new task definition"
3. **Family:** `arbrit-backend`

**Infrastructure:**
- Launch type: AWS Fargate
- OS: Linux/X86_64
- CPU: 0.5 vCPU
- Memory: 1 GB
- Task execution role: `ecsTaskExecutionRole`
- Task role: `ecsTaskRole`

**Container - 1:**
- **Name:** `backend`
- **Image URI:** `YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:latest`
  - Replace YOUR_ACCOUNT_ID with your 12-digit number!
- **Essential:** Yes

**Port mappings:**
- Container port: `8001`
- Protocol: TCP
- App protocol: HTTP

**Environment variables:**
Scroll down, click "Add environment variable" for EACH:

```
MONGO_URL
mongodb+srv://arbrit_admin:YOUR_PASSWORD@cluster...

DB_NAME
arbrit-workdesk

JWT_SECRET_KEY
your-generated-secret

CORS_ORIGINS
https://yourdomain.com,https://www.yourdomain.com
```

**⚠️ Use YOUR actual values from the note!**

**Logging:**
- Log driver: awslogs
- awslogs-group: `/ecs/arbrit-backend`
- awslogs-region: `us-east-1`
- awslogs-stream-prefix: `ecs`

4. Click "Create"

#### B. Frontend Task Definition

1. Click "Create new task definition" again
2. **Family:** `arbrit-frontend`

**Infrastructure:**
- Launch type: Fargate
- CPU: 0.25 vCPU
- Memory: 0.5 GB
- Roles: Same as backend

**Container:**
- Name: `frontend`
- Image: `YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/arbrit-frontend:latest`
- Port: 80, TCP, HTTP
- **No environment variables**

**Logging:**
- awslogs-group: `/ecs/arbrit-frontend`
- awslogs-region: `us-east-1`
- awslogs-stream-prefix: `ecs`

3. Click "Create"

---

### Step 18: Create Target Groups (5 minutes)

1. **Open:** https://console.aws.amazon.com/ec2/home?region=us-east-1#TargetGroups:

**A. Backend Target Group:**
- Click "Create target group"
- Target type: IP addresses
- Name: `arbrit-backend-tg`
- Protocol: HTTP, Port: 8001
- VPC: Default
- Health check path: `/api/health`
- Click "Next" → "Create"

**B. Frontend Target Group:**
- Click "Create target group"
- Target type: IP addresses
- Name: `arbrit-frontend-tg`
- Protocol: HTTP, Port: 80
- Health check path: `/`
- Click "Next" → "Create"

---

### Step 19: Configure Load Balancer Listener (3 minutes)

1. **Go to:** Load Balancers → `arbrit-alb`
2. **Listeners tab** → Select HTTP:80
3. Click "Actions" → "Edit listener"
4. Default action: Forward to `arbrit-frontend-tg`
5. Click "Save changes"

**Add API rule:**
1. Click the HTTP:80 listener
2. Click "Manage rules"
3. Click "+" → "Insert rule"
4. **Condition:** Path is `/api/*`
5. **Action:** Forward to `arbrit-backend-tg`
6. Click "Save"

---

### Step 20: Create ECS Services (8 minutes)

1. **Open:** https://console.aws.amazon.com/ecs/v2/clusters/arbrit-cluster

**A. Backend Service:**
- Click "Create" under Services
- Launch type: FARGATE
- Family: `arbrit-backend`
- Service name: `arbrit-backend-service`
- Desired tasks: 1

**Networking:**
- VPC: Default
- Subnets: Select at least 2
- Security group: `arbrit-ecs-sg`
- Public IP: ENABLED

**Load balancing:**
- Type: Application Load Balancer
- Load balancer: `arbrit-alb`
- Listener: 80:HTTP
- Target group: `arbrit-backend-tg`
- Container: backend 8001:8001

Click "Create"

**B. Frontend Service:**
- Click "Create" again
- Same settings but:
  - Family: `arbrit-frontend`
  - Service: `arbrit-frontend-service`
  - Target group: `arbrit-frontend-tg`
  - Container: frontend 80:80

Click "Create"

---

### Step 21: Wait & Verify (5-10 minutes)

**Check services:**
1. ECS → Clusters → arbrit-cluster → Services
2. Both should show "Active"
3. Tasks should show "RUNNING"

**Check target groups:**
1. EC2 → Target Groups
2. Select each → Targets tab
3. Should show "healthy" (wait 5 minutes)

⏱️ **Get coffee while this stabilizes!** ☕

---

## 📋 Part 5: Test & Cleanup (10 minutes)

### Step 22: Test Your Application (5 minutes)

**Get ALB URL:**
```
http://arbrit-alb-xxxxx.us-east-1.elb.amazonaws.com
```

**Test in browser:**

1. **Backend:** `http://arbrit-alb-xxxxx.../api/health`
   - Should return: `{"status":"healthy"}`

2. **Frontend:** `http://arbrit-alb-xxxxx...`
   - Should show: Login page

3. **Login:**
   - Mobile: `971564022503`
   - PIN: `2503`
   - Should work! 🎉

---

### Step 23: Delete Build Server (2 minutes)

**Save costs by deleting the temporary EC2:**

1. **Go to:** EC2 → Instances
2. **Select:** `arbrit-builder-temp`
3. **Instance state** → Terminate instance
4. Confirm

**Also delete:**
- Security group: `arbrit-builder-sg` (EC2 → Security Groups)
- Key pair: `arbrit-key` (EC2 → Key Pairs) - optional

This saves ~$30/month!

---

## 🎉 Success!

**Your application is live!**

**Access:** `http://arbrit-alb-xxxxx.us-east-1.elb.amazonaws.com`

**Monthly cost:** ~$75-80 (without build server)

---

## ➡️ Optional: Add SSL & Domain

Follow Steps 23-25 from `DEPLOY_LOCAL_DOCKER.md`:
- Request SSL certificate in ACM
- Add HTTPS listener to ALB
- Point domain to ALB DNS

---

## 🆘 Troubleshooting

**Can't upload files to EC2?**
- Use WeTransfer or Google Drive
- Create a temporary GitHub repo
- Use SCP if comfortable

**Tasks won't start?**
- Check CloudWatch logs
- Verify MongoDB connection string
- Check environment variables

**Build server terminal closed?**
- Reconnect: EC2 → Instances → Select → Connect

---

## ✅ Complete Checklist

- [x] MongoDB Atlas created
- [x] Temporary EC2 build server created
- [x] Files uploaded to EC2
- [x] Docker images built and pushed
- [x] Build server deleted (save costs!)
- [x] IAM roles created
- [x] ECS cluster created
- [x] Task definitions created
- [x] Load balancer created
- [x] Target groups created
- [x] ECS services running
- [x] Application accessible

---

## 💰 Final Cost

- **ECS Fargate:** ~$40/month
- **Load Balancer:** ~$20/month
- **Other:** ~$15/month
- **Build server:** $0 (deleted!)
- **Total:** ~$75-80/month

---

## 🎯 What You Accomplished

You deployed a production application to AWS using:
- ✅ Zero local tools
- ✅ Only web browser
- ✅ Temporary build server (deleted after)
- ✅ All AWS managed services

**Congratulations!** 🎉

---

*Last updated: November 20, 2025*

