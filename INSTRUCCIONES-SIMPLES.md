# 🚀 Instrucciones Súper Simples - denglishacademy.com

## TÚ HACES (2 minutos)

### 1. Crear Instancia Lightsail

1. Ve a [AWS Lightsail Console](https://lightsail.aws.amazon.com/)
2. Click "Create instance"
3. Selecciona:
   - **Platform**: Linux/Unix  
   - **Blueprint**: Node.js
   - **Plan**: $10/month
   - **Name**: denglishacademy-prod
4. Click "Create instance"
5. **COPIA LA IP** (ej: 3.85.123.45)

### 2. Configurar DNS

En tu proveedor de dominio:

```
Tipo A: denglishacademy.com → TU-IP-LIGHTSAIL
Tipo A: www.denglishacademy.com → TU-IP-LIGHTSAIL
```

### 3. Descargar Clave SSH

1. En Lightsail, ve a "Account" > "SSH Keys"
2. Descarga "LightsailDefaultKey-us-east-1.pem"
3. Guárdala en: `C:\Users\TU-USUARIO\.ssh\LightsailDefaultKey-us-east-1.pem`

---

## YO HAGO TODO LO DEMÁS

### Ejecutar desde tu proyecto

```bash
# Navegar al proyecto
cd C:\ruta\a\digital-english-academy

# Ejecutar setup completo (reemplaza con tu IP)
deploy\scripts\setup-complete.bat 3.85.123.45 denglishacademy.com admin@denglishacademy.com
```

## ✅ Resultado

- ✅ Página funcionando en <https://denglishacademy.com>
- ✅ SSL configurado automáticamente
- ✅ Backend API funcionando
- ✅ Listo para demostrar y vender

---

## 🔐 OPCIONAL: Funcionalidad Completa

Si quieres login y pagos reales (después de vender):

### Auth0 (5 minutos)

1. Ve a [auth0.com](https://auth0.com) → Crear cuenta
2. Crear aplicación "Single Page Web Applications"
3. Configurar URLs: `https://denglishacademy.com`
4. Copiar Domain y Client ID
5. Ejecutar: `configure-auth0.bat tu-domain.auth0.com abc123...`

### Stripe (10 minutos)

1. Ve a [stripe.com](https://stripe.com) → Crear cuenta
2. Obtener Publishable Key (pk_test_...)
3. Crear Payment Link ($29.99/mes)
4. Ejecutar: `configure-stripe.bat pk_test_... https://buy.stripe.com/...`

---

## 💰 Costos

- **AWS Lightsail**: $10/mes
- **Auth0**: Gratis hasta 7,000 usuarios
- **Stripe**: 2.9% por transacción
- **Total mínimo**: $10/mes

---

## 📞 Si algo falla

1. Verificar que la IP de Lightsail sea correcta
2. Verificar que DNS esté configurado
3. Esperar 5-10 minutos para propagación DNS
4. Contactarme para soporte

## 🎯 Estrategia de Venta

1. **Subir página SIN credenciales** (funciona perfecto para demo)
2. **Mostrar al cliente** en <https://denglishacademy.com>
3. **Vender basado en el demo**
4. **Configurar credenciales después** (si el cliente las quiere)

¡Tu plataforma estará online en 15 minutos! 🎉
