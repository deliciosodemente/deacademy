@echo off
echo ========================================
echo 🌐 VERIFICADOR DNS EN TIEMPO REAL
echo ========================================
echo.

:loop
echo 🔍 Verificando DNS para denglishacademy.com...
echo Fecha/Hora: %date% %time%
echo.

echo 📡 Resolviendo dominio principal:
nslookup denglishacademy.com
echo.

echo 📡 Resolviendo www:
nslookup www.denglishacademy.com
echo.

echo 🌍 Verificando desde diferentes servidores DNS:
echo --- Google DNS (8.8.8.8) ---
nslookup denglishacademy.com 8.8.8.8
echo.

echo --- Cloudflare DNS (1.1.1.1) ---
nslookup denglishacademy.com 1.1.1.1
echo.

echo 🔗 Probando conectividad HTTP:
curl -I --connect-timeout 5 http://denglishacademy.com 2>nul
if %errorlevel% equ 0 (
    echo ✅ ¡DOMINIO FUNCIONANDO!
    echo.
    echo 🎉 TU SAAS YA ESTÁ DISPONIBLE EN:
    echo - http://denglishacademy.com
    echo - http://www.denglishacademy.com
    echo.
    echo ¿Quieres instalar SSL ahora? (s/n)
    set /p ssl="Respuesta: "
    if /i "%ssl%"=="s" (
        echo.
        echo 🔐 Instalando certificado SSL...
        ssh -i "%USERPROFILE%\.ssh\LightsailDefaultKey-us-east-1.pem" bitnami@34.196.15.155 "sudo certbot --nginx -d denglishacademy.com -d www.denglishacademy.com --non-interactive --agree-tos --email admin@denglishacademy.com"
        echo.
        echo ✅ ¡SSL INSTALADO! Tu SAAS ahora funciona con HTTPS
        pause
        exit
    )
    pause
    exit
) else (
    echo ⏳ Dominio aún no resuelve correctamente...
)

echo.
echo ⏱️ Esperando 30 segundos antes de verificar nuevamente...
echo Presiona Ctrl+C para cancelar
timeout /t 30 /nobreak >nul
echo.
echo ========================================
goto loop