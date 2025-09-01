#!/bin/bash

# Deploy Script for AWS Lightsail - Digital English Academy
# Usage: ./deploy-lightsail.sh [server-ip] [domain]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP=${1:-""}
DOMAIN=${2:-"denglishacademy.com"}
SSH_KEY=${3:-"~/.ssh/LightsailDefaultKey-us-east-1.pem"}
SSH_USER="ubuntu"
APP_DIR="/var/www/denglishacademy"
LOCAL_BUILD_DIR="dist"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."
    
    if [ -z "$SERVER_IP" ]; then
        log_error "Server IP is required. Usage: ./deploy-lightsail.sh [server-ip] [domain]"
        exit 1
    fi
    
    if [ ! -f "$SSH_KEY" ]; then
        log_error "SSH key not found at $SSH_KEY"
        exit 1
    fi
    
    if [ ! -d "$LOCAL_BUILD_DIR" ]; then
        log_error "Build directory not found. Run 'npm run build:production' first"
        exit 1
    fi
    
    # Check if ssh, scp, and rsync are available
    command -v ssh >/dev/null 2>&1 || { log_error "ssh is required but not installed."; exit 1; }
    command -v scp >/dev/null 2>&1 || { log_error "scp is required but not installed."; exit 1; }
    command -v rsync >/dev/null 2>&1 || { log_error "rsync is required but not installed."; exit 1; }
    
    log_success "Requirements check passed"
}

build_application() {
    log_info "Building application for production..."
    
    if [ ! -f "package.json" ]; then
        log_error "package.json not found. Are you in the project root?"
        exit 1
    fi
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        npm install
    fi
    
    # Build for production
    log_info "Running production build..."
    npm run build:production
    
    log_success "Application built successfully"
}

setup_server() {
    log_info "Setting up server environment..."
    
    # Create setup script
    cat > /tmp/server-setup.sh << 'EOF'
#!/bin/bash
set -e

# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nginx certbot python3-certbot-nginx curl

# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Create application directory
sudo mkdir -p /var/www/denglishacademy
sudo chown ubuntu:ubuntu /var/www/denglishacademy

# Create backup directory
mkdir -p /home/ubuntu/backups

echo "Server setup completed"
EOF

    # Copy and execute setup script
    scp -i "$SSH_KEY" /tmp/server-setup.sh "$SSH_USER@$SERVER_IP:/tmp/"
    ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" "chmod +x /tmp/server-setup.sh && /tmp/server-setup.sh"
    
    log_success "Server setup completed"
}

deploy_application() {
    log_info "Deploying application to server..."
    
    # Sync files to server
    log_info "Uploading files..."
    rsync -avz --delete -e "ssh -i $SSH_KEY" "$LOCAL_BUILD_DIR/" "$SSH_USER@$SERVER_IP:$APP_DIR/"
    
    # Copy additional files
    scp -i "$SSH_KEY" package.json "$SSH_USER@$SERVER_IP:$APP_DIR/"
    scp -i "$SSH_KEY" deploy/server.js "$SSH_USER@$SERVER_IP:$APP_DIR/" 2>/dev/null || log_warning "server.js not found, skipping"
    
    log_success "Files uploaded successfully"
}

configure_nginx() {
    log_info "Configuring Nginx..."
    
    # Create Nginx configuration
    cat > /tmp/nginx-config << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    root $APP_DIR;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' *.auth0.com *.stripe.com *.mongodb.net *.unsplash.com *.ui-avatars.com" always;
    
    # Handle SPA routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy (if backend exists)
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    # Upload and configure Nginx
    scp -i "$SSH_KEY" /tmp/nginx-config "$SSH_USER@$SERVER_IP:/tmp/"
    ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" << 'EOF'
        sudo mv /tmp/nginx-config /etc/nginx/sites-available/denglishacademy.com
        sudo ln -sf /etc/nginx/sites-available/denglishacademy.com /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
        sudo nginx -t && sudo systemctl reload nginx
EOF

    log_success "Nginx configured successfully"
}

setup_ssl() {
    log_info "Setting up SSL certificate..."
    
    ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" << EOF
        # Wait for DNS propagation
        echo "Waiting for DNS propagation..."
        sleep 30
        
        # Get SSL certificate
        sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
        
        # Setup auto-renewal
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
EOF

    log_success "SSL certificate configured"
}

setup_backend() {
    log_info "Setting up backend server..."
    
    # Create simple Express server if it doesn't exist
    if [ ! -f "deploy/server.js" ]; then
        log_info "Creating basic Express server..."
        mkdir -p deploy
        cat > deploy/server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['https://denglishacademy.com', 'https://www.denglishacademy.com'],
    credentials: true
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// AI Chat fallback
app.post('/api/ai/chat', (req, res) => {
    const fallbackResponses = [
        'Hola! Estoy aquí para ayudarte con tu aprendizaje de inglés.',
        '¿En qué puedo ayudarte hoy?',
        '¿Tienes alguna pregunta sobre gramática o vocabulario?',
        'Te recomiendo practicar más con nuestras lecciones.',
        'Servicio de IA temporalmente no disponible. Funcionalidad básica activa.'
    ];
    
    const response = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    res.json({ content: response });
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Catch all handler for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Digital English Academy API running on port ${PORT}`);
});
EOF
    fi
    
    # Setup backend on server
    ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" << 'EOF'
        cd /var/www/denglishacademy
        
        # Install backend dependencies
        npm init -y 2>/dev/null || true
        npm install express cors --save
        
        # Start with PM2
        pm2 delete denglishacademy-api 2>/dev/null || true
        pm2 start server.js --name "denglishacademy-api" || echo "Backend server not started (optional)"
        pm2 startup ubuntu -u ubuntu --hp /home/ubuntu 2>/dev/null || true
        pm2 save
EOF

    log_success "Backend server configured"
}

setup_monitoring() {
    log_info "Setting up monitoring and backups..."
    
    # Create backup script
    cat > /tmp/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
APP_DIR="/var/www/denglishacademy"

mkdir -p $BACKUP_DIR

# Backup application
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C $APP_DIR .

# Keep only last 7 backups
find $BACKUP_DIR -name "app_*.tar.gz" -mtime +7 -delete

echo "Backup completed: app_$DATE.tar.gz"
EOF

    # Upload and setup backup
    scp -i "$SSH_KEY" /tmp/backup.sh "$SSH_USER@$SERVER_IP:/home/ubuntu/"
    ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" << 'EOF'
        chmod +x /home/ubuntu/backup.sh
        
        # Setup daily backup cron job
        (crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/backup.sh") | crontab -
        
        # Setup PM2 log rotation
        pm2 install pm2-logrotate 2>/dev/null || true
        pm2 set pm2-logrotate:max_size 10M 2>/dev/null || true
        pm2 set pm2-logrotate:retain 30 2>/dev/null || true
EOF

    log_success "Monitoring and backups configured"
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Test HTTP connection
    if curl -s -o /dev/null -w "%{http_code}" "http://$SERVER_IP" | grep -q "200\|301\|302"; then
        log_success "HTTP connection successful"
    else
        log_warning "HTTP connection failed"
    fi
    
    # Test HTTPS connection (may fail initially due to DNS propagation)
    if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" | grep -q "200"; then
        log_success "HTTPS connection successful"
    else
        log_warning "HTTPS connection failed (may be due to DNS propagation)"
    fi
    
    log_info "Deployment verification completed"
}

print_summary() {
    echo ""
    echo "=========================================="
    echo "🚀 DEPLOYMENT COMPLETED SUCCESSFULLY! 🚀"
    echo "=========================================="
    echo ""
    echo "📋 Deployment Summary:"
    echo "  • Domain: https://$DOMAIN"
    echo "  • Server IP: $SERVER_IP"
    echo "  • SSL: Let's Encrypt (auto-renewal enabled)"
    echo "  • Backend API: http://$SERVER_IP:3001"
    echo ""
    echo "🔧 Next Steps:"
    echo "  1. Update DNS records to point $DOMAIN to $SERVER_IP"
    echo "  2. Configure Auth0 with production URLs"
    echo "  3. Configure Stripe with production webhooks"
    echo "  4. Test all functionality"
    echo ""
    echo "📞 Support:"
    echo "  • SSH: ssh -i $SSH_KEY $SSH_USER@$SERVER_IP"
    echo "  • Logs: pm2 logs"
    echo "  • Nginx: sudo systemctl status nginx"
    echo ""
    echo "🎉 Your Digital English Academy is ready!"
    echo "=========================================="
}

# Main execution
main() {
    log_info "Starting deployment to AWS Lightsail..."
    
    check_requirements
    build_application
    setup_server
    deploy_application
    configure_nginx
    setup_ssl
    setup_backend
    setup_monitoring
    verify_deployment
    print_summary
}

# Run main function
main "$@"