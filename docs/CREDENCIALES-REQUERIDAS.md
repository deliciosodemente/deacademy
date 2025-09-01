# 🔐 Credenciales Requeridas - Digital English Academy

## ¿Necesito credenciales para subir la página?

**NO** - La página funciona perfectamente sin credenciales como **demo interactivo**.

**SÍ** - Si quieres funcionalidad completa (login, pagos, IA).

## 🎯 Comparación de Funcionalidades

| Funcionalidad | Sin Credenciales | Con Credenciales |
|---------------|------------------|------------------|
| **Navegación** | ✅ Completa | ✅ Completa |
| **Diseño** | ✅ Responsive | ✅ Responsive |
| **Vistas** | ✅ Todas las páginas | ✅ Todas las páginas |
| **Datos demo** | ✅ Cursos, lecciones | ✅ + Datos reales |
| **Login/Registro** | ❌ Solo botones | ✅ Funcional |
| **Pagos** | ❌ Solo demo | ✅ Stripe real |
| **Chat IA** | ❌ Respuestas fijas | ✅ IA real |
| **Base de datos** | ✅ localStorage | ✅ MongoDB |

## 🚀 Recomendación para Venta

### Fase 1: Demo (0 credenciales) - PERFECTO para mostrar

```bash
# Subir inmediatamente sin configurar nada
./deploy/scripts/deploy-lightsail.sh TU-IP denglishacademy.com
```

**Resultado**: Página completamente funcional para demostrar al cliente

### Fase 2: Producción (con credenciales) - Después de la venta

Una vez que vendas, configurar las credenciales para funcionalidad completa.

## 📝 Credenciales Necesarias (Solo para Fase 2)

### 1. Auth0 (Autenticación) - GRATIS hasta 7,000 usuarios

**¿Qué hace?** Login con Google, Facebook, email
**Costo:** Gratis hasta 7,000 usuarios/mes
**Tiempo setup:** 5 minutos

```env
AUTH0_DOMAIN=tu-dominio.auth0.com
AUTH0_CLIENT_ID=abc123...
```

**Pasos:**

1. Crear cuenta en [auth0.com](https://auth0.com)
2. Crear aplicación "Single Page Application"
3. Copiar Domain y Client ID

### 2. Stripe (Pagos) - Solo si vendes suscripciones

**¿Qué hace?** Procesar pagos de suscripciones
**Costo:** 2.9% + $0.30 por transacción
**Tiempo setup:** 10 minutos

```env
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PAYMENT_LINK=https://buy.stripe.com/...
```

**Pasos:**

1. Crear cuenta en [stripe.com](https://stripe.com)
2. Crear productos/precios
3. Crear Payment Links
4. Copiar claves

### 3. MongoDB (Base de datos) - GRATIS hasta 512MB

**¿Qué hace?** Guardar usuarios, progreso, cursos
**Costo:** Gratis hasta 512MB
**Tiempo setup:** 5 minutos

```env
MONGODB_CONNECTION_STRING=mongodb+srv://...
```

**Pasos:**

1. Crear cuenta en [mongodb.com/atlas](https://mongodb.com/atlas)
2. Crear cluster gratuito
3. Crear usuario de base de datos
4. Copiar connection string

### 4. OpenAI (IA) - OPCIONAL

**¿Qué hace?** Chat inteligente, tutorías personalizadas
**Costo:** ~$20-50/mes según uso
**Tiempo setup:** 5 minutos

```env
OPENAI_API_KEY=sk-...
```

## 💡 Estrategia Recomendada

### Para Demostrar y Vender (HOY MISMO)

```bash
# 1. Subir sin credenciales (5 minutos)
./deploy/scripts/deploy-lightsail.sh TU-IP denglishacademy.com

# 2. Mostrar al cliente
# 3. Vender basado en el demo
# 4. Configurar credenciales después de la venta
```

### Después de Vender

1. **Auth0** (obligatorio para login)
2. **Stripe** (obligatorio para pagos)
3. **MongoDB** (recomendado para datos)
4. **OpenAI** (opcional, mejora la experiencia)

## 🎯 Script de Venta Sugerido

**"Mira, aquí tienes tu plataforma funcionando en denglishacademy.com"**

✅ **Lo que SÍ funciona ahora:**

- Navegación completa
- Diseño profesional
- Todas las secciones
- Responsive en móvil
- Datos de demostración

✅ **Lo que activamos después del pago:**

- Sistema de login real
- Procesamiento de pagos
- Chat con IA
- Base de datos en la nube

## 📞 Soporte para Configuración

### Opción 1: Tú mismo (Gratis)

- Seguir las guías paso a paso
- Tiempo estimado: 30 minutos total

### Opción 2: Soporte Premium ($50)

- Configuramos todo por ti
- Incluye optimizaciones
- Garantía de funcionamiento

## 💰 Costos Reales Mensuales

| Servicio | Costo | Necesario |
|----------|-------|-----------|
| **AWS Lightsail** | $10/mes | ✅ Obligatorio |
| **Auth0** | Gratis | ✅ Para login |
| **Stripe** | 2.9% por venta | ✅ Para pagos |
| **MongoDB** | Gratis | ⚠️ Recomendado |
| **OpenAI** | $20-50/mes | ❌ Opcional |
| **Total mínimo** | **$10/mes** | |

## 🚀 Comando para Subir AHORA (Sin credenciales)

```bash
# Windows
deploy\scripts\deploy-lightsail.bat TU-IP-LIGHTSAIL denglishacademy.com

# Linux/Mac  
./deploy/scripts/deploy-lightsail.sh TU-IP-LIGHTSAIL denglishacademy.com
```

**Resultado**: Página completamente funcional para demostrar y vender.

## ✅ Checklist de Demo

- [ ] Página carga en <https://denglishacademy.com>
- [ ] Navegación funciona
- [ ] Se ve bien en móvil
- [ ] Todas las secciones cargan
- [ ] Botones responden (aunque no hagan login real)

**¡Listo para vender!** 🎉

---

**Resumen**: Sube la página HOY sin credenciales para demostrar. Configura credenciales DESPUÉS de vender para activar funcionalidad completa.
