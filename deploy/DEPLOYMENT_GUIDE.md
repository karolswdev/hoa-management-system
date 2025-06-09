# Linode Ubuntu 24.04 Deployment Guide - HOA Management System

This guide provides step-by-step instructions for deploying the HOA Management System on a Linode Ubuntu 24.04 server using Docker.

## 🎯 **Deployment Overview**

**Architecture:**
- **Reverse Proxy**: Nginx (handles SSL, routing, static files)
- **Application**: Docker Compose (frontend + backend containers)
- **Database**: SQLite (persistent volume)
- **SSL**: Let's Encrypt via Certbot
- **Process Management**: systemd services

**Server Requirements:**
- Ubuntu 24.04 LTS
- Minimum 2GB RAM, 2 CPU cores
- 20GB+ storage
- Domain name pointing to server IP
- Ports 80, 443, 22 open

## 📋 **Pre-Deployment Checklist**

- [ ] Linode server created with Ubuntu 24.04
- [ ] Domain name configured (A record pointing to server IP)
- [ ] SSH access configured
- [ ] Server firewall configured
- [ ] SSL certificate requirements understood

## 🚀 **Deployment Steps**

### **Step 1: Initial Server Setup**

```bash
# Connect to your server
ssh root@your-server-ip

# Run the server setup script
curl -fsSL https://raw.githubusercontent.com/your-repo/hoa-management/main/deploy/setup-server.sh | bash
```

### **Step 2: Deploy Application**

```bash
# Run the deployment script
./deploy/deploy.sh your-domain.com your-email@example.com
```

### **Step 3: Configure SSL**

```bash
# SSL will be automatically configured during deployment
# Verify SSL is working
curl -I https://your-domain.com
```

### **Step 4: Verify Deployment**

```bash
# Check all services are running
sudo systemctl status hoa-management
sudo docker-compose ps

# Test application endpoints
curl https://your-domain.com/api/health
curl https://your-domain.com/
```

## 🔧 **Manual Deployment (Alternative)**

If you prefer manual deployment, follow these steps:

### **1. Server Preparation**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git ufw nginx certbot python3-certbot-nginx

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### **2. Firewall Configuration**
```bash
# Configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

### **3. Application Deployment**
```bash
# Create application directory
sudo mkdir -p /opt/hoa-management
sudo chown $USER:$USER /opt/hoa-management
cd /opt/hoa-management

# Clone repository (or upload files via SFTP)
git clone https://github.com/your-repo/hoa-management.git .

# Create production environment file
cp deploy/production.env .env
# Edit .env with your production values

# Build and start containers
docker-compose -f docker-compose.prod.yml up -d --build
```

### **4. Nginx Configuration**
```bash
# Copy nginx configuration
sudo cp deploy/nginx/hoa-management.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/hoa-management.conf /etc/nginx/sites-enabled/

# Update domain in nginx config
sudo sed -i 's/your-domain.com/actual-domain.com/g' /etc/nginx/sites-enabled/hoa-management.conf

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

### **5. SSL Certificate**
```bash
# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

## 📁 **File Structure on Server**

```
/opt/hoa-management/
├── backend/
├── frontend/
├── deploy/
├── docker-compose.prod.yml
├── .env
├── nginx.conf
└── logs/
    ├── nginx/
    ├── backend/
    └── frontend/
```

## 🔍 **Monitoring and Maintenance**

### **Service Management**
```bash
# Check application status
sudo systemctl status hoa-management
docker-compose ps

# View logs
docker-compose logs -f
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Restart services
sudo systemctl restart hoa-management
docker-compose restart
```

### **Updates**
```bash
# Update application
cd /opt/hoa-management
git pull origin main
docker-compose down
docker-compose up -d --build

# Update system packages
sudo apt update && sudo apt upgrade -y
```

### **Backups**
```bash
# Backup database
docker-compose exec backend cp /usr/src/app/backend/database/hoa.db /usr/src/app/backend/database/hoa.db.backup

# Backup uploads
tar -czf /opt/backups/uploads-$(date +%Y%m%d).tar.gz /opt/hoa-management/backend/uploads/

# Backup configuration
tar -czf /opt/backups/config-$(date +%Y%m%d).tar.gz /opt/hoa-management/.env /etc/nginx/sites-enabled/hoa-management.conf
```

## 🔒 **Security Considerations**

### **Server Security**
- SSH key authentication (disable password auth)
- Regular security updates
- Fail2ban for intrusion prevention
- Regular backups
- Monitor logs for suspicious activity

### **Application Security**
- Strong JWT secrets
- HTTPS only (HTTP redirects to HTTPS)
- Security headers configured in Nginx
- File upload restrictions
- Rate limiting

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Port Already in Use**
```bash
# Check what's using port 80/443
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Stop conflicting services
sudo systemctl stop apache2  # if installed
```

#### **Docker Permission Issues**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Logout and login again
```

#### **SSL Certificate Issues**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew --force-renewal
```

#### **Application Not Starting**
```bash
# Check Docker logs
docker-compose logs backend
docker-compose logs frontend

# Check system resources
free -h
df -h
```

### **Log Locations**
- Application logs: `docker-compose logs`
- Nginx logs: `/var/log/nginx/`
- System logs: `journalctl -u hoa-management`
- Docker logs: `docker logs <container-name>`

## 📞 **Support**

For deployment issues:
1. Check the troubleshooting section
2. Review logs for error messages
3. Verify all services are running
4. Check firewall and DNS configuration
5. Ensure domain is properly configured

---

*This deployment guide provides a production-ready setup for the HOA Management System on Linode Ubuntu 24.04 with Docker, Nginx, and SSL encryption.*