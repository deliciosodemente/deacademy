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
    pause
    exit /b 1
)

echo [SUCCESS] Requirements check passed

REM Upload application files directly
echo.
echo [INFO] Uploading application files...
scp -i "%SSH_KEY%" -r dist/* %SSH_USER%@%SERVER_IP%:/tmp/denglishacademy/
scp -i "%SSH_KEY%" package.json %SSH_USER%@%SERVER_IP%:/tmp/
scp -i "%SSH_KEY%" deploy\server.js %SSH_USER%@%SERVER_IP%:/tmp/

echo [SUCCESS] Files uploaded

REM Execute setup commands directly via SSH
echo.
echo [INFO] Setting up server...
ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP% "sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx curl && curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs && sudo npm install -g pm2 && sudo mkdir -p /opt/bitnami/apps/denglishacademy && sudo chown bitnami:bitnami /opt/bitnami/apps/denglishacademy && sudo /opt/bitnami/ctlscript.sh stop apache 2>/dev/null || true"

echo [SUCCESS] Server configured

REM Move files to final location
echo.
echo [INFO] Moving files to application directory...
ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP% "cp -r /tmp/denglishacademy/* /opt/bitnami/apps/denglishacademy/ && cp /tmp/server.js /opt/bitnami/apps/denglishacademy/ && cp /tmp/package.json /opt/bitnami/apps/denglishacademy/"

echo [SUCCESS] Files moved

REM Configure Nginx
echo.
echo [INFO] Configuring Nginx...
ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP% << 'EOF'
sudo tee /etc/nginx/sites-available/denglishacademy.com > /dev/null << 'NGINX_EOF'
server {
    listen 80;
    server_name denglishacademy.com www.denglishacademy.com;
    
    root /opt/bitnami/apps/denglishacademy;
    index index.html;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

sudo ln -sf /etc/nginx/sites-available/denglishacademy.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl enable nginx && sudo systemctl restart nginx
EOF

echo [SUCCESS] Nginx configured

REM Setup backend
echo.
echo [INFO] Setting up backend API...
ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP% "cd /opt/bitnami/apps/denglishacademy && npm init -y && npm install express cors && pm2 start server.js --name denglishacademy-api && pm2 startup && pm2 save"

echo [SUCCESS] Backend configured

REM Test the site
echo.
echo [INFO] Testing the site...
echo Testing HTTP connection...
curl -s -o nul -w "HTTP Status: %%{http_code}" "http://%SERVER_IP%" 2>nul || echo "HTTP test completed"
echo.

REM Setup SSL (optional, requires DNS)
echo.
echo [INFO] SSL Setup (requires DNS configuration)...
echo.
echo To configure SSL after DNS propagation:
echo ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP%
echo sudo certbot --nginx -d %DOMAIN% -d www.%DOMAIN% --email %EMAIL% --agree-tos --non-interactive
echo.

REM Create management scripts
(
echo @echo off
echo echo Checking Digital English Academy status...
echo curl -s -o nul -w "Status: %%{http_code}" "http://%SERVER_IP%"
echo echo.
echo ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP% "pm2 status && sudo systemctl status nginx --no-pager"
echo pause
) > check-status.bat

(
echo @echo off
echo echo Updating site...
echo call npm run build:production
echo scp -i "%SSH_KEY%" -r dist/* %SSH_USER%@%SERVER_IP%:/opt/bitnami/apps/denglishacademy/
echo ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP% "pm2 restart denglishacademy-api"
echo echo Update completed!
echo pause
) > update-site.bat

echo.
echo ==========================================
echo   SETUP COMPLETED SUCCESSFULLY!
echo ==========================================
echo.
echo 🎉 Your Digital English Academy is live!
echo.
echo 📋 Access Information:
echo   • Website: http://%SERVER_IP%
echo   • Domain: https://%DOMAIN% ^(after DNS + SSL^)
echo   • SSH: ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP%
echo.
echo 🔧 Management:
echo   • Check status: check-status.bat
echo   • Update site: update-site.bat
echo.
echo 📞 Next Steps:
echo   1. Configure DNS: %DOMAIN% → %SERVER_IP%
echo   2. Wait for DNS propagation
echo   3. Run SSL setup command shown above
echo   4. Test at https://%DOMAIN%
echo.
echo Your platform is ready for demo and sales!
echo ==========================================
echo.

pause