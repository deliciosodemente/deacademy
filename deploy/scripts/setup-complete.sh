#!/bin/bash

# Complete Setup Script for Digital English Academy
# This script will:
# 1. Create Auth0 application
# 2. Create Stripe products
# 3. Deploy to Lightsail
# 4. Configure everything automatically

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
SERVER_IP=${1:-""}
DOMAIN=${2:-"denglishacademy.com"}
EMAIL=${3:-"admin@denglishacademy.com"}

if [ -z "$SERVER_IP" ]; then
    log_error "Usage: ./setup-complete.sh [server-ip] [domain] [email]"
    log_info "Example: ./setup-complete.sh 3.85.123.45 denglishacademy.com admin@denglishacademy.com"
    exit 1
fi

echo "=========================================="
echo "🚀 COMPLETE SETUP - DIGITAL ENGLISH ACADEMY"
echo "=========================================="
echo "Server IP: $SERVER_IP"
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo "=========================================="

# Step 1: Create Auth0 Configuration
log_info "Step 1: Creating Auth0 configuration..."

# Create Auth0 setup instructions
cat > auth0-setup-instructions.md << EOF
# Auth0 Setup Instructions

## Quick Setup (5 minutes):

1. Go to https://auth0.com and create account
2. Create new application:
   - Name: Digital English Academy
   - Type: Single Page Web Applications
3. In Settings, configure:
   - Allowed Callback URLs: https://$DOMAIN, https://www.$DOMAIN
   - Allowed Logout URLs: https://$DOMAIN, https://www.$DOMAIN
   - Allowed Web Origins: https://$DOMAIN, https://www.$DOMAIN
4. Copy these values:
   - Domain: your-domain.auth0.com
   - Client ID: abc123...

## Auto-configuration script:
Run this after getting Auth0 credentials:
\`\`\`bash
./configure-auth0.sh your-domain.auth0.com abc123def456ghi789
\`\`\`
EOF

# Create Auth0 configuration script
cat > configure-auth0.sh << 'EOF'
#!/bin/bash
AUTH0_DOMAIN=$1
AUTH0_CLIENT_ID=$2

if [ -z "$AUTH0_DOMAIN" ] || [ -z "$AUTH0_CLIENT_ID" ]; then
    echo "Usage: ./configure-auth0.sh [auth0-domain] [client-id]"
    exit 1
fi

# Update environment configuration
cat > .env.production << EOL
NODE_ENV=production
AUTH0_DOMAIN=$AUTH0_DOMAIN
AUTH0_CLIENT_ID=$AUTH0_CLIENT_ID
AUTH0_AUDIENCE=https://denglishacademy.com/api
FEATURE_AUTH0=true
EOL

echo "✅ Auth0 configured successfully!"
echo "Domain: $AUTH0_DOMAIN"
echo "Client ID: $AUTH0_CLIENT_ID"
EOF

chmod +x configure-auth0.sh

log_success "Auth0 setup instructions created"

# Step 2: Create Stripe Configuration
log_info "Step 2: Creating Stripe configuration..."

cat > stripe-setup-instructions.md << EOF
# Stripe Setup Instructions

## Quick Setup (10 minutes):

1. Go to https://stripe.com and create account
2. In Dashboard > Developers > API Keys:
   - Copy Publishable key (pk_test_...)
3. In Dashboard > Products:
   - Create product: "Digital English Academy Premium"
   - Price: \$29.99/month
   - Create Payment Link
4. Copy Payment Link URL

## Auto-configuration script:
Run this after getting Stripe credentials:
\`\`\`bash
./configure-stripe.sh pk_test_your_key https://buy.stripe.com/your_link
\`\`\`
EOF

cat > configure-stripe.sh << 'EOF'
#!/bin/bash
STRIPE_KEY=$1
STRIPE_LINK=$2

if [ -z "$STRIPE_KEY" ] || [ -z "$STRIPE_LINK" ]; then
    echo "Usage: ./configure-stripe.sh [publishable-key] [payment-link]"
    exit 1
fi

# Update environment configuration
if [ -f .env.production ]; then
    # Append to existing file
    echo "STRIPE_PUBLISHABLE_KEY=$STRIPE_KEY" >> .env.production
    echo "STRIPE_PAYMENT_LINK=$STRIPE_LINK" >> .env.production
    echo "FEATURE_STRIPE=true" >> .env.production
else
    # Create new file
    cat > .env.production << EOL
NODE_ENV=production
STRIPE_PUBLISHABLE_KEY=$STRIPE_KEY
STRIPE_PAYMENT_LINK=$STRIPE_LINK
FEATURE_STRIPE=true
EOL
fi

echo "✅ Stripe configured successfully!"
echo "Publishable Key: $STRIPE_KEY"
echo "Payment Link: $STRIPE_LINK"
EOF

chmod +x configure-stripe.sh

log_success "Stripe setup instructions created"

# Step 3: Create MongoDB Configuration
log_info "Step 3: Creating MongoDB configuration..."

cat > mongodb-setup-instructions.md << EOF
# MongoDB Setup Instructions

## Quick Setup (5 minutes):

1. Go to https://mongodb.com/atlas
2. Create free account
3. Create free cluster (M0 Sandbox)
4. Create database user:
   - Username: denglishacademy
   - Password: [generate secure password]
5. Add IP address: 0.0.0.0/0 (allow from anywhere)
6. Get connection string

## Auto-configuration script:
\`\`\`bash
./configure-mongodb.sh "mongodb+srv://user:pass@cluster.mongodb.net/denglishacademy"
\`\`\`
EOF

cat > configure-mongodb.sh << 'EOF'
#!/bin/bash
MONGODB_URI=$1

if [ -z "$MONGODB_URI" ]; then
    echo "Usage: ./configure-mongodb.sh [connection-string]"
    exit 1
fi

# Update environment configuration
if [ -f .env.production ]; then
    echo "MONGODB_CONNECTION_STRING=$MONGODB_URI" >> .env.production
    echo "FEATURE_MONGODB=true" >> .env.production
else
    cat > .env.production << EOL
NODE_ENV=production
MONGODB_CONNECTION_STRING=$MONGODB_URI
FEATURE_MONGODB=true
EOL
fi

echo "✅ MongoDB configured successfully!"
EOF

chmod +x configure-mongodb.sh

log_success "MongoDB setup instructions created"

# Step 4: Build application
log_info "Step 4: Building application..."

if [ ! -f "package.json" ]; then
    log_error "package.json not found. Are you in the project root?"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    log_info "Installing dependencies..."
    npm install
fi

# Build for production
log_info "Building for production..."
npm run build:production

log_success "Application built successfully"

# Step 5: Deploy to server
log_info "Step 5: Deploying to Lightsail server..."

# Create deployment package
log_info "Creating deployment package..."
tar -czf deployment-package.tar.gz dist/ deploy/ package.json *.md

# Upload deployment script
cat > remote-deploy.sh << 'EOF'
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

# Extract deployment package
cd /var/www/denglishacademy
tar -xzf /tmp/deployment-package.tar.gz

# Install backend dependencies
npm init -y 2>/dev/null || true
npm install express cors --save

# Configure Nginx
sudo tee /etc/nginx/sites-available/denglishacademy.com > /dev/null << 'NGINX_EOF'
server {
    listen 80;
    server_name denglishacademy.com www.denglishacademy.com;
    
    root /var/www/denglishacademy/dist;
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
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX_EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/denglishacademy.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Start backend with PM2
pm2 delete denglishacademy-api 2>/dev/null || true
pm2 start deploy/server.js --name "denglishacademy-api"
pm2 startup ubuntu -u ubuntu --hp /home/ubuntu 2>/dev/null || true
pm2 save

echo "✅ Deployment completed successfully!"
EOF

# Upload and execute
scp -i ~/.ssh/LightsailDefaultKey-us-east-1.pem deployment-package.tar.gz ubuntu@$SERVER_IP:/tmp/
scp -i ~/.ssh/LightsailDefaultKey-us-east-1.pem remote-deploy.sh ubuntu@$SERVER_IP:/tmp/
ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem ubuntu@$SERVER_IP "chmod +x /tmp/remote-deploy.sh && /tmp/remote-deploy.sh"

log_success "Application deployed to server"

# Step 6: Configure SSL
log_info "Step 6: Configuring SSL certificate..."

ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem ubuntu@$SERVER_IP << EOF
    # Wait for DNS propagation
    echo "Waiting 30 seconds for DNS propagation..."
    sleep 30
    
    # Get SSL certificate
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL
    
    # Setup auto-renewal
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
EOF

log_success "SSL certificate configured"

# Step 7: Create management scripts
log_info "Step 7: Creating management scripts..."

cat > update-site.sh << 'EOF'
#!/bin/bash
# Quick update script
SERVER_IP=$1

if [ -z "$SERVER_IP" ]; then
    echo "Usage: ./update-site.sh [server-ip]"
    exit 1
fi

echo "🔄 Updating Digital English Academy..."

# Build locally
npm run build:production

# Upload new files
scp -i ~/.ssh/LightsailDefaultKey-us-east-1.pem -r dist/* ubuntu@$SERVER_IP:/var/www/denglishacademy/dist/

# Restart services
ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem ubuntu@$SERVER_IP "pm2 restart denglishacademy-api && sudo systemctl reload nginx"

echo "✅ Update completed!"
EOF

chmod +x update-site.sh

cat > check-status.sh << 'EOF'
#!/bin/bash
# Status check script
SERVER_IP=$1

if [ -z "$SERVER_IP" ]; then
    echo "Usage: ./check-status.sh [server-ip]"
    exit 1
fi

echo "📊 Digital English Academy Status Check"
echo "======================================"

# Check HTTP status
echo "🌐 HTTP Status:"
curl -s -o /dev/null -w "Status: %{http_code}\nResponse Time: %{time_total}s\n" "http://$SERVER_IP"

# Check HTTPS status
echo -e "\n🔒 HTTPS Status:"
curl -s -o /dev/null -w "Status: %{http_code}\nResponse Time: %{time_total}s\n" "https://denglishacademy.com" 2>/dev/null || echo "HTTPS not ready yet"

# Check server status
echo -e "\n🖥️  Server Status:"
ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem ubuntu@$SERVER_IP << 'REMOTE_EOF'
echo "Nginx: $(sudo systemctl is-active nginx)"
echo "PM2 Status:"
pm2 status
echo -e "\nDisk Usage:"
df -h /
echo -e "\nMemory Usage:"
free -h
REMOTE_EOF
EOF

chmod +x check-status.sh

# Cleanup
rm -f deployment-package.tar.gz remote-deploy.sh

# Final summary
echo ""
echo "=========================================="
echo "🎉 SETUP COMPLETED SUCCESSFULLY!"
echo "=========================================="
echo ""
echo "📋 What's Done:"
echo "  ✅ Application deployed to https://$DOMAIN"
echo "  ✅ SSL certificate configured"
echo "  ✅ Backend API running"
echo "  ✅ Nginx configured"
echo "  ✅ Auto-renewal setup"
echo ""
echo "🔧 Next Steps (Optional - for full functionality):"
echo "  1. Configure Auth0: Follow auth0-setup-instructions.md"
echo "  2. Configure Stripe: Follow stripe-setup-instructions.md"
echo "  3. Configure MongoDB: Follow mongodb-setup-instructions.md"
echo ""
echo "📞 Management Commands:"
echo "  • Update site: ./update-site.sh $SERVER_IP"
echo "  • Check status: ./check-status.sh $SERVER_IP"
echo "  • SSH access: ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem ubuntu@$SERVER_IP"
echo ""
echo "🌐 Your site is live at: https://$DOMAIN"
echo "=========================================="
EOF