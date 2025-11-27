# 🚀 AWS Deployment Package - Arbrit Safety Training System

Welcome! This package contains everything you need to deploy the Arbrit Safety Training Management System to Amazon Web Services (AWS).

---

## 📚 Documentation Overview

This package includes comprehensive deployment guides:

1. **[AWS_QUICK_START.md](AWS_QUICK_START.md)** ⚡
   - Quick deployment paths (30-120 minutes)
   - Step-by-step commands
   - **START HERE** if you want to deploy quickly

2. **[AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)** 📖
   - Complete detailed guide
   - Multiple deployment options
   - Troubleshooting and best practices
   - Reference when you need deep details

3. **[DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md)** 🏠
   - Original Hostinger VPS deployment
   - Traditional server setup
   - Alternative to AWS deployment

---

## 🎯 Choose Your Deployment Strategy

### Option 1: AWS ECS with Fargate (Recommended for Production)
- **Cost:** ~$80/month
- **Difficulty:** Medium
- **Time:** 1-2 hours
- **Best for:** Production, scalability, managed infrastructure
- **Guide:** See [AWS_QUICK_START.md](AWS_QUICK_START.md) - Path A

### Option 2: AWS EC2 (Budget-Friendly)
- **Cost:** ~$45/month
- **Difficulty:** Easy
- **Time:** 45-60 minutes
- **Best for:** Full control, cost-conscious deployments
- **Guide:** See [AWS_QUICK_START.md](AWS_QUICK_START.md) - Path B

### Option 3: AWS Elastic Beanstalk
- **Cost:** ~$65/month
- **Difficulty:** Easy
- **Time:** 30-60 minutes
- **Best for:** Quick deployment, managed platform
- **Guide:** See [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md) - Option 3

---

## 📦 What's Included

```
arbrit-safety-export/
├── AWS_README.md                  ← You are here
├── AWS_QUICK_START.md            ← Quick deployment guide
├── AWS_DEPLOYMENT_GUIDE.md       ← Detailed deployment guide
├── DEPLOYMENT_INSTRUCTIONS.md    ← Hostinger deployment (original)
│
├── backend/                      ← FastAPI Backend Application
│   ├── server.py                ← Main application (4300+ lines)
│   └── requirements.txt         ← Python dependencies
│
├── frontend/                     ← React Frontend Application
│   ├── build/                   ← Pre-built production files
│   └── src/                     ← Source code
│
├── docker-compose.yml            ← Docker orchestration
├── Dockerfile.backend            ← Backend container definition
├── Dockerfile.frontend           ← Frontend container definition
├── nginx.conf                    ← Nginx web server config
│
├── aws-configs/                  ← AWS Deployment Configurations
│   ├── backend-task-definition.json      ← ECS backend task
│   ├── frontend-task-definition.json     ← ECS frontend task
│   ├── scaling-policy.json              ← Auto-scaling config
│   └── environment-variables-template.txt ← Environment vars
│
└── scripts/                      ← Automation Scripts
    ├── deploy-to-ecs.sh         ← Automated ECS deployment
    ├── setup-ec2.sh             ← EC2 initial setup
    └── health-check.sh          ← Health monitoring script
```

---

## 🚦 Quick Start (Choose Your Path)

### Path A: ECS Fargate Deployment

```bash
# 1. Configure AWS CLI
aws configure

# 2. Get your AWS Account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo $AWS_ACCOUNT_ID

# 3. Setup MongoDB Atlas (web interface)
# - Visit https://cloud.mongodb.com
# - Create free cluster (M0)
# - Create database: arbrit-workdesk
# - Get connection string

# 4. Configure environment
cd /Users/sms01/Downloads/arbrit-safety-export
cp aws-configs/environment-variables-template.txt aws-configs/.env.aws
nano aws-configs/.env.aws  # Update with your values

# 5. Update task definitions with your AWS Account ID
sed -i '' "s/<YOUR_AWS_ACCOUNT_ID>/$AWS_ACCOUNT_ID/g" aws-configs/*.json

# 6. Run automated deployment
chmod +x scripts/deploy-to-ecs.sh
./scripts/deploy-to-ecs.sh

# 7. Create Load Balancer and ECS Services (via AWS Console)
# Follow: AWS_QUICK_START.md - Path A
```

### Path B: EC2 Deployment

```bash
# 1. Launch EC2 instance via AWS Console
# - Ubuntu 22.04 LTS
# - t3.medium
# - Allow ports: 22, 80, 443

# 2. Allocate and associate Elastic IP

# 3. Upload files to EC2
scp -i your-key.pem -r arbrit-safety-export ubuntu@YOUR_IP:~/

# 4. SSH and run setup
ssh -i your-key.pem ubuntu@YOUR_IP
cd ~/arbrit-safety-export
chmod +x scripts/setup-ec2.sh
sudo ./scripts/setup-ec2.sh

# 5. Continue with manual configuration
# Follow: AWS_QUICK_START.md - Path B
```

---

## 📋 Prerequisites

### Required
- ✅ AWS Account with billing enabled
- ✅ MongoDB Atlas account (free tier available)
- ✅ Domain name (for production)
- ✅ Basic command line knowledge

### Tools Needed

**For ECS Deployment:**
```bash
# macOS
brew install awscli docker

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install
curl -fsSL https://get.docker.com | sh
```

**For EC2 Deployment:**
```bash
# Just need SSH client and your EC2 key pair
# Everything else installed on EC2 by setup script
```

---

## 🗄️ Database Setup (All Paths)

### MongoDB Atlas (Recommended - Free)

1. **Create Account:** https://cloud.mongodb.com
2. **Create Cluster:**
   - Choose AWS
   - Region: Same as your deployment (e.g., us-east-1)
   - Tier: M0 Sandbox (FREE)

3. **Create Database:**
   - Database name: `arbrit-workdesk`
   - Collections: Auto-created by application

4. **Create User:**
   - Username: `arbrit_admin`
   - Password: Generate strong password
   - Role: Read/Write to arbrit-workdesk

5. **Network Access:**
   - Add IP Address: `0.0.0.0/0` (allow from anywhere)
   - Or add specific IPs (EC2 Elastic IP, NAT Gateway for ECS)

6. **Get Connection String:**
   ```
   mongodb+srv://arbrit_admin:PASSWORD@cluster0.xxxxx.mongodb.net/arbrit-workdesk
   ```

---

## 🔐 Default Login Credentials

After deployment, use these default accounts:

**Managing Director (MD):**
- Mobile: `971564022503`
- PIN: `2503`

**Chief Operating Officer (COO):**
- Mobile: `971566374020`
- PIN: `4020`

⚠️ **IMPORTANT:** Change these PINs immediately after first login!

---

## 🌐 Domain & SSL Configuration

### Domain Setup

**Option 1: AWS Route 53**
- Transfer or register domain in Route 53
- DNS records automatically managed

**Option 2: External DNS Provider**
- Point domain to:
  - **EC2:** Your Elastic IP (A record)
  - **ECS/ALB:** ALB DNS name (CNAME record)

### SSL Certificate

**For ECS/ALB:**
```bash
# Use AWS Certificate Manager (ACM)
# 1. Request certificate for yourdomain.com and *.yourdomain.com
# 2. Validate via DNS (add CNAME records)
# 3. Attach to Application Load Balancer
```

**For EC2:**
```bash
# Use Let's Encrypt (Free)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 💰 Cost Breakdown

### ECS Fargate (Production)
| Component | Monthly Cost |
|-----------|-------------|
| Fargate Tasks (2x) | $40 |
| Application Load Balancer | $20 |
| Data Transfer | $10 |
| CloudWatch Logs | $5 |
| **Total** | **~$75-80** |

### EC2 Instance (Budget)
| Component | Monthly Cost |
|-----------|-------------|
| t3.medium (2 vCPU, 4GB) | $30 |
| EBS Storage (20GB) | $2 |
| Elastic IP | $0 (when attached) |
| Data Transfer | $10 |
| **Total** | **~$42-45** |

### Shared Costs (Both)
- MongoDB Atlas: **FREE** (M0 tier, 512MB)
- Domain: $10-15/year (if not owned)

---

## 🛡️ Security Checklist

Before going live:

- [ ] Changed default MD/COO PINs
- [ ] Generated strong JWT_SECRET_KEY (min 32 chars)
- [ ] Configured CORS to only allow your domains
- [ ] MongoDB IP whitelist configured
- [ ] SSL certificate installed and valid
- [ ] AWS Security Groups restrict SSH to your IP
- [ ] Firewall (UFW) enabled on EC2
- [ ] Regular backup strategy implemented
- [ ] CloudWatch monitoring/alerts configured

---

## ✅ Deployment Verification

After deployment, verify everything works:

```bash
# 1. Test backend health
curl https://yourdomain.com/api/health
# Expected: {"status":"healthy"}

# 2. Test frontend
curl https://yourdomain.com
# Expected: HTML content

# 3. Test in browser
open https://yourdomain.com
# Expected: Login page loads

# 4. Test login
# Use MD credentials: 971564022503 / PIN: 2503
# Expected: Dashboard loads

# 5. Run health check script (EC2 only)
./scripts/health-check.sh
```

---

## 🔧 Maintenance & Operations

### View Logs

**ECS:**
```bash
# Via AWS Console: CloudWatch → Log Groups → /ecs/arbrit-backend
# Or CLI:
aws logs tail /ecs/arbrit-backend --follow
```

**EC2:**
```bash
# Backend logs
sudo journalctl -u arbrit-backend -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# Quick deployment helper
arbrit-deploy  # Interactive menu
```

### Update Application

**ECS:**
```bash
# Rebuild and push new images
docker build -f Dockerfile.backend -t arbrit-backend:v2 .
docker tag arbrit-backend:v2 $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:v2
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/arbrit-backend:v2

# Force new deployment
aws ecs update-service --cluster arbrit-cluster --service arbrit-backend-service --force-new-deployment
```

**EC2:**
```bash
# Upload new files
scp -i key.pem -r backend/* ubuntu@IP:/var/www/arbrit-safety/backend/

# Restart service
sudo systemctl restart arbrit-backend
```

### Backup Strategy

**MongoDB Atlas:**
- Enable automated backups (free on paid tiers)
- Manual snapshots for critical milestones

**EC2:**
- Create AMI snapshots weekly
- Enable automated EBS snapshots

**ECS:**
- Images stored in ECR (versioned)
- Enable ECR lifecycle policies

---

## 🆘 Troubleshooting

### Common Issues

**Backend won't start:**
```bash
# Check logs
sudo journalctl -u arbrit-backend -n 100  # EC2
aws logs tail /ecs/arbrit-backend --follow  # ECS

# Test MongoDB connection
python3 -c "from pymongo import MongoClient; client = MongoClient('YOUR_MONGO_URL'); print(client.server_info())"
```

**Frontend shows 404:**
```bash
# Check nginx config
sudo nginx -t

# Verify build folder exists
ls -la /var/www/arbrit-safety/frontend/build  # EC2

# Restart nginx
sudo systemctl restart nginx
```

**Can't connect to domain:**
```bash
# Check DNS propagation
nslookup yourdomain.com

# Test with IP directly
curl http://YOUR_IP  # EC2
curl http://ALB_DNS_NAME  # ECS
```

**SSL certificate issues:**
```bash
# Check certificate status
sudo certbot certificates  # EC2 Let's Encrypt
aws acm list-certificates  # AWS ACM

# Renew Let's Encrypt
sudo certbot renew
```

### Getting Help

1. **Check Logs:** Always start with application logs
2. **Test Components:** Test backend, frontend, database separately
3. **Review Guides:** See detailed troubleshooting in AWS_DEPLOYMENT_GUIDE.md
4. **Health Check:** Run health-check.sh script (EC2)

---

## 📊 Monitoring & Alerts

### Setup CloudWatch Monitoring

```bash
# Create alarms for:
# - High CPU (>80%)
# - Memory usage (>80%)
# - HTTP 5xx errors
# - Health check failures

# Example: CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name arbrit-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold
```

---

## 📚 Additional Resources

- **AWS Documentation:**
  - [ECS Getting Started](https://docs.aws.amazon.com/ecs/latest/developerguide/)
  - [EC2 User Guide](https://docs.aws.amazon.com/ec2/)
  - [Certificate Manager](https://docs.aws.amazon.com/acm/)

- **Application Documentation:**
  - [FastAPI Docs](https://fastapi.tiangolo.com/)
  - [React Docs](https://react.dev/)
  - [MongoDB Atlas](https://docs.atlas.mongodb.com/)

- **Security:**
  - [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
  - [Let's Encrypt](https://letsencrypt.org/getting-started/)

---

## 🎓 Application Features

### 9 Role-Based Dashboards
1. **MD (Managing Director)** - Executive intelligence
2. **COO (Chief Operating Officer)** - Operations management
3. **HR Manager** - Employee management, attendance
4. **Sales Head** - Team monitoring, analytics
5. **Sales Employees** - Lead management, quotations
6. **Tele Sales** - Call management
7. **Field Sales** - Field operations
8. **Academic Head** - Training programs, courses
9. **Accounts** - Financial management

### Core Modules
- 👥 **HR Management:** Onboarding, attendance, documents, leave
- 📊 **Sales Management:** CRM, quotations, pipeline tracking
- 🎓 **Academic Management:** Courses, trainers, schedules
- 💰 **Financial Management:** Expenses, invoices, approvals
- 🚚 **Dispatch Management:** Logistics, delivery tracking

---

## 📞 Support & Contact

**Deployment Issues:**
- Review troubleshooting sections in guides
- Check application logs
- Verify environment configuration
- Test MongoDB connection

**Application Issues:**
- Check backend logs: `sudo journalctl -u arbrit-backend -n 100`
- Check nginx logs: `tail -f /var/log/nginx/error.log`
- Visit diagnostics page: `https://yourdomain.com/diagnostics`

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ Backend health endpoint returns: `{"status":"healthy"}`  
✅ Frontend login page loads via HTTPS  
✅ SSL certificate is valid (no browser warnings)  
✅ Can login with MD credentials (971564022503 / 2503)  
✅ All 9 dashboards are accessible  
✅ Can create test employee record  
✅ Can create test lead record  
✅ MongoDB connection is stable  
✅ No errors in application logs  

---

## 📝 Version Information

- **Package Version:** 1.0.0
- **Export Date:** November 20, 2025
- **Backend Framework:** FastAPI 0.110.1
- **Frontend Framework:** React 18
- **Database:** MongoDB (Atlas recommended)
- **Target Platform:** Amazon Web Services (AWS)

---

## 🚀 Ready to Deploy?

1. **Choose your path:** ECS (scalable) or EC2 (budget-friendly)
2. **Follow the guide:** See [AWS_QUICK_START.md](AWS_QUICK_START.md)
3. **Deploy & verify:** Use provided scripts and checklists
4. **Go live:** Update DNS and test thoroughly

**Estimated Deployment Time:**
- ECS Fargate: 1-2 hours
- EC2: 45-60 minutes
- DNS Propagation: 5-30 minutes

---

**Need detailed instructions?** → See [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)  
**Want quick deployment?** → See [AWS_QUICK_START.md](AWS_QUICK_START.md)  
**Traditional VPS?** → See [DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md)

---

**🚀 Good luck with your AWS deployment!**

*Prepared with ❤️ for production deployment*

