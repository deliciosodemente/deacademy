# Despliegue en Vercel - FluentLeap Digital English Academy

Esta guía te ayudará a desplegar la aplicación FluentLeap en Vercel de manera exitosa.

## 📋 Requisitos Previos

1. **Cuenta de Vercel**: Regístrate en [vercel.com](https://vercel.com)
2. **Repositorio Git**: El código debe estar en GitHub, GitLab o Bitbucket
3. **Variables de Entorno**: Configura todas las variables necesarias

## 🚀 Pasos para el Despliegue

### 1. Preparación del Proyecto

Asegúrate de que tienes los siguientes archivos configurados:
- ✅ `vercel.json` - Configuración de Vercel
- ✅ `package.json` - Scripts de build
- ✅ `.env.example` - Plantilla de variables de entorno

### 2. Configuración de Variables de Entorno en Vercel

En el dashboard de Vercel, ve a tu proyecto > Settings > Environment Variables y añade:

#### Variables del Frontend:
```
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_AUDIENCE=https://your-api-audience.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-key
VITE_API_BASE_URL=https://your-vercel-app.vercel.app
VITE_ENABLE_AUTH0=true
VITE_ENABLE_STRIPE=true
VITE_ENABLE_MONGODB=false
VITE_ENABLE_ANALYTICS=true
```

#### Variables del Backend (API):
```
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
AUTH0_AUDIENCE=https://your-api-audience.com/api
NODE_ENV=production
PG_HOST=your-postgres-host
PG_PORT=5432
PG_USER=your-postgres-user
PG_PASSWORD=your-postgres-password
PG_DATABASE=your-database-name
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
GEMINI_API_KEY=your-gemini-api-key
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name
CLOUDFRONT_DOMAIN=your-cloudfront-domain.cloudfront.net
CLOUDFRONT_KEY_PAIR_ID=your-cloudfront-key-pair-id
CLOUDFRONT_PRIVATE_KEY_PATH=./cloudfront-private-key.pem
FEATURE_AUTH0=true
FEATURE_STRIPE=true
FEATURE_VIDEO_STREAMING=true
FEATURE_POSTGRESQL=true
```

### 3. Configuración del Build

El proyecto está configurado para usar:
- **Frontend**: Vite con build estático
- **Backend**: Node.js serverless functions
- **Runtime**: Node.js 18.x

### 4. Despliegue Automático

1. **Conecta tu repositorio** a Vercel
2. **Configura las variables de entorno** (paso 2)
3. **Despliega** - Vercel detectará automáticamente la configuración

### 5. Configuración Post-Despliegue

#### Auth0 Configuration
En tu dashboard de Auth0:
1. Añade tu dominio de Vercel a **Allowed Callback URLs**:
   ```
   https://your-app.vercel.app/callback
   ```
2. Añade a **Allowed Logout URLs**:
   ```
   https://your-app.vercel.app
   ```
3. Añade a **Allowed Web Origins**:
   ```
   https://your-app.vercel.app
   ```

#### Stripe Configuration
1. Configura los **webhooks** para apuntar a:
   ```
   https://your-app.vercel.app/api/stripe/webhook
   ```

#### AWS CloudFront
1. Actualiza las **CORS policies** para incluir tu dominio de Vercel
2. Verifica que las **signed URLs** funcionen correctamente

## 🔧 Scripts Disponibles

```bash
# Desarrollo local
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Tests
npm run test
npm run test:coverage

# Linting y formato
npm run lint
npm run format
```

## 📊 Monitoreo y Debugging

### Logs de Vercel
- Ve a tu proyecto en Vercel > Functions tab
- Revisa los logs de las serverless functions
- Usa `console.log()` para debugging

### Health Checks
Puedes verificar el estado de los servicios:
```bash
# Stripe
curl https://your-app.vercel.app/api/stripe/health

# Video/AWS
curl https://your-app.vercel.app/api/video/health
```

## 🚨 Troubleshooting

### Problemas Comunes

1. **Error 500 en API**
   - Verifica las variables de entorno
   - Revisa los logs en Vercel dashboard

2. **Auth0 no funciona**
   - Verifica las URLs en Auth0 dashboard
   - Confirma las variables `VITE_AUTH0_*`

3. **Stripe errors**
   - Verifica las claves (test vs live)
   - Confirma la configuración de webhooks

4. **AWS/Video streaming issues**
   - Verifica credenciales AWS
   - Confirma permisos de S3 y CloudFront

### Contacto y Soporte

Si encuentras problemas durante el despliegue:
1. Revisa los logs de Vercel
2. Verifica todas las variables de entorno
3. Confirma que los servicios externos (Auth0, Stripe, AWS) están configurados correctamente

## 🎯 URLs de Producción

Una vez desplegado, tu aplicación estará disponible en:
- **Frontend**: `https://your-app.vercel.app`
- **API**: `https://your-app.vercel.app/api/*`

¡Listo para aprender inglés con confianza! 🚀