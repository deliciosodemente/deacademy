# 🚀 CONFIGURAR DNS EN AWS LIGHTSAIL

## 📋 **PASOS EXACTOS:**

### 1️⃣ **ACCEDER A LIGHTSAIL:**

- Ir a: <https://lightsail.aws.amazon.com/>
- Login con tu cuenta AWS
- Click en "Domains & DNS" en el menú lateral

### 2️⃣ **CONFIGURAR ZONA DNS:**

- Buscar "denglishacademy.com" en la lista
- Click en el dominio para abrir la zona DNS
- Verás una lista de registros DNS

### 3️⃣ **AGREGAR REGISTROS A:**

**Registro #1 (Dominio raíz):**

```
Tipo: A
Subdomain: @ (o dejar vacío)
Resolves to: 34.196.15.155
```

**Registro #2 (WWW):**

```
Tipo: A  
Subdomain: www
Resolves to: 34.196.15.155
```

### 4️⃣ **ELIMINAR REGISTROS CONFLICTIVOS:**

- Si hay registros A existentes apuntando a otras IPs, elimínalos
- Mantener solo los registros NS y SOA originales

### 5️⃣ **GUARDAR CAMBIOS:**

- Click "Save" o "Create record"
- Los cambios se propagan en 5-15 minutos

## ⚡ **CONFIGURACIÓN AUTOMÁTICA:**

También puedes usar AWS CLI si lo tienes configurado
