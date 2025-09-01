@echo off
echo ========================================
echo 🚀 CONFIGURAR AWS CLI Y DNS LIGHTSAIL
echo ========================================
echo.

echo 🔍 Verificando AWS CLI...
aws --version
if %errorlevel% neq 0 (
    echo ❌ Error con AWS CLI
    pause
    exit /b 1
)

echo ✅ AWS CLI instalado correctamente
echo.

echo 🔑 Verificando configuración AWS...
aws sts get-caller-identity >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ AWS CLI no está configurado
    echo.
    echo 📋 NECESITAS CONFIGURAR AWS CLI:
    echo 1. Ir a AWS Console > IAM > Users > Tu usuario > Security credentials
    echo 2. Crear "Access Key" si no tienes
    echo 3. Ejecutar: aws configure
    echo 4. Introducir:
    echo    - Access Key ID
    echo    - Secret Access Key  
    echo    - Region: us-east-1
    echo    - Output format: json
    echo.
    echo ¿Quieres configurar AWS CLI ahora? (s/n)
    set /p config="Respuesta: "
    if /i "%config%"=="s" (
        echo.
        echo 🔧 Ejecutando configuración AWS...
        aws configure
        echo.
        echo ✅ Configuración completada
    ) else (
        echo.
        echo 📋 Configura AWS CLI manualmente y vuelve a ejecutar este script
        pause
        exit /b 1
    )
)

echo ✅ AWS CLI configurado correctamente
echo.

echo 🌐 Configurando DNS para denglishacademy.com...
echo.

echo 📝 Verificando dominio existente...
aws lightsail get-domain --domain-name denglishacademy.com
if %errorlevel% neq 0 (
    echo ❌ Dominio no encontrado en Lightsail
    echo ¿Estás seguro que compraste denglishacademy.com en Lightsail?
    pause
    exit /b 1
)

echo ✅ Dominio encontrado
echo.

echo 📝 Creando registro A para dominio raíz (@)...
aws lightsail create-domain-entry --domain-name denglishacademy.com --domain-entry name=@,type=A,target=34.196.15.155
if %errorlevel% equ 0 (
    echo ✅ Registro @ creado exitosamente
) else (
    echo ⚠️ Registro @ ya existe o error (normal si ya estaba configurado)
)

echo.
echo 📝 Creando registro A para www...
aws lightsail create-domain-entry --domain-name denglishacademy.com --domain-entry name=www,type=A,target=34.196.15.155
if %errorlevel% equ 0 (
    echo ✅ Registro www creado exitosamente
) else (
    echo ⚠️ Registro www ya existe o error (normal si ya estaba configurado)
)

echo.
echo 🔍 Verificando registros DNS actuales...
aws lightsail get-domain --domain-name denglishacademy.com --query "domain.domainEntries[?type=='A']"

echo.
echo ========================================
echo ✅ CONFIGURACIÓN DNS COMPLETADA
echo ========================================
echo.
echo ⏱️ Los cambios DNS tardan 5-15 minutos en propagarse
echo.
echo 🔍 Verificando propagación en tiempo real...
timeout /t 5 /nobreak >nul
echo.

:verificar
echo 🌐 Probando resolución DNS...
nslookup denglishacademy.com | findstr "34.196.15.155"
if %errorlevel% equ 0 (
    echo.
    echo 🎉 ¡DNS FUNCIONANDO!
    echo ✅ denglishacademy.com apunta a 34.196.15.155
    echo.
    echo 🔗 Probando conectividad web...
    curl -I --connect-timeout 10 http://denglishacademy.com
    if %errorlevel% equ 0 (
        echo.
        echo 🚀 ¡PERFECTO! TU SAAS YA FUNCIONA EN:
        echo - http://denglishacademy.com
        echo - http://www.denglishacademy.com
        echo.
        echo 🔐 ¿Quieres instalar SSL ahora? (s/n)
        set /p ssl="Respuesta: "
        if /i "%ssl%"=="s" (
            echo.
            echo 🔒 Instalando certificado SSL...
            ssh -i "%USERPROFILE%\.ssh\LightsailDefaultKey-us-east-1.pem" bitnami@34.196.15.155 "sudo certbot --nginx -d denglishacademy.com -d www.denglishacademy.com --non-interactive --agree-tos --email admin@denglishacademy.com"
            echo.
            echo ✅ ¡SSL INSTALADO! Tu SAAS ahora es HTTPS
            echo 🌟 URLS FINALES:
            echo - https://denglishacademy.com
            echo - https://www.denglishacademy.com
        )
        pause
        exit
    )
)

echo ⏳ DNS aún propagándose... esperando 30 segundos
timeout /t 30 /nobreak >nul
goto verificar