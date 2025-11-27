#!/bin/bash

# ============================================
# AWS EC2 Setup Script for Arbrit Safety
# Amazon Linux 2023 Version
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
    log_info "Amazon Linux 2023 Version"
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
    yum update -y
    
    # ============================================
    # Step 2: Install Docker and Git
    # ============================================
    log_step "Step 2: Installing Docker and Git..."
    yum install -y docker git
    
    # Start Docker service
    systemctl start docker
    
    # Enable Docker to start on boot
    systemctl enable docker
    
    # Add ec2-user to docker group
    usermod -a -G docker ec2-user
    
    docker --version
    git --version
    
    log_info "Docker installed and configured successfully"
    
    # ============================================
    # Step 3: Install Additional Tools
    # ============================================
    log_step "Step 3: Installing additional tools..."
    yum install -y \
        curl \
        wget \
        unzip \
        vim \
        htop \
        net-tools \
        tar \
        gzip
    
    # ============================================
    # Step 4: Install Docker Compose
    # ============================================
    log_step "Step 4: Installing Docker Compose..."
    
    # Get latest version
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    
    # Download and install
    curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Create symlink
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    docker-compose --version
    
    # ============================================
    # Step 5: Create Application Directory
    # ============================================
    log_step "Step 5: Creating application directory..."
    mkdir -p /opt/arbrit-safety
    chown -R ec2-user:ec2-user /opt/arbrit-safety
    
    # ============================================
    # Step 6: Configure System Limits
    # ============================================
    log_step "Step 6: Configuring system limits..."
    
    cat >> /etc/security/limits.conf << EOF

# Arbrit Safety - Increased limits
* soft nofile 65536
* hard nofile 65536
* soft nproc 65536
* hard nproc 65536
EOF
    
    # ============================================
    # Step 7: Setup Swap (for small instances)
    # ============================================
    log_step "Step 7: Setting up swap space..."
    
    if [ ! -f /swapfile ]; then
        dd if=/dev/zero of=/swapfile bs=1M count=2048
        chmod 600 /swapfile
        mkswap /swapfile
        swapon /swapfile
        echo '/swapfile none swap sw 0 0' >> /etc/fstab
        log_info "Swap space created (2GB)"
    else
        log_info "Swap file already exists"
    fi
    
    # ============================================
    # Step 8: Configure Firewall
    # ============================================
    log_step "Step 8: Configuring firewall..."
    
    # Note: Amazon Linux uses firewalld, but we typically use Security Groups instead
    log_info "Configure ports via AWS Security Groups:"
    log_info "  - Port 22: SSH"
    log_info "  - Port 80: HTTP"
    log_info "  - Port 443: HTTPS"
    log_info "  - Port 8001: Backend API"
    
    # ============================================
    # Step 9: Install Monitoring Tools
    # ============================================
    log_step "Step 9: Installing monitoring tools..."
    yum install -y htop iotop
    
    # ============================================
    # Step 10: Setup Log Rotation
    # ============================================
    log_step "Step 10: Configuring log rotation..."
    
    cat > /etc/logrotate.d/arbrit-safety << EOF
/var/log/arbrit-*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ec2-user ec2-user
    sharedscripts
}
EOF
    
    # ============================================
    # Step 11: Create Deployment Helper Script
    # ============================================
    log_step "Step 11: Creating deployment helper script..."
    
    cat > /usr/local/bin/arbrit-deploy << 'EOFSCRIPT'
#!/bin/bash
# Quick deployment helper for Arbrit Safety

echo "╔════════════════════════════════════════╗"
echo "║   Arbrit Safety - Deployment Helper   ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "1. View Docker containers"
echo "2. View Docker logs"
echo "3. Restart all services"
echo "4. Stop all services"
echo "5. Start all services"
echo "6. Rebuild and restart"
echo "7. Check disk space"
echo "8. Check memory usage"
echo "9. View system status"
echo "0. Exit"
echo ""
read -p "Select option (0-9): " choice

cd /opt/arbrit-safety

case $choice in
    1)
        echo "Docker containers:"
        docker ps -a
        ;;
    2)
        echo "Which service? (backend/frontend):"
        read service
        docker-compose logs -f --tail=100 $service
        ;;
    3)
        echo "Restarting all services..."
        docker-compose restart
        docker-compose ps
        ;;
    4)
        echo "Stopping all services..."
        docker-compose down
        ;;
    5)
        echo "Starting all services..."
        docker-compose up -d
        docker-compose ps
        ;;
    6)
        echo "Rebuilding and restarting..."
        docker-compose down
        docker-compose up -d --build
        docker-compose ps
        ;;
    7)
        echo "Disk space:"
        df -h
        echo ""
        echo "Docker disk usage:"
        docker system df
        ;;
    8)
        echo "Memory usage:"
        free -h
        ;;
    9)
        echo "System status:"
        uptime
        echo ""
        docker-compose ps
        ;;
    0)
        echo "Goodbye!"
        exit 0
        ;;
    *)
        echo "Invalid option"
        ;;
esac
EOFSCRIPT
    
    chmod +x /usr/local/bin/arbrit-deploy
    
    # ============================================
    # Step 12: Create Environment Template
    # ============================================
    log_step "Step 12: Creating environment template..."
    
    cat > /opt/arbrit-safety/.env.template << 'EOF'
# MongoDB Configuration
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=arbrit-workdesk

# Security
JWT_SECRET_KEY=your-super-secret-key-here

# CORS Configuration
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Application Settings
PORT=8001
EOF
    
    chown ec2-user:ec2-user /opt/arbrit-safety/.env.template
    
    # ============================================
    # Completion
    # ============================================
    echo ""
    echo "=========================================="
    log_info "EC2 Setup completed successfully!"
    echo "=========================================="
    echo ""
    log_info "Next Steps:"
    echo "1. Logout and login again for Docker permissions to take effect:"
    echo "   exit"
    echo ""
    echo "2. Upload your application files to /opt/arbrit-safety:"
    echo "   - docker-compose.yml"
    echo "   - Dockerfile.backend"
    echo "   - Dockerfile.frontend"
    echo "   - backend/ directory"
    echo "   - frontend/ directory"
    echo ""
    echo "3. Create .env file from template:"
    echo "   cd /opt/arbrit-safety"
    echo "   cp .env.template backend/.env"
    echo "   nano backend/.env  # Edit with your actual values"
    echo ""
    echo "4. Start the application:"
    echo "   docker-compose up -d"
    echo ""
    log_info "Helpful commands:"
    echo "  - arbrit-deploy          : Quick deployment helper menu"
    echo "  - docker ps              : View running containers"
    echo "  - docker-compose logs -f : View live logs"
    echo "  - docker-compose ps      : View service status"
    echo "  - htop                   : System monitor"
    echo ""
    log_warn "Please logout and login again for docker permissions to take effect!"
    echo ""
}

# ============================================
# Script Entry Point
# ============================================

main

exit 0



