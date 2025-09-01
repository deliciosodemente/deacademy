# 🚀 Instrucciones para Conectar GitHub y Desplegar en Vercel

## 📋 Estado Actual
✅ **Repositorio Git inicializado**
✅ **Archivos preparados y commit realizado**
✅ **Configuración de Vercel lista**
✅ **Variables de entorno identificadas**

## 🔗 Paso 1: Crear Repositorio en GitHub

### 1.1 Crear nuevo repositorio
1. Ir a [github.com](https://github.com)
2. Hacer clic en "New repository"
3. Nombre sugerido: `fluentleap-english-academy`
4. Descripción: `Plataforma integral de aprendizaje de inglés con IA`
5. Seleccionar **Private** (recomendado para producción)
6. **NO** inicializar con README, .gitignore o license
7. Hacer clic en "Create repository"

### 1.2 Conectar repositorio local con GitHub
Ejecutar estos comandos en la terminal:

```bash
# Agregar repositorio remoto (reemplazar con tu URL)
git remote add origin https://github.com/TU_USUARIO/fluentleap-english-academy.git

# Renombrar rama principal
git branch -M main

# Subir código a GitHub
git push -u origin main
```

## 🌐 Paso 2: Configurar Proyecto en Vercel

### 2.1 Importar desde GitHub
1. Ir a [vercel.com](https://vercel.com)
2. Hacer clic en "New Project"
3. Seleccionar "Import Git Repository"
4. Buscar y seleccionar tu repositorio `fluentleap-english-academy`
5. Hacer clic en "Import"

### 2.2 Configuración de Build
- **Framework Preset**: Other
- **Root Directory**: `./` (dejar por defecto)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 🔐 Paso 3: Variables de Entorno en Vercel

### 3.1 Variables del Frontend
En la sección "Environment Variables" de Vercel, agregar:

```env
VITE_AUTH0_DOMAIN=tu-dominio.auth0.com
VITE_AUTH0_CLIENT_ID=tu_client_id
VITE_AUTH0_AUDIENCE=tu_audience
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_API_BASE_URL=https://tu-app.vercel.app/api
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_FEATURE_FLAGS=true
```

### 3.2 Variables del Backend
```env
AUTH0_DOMAIN=tu-dominio.auth0.com
AUTH0_CLIENT_ID=tu_client_id
AUTH0_CLIENT_SECRET=tu_client_secret
AUTH0_AUDIENCE=tu_audience
DATABASE_URL=postgresql://usuario:password@host:puerto/database
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
GEMINI_API_KEY=tu_gemini_api_key
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=tu_bucket
CLOUDFRONT_DOMAIN=tu_cloudfront_domain
NODE_ENV=production
```

## 🚀 Paso 4: Realizar Despliegue

### 4.1 Despliegue Inicial
1. Después de configurar las variables de entorno
2. Hacer clic en "Deploy"
3. Esperar a que termine el build (puede tomar 2-5 minutos)
4. Verificar que no haya errores en los logs

### 4.2 Obtener URL de Producción
Después del despliegue exitoso:
- **URL Principal**: `https://tu-app.vercel.app`
- **URL de API**: `https://tu-app.vercel.app/api`

## 🔧 Paso 5: Configuración Post-Despliegue

### 5.1 Actualizar Auth0
1. Dashboard de Auth0 > Applications > Tu App
2. **Allowed Callback URLs**:
   ```
   https://tu-app.vercel.app/callback,
   https://tu-app.vercel.app
   ```
3. **Allowed Logout URLs**:
   ```
   https://tu-app.vercel.app
   ```
4. **Allowed Web Origins**:
   ```
   https://tu-app.vercel.app
   ```

### 5.2 Actualizar Stripe
1. Dashboard de Stripe > Developers > Webhooks
2. **Endpoint URL**:
   ```
   https://tu-app.vercel.app/api/stripe/webhook
   ```

## 🧪 Paso 6: Verificación

### 6.1 Endpoints de Prueba
```bash
# Verificar API de video
curl https://tu-app.vercel.app/api/video/health

# Verificar respuesta de la aplicación
curl https://tu-app.vercel.app
```

### 6.2 Funcionalidades a Probar
- [ ] Carga de página principal
- [ ] Login con Auth0
- [ ] Navegación entre secciones
- [ ] Reproducción de videos
- [ ] Proceso de pago
- [ ] Chat con IA

## 📞 Comandos de Ayuda

### Si necesitas hacer cambios:
```bash
# Hacer cambios en el código
git add .
git commit -m "Descripción del cambio"
git push origin main
# Vercel desplegará automáticamente
```

### Ver logs de despliegue:
1. Ir a Vercel Dashboard
2. Seleccionar tu proyecto
3. Ir a la pestaña "Functions" o "Deployments"
4. Revisar logs en tiempo real

---

## 🎯 Próximos Pasos

1. **Crear repositorio en GitHub** con el nombre sugerido
2. **Ejecutar comandos Git** para conectar y subir código
3. **Importar proyecto en Vercel** desde GitHub
4. **Configurar variables de entorno** en Vercel
5. **Realizar despliegue inicial**
6. **Actualizar configuraciones** en Auth0 y Stripe
7. **Verificar funcionamiento** completo

¡Tu aplicación estará lista para producción! 🚀