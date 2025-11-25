#!/bin/bash

# ============================================
# AWS EC2 Setup Script for Arbrit Safety
# Run this script on your EC2 instance after first login
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# Functions
# ============================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# ============================================
# Main Setup
# ============================================

main() {
    log_info "Starting AWS EC2 Setup for Arbrit Safety Training System"
    echo ""
    
    # Check if running as root or with sudo
    if [ "$EUID" -ne 0 ]; then 
        log_error "Please run as root or with sudo"
        exit 1
    fi
    
    # ============================================
    # Step 1: Update System
    # ============================================
    log_step "Step 1: Updating system packages..."
    apt update && apt upgrade -y
    
    # ============================================
    # Step 2: Install Dependencies
    # ============================================
    log_step "Step 2: Installing system dependencies..."
    apt install -y \
        software-properties-common \
        build-essential \
        curl \
        wget \
        git \
        unzip \
        vim \
        htop \
        net-tools
    
    # ============================================
    # Step 3: Install Python 3.11
    # ============================================
    log_step "Step 3: Installing Python 3.11..."
    add-apt-repository ppa:deadsnakes/ppa -y
    apt update
    apt install -y python3.11 python3.11-venv python3.11-dev python3-pip
    
    # Set Python 3.11 as default
    update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1
    
    python3 --version
    
    # ============================================
    # Step 4: Install Node.js (optional, for frontend builds)
    # ============================================
    log_step "Step 4: Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    
    node --version
    npm --version
    
    # ============================================
    # Step 5: Install Nginx
    # ============================================
    log_step "Step 5: Installing Nginx..."
    apt install -y nginx
    
    # Start and enable Nginx
    systemctl start nginx
    systemctl enable nginx
    
    nginx -v
    
    # ============================================
    # Step 6: Install Certbot (Let's Encrypt)
    # ============================================
    log_step "Step 6: Installing Certbot for SSL..."
    apt install -y certbot python3-certbot-nginx
    
    certbot --version
    
    # ============================================
    # Step 7: Setup UFW Firewall
    # ============================================
    log_step "Step 7: Configuring firewall..."
    ufw --force enable
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw status
    
    # ============================================
    # Step 8: Create Application Directory
    # ============================================
    log_step "Step 8: Creating application directory..."
    mkdir -p /var/www/arbrit-safety
    chown -R ubuntu:ubuntu /var/www/arbrit-safety
    
    # ============================================
    # Step 9: Install Docker (optional)
    # ============================================
    log_step "Step 9: Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    
    # Add ubuntu user to docker group
    usermod -aG docker ubuntu
    
    # Install Docker Compose
    apt install -y docker-compose
    
    docker --version
    docker-compose --version
    
    # ============================================
    # Step 10: Configure System Limits
    # ============================================
    log_step "Step 10: Configuring system limits..."
    
    cat >> /etc/security/limits.conf << EOF

# Arbrit Safety - Increased limits
* soft nofile 65536
* hard nofile 65536
* soft nproc 65536
* hard nproc 65536
EOF
    
    # ============================================
    # Step 11: Setup Swap (for small instances)
    # ============================================
    log_step "Step 11: Setting up swap space..."
    
    if [ ! -f /swapfile ]; then
        fallocate -l 2G /swapfile
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
        log_info "Swap space created (2GB)"
    else
        log_info "Swap file already exists"
    fi
    
    # ============================================
    # Step 12: Configure Automatic Security Updates
    # ============================================
    log_step "Step 12: Enabling automatic security updates..."
    apt install -y unattended-upgrades
    dpkg-reconfigure -plow unattended-upgrades
    
    # ============================================
    # Step 13: Install Monitoring Tools
    # ============================================
    log_step "Step 13: Installing monitoring tools..."
    apt install -y \
        htop \
        iotop \
        nethogs \
        fail2ban
    
    # Configure fail2ban
    systemctl start fail2ban
    systemctl enable fail2ban
    
    # ============================================
    # Step 14: Setup Log Rotation
    # ============================================
    log_step "Step 14: Configuring log rotation..."
    
    cat > /etc/logrotate.d/arbrit-safety << EOF
/var/log/arbrit-*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
}
EOF
    
    # ============================================
    # Step 15: Create Deployment Script
    # ============================================
    log_step "Step 15: Creating deployment helper script..."
    
    cat > /usr/local/bin/arbrit-deploy << 'EOF'
#!/bin/bash
# Quick deployment helper

echo "Arbrit Safety - Deployment Helper"
echo "=================================="
echo ""
echo "1. Update backend code"
echo "2. Restart backend service"
echo "3. Update frontend build"
echo "4. Restart nginx"
echo "5. View backend logs"
echo "6. View nginx logs"
echo "7. Check service status"
echo "8. Run health check"
echo ""
read -p "Select option (1-8): " choice

case $choice in
    1)
        echo "Updating backend code..."
        cd /var/www/arbrit-safety/backend
        # Add your update commands here
        ;;
    2)
        echo "Restarting backend service..."
        sudo systemctl restart arbrit-backend
        sudo systemctl status arbrit-backend
        ;;
    3)
        echo "Updating frontend..."
        # Add your frontend update commands here
        ;;
    4)
        echo "Restarting nginx..."
        sudo systemctl restart nginx
        sudo systemctl status nginx
        ;;
    5)
        echo "Backend logs (last 100 lines):"
        sudo journalctl -u arbrit-backend -n 100 --no-pager
        ;;
    6)
        echo "Nginx error logs:"
        sudo tail -f /var/log/nginx/error.log
        ;;
    7)
        echo "Service Status:"
        sudo systemctl status arbrit-backend nginx
        ;;
    8)
        echo "Running health checks..."
        curl -f http://localhost:8001/api/health && echo "✓ Backend healthy"
        curl -f http://localhost/ && echo "✓ Frontend healthy"
        ;;
    *)
        echo "Invalid option"
        ;;
esac
EOF
    
    chmod +x /usr/local/bin/arbrit-deploy
    
    # ============================================
    # Completion
    # ============================================
    echo ""
    echo "=========================================="
    log_info "EC2 Setup completed successfully!"
    echo "=========================================="
    echo ""
    log_info "Next Steps:"
    echo "1. Upload your application files to /var/www/arbrit-safety"
    echo "2. Configure backend (.env file)"
    echo "3. Setup Python virtual environment"
    echo "4. Create systemd service for backend"
    echo "5. Configure Nginx"
    echo "6. Setup SSL with: sudo certbot --nginx -d yourdomain.com"
    echo ""
    log_info "Helpful commands:"
    echo "  - arbrit-deploy : Quick deployment helper"
    echo "  - htop : System monitor"
    echo "  - fail2ban-client status : Check fail2ban status"
    echo ""
    log_warn "Please logout and login again for docker permissions to take effect"
    echo ""
}

# ============================================
# Script Entry Point
# ============================================

main

exit 0

