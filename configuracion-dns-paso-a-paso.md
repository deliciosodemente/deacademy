# 🌐 CONFIGURACIÓN DNS - DENGLISHACADEMY.COM

## 📋 **REGISTROS DNS A CREAR:**

```
Tipo: A
Nombre: @ (o vacío para el dominio raíz)
Valor: 34.196.15.155
TTL: 300

Tipo: A  
Nombre: www
Valor: 34.196.15.155
TTL: 300
```

## 🎯 **INSTRUCCIONES POR PROVEEDOR:**

### 🔵 **NAMECHEAP:**

1. Ir a: <https://ap.www.namecheap.com/domains/list/>
2. Click en "Manage" junto a denglishacademy.com
3. Click en "Advanced DNS"
4. Eliminar registros existentes si los hay
5. Agregar los 2 registros A de arriba
6. Guardar cambios

### 🟠 **GODADDY:**

1. Ir a: <https://dcc.godaddy.com/manage/>
2. Click en "DNS" junto a denglishacademy.com
3. Click en "Manage Zones"
4. Agregar los registros A
5. Guardar

### 🟡 **CLOUDFLARE:**

1. Ir a: <https://dash.cloudflare.com/>
2. Seleccionar denglishacademy.com
3. Click en "DNS" > "Records"
4. Agregar los registros A
5. Asegurar que el proxy esté desactivado (nube gris)

### 🟢 **GOOGLE DOMAINS:**

1. Ir a: <https://domains.google.com/registrar/>
2. Click en denglishacademy.com
3. Click en "DNS"
4. Scroll a "Custom records"
5. Agregar los registros A

### 🔴 **OTROS PROVEEDORES:**

- Buscar sección "DNS Management" o "DNS Records"
- Agregar registros tipo A con los valores de arriba

## ⏱️ **DESPUÉS DE CONFIGURAR:**

1. **Esperar 5-30 minutos** para propagación DNS
2. **Verificar** con: `nslookup denglishacademy.com`
3. **Probar** navegando a: <http://denglishacademy.com>
4. **Instalar SSL** cuando funcione el dominio

## 🔍 **VERIFICACIÓN:**

- El dominio debe resolver a: 34.196.15.155
- Tanto denglishacademy.com como <www.denglishacademy.com> deben funcionar
