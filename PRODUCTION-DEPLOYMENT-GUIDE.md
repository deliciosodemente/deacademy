# 🚀 Production Deployment Guide - Digital English Academy

## Overview

This guide provides comprehensive instructions for deploying the Digital English Academy to production at **denglishacademy.com** using Docker Swarm for enhanced scalability and resilience, and incorporating Progressive Web App (PWA) features.

---

## 🏗️ Architecture Overview

### Production Stack

- **Load Balancer**: Nginx with SSL termination
- **Application**: Node.js services (scalable via Docker Swarm)
- **Database**: MongoDB replica set (Primary + Secondary)
- **Cache**: Redis cluster
- **CDN**: Nginx static asset server
- **Monitoring**: Prometheus + Grafana + Loki
- **Backup**: Automated S3 backups
- **PWA**: Progressive Web App capabilities for enhanced user experience

### Network Architecture

```
Internet → Nginx LB → App Services (Docker Swarm) → MongoDB/Redis
                   ↓
              Monitoring Stack
```

---

## 📋 Prerequisites

### System Requirements

- **OS**: Ubuntu 20.04+ or CentOS 8+
- **RAM**: Minimum 8GB (16GB recommended)
- **CPU**: 4+ cores
- **Storage**: 100GB+ SSD
- **Network**: Static IP with domain pointing to server

### Software Requirements

```bash
# Install Docker (includes Docker Compose and Docker Swarm)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Initialize Docker Swarm (if not already initialized)
sudo docker swarm init

# Install AWS CLI (for backups)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Node.js and npm (ensure Node.js >= 18.0.0)
# Follow official Node.js installation guide for your OS
```

---

## 🔧 Configuration Setup

### 1. Environment Configuration

```bash
# Copy and configure environment file in the project root
cp .env.production.example .env

# Edit with your actual values
nano .env
```

### 2. Required Environment Variables

```bash
# Domain
DOMAIN=denglishacademy.com

# Auth0
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-password
REDIS_PASSWORD=your-redis-password

# Monitoring
GRAFANA_PASSWORD=your-grafana-password

# Backup
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
BACKUP_S3_BUCKET=dea-backups
```

### 3. SSL Certificate Setup

```bash
# Create SSL directory
sudo mkdir -p /opt/dea/ssl

# Option 1: Let's Encrypt (Recommended)
# Ensure your domain points to this server before running certbot
sudo docker stack deploy -c deploy/docker-compose.production.yml --compose-file deploy/docker-compose.production.yml --with-registry-auth --prune --resolve-image always --profile ssl certbot

# After certbot runs, the certificates will be in /opt/dea/ssl/live/denglishacademy.com/

# Option 2: Upload existing certificates
sudo cp your-cert.pem /opt/dea/ssl/live/denglishacademy.com/fullchain.pem
sudo cp your-key.pem /opt/dea/ssl/live/denglishacademy.com/privkey.pem
```

---

## 📦 Dependency Management and Build Optimizations

During recent updates, the project dependencies and build configurations have been optimized for performance and security.

- **Cross-platform Environment Variables**: `cross-env` has been installed to ensure environment variables are set correctly across different operating systems during builds.
- **JavaScript Minification**: `terser` is used for advanced JavaScript minification in production builds.
- **Vite, Vitest, and related packages**: Core build and testing tools have been upgraded to their latest major versions for improved performance and security.
- **PWA Integration**: `vite-plugin-pwa` has been integrated to enable Progressive Web App features. Ensure you have `pwa-192x192.png` and `pwa-512x512.png` icons in your project root for the PWA manifest.
- **Image Optimization**: The problematic `vite-plugin-imagemin` has been removed due to persistent security vulnerabilities. Consider implementing image optimization as a separate step in your CI/CD pipeline or using a CDN with image optimization features.
- **Dockerfile Optimizations**: `Dockerfile.production` has been refined for smaller image sizes, better build caching, and enhanced security (e.g., non-root users, removal of unnecessary packages).

To ensure all dependencies are up-to-date and secure, it's recommended to run `npm install` and `npm audit` regularly.

---

## 🚀 Deployment with Docker Swarm

Once your environment is configured and the application is built, you can deploy the entire stack to your Docker Swarm.

### 1. Build the Application

```bash
npm run build:production
```
This command builds the optimized production assets.

### 2. Deploy the Docker Stack

Navigate to the project root directory and run:

```bash
docker stack deploy -c deploy/docker-compose.production.yml dea
```

- `docker stack deploy`: Deploys a new stack or updates an existing one.
- `-c deploy/docker-compose.production.yml`: Specifies the Compose file to use.
- `dea`: The name of your stack (you can choose any name).

This command will deploy all services defined in `docker-compose.production.yml` to your Docker Swarm, including the Nginx load balancer, application services, databases, and monitoring stack.

---

## 📊 Monitoring & Scaling

### Auto-Scaling Setup

Your application services are configured for auto-scaling within Docker Swarm. The `app` service in `docker-compose.production.yml` has `replicas: 2` by default. You can adjust this value.

### Manual Scaling Commands

To scale your application services (e.g., the `app` service) up or down, use `docker service scale`:

```bash
# Scale the 'app' service to 5 instances
docker service scale dea_app=5

# Scale down to 1 instance
docker service scale dea_app=1

# Check service status
docker service ls
docker service ps dea_app
```

### Monitoring URLs

- **Application**: <https://denglishacademy.com>
- **Grafana**: <https://grafana.denglishacademy.com>
- **Health Check**: <https://denglishacademy.com/health>

---

## 💾 Backup & Recovery

### Automated Backups

```bash
# Setup automated daily backups
echo "0 2 * * * /opt/dea/deploy/scripts/backup-production.sh" | sudo crontab -

# Manual backup
npm run deploy:backup
```

### Backup Types

```bash
# Full backup (recommended)
bash deploy/scripts/backup-production.sh full

# Component-specific backups
bash deploy/scripts/backup-production.sh mongodb
bash deploy/scripts/backup-production.sh redis
bash deploy/scripts/backup-production.sh logs
```

### Recovery Process

```bash
# 1. Stop services
docker stack rm dea

# 2. Download backup from S3
aws s3 cp s3://dea-backups/BACKUP_TIMESTAMP/ /opt/dea/restore/ --recursive

# 3. Restore MongoDB
tar -xzf /opt/dea/restore/mongodb.tar.gz -C /opt/dea/data/mongodb-primary/

# 4. Restore Redis
gunzip /opt/dea/restore/redis.rdb.gz
cp /opt/dea/restore/redis.rdb /opt/dea/data/redis/dump.rdb

# 5. Re-deploy services
docker stack deploy -c deploy/docker-compose.production.yml dea
```

---

## 🔒 Security Configuration

### Firewall Setup

```bash
# Allow essential ports
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Restrict monitoring access (optional)
sudo ufw allow from YOUR_OFFICE_IP to any port 8080

# Enable firewall
sudo ufw --force enable
```

### Security Headers

The nginx configuration includes:

- HSTS (HTTP Strict Transport Security)
- CSP (Content Security Policy)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection

### Rate Limiting

- API endpoints: 10 requests/second
- Authentication: 5 requests/minute
- General: 100 requests/15 minutes

---

## 🔧 Maintenance Tasks

### Daily Tasks

```bash
# Check service health
docker service ls
docker service ps dea_app

# Check logs
docker service logs dea_app --tail=100

# Check disk space
df -h /opt/dea
```

### Weekly Tasks

```bash
# Update Docker images
docker stack deploy -c deploy/docker-compose.production.yml dea --with-registry-auth --prune --resolve-image always

# Clean up old images
docker image prune -f

# Verify backups
aws s3 ls s3://dea-backups/
```

### Monthly Tasks

```bash
# SSL certificate renewal (if using Let's Encrypt)
docker stack deploy -c deploy/docker-compose.production.yml --compose-file deploy/docker-compose.production.yml --with-registry-auth --prune --resolve-image always --profile ssl certbot

# Security updates
sudo apt update && sudo apt upgrade -y

# Performance review
# Check Grafana dashboards for performance metrics
```

---

## 🚨 Troubleshooting

### Common Issues

#### Application Won't Start

```bash
# Check logs
docker service logs dea_app

# Check environment variables
docker exec $(docker service ps dea_app -q | head -n 1) env

# Restart application service
docker service update --force dea_app
```

#### Database Connection Issues

```bash
# Check MongoDB status
docker exec $(docker service ps dea_mongodb-primary -q | head -n 1) mongosh --eval "db.adminCommand('ping')"

# Check Redis status
docker exec $(docker service ps dea_redis-cluster -q | head -n 1) redis-cli ping

# Restart database services
docker service update --force dea_mongodb-primary dea_redis-cluster
```

#### SSL Certificate Issues

```bash
# Check certificate expiry
openssl x509 -in /opt/dea/ssl/live/denglishacademy.com/fullchain.pem -text -noout | grep "Not After"

# Renew certificate
docker stack deploy -c deploy/docker-compose.production.yml --compose-file deploy/docker-compose.production.yml --with-registry-auth --prune --resolve-image always --profile ssl certbot

# Reload nginx (if needed, usually handled by stack update)
docker exec $(docker service ps dea_nginx-lb -q | head -n 1) nginx -s reload
```

#### Performance Issues

```bash
# Check resource usage
docker stats

# Scale up if needed
docker service scale dea_app=5

# Check monitoring dashboards
# Visit https://grafana.denglishacademy.com
```

---

## 📞 Support & Contacts

### Emergency Contacts

- **System Admin**: <admin@denglishacademy.com>
- **DevOps**: <devops@denglishacademy.com>

### Monitoring Alerts

- **Slack**: Configure SLACK_WEBHOOK_URL in environment
- **Email**: Configure SMTP settings for email alerts

### Documentation

- **API Docs**: <https://denglishacademy.com/api/docs>
- **Admin Guide**: <https://denglishacademy.com/admin/guide>
- **User Manual**: <https://denglishacademy.com/help>

---

## 🎯 Performance Targets

### Response Times

- **Homepage**: < 2 seconds
- **API Endpoints**: < 500ms
- **Authentication**: < 1 second

### Availability

- **Uptime**: 99.9%
- **Recovery Time**: < 5 minutes
- **Backup Recovery**: < 30 minutes

### Scalability

- **Auto-scale**: 2-10 instances
- **Load Capacity**: 1000+ concurrent users
- **Database**: Replica set with automatic failover

---

## ✅ Post-Deployment Checklist

### Immediate (0-1 hour)

- [ ] Verify application loads at <https://denglishacademy.com>
- [ ] Test user registration and login
- [ ] Verify payment processing (test mode first)
- [ ] Check SSL certificate validity
- [ ] Confirm monitoring dashboards are accessible
- [ ] Test auto-scaling (scale up/down manually)

### Short-term (1-24 hours)

- [ ] Monitor error logs for issues
- [ ] Verify backup system is working
- [ ] Test email notifications
- [ ] Check performance metrics
- [ ] Validate all API endpoints
- [ ] Test mobile responsiveness

### Long-term (1-7 days)

- [ ] Monitor user behavior and performance
- [ ] Review security logs
- [ ] Optimize based on real usage patterns
- [ ] Fine-tune auto-scaling parameters
- [ ] Update documentation based on learnings

---

## 🎉 Success

Your Digital English Academy is now deployed and running in production at **denglishacademy.com** with:

✅ **High Availability** - Load balanced with auto-scaling  
✅ **Security** - SSL, rate limiting, and security headers  
✅ **Monitoring** - Comprehensive metrics and alerting  
✅ **Backup** - Automated daily backups to S3  
✅ **Performance** - Optimized for speed and scalability  

**Ready to serve students worldwide! 🌍📚**