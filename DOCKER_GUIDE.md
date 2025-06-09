# Docker Setup Guide - HOA Management System

This guide explains how to run the HOA Management System using Docker containers.

## 🐳 **Overview**

The application is containerized with the following services:
- **Backend**: Node.js API server (Port 3001)
- **Frontend**: React application served by Nginx (Port 3000)
- **Test Runner**: Automated testing service

## 📋 **Prerequisites**

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 2GB available RAM
- Ports 3000 and 3001 available on your host machine

## 🚀 **Quick Start**

### **1. Clone and Setup**
```bash
git clone <repository-url>
cd hoa-management-system
```

### **2. Environment Configuration**
Create a `.env` file in the project root:
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
# Backend Configuration
NODE_ENV=production
APP_PORT=3001
PORT=3001

# Frontend Configuration
FRONTEND_PORT=3000

# Database
DB_PATH=/usr/src/app/backend/database/hoa.db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE_MB=10
```

### **3. Build and Run**
```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

### **4. Access the Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Public Page**: http://localhost:3000/public

## 🛠️ **Docker Commands**

### **Basic Operations**
```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build

# View logs
docker-compose logs

# View logs for specific service
docker-compose logs frontend
docker-compose logs backend
```

### **Development Commands**
```bash
# Run tests
docker-compose run test-runner

# Access backend container shell
docker-compose exec backend sh

# Access frontend container shell
docker-compose exec frontend sh

# Restart specific service
docker-compose restart frontend
docker-compose restart backend
```

### **Cleanup Commands**
```bash
# Stop and remove containers
docker-compose down

# Remove containers and volumes
docker-compose down -v

# Remove containers, volumes, and images
docker-compose down -v --rmi all

# Clean up unused Docker resources
docker system prune -a
```

## 📁 **Service Details**

### **Backend Service**
- **Container**: `hoa_backend_api`
- **Port**: 3001
- **Technology**: Node.js + Express
- **Database**: SQLite (persistent volume)
- **File Uploads**: Persistent volume mounted

**Volumes:**
- `./backend/database` → `/usr/src/app/backend/database`
- `./backend/uploads` → `/usr/src/app/backend/uploads`

### **Frontend Service**
- **Container**: `hoa_frontend_web`
- **Port**: 3000
- **Technology**: React + Vite + Nginx
- **Build**: Multi-stage Docker build
- **Serving**: Nginx with optimized configuration

**Features:**
- Production-optimized build
- Gzip compression enabled
- Client-side routing support
- Security headers configured
- Static asset caching

### **Test Runner Service**
- **Container**: `hoa_test_runner`
- **Purpose**: Automated testing
- **Command**: `npm run test:debugging`
- **Dependencies**: Requires backend service

## 🔧 **Configuration Options**

### **Environment Variables**

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_PORT` | 3001 | Backend API port |
| `FRONTEND_PORT` | 3000 | Frontend web port |
| `NODE_ENV` | development | Node.js environment |
| `DB_PATH` | `/usr/src/app/backend/database/hoa.db` | Database file path |
| `JWT_SECRET` | (required) | JWT signing secret |
| `MAX_FILE_SIZE_MB` | 10 | Maximum upload file size |

### **Port Customization**
```bash
# Use different ports
FRONTEND_PORT=8080 APP_PORT=8001 docker-compose up
```

### **Development Mode**
For development with live reloading, uncomment the volume mounts in `docker-compose.yml`:
```yaml
volumes:
  - ./backend:/usr/src/app/backend
  - /usr/src/app/backend/node_modules
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### **Port Already in Use**
```bash
# Check what's using the port
lsof -i :3000
lsof -i :3001

# Kill the process or change ports in .env
FRONTEND_PORT=8080 APP_PORT=8001 docker-compose up
```

#### **Permission Issues**
```bash
# Fix file permissions
sudo chown -R $USER:$USER ./backend/database
sudo chown -R $USER:$USER ./backend/uploads
```

#### **Build Failures**
```bash
# Clean build cache
docker-compose build --no-cache

# Remove old images
docker image prune -a
```

#### **Database Issues**
```bash
# Reset database (WARNING: This deletes all data)
rm -rf ./backend/database/hoa.db
docker-compose up --build
```

### **Logs and Debugging**
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Check container status
docker-compose ps

# Inspect container
docker-compose exec backend env
```

## 🔒 **Security Considerations**

### **Production Deployment**
- Change default JWT secret
- Use environment-specific `.env` files
- Enable HTTPS with reverse proxy
- Implement proper backup strategy
- Monitor container resource usage

### **Network Security**
- Services communicate through internal Docker network
- Only necessary ports are exposed to host
- Nginx serves frontend with security headers

## 📊 **Monitoring**

### **Health Checks**
```bash
# Check if services are responding
curl http://localhost:3001/api
curl http://localhost:3000/health
```

### **Resource Usage**
```bash
# Monitor container resources
docker stats

# View container details
docker-compose top
```

## 🔄 **Updates and Maintenance**

### **Updating the Application**
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up --build
```

### **Database Backups**
```bash
# Backup database
cp ./backend/database/hoa.db ./backend/database/hoa.db.backup

# Restore database
cp ./backend/database/hoa.db.backup ./backend/database/hoa.db
docker-compose restart backend
```

### **File Upload Backups**
```bash
# Backup uploads
tar -czf uploads-backup.tar.gz ./backend/uploads/

# Restore uploads
tar -xzf uploads-backup.tar.gz
```

## 🆘 **Support**

For issues with the Docker setup:
1. Check the logs: `docker-compose logs`
2. Verify environment variables in `.env`
3. Ensure ports are available
4. Try rebuilding: `docker-compose up --build`
5. Check Docker and Docker Compose versions

---

*This Docker setup provides a production-ready containerized environment for the HOA Management System with optimized builds, persistent data storage, and comprehensive configuration options.*