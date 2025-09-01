# 🔌 Guía de Integración de APIs - Digital English Academy

## Servicios de IA Requeridos

### 1. OpenAI API (Recomendado)

```javascript
// Configuración en tu backend
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Endpoint: POST /api/ai/chat
app.post('/api/ai/chat', async (req, res) => {
  const { messages } = req.body;
  
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages,
    max_tokens: 150,
    temperature: 0.7
  });
  
  res.json({ content: completion.choices[0].message.content });
});
```

### 2. Azure OpenAI (Alternativa)

```javascript
const { OpenAIApi, Configuration } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.AZURE_OPENAI_KEY,
  basePath: `https://${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
  baseOptions: {
    headers: { 'api-key': process.env.AZURE_OPENAI_KEY },
    params: { 'api-version': '2023-05-15' }
  }
});
```

### 3. Anthropic Claude (Alternativa)

```javascript
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.post('/api/ai/chat', async (req, res) => {
  const { messages } = req.body;
  
  const message = await anthropic.messages.create({
    model: "claude-3-sonnet-20240229",
    max_tokens: 150,
    messages: messages
  });
  
  res.json({ content: message.content[0].text });
});
```

## Estructura de Backend Recomendada

### Node.js + Express

```
backend/
├── server.js
├── routes/
│   ├── ai.js
│   ├── auth.js
│   ├── courses.js
│   └── users.js
├── middleware/
│   ├── auth.js
│   └── validation.js
├── models/
│   ├── User.js
│   ├── Course.js
│   └── Progress.js
└── config/
    ├── database.js
    └── ai.js
```

### Ejemplo server.js

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/ai', require('./routes/ai'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/users', require('./routes/users'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Variables de Entorno del Backend

```env
# AI Service
OPENAI_API_KEY=sk-...
AZURE_OPENAI_KEY=...
AZURE_OPENAI_ENDPOINT=...
AZURE_OPENAI_DEPLOYMENT=...
ANTHROPIC_API_KEY=...

# Database
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...

# Auth0
AUTH0_DOMAIN=...
AUTH0_AUDIENCE=...
AUTH0_CLIENT_SECRET=...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# General
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://digitalenglishacademy.com
```

## Endpoints Requeridos

### 1. Chat AI

```
POST /api/ai/chat
Content-Type: application/json
Authorization: Bearer <token>

{
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."}
  ],
  "json": false
}

Response:
{
  "content": "AI response text"
}
```

### 2. Generación de Imágenes

```
POST /api/ai/images
Content-Type: application/json
Authorization: Bearer <token>

{
  "prompt": "English course image",
  "aspect_ratio": "16:9"
}

Response:
{
  "url": "https://generated-image-url.com/image.jpg"
}
```

### 3. Gestión de Usuarios

```
GET /api/users/profile
PUT /api/users/profile
POST /api/users/progress
GET /api/users/progress
```

### 4. Cursos

```
GET /api/courses
GET /api/courses/:id
POST /api/courses (admin only)
PUT /api/courses/:id (admin only)
```

## Despliegue Recomendado

### Opción 1: Vercel + Supabase

- Frontend: Vercel
- Backend: Vercel Functions
- Database: Supabase (PostgreSQL)
- Auth: Auth0
- AI: OpenAI API

### Opción 2: Netlify + MongoDB Atlas

- Frontend: Netlify
- Backend: Netlify Functions
- Database: MongoDB Atlas
- Auth: Auth0
- AI: OpenAI API

### Opción 3: AWS

- Frontend: S3 + CloudFront
- Backend: Lambda + API Gateway
- Database: DocumentDB o RDS
- Auth: Cognito o Auth0
- AI: Bedrock o OpenAI API

### Opción 4: Servidor Propio

- Frontend: Nginx
- Backend: Node.js + PM2
- Database: MongoDB
- Reverse Proxy: Nginx
- SSL: Let's Encrypt

## Configuración de Producción

### 1. Variables de Entorno Frontend

```javascript
// En tu build process
window.deaConfig = {
  apiBaseURL: 'https://api.digitalenglishacademy.com',
  auth0Domain: 'your-domain.auth0.com',
  auth0ClientId: 'your-client-id',
  stripePublishableKey: 'pk_live_...',
  environment: 'production'
};
```

### 2. Configuración de CORS

```javascript
app.use(cors({
  origin: [
    'https://digitalenglishacademy.com',
    'https://www.digitalenglishacademy.com'
  ],
  credentials: true
}));
```

### 3. Configuración de Auth0

- Allowed Callback URLs: `https://digitalenglishacademy.com`
- Allowed Logout URLs: `https://digitalenglishacademy.com`
- Allowed Web Origins: `https://digitalenglishacademy.com`

## Monitoreo y Logs

### Herramientas Recomendadas

- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **DataDog**: Performance monitoring
- **Stripe Dashboard**: Payment monitoring

### Métricas Importantes

- Response time de APIs
- Error rate de IA
- Conversion rate de pagos
- User engagement

## Costos Estimados (Mensual)

### Servicios de IA

- OpenAI API: $20-100 (según uso)
- Azure OpenAI: $30-120
- Anthropic: $25-90

### Infraestructura

- Vercel Pro: $20
- MongoDB Atlas: $9-57
- Auth0: $23-240
- Stripe: 2.9% + $0.30 por transacción

### Total Estimado: $100-500/mes

(Dependiendo del volumen de usuarios)

## Soporte Técnico

Para implementar estas integraciones:

1. 📧 Email: <dev@digitalenglishacademy.com>
2. 💬 Discord: [Servidor de Desarrollo]
3. 📚 Docs: /docs/technical/
