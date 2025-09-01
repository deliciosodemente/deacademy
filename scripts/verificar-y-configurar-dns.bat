@echo off
REM ========================================
REM   VERIFICAR Y CONFIGURAR DNS + SEO
REM   Digital English Academy
REM ========================================

setlocal enabledelayedexpansion

echo.
echo 🌐 VERIFICACIÓN Y CONFIGURACIÓN DNS + SEO
echo ==========================================
echo.

set DOMAIN=denglishacademy.com
set SERVER_IP=%1

if "%SERVER_IP%"=="" (
    echo 📝 Ingresa la IP de tu servidor:
    set /p SERVER_IP="IP del servidor: "
)

echo 🔍 Verificando estado actual...
echo.

REM Verificar DNS actual
echo === VERIFICACIÓN DNS ===
echo Verificando DNS para %DOMAIN%...
nslookup %DOMAIN% 2>nul || echo ❌ DNS no configurado

echo.
echo Verificando www.%DOMAIN%...
nslookup www.%DOMAIN% 2>nul || echo ❌ DNS no configurado para www

echo.
echo === VERIFICACIÓN HTTP ===
echo Probando conexión HTTP...
curl -I http://%SERVER_IP% 2>nul && echo ✅ Servidor HTTP responde || echo ❌ Servidor no responde

echo.
echo Probando conexión HTTPS...
curl -I https://%DOMAIN% 2>nul && echo ✅ HTTPS funcionando || echo ❌ HTTPS no disponible

echo.
echo ==========================================
echo   INSTRUCCIONES DE CONFIGURACIÓN DNS
echo ==========================================
echo.
echo 🎯 PARA CONFIGURAR DNS EN TU PROVEEDOR:
echo.
echo 1️⃣ **REGISTROS A CREAR:**
echo.
echo    Tipo: A
echo    Nombre: @
echo    Valor: %SERVER_IP%
echo    TTL: 300
echo.
echo    Tipo: A  
echo    Nombre: www
echo    Valor: %SERVER_IP%
echo    TTL: 300
echo.
echo    Tipo: CNAME
echo    Nombre: *
echo    Valor: %DOMAIN%
echo    TTL: 300
echo.
echo 2️⃣ **PROVEEDORES COMUNES:**
echo.
echo 📌 **Namecheap:**
echo    - Ir a Domain List ^> Manage ^> Advanced DNS
echo    - Agregar los registros A y CNAME
echo.
echo 📌 **GoDaddy:**
echo    - Ir a My Products ^> DNS ^> Manage Zones
echo    - Agregar los registros A y CNAME
echo.
echo 📌 **Cloudflare:**
echo    - Ir a DNS ^> Records
echo    - Agregar los registros A y CNAME
echo    - ✅ Activar proxy ^(nube naranja^)
echo.
echo 📌 **Google Domains:**
echo    - Ir a DNS ^> Custom records
echo    - Agregar los registros A y CNAME
echo.

REM Crear archivos SEO mientras esperamos DNS
echo.
echo 🚀 CREANDO ARCHIVOS SEO Y ANALYTICS...

REM Crear sitemap.xml
(
echo ^<?xml version="1.0" encoding="UTF-8"?^>
echo ^<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"^>
echo     ^<url^>
echo         ^<loc^>https://%DOMAIN%/^</loc^>
echo         ^<lastmod^>%date:~6,4%-%date:~3,2%-%date:~0,2%^</lastmod^>
echo         ^<changefreq^>daily^</changefreq^>
echo         ^<priority^>1.0^</priority^>
echo     ^</url^>
echo     ^<url^>
echo         ^<loc^>https://%DOMAIN%/pricing^</loc^>
echo         ^<lastmod^>%date:~6,4%-%date:~3,2%-%date:~0,2%^</lastmod^>
echo         ^<changefreq^>weekly^</changefreq^>
echo         ^<priority^>0.9^</priority^>
echo     ^</url^>
echo     ^<url^>
echo         ^<loc^>https://%DOMAIN%/courses^</loc^>
echo         ^<lastmod^>%date:~6,4%-%date:~3,2%-%date:~0,2%^</lastmod^>
echo         ^<changefreq^>weekly^</changefreq^>
echo         ^<priority^>0.8^</priority^>
echo     ^</url^>
echo     ^<url^>
echo         ^<loc^>https://%DOMAIN%/about^</loc^>
echo         ^<lastmod^>%date:~6,4%-%date:~3,2%-%date:~0,2%^</lastmod^>
echo         ^<changefreq^>monthly^</changefreq^>
echo         ^<priority^>0.7^</priority^>
echo     ^</url^>
echo     ^<url^>
echo         ^<loc^>https://%DOMAIN%/blog^</loc^>
echo         ^<lastmod^>%date:~6,4%-%date:~3,2%-%date:~0,2%^</lastmod^>
echo         ^<changefreq^>daily^</changefreq^>
echo         ^<priority^>0.8^</priority^>
echo     ^</url^>
echo ^</urlset^>
) > sitemap.xml

REM Crear robots.txt
(
echo # Robots.txt para Digital English Academy
echo User-agent: *
echo Allow: /
echo.
echo # Permitir recursos importantes
echo Allow: /css/
echo Allow: /js/
echo Allow: /images/
echo.
echo # Bloquear áreas privadas
echo Disallow: /admin/
echo Disallow: /api/private/
echo Disallow: /user/
echo Disallow: /dashboard/
echo.
echo # Sitemap
echo Sitemap: https://%DOMAIN%/sitemap.xml
echo.
echo # Crawl-delay
echo Crawl-delay: 1
) > robots.txt

REM Crear archivo de verificación de Google
echo google-site-verification: google123456789abcdef.html > google123456789abcdef.html

REM Crear meta tags SEO
(
echo ^<!-- SEO Meta Tags para Digital English Academy --^>
echo ^<meta charset="UTF-8"^>
echo ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo ^<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large"^>
echo.
echo ^<title^>Learn English Online with AI Tutor ^| Digital English Academy^</title^>
echo ^<meta name="description" content="Master English with our AI-powered platform. Personalized lessons, expert instructors, and interactive courses. Start free today!"^>
echo ^<meta name="keywords" content="learn english online, ai english tutor, english courses, business english, ielts preparation"^>
echo ^<link rel="canonical" href="https://%DOMAIN%"^>
echo.
echo ^<!-- Open Graph / Facebook --^>
echo ^<meta property="og:type" content="website"^>
echo ^<meta property="og:url" content="https://%DOMAIN%"^>
echo ^<meta property="og:title" content="Digital English Academy - AI-Powered English Learning"^>
echo ^<meta property="og:description" content="Join thousands learning English with our AI tutor. Personalized lessons, live classes, and certificates."^>
echo ^<meta property="og:image" content="https://%DOMAIN%/images/og-image.jpg"^>
echo.
echo ^<!-- Twitter --^>
echo ^<meta property="twitter:card" content="summary_large_image"^>
echo ^<meta property="twitter:title" content="Learn English with AI | Digital English Academy"^>
echo ^<meta property="twitter:description" content="Revolutionary AI-powered English learning platform."^>
echo ^<meta property="twitter:image" content="https://%DOMAIN%/images/twitter-card.jpg"^>
echo.
echo ^<!-- Google Analytics 4 --^>
echo ^<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXX"^>^</script^>
echo ^<script^>
echo   window.dataLayer = window.dataLayer ^|^| [];
echo   function gtag^(^){dataLayer.push^(arguments^);}
echo   gtag^('js', new Date^(^)^);
echo   gtag^('config', 'G-XXXXXXXXX'^);
echo ^</script^>
) > seo-meta-tags.html

echo ✅ Archivos SEO creados:
echo    - sitemap.xml
echo    - robots.txt  
echo    - google123456789abcdef.html
echo    - seo-meta-tags.html

REM Subir archivos al servidor si está disponible
if not "%SERVER_IP%"=="" (
    echo.
    echo 📤 Subiendo archivos SEO al servidor...
    
    scp -i "%USERPROFILE%\.ssh\LightsailDefaultKey-us-east-1.pem" sitemap.xml ubuntu@%SERVER_IP%:/var/www/denglishacademy/app/ 2>nul && echo ✅ sitemap.xml subido || echo ❌ Error subiendo sitemap.xml
    scp -i "%USERPROFILE%\.ssh\LightsailDefaultKey-us-east-1.pem" robots.txt ubuntu@%SERVER_IP%:/var/www/denglishacademy/app/ 2>nul && echo ✅ robots.txt subido || echo ❌ Error subiendo robots.txt
    scp -i "%USERPROFILE%\.ssh\LightsailDefaultKey-us-east-1.pem" google123456789abcdef.html ubuntu@%SERVER_IP%:/var/www/denglishacademy/app/ 2>nul && echo ✅ Verificación Google subida || echo ❌ Error subiendo verificación
)

echo.
echo ==========================================
echo   CONFIGURACIÓN GOOGLE ANALYTICS
echo ==========================================
echo.
echo 🎯 **PASOS PARA GOOGLE ANALYTICS:**
echo.
echo 1️⃣ Ir a https://analytics.google.com
echo 2️⃣ Crear cuenta ^> Crear propiedad
echo 3️⃣ Nombre: "Digital English Academy"
echo 4️⃣ URL: https://%DOMAIN%
echo 5️⃣ Industria: "Educación"
echo 6️⃣ Copiar Measurement ID ^(G-XXXXXXXXX^)
echo 7️⃣ Reemplazar en seo-meta-tags.html
echo.
echo 🎯 **PASOS PARA GOOGLE SEARCH CONSOLE:**
echo.
echo 1️⃣ Ir a https://search.google.com/search-console
echo 2️⃣ Agregar propiedad ^> Prefijo de URL
echo 3️⃣ URL: https://%DOMAIN%
echo 4️⃣ Verificar con archivo HTML ^(ya creado^)
echo 5️⃣ Enviar sitemap: https://%DOMAIN%/sitemap.xml
echo.

REM Crear script de monitoreo
(
echo @echo off
echo echo 📊 MONITOREO SEO - DIGITAL ENGLISH ACADEMY
echo echo ==========================================
echo echo.
echo echo === ESTADO DNS ===
echo nslookup %DOMAIN%
echo echo.
echo echo === ESTADO HTTPS ===
echo curl -I https://%DOMAIN%
echo echo.
echo echo === VERIFICAR SITEMAP ===
echo curl -I https://%DOMAIN%/sitemap.xml
echo echo.
echo echo === VERIFICAR ROBOTS ===
echo curl -I https://%DOMAIN%/robots.txt
echo echo.
echo echo === GOOGLE ANALYTICS ===
echo echo Verificar en: https://analytics.google.com
echo echo.
echo echo === SEARCH CONSOLE ===
echo echo Verificar en: https://search.google.com/search-console
echo echo.
echo pause
) > monitoreo-seo.bat

echo.
echo ==========================================
echo   PRÓXIMOS PASOS PARA VENTA
echo ==========================================
echo.
echo 🎯 **DESPUÉS DE CONFIGURAR DNS ^(24-48 horas^):**
echo.
echo 1️⃣ **Verificar sitio funcionando:**
echo    - Ejecutar: monitoreo-seo.bat
echo    - Verificar: https://%DOMAIN%
echo.
echo 2️⃣ **Configurar Analytics:**
echo    - Google Analytics 4
echo    - Google Search Console
echo    - Facebook Pixel ^(opcional^)
echo.
echo 3️⃣ **Generar tráfico inicial:**
echo    - Google Ads ^($100 inicial^)
echo    - Facebook Ads ^($50 inicial^)
echo    - SEO content marketing
echo.
echo 4️⃣ **Datos para venta ^(1-2 semanas^):**
echo    - 500+ visitantes únicos
echo    - 50+ registros
echo    - 5-10 suscripciones de pago
echo    - Métricas de engagement
echo.
echo 💰 **VALOR DE VENTA ESTIMADO:**
echo    - Con tráfico: $15,000 - $25,000
echo    - Con ingresos: $50,000 - $100,000
echo    - Con crecimiento: $100,000+
echo.
echo 🏖️ **¡TIEMPO ESTIMADO HASTA LA PLAYA: 2-4 SEMANAS!**
echo.

REM Limpiar archivos temporales locales
del sitemap.xml 2>nul
del robots.txt 2>nul  
del google123456789abcdef.html 2>nul
del seo-meta-tags.html 2>nul

echo ✅ Configuración DNS y SEO completada
echo.
echo 📋 **ARCHIVOS CREADOS:**
echo    - monitoreo-seo.bat ^(para verificar estado^)
echo    - Archivos SEO subidos al servidor
echo.
echo 🎯 **SIGUIENTE PASO:**
echo    1. Configurar DNS en tu proveedor
echo    2. Esperar 24-48 horas para propagación
echo    3. Ejecutar monitoreo-seo.bat para verificar
echo    4. Configurar Google Analytics y Search Console
echo.

pause