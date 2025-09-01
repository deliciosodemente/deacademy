# 🚀 Guía de Configuración Rápida - Digital English Academy

## ⚡ Configuración en 5 Minutos

### 1. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus credenciales
nano .env  # o usar tu editor preferido
```

### 2. Credenciales Requeridas

#### 🔐 Auth0 (Autenticación)

1. Crear cuenta en [Auth0](https://auth0.com)
2. Crear nueva aplicación "Single Page Application"
3. Configurar:
   - `AUTH0_DOMAIN`: tu-dominio.auth0.com
   - `AUTH0_CLIENT_ID`: desde el dashboard de Auth0
   - Allowed Callback URLs: `http://localhost:3000, https://tu-dominio.com`
   - Allowed Logout URLs: `http://localhost:3000, https://tu-dominio.com`

#### 💳 Stripe (Pagos)

1. Crear cuenta en [Stripe](https://stripe.com)
2. Obtener claves desde el dashboard:
   - `STRIPE_PUBLISHABLE_KEY`: pk_test_... (para pruebas)
   - Crear Payment Link para suscripciones
   - `STRIPE_PAYMENT_LINK`: <https://buy.stripe.com/>...

#### 📊 MongoDB (Base de Datos)

1. Crear cuenta en [MongoDB Atlas](https://mongodb.com/atlas)
2. Crear cluster gratuito
3. Crear usuario de base de datos
4. Obtener connection string:
   - `MONGODB_CONNECTION_STRING`: mongodb+srv://...

### 3. Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Producción
npm run build:production
npm run preview
```

### 4. Demo Interactivo

```bash
# Ejecutar demo sin configuración
npm run demo:interactive
```

Abre <http://localhost:8000/demo/interactive-demo.html>

## 🎯 Configuración de Producción

### Variables de Entorno de Producción

```env
NODE_ENV=production
AUTH0_DOMAIN=tu-dominio-prod.auth0.com
AUTH0_CLIENT_ID=tu-client-id-prod
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PAYMENT_LINK=https://buy.stripe.com/live-link
MONGODB_CONNECTION_STRING=mongodb+srv://prod-user:password@cluster.mongodb.net/prod_db
```

### Despliegue Rápido

#### Opción 1: Docker

```bash
npm run docker:build
npm run docker:up
```

#### Opción 2: Netlify/Vercel

```bash
npm run build:production
# Subir carpeta dist/
```

#### Opción 3: Servidor Propio

```bash
npm run build:production
npx serve dist -p 80
```

## 🔧 Solución de Problemas

### Error: "Auth0 not configured"

- Verificar AUTH0_DOMAIN y AUTH0_CLIENT_ID en .env
- Verificar que Auth0 esté habilitado: `FEATURE_AUTH0=true`

### Error: "Stripe not loaded"

- Verificar STRIPE_PUBLISHABLE_KEY en .env
- Verificar conexión a internet para cargar Stripe SDK

### Error: "Database connection failed"

- Verificar MONGODB_CONNECTION_STRING
- Verificar que la IP esté en whitelist de MongoDB Atlas
- Para desarrollo local: `FEATURE_MONGODB=false`

## 📞 Soporte

- 📧 Email: <soporte@digitalenglishacademy.com>
- 💬 Chat: Disponible en la plataforma
- 📚 Documentación: /docs/

## ✅ Checklist de Lanzamiento

- [ ] Configurar Auth0 en producción
- [ ] Configurar Stripe con claves live
- [ ] Configurar MongoDB Atlas
- [ ] Configurar dominio y SSL
- [ ] Probar flujo completo de registro/pago
- [ ] Configurar analytics (opcional)
- [ ] Backup de base de datos
- [ ] Monitoreo de errores

¡Tu plataforma estará lista para vender! 🎉
