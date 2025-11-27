# 🚀 AWS Quick Start Guide - Arbrit Safety

This is a condensed quick-start guide. For detailed instructions, see `AWS_DEPLOYMENT_GUIDE.md`.

## 📋 Choose Your Deployment Path

### Path A: ECS Fargate (Managed Containers) - ~$80/month
**Best for:** Production, auto-scaling, no server management
**Time:** 1-2 hours
**Complexity:** Medium

### Path B: EC2 (Virtual Server) - ~$45/month
**Best for:** Budget-friendly, full control
**Time:** 30-60 minutes
**Complexity:** Easy

---

## 🏃 Path A: ECS Fargate Quick Deploy

### Prerequisites (5 mins)
```bash
# Install AWS CLI
brew install awscli  # macOS
# OR
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install  # Linux

# Configure AWS
aws configure
# Enter: Access Key, Secret Key, Region (us-east-1), Format (json)

# Get your AWS Account ID
aws sts get-caller-identity --query Account --output text
```

### Setup MongoDB (10 mins)
1. Go to https://cloud.mongodb.com
2. Create free cluster (M0)
3. Create database: `arbrit-workdesk`
4. Create user with password
5. Network Access → Add IP: `0.0.0.0/0`
6. Copy connection string

### Configure Environment (2 mins)
```bash
cd /Users/sms01/Downloads/arbrit-safety-export

# Copy and edit environment template
cp aws-configs/environment-variables-template.txt aws-configs/.env.aws

# Edit with your values
nano aws-configs/.env.aws
```

Update these in `.env.aws`:
- `AWS_ACCOUNT_ID` - from AWS CLI command above
- `MONGO_URL` - from MongoDB Atlas
- `JWT_SECRET_KEY` - generate with: `openssl rand -hex 32`
- `DOMAIN_NAME` - your domain
- `CORS_ORIGINS` - your domain URLs

### Update Task Definitions (2 mins)
```bash
# Replace AWS Account ID in task definitions
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

sed -i '' "s/<YOUR_AWS_ACCOUNT_ID>/$AWS_ACCOUNT_ID/g" aws-configs/backend-task-definition.json
sed -i '' "s/<YOUR_AWS_ACCOUNT_ID>/$AWS_ACCOUNT_ID/g" aws-configs/frontend-task-definition.json
```

### Deploy to AWS (15-30 mins)
```bash
# Make script executable
chmod +x scripts/deploy-to-ecs.sh

# Run automated deployment
./scripts/deploy-to-ecs.sh
```

This script will:
- ✅ Login to ECR
- ✅ Create ECR repositories
- ✅ Build Docker images
- ✅ Push images to ECR
- ✅ Create ECS cluster
- ✅ Register task definitions

### Create Load Balancer & Services (20 mins via AWS Console)

1. **Create Application Load Balancer:**
   - EC2 → Load Balancers → Create
   - Type: Application Load Balancer
   - Name: `arbrit-alb`
   - Scheme: Internet-facing
   - Select VPC and 2+ subnets
   - Security Group: Allow 80, 443

2. **Create Target Groups:**
   - Backend: Port 8001, Health check: `/api/health`
   - Frontend: Port 80, Health check: `/`

3. **Create ECS Services:**
   - ECS → Clusters → arbrit-cluster
   - Create Service for backend (connect to backend target group)
   - Create Service for frontend (connect to frontend target group)
   - Launch type: Fargate
   - Desired tasks: 1

4. **Configure SSL:**
   - Certificate Manager → Request certificate
   - Add domains: `yourdomain.com`, `*.yourdomain.com`
   - Validate via DNS
   - Add HTTPS listener to ALB with certificate

5. **Update DNS:**
   - Point domain to ALB DNS name

### Verify (5 mins)
```bash
# Check services
aws ecs list-services --cluster arbrit-cluster

# Test endpoints
curl https://yourdomain.com
curl https://yourdomain.com/api/health
```

---

## 🏃 Path B: EC2 Quick Deploy

### Launch EC2 (10 mins)
1. **AWS Console → EC2 → Launch Instance**
2. Name: `arbrit-production`
3. AMI: Ubuntu 22.04 LTS
4. Instance type: t3.medium
5. Key pair: Create and download
6. Security Group: Allow 22 (SSH), 80 (HTTP), 443 (HTTPS)
7. Storage: 20 GB
8. Launch

### Allocate Elastic IP (2 mins)
1. EC2 → Elastic IPs → Allocate
2. Associate with your instance
3. Note the IP address

### Setup Server (10 mins)
```bash
# SSH into EC2
chmod 400 ~/Downloads/your-key.pem
ssh -i ~/Downloads/your-key.pem ubuntu@YOUR_ELASTIC_IP

# Run automated setup script
# First, upload the project files
exit  # Exit from EC2

# From your local machine
scp -i ~/Downloads/your-key.pem -r /Users/sms01/Downloads/arbrit-safety-export ubuntu@YOUR_ELASTIC_IP:~/

# SSH back in
ssh -i ~/Downloads/your-key.pem ubuntu@YOUR_ELASTIC_IP

# Run setup script
cd ~/arbrit-safety-export
chmod +x scripts/setup-ec2.sh
sudo ./scripts/setup-ec2.sh
```

### Setup MongoDB (same as ECS path above)

### Configure Backend (5 mins)
```bash
# Move files to proper location
sudo mkdir -p /var/www/arbrit-safety
sudo cp -r ~/arbrit-safety-export/* /var/www/arbrit-safety/
cd /var/www/arbrit-safety/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cat > .env << EOF
MONGO_URL=your_mongodb_atlas_url
DB_NAME=arbrit-workdesk
JWT_SECRET_KEY=$(openssl rand -hex 32)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
EOF
```

### Create Backend Service (5 mins)
```bash
sudo tee /etc/systemd/system/arbrit-backend.service > /dev/null << EOF
[Unit]
Description=Arbrit Safety Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/var/www/arbrit-safety/backend
Environment="PATH=/var/www/arbrit-safety/backend/venv/bin"
ExecStart=/var/www/arbrit-safety/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start service
sudo systemctl daemon-reload
sudo systemctl start arbrit-backend
sudo systemctl enable arbrit-backend
sudo systemctl status arbrit-backend
```

### Configure Nginx (5 mins)
```bash
sudo tee /etc/nginx/sites-available/arbrit > /dev/null << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/arbrit-safety/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/arbrit /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Remove default
sudo nginx -t
sudo systemctl restart nginx
```

### Setup SSL (5 mins)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts, select redirect HTTP to HTTPS
```

### Update DNS (5 mins)
Point your domain to the Elastic IP:
- Type: A
- Host: @ and www
- Value: YOUR_ELASTIC_IP

### Verify (5 mins)
```bash
# Test locally
curl http://localhost:8001/api/health
curl http://localhost

# Test via domain (after DNS propagates)
curl https://yourdomain.com
curl https://yourdomain.com/api/health

# Run health check script
chmod +x /var/www/arbrit-safety/scripts/health-check.sh
/var/www/arbrit-safety/scripts/health-check.sh
```

---

## ✅ Post-Deployment Checklist

- [ ] Backend health check returns `{"status":"healthy"}`
- [ ] Frontend loads in browser
- [ ] HTTPS working with valid certificate
- [ ] Can login with MD credentials (971564022503 / PIN: 2503)
- [ ] All dashboards accessible
- [ ] Can create test employee
- [ ] MongoDB connection working

---

## 🆘 Quick Troubleshooting

### Backend won't start
```bash
# Check logs
sudo journalctl -u arbrit-backend -n 50

# Test MongoDB connection
python3 -c "from pymongo import MongoClient; client = MongoClient('YOUR_MONGO_URL'); print(client.server_info())"
```

### Frontend shows 404
```bash
# Check nginx
sudo nginx -t
ls -la /var/www/arbrit-safety/frontend/build
sudo systemctl restart nginx
```

### Can't connect to domain
```bash
# Check DNS propagation
nslookup yourdomain.com

# Check firewall
sudo ufw status

# Check AWS Security Group (EC2 Console)
```

---

## 📊 Cost Estimate Summary

**ECS Fargate:**
- Compute: $40/month
- Load Balancer: $20/month
- Storage/Logs: $10/month
- **Total: ~$70-80/month**

**EC2 t3.medium:**
- Instance: $30/month
- Storage: $2/month
- Elastic IP: Free
- **Total: ~$32-45/month**

**MongoDB Atlas:** Free (M0 tier)

---

## 📚 Next Steps

1. **Change default credentials** (MD/COO accounts)
2. **Setup monitoring** (CloudWatch for ECS, CloudWatch agent for EC2)
3. **Configure backups** (MongoDB Atlas, EC2 snapshots)
4. **Setup alerts** (CloudWatch alarms)
5. **Review security** (Security groups, IAM roles)

---

## 📞 Need Help?

- **Detailed Guide:** See `AWS_DEPLOYMENT_GUIDE.md`
- **Check Logs:** Use health-check.sh script
- **Test Endpoints:** `curl https://yourdomain.com/api/health`

---

**Deployment Time Estimates:**
- **ECS Fargate:** 1-2 hours
- **EC2:** 45-60 minutes
- **DNS Propagation:** 5-30 minutes

Good luck with your deployment! 🚀

