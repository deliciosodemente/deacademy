@echo off
echo ========================================
echo 🧪 TEST COMPLETO DEL ENTORNO SAAS
echo ========================================
echo.

echo 📡 1. VERIFICANDO CONECTIVIDAD AL SERVIDOR...
ping -n 2 34.196.15.155
if %errorlevel% neq 0 (
    echo ❌ ERROR: No se puede conectar al servidor
    pause
    exit /b 1
)
echo ✅ Servidor accesible

echo.
echo 🌐 2. VERIFICANDO DNS DEL DOMINIO...
nslookup denglishacademy.com
echo.

echo 🔍 3. VERIFICANDO SERVICIOS WEB...
echo Probando páginas principales:

echo - Login page...
curl -s -o nul -w "Status: %%{http_code}" http://34.196.15.155/auth0-login.html
echo.

echo - Dashboard...
curl -s -o nul -w "Status: %%{http_code}" http://34.196.15.155/dashboard.html
echo.

echo - Subscription...
curl -s -o nul -w "Status: %%{http_code}" http://34.196.15.155/subscription.html
echo.

echo - AI Chat...
curl -s -o nul -w "Status: %%{http_code}" http://34.196.15.155/ai-chat.html
echo.

echo 🔐 4. VERIFICANDO CONEXIÓN SSH...
ssh -i "%USERPROFILE%\.ssh\LightsailDefaultKey-us-east-1.pem" -o ConnectTimeout=10 bitnami@34.196.15.155 "echo 'SSH OK: Conectado correctamente'"
if %errorlevel% neq 0 (
    echo ❌ ERROR: Problema con conexión SSH
) else (
    echo ✅ SSH funcionando correctamente
)

echo.
echo 📊 5. VERIFICANDO ESTADO DE SERVICIOS EN EL SERVIDOR...
ssh -i "%USERPROFILE%\.ssh\LightsailDefaultKey-us-east-1.pem" bitnami@34.196.15.155 "
echo '--- Estado de Nginx ---'
sudo systemctl status nginx --no-pager -l
echo.
echo '--- Procesos Node.js ---'
ps aux | grep node
echo.
echo '--- Uso de memoria ---'
free -h
echo.
echo '--- Espacio en disco ---'
df -h
"

echo.
echo 🎯 6. RESUMEN DEL TEST:
echo ========================================
echo Si todos los servicios muestran ✅, tu SAAS está listo
echo Si hay ❌, revisa la configuración correspondiente
echo.
echo 📱 URLs de tu SAAS:
echo - Login: http://34.196.15.155/auth0-login.html
echo - Dashboard: http://34.196.15.155/dashboard.html  
echo - Suscripciones: http://34.196.15.155/subscription.html
echo - Chat IA: http://34.196.15.155/ai-chat.html
echo ========================================
echo.
pause