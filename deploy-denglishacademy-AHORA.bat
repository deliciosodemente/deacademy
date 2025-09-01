@echo off
REM ========================================
REM   DEPLOY INMEDIATO - DIGITAL ENGLISH ACADEMY
REM   IP: 34.196.15.155 | Dominio: denglishacademy.com
REM ========================================

setlocal enabledelayedexpansion

set SERVER_IP=34.196.15.155
set DOMAIN=denglishacademy.com
set SSH_USER=bitnami
set SSH_KEY=%USERPROFILE%\.ssh\LightsailDefaultKey-us-east-1.pem

echo.
echo 🚀 DESPLEGANDO DIGITAL ENGLISH ACADEMY
echo ==========================================
echo IP: %SERVER_IP%
echo Dominio: %DOMAIN%
echo Usuario: %SSH_USER%
echo ==========================================
echo.

REM Verificar SSH key
if not exist "%SSH_KEY%" (
    echo ❌ SSH key no encontrada en %SSH_KEY%
    echo Descarga la clave desde Lightsail y guárdala ahí
    pause
    exit /b 1
)

echo ✅ SSH key encontrada

REM Build de producción
echo.
echo 📦 Construyendo aplicación...
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install --silent
)

set NODE_ENV=production
call npm run build 2>nul || (
    echo Creando build básico...
    if not exist "dist" mkdir dist
    copy index.html dist\ 2>nul
    copy *.css dist\ 2>nul
    copy *.js dist\ 2>nul
    xcopy /E /I /Q assets dist\assets 2>nul
)

echo ✅ Build completado

REM Configurar servidor
echo.
echo 🔧 Configurando servidor Bitnami...

REM Script de configuración del servidor
(
echo #!/bin/bash
echo set -e
echo echo "Configurando Digital English Academy..."
echo.
echo # Actualizar sistema
echo sudo apt update ^&^& sudo apt upgrade -y
echo.
echo # Instalar dependencias
echo sudo apt install -y nginx certbot python3-certbot-nginx curl
echo.
echo # Instalar Node.js 18
echo curl -fsSL https://deb.nodesource.com/setup_18.x ^| sudo -E bash -
echo sudo apt-get install -y nodejs
echo.
echo # Instalar PM2
echo sudo npm install -g pm2
echo.
echo # Crear directorios
echo sudo mkdir -p /var/www/denglishacademy
echo sudo chown -R bitnami:bitnami /var/www/denglishacademy
echo.
echo # Parar Apache si está corriendo
echo sudo /opt/bitnami/ctlscript.sh stop apache 2^>/dev/null ^|^| true
echo sudo systemctl disable bitnami 2^>/dev/null ^|^| true
echo.
echo echo "✅ Servidor configurado"
) > setup-server.sh

REM Subir y ejecutar configuración
echo Subiendo configuración...
scp -i "%SSH_KEY%" -o StrictHostKeyChecking=no setup-server.sh %SSH_USER%@%SERVER_IP%:/tmp/
ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no %SSH_USER%@%SERVER_IP% "chmod +x /tmp/setup-server.sh && /tmp/setup-server.sh"

echo ✅ Servidor configurado

REM Subir aplicación
echo.
echo 📤 Subiendo aplicación...

REM Crear paquete
if exist "app-package.tar.gz" del app-package.tar.gz
tar -czf app-package.tar.gz -C dist . 2>nul || (
    powershell -command "Compress-Archive -Path 'dist\*' -DestinationPath 'app-package.zip' -Force"
)

REM Subir archivos
scp -i "%SSH_KEY%" -o StrictHostKeyChecking=no app-package.* %SSH_USER%@%SERVER_IP%:/tmp/
scp -i "%SSH_KEY%" -o StrictHostKeyChecking=no deploy\server.js %SSH_USER%@%SERVER_IP%:/tmp/ 2>nul || echo "Server.js no encontrado, creando básico..."

REM Extraer en servidor
ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no %SSH_USER%@%SERVER_IP% << 'EOF'
cd /var/www/denglishacademy

# Extraer aplicación
if [ -f /tmp/app-package.tar.gz ]; then
    tar -xzf /tmp/app-package.tar.gz
elif [ -f /tmp/app-package.zip ]; then
    unzip -o /tmp/app-package.zip
fi

# Crear server.js básico si no existe
if [ ! -f /tmp/server.js ]; then
cat > server.js << 'SERVERJS'
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// Servir archivos estáticos
app.use(express.static('.'));

// SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Digital English Academy running on port ${PORT}`);
});
SERVERJS
else
    mv /tmp/server.js .
fi

# Instalar dependencias
npm init -y
npm install express --save

echo "✅ Aplicación subida"
EOF

echo ✅ Aplicación desplegada

REM Configurar Nginx
echo.
echo 🌐 Configurando Nginx...

(
echo server {
echo     listen 80;
echo     server_name %DOMAIN% www.%DOMAIN%;
echo.
echo     root /var/www/denglishacademy;
echo     index index.html;
echo.
echo     # Gzip compression
echo     gzip on;
echo     gzip_vary on;
echo     gzip_min_length 1024;
echo     gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
echo.
echo     # Security headers
echo     add_header X-Frame-Options "SAMEORIGIN" always;
echo     add_header X-XSS-Protection "1; mode=block" always;
echo     add_header X-Content-Type-Options "nosniff" always;
echo.
echo     # Cache static files
echo     location ~* \.\(js^|css^|png^|jpg^|jpeg^|gif^|ico^|svg^|woff^|woff2\)$ {
echo         expires 1y;
echo         add_header Cache-Control "public, immutable";
echo     }
echo.
echo     # API proxy
echo     location /api/ {
echo         proxy_pass http://localhost:3001;
echo         proxy_set_header Host $host;
echo         proxy_set_header X-Real-IP $remote_addr;
echo         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
echo         proxy_set_header X-Forwarded-Proto $scheme;
echo     }
echo.
echo     # SPA routing
echo     location / {
echo         try_files $uri $uri/ /index.html;
echo     }
echo }
) > nginx-denglishacademy.conf

scp -i "%SSH_KEY%" -o StrictHostKeyChecking=no nginx-denglishacademy.conf %SSH_USER%@%SERVER_IP%:/tmp/

ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no %SSH_USER%@%SERVER_IP% << 'EOF'
# Configurar Nginx
sudo mv /tmp/nginx-denglishacademy.conf /etc/nginx/sites-available/denglishacademy.com
sudo ln -sf /etc/nginx/sites-available/denglishacademy.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test y reload Nginx
sudo nginx -t && sudo systemctl enable nginx && sudo systemctl restart nginx

echo "✅ Nginx configurado"
EOF

echo ✅ Nginx configurado

REM Iniciar aplicación
echo.
echo 🚀 Iniciando aplicación...

ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no %SSH_USER%@%SERVER_IP% << 'EOF'
cd /var/www/denglishacademy

# Iniciar con PM2
pm2 delete denglishacademy 2>/dev/null || true
pm2 start server.js --name "denglishacademy"
pm2 startup
pm2 save

echo "✅ Aplicación iniciada"
EOF

echo ✅ Aplicación corriendo

REM Configurar SSL
echo.
echo 🔒 Configurando SSL...
echo ⚠️  Asegúrate de que el DNS esté configurado: %DOMAIN% → %SERVER_IP%

ssh -i "%SSH_KEY%" -o StrictHostKeyChecking=no %SSH_USER%@%SERVER_IP% << EOF
# Obtener certificado SSL
sudo certbot --nginx -d %DOMAIN% -d www.%DOMAIN% --non-interactive --agree-tos --email admin@%DOMAIN% --redirect

# Auto-renovación
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -

echo "✅ SSL configurado"
EOF

echo ✅ SSL configurado

REM Test final
echo.
echo 🧪 Probando sitio...
timeout 5 >nul 2>&1

echo Probando HTTP...
curl -I http://%SERVER_IP% 2>nul && echo "✅ HTTP OK" || echo "⚠️ HTTP no responde aún"

echo Probando HTTPS...
curl -I https://%DOMAIN% 2>nul && echo "✅ HTTPS OK" || echo "⚠️ HTTPS configurándose..."

REM Limpiar archivos temporales
del setup-server.sh 2>nul
del nginx-denglishacademy.conf 2>nul
del app-package.* 2>nul

echo.
echo ==========================================
echo   🎉 ¡DIGITAL ENGLISH ACADEMY DESPLEGADO!
echo ==========================================
echo.
echo 🌐 ACCESOS:
echo   • HTTP: http://%SERVER_IP%
echo   • HTTPS: https://%DOMAIN% ^(después de DNS^)
echo   • IP Directa: http://%SERVER_IP%
echo.
echo 📋 INFORMACIÓN:
echo   • Servidor: %SERVER_IP%
echo   • Usuario SSH: %SSH_USER%
echo   • Aplicación: /var/www/denglishacademy
echo   • Logs: pm2 logs denglishacademy
echo.
echo 🔧 COMANDOS ÚTILES:
echo   • Ver logs: ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP% "pm2 logs"
echo   • Reiniciar: ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP% "pm2 restart denglishacademy"
echo   • Estado: ssh -i "%SSH_KEY%" %SSH_USER%@%SERVER_IP% "pm2 status"
echo.
echo 📍 PRÓXIMOS PASOS:
echo   1. Verificar que funciona: http://%SERVER_IP%
echo   2. Configurar DNS si no está hecho
echo   3. Esperar propagación DNS ^(5-30 min^)
echo   4. Verificar HTTPS: https://%DOMAIN%
echo.
echo 🎊 ¡TU SAAS ESTÁ VIVO!
echo ==========================================
echo.

REM Abrir en navegador
echo Abriendo sitio en navegador...
start http://%SERVER_IP%

pause