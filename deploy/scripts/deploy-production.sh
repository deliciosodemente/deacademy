#!/bin/bash
# Production Deployment Script for Digital English Academy
# Deploys to denglishacademy.com with zero-downtime

set -euo pipefail

# Configuration
DOMAIN="denglishacademy.com"
COMPOSE_FILE="docker-compose.production.yml"
BACKUP_DIR="/opt/dea/backups"
LOG_FILE="/var/log/dea-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if running as root or with sudo
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root or with sudo"
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check if compose file exists
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        error "Docker Compose file not found: $COMPOSE_FILE"
    fi
    
    # Check environment file
    if [[ ! -f ".env.production" ]]; then
        error "Production environment file not found: .env.production"
    fi
    
    success "Prerequisites check passed"
}

# Create necessary directories
setup_directories() {
    log "Setting up directories..."
    
    mkdir -p /opt/dea/{data,logs,backups,ssl}
    mkdir -p /opt/dea/data/{mongodb-primary,mongodb-secondary,redis,prometheus,grafana,loki}
    mkdir -p /opt/dea/logs/{nginx,app,monitoring}
    
    # Set proper permissions
    chown -R 1001:1001 /opt/dea/data
    chown -R nginx:nginx /opt/dea/logs/nginx
    chmod -R 755 /opt/dea
    
    success "Directories setup completed"
}

# Backup existing data
backup_data() {
    log "Creating backup before deployment..."
    
    BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/pre-deploy-$BACKUP_TIMESTAMP"
    
    mkdir -p "$BACKUP_PATH"
    
    # Backup MongoDB data if exists
    if [[ -d "/opt/dea/data/mongodb-primary" ]]; then
        log "Backing up MongoDB data..."
        tar -czf "$BACKUP_PATH/mongodb-primary.tar.gz" -C /opt/dea/data mongodb-primary
    fi
    
    # Backup Redis data if exists
    if [[ -d "/opt/dea/data/redis" ]]; then
        log "Backing up Redis data..."
        tar -czf "$BACKUP_PATH/redis.tar.gz" -C /opt/dea/data redis
    fi
    
    # Backup Grafana data if exists
    if [[ -d "/opt/dea/data/grafana" ]]; then
        log "Backing up Grafana data..."
        tar -czf "$BACKUP_PATH/grafana.tar.gz" -C /opt/dea/data grafana
    fi
    
    success "Backup completed: $BACKUP_PATH"
}

# Pull latest images
pull_images() {
    log "Pulling latest Docker images..."
    
    docker-compose -f "$COMPOSE_FILE" pull
    
    success "Images pulled successfully"
}

# Build custom images
build_images() {
    log "Building custom images..."
    
    # Build production image
    docker build -f deploy/docker/Dockerfile.production -t dea-app:latest .
    
    success "Images built successfully"
}

# Deploy with zero downtime
deploy_zero_downtime() {
    log "Starting zero-downtime deployment..."
    
    # Start new services
    docker-compose -f "$COMPOSE_FILE" up -d --remove-orphans
    
    # Wait for health checks
    log "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_service_health
    
    success "Zero-downtime deployment completed"
}

# Check service health
check_service_health() {
    log "Checking service health..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        log "Health check attempt $attempt/$max_attempts"
        
        # Check main application
        if curl -f -s "http://localhost/health" > /dev/null; then
            success "Application is healthy"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error "Health check failed after $max_attempts attempts"
        fi
        
        sleep 10
        ((attempt++))
    done
}

# Setup SSL certificates
setup_ssl() {
    log "Setting up SSL certificates..."
    
    # Check if certificates exist
    if [[ ! -f "/opt/dea/ssl/live/$DOMAIN/fullchain.pem" ]]; then
        log "Obtaining SSL certificate for $DOMAIN..."
        
        # Run certbot
        docker-compose -f "$COMPOSE_FILE" --profile ssl run --rm certbot certonly \
            --webroot \
            --webroot-path=/var/www/certbot \
            --email admin@$DOMAIN \
            --agree-tos \
            --no-eff-email \
            -d $DOMAIN \
            -d www.$DOMAIN \
            -d grafana.$DOMAIN
        
        success "SSL certificate obtained"
    else
        log "SSL certificate already exists"
    fi
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Import Grafana dashboards
    if [[ -d "deploy/monitoring/grafana/dashboards" ]]; then
        cp -r deploy/monitoring/grafana/dashboards/* /opt/dea/data/grafana/dashboards/
    fi
    
    # Setup Prometheus rules
    if [[ -d "deploy/monitoring/rules" ]]; then
        cp -r deploy/monitoring/rules/* /opt/dea/data/prometheus/rules/
    fi
    
    success "Monitoring setup completed"
}

# Cleanup old images and containers
cleanup() {
    log "Cleaning up old images and containers..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused containers
    docker container prune -f
    
    # Remove unused volumes (be careful with this)
    # docker volume prune -f
    
    success "Cleanup completed"
}

# Setup log rotation
setup_log_rotation() {
    log "Setting up log rotation..."
    
    cat > /etc/logrotate.d/dea << EOF
/opt/dea/logs/*/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 nginx nginx
    postrotate
        docker-compose -f /opt/dea/docker-compose.production.yml exec nginx-lb nginx -s reload
    endscript
}
EOF
    
    success "Log rotation setup completed"
}

# Setup firewall rules
setup_firewall() {
    log "Setting up firewall rules..."
    
    # Allow SSH
    ufw allow ssh
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow monitoring (restrict to specific IPs in production)
    ufw allow 8080/tcp
    
    # Enable firewall
    ufw --force enable
    
    success "Firewall setup completed"
}

# Main deployment function
main() {
    log "Starting production deployment for $DOMAIN"
    
    # Load environment variables
    export $(cat .env.production | xargs)
    
    check_prerequisites
    setup_directories
    backup_data
    pull_images
    build_images
    setup_ssl
    deploy_zero_downtime
    setup_monitoring
    setup_log_rotation
    setup_firewall
    cleanup
    
    success "🚀 Production deployment completed successfully!"
    success "🌐 Application is now live at https://$DOMAIN"
    success "📊 Monitoring available at https://grafana.$DOMAIN"
    
    log "Deployment summary:"
    log "- Domain: $DOMAIN"
    log "- Deployment time: $(date)"
    log "- Backup location: $BACKUP_DIR"
    log "- Log file: $LOG_FILE"
}

# Run main function
main "$@"