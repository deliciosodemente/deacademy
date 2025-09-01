# 🔐 Variables de Entorno para Vercel

## 📋 Instrucciones de Configuración

1. Ir a tu proyecto en Vercel Dashboard
2. Navegar a Settings > Environment Variables
3. Agregar cada variable con su valor correspondiente
4. Seleccionar los entornos: **Production**, **Preview**, **Development**

---

## 🔑 Auth0 Configuration

### Frontend (VITE_)
```env
VITE_AUTH0_DOMAIN=tu-dominio.auth0.com
VITE_AUTH0_CLIENT_ID=tu_client_id_frontend
VITE_AUTH0_AUDIENCE=tu_audience
```

### Backend (API)
```env
AUTH0_DOMAIN=tu-dominio.auth0.com
AUTH0_CLIENT_ID=tu_client_id_backend
AUTH0_CLIENT_SECRET=tu_client_secret
AUTH0_AUDIENCE=tu_audience
```

---

## 💳 Stripe Configuration

### Frontend
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51...
```

### Backend
```env
STRIPE_SECRET_KEY=sk_live_51...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_BASIC=price_...
STRIPE_PRICE_ID_PREMIUM=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...
```

---

## 🗄️ Database Configuration

```env
DATABASE_URL=postgresql://usuario:password@host:puerto/database
POSTGRES_HOST=tu_host
POSTGRES_PORT=5432
POSTGRES_DB=tu_database
POSTGRES_USER=tu_usuario
POSTGRES_PASSWORD=tu_password
```

---

## 🤖 Gemini AI Configuration

```env
GEMINI_API_KEY=AIzaSy...
```

---

## ☁️ AWS Configuration

```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=tu_secret_access_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=tu_bucket_name
S3_ACCESS_POINT_ARN=arn:aws:s3:us-east-1:123456789012:accesspoint/tu-access-point
S3_ACCESS_POINT_ALIAS=tu-access-point-alias
CLOUDFRONT_DOMAIN=tu_cloudfront_domain.cloudfront.net
CLOUDFRONT_DISTRIBUTION_ARN=arn:aws:cloudfront::123456789012:distribution/EDFDVBD6EXAMPLE
CLOUDFRONT_KEY_PAIR_ID=K2JCJMDEHXQW5F
CLOUDFRONT_PRIVATE_KEY_PATH=./cloudfront-private-key.pem
```

---

## 🚀 Application Configuration

### Frontend
```env
VITE_API_BASE_URL=https://tu-app.vercel.app/api
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_FEATURE_FLAGS=true
```

### Backend
```env
NODE_ENV=production
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_FEATURE_FLAGS=true
```

---

## 📝 Lista de Verificación

### ✅ Variables Críticas (Obligatorias)
- [ ] `VITE_AUTH0_DOMAIN`
- [ ] `VITE_AUTH0_CLIENT_ID`
- [ ] `AUTH0_CLIENT_SECRET`
- [ ] `DATABASE_URL`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `GEMINI_API_KEY`
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`

### ⚠️ Variables Opcionales (Recomendadas)
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `CLOUDFRONT_DOMAIN`
- [ ] `S3_BUCKET_NAME`
- [ ] `ENABLE_PERFORMANCE_MONITORING`

---

## 🔍 Cómo Obtener Cada Variable

### Auth0
1. Dashboard de Auth0 > Applications
2. Seleccionar tu aplicación
3. Copiar Domain, Client ID, Client Secret

### Stripe
1. Dashboard de Stripe > Developers > API keys
2. Copiar Publishable key y Secret key
3. Para Webhook Secret: Developers > Webhooks > tu endpoint

### Base de Datos
1. Desde tu proveedor de PostgreSQL
2. Formato: `postgresql://usuario:password@host:puerto/database`

### Gemini AI
1. Google AI Studio > API Keys
2. Crear nueva API key

### AWS
1. AWS Console > IAM > Users
2. Crear Access Key para tu usuario
3. S3: Console > S3 > tu bucket
4. CloudFront: Console > CloudFront > tu distribución

---

## 🚨 Notas de Seguridad

⚠️ **IMPORTANTE**: 
- Nunca commits archivos `.env` al repositorio
- Usa diferentes keys para desarrollo y producción
- Rota las keys periódicamente
- Configura solo los permisos mínimos necesarios

🔒 **Variables Sensibles**:
- `AUTH0_CLIENT_SECRET`
- `STRIPE_SECRET_KEY`
- `AWS_SECRET_ACCESS_KEY`
- `DATABASE_URL`
- `GEMINI_API_KEY`

---

## 📞 Troubleshooting

### Error: "Missing environment variable"
1. Verificar que la variable esté configurada en Vercel
2. Comprobar el nombre exacto (case-sensitive)
3. Asegurar que esté disponible en el entorno correcto

### Error: "Invalid credentials"
1. Verificar que las credenciales sean correctas
2. Comprobar que no hayan expirado
3. Verificar permisos en el servicio externo

### Error de Build
1. Revisar logs de build en Vercel
2. Verificar que todas las variables críticas estén configuradas
3. Comprobar sintaxis de las variables

---

**💡 Tip**: Puedes copiar y pegar estas variables directamente en Vercel, reemplazando los valores de ejemplo con tus credenciales reales.