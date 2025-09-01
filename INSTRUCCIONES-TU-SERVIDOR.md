# 🚀 Instrucciones para TU Servidor - denglishacademy.com

## 📋 Tu Configuración

- **IP**: 34.196.15.155
- **Usuario**: bitnami
- **Región**: us-east-1
- **Tipo**: Bitnami (no Node.js puro)

## ⚡ Pasos Súper Rápidos

### 1. Descargar Clave SSH (1 minuto)

1. Ve a [Lightsail Console](https://lightsail.aws.amazon.com/)
2. Click "Account" → "SSH Keys"
3. Descarga "LightsailDefaultKey-us-east-1.pem"
4. Guárdala en: `C:\Users\TU-USUARIO\.ssh\LightsailDefaultKey-us-east-1.pem`

### 2. Configurar DNS (2 minutos)

En tu proveedor de dominio denglishacademy.com:

```
Tipo A: denglishacademy.com → 34.196.15.155
Tipo A: www.denglishacademy.com → 34.196.15.155
```

### 3. Ejecutar Setup Automático (1 comando)

```bash
# Navegar a tu proyecto
cd C:\ruta\a\digital-english-academy

# Ejecutar setup específico para Bitnami
deploy\scripts\setup-bitnami.bat
```

## ✅ Resultado Esperado

- ✅ Página funcionando en <http://34.196.15.155> (inmediato)
- ✅ Página funcionando en <https://denglishacademy.com> (después de DNS)
- ✅ SSL automático configurado
- ✅ Backend API funcionando en puerto 3001
- ✅ Listo para demostrar al cliente

## 🔧 Scripts Creados Automáticamente

- `check-status.bat` - Verificar estado del sitio
- `update-site.bat` - Actualizar el sitio
- `configure-auth0.bat` - Configurar Auth0 (opcional)
- `configure-stripe.bat` - Configurar Stripe (opcional)

## 📞 Si Algo Falla

### Error: "SSH key not found"

```bash
# Descargar clave SSH desde Lightsail Console
# Guardar en: C:\Users\TU-USUARIO\.ssh\LightsailDefaultKey-us-east-1.pem
```

### Error: "SSH not available"

```bash
# Instalar OpenSSH o usar Git Bash
# O usar PowerShell con SSH habilitado
```

### Error: "Build failed"

```bash
# Verificar que estás en la carpeta correcta del proyecto
# Ejecutar: npm install
```

## 🎯 Después del Setup

### Verificar que funciona

1. Ir a <http://34.196.15.155> (debe cargar inmediatamente)
2. Esperar DNS y ir a <https://denglishacademy.com>
3. Probar navegación en móvil y desktop

### Para funcionalidad completa (opcional)

1. **Auth0**: `configure-auth0.bat tu-domain.auth0.com abc123...`
2. **Stripe**: `configure-stripe.bat pk_test_... https://buy.stripe.com/...`

## 💰 Costos

- **Lightsail**: $10/mes (ya pagando)
- **Auth0**: Gratis hasta 7,000 usuarios
- **Stripe**: Solo cuando vendas (2.9% + $0.30)
- **Total**: $10/mes

## 🎉 ¡Listo para Vender

Tu plataforma estará funcionando perfectamente para:

- ✅ Demostrar al cliente
- ✅ Mostrar todas las funcionalidades
- ✅ Navegación completa
- ✅ Diseño profesional
- ✅ Responsive en móvil

**¡Solo ejecuta el comando y en 10 minutos tendrás tu plataforma online!** 🚀
