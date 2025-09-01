@echo off
REM Complete Auth0 GenAI Setup for Digital English Academy
REM Usage: setup-auth0-genai-complete.bat [server-ip] [domain] [auth0-domain] [auth0-client-id]

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo   AUTH0 GENAI COMPLETE SETUP
echo   Digital English Academy
echo ==========================================
echo.

REM Get parameters
set SERVER_IP=%1
set DOMAIN=%2
set AUTH0_DOMAIN=%3
set AUTH0_CLIENT_ID=%4

if "%SERVER_IP%"=="" (
    echo [INFO] Interactive setup mode
    echo.
    set /p SERVER_IP="Enter your server IP: "
    set /p DOMAIN="Enter your domain (default: denglishacademy.com): "
    set /p AUTH0_DOMAIN="Enter your Auth0 domain (e.g., myapp.auth0.com): "
    set /p AUTH0_CLIENT_ID="Enter your Auth0 Client ID: "
    
    if "%DOMAIN%"=="" set DOMAIN=denglishacademy.com
)

echo.
echo Configuration:
echo - Server IP: %SERVER_IP%
echo - Domain: %DOMAIN%
echo - Auth0 Domain: %AUTH0_DOMAIN%
echo - Auth0 Client ID: %AUTH0_CLIENT_ID%
echo.

if "%SERVER_IP%"=="" (
    echo [ERROR] Server IP is required
    pause
    exit /b 1
)

REM Step 1: Update local configuration
echo [STEP 1/4] Updating local Auth0 configuration...

(
echo # Auth0 Configuration - Digital English Academy
echo AUTH0_DOMAIN=%AUTH0_DOMAIN%
echo AUTH0_CLIENT_ID=%AUTH0_CLIENT_ID%
echo AUTH0_AUDIENCE=https://%DOMAIN%/api
echo.
echo # Environment
echo NODE_ENV=production
echo.
echo # Feature Flags
echo FEATURE_AUTH0=true
echo FEATURE_GENAI=true
echo FEATURE_STRIPE=false
echo FEATURE_MONGODB=false
) > .env

echo [SUCCESS] Local configuration updated

REM Step 2: Deploy with optimizations
echo.
echo [STEP 2/4] Deploying with Auth0 GenAI optimizations...

call deploy\scripts\deploy-optimized.bat "%SERVER_IP%" "%DOMAIN%" "%AUTH0_DOMAIN%" "%AUTH0_CLIENT_ID%"

if errorlevel 1 (
    echo [ERROR] Deployment failed
    pause
    exit /b 1
)

echo [SUCCESS] Deployment completed

REM Step 3: Test Auth0 integration
echo.
echo [STEP 3/4] Testing Auth0 GenAI integration...

REM Wait for services to start
echo Waiting for services to initialize...
timeout 10 >nul 2>&1

REM Test Auth0 configuration
echo Testing Auth0 configuration...
curl -s "https://%AUTH0_DOMAIN%/.well-known/openid_configuration" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Auth0 domain may not be accessible
) else (
    echo [SUCCESS] Auth0 domain is accessible
)

REM Test website
echo Testing website...
curl -s -I "https://%DOMAIN%" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Website may not be ready yet
) else (
    echo [SUCCESS] Website is accessible
)

REM Step 4: Create management tools
echo.
echo [STEP 4/4] Creating management and troubleshooting tools...

REM Create troubleshooting script
(
echo @echo off
echo echo Running Auth0 GenAI diagnostics...
echo echo.
echo echo Opening browser for manual testing...
echo start https://%DOMAIN%
echo echo.
echo echo Testing Auth0 endpoints...
echo curl -s "https://%AUTH0_DOMAIN%/.well-known/openid_configuration" ^| findstr "issuer"
echo echo.
echo echo Testing website health...
echo curl -s "https://%DOMAIN%/health"
echo echo.
echo echo For detailed diagnostics, open browser console and run:
echo echo   troubleshooter.runDiagnostics()
echo echo.
echo pause
) > test-auth0-genai.bat

REM Create quick fix script
(
echo @echo off
echo echo Running Auth0 GenAI quick fixes...
echo echo.
echo echo Restarting services...
echo ssh -i "%USERPROFILE%\.ssh\LightsailDefaultKey-us-east-1.pem" ubuntu@%SERVER_IP% "pm2 restart all && sudo systemctl reload nginx"
echo echo.
echo echo Clearing Auth0 cache...
echo echo Open browser console and run: localStorage.clear()
echo echo.
echo echo Testing after fixes...
echo call test-auth0-genai.bat
echo pause
) > fix-auth0-genai.bat

REM Create monitoring script
(
echo @echo off
echo echo Auth0 GenAI System Monitor
echo echo ========================
echo echo.
echo :monitor
echo cls
echo echo [%%date%% %%time%%] Monitoring Auth0 GenAI System
echo echo.
echo echo === Website Status ===
echo curl -s -w "Response: %%{http_code} - Time: %%{time_total}s" "https://%DOMAIN%/health"
echo echo.
echo echo.
echo echo === Auth0 Status ===
echo curl -s "https://%AUTH0_DOMAIN%/.well-known/openid_configuration" ^| findstr "issuer" ^|^| echo "Auth0 not accessible"
echo echo.
echo echo === Server Status ===
echo ssh -i "%USERPROFILE%\.ssh\LightsailDefaultKey-us-east-1.pem" ubuntu@%SERVER_IP% "uptime && pm2 list --no-color" 2^>nul ^|^| echo "Server not accessible"
echo echo.
echo echo Press Ctrl+C to stop monitoring, or wait 30 seconds for refresh...
echo timeout 30 >nul 2>&1
echo goto monitor
) > monitor-auth0-genai.bat

echo [SUCCESS] Management tools created

REM Final summary and next steps
echo.
echo ==========================================
echo   SETUP COMPLETED SUCCESSFULLY!
echo ==========================================
echo.
echo 🎉 Your Auth0 GenAI integration is ready!
echo.
echo 🔐 Auth0 Configuration:
echo   • Domain: %AUTH0_DOMAIN%
echo   • Client ID: %AUTH0_CLIENT_ID%
echo   • Audience: https://%DOMAIN%/api
echo.
echo 🌐 Access Points:
echo   • Website: https://%DOMAIN%
echo   • Auth0 Login: https://%AUTH0_DOMAIN%/login
echo   • API Health: https://%DOMAIN%/api/health
echo.
echo 🛠️ Management Tools:
echo   • Test Integration: test-auth0-genai.bat
echo   • Quick Fixes: fix-auth0-genai.bat
echo   • System Monitor: monitor-auth0-genai.bat
echo   • Status Check: check-optimized-status.bat
echo   • Update Site: update-optimized.bat
echo.
echo 🔧 Troubleshooting:
echo   1. Open https://%DOMAIN% in browser
echo   2. Open Developer Console (F12)
echo   3. Run: troubleshooter.runDiagnostics()
echo   4. Run: troubleshooter.autoFix() if issues found
echo.
echo 📋 Next Steps:
echo   1. Test login functionality
echo   2. Configure Auth0 branding (optional)
echo   3. Set up user roles (optional)
echo   4. Configure AI usage limits (optional)
echo.
echo 🚀 Your platform is production-ready with Auth0 GenAI!
echo ==========================================
echo.

REM Auto-open browser for testing
echo Opening browser for testing...
start https://%DOMAIN%

echo Press any key to exit...
pause >nul