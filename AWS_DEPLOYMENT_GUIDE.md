# 🚀 AWS Deployment Guide - Arbrit Safety Training System

## 📋 Table of Contents
1. [Deployment Options Overview](#deployment-options-overview)
2. [Option 1: AWS ECS with Fargate (Recommended)](#option-1-aws-ecs-with-fargate-recommended)
3. [Option 2: AWS EC2 (Traditional VPS)](#option-2-aws-ec2-traditional-vps)
4. [Option 3: AWS Elastic Beanstalk](#option-3-aws-elastic-beanstalk)
5. [MongoDB Setup (MongoDB Atlas)](#mongodb-setup)
6. [Domain & SSL Configuration](#domain--ssl-configuration)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## 🎯 Deployment Options Overview

| Option | Complexity | Cost | Scalability | Best For |
|--------|-----------|------|-------------|----------|
| **ECS Fargate** | Medium | $$ | Auto | Production, no server management |
| **EC2** | Easy | $ | Manual | Full control, budget-friendly |
| **Elastic Beanstalk** | Easy | $$ | Auto | Quick deployment, managed |

**Recommendation:** Start with **Option 1 (ECS Fargate)** for production or **Option 2 (EC2)** for budget-friendly deployment.

---

## 📦 Prerequisites (All Options)

1. **AWS Account** with billing enabled
2. **MongoDB Atlas** account (free tier available)
3. **Domain name** (Route 53 or external registrar)
4. **AWS CLI** installed on your local machine
5. **Docker** installed locally (for ECS deployment)

### Install AWS CLI

```bash
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS CLI
aws configure
# Enter: AWS Access Key ID, Secret Access Key, Region (e.g., us-east-1)
```

---

## 🐳 Option 1: AWS ECS with Fargate (Recommended)

**Best for:** Production deployments, auto-scaling, managed infrastructure

### Architecture
```
Internet → ALB (Load Balancer) → ECS Fargate Tasks
                                   ├── Backend Container
                                   └── Frontend Container
                                        └→ MongoDB Atlas
```

### Step 1: Push Docker Images to ECR

```bash
cd /Users/sms01/Downloads/arbrit-safety-export

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Create ECR repositories
aws ecr create-repository --repository-name arbrit-backend --region us-east-1
aws ecr create-repository --repository-name arbrit-frontend --region us-east-1

# Build and push backend
docker build -f Dockerfile.backend -t arbrit-backend .
docker tag arbrit-backend:latest <YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:latest
docker push <YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:latest

# Build and push frontend
docker build -f Dockerfile.frontend -t arbrit-frontend .
docker tag arbrit-frontend:latest <YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/arbrit-frontend:latest
docker push <YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/arbrit-frontend:latest
```

### Step 2: Create ECS Cluster

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name arbrit-cluster --region us-east-1
```

**Or via AWS Console:**
1. Go to ECS → Clusters → Create Cluster
2. Select **AWS Fargate (serverless)**
3. Name: `arbrit-cluster`
4. Click Create

### Step 3: Create Task Definitions

Create two files for task definitions:

**backend-task-definition.json:**
```json
{
  "family": "arbrit-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::<YOUR_AWS_ACCOUNT_ID>:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:latest",
      "portMappings": [
        {
          "containerPort": 8001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "MONGO_URL",
          "value": "mongodb+srv://username:password@cluster.mongodb.net/arbrit-workdesk"
        },
        {
          "name": "DB_NAME",
          "value": "arbrit-workdesk"
        },
        {
          "name": "JWT_SECRET_KEY",
          "value": "your-super-secret-key-change-this"
        },
        {
          "name": "CORS_ORIGINS",
          "value": "https://yourdomain.com,https://www.yourdomain.com"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/arbrit-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

**frontend-task-definition.json:**
```json
{
  "family": "arbrit-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::<YOUR_AWS_ACCOUNT_ID>:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "<YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/arbrit-frontend:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/arbrit-frontend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

```bash
# Create CloudWatch Log Groups
aws logs create-log-group --log-group-name /ecs/arbrit-backend --region us-east-1
aws logs create-log-group --log-group-name /ecs/arbrit-frontend --region us-east-1

# Register task definitions
aws ecs register-task-definition --cli-input-json file://backend-task-definition.json
aws ecs register-task-definition --cli-input-json file://frontend-task-definition.json
```

### Step 4: Create Application Load Balancer (ALB)

**Via AWS Console:**
1. Go to **EC2 → Load Balancers → Create Load Balancer**
2. Select **Application Load Balancer**
3. Name: `arbrit-alb`
4. Scheme: Internet-facing
5. Network: Select your VPC and at least 2 subnets
6. Security Group: Create new (allow 80, 443)

**Create Target Groups:**
1. **Backend Target Group:**
   - Name: `arbrit-backend-tg`
   - Protocol: HTTP, Port: 8001
   - Target type: IP
   - Health check path: `/api/health`

2. **Frontend Target Group:**
   - Name: `arbrit-frontend-tg`
   - Protocol: HTTP, Port: 80
   - Target type: IP
   - Health check path: `/`

**Configure ALB Listeners:**
- Listener 1: HTTP:80 → Forward to `arbrit-frontend-tg`
- Add rule: Path `/api/*` → Forward to `arbrit-backend-tg`

### Step 5: Create ECS Services

```bash
# Create backend service
aws ecs create-service \
  --cluster arbrit-cluster \
  --service-name arbrit-backend-service \
  --task-definition arbrit-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:xxx:targetgroup/arbrit-backend-tg/xxx,containerName=backend,containerPort=8001"

# Create frontend service
aws ecs create-service \
  --cluster arbrit-cluster \
  --service-name arbrit-frontend-service \
  --task-definition arbrit-frontend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:xxx:targetgroup/arbrit-frontend-tg/xxx,containerName=frontend,containerPort=80"
```

### Step 6: Configure Auto Scaling (Optional)

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/arbrit-cluster/arbrit-backend-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 1 \
  --max-capacity 5

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/arbrit-cluster/arbrit-backend-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

**scaling-policy.json:**
```json
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  }
}
```

### Step 7: Configure SSL/HTTPS

1. Go to **AWS Certificate Manager (ACM)**
2. Request a public certificate
3. Enter your domain: `yourdomain.com` and `*.yourdomain.com`
4. Validate via DNS (add CNAME records to your domain)
5. Once issued, add HTTPS listener to ALB:
   - Protocol: HTTPS, Port: 443
   - SSL Certificate: Select your ACM certificate
   - Default action: Forward to frontend target group
   - Add rule: Path `/api/*` → Forward to backend target group

### Step 8: Update DNS

1. Get ALB DNS name from AWS Console
2. Add CNAME record in your DNS:
   ```
   Type: CNAME
   Host: www
   Value: arbrit-alb-xxxxxxxxx.us-east-1.elb.amazonaws.com
   
   Type: CNAME
   Host: @
   Value: arbrit-alb-xxxxxxxxx.us-east-1.elb.amazonaws.com
   ```

### Cost Estimate (ECS Fargate)
- **Fargate Tasks:** ~$30-50/month (2 tasks running 24/7)
- **ALB:** ~$20/month
- **Data Transfer:** ~$10/month
- **CloudWatch Logs:** ~$5/month
- **Total:** ~$65-85/month

---

## 🖥️ Option 2: AWS EC2 (Traditional VPS)

**Best for:** Budget-friendly, full control, similar to existing Hostinger setup

### Step 1: Launch EC2 Instance

1. Go to **EC2 Dashboard → Launch Instance**
2. **Name:** arbrit-production
3. **AMI:** Ubuntu Server 22.04 LTS
4. **Instance Type:** t3.medium (2 vCPU, 4 GB RAM) or t3.small for testing
5. **Key Pair:** Create new or use existing (download .pem file)
6. **Network Settings:**
   - Allow SSH (22) from your IP
   - Allow HTTP (80) from anywhere
   - Allow HTTPS (443) from anywhere
   - Allow Custom TCP (8001) from localhost only
7. **Storage:** 20 GB gp3
8. Click **Launch Instance**

### Step 2: Allocate Elastic IP

1. Go to **EC2 → Elastic IPs → Allocate Elastic IP**
2. Associate it with your EC2 instance
3. Note the Elastic IP address

### Step 3: Connect to EC2

```bash
# Change permission on your key file
chmod 400 ~/Downloads/your-key.pem

# SSH into EC2
ssh -i ~/Downloads/your-key.pem ubuntu@YOUR_ELASTIC_IP
```

### Step 4: Setup Server (Same as Hostinger Guide)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python
sudo apt install python3.11 python3.11-venv python3-pip -y

# Install Node.js (if needed for frontend build)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# Install Docker (optional)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose -y
```

### Step 5: Upload Application Files

```bash
# From your local machine
scp -i ~/Downloads/your-key.pem -r /Users/sms01/Downloads/arbrit-safety-export/* ubuntu@YOUR_ELASTIC_IP:/home/ubuntu/

# On EC2 server
sudo mkdir -p /var/www/arbrit-safety
sudo mv /home/ubuntu/* /var/www/arbrit-safety/
cd /var/www/arbrit-safety
```

### Step 6: Setup Backend

```bash
cd /var/www/arbrit-safety/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/arbrit-workdesk
DB_NAME=arbrit-workdesk
JWT_SECRET_KEY=your-super-secret-jwt-key-here-change-this
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
EOF
```

### Step 7: Setup Backend as systemd Service

```bash
sudo nano /etc/systemd/system/arbrit-backend.service
```

**Service file:**
```ini
[Unit]
Description=Arbrit Safety Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/var/www/arbrit-safety/backend
Environment="PATH=/var/www/arbrit-safety/backend/venv/bin"
ExecStart=/var/www/arbrit-safety/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Start service
sudo systemctl daemon-reload
sudo systemctl start arbrit-backend
sudo systemctl enable arbrit-backend
sudo systemctl status arbrit-backend
```

### Step 8: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/arbrit
```

**Nginx configuration:**
```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/arbrit-safety/frontend/build;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/arbrit /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 9: Setup SSL with Let's Encrypt

```bash
# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

### Step 10: Configure Security Group & Firewall

```bash
# UFW Firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

**AWS Security Group:**
- Inbound Rules:
  - SSH (22): Your IP only
  - HTTP (80): 0.0.0.0/0
  - HTTPS (443): 0.0.0.0/0

### Step 11: Update DNS

Point your domain to the Elastic IP:
```
Type: A
Host: @
Value: YOUR_ELASTIC_IP

Type: A
Host: www
Value: YOUR_ELASTIC_IP
```

### Cost Estimate (EC2)
- **t3.small:** ~$15/month (1 vCPU, 2GB RAM)
- **t3.medium:** ~$30/month (2 vCPU, 4GB RAM)
- **Elastic IP:** Free (when attached)
- **EBS Storage:** ~$2/month (20GB)
- **Data Transfer:** ~$5-10/month
- **Total:** ~$20-45/month

---

## 🚀 Option 3: AWS Elastic Beanstalk

**Best for:** Quick deployment, managed platform

### Step 1: Install EB CLI

```bash
pip install awsebcli --upgrade --user
eb --version
```

### Step 2: Initialize Elastic Beanstalk

```bash
cd /Users/sms01/Downloads/arbrit-safety-export

# Initialize EB application
eb init -p docker arbrit-safety --region us-east-1
```

### Step 3: Create Multi-Container Configuration

Create `Dockerrun.aws.json`:

```json
{
  "AWSEBDockerrunVersion": 2,
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:latest",
      "essential": true,
      "memory": 512,
      "portMappings": [
        {
          "hostPort": 8001,
          "containerPort": 8001
        }
      ],
      "environment": [
        {
          "name": "MONGO_URL",
          "value": "mongodb+srv://username:password@cluster.mongodb.net/arbrit-workdesk"
        },
        {
          "name": "DB_NAME",
          "value": "arbrit-workdesk"
        },
        {
          "name": "JWT_SECRET_KEY",
          "value": "your-secret-key"
        },
        {
          "name": "CORS_ORIGINS",
          "value": "https://yourdomain.com"
        }
      ]
    },
    {
      "name": "frontend",
      "image": "<YOUR_AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/arbrit-frontend:latest",
      "essential": true,
      "memory": 256,
      "portMappings": [
        {
          "hostPort": 80,
          "containerPort": 80
        }
      ],
      "links": ["backend"]
    }
  ]
}
```

### Step 4: Create Environment

```bash
# Create environment
eb create arbrit-production \
  --instance-type t3.medium \
  --envvars MONGO_URL=your_mongo_url,JWT_SECRET_KEY=your_secret

# Deploy
eb deploy

# Open application
eb open
```

### Step 5: Configure SSL

1. Go to **Elastic Beanstalk Console**
2. Select your environment
3. Configuration → Load Balancer
4. Add listener: HTTPS (443)
5. Select SSL certificate from ACM

### Cost Estimate (Elastic Beanstalk)
- **EC2 Instance:** ~$30/month
- **Load Balancer:** ~$20/month
- **Total:** ~$50/month

---

## 🗄️ MongoDB Setup

### Use MongoDB Atlas (Recommended)

1. **Create Account:** https://cloud.mongodb.com
2. **Create Free Cluster:**
   - Provider: AWS
   - Region: Same as your deployment (e.g., us-east-1)
   - Tier: M0 (Free)

3. **Create Database:**
   - Database name: `arbrit-workdesk`
   - Collections will be auto-created

4. **Create Database User:**
   - Username: `arbrit_admin`
   - Password: Generate strong password
   - Role: Atlas admin or read/write to specific database

5. **Network Access:**
   - Add IP: `0.0.0.0/0` (allow from anywhere)
   - Or add specific IPs (EC2 Elastic IP, NAT Gateway IP for ECS)

6. **Get Connection String:**
   ```
   mongodb+srv://arbrit_admin:PASSWORD@cluster0.xxxxx.mongodb.net/arbrit-workdesk?retryWrites=true&w=majority
   ```

7. **Test Connection:**
   ```bash
   pip install pymongo
   python3 -c "from pymongo import MongoClient; client = MongoClient('YOUR_MONGO_URL'); print(client.server_info())"
   ```

---

## 🌐 Domain & SSL Configuration

### Option A: Using Route 53 (AWS DNS)

1. **Transfer/Register Domain in Route 53**
2. **Create Hosted Zone** (auto-created with domain)
3. **Create Records:**

For ALB (ECS/EB):
```
Type: A (Alias)
Name: yourdomain.com
Alias Target: ALB DNS name
```

For EC2:
```
Type: A
Name: yourdomain.com
Value: Elastic IP
```

### Option B: External DNS Provider

Point your domain to:
- **EC2:** Elastic IP
- **ALB:** ALB DNS name (use CNAME)
- **Elastic Beanstalk:** EB environment URL (use CNAME)

### SSL Certificate

1. **AWS Certificate Manager (ACM):**
   - Request certificate
   - Domain: `yourdomain.com` and `*.yourdomain.com`
   - Validation: DNS (add CNAME records)
   - Once validated, attach to ALB/Load Balancer

2. **For EC2 (Let's Encrypt):**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

---

## 📊 Monitoring & Maintenance

### CloudWatch Monitoring

1. **Enable CloudWatch Logs**
2. **Create Alarms:**
   - High CPU usage (>80%)
   - Memory usage (>80%)
   - HTTP 5xx errors
   - Health check failures

### Backup Strategy

1. **MongoDB Atlas:** Enable automated backups (free on paid tiers)
2. **EC2:** 
   - Create AMI snapshots weekly
   - Enable EBS snapshots

### Update Process

**For ECS:**
```bash
# Build new image
docker build -f Dockerfile.backend -t arbrit-backend:v2 .
docker tag arbrit-backend:v2 <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:v2
docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:v2

# Update task definition with new image
aws ecs update-service --cluster arbrit-cluster --service arbrit-backend-service --force-new-deployment
```

**For EC2:**
```bash
# Backup current code
sudo cp -r /var/www/arbrit-safety /var/www/arbrit-safety.backup

# Upload new files
scp -i key.pem -r backend/* ubuntu@IP:/var/www/arbrit-safety/backend/

# Restart service
sudo systemctl restart arbrit-backend
```

---

## 🔒 Security Best Practices

1. **Environment Variables:**
   - Use AWS Secrets Manager or Parameter Store
   - Never commit secrets to Git

2. **IAM Roles:**
   - Create specific roles for ECS tasks
   - Follow principle of least privilege

3. **Security Groups:**
   - Restrict SSH to your IP only
   - Only expose necessary ports

4. **WAF (Web Application Firewall):**
   - Attach to ALB
   - Protect against common attacks

5. **Regular Updates:**
   - Keep OS packages updated
   - Update Docker images regularly

---

## 📞 Troubleshooting

### ECS Tasks Not Starting
```bash
# Check task logs
aws ecs describe-tasks --cluster arbrit-cluster --tasks <task-id>

# Check CloudWatch logs
aws logs tail /ecs/arbrit-backend --follow
```

### EC2 Backend Won't Start
```bash
# Check logs
sudo journalctl -u arbrit-backend -n 100 --no-pager

# Check if port is in use
sudo netstat -tulpn | grep 8001

# Test backend directly
curl http://localhost:8001/api/health
```

### Database Connection Issues
```bash
# Test from EC2/ECS task
pip install pymongo
python3 -c "from pymongo import MongoClient; client = MongoClient('YOUR_MONGO_URL'); print(client.server_info())"

# Check MongoDB Atlas network access
# Verify IP is whitelisted
```

### SSL Certificate Issues
```bash
# Check certificate status in ACM
aws acm list-certificates

# For Let's Encrypt
sudo certbot certificates
```

---

## 💰 Cost Comparison

| Component | ECS Fargate | EC2 (t3.medium) | Elastic Beanstalk |
|-----------|-------------|-----------------|-------------------|
| Compute | $40 | $30 | $30 |
| Load Balancer | $20 | - | $20 |
| Storage | $5 | $2 | $2 |
| Data Transfer | $10 | $10 | $10 |
| Monitoring | $5 | $5 | $5 |
| **Total/Month** | **~$80** | **~$47** | **~$67** |

**MongoDB Atlas:** Free (M0 tier, 512MB storage)

---

## ✅ Deployment Checklist

- [ ] AWS account created and configured
- [ ] MongoDB Atlas cluster created
- [ ] Database connection string obtained
- [ ] Domain registered/ready
- [ ] Environment variables configured
- [ ] Docker images built (for ECS/EB)
- [ ] Infrastructure deployed
- [ ] SSL certificate issued and attached
- [ ] DNS records configured
- [ ] Application accessible via HTTPS
- [ ] Health checks passing
- [ ] Login with default credentials works
- [ ] All dashboards loading correctly
- [ ] Monitoring/alerting configured
- [ ] Backup strategy implemented

---

## 🎉 Success Criteria

After deployment, verify:

1. **Frontend:** https://yourdomain.com → Login page loads
2. **Backend Health:** https://yourdomain.com/api/health → Returns `{"status":"healthy"}`
3. **Login:** Use MD credentials (971564022503 / PIN: 2503)
4. **Dashboards:** All 9 role dashboards accessible
5. **Database:** Can create employees/leads
6. **SSL:** Valid certificate, no warnings

---

## 📚 Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Let's Encrypt](https://letsencrypt.org/)

---

**Deployment Guide Version:** 1.0  
**Last Updated:** November 20, 2025  
**Maintained By:** DevOps Team

🚀 **Choose your deployment option and start deploying!**

