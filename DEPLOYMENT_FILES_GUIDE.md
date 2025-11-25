# 📁 Deployment Files Guide

## Overview
This document explains all the deployment-related files in this package and when to use them.

---

## 📖 Documentation Files

### 1. AWS_README.md
**Purpose:** Main entry point for AWS deployment  
**When to use:** Start here when deploying to AWS  
**Contains:**
- Overview of all deployment options
- Quick links to other guides
- Prerequisites checklist
- Cost comparison
- Default credentials

### 2. AWS_QUICK_START.md ⚡ RECOMMENDED
**Purpose:** Fast-track deployment guide  
**When to use:** When you want step-by-step commands to deploy quickly  
**Contains:**
- Path A: ECS Fargate deployment (1-2 hours)
- Path B: EC2 deployment (45-60 mins)
- Copy-paste commands
- Quick troubleshooting

### 3. AWS_DEPLOYMENT_GUIDE.md 📚
**Purpose:** Comprehensive reference guide  
**When to use:** When you need detailed explanations and options  
**Contains:**
- Three deployment options (ECS, EC2, Elastic Beanstalk)
- Detailed architecture explanations
- Advanced configurations
- Complete troubleshooting guide
- Security best practices
- Monitoring setup

### 4. DEPLOYMENT_INSTRUCTIONS.md
**Purpose:** Original Hostinger VPS deployment  
**When to use:** If deploying to traditional VPS (not AWS)  
**Contains:**
- Hostinger-specific setup
- Direct deployment instructions
- Docker deployment option

### 5. README_EXPORT.md
**Purpose:** General package information  
**When to use:** First-time orientation  
**Contains:**
- Package contents
- System requirements
- Tech stack details
- Application features

---

## 🔧 Configuration Files

### AWS Configs Directory (`aws-configs/`)

#### backend-task-definition.json
**Purpose:** ECS Fargate backend container configuration  
**When to use:** ECS/Fargate deployment  
**What to do:**
```bash
# Replace <YOUR_AWS_ACCOUNT_ID> with your actual AWS account ID
sed -i "s/<YOUR_AWS_ACCOUNT_ID>/123456789012/g" backend-task-definition.json
```

#### frontend-task-definition.json
**Purpose:** ECS Fargate frontend container configuration  
**When to use:** ECS/Fargate deployment  
**What to do:**
```bash
# Replace <YOUR_AWS_ACCOUNT_ID> with your actual AWS account ID
sed -i "s/<YOUR_AWS_ACCOUNT_ID>/123456789012/g" frontend-task-definition.json
```

#### scaling-policy.json
**Purpose:** Auto-scaling configuration for ECS  
**When to use:** When setting up auto-scaling for production  
**Contains:**
- Target CPU utilization: 70%
- Scale-out/in cooldown: 300 seconds

#### environment-variables-template.txt
**Purpose:** Template for environment variables  
**When to use:** Before any deployment  
**What to do:**
1. Copy to `.env.aws` (for ECS) or `.env` (for EC2)
2. Fill in all values (MongoDB URL, JWT secret, domain, etc.)
3. Never commit the filled version to Git

---

## 🚀 Automation Scripts (`scripts/`)

### deploy-to-ecs.sh
**Purpose:** Automated ECS deployment script  
**When to use:** After configuring AWS CLI and environment variables  
**What it does:**
1. ✅ Logs into AWS ECR
2. ✅ Creates ECR repositories
3. ✅ Builds Docker images
4. ✅ Pushes images to ECR
5. ✅ Creates ECS cluster
6. ✅ Registers task definitions
7. ✅ Updates ECS services

**Usage:**
```bash
chmod +x scripts/deploy-to-ecs.sh
./scripts/deploy-to-ecs.sh
```

**Prerequisites:**
- AWS CLI configured (`aws configure`)
- Docker installed and running
- `.env.aws` file configured

### setup-ec2.sh
**Purpose:** Initial EC2 instance setup  
**When to use:** First time setting up a new EC2 instance  
**What it does:**
1. ✅ Updates system packages
2. ✅ Installs Python 3.11
3. ✅ Installs Node.js
4. ✅ Installs Nginx
5. ✅ Installs Certbot (SSL)
6. ✅ Configures firewall (UFW)
7. ✅ Installs Docker
8. ✅ Sets up swap space
9. ✅ Installs monitoring tools (htop, fail2ban)
10. ✅ Creates helper scripts

**Usage:**
```bash
# Upload to EC2
scp -i key.pem -r arbrit-safety-export ubuntu@YOUR_IP:~/

# SSH into EC2
ssh -i key.pem ubuntu@YOUR_IP

# Run script
cd ~/arbrit-safety-export
chmod +x scripts/setup-ec2.sh
sudo ./scripts/setup-ec2.sh
```

### health-check.sh
**Purpose:** System and application health monitoring  
**When to use:** After deployment to verify everything works  
**What it checks:**
- ✅ Backend health endpoint
- ✅ Frontend accessibility
- ✅ MongoDB connection
- ✅ Service status (systemd)
- ✅ Disk space usage
- ✅ Memory usage
- ✅ CPU load

**Usage:**
```bash
chmod +x scripts/health-check.sh
./scripts/health-check.sh
```

**Sample Output:**
```
Backend Health:
✓ Backend Health Endpoint: OK
✓ API Documentation: OK

Frontend Health:
✓ Frontend Home: OK
✓ Login Page: OK

Service Status:
✓ Service arbrit-backend: Running
✓ Service nginx: Running

Database Connection:
✓ MongoDB: Connected

Disk Space:
✓ Disk usage: 45%
```

---

## 🐳 Docker Files

### Dockerfile.backend
**Purpose:** Backend container image definition  
**What it does:**
- Uses Python 3.11
- Installs backend dependencies
- Exposes port 8001
- Runs Uvicorn server

### Dockerfile.frontend
**Purpose:** Frontend container image definition  
**What it does:**
- Uses Nginx Alpine
- Copies pre-built React app
- Exposes ports 80 and 443
- Serves static files

### docker-compose.yml
**Purpose:** Local Docker development/testing  
**When to use:** Local testing before deploying to AWS  
**Usage:**
```bash
docker-compose up -d
```

### nginx.conf
**Purpose:** Nginx web server configuration  
**Used by:** 
- Dockerfile.frontend (for Docker deployment)
- EC2 manual Nginx setup

---

## 📋 Deployment Workflow Diagrams

### ECS Fargate Deployment Flow

```
1. Prerequisites
   ├── Install AWS CLI
   ├── Install Docker
   ├── Create MongoDB Atlas cluster
   └── Configure aws-configs/.env.aws

2. Build & Push Images
   ├── Run deploy-to-ecs.sh
   ├── Build Docker images
   ├── Push to ECR
   └── Register task definitions

3. Infrastructure Setup (AWS Console)
   ├── Create Application Load Balancer
   ├── Create Target Groups (backend + frontend)
   ├── Create ECS Services
   └── Link services to target groups

4. Domain & SSL
   ├── Request ACM certificate
   ├── Validate certificate (DNS)
   ├── Add HTTPS listener to ALB
   └── Update DNS records

5. Verify
   ├── Test backend: /api/health
   ├── Test frontend: /login
   └── Login with default credentials
```

### EC2 Deployment Flow

```
1. Launch EC2
   ├── Choose Ubuntu 22.04 LTS
   ├── Select t3.medium
   ├── Configure Security Group
   └── Allocate Elastic IP

2. Initial Setup
   ├── Upload project files
   ├── Run setup-ec2.sh
   └── Create MongoDB Atlas cluster

3. Backend Setup
   ├── Create Python virtual environment
   ├── Install dependencies
   ├── Configure .env file
   └── Create systemd service

4. Frontend Setup
   ├── Verify build folder exists
   ├── Configure Nginx
   └── Enable Nginx site

5. SSL & Domain
   ├── Run Certbot
   ├── Update DNS records
   └── Test HTTPS

6. Verify
   ├── Run health-check.sh
   ├── Test all endpoints
   └── Login and test features
```

---

## 🎯 Quick Reference: When to Use Which File

### Deploying to AWS ECS Fargate
**Read:**
1. AWS_README.md (overview)
2. AWS_QUICK_START.md - Path A (step-by-step)

**Use:**
1. `aws-configs/environment-variables-template.txt` → create `.env.aws`
2. `aws-configs/backend-task-definition.json` (update AWS account ID)
3. `aws-configs/frontend-task-definition.json` (update AWS account ID)
4. `scripts/deploy-to-ecs.sh` (run automated deployment)
5. `aws-configs/scaling-policy.json` (optional: for auto-scaling)

**Reference:** AWS_DEPLOYMENT_GUIDE.md for detailed explanations

---

### Deploying to AWS EC2
**Read:**
1. AWS_README.md (overview)
2. AWS_QUICK_START.md - Path B (step-by-step)

**Use:**
1. `scripts/setup-ec2.sh` (initial server setup)
2. `backend/.env` (create from template)
3. `nginx.conf` (reference for Nginx config)
4. `scripts/health-check.sh` (verify deployment)

**Reference:** AWS_DEPLOYMENT_GUIDE.md for detailed explanations

---

### Deploying to Traditional VPS (Hostinger)
**Read:**
1. DEPLOYMENT_INSTRUCTIONS.md (complete guide)

**Use:**
1. Docker option: `docker-compose.yml`
2. Direct option: Manual setup following guide

---

### Local Development/Testing
**Use:**
1. `docker-compose.yml`
2. `Dockerfile.backend`
3. `Dockerfile.frontend`

**Run:**
```bash
docker-compose up -d
```

---

## 🔍 File Dependencies

### For ECS Deployment
```
deploy-to-ecs.sh
    ├── requires: aws-configs/.env.aws
    ├── uses: Dockerfile.backend
    ├── uses: Dockerfile.frontend
    ├── uses: aws-configs/backend-task-definition.json
    └── uses: aws-configs/frontend-task-definition.json
```

### For EC2 Deployment
```
setup-ec2.sh
    └── prepares server for: backend/, frontend/, nginx.conf

Manual Backend Setup
    ├── requires: backend/requirements.txt
    ├── requires: backend/.env
    └── creates: systemd service

Manual Frontend Setup
    ├── uses: frontend/build/
    └── uses: nginx.conf (as reference)
```

---

## 📊 File Size Reference

```
Documentation (Text):
├── AWS_DEPLOYMENT_GUIDE.md      ~50 KB (comprehensive)
├── AWS_QUICK_START.md           ~20 KB (condensed)
├── AWS_README.md                ~25 KB (overview)
├── DEPLOYMENT_INSTRUCTIONS.md   ~15 KB (Hostinger)
└── README_EXPORT.md             ~10 KB (package info)

Scripts (Executable):
├── deploy-to-ecs.sh             ~5 KB (automated deployment)
├── setup-ec2.sh                 ~8 KB (server setup)
└── health-check.sh              ~3 KB (monitoring)

Config Files (JSON/Text):
├── backend-task-definition.json  ~2 KB (ECS task)
├── frontend-task-definition.json ~1.5 KB (ECS task)
├── scaling-policy.json           ~200 bytes (auto-scaling)
└── environment-variables-template.txt ~2 KB (env vars)
```

---

## ✅ Pre-Deployment Checklist

Before deploying, make sure you have:

**For ECS:**
- [ ] AWS CLI installed and configured
- [ ] Docker installed and running
- [ ] MongoDB Atlas cluster created
- [ ] Connection string obtained
- [ ] `.env.aws` file created and filled
- [ ] AWS account ID updated in task definitions
- [ ] Domain ready (optional but recommended)

**For EC2:**
- [ ] EC2 instance launched (Ubuntu 22.04)
- [ ] SSH key downloaded
- [ ] Elastic IP allocated and associated
- [ ] Security Group configured (22, 80, 443)
- [ ] MongoDB Atlas cluster created
- [ ] Connection string obtained
- [ ] Domain ready (optional but recommended)

---

## 🎓 Learning Path

### New to AWS?
1. Start with AWS_README.md
2. Choose EC2 path (simpler)
3. Follow AWS_QUICK_START.md - Path B
4. Use setup-ec2.sh for automation

### Experienced with AWS?
1. Skim AWS_README.md
2. Choose ECS path (production-ready)
3. Follow AWS_QUICK_START.md - Path A
4. Use deploy-to-ecs.sh for automation
5. Reference AWS_DEPLOYMENT_GUIDE.md as needed

### Want to understand everything?
1. Read AWS_DEPLOYMENT_GUIDE.md thoroughly
2. Review all config files
3. Examine all scripts
4. Test locally with docker-compose first

---

## 📞 File-Specific Support

**If deploy-to-ecs.sh fails:**
- Check AWS CLI is configured: `aws sts get-caller-identity`
- Check Docker is running: `docker ps`
- Verify `.env.aws` exists and is filled
- Check AWS account ID in task definitions

**If setup-ec2.sh fails:**
- Ensure running with sudo
- Check internet connectivity
- Review logs at: `/var/log/setup-*.log`
- Run individual commands manually

**If health-check.sh shows errors:**
- Check services: `sudo systemctl status arbrit-backend nginx`
- Test backend: `curl http://localhost:8001/api/health`
- Check MongoDB: Verify connection string in .env
- Review logs: `sudo journalctl -u arbrit-backend -n 50`

---

## 🚀 Quick Command Reference

### ECS Deployment
```bash
# Full automated deployment
./scripts/deploy-to-ecs.sh

# Manual steps (if needed)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com
docker build -f Dockerfile.backend -t arbrit-backend .
docker push <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:latest
```

### EC2 Deployment
```bash
# Initial setup
sudo ./scripts/setup-ec2.sh

# Health check
./scripts/health-check.sh

# View logs
sudo journalctl -u arbrit-backend -f

# Restart services
sudo systemctl restart arbrit-backend nginx
```

---

**This guide:** Explains what each file does and when to use it  
**Next step:** Read AWS_README.md to choose your deployment path

---

*Last updated: November 20, 2025*

