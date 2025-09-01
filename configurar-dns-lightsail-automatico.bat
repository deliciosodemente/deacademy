@echo off
echo ========================================
echo 🚀 CONFIGURACIÓN DNS AUTOMÁTICA LIGHTSAIL
echo ========================================
echo.

echo 🔍 Verificando si AWS CLI está instalado...
aws --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ AWS CLI no está instalado
    echo.
    echo 📋 CONFIGURACIÓN MANUAL:
    echo 1. Ir a: https://lightsail.aws.amazon.com/
    echo 2. Click en "Domains & DNS"
    echo 3. Click en "denglishacademy.com"
    echo 4. Agregar estos registros A:
    echo.
    echo    Registro 1:
    echo    - Tipo: A
    echo    - Subdomain: @ (vacío)
    echo    - Resolves to: 34.196.15.155
    echo.
    echo    Registro 2:
    echo    - Tipo: A
    echo    - Subdomain: www  
    echo    - Resolves to: 34.196.15.155
    echo.
    echo 5. Guardar cambios
    echo.
    pause
    exit /b 1
)

echo ✅ AWS CLI encontrado
echo.

echo 🌐 Configurando registros DNS para denglishacademy.com...

echo 📝 Creando registro A para dominio raíz...
aws lightsail create-domain-entry ^
    --domain-name denglishacademy.com ^
    --domain-entry name=@,type=A,target=34.196.15.155

if %errorlevel% equ 0 (
    echo ✅ Registro raíz creado
) else (
    echo ⚠️ Error o registro ya existe
)

echo 📝 Creando registro A para www...
aws lightsail create-domain-entry ^
    --domain-name denglishacademy.com ^
    --domain-entry name=www,type=A,target=34.196.15.155

if %errorlevel% equ 0 (
    echo ✅ Registro www creado
) else (
    echo ⚠️ Error o registro ya existe
)

echo.
echo 🔍 Verificando registros creados...
aws lightsail get-domain --domain-name denglishacademy.com

echo.
echo ========================================
echo ✅ CONFIGURACIÓN DNS COMPLETADA
echo ========================================
echo.
echo ⏱️ Los cambios tardan 5-15 minutos en propagarse
echo.
echo 🔍 Para verificar en tiempo real, ejecuta:
echo verificar-dns-tiempo-real.bat
echo.
pause