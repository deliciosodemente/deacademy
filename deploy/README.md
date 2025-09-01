# Digital English Academy - Deployment Guide

This directory contains all the necessary files and configurations for deploying the Digital English Academy application in production environments.

## 📁 Directory Structure

```
deploy/
├── docker/                 # Docker configurations
│   └── Dockerfile         # Multi-stage production Dockerfile
├── k8s/                   # Kubernetes manifests
│   ├── namespace.yaml     # Kubernetes namespace
│   ├── deployment.yaml    # Application deployment
│   ├── ingress.yaml       # Ingress configuration
│   ├── configmap.yaml     # Configuration maps
│   └── hpa.yaml          # Horizontal Pod Autoscaler
├── nginx/                 # Nginx configurations
│   ├── nginx.conf        # Main nginx configuration
│   └── default.conf      # Default server configuration
├── monitoring/            # Monitoring configurations
│   ├── prometheus.yml    # Prometheus configuration
│   ├── loki.yml         # Loki configuration
│   └── promtail.yml     # Promtail configuration
├── scripts/              # Deployment scripts
│   ├── deploy.sh        # Main deployment script
│   └── backup.sh        # Backup script
├── docker-compose.yml    # Docker Compose configuration
├── .env.production      # Production environment variables
├── .env.staging        # Staging environment variables
└── README.md           # This file
```

## 🚀 Deployment Options

### Option 1: Docker Compose (Recommended for single server)

#### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 4GB+ RAM
- 20GB+ disk space

#### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd digital-english-academy

# Copy and configure environment variables
cp deploy/.env.production deploy/.env
# Edit deploy/.env with your actual values

# Deploy with Docker Compose
./deploy/scripts/deploy.sh --environment production --type docker
```

#### Manual Docker Compose Deployment

```bash
cd deploy
docker-compose up -d
```

### Option 2: Kubernetes (Recommended for scalable production)

#### Prerequisites

- Kubernetes cluster 1.20+
- kubectl configured
- Helm 3.0+ (optional)
- cert-manager for SSL certificates
- nginx-ingress-controller

#### Deployment Steps

```bash
# Deploy to Kubernetes
./deploy/scripts/deploy.sh --environment production --type k8s

# Or manually apply manifests
kubectl apply -f deploy/k8s/
```

## 🔧 Configuration

### Environment Variables

Create environment-specific configuration files:

**Production (.env.production):**

```bash
# Required variables
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
MONGO_ROOT_PASSWORD=secure_mongodb_password
REDIS_PASSWORD=secure_redis_password
SESSION_SECRET=secure_session_secret
JWT_SECRET=secure_jwt_secret

# Optional but recommended
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
SENDGRID_API_KEY=SG....
SENTRY_DSN=https://...
```

### SSL/TLS Certificates

#### Option 1: Let's Encrypt (Automatic)

The deployment includes automatic SSL certificate generation using Let's Encrypt via Traefik or cert-manager.

#### Option 2: Custom Certificates

Place your certificates in:

```
deploy/ssl/
├── cert.pem
└── key.pem
```

### Database Configuration

#### MongoDB

- Default database: `digitalenglishacademy`
- Authentication: Username/password
- Backup: Automated daily backups

#### Redis

- Used for: Sessions, caching, rate limiting
- Persistence: AOF enabled
- Password protected

## 📊 Monitoring

The deployment includes a complete monitoring stack:

### Services

- **Prometheus**: Metrics collection
- **Grafana**: Dashboards and visualization
- **Loki**: Log aggregation
- **Promtail**: Log shipping
- **Traefik**: Load balancer with metrics

### Access URLs

- Application: `https://digitalenglishacademy.com`
- Grafana: `https://grafana.digitalenglishacademy.com`
- Prometheus: `https://prometheus.digitalenglishacademy.com`
- Traefik Dashboard: `https://traefik.digitalenglishacademy.com`

### Default Credentials

- Grafana: `admin` / `admin` (change on first login)

## 🔒 Security

### Security Features

- HTTPS/TLS encryption
- Security headers (HSTS, CSP, etc.)
- Rate limiting
- CORS protection
- Input validation
- SQL injection prevention
- XSS protection

### Security Checklist

- [ ] Change default passwords
- [ ] Configure firewall rules
- [ ] Enable fail2ban
- [ ] Set up log monitoring
- [ ] Configure backup encryption
- [ ] Review security headers
- [ ] Test SSL configuration

## 💾 Backup & Recovery

### Automated Backups

```bash
# Run backup manually
./deploy/scripts/backup.sh

# Configure automated backups (cron)
0 2 * * * /path/to/deploy/scripts/backup.sh
```

### Backup Components

- MongoDB database dumps
- Redis data snapshots
- Application logs
- Configuration files

### S3 Integration

Configure AWS S3 for backup storage:

```bash
export S3_BUCKET=your-backup-bucket
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy
        run: ./deploy/scripts/deploy.sh --environment production --type docker
        env:
          AUTH0_CLIENT_ID: ${{ secrets.AUTH0_CLIENT_ID }}
          AUTH0_CLIENT_SECRET: ${{ secrets.AUTH0_CLIENT_SECRET }}
```

## 🐛 Troubleshooting

### Common Issues

#### Services Not Starting

```bash
# Check service status
docker-compose ps
kubectl get pods -n dea-production

# View logs
docker-compose logs
kubectl logs -f deployment/dea-app -n dea-production
```

#### SSL Certificate Issues

```bash
# Check certificate status
openssl x509 -in /path/to/cert.pem -text -noout

# Renew Let's Encrypt certificates
docker-compose exec traefik traefik version
```

#### Database Connection Issues

```bash
# Test MongoDB connection
docker exec -it dea-mongodb mongosh

# Test Redis connection
docker exec -it dea-redis redis-cli ping
```

#### Performance Issues

```bash
# Check resource usage
docker stats
kubectl top pods -n dea-production

# View performance metrics
curl http://localhost/metrics
```

### Health Checks

#### Application Health

```bash
curl -f http://localhost/health
```

#### Service Health

```bash
# MongoDB
docker exec dea-mongodb mongosh --eval "db.adminCommand('ping')"

# Redis
docker exec dea-redis redis-cli ping
```

## 📈 Scaling

### Horizontal Scaling (Kubernetes)

```bash
# Scale application pods
kubectl scale deployment dea-app --replicas=5 -n dea-production

# Configure auto-scaling
kubectl apply -f deploy/k8s/hpa.yaml
```

### Vertical Scaling (Docker Compose)

```yaml
# In docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'
```

## 🔧 Maintenance

### Regular Maintenance Tasks

- [ ] Update dependencies monthly
- [ ] Review and rotate secrets quarterly
- [ ] Monitor disk space weekly
- [ ] Review logs daily
- [ ] Test backups monthly
- [ ] Update SSL certificates (if manual)

### Update Procedure

```bash
# 1. Backup current deployment
./deploy/scripts/backup.sh

# 2. Deploy new version
git pull origin main
./deploy/scripts/deploy.sh --environment production

# 3. Verify deployment
curl -f https://digitalenglishacademy.com/health
```

## 📞 Support

### Log Locations

- Application logs: `/var/log/nginx/`
- Container logs: `docker logs <container>`
- Kubernetes logs: `kubectl logs <pod>`

### Monitoring Alerts

Configure alerts for:

- High CPU/memory usage
- Database connection failures
- SSL certificate expiration
- Disk space usage
- Application errors

### Emergency Contacts

- DevOps Team: <devops@digitalenglishacademy.com>
- Security Team: <security@digitalenglishacademy.com>
- On-call: +1-XXX-XXX-XXXX

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)

---

**Last Updated**: $(date)
**Version**: 1.0.0
