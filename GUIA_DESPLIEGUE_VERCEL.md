# 🚀 Guía Completa de Despliegue en Vercel

## 📋 Prerrequisitos

- [ ] Cuenta de GitHub con el repositorio del proyecto
- [ ] Cuenta de Vercel (conectada con GitHub)
- [ ] Credenciales de Auth0 configuradas
- [ ] Credenciales de Stripe configuradas
- [ ] Base de datos PostgreSQL accesible
- [ ] Credenciales de AWS configuradas
- [ ] API Key de Gemini AI

## 🔧 Paso 1: Preparación del Repositorio

### 1.1 Verificar archivos necesarios
- ✅ `vercel.json` - Configurado correctamente
- ✅ `package.json` - Script de build disponible
- ✅ Variables de entorno configuradas localmente

### 1.2 Subir código a GitHub
```bash
git add .
git commit -m "Preparar para despliegue en Vercel"
git push origin main
```

## 🌐 Paso 2: Configurar Proyecto en Vercel

### 2.1 Importar Proyecto
1. Ir a [vercel.com](https://vercel.com)
2. Hacer clic en "New Project"
3. Importar desde GitHub
4. Seleccionar el repositorio del proyecto

### 2.2 Configuración de Build
- **Framework Preset**: Other
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 🔐 Paso 3: Variables de Entorno

### 3.1 Variables del Frontend
```env
# Auth0 Configuration
VITE_AUTH0_DOMAIN=tu-dominio.auth0.com
VITE_AUTH0_CLIENT_ID=tu_client_id
VITE_AUTH0_AUDIENCE=tu_audience

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# API Configuration
VITE_API_BASE_URL=https://tu-app.vercel.app/api

# Feature Flags
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_FEATURE_FLAGS=true
```

### 3.2 Variables del Backend (API)
```env
# Auth0 Configuration
AUTH0_DOMAIN=tu-dominio.auth0.com
AUTH0_CLIENT_ID=tu_client_id
AUTH0_CLIENT_SECRET=tu_client_secret
AUTH0_AUDIENCE=tu_audience

# Database Configuration
DATABASE_URL=postgresql://usuario:password@host:puerto/database
POSTGRES_HOST=tu_host
POSTGRES_PORT=5432
POSTGRES_DB=tu_database
POSTGRES_USER=tu_usuario
POSTGRES_PASSWORD=tu_password

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_BASIC=price_...
STRIPE_PRICE_ID_PREMIUM=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...

# Gemini AI Configuration
GEMINI_API_KEY=tu_gemini_api_key

# AWS Configuration
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=tu_bucket
S3_ACCESS_POINT_ARN=arn:aws:s3:...
S3_ACCESS_POINT_ALIAS=tu_alias
CLOUDFRONT_DOMAIN=tu_cloudfront_domain
CLOUDFRONT_DISTRIBUTION_ARN=arn:aws:cloudfront:...
CLOUDFRONT_KEY_PAIR_ID=tu_key_pair_id
CLOUDFRONT_PRIVATE_KEY_PATH=./cloudfront-private-key.pem

# Performance Monitoring
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_FEATURE_FLAGS=true

# Environment
NODE_ENV=production
```

## 🚀 Paso 4: Realizar Despliegue

### 4.1 Despliegue Inicial
1. Configurar todas las variables de entorno en Vercel
2. Hacer clic en "Deploy"
3. Esperar a que termine el build
4. Verificar que no haya errores

### 4.2 Obtener URLs de Producción
Después del despliegue exitoso, obtendrás:
- **URL Principal**: `https://tu-app.vercel.app`
- **URL de API**: `https://tu-app.vercel.app/api`

## 🔧 Paso 5: Configuración Post-Despliegue

### 5.1 Actualizar Auth0
1. Ir al Dashboard de Auth0
2. Navegar a Applications > Tu App
3. Actualizar **Allowed Callback URLs**:
   ```
   https://tu-app.vercel.app/callback,
   https://tu-app.vercel.app
   ```
4. Actualizar **Allowed Logout URLs**:
   ```
   https://tu-app.vercel.app
   ```
5. Actualizar **Allowed Web Origins**:
   ```
   https://tu-app.vercel.app
   ```

### 5.2 Actualizar Stripe
1. Ir al Dashboard de Stripe
2. Navegar a Developers > Webhooks
3. Actualizar endpoint URL:
   ```
   https://tu-app.vercel.app/api/stripe/webhook
   ```
4. Verificar eventos configurados:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## 🧪 Paso 6: Verificación y Testing

### 6.1 Endpoints de Salud
```bash
# Verificar API principal
curl https://tu-app.vercel.app/api/video/health

# Verificar autenticación
curl https://tu-app.vercel.app/api/auth/me
```

### 6.2 Funcionalidades a Probar
- [ ] Carga de la página principal
- [ ] Login con Auth0
- [ ] Navegación entre secciones
- [ ] Reproducción de videos
- [ ] Proceso de pago con Stripe
- [ ] Chat con IA (Gemini)
- [ ] Responsive design

## 🔍 Paso 7: Monitoreo y Logs

### 7.1 Logs de Vercel
- Acceder a la pestaña "Functions" en el dashboard
- Revisar logs en tiempo real
- Configurar alertas si es necesario

### 7.2 Métricas de Performance
- Revisar Core Web Vitals
- Monitorear tiempo de respuesta de API
- Verificar uso de recursos

## 🚨 Solución de Problemas Comunes

### Build Failures
- Verificar que todas las dependencias estén en `package.json`
- Revisar variables de entorno requeridas
- Comprobar sintaxis en archivos de configuración

### Errores de API
- Verificar conexión a base de datos
- Comprobar credenciales de servicios externos
- Revisar logs de funciones serverless

### Problemas de Auth0
- Verificar URLs de callback
- Comprobar configuración de CORS
- Revisar configuración de dominio

## 📞 Soporte

Si encuentras problemas durante el despliegue:
1. Revisar logs en Vercel Dashboard
2. Verificar configuración de variables de entorno
3. Comprobar estado de servicios externos (Auth0, Stripe, AWS)
4. Consultar documentación de Vercel

---

✅ **¡Despliegue Completado!** Tu aplicación estará disponible en `https://tu-app.vercel.app`