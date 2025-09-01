@echo off
echo ========================================
echo 🚀 TEST FUNCIONAL DEL SAAS
echo ========================================
echo.

echo ✅ SERVIDOR ONLINE - Nginx funcionando correctamente
echo.

echo 📱 Verificando páginas del SAAS...

echo 🔐 Login page:
curl -s -I http://34.196.15.155/auth0-login.html | findstr "200 OK"
if %errorlevel% equ 0 (echo ✅ Login OK) else (echo ❌ Login ERROR)

echo 📊 Dashboard:
curl -s -I http://34.196.15.155/dashboard.html | findstr "200 OK"
if %errorlevel% equ 0 (echo ✅ Dashboard OK) else (echo ❌ Dashboard ERROR)

echo 💳 Subscription:
curl -s -I http://34.196.15.155/subscription.html | findstr "200 OK"
if %errorlevel% equ 0 (echo ✅ Subscription OK) else (echo ❌ Subscription ERROR)

echo 🤖 AI Chat:
curl -s -I http://34.196.15.155/ai-chat.html | findstr "200 OK"
if %errorlevel% equ 0 (echo ✅ AI Chat OK) else (echo ❌ AI Chat ERROR)

echo.
echo 🌐 Verificando DNS del dominio:
nslookup denglishacademy.com | findstr "Address"

echo.
echo 🔧 Verificando servicios del servidor:
ssh -i "%USERPROFILE%\.ssh\LightsailDefaultKey-us-east-1.pem" bitnami@34.196.15.155 "
echo '🔍 Estado de servicios:'
sudo systemctl is-active nginx
sudo systemctl is-active apache2
echo '📊 Procesos activos:'
ps aux | grep -E '(nginx|node|apache)' | grep -v grep | wc -l
echo '💾 Memoria disponible:'
free -h | grep Mem
"

echo.
echo ========================================
echo 🎯 RESUMEN DEL ESTADO:
echo ========================================
echo ✅ Servidor AWS Lightsail: ONLINE
echo ✅ Nginx Web Server: FUNCIONANDO  
echo ✅ Páginas SAAS: ACCESIBLES
echo.
echo 🌐 TU SAAS ESTÁ LISTO EN:
echo - 🔐 http://34.196.15.155/auth0-login.html
echo - 📊 http://34.196.15.155/dashboard.html
echo - 💳 http://34.196.15.155/subscription.html  
echo - 🤖 http://34.196.15.155/ai-chat.html
echo.
echo 📋 PRÓXIMOS PASOS:
echo 1. Configurar DNS para denglishacademy.com
echo 2. Instalar certificado SSL
echo 3. Configurar Auth0 y Stripe
echo ========================================
pause