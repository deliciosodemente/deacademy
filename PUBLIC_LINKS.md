# Enlaces Públicos - FluentLeap Digital English Academy

Este documento contiene todos los enlaces públicos disponibles para la plataforma FluentLeap, organizados por categorías.

## 🌐 URLs Base

- **Desarrollo Local**: `http://localhost:3001`
- **API Local**: `http://localhost:3000`
- **Producción (Vercel)**: `https://your-app.vercel.app`
- **API Producción**: `https://your-app.vercel.app/api`

## 📱 Frontend - Páginas Principales

### Páginas Públicas (Sin Autenticación)
```
🏠 Página Principal
https://your-app.vercel.app/

📚 Acerca de
https://your-app.vercel.app/about

💰 Precios
https://your-app.vercel.app/pricing

📞 Contacto
https://your-app.vercel.app/contact

🔐 Iniciar Sesión
https://your-app.vercel.app/login

📝 Registrarse
https://your-app.vercel.app/register
```

### Páginas Privadas (Requieren Autenticación)
```
🎯 Dashboard Principal
https://your-app.vercel.app/dashboard

📖 Mis Cursos
https://your-app.vercel.app/courses

🎥 Reproductor de Video
https://your-app.vercel.app/course-player

👤 Perfil de Usuario
https://your-app.vercel.app/profile

⚙️ Configuración
https://your-app.vercel.app/settings

💳 Suscripciones
https://your-app.vercel.app/subscription
```

## 🔌 API Endpoints

### Health Checks
```
✅ Stripe Health Check
GET https://your-app.vercel.app/api/stripe/health

✅ Video/AWS Health Check
GET https://your-app.vercel.app/api/video/health
```

### Stripe - Sistema de Pagos
```
💳 Obtener Productos
GET https://your-app.vercel.app/api/stripe/products

💰 Crear Sesión de Checkout
POST https://your-app.vercel.app/api/stripe/create-checkout-session

🔔 Webhook de Stripe
POST https://your-app.vercel.app/api/stripe/webhook

📊 Obtener Suscripciones
GET https://your-app.vercel.app/api/stripe/subscriptions
```

### Video Streaming (AWS)
```
🎥 Obtener URL Firmada
POST https://your-app.vercel.app/api/video/signed-url
Headers: Authorization: Bearer {jwt_token}
Body: { "videoKey": "path/to/video.mp4" }

📹 Listar Videos del Curso
GET https://your-app.vercel.app/api/video/course/{courseId}/videos
Headers: Authorization: Bearer {jwt_token}
```

### Autenticación (Auth0)
```
🔐 Callback de Auth0
GET https://your-app.vercel.app/callback

🚪 Logout
GET https://your-app.vercel.app/logout
```

## 🧪 Endpoints de Prueba

### Desarrollo Local
```bash
# Probar Stripe
curl -X GET http://localhost:3000/api/stripe/health
curl -X GET http://localhost:3000/api/stripe/products

# Probar Video/AWS
curl -X GET http://localhost:3000/api/video/health

# Probar con autenticación (requiere JWT token)
curl -X POST http://localhost:3000/api/video/signed-url \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"videoKey": "sample-video.mp4"}'
```

### Producción (Vercel)
```bash
# Probar Stripe
curl -X GET https://your-app.vercel.app/api/stripe/health
curl -X GET https://your-app.vercel.app/api/stripe/products

# Probar Video/AWS
curl -X GET https://your-app.vercel.app/api/video/health
```

## 📊 Monitoreo y Analytics

### Vercel Dashboard
```
📈 Analytics de Vercel
https://vercel.com/your-username/your-project/analytics

🔍 Logs de Functions
https://vercel.com/your-username/your-project/functions

⚡ Performance Insights
https://vercel.com/your-username/your-project/speed-insights
```

### Servicios Externos
```
🔐 Auth0 Dashboard
https://manage.auth0.com/dashboard

💳 Stripe Dashboard
https://dashboard.stripe.com

☁️ AWS Console
https://console.aws.amazon.com
```

## 🎯 URLs de Demostración

### Flujo Completo de Usuario
```
1️⃣ Registro/Login
https://your-app.vercel.app/login

2️⃣ Ver Precios
https://your-app.vercel.app/pricing

3️⃣ Suscribirse (Stripe Checkout)
https://your-app.vercel.app/api/stripe/create-checkout-session

4️⃣ Acceder al Dashboard
https://your-app.vercel.app/dashboard

5️⃣ Ver Cursos
https://your-app.vercel.app/courses

6️⃣ Reproducir Video
https://your-app.vercel.app/course-player
```

## 🔧 Configuración de Desarrollo

### Variables de Entorno Requeridas
```bash
# Frontend (.env.local)
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_API_BASE_URL=http://localhost:3000

# Backend (api/.env)
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_SECRET=your-client-secret
STRIPE_SECRET_KEY=sk_test_...
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
```

## 📝 Notas Importantes

1. **Autenticación**: Los endpoints marcados con 🔐 requieren un JWT token válido de Auth0
2. **CORS**: Configurado para permitir requests desde el dominio de frontend
3. **Rate Limiting**: Implementado en endpoints sensibles
4. **HTTPS**: Todos los enlaces de producción usan HTTPS
5. **Webhooks**: Configurar URLs de webhook en Stripe dashboard

## 🚀 Próximos Pasos

1. Reemplazar `your-app.vercel.app` con tu dominio real de Vercel
2. Configurar todas las variables de entorno en Vercel
3. Actualizar URLs de callback en Auth0
4. Configurar webhooks en Stripe
5. Verificar permisos de AWS S3 y CloudFront

---

**¡FluentLeap está listo para ayudar a los usuarios a aprender inglés con confianza!** 🌟