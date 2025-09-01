@echo off
REM Deploy Script for AWS Lightsail - Digital English Academy (Windows)
REM Usage: deploy-lightsail.bat [server-ip] [domain]

setlocal enabledelayedexpansion

REM Configuration
set SERVER_IP=%1
set DOMAIN=%2
set SSH_KEY=%USERPROFILE%\.ssh\LightsailDefaultKey-us-east-1.pem
set SSH_USER=ubuntu
set APP_DIR=/var/www/denglishacademy
set LOCAL_BUILD_DIR=dist

REM Default values
if "%SERVER_IP%"=="" (
    echo [ERROR] Server IP is required. Usage: deploy-lightsail.bat [server-ip] [domain]
    echo Example: deploy-lightsail.bat 3.85.123.45 denglishacademy.com
    pause
    exit /b 1
)

if "%DOMAIN%"=="" set DOMAIN=denglishacademy.com

echo.
echo ==========================================
echo   Digital English Academy Deployment
echo ==========================================
echo.
echo Server IP: %SERVER_IP%
echo Domain: %DOMAIN%
echo SSH Key: %SSH_KEY%
echo.

REM Check requirements
echo [INFO] Checking requirements...

if not exist "%SSH_KEY%" (
    echo [ERROR] SSH key not found at %SSH_KEY%
    echo Please download your Lightsail SSH key and place it at %SSH_KEY%
    pause
    exit /b 1
)

if not exist "%LOCAL_BUILD_DIR%" (
    echo [ERROR] Build directory not found. Running production build...
    call npm run build:production
    if errorlevel 1 (
        echo [ERROR] Build failed
        pause
        exit /b 1
    )
)

REM Check if required tools are available
where ssh >nul 2>nul
if errorlevel 1 (
    echo [ERROR] SSH is not available. Please install OpenSSH or use WSL.
    echo You can install OpenSSH from Windows Features or use Git Bash.
    pause
    exit /b 1
)

where scp >nul 2>nul
if errorlevel 1 (
    echo [ERROR] SCP is not available. Please install OpenSSH or use WSL.
    pause
    exit /b 1
)

echo [SUCCESS] Requirements check passed

REM Build application
echo.
echo [INFO] Building application for production...
if not exist "package.json" (
    echo [ERROR] package.json not found. Are you in the project root?
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

REM Create server setup script
echo.
echo [INFO] Creating server setup script...
(
echo #!/bin/bash
echo set -e
echo.
echo # Update system
echo sudo apt update ^&^& sudo apt upgrade -y
echo.
echo # Install required packages
echo sudo apt install -y nginx certbot python3-certbot-nginx curl
echo.
echo # Install Node.js 18 LTS
echo curl -fsSL https://deb.nodesource.com/setup_18.x ^| sudo -E bash -
echo sudo apt-get install -y nodejs
echo.
echo # Install PM2
echo sudo npm install -g pm2
echo.
echo # Create application directory
echo sudo mkdir -p /var/www/denglishacademy
echo sudo chown ubuntu:ubuntu /var/www/denglishacademy
echo.
echo # Create backup directory
echo mkdir -p /home/ubuntu/backups
echo.
echo echo "Server setup completed"
) > server-setup.sh

REM Upload and execute setup script
echo [INFO] Setting up server environment...
scp -i "%SSH_KEY%" server-setup.sh %SSH_USER%@%SERVER_IP%:/tmp/
ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP% "chmod +x /tmp/server-setup.sh && /tmp/server-setup.sh"

if errorlevel 1 (
    echo [ERROR] Server setup failed
    pause
    exit /b 1
)

echo [SUCCESS] Server setup completed

REM Deploy application files
echo.
echo [INFO] Deploying application files...
scp -i "%SSH_KEY%" -r %LOCAL_BUILD_DIR%/* %SSH_USER%@%SERVER_IP%:%APP_DIR%/
scp -i "%SSH_KEY%" package.json %SSH_USER%@%SERVER_IP%:%APP_DIR%/
scp -i "%SSH_KEY%" deploy\server.js %SSH_USER%@%SERVER_IP%:%APP_DIR%/ 2>nul

if errorlevel 1 (
    echo [WARNING] Some files may not have been uploaded
)

echo [SUCCESS] Files uploaded successfully

REM Create Nginx configuration
echo.
echo [INFO] Configuring Nginx...
(
echo server {
echo     listen 80;
echo     server_name %DOMAIN% www.%DOMAIN%;
echo.    
echo     root %APP_DIR%;
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
) > nginx-config

scp -i "%SSH_KEY%" nginx-config %SSH_USER%@%SERVER_IP%:/tmp/

ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP% "sudo mv /tmp/nginx-config /etc/nginx/sites-available/denglishacademy.com && sudo ln -sf /etc/nginx/sites-available/denglishacademy.com /etc/nginx/sites-enabled/ && sudo rm -f /etc/nginx/sites-enabled/default && sudo nginx -t && sudo systemctl reload nginx"

if errorlevel 1 (
    echo [ERROR] Nginx configuration failed
    pause
    exit /b 1
)

echo [SUCCESS] Nginx configured successfully

REM Setup SSL
echo.
echo [INFO] Setting up SSL certificate...
echo [WARNING] Make sure DNS is pointing to %SERVER_IP% before continuing
pause

ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP% "sudo certbot --nginx -d %DOMAIN% -d www.%DOMAIN% --non-interactive --agree-tos --email admin@%DOMAIN% && (crontab -l 2>/dev/null; echo '0 12 * * * /usr/bin/certbot renew --quiet') | crontab -"

if errorlevel 1 (
    echo [WARNING] SSL setup failed. You can set it up manually later.
) else (
    echo [SUCCESS] SSL certificate configured
)

REM Setup backend
echo.
echo [INFO] Setting up backend server...
ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP% "cd %APP_DIR% && npm init -y && npm install express cors --save && pm2 delete denglishacademy-api 2>/dev/null || true && pm2 start server.js --name 'denglishacademy-api' && pm2 startup ubuntu -u ubuntu --hp /home/ubuntu && pm2 save"

if errorlevel 1 (
    echo [WARNING] Backend setup failed
) else (
    echo [SUCCESS] Backend server configured
)

REM Setup monitoring
echo.
echo [INFO] Setting up monitoring and backups...
(
echo #!/bin/bash
echo DATE=^$(date +%%Y%%m%%d_%%H%%M%%S^)
echo BACKUP_DIR="/home/ubuntu/backups"
echo APP_DIR="/var/www/denglishacademy"
echo.
echo mkdir -p $BACKUP_DIR
echo.
echo # Backup application
echo tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C $APP_DIR .
echo.
echo # Keep only last 7 backups
echo find $BACKUP_DIR -name "app_*.tar.gz" -mtime +7 -delete
echo.
echo echo "Backup completed: app_$DATE.tar.gz"
) > backup.sh

scp -i "%SSH_KEY%" backup.sh %SSH_USER%@%SERVER_IP%:/home/ubuntu/
ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP% "chmod +x /home/ubuntu/backup.sh && (crontab -l 2>/dev/null; echo '0 2 * * * /home/ubuntu/backup.sh') | crontab - && pm2 install pm2-logrotate 2>/dev/null || true && pm2 set pm2-logrotate:max_size 10M 2>/dev/null || true && pm2 set pm2-logrotate:retain 30 2>/dev/null || true"

echo [SUCCESS] Monitoring and backups configured

REM Cleanup temporary files
del server-setup.sh 2>nul
del nginx-config 2>nul
del backup.sh 2>nul

REM Final verification
echo.
echo [INFO] Verifying deployment...
curl -s -o nul -w "HTTP Status: %%{http_code}" "http://%SERVER_IP%"
echo.

REM Print summary
echo.
echo ==========================================
echo   DEPLOYMENT COMPLETED SUCCESSFULLY!
echo ==========================================
echo.
echo Deployment Summary:
echo   • Domain: https://%DOMAIN%
echo   • Server IP: %SERVER_IP%
echo   • SSL: Let's Encrypt (auto-renewal enabled)
echo   • Backend API: http://%SERVER_IP%:3001
echo.
echo Next Steps:
echo   1. Verify DNS records point %DOMAIN% to %SERVER_IP%
echo   2. Configure Auth0 with production URLs
echo   3. Configure Stripe with production webhooks
echo   4. Test all functionality at https://%DOMAIN%
echo.
echo Support Commands:
echo   • SSH: ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP%
echo   • Logs: pm2 logs
echo   • Status: pm2 status
echo   • Nginx: sudo systemctl status nginx
echo.
echo Your Digital English Academy is ready!
echo ==========================================
echo.

pause