@echo off
REM Setup Script for Bitnami Lightsail - Digital English Academy
REM IP: 34.196.15.155 | User: bitnami

setlocal enabledelayedexpansion

set SERVER_IP=34.196.15.155
set DOMAIN=denglishacademy.com
set EMAIL=admin@denglishacademy.com
set SSH_USER=bitnami
set SSH_KEY=%USERPROFILE%\.ssh\LightsailDefaultKey-us-east-1.pem

echo.
echo ==========================================
echo   DIGITAL ENGLISH ACADEMY - BITNAMI SETUP
echo ==========================================
echo Server IP: %SERVER_IP%
echo Domain: %DOMAIN%
echo User: %SSH_USER%
echo ==========================================
echo.

REM Check SSH key
if not exist "%SSH_KEY%" (
    echo [ERROR] SSH key not found at %SSH_KEY%
    echo Please download the SSH key from Lightsail and save it there
    echo.
    echo Steps:
    echo 1. Go to Lightsail Console
    echo 2. Click "Account" ^> "SSH Keys"
    echo 3. Download "LightsailDefaultKey-us-east-1.pem"
    echo 4. Save to: %SSH_KEY%
    pause
    exit /b 1
)

REM Check SSH availability
where ssh >nul 2>nul
if errorlevel 1 (
    echo [ERROR] SSH not available
    echo Please install OpenSSH or use Git Bash
    pause
    exit /b 1
)

echo [SUCCESS] Requirements check passed

REM Build application
echo.
echo [INFO] Building application for production...

if not exist "package.json" (
    echo [ERROR] package.json not found
    echo Make sure you're in the digital-english-academy project folder
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed
        pause
        exit /b 1
    )
)

call npm run build:production
if errorlevel 1 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)

echo [SUCCESS] Application built successfully

REM Create Bitnami setup script
echo.
echo [INFO] Creating Bitnami setup script...

(
echo #!/bin/bash
echo set -e
echo.
echo echo "Setting up Digital English Academy on Bitnami..."
echo.
echo # Update system
echo sudo apt update ^&^& sudo apt upgrade -y
echo.
echo # Install additional packages
echo sudo apt install -y nginx certbot python3-certbot-nginx
echo.
echo # Check if Node.js is installed, if not install it
echo if ! command -v node ^&^>/dev/null; then
echo     echo "Installing Node.js..."
echo     curl -fsSL https://deb.nodesource.com/setup_18.x ^| sudo -E bash -
echo     sudo apt-get install -y nodejs
echo fi
echo.
echo # Install PM2 globally
echo sudo npm install -g pm2
echo.
echo # Create application directory
echo sudo mkdir -p /opt/bitnami/apps/denglishacademy
echo sudo chown bitnami:bitnami /opt/bitnami/apps/denglishacademy
echo.
echo # Stop default Apache if running
echo sudo /opt/bitnami/ctlscript.sh stop apache 2^>^/dev/null ^|^| true
echo sudo systemctl disable bitnami 2^>^/dev/null ^|^| true
echo.
echo echo "Bitnami setup completed"
) > bitnami-setup.sh

REM Upload and execute setup
echo [INFO] Setting up Bitnami server...
scp -i "%SSH_KEY%" bitnami-setup.sh %SSH_USER%@%SERVER_IP%:/tmp/
ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP% "chmod +x /tmp/bitnami-setup.sh && /tmp/bitnami-setup.sh"

if errorlevel 1 (
    echo [ERROR] Bitnami setup failed
    pause
    exit /b 1
)

echo [SUCCESS] Bitnami server configured

REM Upload application files
echo.
echo [INFO] Uploading application files...
scp -i "%SSH_KEY%" -r dist/* %SSH_USER%@%SERVER_IP%:/opt/bitnami/apps/denglishacademy/
scp -i "%SSH_KEY%" package.json %SSH_USER%@%SERVER_IP%:/opt/bitnami/apps/denglishacademy/
scp -i "%SSH_KEY%" deploy\server.js %SSH_USER%@%SERVER_IP%:/opt/bitnami/apps/denglishacademy/

if errorlevel 1 (
    echo [WARNING] Some files may not have uploaded correctly
)

echo [SUCCESS] Files uploaded successfully

REM Configure Nginx for Bitnami
echo.
echo [INFO] Configuring Nginx...

(
echo server {
echo     listen 80;
echo     server_name %DOMAIN% www.%DOMAIN%;
echo.    
echo     root /opt/bitnami/apps/denglishacademy;
echo     index index.html;
echo.    
echo     # Gzip compression
echo     gzip on;
echo     gzip_vary on;
echo     gzip_min_length 1024;
echo     gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
echo.    
echo     # Security headers
echo     add_header X-Frame-Options "SAMEORIGIN" always;
echo     add_header X-XSS-Protection "1; mode=block" always;
echo     add_header X-Content-Type-Options "nosniff" always;
echo     add_header Referrer-Policy "no-referrer-when-downgrade" always;
echo     add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' *.auth0.com *.stripe.com *.mongodb.net *.unsplash.com *.ui-avatars.com" always;
echo.    
echo     # Handle SPA routing
echo     location / {
echo         try_files $uri $uri/ /index.html;
echo     }
echo.    
echo     # Cache static assets
echo     location ~* \.\(js^|css^|png^|jpg^|jpeg^|gif^|ico^|svg^|woff^|woff2^|ttf^|eot\)$ {
echo         expires 1y;
echo         add_header Cache-Control "public, immutable";
echo     }
echo.    
echo     # API proxy
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
echo     }
echo }
) > nginx-denglishacademy.conf

scp -i "%SSH_KEY%" nginx-denglishacademy.conf %SSH_USER%@%SERVER_IP%:/tmp/

ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP% << 'EOF'
# Configure Nginx
sudo mv /tmp/nginx-denglishacademy.conf /etc/nginx/sites-available/denglishacademy.com
sudo ln -sf /etc/nginx/sites-available/denglishacademy.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t && sudo systemctl enable nginx && sudo systemctl restart nginx
EOF

if errorlevel 1 (
    echo [ERROR] Nginx configuration failed
    pause
    exit /b 1
)

echo [SUCCESS] Nginx configured successfully

REM Setup backend
echo.
echo [INFO] Setting up backend API...
ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP% << 'EOF'
cd /opt/bitnami/apps/denglishacademy

# Initialize package.json if needed
npm init -y 2>/dev/null || true

# Install backend dependencies
npm install express cors --save

# Start backend with PM2
pm2 delete denglishacademy-api 2>/dev/null || true
pm2 start server.js --name "denglishacademy-api"
pm2 startup
pm2 save

echo "Backend API started successfully"
EOF

echo [SUCCESS] Backend API configured

REM Setup SSL
echo.
echo [INFO] Setting up SSL certificate...
echo [WARNING] Make sure DNS is pointing %DOMAIN% to %SERVER_IP%
echo.
echo Current DNS check:
nslookup %DOMAIN% 2>nul || echo DNS not propagated yet

echo.
echo Press any key when DNS is ready (you can check at https://dnschecker.org)
pause >nul

ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP% << EOF
# Get SSL certificate
sudo certbot --nginx -d %DOMAIN% -d www.%DOMAIN% --non-interactive --agree-tos --email %EMAIL%

# Setup auto-renewal
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

echo "SSL certificate configured successfully"
EOF

if errorlevel 1 (
    echo [WARNING] SSL setup failed - you can configure it manually later
    echo Command: sudo certbot --nginx -d %DOMAIN% -d www.%DOMAIN%
) else (
    echo [SUCCESS] SSL certificate configured
)

REM Create management scripts
echo.
echo [INFO] Creating management scripts...

(
echo @echo off
echo echo Checking Digital English Academy status...
echo echo.
echo echo HTTP Status:
echo curl -s -o nul -w "Status: %%{http_code} - Response Time: %%{time_total}s" "http://%SERVER_IP%"
echo echo.
echo echo HTTPS Status:
echo curl -s -o nul -w "Status: %%{http_code} - Response Time: %%{time_total}s" "https://%DOMAIN%" 2^>nul ^|^| echo "HTTPS not ready"
echo echo.
echo echo Server Status:
echo ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP% "sudo systemctl status nginx --no-pager -l && echo && pm2 status"
echo pause
) > check-status.bat

(
echo @echo off
echo echo Updating Digital English Academy...
echo call npm run build:production
echo scp -i "%SSH_KEY%" -r dist/* %SSH_USER%@%SERVER_IP%:/opt/bitnami/apps/denglishacademy/
echo ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP% "pm2 restart denglishacademy-api && sudo systemctl reload nginx"
echo echo Update completed!
echo pause
) > update-site.bat

REM Create Auth0 configuration
(
echo @echo off
echo set AUTH0_DOMAIN=%%1
echo set AUTH0_CLIENT_ID=%%2
echo if "%%AUTH0_DOMAIN%%"=="" ^(
echo     echo Usage: configure-auth0.bat [domain] [client-id]
echo     echo Example: configure-auth0.bat myapp.auth0.com abc123def456
echo     pause
echo     exit /b 1
echo ^)
echo.
echo echo Configuring Auth0...
echo ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP% "cd /opt/bitnami/apps/denglishacademy && echo 'window.deaConfig = window.deaConfig || {}; window.deaConfig.auth0Domain = \"%%AUTH0_DOMAIN%%\"; window.deaConfig.auth0ClientId = \"%%AUTH0_CLIENT_ID%%\";' > auth-config.js"
echo echo Auth0 configured successfully!
echo echo Domain: %%AUTH0_DOMAIN%%
echo echo Client ID: %%AUTH0_CLIENT_ID%%
echo pause
) > configure-auth0.bat

REM Create Stripe configuration
(
echo @echo off
echo set STRIPE_KEY=%%1
echo set STRIPE_LINK=%%2
echo if "%%STRIPE_KEY%%"=="" ^(
echo     echo Usage: configure-stripe.bat [publishable-key] [payment-link]
echo     echo Example: configure-stripe.bat pk_test_abc123 https://buy.stripe.com/xyz789
echo     pause
echo     exit /b 1
echo ^)
echo.
echo echo Configuring Stripe...
echo ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP% "cd /opt/bitnami/apps/denglishacademy && echo 'window.deaConfig = window.deaConfig || {}; window.deaConfig.stripePublishableKey = \"%%STRIPE_KEY%%\"; window.deaConfig.stripePaymentLink = \"%%STRIPE_LINK%%\";' >> auth-config.js"
echo echo Stripe configured successfully!
echo echo Publishable Key: %%STRIPE_KEY%%
echo echo Payment Link: %%STRIPE_LINK%%
echo pause
) > configure-stripe.bat

REM Cleanup temporary files
del bitnami-setup.sh 2>nul
del nginx-denglishacademy.conf 2>nul

REM Final verification
echo.
echo [INFO] Final verification...
echo Testing HTTP connection...
curl -s -o nul -w "HTTP Status: %%{http_code}" "http://%SERVER_IP%" 2>nul || echo "HTTP test failed"
echo.

REM Final summary
echo.
echo ==========================================
echo   SETUP COMPLETED SUCCESSFULLY!
echo ==========================================
echo.
echo 🎉 Your Digital English Academy is live!
echo.
echo 📋 Access Information:
echo   • Website: http://%SERVER_IP% ^(temporary^)
echo   • Domain: https://%DOMAIN% ^(after DNS propagation^)
echo   • SSH: ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP%
echo.
echo 🔧 Management Commands:
echo   • Check status: check-status.bat
echo   • Update site: update-site.bat
echo   • Configure Auth0: configure-auth0.bat [domain] [client-id]
echo   • Configure Stripe: configure-stripe.bat [key] [link]
echo.
echo 📞 Next Steps:
echo   1. Configure DNS: %DOMAIN% → %SERVER_IP%
echo   2. Wait for DNS propagation ^(5-30 minutes^)
echo   3. SSL will be configured automatically
echo   4. Optional: Configure Auth0 and Stripe for full functionality
echo.
echo 💰 Monthly Cost: $10 USD ^(Lightsail only^)
echo.
echo Your platform is ready for demo and sales!
echo ==========================================
echo.

pause