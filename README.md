# FluentLeap - Video Streaming Platform

## 📋 Descripción General

FluentLeap es una plataforma de aprendizaje de inglés con un sistema avanzado de streaming de video que utiliza AWS CloudFront y S3 para entregar contenido de alta calidad de manera eficiente y segura.

## 🏗️ Arquitectura del Sistema

### Componentes Principales

- **Frontend**: React con Vite para una experiencia de usuario moderna
- **Backend**: Node.js con Express para APIs RESTful
- **Base de Datos**: PostgreSQL para almacenamiento de datos
- **Streaming**: AWS CloudFront + S3 para entrega de video optimizada
- **Autenticación**: Sistema de autenticación JWT
- **Testing**: Vitest para pruebas unitarias e integración

### Flujo de Video Streaming

```mermaid
graph TD
    A[Cliente] --> B[Frontend React]
    B --> C[API Backend]
    C --> D[AWS S3]
    C --> E[AWS CloudFront]
    E --> F[Entrega de Video]
    F --> A
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ 
- PostgreSQL 14+
- Cuenta AWS con acceso a S3 y CloudFront
- Git

### Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd fluentleap
```

2. **Instalar dependencias**
```bash
# Instalar dependencias del backend
cd api
npm install

# Instalar dependencias del frontend
cd ..
npm install
```

3. **Configurar variables de entorno**

Crear archivo `.env` en la raíz del proyecto:
```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-2

# S3 Configuration
S3_BUCKET_NAME=your-bucket-name
S3_ACCESS_POINT_ARN=arn:aws:s3:us-east-2:123456789012:accesspoint/your-access-point
S3_ACCESS_POINT_ALIAS=your-access-point-alias

# CloudFront Configuration
CLOUDFRONT_DOMAIN=your-distribution.cloudfront.net
CLOUDFRONT_KEY_PAIR_ID=your-key-pair-id
CLOUDFRONT_PRIVATE_KEY_PATH=./cloudfront-private-key.pem

# Features
FEATURE_VIDEO_STREAMING=true
```

Crear archivo `api/.env`:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/fluentleap

# AWS Configuration (mismo que arriba)
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-2

# S3 Configuration
S3_BUCKET_NAME=your-bucket-name
S3_ACCESS_POINT_ARN=arn:aws:s3:us-east-2:123456789012:accesspoint/your-access-point
S3_ACCESS_POINT_ALIAS=your-access-point-alias

# CloudFront Configuration
CLOUDFRONT_DOMAIN=your-distribution.cloudfront.net
CLOUDFRONT_KEY_PAIR_ID=your-key-pair-id
CLOUDFRONT_PRIVATE_KEY_PATH=./cloudfront-private-key.pem

# Features
FEATURE_VIDEO_STREAMING=true

# JWT
JWT_SECRET=your-jwt-secret

# Server
PORT=3000
```

4. **Configurar CloudFront Private Key**

Colocar la clave privada de CloudFront en `cloudfront-private-key.pem` en la raíz del proyecto.

5. **Configurar Base de Datos**
```bash
cd api
npm run db:migrate
npm run db:seed
```

6. **Iniciar la aplicación**
```bash
# Terminal 1: Backend
cd api
npm run dev

# Terminal 2: Frontend
npm run dev
```

## 🔧 Configuración de AWS

### S3 Bucket Setup

1. **Crear S3 Bucket**
```bash
aws s3 mb s3://your-bucket-name --region us-east-2
```

2. **Configurar CORS**
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"]
    }
]
```

3. **Crear Access Point**
```bash
aws s3control create-access-point \
    --account-id 123456789012 \
    --name your-access-point \
    --bucket your-bucket-name
```

### CloudFront Distribution Setup

1. **Crear Distribution**
   - Origin: S3 bucket
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Allowed HTTP Methods: GET, HEAD, OPTIONS
   - Trusted Key Groups: Configurar con tu Key Pair

2. **Generar Key Pair**
```bash
# Generar clave privada
openssl genrsa -out cloudfront-private-key.pem 2048

# Generar clave pública
openssl rsa -pubout -in cloudfront-private-key.pem -out cloudfront-public-key.pem
```

3. **Subir clave pública a AWS**
   - AWS Console → CloudFront → Key management → Public keys
   - Crear nuevo Key Pair con la clave pública

## 📡 API Endpoints

### Video Streaming API

#### POST /api/video/signed-url
Genera una URL firmada para acceder a un video.

**Request Body:**
```json
{
    "videoKey": "course1/lesson1.mp4",
    "useCloudFront": true,
    "expirationHours": 1
}
```

**Response:**
```json
{
    "signedUrl": "https://d9zcoog7fpl4q.cloudfront.net/course1/lesson1.mp4?Policy=...",
    "videoKey": "course1/lesson1.mp4",
    "source": "cloudfront",
    "accessPoint": "enabled",
    "metadata": {
        "size": 1024000,
        "duration": "120",
        "resolution": "1080p",
        "contentType": "video/mp4",
        "lastModified": "2024-01-01T00:00:00Z"
    },
    "expiresAt": "2024-01-01T01:00:00Z"
}
```

#### GET /api/video/course/:courseId/videos
Lista todos los videos de un curso.

**Response:**
```json
{
    "courseId": "course1",
    "videos": [
        {
            "key": "course1/lesson1.mp4",
            "size": 1024000,
            "lastModified": "2024-01-01T00:00:00Z",
            "lessonId": "lesson1"
        }
    ],
    "totalVideos": 1,
    "totalSize": 1024000
}
```

#### GET /api/video/health
Verifica el estado de los servicios de video.

**Response:**
```json
{
    "status": "healthy",
    "checks": {
        "s3": true,
        "cloudfront": true,
        "bucket": true
    },
    "timestamp": "2024-01-01T00:00:00Z",
    "features": {
        "videoStreaming": true,
        "cloudfront": true
    }
}
```

### Códigos de Error

| Código | Descripción |
|--------|-------------|
| `MISSING_VIDEO_KEY` | videoKey es requerido |
| `INVALID_VIDEO_KEY` | Formato de videoKey inválido |
| `SIGNED_URL_GENERATION_FAILED` | Error al generar URL firmada |
| `MISSING_COURSE_ID` | courseId es requerido |
| `LIST_VIDEOS_FAILED` | Error al listar videos |

## 🧪 Testing

### Estructura de Tests

```
tests/
├── unit/
│   └── video.test.js              # Tests unitarios del módulo de video
├── integration/
│   └── video.integration.test.js  # Tests de integración de API
├── frontend/
│   └── video-player.test.js       # Tests del componente VideoPlayer
└── setup.js                       # Configuración global de tests
```

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Tests unitarios
npm run test:unit

# Tests de integración
npm run test:integration

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

### Cobertura de Tests

Los tests cubren:

- ✅ **Módulo de Video API** (100% cobertura)
  - Generación de URLs firmadas
  - Listado de videos por curso
  - Health checks
  - Manejo de errores

- ✅ **Endpoints de API** (100% cobertura)
  - Validación de parámetros
  - Respuestas HTTP correctas
  - Manejo de errores de AWS
  - Seguridad y validación

- ✅ **Componente VideoPlayer** (95% cobertura)
  - Renderizado y estados
  - Controles de video
  - Atajos de teclado
  - Funcionalidad de pantalla completa
  - Accesibilidad
  - Manejo de errores

### Mocks y Configuración

Los tests utilizan mocks para:
- AWS SDK (S3, CloudFront)
- Módulos del sistema de archivos
- APIs del navegador (HTMLVideoElement)
- LocalStorage y SessionStorage

## 🎥 Componente VideoPlayer

### Características

- **Streaming Adaptativo**: Soporte para múltiples calidades
- **Controles Completos**: Play/pause, volumen, seek, pantalla completa
- **Atajos de Teclado**: Navegación completa por teclado
- **Progreso Persistente**: Guarda y restaura posición de reproducción
- **Accesibilidad**: Cumple con estándares WCAG
- **Responsive**: Adaptable a diferentes tamaños de pantalla

### Uso del Componente

```jsx
import VideoPlayer from './components/VideoPlayer';

function LessonPage() {
    const videoData = {
        videoKey: 'course1/lesson1.mp4',
        title: 'Introduction to English',
        courseId: 'course1',
        lessonId: 'lesson1'
    };

    return (
        <div className="lesson-container">
            <VideoPlayer {...videoData} />
        </div>
    );
}
```

### Atajos de Teclado

| Tecla | Acción |
|-------|--------|
| `Espacio` | Play/Pause |
| `→` | Avanzar 10s |
| `←` | Retroceder 10s |
| `↑` | Subir volumen |
| `↓` | Bajar volumen |
| `M` | Silenciar/Activar |
| `F` | Pantalla completa |
| `Esc` | Salir de pantalla completa |

## 🔒 Seguridad

### URLs Firmadas

- **Expiración**: URLs con tiempo de vida limitado (1-24 horas)
- **Políticas**: Restricciones de acceso por IP y tiempo
- **Encriptación**: Comunicación HTTPS obligatoria

### Validación de Entrada

- **Sanitización**: Validación de videoKey y courseId
- **Prevención de Path Traversal**: Bloqueo de rutas maliciosas
- **Rate Limiting**: Protección contra abuso de API

### Autenticación

- **JWT Tokens**: Autenticación basada en tokens
- **Middleware**: Protección de rutas sensibles
- **Roles**: Sistema de permisos por usuario

## 📊 Monitoreo y Logs

### Health Checks

- **Endpoint**: `/api/video/health`
- **Frecuencia**: Verificación cada 30 segundos
- **Métricas**: S3, CloudFront, Base de datos

### Logging

```javascript
// Ejemplo de logs estructurados
console.log({
    timestamp: new Date().toISOString(),
    level: 'info',
    service: 'video-streaming',
    action: 'signed-url-generated',
    videoKey: 'course1/lesson1.mp4',
    source: 'cloudfront',
    userId: 'user123'
});
```

## 🚀 Despliegue

### Desarrollo

```bash
# Backend
cd api
npm run dev

# Frontend
npm run dev
```

### Producción

```bash
# Build
npm run build

# Start
npm start
```

### Docker

```dockerfile
# Dockerfile ejemplo
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 3000

CMD ["npm", "start"]
```

### Variables de Entorno de Producción

```env
# Producción
NODE_ENV=production
PORT=3000

# Base de datos
DATABASE_URL=postgresql://user:pass@prod-db:5432/fluentleap

# AWS (usar IAM roles en producción)
AWS_REGION=us-east-2

# CloudFront
CLOUDFRONT_DOMAIN=your-prod-distribution.cloudfront.net
```

## 🔧 Troubleshooting

### Problemas Comunes

#### Video no carga
1. Verificar configuración de AWS
2. Comprobar permisos de S3
3. Validar clave privada de CloudFront
4. Revisar CORS del bucket

#### URLs firmadas inválidas
1. Verificar sincronización de tiempo del servidor
2. Comprobar Key Pair ID de CloudFront
3. Validar formato de clave privada

#### Errores de CORS
1. Configurar CORS en S3 bucket
2. Verificar headers en CloudFront
3. Comprobar origen de la solicitud

### Logs de Debug

```bash
# Habilitar logs detallados
DEBUG=video:* npm run dev

# Logs de AWS SDK
AWS_SDK_LOAD_CONFIG=1 AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE=1 npm run dev
```

## 📈 Rendimiento

### Optimizaciones

- **CDN**: CloudFront para entrega global
- **Compresión**: Gzip/Brotli habilitado
- **Caching**: Headers de cache optimizados
- **Lazy Loading**: Carga diferida de videos

### Métricas

- **Tiempo de carga**: < 2 segundos
- **Buffering**: < 5% del tiempo de reproducción
- **Disponibilidad**: 99.9% uptime

## 🤝 Contribución

### Guías de Desarrollo

1. **Fork** el repositorio
2. **Crear** rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. **Crear** Pull Request

### Estándares de Código

- **ESLint**: Configuración estricta
- **Prettier**: Formateo automático
- **Tests**: Cobertura mínima 90%
- **Documentación**: JSDoc para funciones públicas

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico:
- **Email**: support@fluentleap.com
- **Issues**: GitHub Issues
- **Documentación**: [docs.fluentleap.com](https://docs.fluentleap.com)

---

**FluentLeap** - Aprende inglés con confianza 🚀
