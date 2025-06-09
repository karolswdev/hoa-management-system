#!/bin/bash

# HOA Management System - Server Setup Script
# For Ubuntu 24.04 LTS on Linode
# Usage: curl -fsSL https://raw.githubusercontent.com/your-repo/hoa-management/main/deploy/setup-server.sh | bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    error "This script should not be run as root. Please run as a regular user with sudo privileges."
fi

# Check if sudo is available
if ! command -v sudo &> /dev/null; then
    error "sudo is required but not installed. Please install sudo first."
fi

log "Starting HOA Management System server setup on Ubuntu 24.04..."

# Update system packages
log "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
log "Installing essential packages..."
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    nginx \
    certbot \
    python3-certbot-nginx \
    htop \
    tree \
    vim \
    fail2ban

# Install Docker
log "Installing Docker..."
if ! command -v docker &> /dev/null; then
    # Add Docker's official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Add Docker repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    log "Docker installed successfully"
else
    log "Docker is already installed"
fi

# Install Docker Compose (standalone)
log "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    log "Docker Compose installed successfully"
else
    log "Docker Compose is already installed"
fi

# Configure firewall
log "Configuring UFW firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

log "Firewall configured successfully"

# Configure fail2ban
log "Configuring fail2ban..."
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Create custom fail2ban configuration
sudo tee /etc/fail2ban/jail.d/hoa-management.conf > /dev/null <<EOF
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5
bantime = 3600

[nginx-noscript]
enabled = true
port = http,https
filter = nginx-noscript
logpath = /var/log/nginx/access.log
maxretry = 6
bantime = 86400
findtime = 60

[nginx-badbots]
enabled = true
port = http,https
filter = nginx-badbots
logpath = /var/log/nginx/access.log
maxretry = 2
bantime = 86400
EOF

sudo systemctl enable fail2ban
sudo systemctl start fail2ban

log "fail2ban configured successfully"

# Create application directory
log "Creating application directory..."
sudo mkdir -p /opt/hoa-management
sudo chown $USER:$USER /opt/hoa-management

# Create backup directory
log "Creating backup directory..."
sudo mkdir -p /opt/backups
sudo chown $USER:$USER /opt/backups

# Create log directory
log "Creating log directory..."
sudo mkdir -p /var/log/hoa-management
sudo chown $USER:$USER /var/log/hoa-management

# Configure log rotation
log "Configuring log rotation..."
sudo tee /etc/logrotate.d/hoa-management > /dev/null <<EOF
/var/log/hoa-management/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        systemctl reload hoa-management || true
    endscript
}
EOF

# Create systemd service for the application
log "Creating systemd service..."
sudo tee /etc/systemd/system/hoa-management.service > /dev/null <<EOF
[Unit]
Description=HOA Management System
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/hoa-management
ExecStart=/usr/local/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0
User=$USER
Group=$USER

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload

# Configure automatic security updates
log "Configuring automatic security updates..."
sudo apt install -y unattended-upgrades
echo 'Unattended-Upgrade::Automatic-Reboot "false";' | sudo tee -a /etc/apt/apt.conf.d/50unattended-upgrades

# Create deployment script
log "Creating deployment script..."
tee /opt/hoa-management/deploy.sh > /dev/null <<'EOF'
#!/bin/bash

# HOA Management System Deployment Script
# Usage: ./deploy.sh domain.com email@example.com

set -e

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "Usage: $0 <domain> <email>"
    echo "Example: $0 hoa.example.com admin@example.com"
    exit 1
fi

echo "Deploying HOA Management System for domain: $DOMAIN"

# Update nginx configuration with domain
sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/hoa-management.conf

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Start application
sudo systemctl enable hoa-management
sudo systemctl start hoa-management

# Wait for application to start
sleep 30

# Obtain SSL certificate
sudo certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive

echo "Deployment completed successfully!"
echo "Your application is available at: https://$DOMAIN"
EOF

chmod +x /opt/hoa-management/deploy.sh

# Create backup script
log "Creating backup script..."
tee /opt/hoa-management/backup.sh > /dev/null <<'EOF'
#!/bin/bash

# HOA Management System Backup Script

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/opt/hoa-management"

echo "Starting backup process..."

# Create backup directory for this date
mkdir -p "$BACKUP_DIR/$DATE"

# Backup database
echo "Backing up database..."
docker-compose -f $APP_DIR/docker-compose.prod.yml exec -T backend cp /usr/src/app/backend/database/hoa.db /usr/src/app/backend/database/hoa.db.backup
docker cp $(docker-compose -f $APP_DIR/docker-compose.prod.yml ps -q backend):/usr/src/app/backend/database/hoa.db.backup "$BACKUP_DIR/$DATE/database.db"

# Backup uploads
echo "Backing up uploads..."
tar -czf "$BACKUP_DIR/$DATE/uploads.tar.gz" -C "$APP_DIR" backend/uploads/

# Backup configuration
echo "Backing up configuration..."
cp "$APP_DIR/.env" "$BACKUP_DIR/$DATE/"
cp "/etc/nginx/sites-available/hoa-management.conf" "$BACKUP_DIR/$DATE/"

# Create archive of entire backup
echo "Creating backup archive..."
tar -czf "$BACKUP_DIR/hoa-backup-$DATE.tar.gz" -C "$BACKUP_DIR" "$DATE"

# Remove temporary directory
rm -rf "$BACKUP_DIR/$DATE"

# Keep only last 7 backups
find "$BACKUP_DIR" -name "hoa-backup-*.tar.gz" -type f -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/hoa-backup-$DATE.tar.gz"
EOF

chmod +x /opt/hoa-management/backup.sh

# Setup cron job for backups
log "Setting up automated backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/hoa-management/backup.sh >> /var/log/hoa-management/backup.log 2>&1") | crontab -

# Create health check script
log "Creating health check script..."
tee /opt/hoa-management/health-check.sh > /dev/null <<'EOF'
#!/bin/bash

# HOA Management System Health Check Script

APP_DIR="/opt/hoa-management"
LOG_FILE="/var/log/hoa-management/health-check.log"

echo "$(date): Starting health check..." >> $LOG_FILE

# Check if containers are running
if ! docker-compose -f $APP_DIR/docker-compose.prod.yml ps | grep -q "Up"; then
    echo "$(date): ERROR - Containers are not running" >> $LOG_FILE
    # Restart the service
    sudo systemctl restart hoa-management
    echo "$(date): Restarted hoa-management service" >> $LOG_FILE
fi

# Check if application is responding
if ! curl -f -s http://localhost:3001/api/health > /dev/null; then
    echo "$(date): ERROR - Backend API not responding" >> $LOG_FILE
    # Restart the service
    sudo systemctl restart hoa-management
    echo "$(date): Restarted hoa-management service" >> $LOG_FILE
fi

echo "$(date): Health check completed" >> $LOG_FILE
EOF

chmod +x /opt/hoa-management/health-check.sh

# Setup cron job for health checks
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/hoa-management/health-check.sh") | crontab -

# Configure SSH security (if not already done)
log "Configuring SSH security..."
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config

# Restart SSH service
sudo systemctl restart ssh

# Display system information
log "Server setup completed successfully!"
echo ""
echo -e "${BLUE}=== System Information ===${NC}"
echo "OS: $(lsb_release -d | cut -f2)"
echo "Kernel: $(uname -r)"
echo "Docker: $(docker --version)"
echo "Docker Compose: $(docker-compose --version)"
echo "Nginx: $(nginx -v 2>&1)"
echo ""
echo -e "${BLUE}=== Next Steps ===${NC}"
echo "1. Upload your application code to /opt/hoa-management/"
echo "2. Configure your .env file"
echo "3. Run the deployment script: ./deploy.sh your-domain.com your-email@example.com"
echo ""
echo -e "${BLUE}=== Important Notes ===${NC}"
echo "- You need to log out and log back in for Docker group membership to take effect"
echo "- Make sure your domain's A record points to this server's IP address"
echo "- The firewall is configured to allow SSH, HTTP, and HTTPS traffic only"
echo "- Automatic backups are scheduled daily at 2:00 AM"
echo "- Health checks run every 5 minutes"
echo ""
echo -e "${GREEN}Server setup completed successfully!${NC}"