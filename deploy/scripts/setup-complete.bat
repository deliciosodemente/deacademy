@echo off
REM Complete Setup Script for Digital English Academy (Windows)
REM Usage: setup-complete.bat [server-ip] [domain] [email]

setlocal enabledelayedexpansion

REM Configuration
set SERVER_IP=%1
set DOMAIN=%2
set EMAIL=%3
set SSH_KEY=%USERPROFILE%\.ssh\LightsailDefaultKey-us-east-1.pem

REM Default values
if "%SERVER_IP%"=="" (
    echo [ERROR] Server IP is required
    echo Usage: setup-complete.bat [server-ip] [domain] [email]
    echo Example: setup-complete.bat 3.85.123.45 denglishacademy.com admin@denglishacademy.com
    pause
    exit /b 1
)

if "%DOMAIN%"=="" set DOMAIN=denglishacademy.com
if "%EMAIL%"=="" set EMAIL=admin@denglishacademy.com

echo.
echo ==========================================
echo   COMPLETE SETUP - DIGITAL ENGLISH ACADEMY
echo ==========================================
echo Server IP: %SERVER_IP%
echo Domain: %DOMAIN%
echo Email: %EMAIL%
echo ==========================================
echo.

REM Check requirements
echo [INFO] Checking requirements...

if not exist "%SSH_KEY%" (
    echo [ERROR] SSH key not found at %SSH_KEY%
    echo Please download your Lightsail SSH key and place it there
    pause
    exit /b 1
)

where ssh >nul 2>nul
if errorlevel 1 (
    echo [ERROR] SSH not available. Please install OpenSSH or use Git Bash
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
echo # Install packages
echo sudo apt install -y nginx certbot python3-certbot-nginx curl
echo.
echo # Install Node.js 18
echo curl -fsSL https://deb.nodesource.com/setup_18.x ^| sudo -E bash -
echo sudo apt-get install -y nodejs
echo.
echo # Install PM2
echo sudo npm install -g pm2
echo.
echo # Create app directory
echo sudo mkdir -p /var/www/denglishacademy
echo sudo chown ubuntu:ubuntu /var/www/denglishacademy
echo.
echo echo "Server setup completed"
) > server-setup.sh

REM Upload and execute setup
echo [INFO] Setting up server...
scp -i "%SSH_KEY%" server-setup.sh %SSH_USER%@%SERVER_IP%:/tmp/
ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "chmod +x /tmp/server-setup.sh && /tmp/server-setup.sh"

echo [SUCCESS] Server setup completed

REM Upload application files
echo.
echo [INFO] Uploading application files...
scp -i "%SSH_KEY%" -r dist/* ubuntu@%SERVER_IP%:/var/www/denglishacademy/
scp -i "%SSH_KEY%" package.json ubuntu@%SERVER_IP%:/var/www/denglishacademy/
scp -i "%SSH_KEY%" deploy\server.js ubuntu@%SERVER_IP%:/var/www/denglishacademy/

echo [SUCCESS] Files uploaded

REM Configure Nginx
echo.
echo [INFO] Configuring Nginx...

(
echo server {
echo     listen 80;
echo     server_name %DOMAIN% www.%DOMAIN%;
echo     root /var/www/denglishacademy/dist;
echo     index index.html;
echo     gzip on;
echo     gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
echo     location / {
echo         try_files $uri $uri/ /index.html;
echo     }
echo     location ~* \.\(js^|css^|png^|jpg^|jpeg^|gif^|ico^|svg^|woff^|woff2\)$ {
echo         expires 1y;
echo         add_header Cache-Control "public, immutable";
echo     }
echo     location /api/ {
echo         proxy_pass http://localhost:3001;
echo         proxy_set_header Host $host;
echo         proxy_set_header X-Real-IP $remote_addr;
echo         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
echo         proxy_set_header X-Forwarded-Proto $scheme;
echo     }
echo }
) > nginx-config

scp -i "%SSH_KEY%" nginx-config ubuntu@%SERVER_IP%:/tmp/
ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo mv /tmp/nginx-config /etc/nginx/sites-available/denglishacademy.com && sudo ln -sf /etc/nginx/sites-available/denglishacademy.com /etc/nginx/sites-enabled/ && sudo rm -f /etc/nginx/sites-enabled/default && sudo nginx -t && sudo systemctl reload nginx"

echo [SUCCESS] Nginx configured

REM Setup SSL
echo.
echo [INFO] Setting up SSL certificate...
echo [WARNING] Make sure DNS points %DOMAIN% to %SERVER_IP%
echo Press any key when DNS is ready...
pause >nul

ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "sudo certbot --nginx -d %DOMAIN% -d www.%DOMAIN% --non-interactive --agree-tos --email %EMAIL%"

echo [SUCCESS] SSL configured

REM Setup backend
echo.
echo [INFO] Setting up backend...
ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "cd /var/www/denglishacademy && npm init -y && npm install express cors && pm2 start server.js --name denglishacademy-api && pm2 startup && pm2 save"

echo [SUCCESS] Backend configured

REM Create Auth0 setup instructions
echo.
echo [INFO] Creating setup instructions...

(
echo # Auth0 Setup ^(5 minutes^)
echo.
echo 1. Go to https://auth0.com
echo 2. Create account and new application
echo 3. Type: Single Page Web Applications
echo 4. Configure URLs:
echo    - Callback: https://%DOMAIN%
echo    - Logout: https://%DOMAIN%
echo    - Web Origins: https://%DOMAIN%
echo 5. Copy Domain and Client ID
echo.
echo Then run: configure-auth0.bat [domain] [client-id]
) > AUTH0-SETUP.txt

(
echo @echo off
echo set AUTH0_DOMAIN=%%1
echo set AUTH0_CLIENT_ID=%%2
echo if "%%AUTH0_DOMAIN%%"=="" ^(
echo     echo Usage: configure-auth0.bat [domain] [client-id]
echo     pause
echo     exit /b 1
echo ^)
echo ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "cd /var/www/denglishacademy && echo 'window.deaConfig = {auth0Domain: \"%%AUTH0_DOMAIN%%\", auth0ClientId: \"%%AUTH0_CLIENT_ID%%\"};' > auth-config.js"
echo echo Auth0 configured successfully!
echo pause
) > configure-auth0.bat

REM Create Stripe setup instructions
(
echo # Stripe Setup ^(10 minutes^)
echo.
echo 1. Go to https://stripe.com
echo 2. Create account
echo 3. Get Publishable Key ^(pk_test_...^)
echo 4. Create Payment Link for $29.99/month
echo 5. Copy Payment Link URL
echo.
echo Then run: configure-stripe.bat [publishable-key] [payment-link]
) > STRIPE-SETUP.txt

(
echo @echo off
echo set STRIPE_KEY=%%1
echo set STRIPE_LINK=%%2
echo if "%%STRIPE_KEY%%"=="" ^(
echo     echo Usage: configure-stripe.bat [key] [link]
echo     pause
echo     exit /b 1
echo ^)
echo ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP% "cd /var/www/denglishacademy && echo 'window.deaConfig.stripePublishableKey = \"%%STRIPE_KEY%%\"; window.deaConfig.stripePaymentLink = \"%%STRIPE_LINK%%\";' >> auth-config.js"
echo echo Stripe configured successfully!
echo pause
) > configure-stripe.bat

REM Cleanup
del server-setup.sh 2>nul
del nginx-config 2>nul

REM Final summary
echo.
echo ==========================================
echo   SETUP COMPLETED SUCCESSFULLY!
echo ==========================================
echo.
echo Your Digital English Academy is live at:
echo https://%DOMAIN%
echo.
echo Next Steps ^(Optional - for full functionality^):
echo 1. Read AUTH0-SETUP.txt and run configure-auth0.bat
echo 2. Read STRIPE-SETUP.txt and run configure-stripe.bat
echo.
echo Management:
echo - SSH: ssh -i "%SSH_KEY%" ubuntu@%SERVER_IP%
echo - Update: Upload new files and restart PM2
echo.
echo Your site is ready for demo and sales!
echo ==========================================
echo.

pause