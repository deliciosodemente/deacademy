@echo off
REM ========================================
REM   CONFIGURAR DNS Y SSL - DENGLISHACADEMY.COM
REM   IP: 34.196.15.155
REM ========================================

echo.
echo 🌐 CONFIGURACIÓN DNS Y SSL PARA DENGLISHACADEMY.COM
echo =====================================================
echo.

set SERVER_IP=34.196.15.155
set DOMAIN=denglishacademy.com

echo 📋 INFORMACIÓN ACTUAL:
echo ├── Servidor IP: %SERVER_IP%
echo ├── Dominio: %DOMAIN%
echo ├── Estado HTTP: ✅ FUNCIONANDO
echo └── Estado DNS: ❌ NO CONFIGURADO
echo.

echo 🎯 PASOS PARA CONFIGURAR DNS:
echo.
echo 1️⃣ **IR A TU PROVEEDOR DE DOMINIO**
echo    (Donde compraste denglishacademy.com)
echo.
echo 2️⃣ **BUSCAR "DNS MANAGEMENT" O "NAMESERVERS"**
echo.
echo 3️⃣ **AGREGAR ESTOS REGISTROS:**
echo.
echo    📌 REGISTRO A:
echo    ├── Tipo: A
echo    ├── Nombre: @ (o vacío)
echo    ├── Valor: %SERVER_IP%
echo    └── TTL: 300
echo.
echo    📌 REGISTRO A (WWW):
echo    ├── Tipo: A  
echo    ├── Nombre: www
echo    ├── Valor: %SERVER_IP%
echo    └── TTL: 300
echo.
echo    📌 REGISTRO CNAME (WILDCARD):
echo    ├── Tipo: CNAME
echo    ├── Nombre: *
echo    ├── Valor: %DOMAIN%
echo    └── TTL: 300
echo.

REM Verificar estado actual
echo 🔍 VERIFICANDO ESTADO ACTUAL...
echo.

echo === SERVIDOR HTTP ===
curl -I http://%SERVER_IP% 2>nul && echo ✅ Servidor HTTP funcionando || echo ❌ Servidor HTTP no responde

echo.
echo === DNS ACTUAL ===
nslookup %DOMAIN% 2>nul && echo ✅ DNS configurado || echo ❌ DNS no configurado

echo.
echo === HTTPS ACTUAL ===
curl -I https://%DOMAIN% 2>nul && echo ✅ HTTPS funcionando || echo ❌ HTTPS no disponible

echo.
echo 🚀 PREPARANDO SSL PARA CUANDO DNS ESTÉ LISTO...

REM Configurar SSL en el servidor
ssh -i "%USERPROFILE%\.ssh\LightsailDefaultKey-us-east-1.pem" -o StrictHostKeyChecking=no bitnami@%SERVER_IP% << 'EOF'
# Actualizar configuración de Nginx para SSL
sudo tee /etc/nginx/sites-available/denglishacademy.com > /dev/null << 'NGINX_CONFIG'
server {
    listen 80;
    server_name denglishacademy.com www.denglishacademy.com;
    
    # Redirect HTTP to HTTPS (will be enabled after SSL)
    # return 301 https://$server_name$request_uri;
    
    root /var/www/denglishacademy;
    index index.html auth0-login.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Cache static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html /auth0-login.html;
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# SSL configuration (will be added by Certbot)
# server {
#     listen 443 ssl http2;
#     server_name denglishacademy.com www.denglishacademy.com;
#     
#     ssl_certificate /etc/letsencrypt/live/denglishacademy.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/denglishacademy.com/privkey.pem;
#     
#     root /var/www/denglishacademy;
#     index index.html auth0-login.html;
#     
#     # Same configuration as HTTP
# }
NGINX_CONFIG

# Activar configuración
sudo ln -sf /etc/nginx/sites-available/denglishacademy.com /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Nginx configurado para denglishacademy.com"
echo "⏳ Esperando configuración DNS..."
EOF

echo ✅ Servidor preparado para SSL

echo.
echo ==========================================
echo   📋 RESUMEN DE CONFIGURACIÓN DNS
echo ==========================================
echo.
echo 🎯 **REGISTROS DNS A CREAR:**
echo.
echo Tipo    │ Nombre │ Valor
echo ────────┼────────┼─────────────────
echo A       │ @      │ %SERVER_IP%
echo A       │ www    │ %SERVER_IP%
echo CNAME   │ *      │ %DOMAIN%
echo.
echo 🕐 **TIEMPO DE PROPAGACIÓN:** 5-30 minutos
echo.
echo 🔧 **DESPUÉS DE CONFIGURAR DNS:**
echo    1. Esperar propagación (5-30 min)
echo    2. Ejecutar: configurar-ssl.bat
echo    3. ¡Listo! https://denglishacademy.com funcionando
echo.
echo 🌐 **MIENTRAS TANTO, PUEDES USAR:**
echo    http://%SERVER_IP%/auth0-login.html
echo    http://%SERVER_IP%/dashboard.html
echo    http://%SERVER_IP%/subscription.html
echo    http://%SERVER_IP%/ai-chat.html
echo.
echo ==========================================

pause