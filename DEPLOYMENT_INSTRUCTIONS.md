# 🚀 Arbrit Safety Training - Hostinger Deployment Guide

## 📦 Package Contents

```
arbrit-safety-export/
├── backend/                    # FastAPI backend
│   ├── server.py              # Main application file
│   ├── requirements.txt       # Python dependencies
│   └── .env.example          # Environment variables template
├── frontend/                   # React frontend
│   ├── build/                 # Production build (ready to deploy)
│   └── .env.example          # Frontend environment template
├── docker-compose.yml         # Docker deployment (optional)
├── Dockerfile.backend         # Backend Docker image
├── Dockerfile.frontend        # Frontend Docker image (nginx)
├── nginx.conf                 # Nginx configuration for frontend
└── DEPLOYMENT_INSTRUCTIONS.md # This file
```

---

## 🎯 Deployment Options

### Option 1: Direct Deployment (Recommended for Hostinger VPS)
### Option 2: Docker Deployment (Easiest - Requires Docker)

---

## 📋 Prerequisites

**For Direct Deployment:**
- Ubuntu/Debian VPS from Hostinger
- Python 3.9+
- Node.js 18+ (for frontend build - optional if using pre-built)
- MongoDB Atlas account (for database)
- Domain pointed to your VPS IP

**For Docker Deployment:**
- Docker and Docker Compose installed
- MongoDB Atlas account
- Domain pointed to your VPS IP

---

## 🔧 Option 1: Direct Deployment on Hostinger VPS

### Step 1: Upload Files

```bash
# SSH into your Hostinger VPS
ssh root@your-vps-ip

# Create application directory
mkdir -p /var/www/arbrit-safety
cd /var/www/arbrit-safety

# Upload the extracted files (use SCP or SFTP)
# From your local machine:
scp -r arbrit-safety-export/* root@your-vps-ip:/var/www/arbrit-safety/
```

### Step 2: Setup Backend

```bash
# Navigate to backend
cd /var/www/arbrit-safety/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from template
cp .env.example .env
nano .env  # Edit with your actual values
```

**Backend .env Configuration:**
```env
MONGO_URL=mongodb+srv://USERNAME:PASSWORD@your-cluster.mongodb.net/arbrit-workdesk
DB_NAME=arbrit-workdesk
JWT_SECRET_KEY=your-super-secret-jwt-key-here-change-this
CORS_ORIGINS=https://www.happinotes.in,https://happinotes.in
```

### Step 3: Setup Frontend

```bash
# The build folder is already included, no npm install needed!
cd /var/www/arbrit-safety/frontend

# Create .env file
cp .env.example .env
nano .env
```

**Frontend .env Configuration:**
```env
REACT_APP_BACKEND_URL=https://api.happinotes.in
```

**Note:** Frontend build is pre-compiled, you just need to serve it!

### Step 4: Install and Configure Nginx

```bash
# Install Nginx
apt update
apt install nginx -y

# Create Nginx configuration for frontend
nano /etc/nginx/sites-available/happinotes
```

**Nginx Configuration:**
```nginx
# Frontend (www.happinotes.in)
server {
    listen 80;
    server_name www.happinotes.in happinotes.in;

    root /var/www/arbrit-safety/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static files caching
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Backend API (api.happinotes.in)
server {
    listen 80;
    server_name api.happinotes.in;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable the site
ln -s /etc/nginx/sites-available/happinotes /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 5: Setup SSL with Let's Encrypt

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificates
certbot --nginx -d www.happinotes.in -d happinotes.in -d api.happinotes.in
```

### Step 6: Setup Backend as Service

```bash
# Create systemd service
nano /etc/systemd/system/arbrit-backend.service
```

**Service Configuration:**
```ini
[Unit]
Description=Arbrit Safety Backend
After=network.target

[Service]
User=root
WorkingDirectory=/var/www/arbrit-safety/backend
Environment="PATH=/var/www/arbrit-safety/backend/venv/bin"
ExecStart=/var/www/arbrit-safety/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Start and enable service
systemctl daemon-reload
systemctl start arbrit-backend
systemctl enable arbrit-backend
systemctl status arbrit-backend
```

### Step 7: Configure DNS on Hostinger

In your Hostinger domain management (happinotes.in):

```
Type: A
Host: @
Value: YOUR_VPS_IP
TTL: 300

Type: A
Host: www
Value: YOUR_VPS_IP
TTL: 300

Type: A
Host: api
Value: YOUR_VPS_IP
TTL: 300
```

### Step 8: Verify Deployment

```bash
# Check backend
curl http://localhost:8001/api/health

# Check frontend
curl http://www.happinotes.in

# Check SSL
curl https://www.happinotes.in
curl https://api.happinotes.in/api/health
```

---

## 🐳 Option 2: Docker Deployment (Easier!)

### Step 1: Install Docker

```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose -y
```

### Step 2: Upload Files and Configure

```bash
# Upload files to VPS
scp -r arbrit-safety-export/* root@your-vps-ip:/var/www/arbrit-safety/
ssh root@your-vps-ip
cd /var/www/arbrit-safety

# Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit with your values
nano backend/.env
nano frontend/.env
```

### Step 3: Deploy with Docker Compose

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Step 4: Setup Nginx Reverse Proxy

Install Nginx and configure as shown in Option 1, but proxy to:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8001`

---

## 📊 MongoDB Setup

### Create MongoDB Atlas Database

1. Go to https://cloud.mongodb.com
2. Create a free cluster
3. Create database: `arbrit-workdesk`
4. Create database user with read/write permissions
5. Whitelist your VPS IP (or use 0.0.0.0/0 for all IPs)
6. Get connection string:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/arbrit-workdesk
   ```

### Database Collections (Auto-created)

The application will automatically create these collections:
- `users` - User accounts
- `employees` - Employee records
- `leads` - Sales leads
- `quotations` - Sales quotations
- `courses` - Training courses
- `trainers` - Trainer records
- `attendance` - Attendance logs
- `leave_requests` - Leave applications
- `expense_claims` - Expense reimbursements

**Initial Users (Auto-seeded):**
- MD: 971564022503 / PIN: 2503
- COO: 971566374020 / PIN: 4020

---

## 🔒 Security Checklist

- [ ] Change JWT_SECRET_KEY to a strong random string
- [ ] Configure CORS_ORIGINS to only allow your domain
- [ ] Enable MongoDB authentication
- [ ] Whitelist only your VPS IP in MongoDB Atlas
- [ ] Setup firewall (UFW)
  ```bash
  ufw allow 22
  ufw allow 80
  ufw allow 443
  ufw enable
  ```
- [ ] Setup SSL certificates with Let's Encrypt
- [ ] Regular backups of MongoDB database
- [ ] Keep system packages updated

---

## 🔄 Maintenance Commands

### Backend

```bash
# View logs
journalctl -u arbrit-backend -f

# Restart service
systemctl restart arbrit-backend

# Update code
cd /var/www/arbrit-safety/backend
git pull  # if using git
systemctl restart arbrit-backend
```

### Frontend

```bash
# Update frontend
cd /var/www/arbrit-safety/frontend
# Upload new build folder
systemctl reload nginx
```

### Docker

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Update and rebuild
docker-compose down
docker-compose up -d --build
```

---

## 📱 Application URLs

After deployment:
- **Frontend:** https://www.happinotes.in
- **Backend API:** https://api.happinotes.in
- **Health Check:** https://api.happinotes.in/api/health
- **Diagnostics:** https://www.happinotes.in/diagnostics

---

## 🆘 Troubleshooting

### Backend Won't Start
```bash
# Check logs
journalctl -u arbrit-backend -n 50

# Common issues:
# - Wrong MongoDB connection string
# - Missing .env file
# - Port 8001 already in use
```

### Frontend 404 Errors
```bash
# Check Nginx config
nginx -t

# Check build folder exists
ls -la /var/www/arbrit-safety/frontend/build

# Reload Nginx
systemctl reload nginx
```

### MongoDB Connection Failed
```bash
# Test connection from VPS
pip install pymongo
python3 -c "from pymongo import MongoClient; client = MongoClient('YOUR_MONGO_URL'); print(client.server_info())"

# Check firewall/whitelist in MongoDB Atlas
```

### SSL Certificate Issues
```bash
# Renew certificates
certbot renew --dry-run

# Force renewal
certbot renew --force-renewal
```

---

## 📞 Support

For deployment issues:
- Check logs first
- Verify .env configuration
- Test MongoDB connection
- Check DNS propagation: https://dnschecker.org

---

## 🎉 Post-Deployment

1. ✅ Test login with MD/COO credentials
2. ✅ Verify all dashboards load
3. ✅ Test HR employee onboarding
4. ✅ Check diagnostics page
5. ✅ Setup regular MongoDB backups
6. ✅ Configure monitoring (optional)

---

**Deployment prepared by:** E1 Agent  
**Date:** 2025-11-20  
**Version:** Production v1.0
