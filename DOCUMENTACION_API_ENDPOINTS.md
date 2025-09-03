# 📚 Documentación Completa de API - FluentLeap SaaS

## 🔗 Base URL
- **Desarrollo**: `http://localhost:3000/api`
- **Producción**: `https://deacademy-rlovoli1p-radhika1.vercel.app/api`

## 🔐 Autenticación

Todos los endpoints marcados como **🔒 Privado** requieren un token JWT válido en el header:
```
Authorization: Bearer <jwt_token>
```

---

## 🔑 Módulo de Autenticación

### GET /api/auth/profile
**🔒 Privado** | Obtener perfil de usuario desde la base de datos

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Response 200:**
```json
{
  "id": "auth0|123456789",
  "email": "usuario@ejemplo.com",
  "name": "Juan Pérez",
  "picture": "https://avatar-url.com/avatar.jpg",
  "subscription_status": "active",
  "plan": "premium",
  "created_at": "2025-01-01T00:00:00Z"
}
```

---

## 👤 Módulo de Usuarios

### GET /api/users/profile
**🔒 Privado** | Obtener perfil completo del usuario

**Response 200:**
```json
{
  "user_id": "auth0|123456789",
  "email": "usuario@ejemplo.com",
  "name": "Juan Pérez",
  "level": "intermediate",
  "total_lessons": 45,
  "completed_lessons": 23,
  "streak_days": 7,
  "last_activity": "2025-01-15T10:30:00Z"
}
```

### PUT /api/users/profile
**🔒 Privado** | Actualizar perfil del usuario

**Body:**
```json
{
  "name": "Juan Carlos Pérez",
  "level": "advanced",
  "preferences": {
    "notifications": true,
    "theme": "dark"
  }
}
```

**Response 200:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "user_id": "auth0|123456789",
    "name": "Juan Carlos Pérez",
    "level": "advanced"
  }
}
```

### POST /api/users/progress
**🔒 Privado** | Guardar progreso de lección

**Body:**
```json
{
  "lesson_id": "lesson_123",
  "course_id": "course_456",
  "score": 85,
  "completed": true,
  "time_spent": 1200,
  "answers": [
    {"question_id": "q1", "answer": "correct", "is_correct": true},
    {"question_id": "q2", "answer": "wrong", "is_correct": false}
  ]
}
```

**Response 201:**
```json
{
  "message": "Progress saved successfully",
  "progress_id": "progress_789",
  "total_score": 85,
  "streak_updated": true
}
```

### GET /api/users/progress
**🔒 Privado** | Obtener progreso del usuario

**Query Parameters:**
- `course_id` (opcional): Filtrar por curso específico
- `limit` (opcional): Número de registros (default: 50)
- `offset` (opcional): Paginación (default: 0)

**Response 200:**
```json
{
  "total_progress": {
    "completed_lessons": 23,
    "total_lessons": 45,
    "completion_percentage": 51,
    "average_score": 82,
    "streak_days": 7
  },
  "recent_activities": [
    {
      "lesson_id": "lesson_123",
      "course_title": "Grammar Basics",
      "lesson_title": "Present Simple",
      "score": 85,
      "completed_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

## 💳 Módulo de Pagos (Stripe)

### GET /api/stripe/health
**🌐 Público** | Health check del servicio de pagos

**Response 200:**
```json
{
  "status": "OK",
  "service": "Stripe Integration",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### GET /api/stripe/products
**🌐 Público** | Obtener productos y planes disponibles

**Response 200:**
```json
{
  "products": [
    {
      "id": "prod_free",
      "name": "Plan Gratuito",
      "price": 0,
      "currency": "usd",
      "interval": null,
      "features": [
        "Lecciones básicas",
        "Acceso a comunidad",
        "Progreso básico"
      ]
    },
    {
      "id": "prod_premium",
      "name": "Plan Premium",
      "price": 1999,
      "currency": "usd",
      "interval": "month",
      "features": [
        "Acceso completo a cursos",
        "IA personalizada",
        "Certificados",
        "Soporte prioritario"
      ]
    }
  ]
}
```

### POST /api/stripe/create-subscription
**🔒 Privado** | Crear nueva suscripción

**Body:**
```json
{
  "price_id": "price_1234567890",
  "payment_method_id": "pm_1234567890"
}
```

**Response 200:**
```json
{
  "subscription_id": "sub_1234567890",
  "client_secret": "seti_1234567890_secret_xyz",
  "status": "active",
  "current_period_end": "2025-02-15T00:00:00Z"
}
```

### POST /api/stripe/create-payment
**🔒 Privado** | Crear pago único

**Body:**
```json
{
  "amount": 2999,
  "currency": "usd",
  "description": "Curso Premium Individual"
}
```

**Response 200:**
```json
{
  "payment_intent_id": "pi_1234567890",
  "client_secret": "pi_1234567890_secret_xyz",
  "amount": 2999,
  "status": "requires_payment_method"
}
```

### GET /api/stripe/subscription-status
**🔒 Privado** | Obtener estado de suscripción

**Response 200:**
```json
{
  "subscription": {
    "id": "sub_1234567890",
    "status": "active",
    "plan": "premium",
    "current_period_start": "2025-01-15T00:00:00Z",
    "current_period_end": "2025-02-15T00:00:00Z",
    "cancel_at_period_end": false
  },
  "customer": {
    "id": "cus_1234567890",
    "email": "usuario@ejemplo.com"
  }
}
```

### POST /api/stripe/change-subscription
**🔒 Privado** | Cambiar plan de suscripción

**Body:**
```json
{
  "new_price_id": "price_0987654321"
}
```

### POST /api/stripe/cancel-subscription
**🔒 Privado** | Cancelar suscripción

**Body:**
```json
{
  "cancel_at_period_end": true
}
```

### POST /api/stripe/create-portal-session
**🔒 Privado** | Crear sesión del portal de cliente

**Response 200:**
```json
{
  "url": "https://billing.stripe.com/session/xyz123"
}
```

### POST /api/stripe/webhook
**🌐 Webhook** | Webhook de Stripe para eventos

**Headers:**
```
Stripe-Signature: t=1234567890,v1=signature_hash
```

---

## 🤖 Módulo de Inteligencia Artificial

### POST /api/ai/chat
**🌐 Público** | Chat con IA para práctica de inglés

**Body:**
```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are an English teacher helping students practice."
    },
    {
      "role": "user",
      "content": "Can you help me with present perfect tense?"
    }
  ],
  "context": {
    "user_level": "intermediate",
    "lesson_topic": "grammar"
  }
}
```

**Response 200:**
```json
{
  "content": "Of course! The present perfect tense is used to describe actions that happened at an unspecified time in the past or actions that started in the past and continue to the present. The structure is: Subject + have/has + past participle. For example: 'I have studied English for 3 years.'",
  "suggestions": [
    "Try creating sentences with 'have been'",
    "Practice with irregular verbs"
  ],
  "tokens_used": 156
}
```

### POST /api/ai/images
**🌐 Público** | Generar imágenes educativas

**Body:**
```json
{
  "prompt": "English classroom with students learning grammar",
  "style": "educational",
  "aspect_ratio": "16:9"
}
```

**Response 200:**
```json
{
  "image_url": "https://generated-image-url.com/image.jpg",
  "prompt_used": "English classroom with students learning grammar",
  "generation_id": "img_1234567890"
}
```

---

## 📚 Módulo de Cursos

### GET /api/courses
**🌐 Público** | Obtener lista de cursos

**Query Parameters:**
- `level` (opcional): beginner, intermediate, advanced
- `category` (opcional): grammar, vocabulary, conversation
- `limit` (opcional): Número de cursos (default: 20)
- `offset` (opcional): Paginación (default: 0)

**Response 200:**
```json
{
  "courses": [
    {
      "id": "course_123",
      "title": "English Grammar Fundamentals",
      "description": "Master the basics of English grammar",
      "level": "beginner",
      "category": "grammar",
      "lessons_count": 15,
      "duration_hours": 8,
      "thumbnail": "https://example.com/course-thumb.jpg",
      "is_premium": false
    }
  ],
  "total": 25,
  "has_more": true
}
```

### GET /api/courses/:id
**🌐 Público** | Obtener detalles de curso específico

**Response 200:**
```json
{
  "course": {
    "id": "course_123",
    "title": "English Grammar Fundamentals",
    "description": "Master the basics of English grammar",
    "level": "beginner",
    "category": "grammar",
    "lessons": [
      {
        "id": "lesson_456",
        "title": "Present Simple Tense",
        "duration_minutes": 30,
        "order": 1,
        "is_completed": false
      }
    ],
    "instructor": {
      "name": "Sarah Johnson",
      "bio": "Certified English teacher with 10 years experience"
    }
  }
}
```

---

## 🎥 Módulo de Video

### GET /api/video/stream/:lessonId
**🔒 Privado** | Stream de video de lección

**Response 200:**
```json
{
  "video_url": "https://cdn.example.com/videos/lesson_456.m3u8",
  "subtitles": [
    {
      "language": "en",
      "url": "https://cdn.example.com/subtitles/lesson_456_en.vtt"
    },
    {
      "language": "es",
      "url": "https://cdn.example.com/subtitles/lesson_456_es.vtt"
    }
  ],
  "duration": 1800
}
```

---

## 📊 Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado exitosamente |
| 400 | Bad Request - Datos de entrada inválidos |
| 401 | Unauthorized - Token de autenticación requerido |
| 403 | Forbidden - Permisos insuficientes |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto con el estado actual |
| 429 | Too Many Requests - Límite de rate exceeded |
| 500 | Internal Server Error - Error interno del servidor |

---

## 🔒 Seguridad y Rate Limiting

### Rate Limits
- **Endpoints públicos**: 100 requests/15 minutos por IP
- **Endpoints privados**: 1000 requests/15 minutos por usuario
- **AI endpoints**: 50 requests/15 minutos por usuario

### Headers de Seguridad
```
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000
```

---

## 🧪 Ejemplos de Uso

### JavaScript/Fetch
```javascript
// Obtener perfil del usuario
const response = await fetch('/api/users/profile', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const profile = await response.json();

// Chat con IA
const chatResponse = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Help me with English grammar' }
    ]
  })
});
```

### cURL
```bash
# Obtener productos de Stripe
curl -X GET "https://deacademy-rlovoli1p-radhika1.vercel.app/api/stripe/products" \
  -H "Content-Type: application/json"

# Crear suscripción
curl -X POST "https://deacademy-rlovoli1p-radhika1.vercel.app/api/stripe/create-subscription" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price_id": "price_1234567890",
    "payment_method_id": "pm_1234567890"
  }'
```

---

**Última actualización**: Enero 2025  
**Versión API**: v1.0.0  
**Documentación generada**: Automáticamente desde el código fuente