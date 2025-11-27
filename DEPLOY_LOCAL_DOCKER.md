# 🚀 Deploy with Local Docker + AWS Console
## Fast Track Deployment (60 minutes)

This guide uses Docker Desktop on your Mac + AWS Console in browser.

---

## ✅ Prerequisites Checklist

Before starting, make sure you have:

- [x] Docker Desktop installed (you have this!)
- [x] MongoDB Atlas connection string ready
- [ ] AWS CLI configured (we'll do this now)
- [ ] Terminal app open on your Mac

---

## 📍 Part 1: Local Setup (15 minutes)

### Step 1: Configure AWS CLI (5 minutes)

**Open Terminal on your Mac** and check if AWS CLI is configured:

```bash
aws sts get-caller-identity
```

**If it works:** Skip to Step 2!  
**If it fails:** You need to configure AWS CLI.

#### Get AWS Access Keys

1. **Go to:** https://console.aws.amazon.com/iam
2. **Click:** Your username (top right) → **Security credentials**
3. **Scroll down to:** "Access keys" section
4. **Click:** "Create access key"
5. **Use case:** Select **"Command Line Interface (CLI)"**
6. **Check the box:** "I understand..."
7. **Click:** "Next" → "Create access key"
8. **Important:** Copy or download:
   - **Access Key ID:** `AKIA...` (20 characters)
   - **Secret Access Key:** `wJal...` (40 characters)

⚠️ **Save these securely!** You won't see the secret again.

#### Configure AWS CLI

Back in Terminal:

```bash
aws configure
```

Enter when prompted:
```
AWS Access Key ID: [paste your access key]
AWS Secret Access Key: [paste your secret key]
Default region name: us-east-1
Default output format: json
```

**Verify it works:**
```bash
aws sts get-caller-identity
```

You should see your account info!

---

### Step 2: Get Your AWS Account ID (30 seconds)

```bash
aws sts get-caller-identity --query Account --output text
```

**Save this 12-digit number!** Example: `123456789012`

Let's save it as a variable:
```bash
export AWS_ACCOUNT_ID=YOUR_12_DIGIT_NUMBER
echo "Account ID: $AWS_ACCOUNT_ID"
```

---

### Step 3: Generate JWT Secret Key (30 seconds)

```bash
openssl rand -hex 32
```

**Copy the output!** Example: `a1b2c3d4e5f6...`

Save it to a note - you'll need it later.

---

### Step 4: Prepare Your Environment Variables (2 minutes)

**Create a note with these values:**

```
AWS_ACCOUNT_ID=123456789012
MONGO_URL=mongodb+srv://arbrit_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/arbrit-workdesk?retryWrites=true&w=majority
DB_NAME=arbrit-workdesk
JWT_SECRET_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**Replace:**
- `123456789012` with your AWS Account ID
- `YOUR_PASSWORD` with your MongoDB password
- `a1b2c3d4...` with your generated JWT secret
- `yourdomain.com` with your domain (or leave as is)

**⚠️ Keep this note open - you'll need it for Step 10!**

---

## 📍 Part 2: Build & Push Docker Images (20 minutes)

### Step 5: Navigate to Project

```bash
cd /Users/sms01/Downloads/arbrit-safety-export
```

Verify you're in the right place:
```bash
ls -la
```

You should see: `Dockerfile.backend`, `Dockerfile.frontend`, `backend/`, `frontend/`

---

### Step 6: Create ECR Repositories (1 minute)

```bash
# Create backend repository
aws ecr create-repository --repository-name arbrit-backend --region us-east-1

# Create frontend repository
aws ecr create-repository --repository-name arbrit-frontend --region us-east-1
```

✅ You should see JSON output for each.

---

### Step 7: Login to AWS ECR (30 seconds)

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

✅ You should see: **"Login Succeeded"**

---

### Step 8: Build Backend Image (10 minutes)

**This takes about 10 minutes - be patient!**

```bash
docker build -f Dockerfile.backend -t arbrit-backend:latest .
```

You'll see lots of output. This is normal!

Progress indicators:
- `Step 1/X` - Building image
- `Successfully built` - Done!
- `Successfully tagged` - Ready!

---

### Step 9: Tag & Push Backend Image (5 minutes)

```bash
# Tag the image
docker tag arbrit-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:latest

# Push to ECR (takes ~5 minutes)
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:latest
```

You'll see progress bars. Wait for: **"Pushed"**

---

### Step 10: Build Frontend Image (3 minutes)

```bash
docker build -f Dockerfile.frontend -t arbrit-frontend:latest .
```

Faster than backend - about 3 minutes.

---

### Step 11: Tag & Push Frontend Image (2 minutes)

```bash
# Tag
docker tag arbrit-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/arbrit-frontend:latest

# Push (takes ~2 minutes)
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/arbrit-frontend:latest
```

Wait for: **"Pushed"**

---

### ✅ Part 2 Complete!

**You're done with Terminal!** Images are now in AWS ECR.

You can minimize Terminal and switch to your browser.

---

## 📍 Part 3: AWS Console Setup (40 minutes)

**Everything from here is point-and-click in AWS Console!**

### Step 12: Create IAM Roles (5 minutes)

1. **Open:** https://console.aws.amazon.com/iam/home?region=us-east-1#/roles
2. **Click:** "Create role"

**A. Task Execution Role:**
- Trusted entity: **AWS service** → **Elastic Container Service**
- Use case: **Elastic Container Service Task**
- Click "Next"
- Add policies:
  - Search: `AmazonECSTaskExecutionRolePolicy` (check it)
  - Search: `CloudWatchLogsFullAccess` (check it)
- Click "Next"
- Role name: `ecsTaskExecutionRole`
- Click "Create role"

**B. Task Role:**
- Create another role (same process)
- Trusted entity: ECS Task
- **No policies needed** (click Next without selecting any)
- Role name: `ecsTaskRole`
- Click "Create role"

---

### Step 13: Create ECS Cluster (2 minutes)

1. **Open:** https://console.aws.amazon.com/ecs/v2/clusters
2. **Click:** "Create Cluster"
3. **Cluster name:** `arbrit-cluster`
4. **Infrastructure:** AWS Fargate (serverless)
5. Leave other defaults
6. **Click:** "Create"

✅ Wait 30 seconds - cluster is ready!

---

### Step 14: Create CloudWatch Log Groups (2 minutes)

1. **Open:** https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups
2. **Click:** "Create log group"
3. **Log group name:** `/ecs/arbrit-backend`
4. **Click:** "Create"
5. **Click:** "Create log group" again
6. **Log group name:** `/ecs/arbrit-frontend`
7. **Click:** "Create"

---

### Step 15: Create Task Definitions (10 minutes)

**This is where you use your environment variables!**

#### A. Backend Task Definition

1. **Open:** https://console.aws.amazon.com/ecs/v2/task-definitions
2. **Click:** "Create new task definition" → "Create new task definition"
3. **Task definition family:** `arbrit-backend`

**Infrastructure:**
- **Launch type:** AWS Fargate
- **Operating system:** Linux/X86_64
- **CPU:** 0.5 vCPU
- **Memory:** 1 GB
- **Task execution role:** `ecsTaskExecutionRole`
- **Task role:** `ecsTaskRole`

**Container - 1:**
- **Name:** `backend`
- **Image URI:** `YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:latest`
  - **⚠️ Replace `YOUR_ACCOUNT_ID` with your 12-digit number!**
- **Essential container:** Yes (checked)

**Port mappings:**
- Click "Add port mapping"
- **Container port:** `8001`
- **Protocol:** TCP
- **App protocol:** HTTP

**Environment variables:**
Scroll down to "Environment variables" section.
Click "Add environment variable" for EACH of these:

```
Key: MONGO_URL
Value: mongodb+srv://arbrit_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/arbrit-workdesk?retryWrites=true&w=majority

Key: DB_NAME
Value: arbrit-workdesk

Key: JWT_SECRET_KEY
Value: your-generated-jwt-secret-from-step-3

Key: CORS_ORIGINS
Value: https://yourdomain.com,https://www.yourdomain.com
```

**⚠️ Use your actual values from the note you created in Step 4!**

**Logging (scroll down):**
- Click to expand "Configure logging"
- **Log driver:** awslogs (auto-selected)
- **awslogs-group:** `/ecs/arbrit-backend`
- **awslogs-region:** `us-east-1`
- **awslogs-stream-prefix:** `ecs`

**Click:** "Create" at the bottom

---

#### B. Frontend Task Definition

1. **Click:** "Create new task definition" again
2. **Task definition family:** `arbrit-frontend`

**Infrastructure:**
- **Launch type:** AWS Fargate
- **CPU:** 0.25 vCPU
- **Memory:** 0.5 GB
- **Task execution role:** `ecsTaskExecutionRole`
- **Task role:** `ecsTaskRole`

**Container:**
- **Name:** `frontend`
- **Image URI:** `YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/arbrit-frontend:latest`
- **Port:** `80` TCP HTTP
- **No environment variables needed**

**Logging:**
- **awslogs-group:** `/ecs/arbrit-frontend`
- **awslogs-region:** `us-east-1`
- **awslogs-stream-prefix:** `ecs`

**Click:** "Create"

---

### Step 16: Create Security Group (3 minutes)

1. **Open:** https://console.aws.amazon.com/vpc/home?region=us-east-1#SecurityGroups:
2. **Click:** "Create security group"
3. **Security group name:** `arbrit-ecs-sg`
4. **Description:** `Security group for Arbrit ECS tasks`
5. **VPC:** Select your default VPC

**Inbound rules:**
- Click "Add rule"
  - **Type:** HTTP
  - **Port:** 80
  - **Source:** Anywhere-IPv4 (0.0.0.0/0)
- Click "Add rule"
  - **Type:** Custom TCP
  - **Port:** 8001
  - **Source:** Anywhere-IPv4 (0.0.0.0/0)

**Outbound rules:**
- Leave default (All traffic)

6. **Click:** "Create security group"

**⚠️ Save the Security Group ID** (looks like `sg-0123456789abcdef0`)

---

### Step 17: Create Application Load Balancer (8 minutes)

1. **Open:** https://console.aws.amazon.com/ec2/home?region=us-east-1#LoadBalancers:
2. **Click:** "Create load balancer"
3. **Select:** "Application Load Balancer" → Click "Create"

**Basic configuration:**
- **Load balancer name:** `arbrit-alb`
- **Scheme:** Internet-facing
- **IP address type:** IPv4

**Network mapping:**
- **VPC:** Select your default VPC
- **Mappings:** Select **at least 2 availability zones** (check 2+ boxes)

**Security groups:**
- Click "Create new security group" (opens new tab)
  - **Name:** `arbrit-alb-sg`
  - **Description:** `ALB security group`
  - **VPC:** Default VPC
  - **Inbound rules:**
    - HTTP (80) from Anywhere (0.0.0.0/0)
    - HTTPS (443) from Anywhere (0.0.0.0/0)
  - Click "Create security group"
- Go back to ALB tab
- Click refresh icon
- Select `arbrit-alb-sg` (remove default if present)

**Listeners:**
- Leave HTTP:80 for now (we'll configure later)

**Click:** "Create load balancer"

✅ Wait 2-3 minutes for ALB to become active.

**⚠️ Copy the DNS name:** `arbrit-alb-xxxxx.us-east-1.elb.amazonaws.com`

---

### Step 18: Create Target Groups (5 minutes)

**A. Backend Target Group:**

1. **Open:** https://console.aws.amazon.com/ec2/home?region=us-east-1#TargetGroups:
2. **Click:** "Create target group"
3. **Target type:** IP addresses
4. **Target group name:** `arbrit-backend-tg`
5. **Protocol:** HTTP
6. **Port:** 8001
7. **VPC:** Default VPC
8. **Protocol version:** HTTP1

**Health checks:**
- **Health check path:** `/api/health`
- **Advanced settings:**
  - **Healthy threshold:** 2
  - **Interval:** 30 seconds

9. **Click:** "Next"
10. **Don't register any targets** (ECS will do this)
11. **Click:** "Create target group"

**B. Frontend Target Group:**

1. **Click:** "Create target group" again
2. **Target type:** IP addresses
3. **Name:** `arbrit-frontend-tg`
4. **Protocol:** HTTP
5. **Port:** 80
6. **VPC:** Default VPC
7. **Health check path:** `/`
8. **Click:** "Next" → "Create target group"

---

### Step 19: Configure Load Balancer Listener (3 minutes)

1. **Go to:** Load Balancers → Select `arbrit-alb`
2. **Click:** "Listeners and rules" tab
3. **Select the HTTP:80 listener** → Click "Actions" → "Edit listener"

**Default actions:**
- Action type: Forward to target group
- Target group: `arbrit-frontend-tg`
- Click "Save changes"

**Add rule for API:**
1. Click the HTTP:80 listener
2. Click "Manage rules"
3. Click "+" (Add rules) → "Insert rule"
4. **Add condition:**
   - Type: Path
   - Value: `/api/*`
5. **Add action:**
   - Forward to: `arbrit-backend-tg`
6. **Priority:** 1
7. Click "Save"

---

### Step 20: Create ECS Services (8 minutes)

**A. Backend Service:**

1. **Go to:** https://console.aws.amazon.com/ecs/v2/clusters/arbrit-cluster
2. **Click:** "Services" tab → "Create"

**Environment:**
- **Compute options:** Launch type
- **Launch type:** FARGATE

**Deployment configuration:**
- **Application type:** Service
- **Family:** `arbrit-backend`
- **Revision:** LATEST
- **Service name:** `arbrit-backend-service`
- **Desired tasks:** 1

**Networking:**
- **VPC:** Default VPC
- **Subnets:** Select at least 2 subnets
- **Security group:** Use existing → Select `arbrit-ecs-sg`
- **Public IP:** ENABLED (turn on)

**Load balancing:**
- **Load balancer type:** Application Load Balancer
- **Load balancer:** `arbrit-alb`
- **Listener:** Use existing listener → 80:HTTP
- **Target group:** Use existing → `arbrit-backend-tg`
- **Container to load balance:** Select `backend 8001:8001`
- Click "Add"

**Click:** "Create" at the bottom

---

**B. Frontend Service:**

1. **Click:** "Create" again (create another service)
2. Same settings but:
   - **Family:** `arbrit-frontend`
   - **Service name:** `arbrit-frontend-service`
   - **Target group:** `arbrit-frontend-tg`
   - **Container:** `frontend 80:80`

**Click:** "Create"

---

### Step 21: Wait for Services to Start (5-10 minutes)

1. **Go to:** Clusters → arbrit-cluster → Services
2. **Watch both services:**
   - Status should be "Active"
   - Tasks should show "RUNNING"

3. **Check target groups:**
   - Go to: EC2 → Target Groups
   - Select `arbrit-backend-tg` → Targets tab
   - Should show "healthy" (wait 2-3 minutes)
   - Repeat for `arbrit-frontend-tg`

⏱️ **This takes 5-10 minutes.** Go get coffee! ☕

---

## 📍 Part 4: Test & Verify (5 minutes)

### Step 22: Test Your Application

**Get your Load Balancer URL:**
```
http://arbrit-alb-xxxxx.us-east-1.elb.amazonaws.com
```

**Test in browser:**

1. **Backend health:**
   ```
   http://arbrit-alb-xxxxx.us-east-1.elb.amazonaws.com/api/health
   ```
   Should show: `{"status":"healthy"}`

2. **Frontend:**
   ```
   http://arbrit-alb-xxxxx.us-east-1.elb.amazonaws.com
   ```
   Should show: Login page

3. **Try logging in:**
   - Mobile: `971564022503`
   - PIN: `2503`
   - Should see: Dashboard!

---

## 🎉 Success!

**Your application is live on AWS!**

**Access via:** `http://arbrit-alb-xxxxx.us-east-1.elb.amazonaws.com`

**Monthly cost:** ~$75-80

---

## ➡️ Optional: Add SSL & Domain (10 minutes)

### Step 23: Request SSL Certificate

1. **Go to:** https://console.aws.amazon.com/acm/home?region=us-east-1
2. **Click:** "Request certificate"
3. **Certificate type:** Public certificate
4. **Fully qualified domain names:**
   - Add: `yourdomain.com`
   - Add: `*.yourdomain.com`
5. **Validation method:** DNS validation
6. **Click:** "Request"
7. **Click** on certificate → Copy CNAME records
8. **Add CNAME records to your domain DNS**
9. **Wait** for validation (5-30 minutes)

### Step 24: Add HTTPS Listener to ALB

1. **Go to:** Load Balancers → `arbrit-alb` → Listeners
2. **Click:** "Add listener"
3. **Protocol:** HTTPS
4. **Port:** 443
5. **Default actions:** Forward to `arbrit-frontend-tg`
6. **Security policy:** Default
7. **Certificate:** Select your certificate
8. **Click:** "Add"
9. **Add rule** for `/api/*` → `arbrit-backend-tg`

### Step 25: Point Domain to ALB

In your domain registrar's DNS settings:
```
Type: CNAME
Host: www
Value: arbrit-alb-xxxxx.us-east-1.elb.amazonaws.com

Type: CNAME
Host: @
Value: arbrit-alb-xxxxx.us-east-1.elb.amazonaws.com
```

Wait 5-30 minutes for DNS propagation.

**Then access via:** `https://yourdomain.com`

---

## 🆘 Troubleshooting

### Tasks won't start
- Check CloudWatch logs: `/ecs/arbrit-backend`
- Verify MongoDB connection string in task definition
- Check environment variables are correct

### Target groups unhealthy
- Wait 5-10 minutes
- Check security group allows traffic
- View task logs in CloudWatch

### Can't access application
- Verify ALB is "active"
- Check listener rules are configured
- Ensure security groups allow traffic

---

## ✅ Complete Checklist

- [x] MongoDB Atlas created
- [x] AWS CLI configured
- [x] Docker images built and pushed
- [x] IAM roles created
- [x] ECS cluster created
- [x] Task definitions created
- [x] Security groups created
- [x] Load balancer created
- [x] Target groups created
- [x] ECS services running
- [x] Application accessible
- [ ] SSL certificate (optional)
- [ ] Domain configured (optional)

---

## 🎯 Next Steps

1. **Change default passwords** (MD PIN: 2503, COO PIN: 4020)
2. **Create employee records**
3. **Invite your team**
4. **Setup backups** for MongoDB
5. **Configure monitoring** in CloudWatch

**Congratulations! You deployed to AWS!** 🎉

---

*Last updated: November 20, 2025*



