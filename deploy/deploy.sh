#!/bin/bash

# HOA Management System - Production Deployment Script
# Usage: ./deploy.sh domain.com email@example.com

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check arguments
if [ $# -ne 2 ]; then
    error "Usage: $0 <domain> <email>"
    echo "Example: $0 hoa.example.com admin@example.com"
    exit 1
fi

DOMAIN=$1
EMAIL=$2
APP_DIR="/opt/hoa-management"

# Validate domain format
if [[ ! $DOMAIN =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
    error "Invalid domain format: $DOMAIN"
fi

# Validate email format
if [[ ! $EMAIL =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
    error "Invalid email format: $EMAIL"
fi

log "Starting deployment for domain: $DOMAIN"

# Check if running from correct directory
if [ ! -f "deploy.sh" ]; then
    error "This script must be run from the /opt/hoa-management directory"
fi

# Check if required files exist
REQUIRED_FILES=(
    "docker-compose.prod.yml"
    ".env"
    "deploy/nginx/hoa-management.conf"
    "backend/Dockerfile"
    "frontend/Dockerfile"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        error "Required file not found: $file"
    fi
done

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    error "Docker is not running. Please start Docker first."
fi

# Check if ports are available
if netstat -tuln | grep -q ":80 "; then
    warn "Port 80 is already in use. This might interfere with nginx."
fi

if netstat -tuln | grep -q ":443 "; then
    warn "Port 443 is already in use. This might interfere with nginx."
fi

# Backup existing configuration if it exists
if [ -f "/etc/nginx/sites-enabled/hoa-management.conf" ]; then
    log "Backing up existing nginx configuration..."
    sudo cp /etc/nginx/sites-enabled/hoa-management.conf /etc/nginx/sites-enabled/hoa-management.conf.backup.$(date +%Y%m%d_%H%M%S)
fi

# Update nginx configuration with domain
log "Configuring nginx for domain: $DOMAIN"
sudo cp deploy/nginx/hoa-management.conf /etc/nginx/sites-available/hoa-management.conf
sudo sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/hoa-management.conf

# Create symlink if it doesn't exist
if [ ! -L "/etc/nginx/sites-enabled/hoa-management.conf" ]; then
    sudo ln -s /etc/nginx/sites-available/hoa-management.conf /etc/nginx/sites-enabled/hoa-management.conf
fi

# Remove default nginx site if it exists
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    sudo rm /etc/nginx/sites-enabled/default
fi

# Test nginx configuration
log "Testing nginx configuration..."
if ! sudo nginx -t; then
    error "Nginx configuration test failed. Please check the configuration."
fi

# Update environment file with domain
log "Updating environment configuration..."
sed -i "s/DOMAIN=.*/DOMAIN=$DOMAIN/" .env

# Generate strong JWT secret if not already set
if grep -q "your-super-secret-jwt-key-change-this-in-production" .env; then
    log "Generating secure JWT secret..."
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
fi

# Generate session secret if not already set
if grep -q "your-session-secret-change-this-in-production" .env; then
    log "Generating secure session secret..."
    SESSION_SECRET=$(openssl rand -base64 32)
    sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env
fi

# Create necessary directories
log "Creating necessary directories..."
sudo mkdir -p /var/log/nginx
sudo mkdir -p /var/log/hoa-management
sudo chown $USER:$USER /var/log/hoa-management

# Create self-signed certificate for default server block
if [ ! -f "/etc/ssl/certs/nginx-selfsigned.crt" ]; then
    log "Creating self-signed certificate for default server..."
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/private/nginx-selfsigned.key \
        -out /etc/ssl/certs/nginx-selfsigned.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
fi

# Start nginx
log "Starting nginx..."
sudo systemctl enable nginx
sudo systemctl start nginx

# Wait for nginx to start
sleep 5

# Build and start application containers
log "Building and starting application containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Wait for containers to start
log "Waiting for containers to start..."
sleep 30

# Check if containers are running
if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    error "Containers failed to start. Check logs with: docker-compose -f docker-compose.prod.yml logs"
fi

# Test backend health
log "Testing backend health..."
for i in {1..10}; do
    if curl -f -s http://localhost:3001/api/health >/dev/null; then
        log "Backend is healthy"
        break
    fi
    if [ $i -eq 10 ]; then
        error "Backend health check failed after 10 attempts"
    fi
    sleep 5
done

# Test frontend
log "Testing frontend..."
for i in {1..10}; do
    if curl -f -s http://localhost:3000 >/dev/null; then
        log "Frontend is responding"
        break
    fi
    if [ $i -eq 10 ]; then
        error "Frontend health check failed after 10 attempts"
    fi
    sleep 5
done

# Reload nginx to pick up the application
sudo systemctl reload nginx

# Test HTTP access
log "Testing HTTP access..."
if curl -f -s http://$DOMAIN >/dev/null; then
    log "HTTP access successful"
else
    warn "HTTP access test failed. This might be normal if DNS is not yet propagated."
fi

# Obtain SSL certificate
log "Obtaining SSL certificate from Let's Encrypt..."
if sudo certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive --redirect; then
    log "SSL certificate obtained successfully"
else
    warn "SSL certificate generation failed. You may need to:"
    echo "  1. Ensure DNS is properly configured"
    echo "  2. Check firewall settings"
    echo "  3. Run certbot manually: sudo certbot --nginx -d $DOMAIN"
fi

# Test HTTPS access
log "Testing HTTPS access..."
sleep 10
if curl -f -s https://$DOMAIN >/dev/null; then
    log "HTTPS access successful"
else
    warn "HTTPS access test failed. SSL certificate might still be propagating."
fi

# Enable and start systemd service
log "Configuring systemd service..."
sudo systemctl daemon-reload
sudo systemctl enable hoa-management
sudo systemctl start hoa-management

# Setup log rotation
log "Configuring log rotation..."
sudo tee /etc/logrotate.d/hoa-management > /dev/null <<EOF
/var/log/hoa-management/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        docker-compose -f $APP_DIR/docker-compose.prod.yml restart >/dev/null 2>&1 || true
    endscript
}

/var/log/nginx/hoa-management-*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx >/dev/null 2>&1 || true
    endscript
}
EOF

# Create monitoring script
log "Setting up monitoring..."
tee /opt/hoa-management/monitor.sh > /dev/null <<'EOF'
#!/bin/bash

# HOA Management System Monitoring Script

LOG_FILE="/var/log/hoa-management/monitor.log"
APP_DIR="/opt/hoa-management"

echo "$(date): Starting system monitoring..." >> $LOG_FILE

# Check container health
if ! docker-compose -f $APP_DIR/docker-compose.prod.yml ps | grep -q "Up"; then
    echo "$(date): ERROR - Containers are not running" >> $LOG_FILE
    # Restart containers
    docker-compose -f $APP_DIR/docker-compose.prod.yml restart >> $LOG_FILE 2>&1
fi

# Check backend API
if ! curl -f -s http://localhost:3001/api/health > /dev/null; then
    echo "$(date): ERROR - Backend API not responding" >> $LOG_FILE
    # Restart backend container
    docker-compose -f $APP_DIR/docker-compose.prod.yml restart backend >> $LOG_FILE 2>&1
fi

# Check frontend
if ! curl -f -s http://localhost:3000 > /dev/null; then
    echo "$(date): ERROR - Frontend not responding" >> $LOG_FILE
    # Restart frontend container
    docker-compose -f $APP_DIR/docker-compose.prod.yml restart frontend >> $LOG_FILE 2>&1
fi

# Check nginx
if ! systemctl is-active --quiet nginx; then
    echo "$(date): ERROR - Nginx is not running" >> $LOG_FILE
    sudo systemctl restart nginx >> $LOG_FILE 2>&1
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    echo "$(date): WARNING - Disk usage is at ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEMORY_USAGE -gt 85 ]; then
    echo "$(date): WARNING - Memory usage is at ${MEMORY_USAGE}%" >> $LOG_FILE
fi

echo "$(date): Monitoring check completed" >> $LOG_FILE
EOF

chmod +x /opt/hoa-management/monitor.sh

# Setup cron job for monitoring
(crontab -l 2>/dev/null | grep -v "monitor.sh"; echo "*/5 * * * * /opt/hoa-management/monitor.sh") | crontab -

# Final health check
log "Performing final health check..."
sleep 10

# Check all services
SERVICES_OK=true

if ! systemctl is-active --quiet nginx; then
    error "Nginx is not running"
    SERVICES_OK=false
fi

if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    error "Application containers are not running"
    SERVICES_OK=false
fi

if ! curl -f -s http://localhost:3001/api/health >/dev/null; then
    error "Backend API is not responding"
    SERVICES_OK=false
fi

if ! curl -f -s http://localhost:3000 >/dev/null; then
    error "Frontend is not responding"
    SERVICES_OK=false
fi

if [ "$SERVICES_OK" = true ]; then
    log "All services are running successfully!"
else
    error "Some services are not running properly. Check the logs for details."
fi

# Display deployment summary
echo ""
echo -e "${BLUE}=== Deployment Summary ===${NC}"
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "Application Directory: $APP_DIR"
echo ""
echo -e "${BLUE}=== Service Status ===${NC}"
echo "Nginx: $(systemctl is-active nginx)"
echo "Docker Containers: $(docker-compose -f docker-compose.prod.yml ps --services | wc -l) running"
echo ""
echo -e "${BLUE}=== Access URLs ===${NC}"
echo "Frontend: https://$DOMAIN"
echo "API: https://$DOMAIN/api"
echo "Public Documents: https://$DOMAIN/public"
echo ""
echo -e "${BLUE}=== Log Locations ===${NC}"
echo "Application Logs: docker-compose -f docker-compose.prod.yml logs"
echo "Nginx Access Log: /var/log/nginx/hoa-management-access.log"
echo "Nginx Error Log: /var/log/nginx/hoa-management-error.log"
echo "System Log: /var/log/hoa-management/"
echo ""
echo -e "${BLUE}=== Management Commands ===${NC}"
echo "Restart Application: sudo systemctl restart hoa-management"
echo "View Logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "Update SSL: sudo certbot renew"
echo "Backup: ./backup.sh"
echo ""
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Your HOA Management System is now available at: https://$DOMAIN${NC}"