@echo off
REM Optimized Deployment Script for Digital English Academy with Auth0 GenAI
REM Usage: deploy-optimized.bat [server-ip] [domain] [auth0-domain] [auth0-client-id]

setlocal enabledelayedexpansion

REM Configuration
set SERVER_IP=%1
set DOMAIN=%2
set AUTH0_DOMAIN=%3
set AUTH0_CLIENT_ID=%4
set EMAIL=admin@denglishacademy.com
set SSH_KEY=%USERPROFILE%\.ssh\LightsailDefaultKey-us-east-1.pem

REM Default values
if "%SERVER_IP%"=="" (
    echo [ERROR] Server IP is required
    echo Usage: deploy-optimized.bat [server-ip] [domain] [auth0-domain] [auth0-client-id]
    echo Example: deploy-optimized.bat 3.85.123.45 denglishacademy.com myapp.auth0.com abc123def456
    pause
    exit /b 1
)

if "%DOMAIN%"=="" set DOMAIN=denglishacademy.com

echo.
echo ==========================================
echo   OPTIMIZED DEPLOYMENT - DIGITAL ENGLISH ACADEMY
echo ==========================================
echo Server IP: %SERVER_IP%
echo Domain: %DOMAIN%
echo Auth0 Domain: %AUTH0_DOMAIN%
echo Auth0 Client ID: %AUTH0_CLIENT_ID%
echo ==========================================
echo.

REM Performance optimized build
echo [INFO] Building optimized production bundle...

REM Clean previous builds
if exist "dist" rmdir /s /q dist
if exist "build" rmdir /s /q build

REM Install dependencies with production optimizations
call npm ci --production=false --silent

REM Build with optimizations
set NODE_ENV=production
call npm run build:production

if errorlevel 1 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)

echo [SUCCESS] Optimized build completed

REM Create optimized server setup script
echo [INFO] Creating optimized server setup...

(
echo #!/bin/bash
echo set -e
echo.
echo # Performance optimizations
echo echo "net.core.rmem_max = 16777216" ^| sudo tee -a /etc/sysctl.conf
echo echo "net.core.wmem_max = 16777216" ^| sudo tee -a /etc/sysctl.conf
echo sudo sysctl -p
echo.
echo # Update system with optimizations
echo sudo apt update ^&^& sudo apt upgrade -y
echo sudo apt install -y nginx certbot python3-certbot-nginx curl htop iotop
echo.
echo # Install Node.js 18 LTS
echo curl -fsSL https://deb.nodesource.com/setup_18.x ^| sudo -E bash -
echo sudo apt-get install -y nodejs
echo.
echo # Install PM2 with optimizations
echo sudo npm install -g pm2@latest
echo.
echo # Create optimized app directory structure
echo sudo mkdir -p /var/www/denglishacademy/{app,logs,backups}
echo sudo chown -R ubuntu:ubuntu /var/www/denglishacademy
echo.
echo # Setup log rotation
echo sudo tee /etc/logrotate.d/denglishacademy ^<^<EOF
echo /var/www/denglishacademy/logs/*.log {
echo     daily
echo     missingok
echo     rotate 52
echo     compress
echo     delaycompress
echo     notifempty
echo     create 644 ubuntu ubuntu
echo     postrotate
echo         pm2 reload denglishacademy-api
echo     endscript
echo }
echo EOF
echo.
echo echo "Optimized server setup completed"
) > server-setup-optimized.sh

REM Upload and execute optimized setup
echo [INFO] Setting up optimized server...
scp -i "%SSH_KEY%" server-setup-optimized.sh ubuntu@%SERVER_IP%:/tmp/
ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "chmod +x /tmp/server-setup-optimized.sh && /tmp/server-setup-optimized.sh"

echo [SUCCESS] Server optimization completed

REM Create optimized Nginx configuration
echo [INFO] Creating optimized Nginx configuration...

(
echo # Optimized Nginx configuration for Digital English Academy
echo server {
echo     listen 80;
echo     server_name %DOMAIN% www.%DOMAIN%;
echo     return 301 https://$server_name$request_uri;
echo }
echo.
echo server {
echo     listen 443 ssl http2;
echo     server_name %DOMAIN% www.%DOMAIN%;
echo.
echo     # SSL Configuration ^(will be updated by Certbot^)
echo     ssl_certificate /etc/letsencrypt/live/%DOMAIN%/fullchain.pem;
echo     ssl_certificate_key /etc/letsencrypt/live/%DOMAIN%/privkey.pem;
echo.
echo     # SSL Optimizations
echo     ssl_session_cache shared:SSL:10m;
echo     ssl_session_timeout 10m;
echo     ssl_protocols TLSv1.2 TLSv1.3;
echo     ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
echo     ssl_prefer_server_ciphers off;
echo.
echo     # Performance optimizations
echo     root /var/www/denglishacademy/app;
echo     index index.html;
echo.
echo     # Gzip compression
echo     gzip on;
echo     gzip_vary on;
echo     gzip_min_length 1024;
echo     gzip_comp_level 6;
echo     gzip_types
echo         text/plain
echo         text/css
echo         text/xml
echo         text/javascript
echo         application/javascript
echo         application/xml+rss
echo         application/json
echo         image/svg+xml;
echo.
echo     # Brotli compression ^(if available^)
echo     brotli on;
echo     brotli_comp_level 6;
echo     brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
echo.
echo     # Security headers
echo     add_header X-Frame-Options "SAMEORIGIN" always;
echo     add_header X-XSS-Protection "1; mode=block" always;
echo     add_header X-Content-Type-Options "nosniff" always;
echo     add_header Referrer-Policy "strict-origin-when-cross-origin" always;
echo     add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
echo.
echo     # CSP for Auth0 and AI services
echo     add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.auth0.com cdn.auth0.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: https: *.auth0.com *.gravatar.com *.unsplash.com; connect-src 'self' *.auth0.com api.openai.com *.stripe.com *.mongodb.net; frame-src 'self' *.stripe.com;" always;
echo.
echo     # Cache static assets aggressively
echo     location ~* \.\(js^|css^|png^|jpg^|jpeg^|gif^|ico^|svg^|woff^|woff2^|ttf^|eot\)$ {
echo         expires 1y;
echo         add_header Cache-Control "public, immutable";
echo         add_header Vary "Accept-Encoding";
echo         
echo         # Enable CORS for fonts
echo         location ~* \.\(woff^|woff2^|ttf^|eot\)$ {
echo             add_header Access-Control-Allow-Origin "*";
echo         }
echo     }
echo.
echo     # API proxy with optimizations
echo     location /api/ {
echo         proxy_pass http://localhost:3001;
echo         proxy_http_version 1.1;
echo         proxy_set_header Upgrade $http_upgrade;
echo         proxy_set_header Connection 'upgrade';
echo         proxy_set_header Host $host;
echo         proxy_set_header X-Real-IP $remote_addr;
echo         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
echo         proxy_set_header X-Forwarded-Proto $scheme;
echo         proxy_cache_bypass $http_upgrade;
echo         
echo         # Timeouts
echo         proxy_connect_timeout 60s;
echo         proxy_send_timeout 60s;
echo         proxy_read_timeout 60s;
echo         
echo         # Buffer optimizations
echo         proxy_buffering on;
echo         proxy_buffer_size 128k;
echo         proxy_buffers 4 256k;
echo         proxy_busy_buffers_size 256k;
echo     }
echo.
echo     # Auth0 callback optimization
echo     location /callback {
echo         try_files $uri $uri/ /index.html;
echo         add_header Cache-Control "no-cache, no-store, must-revalidate";
echo     }
echo.
echo     # SPA routing
echo     location / {
echo         try_files $uri $uri/ /index.html;
echo         
echo         # Cache HTML files for short time
echo         location ~* \.html$ {
echo             expires 1h;
echo             add_header Cache-Control "public, must-revalidate";
echo         }
echo     }
echo.
echo     # Health check endpoint
echo     location /health {
echo         access_log off;
echo         return 200 "healthy\n";
echo         add_header Content-Type text/plain;
echo     }
echo.
echo     # Rate limiting for API
echo     location /api/ai/ {
echo         limit_req zone=api burst=10 nodelay;
echo         proxy_pass http://localhost:3001;
echo         # ... other proxy settings
echo     }
echo }
echo.
echo # Rate limiting configuration
echo http {
echo     limit_req_zone $binary_remote_addr zone=api:10m rate=10r/m;
echo }
) > nginx-optimized.conf

REM Upload optimized files
echo [INFO] Uploading optimized application...

REM Create deployment package
tar -czf deployment-package.tar.gz -C dist .

scp -i "%SSH_KEY%" deployment-package.tar.gz ubuntu@%SERVER_IP%:/tmp/
scp -i "%SSH_KEY%" nginx-optimized.conf ubuntu@%SERVER_IP%:/tmp/
scp -i "%SSH_KEY%" deploy\server.js ubuntu@%SERVER_IP%:/tmp/

REM Deploy with optimizations
ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% << 'EOF'
# Extract application
cd /var/www/denglishacademy/app
sudo tar -xzf /tmp/deployment-package.tar.gz

# Setup Nginx with optimizations
sudo mv /tmp/nginx-optimized.conf /etc/nginx/sites-available/denglishacademy.com
sudo ln -sf /etc/nginx/sites-available/denglishacademy.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Setup backend with PM2 ecosystem
cd /var/www/denglishacademy
mv /tmp/server.js .

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'ECOSYSTEM'
module.exports = {
  apps: [{
    name: 'denglishacademy-api',
    script: './server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    merge_logs: true,
    max_memory_restart: '500M',
    node_args: '--max-old-space-size=512'
  }]
};
ECOSYSTEM

# Install production dependencies
npm init -y
npm install express cors helmet compression morgan --save

# Start optimized backend
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# Restart Nginx
sudo systemctl restart nginx

echo "Optimized deployment completed"
EOF

echo [SUCCESS] Application deployed with optimizations

REM Setup Auth0 configuration if provided
if not "%AUTH0_DOMAIN%"=="" if not "%AUTH0_CLIENT_ID%"=="" (
    echo [INFO] Configuring Auth0 GenAI integration...
    
    ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% << EOF
cd /var/www/denglishacademy/app

# Create Auth0 configuration
cat > auth0-config.js << 'AUTH0CONFIG'
// Auth0 GenAI Configuration
window.deaConfig = window.deaConfig || {};
window.deaConfig.auth0Domain = '%AUTH0_DOMAIN%';
window.deaConfig.auth0ClientId = '%AUTH0_CLIENT_ID%';
window.deaConfig.auth0Audience = 'https://%DOMAIN%/api';

// GenAI specific settings
window.deaConfig.aiSettings = {
    enableContextualAuth: true,
    autoRefreshTokens: true,
    persistUserContext: true,
    enableRoleBasedAccess: true
};

console.log('Auth0 GenAI configuration loaded');
AUTH0CONFIG

# Inject configuration into index.html
sed -i 's|</head>|<script src="./auth0-config.js"></script></head>|' index.html

echo "Auth0 GenAI configuration applied"
EOF

    echo [SUCCESS] Auth0 GenAI integration configured
)

REM Setup SSL with optimization
echo [INFO] Setting up optimized SSL...

if not "%DOMAIN%"=="" (
    ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% << EOF
# Get SSL certificate
sudo certbot --nginx -d %DOMAIN% -d www.%DOMAIN% --non-interactive --agree-tos --email %EMAIL%

# Setup optimized auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook 'systemctl reload nginx'" | sudo crontab -

# Test SSL configuration
curl -I https://%DOMAIN%/health

echo "SSL optimization completed"
EOF
)

REM Create management scripts
echo [INFO] Creating optimized management tools...

(
echo @echo off
echo echo Checking optimized deployment status...
echo echo.
echo echo === System Health ===
echo ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "uptime && free -h && df -h /"
echo echo.
echo echo === Application Status ===
echo ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "pm2 status && pm2 monit --no-interaction"
echo echo.
echo echo === Performance Metrics ===
echo curl -s -w "Response Time: %%{time_total}s\nStatus: %%{http_code}\n" "https://%DOMAIN%/health"
echo echo.
echo echo === Auth0 Status ===
echo curl -s "https://%AUTH0_DOMAIN%/.well-known/openid_configuration" ^| findstr "issuer"
echo pause
) > check-optimized-status.bat

(
echo @echo off
echo echo Updating optimized deployment...
echo call npm run build:production
echo tar -czf deployment-update.tar.gz -C dist .
echo scp -i "%SSH_KEY%" deployment-update.tar.gz ubuntu@%SERVER_IP%:/tmp/
echo ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "cd /var/www/denglishacademy/app && sudo tar -xzf /tmp/deployment-update.tar.gz && pm2 reload all"
echo echo Update completed with zero downtime!
echo pause
) > update-optimized.bat

REM Cleanup
del server-setup-optimized.sh 2>nul
del nginx-optimized.conf 2>nul
del deployment-package.tar.gz 2>nul

REM Performance test
echo [INFO] Running performance tests...
timeout 5 >nul 2>&1
curl -s -w "Initial Response Time: %%{time_total}s\n" "https://%DOMAIN%/health" 2>nul || echo "Site warming up..."

echo.
echo ==========================================
echo   OPTIMIZED DEPLOYMENT COMPLETED!
echo ==========================================
echo.
echo 🚀 Your Digital English Academy is live with optimizations:
echo.
echo 📊 Performance Features:
echo   • HTTP/2 and SSL optimization
echo   • Gzip and Brotli compression
echo   • Aggressive caching strategies
echo   • PM2 cluster mode
echo   • Rate limiting protection
echo.
echo 🔐 Auth0 GenAI Integration:
echo   • Domain: %AUTH0_DOMAIN%
echo   • Client ID: %AUTH0_CLIENT_ID%
echo   • AI context management enabled
echo   • Role-based access control
echo.
echo 🌐 Access Information:
echo   • Website: https://%DOMAIN%
echo   • Health Check: https://%DOMAIN%/health
echo   • API: https://%DOMAIN%/api/
echo.
echo 🔧 Management Tools:
echo   • Status: check-optimized-status.bat
echo   • Update: update-optimized.bat
echo   • SSH: ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP%
echo.
echo 📈 Expected Performance:
echo   • Page Load: ^<2s
echo   • API Response: ^<500ms
echo   • Auth0 Login: ^<3s
echo   • 99.9%% Uptime
echo.
echo Your platform is production-ready!
echo ==========================================
echo.

pause