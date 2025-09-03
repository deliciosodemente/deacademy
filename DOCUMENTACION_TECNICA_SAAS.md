# Documentación Técnica Completa - FluentLeap SaaS

## 📋 Resumen Ejecutivo

FluentLeap es una plataforma SaaS completa para el aprendizaje de inglés que integra autenticación Auth0, pagos con Stripe, base de datos PostgreSQL, inteligencia artificial y una interfaz de usuario moderna.

## 🏗️ Arquitectura del Sistema

### Tecnologías Principales
- **Frontend**: Vite + JavaScript (ES6+)
- **Backend**: Node.js con API serverless
- **Autenticación**: Auth0
- **Pagos**: Stripe
- **Base de Datos**: PostgreSQL
- **IA**: Google Gemini API
- **Despliegue**: Vercel

## 🔐 Sistema de Autenticación (Auth0)

### Configuración por Ambiente
```javascript
// Desarrollo
domain: process.env.AUTH0_DOMAIN
clientId: process.env.AUTH0_CLIENT_ID
audience: process.env.AUTH0_AUDIENCE
scope: 'openid profile email read:user_metadata update:user_metadata'
redirectUri: 'http://localhost:3000'

// Producción
redirectUri: 'https://denglishacademy.com'
```

### Funcionalidades Implementadas
- ✅ Login/Logout con Auth0
- ✅ Gestión de sesiones con tokens JWT
- ✅ Refresh tokens automático
- ✅ Metadata de usuario personalizada
- ✅ Roles y permisos (student, teacher, admin)
- ✅ Cache de tokens en localStorage

### Flujo de Autenticación
1. Usuario hace clic en "Iniciar Sesión"
2. Redirección a Auth0 Universal Login
3. Callback con código de autorización
4. Intercambio por tokens JWT
5. Almacenamiento seguro en localStorage
6. Verificación de estado de autenticación

## 💳 Sistema de Pagos (Stripe)

### Planes de Suscripción
```javascript
free: {
  price: 0,
  features: ['Lecciones básicas', 'Comunidad', 'Progreso básico']
}

basic: {
  price: 9.99,
  interval: 'month',
  features: ['Acceso completo', 'IA personalizada', 'Certificados']
}

premium: {
  price: 19.99,
  interval: 'month',
  features: ['Todo de Basic', 'Tutorías 1:1', 'Contenido premium']
}
```

### Funcionalidades de Pago
- ✅ Integración con Stripe Elements
- ✅ Procesamiento de suscripciones
- ✅ Webhooks para eventos de pago
- ✅ Gestión de facturas
- ✅ Cancelación y reactivación
- ✅ Soporte para múltiples monedas

## 🗄️ Base de Datos (PostgreSQL)

### Esquema de Tablas
```sql
-- Usuarios
users: id, auth0_id, email, name, created_at, updated_at

-- Cursos
courses: id, title, description, level, created_at

-- Lecciones
lessons: id, course_id, title, content, order_index

-- Progreso del Usuario
user_progress: id, user_id, lesson_id, completed, score, completed_at

-- Suscripciones
user_subscriptions: id, user_id, stripe_subscription_id, plan, status

-- Historial de Pagos
payment_history: id, user_id, stripe_payment_id, amount, status

-- Comunidad
community_threads: id, user_id, title, content, created_at
community_messages: id, thread_id, user_id, content, created_at
```

### Configuración por Ambiente
- **Desarrollo**: localhost:5432
- **Staging**: AWS RDS con SSL
- **Producción**: AWS RDS con SSL obligatorio

## 🤖 Sistema de Inteligencia Artificial

### Integración con Google Gemini
- ✅ Chat interactivo para práctica de inglés
- ✅ Corrección automática de gramática
- ✅ Generación de ejercicios personalizados
- ✅ Evaluación de pronunciación
- ✅ Recomendaciones de aprendizaje

### Funcionalidades IA
```javascript
// Tipos de interacción
- Conversación libre
- Corrección de textos
- Explicación de gramática
- Práctica de vocabulario
- Simulación de situaciones
```

## 🎨 Interfaz de Usuario

### Componentes Principales
- **Router**: Navegación SPA con historial
- **Auth Manager**: Gestión de estado de autenticación
- **Payment Forms**: Formularios de Stripe Elements
- **Chat Interface**: Interfaz de IA conversacional
- **Course Player**: Reproductor de lecciones
- **Dashboard**: Panel de control del usuario

### Características UX/UI
- ✅ Diseño responsive
- ✅ Tema oscuro/claro
- ✅ Accesibilidad WCAG 2.1
- ✅ Carga progresiva
- ✅ Offline support básico

## 🚀 Despliegue y DevOps

### Vercel Configuration
```json
{
  "builds": [
    { "src": "api/**/*.js", "use": "@vercel/node" },
    { "src": "package.json", "use": "@vercel/static-build" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### Variables de Entorno Requeridas
```bash
# Auth0
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_AUDIENCE=your-api-audience

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database
PG_HOST=your-db-host
PG_DATABASE=fluentleap_db
PG_USER=your-username
PG_PASSWORD=your-password
PG_PORT=5432

# AI
GEMINI_API_KEY=your-gemini-key
```

## 📊 Métricas y Monitoreo

### KPIs del SaaS
- Usuarios registrados
- Tasa de conversión (free → paid)
- Retención mensual
- Ingresos recurrentes (MRR)
- Tiempo promedio en plataforma
- Lecciones completadas

### Logging y Errores
- ✅ Error boundary para React
- ✅ Logging estructurado
- ✅ Monitoreo de performance
- ✅ Alertas automáticas

## 🔒 Seguridad

### Medidas Implementadas
- ✅ HTTPS obligatorio
- ✅ Tokens JWT con expiración
- ✅ Validación de entrada
- ✅ Rate limiting
- ✅ CORS configurado
- ✅ Headers de seguridad
- ✅ Sanitización de datos

### Compliance
- GDPR ready
- PCI DSS (via Stripe)
- SOC 2 Type II (via Auth0)

## 📈 Escalabilidad

### Arquitectura Serverless
- Auto-scaling en Vercel
- CDN global
- Edge functions
- Database connection pooling

### Optimizaciones
- Code splitting
- Lazy loading
- Image optimization
- Caching strategies

## 🧪 Testing

### Tipos de Pruebas
- Unit tests (Vitest)
- Integration tests
- E2E tests (Playwright)
- Performance tests
- Security tests

## 📚 Documentación API

### Endpoints Principales
```
GET /api/user/profile - Perfil del usuario
POST /api/auth/callback - Callback Auth0
POST /api/payments/create-subscription - Crear suscripción
GET /api/courses - Lista de cursos
POST /api/ai/chat - Chat con IA
GET /api/progress/:userId - Progreso del usuario
```

## 🔄 Flujo Completo del Usuario

1. **Registro**: Auth0 Universal Login
2. **Onboarding**: Evaluación de nivel
3. **Selección de Plan**: Free o Premium
4. **Pago**: Stripe Checkout (si premium)
5. **Acceso a Contenido**: Cursos y lecciones
6. **Interacción IA**: Chat y ejercicios
7. **Progreso**: Tracking y certificados
8. **Comunidad**: Foros y discusiones

## 📞 Soporte y Mantenimiento

### Canales de Soporte
- Email: support@denglishacademy.com
- Chat en vivo (premium)
- Base de conocimientos
- Tutoriales en video

### Mantenimiento
- Actualizaciones automáticas
- Backups diarios
- Monitoreo 24/7
- SLA 99.9% uptime

---

**Última actualización**: Enero 2025
**Versión**: 1.0.0
**Estado**: Producción