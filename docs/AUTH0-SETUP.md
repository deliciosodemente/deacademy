# 🔐 Configuración de Auth0 - Digital English Academy

## Paso 1: Crear Cuenta en Auth0

1. Ve a [auth0.com](https://auth0.com)
2. Click "Sign Up"
3. Crea tu cuenta (puedes usar Google/GitHub)
4. Verifica tu email

## Paso 2: Crear Aplicación

1. En el Dashboard de Auth0, ve a **Applications**
2. Click **"Create Application"**
3. Configurar:
   - **Name**: `Digital English Academy`
   - **Application Type**: `Single Page Web Applications`
   - Click **"Create"**

## Paso 3: Configurar la Aplicación

### 3.1 Settings Básicos

En la pestaña **Settings**:

```
Name: Digital English Academy
Description: Plataforma de aprendizaje de inglés
Application Type: Single Page Web Applications
Token Endpoint Authentication Method: None
```

### 3.2 Application URIs

```
Allowed Callback URLs:
http://localhost:3000,
https://denglishacademy.com,
https://www.denglishacademy.com

Allowed Logout URLs:
http://localhost:3000,
https://denglishacademy.com,
https://www.denglishacademy.com

Allowed Web Origins:
http://localhost:3000,
https://denglishacademy.com,
https://www.denglishacademy.com

Allowed Origins (CORS):
http://localhost:3000,
https://denglishacademy.com,
https://www.denglishacademy.com
```

### 3.3 Advanced Settings

En **Advanced Settings > OAuth**:

```
JsonWebToken Signature Algorithm: RS256
OIDC Conformant: ✅ Enabled
```

## Paso 4: Obtener Credenciales

En la pestaña **Settings**, copia estos valores:

```
Domain: tu-dominio.auth0.com
Client ID: abc123def456ghi789
```

## Paso 5: Configurar Variables de Entorno

### Para Desarrollo (.env)

```env
AUTH0_DOMAIN=tu-dominio.auth0.com
AUTH0_CLIENT_ID=abc123def456ghi789
AUTH0_AUDIENCE=https://denglishacademy.com/api
```

### Para Producción (en el servidor)

```bash
# Conectar al servidor
ssh -i ~/.ssh/LightsailDefaultKey-us-east-1.pem ubuntu@TU-IP

# Crear archivo de configuración
nano /var/www/denglishacademy/.env
```

Contenido del archivo:

```env
NODE_ENV=production
AUTH0_DOMAIN=tu-dominio.auth0.com
AUTH0_CLIENT_ID=abc123def456ghi789
AUTH0_AUDIENCE=https://denglishacademy.com/api
```

## Paso 6: Configurar Roles y Permisos (Opcional)

### 6.1 Crear Roles

1. Ve a **User Management > Roles**
2. Click **"Create Role"**
3. Crear estos roles:

```
Name: admin
Description: Administrador del sistema

Name: teacher  
Description: Profesor de inglés

Name: student
Description: Estudiante (rol por defecto)

Name: moderator
Description: Moderador de comunidad
```

### 6.2 Crear API

1. Ve a **Applications > APIs**
2. Click **"Create API"**
3. Configurar:
   - **Name**: `Digital English Academy API`
   - **Identifier**: `https://denglishacademy.com/api`
   - **Signing Algorithm**: `RS256`

### 6.3 Definir Scopes

En tu API, ve a **Scopes** y agrega:

```
read:profile - Leer perfil de usuario
write:profile - Editar perfil de usuario
read:courses - Acceder a cursos
write:progress - Guardar progreso
admin:all - Acceso completo de administrador
```

## Paso 7: Personalizar Login

### 7.1 Configurar Branding

1. Ve a **Branding > Universal Login**
2. Configurar:
   - **Logo URL**: `https://denglishacademy.com/logo.png`
   - **Primary Color**: `#0a66ff`
   - **Page Background**: `Linear Gradient` o imagen personalizada

### 7.2 Personalizar Textos

1. Ve a **Branding > Text Customizations**
2. Seleccionar **Spanish** como idioma
3. Personalizar textos:

```json
{
  "login": {
    "title": "Iniciar Sesión - Digital English Academy",
    "description": "Accede a tu cuenta para continuar aprendiendo inglés",
    "buttonText": "Iniciar Sesión",
    "signupActionLinkText": "Crear cuenta",
    "signupActionText": "¿No tienes cuenta?",
    "forgotPasswordText": "¿Olvidaste tu contraseña?"
  },
  "signup": {
    "title": "Crear Cuenta - Digital English Academy", 
    "description": "Únete a miles de estudiantes que ya dominan el inglés",
    "buttonText": "Crear Cuenta",
    "loginActionLinkText": "Iniciar sesión",
    "loginActionText": "¿Ya tienes cuenta?"
  }
}
```

## Paso 8: Configurar Reglas (Opcional)

### 8.1 Agregar Información del Usuario

1. Ve a **Auth Pipeline > Rules**
2. Click **"Create Rule"**
3. Seleccionar **"Empty rule"**
4. Nombre: `Add User Metadata`

```javascript
function addUserMetadata(user, context, callback) {
  const namespace = 'https://denglishacademy.com/';
  
  // Agregar rol por defecto
  if (!user.app_metadata || !user.app_metadata.role) {
    user.app_metadata = user.app_metadata || {};
    user.app_metadata.role = 'student';
  }
  
  // Agregar información al token
  context.idToken[namespace + 'role'] = user.app_metadata.role;
  context.idToken[namespace + 'user_id'] = user.user_id;
  context.accessToken[namespace + 'role'] = user.app_metadata.role;
  
  callback(null, user, context);
}
```

## Paso 9: Testing

### 9.1 Test de Desarrollo

```bash
# En tu proyecto local
npm run dev
# Ir a http://localhost:3000 y probar login
```

### 9.2 Test de Producción

```bash
# Después del despliegue
curl -I https://denglishacademy.com
# Ir a https://denglishacademy.com y probar login
```

## Paso 10: Monitoreo

### 10.1 Logs de Auth0

1. Ve a **Monitoring > Logs**
2. Filtrar por:
   - **Type**: `Success Login` / `Failed Login`
   - **Connection**: Tu aplicación

### 10.2 Analytics

1. Ve a **Monitoring > Analytics**
2. Revisar:
   - Logins por día
   - Usuarios activos
   - Errores de autenticación

## 🔧 Troubleshooting

### Error: "Callback URL mismatch"

```
Solución: Verificar que las URLs en Auth0 coincidan exactamente con tu dominio
```

### Error: "Access denied"

```
Solución: Verificar que el Client ID sea correcto en tu .env
```

### Error: "Invalid audience"

```
Solución: Verificar que AUTH0_AUDIENCE coincida con el API Identifier
```

## 📞 Soporte Auth0

- 📚 **Documentación**: [auth0.com/docs](https://auth0.com/docs)
- 💬 **Community**: [community.auth0.com](https://community.auth0.com)
- 🎓 **Universidad**: [auth0.com/university](https://auth0.com/university)

## ✅ Checklist Final

- [ ] Aplicación creada en Auth0
- [ ] URLs configuradas correctamente
- [ ] Credenciales copiadas a .env
- [ ] Branding personalizado
- [ ] Roles y permisos configurados
- [ ] Login funcionando en desarrollo
- [ ] Login funcionando en producción

¡Tu sistema de autenticación está listo! 🎉
