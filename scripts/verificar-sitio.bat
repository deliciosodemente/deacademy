@echo off
REM Script para verificar el estado del sitio Digital English Academy

echo.
echo ==========================================
echo   VERIFICACIÓN DE SITIO - DIGITAL ENGLISH ACADEMY
echo ==========================================
echo.

set DOMAIN=denglishacademy.com
set SERVER_IP=

REM Solicitar IP del servidor si no está configurada
if "%SERVER_IP%"=="" (
    set /p SERVER_IP="Ingresa la IP de tu servidor Lightsail: "
)

echo 🔍 VERIFICANDO ESTADO DEL SITIO...
echo.

REM 1. Verificar DNS
echo [1/5] Verificando DNS...
nslookup %DOMAIN% >nul 2>&1
if errorlevel 1 (
    echo ❌ DNS no configurado para %DOMAIN%
    echo 💡 Configura DNS: %DOMAIN% → %SERVER_IP%
) else (
    echo ✅ DNS configurado correctamente
)

REM 2. Verificar ping al dominio
echo.
echo [2/5] Verificando conectividad al dominio...
ping %DOMAIN% -n 2 >nul 2>&1
if errorlevel 1 (
    echo ❌ Dominio no accesible
) else (
    echo ✅ Dominio accesible
)

REM 3. Verificar ping al servidor IP
if not "%SERVER_IP%"=="" (
    echo.
    echo [3/5] Verificando servidor IP...
    ping %SERVER_IP% -n 2 >nul 2>&1
    if errorlevel 1 (
        echo ❌ Servidor no accesible en %SERVER_IP%
    ) else (
        echo ✅ Servidor accesible en %SERVER_IP%
    )
)

REM 4. Verificar HTTP
echo.
echo [4/5] Verificando sitio web...
curl -s -I http://%DOMAIN% >nul 2>&1
if errorlevel 1 (
    echo ❌ Sitio web no accesible via HTTP
    if not "%SERVER_IP%"=="" (
        echo 🔄 Probando con IP directa...
        curl -s -I http://%SERVER_IP% >nul 2>&1
        if errorlevel 1 (
            echo ❌ Servidor web no responde
        ) else (
            echo ✅ Servidor web funciona (accesible via IP)
        )
    )
) else (
    echo ✅ Sitio web accesible via HTTP
)

REM 5. Verificar HTTPS
echo.
echo [5/5] Verificando SSL/HTTPS...
curl -s -I https://%DOMAIN% >nul 2>&1
if errorlevel 1 (
    echo ❌ SSL no configurado o sitio no accesible via HTTPS
) else (
    echo ✅ SSL configurado correctamente
)

echo.
echo ==========================================
echo   RESUMEN DE VERIFICACIÓN
echo ==========================================
echo.

REM Mostrar estado general
curl -s http://%DOMAIN% >nul 2>&1
if errorlevel 1 (
    echo 🔴 ESTADO: SITIO NO DISPONIBLE
    echo.
    echo 📋 PASOS PARA ACTIVAR:
    echo 1. Ejecutar: deploy-saas-completo.bat %SERVER_IP% %DOMAIN%
    echo 2. Configurar DNS: %DOMAIN% → %SERVER_IP%
    echo 3. Esperar propagación DNS (5-30 minutos)
    echo 4. Verificar nuevamente
) else (
    echo 🟢 ESTADO: SITIO ACTIVO
    echo.
    echo 🌐 Accesos:
    echo   • HTTP: http://%DOMAIN%
    echo   • HTTPS: https://%DOMAIN%
    echo   • Precios: https://%DOMAIN%/pricing
    echo   • Admin: https://%DOMAIN%/admin
)

echo.
echo 🚀 ¿Quieres abrir el sitio en el navegador? (S/N)
set /p OPEN_SITE=
if /i "%OPEN_SITE%"=="S" (
    echo Abriendo sitio...
    start http://%DOMAIN%
    start https://%DOMAIN%
)

echo.
pause