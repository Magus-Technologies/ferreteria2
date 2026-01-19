# 📦 API de Sistema de Gestión de Cajas

Sistema de gestión financiera que permite crear y gestionar múltiples cajas con sub-cajas especializadas para diferentes tipos de transacciones y métodos de pago.

**🔗 Integrado con el sistema existente de `desplieguedepago` y `metododepago`**

## 🎯 Reglas Críticas del Sistema

### ⚠️ EFECTIVO - Regla de Oro

1. **TODO el efectivo va SOLO a la Caja Chica**
   - La Caja Chica (`sub_caja_chica_1`) se crea automáticamente
   - Acepta TODOS los comprobantes: Facturas (01), Boletas (03) y Notas de Venta (nv)
   - Acepta TODOS los métodos de pago en efectivo encontrados en `desplieguedepago`

2. **Las sub-cajas manuales NO pueden aceptar efectivo**
   - Solo métodos digitales: Transferencias, Yape, Plin, Tarjetas, Crédito
   - El sistema valida y rechaza cualquier intento de crear sub-cajas con efectivo
   - No se permite usar `["*"]` (todos los métodos) porque incluiría efectivo

## 📋 Índice

1. [Vendedores Disponibles](#vendedores-disponibles)
2. [Métodos de Pago](#métodos-de-pago)
3. [Cajas Principales](#cajas-principales)
4. [Sub-Cajas](#sub-cajas)
5. [Transacciones](#transacciones)

---

## 🔐 Autenticación

Todas las rutas requieren autenticación mediante **Sanctum**. Incluir el token en el header:

```
Authorization: Bearer {token}
```

---

## 📌 Base URL

```
/api/cajas
```

---

## 0️⃣ Vendedores Disponibles

### 📖 Listar Vendedores para Asignar Caja

**Endpoint:** `GET /api/usuarios/vendedores-disponibles`

**Descripción:** Obtiene la lista de usuarios/vendedores disponibles para asignar una caja principal.

**Query Parameters:**
- `solo_vendedores` (opcional): `true` para filtrar solo usuarios con rol VENDEDOR
- `sin_caja` (opcional): `true` para mostrar solo usuarios sin caja asignada

**Ejemplos:**
```
GET /api/usuarios/vendedores-disponibles
GET /api/usuarios/vendedores-disponibles?solo_vendedores=true
GET /api/usuarios/vendedores-disponibles?sin_caja=true
GET /api/usuarios/vendedores-disponibles?solo_vendedores=true&sin_caja=true
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cmj8o0pf70001uk0o4d3tbyyx",
      "name": "Juan Pérez García",
      "email": "juan@ferreteria.com",
      "numero_documento": "12345678",
      "rol_sistema": "VENDEDOR",
      "empresa_id": 1
    },
    {
      "id": "user_abc123xyz",
      "name": "María López Torres",
      "email": "maria@ferreteria.com",
      "numero_documento": "87654321",
      "rol_sistema": "VENDEDOR",
      "empresa_id": 1
    },
    {
      "id": "user_def456uvw",
      "name": "Carlos Sánchez Ruiz",
      "email": "carlos@ferreteria.com",
      "numero_documento": "11223344",
      "rol_sistema": "ADMINISTRADOR",
      "empresa_id": 1
    }
  ]
}
```

---

## 1️⃣ Métodos de Pago (Despliegue de Pago)

**Nota:** Este módulo usa la tabla existente `desplieguedepago` que ya está integrada con el sistema de ventas.

### 📖 Listar Todos los Métodos de Pago

**Endpoint:** `GET /api/cajas/metodos-pago`

**Descripción:** Obtiene todos los métodos de pago disponibles (desplieguedepago).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cmj8o0plw0004uk0opeg9u7u6",
      "name": "CCH / Efectivo",
      "adicional": "0.00",
      "mostrar": true,
      "metodo_de_pago": {
        "id": "cmj8o0plw0003uk0ov13zd374",
        "name": "Efectivo CA",
        "cuenta_bancaria": null,
        "monto": "56.60"
      }
    },
    {
      "id": "cmj8o0pmm0008uk0osi9l8w88",
      "name": "CB / BCP / TRANSFERENCIA",
      "adicional": "0.00",
      "mostrar": true,
      "metodo_de_pago": {
        "id": "cmj8o0pml0006uk0o68pa9rxq",
        "name": "BCP CB",
        "cuenta_bancaria": null,
        "monto": "1477.60"
      }
    },
    {
      "id": "cmj8o0pmw000puk0ou3l9y49s",
      "name": "CN / BCP / YAPE",
      "adicional": "0.00",
      "mostrar": true,
      "metodo_de_pago": {
        "id": "cmj8o0pmw000ouk0o2zg9hv3o",
        "name": "BCP CN",
        "cuenta_bancaria": null,
        "monto": "0.00"
      }
    }
  ]
}
```

---

### 📖 Listar Métodos de Pago Visibles

**Endpoint:** `GET /api/cajas/metodos-pago/mostrar`

**Descripción:** Obtiene solo los métodos de pago con `mostrar = 1` (visibles en el sistema).

**Response:** Igual al anterior, pero solo con `mostrar: true`

---

## 2️⃣ Cajas Principales

### 📖 Listar Todas las Cajas Principales

**Endpoint:** `GET /api/cajas/cajas-principales`

**Descripción:** Obtiene todas las cajas principales del sistema.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "codigo": "V01",
      "nombre": "Caja Vendedor Juan",
      "estado": true,
      "user": {
        "id": "user123",
        "name": "Juan Pérez",
        "email": "juan@example.com"
      },
      "sub_cajas": [...],
      "total_sub_cajas": 5,
      "saldo_total": "15250.50",
      "created_at": "2026-01-18 10:00:00",
      "updated_at": "2026-01-18 10:00:00"
    }
  ]
}
```

---

### ✏️ Crear Caja Principal

**Endpoint:** `POST /api/cajas/cajas-principales`

**Descripción:** Crea una nueva caja principal para un vendedor. **Automáticamente crea la `sub_caja_chica_1`** con TODOS los métodos de efectivo.

**Request Body:**
```json
{
  "codigo": "V01-CAJA",
  "nombre": "Caja Juan Pérez",
  "user_id": 1
}
```

**Validaciones:**
- `codigo`: Requerido, código único de la caja (ej: V01-CAJA, V02-CAJA)
- `nombre`: Requerido, máximo 255 caracteres
- `user_id`: Requerido, debe existir en la tabla `user`

**Response (201):**
```json
{
  "success": true,
  "message": "Caja principal creada exitosamente con su Caja Chica automática",
  "data": {
    "id": 1,
    "codigo": "V01-CAJA",
    "nombre": "Caja Juan Pérez",
    "estado": true,
    "user": {
      "id": 1,
      "name": "Juan Pérez",
      "email": "juan@example.com"
    },
    "sub_cajas": [
      {
        "id": 1,
        "codigo": "V01-CAJA-001",
        "nombre": "sub_caja_chica_1",
        "tipo_caja": "CC",
        "tipo_caja_label": "Caja Chica",
        "despliegues_pago_ids": [
          "cmj8o0plw0004uk0opeg9u7u6",
          "cmj8o0pmw000nuk0o8eii001b"
        ],
        "tipos_comprobante": ["01", "03", "nv"],
        "tipos_comprobante_labels": ["Factura", "Boleta", "Nota de Venta"],
        "saldo_actual": "0.00",
        "proposito": "Caja Chica - Efectivo",
        "estado": true,
        "es_caja_chica": true,
        "puede_eliminar": false,
        "puede_modificar": false,
        "created_at": "2026-01-18 10:00:00",
        "updated_at": "2026-01-18 10:00:00"
      }
    ],
    "total_sub_cajas": 1,
    "saldo_total": "0.00",
    "created_at": "2026-01-18 10:00:00",
    "updated_at": "2026-01-18 10:00:00"
  }
}
```

**✅ Resultado Automático:**
- Se crea la caja principal con el código especificado
- Se crea automáticamente `sub_caja_chica_1` con código `{CODIGO_CAJA}-001`
- La Caja Chica incluye TODOS los métodos de efectivo activos de `desplieguedepago`
- La Caja Chica acepta TODOS los comprobantes: Facturas (01), Boletas (03) y Notas de Venta (nv)

**Errores:**
- `422`: El usuario ya tiene una caja principal asignada
- `422`: No se encontraron métodos de pago en efectivo activos
- `404`: Usuario no encontrado

---

### 📖 Obtener Caja Principal por ID

**Endpoint:** `GET /api/cajas/cajas-principales/{id}`

**Descripción:** Obtiene los detalles de una caja principal específica.

**Response:** Igual a la respuesta de crear

---

### 📖 Obtener Caja Principal por Usuario

**Endpoint:** `GET /api/cajas/cajas-principales/usuario/actual`

**Descripción:** Obtiene la caja principal del usuario autenticado o de un usuario específico.

**Query Parameters:**
- `user_id` (opcional): ID del usuario. Si no se envía, usa el usuario autenticado.

**Response:** Igual a la respuesta de crear

**Errores:**
- `404`: El usuario no tiene una caja asignada

---

### 🗑️ Eliminar Caja Principal

**Endpoint:** `DELETE /api/cajas/cajas-principales/{id}`

**Descripción:** Elimina una caja principal y todas sus sub-cajas.

**Response:**
```json
{
  "success": true,
  "message": "Caja principal eliminada exitosamente"
}
```

---

## 3️⃣ Sub-Cajas

### 📖 Listar Sub-Cajas de una Caja Principal

**Endpoint:** `GET /api/cajas/cajas-principales/{cajaPrincipalId}/sub-cajas`

**Descripción:** Obtiene todas las sub-cajas de una caja principal.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "codigo": "V01-001",
      "nombre": "Caja Chica",
      "tipo_caja": "CC",
      "tipo_caja_label": "Caja Chica",
      "despliegue_pago": {
        "id": "cmj8o0plw0004uk0opeg9u7u6",
        "name": "CCH / Efectivo",
        "adicional": "0.00",
        "metodo_de_pago": {
          "id": "cmj8o0plw0003uk0ov13zd374",
          "name": "Efectivo CA",
          "cuenta_bancaria": null
        }
      },
      "tipos_comprobante": ["01", "03"],
      "tipos_comprobante_labels": ["Factura", "Boleta"],
      "saldo_actual": "5250.00",
      "proposito": "Efectivo de ventas con comprobantes oficiales",
      "estado": true,
      "es_caja_chica": true,
      "puede_eliminar": false,
      "puede_modificar": false,
      "created_at": "2026-01-18 10:00:00",
      "updated_at": "2026-01-18 10:00:00"
    },
    {
      "id": 2,
      "codigo": "V01-002",
      "nombre": "BCP Yape - Facturas",
      "tipo_caja": "SC",
      "tipo_caja_label": "Sub-Caja",
      "despliegue_pago": {
        "id": "cmj8o0pmw000puk0ou3l9y49s",
        "name": "CN / BCP / YAPE",
        "adicional": "0.00",
        "metodo_de_pago": {
          "id": "cmj8o0pmw000ouk0o2zg9hv3o",
          "name": "BCP CN",
          "cuenta_bancaria": null
        }
      },
      "tipos_comprobante": ["01"],
      "tipos_comprobante_labels": ["Factura"],
      "saldo_actual": "3200.50",
      "proposito": "Ventas con factura pagadas por Yape BCP",
      "estado": true,
      "es_caja_chica": false,
      "puede_eliminar": false,
      "puede_modificar": true,
      "created_at": "2026-01-18 10:00:00",
      "updated_at": "2026-01-18 10:00:00"
    }
  ]
}
```

---

### ✏️ Crear Sub-Caja

**Endpoint:** `POST /api/cajas/sub-cajas`

**Descripción:** Crea una nueva sub-caja configurable. **NO puede aceptar métodos de efectivo.**

**Request Body:**
```json
{
  "caja_principal_id": 1,
  "nombre": "BCP Yape - Facturas",
  "despliegues_pago_ids": ["cmj8o0pmw000puk0ou3l9y49s"],
  "tipos_comprobante": ["01"],
  "proposito": "Ventas con factura pagadas por Yape BCP"
}
```

**Validaciones:**
- `caja_principal_id`: Requerido, debe existir
- `nombre`: Requerido, máximo 255 caracteres
- `despliegues_pago_ids`: Requerido, array con al menos 1 elemento
- `despliegues_pago_ids.*`: Debe existir en `desplieguedepago` y **NO puede ser efectivo**
- `tipos_comprobante`: Requerido, array con al menos 1 elemento
- `tipos_comprobante.*`: Valores permitidos: `01` (Factura), `03` (Boleta), `nv` (Nota de Venta)
- `proposito`: Opcional, máximo 500 caracteres

**⚠️ Restricciones Críticas:**
- ❌ NO se permite `["*"]` (todos los métodos) porque incluiría efectivo
- ❌ NO se permiten IDs de métodos de pago en efectivo
- ✅ Solo métodos digitales: Transferencias, Yape, Plin, Tarjetas, Crédito

**Ejemplos Válidos:**

**Sub-caja con UN método de pago:**
```json
{
  "caja_principal_id": 1,
  "nombre": "BCP Yape - Facturas",
  "despliegues_pago_ids": ["cmj8o0pmw000puk0ou3l9y49s"],
  "tipos_comprobante": ["01"]
}
```

**Sub-caja con MÚLTIPLES métodos de pago:**
```json
{
  "caja_principal_id": 1,
  "nombre": "Pagos Digitales BCP",
  "despliegues_pago_ids": [
    "cmj8o0pmm0008uk0osi9l8w88",
    "cmj8o0pmw000puk0ou3l9y49s"
  ],
  "tipos_comprobante": ["01", "03"]
}
```

**Sub-caja para Notas de Venta - Todos los pagos digitales:**
```json
{
  "caja_principal_id": 1,
  "nombre": "Notas de Venta - Digitales",
  "despliegues_pago_ids": [
    "cmj8o0pmm0008uk0osi9l8w88",
    "cmj8o0pmw000puk0ou3l9y49s",
    "cmj8o0pmw000puk0ou3l9y49t"
  ],
  "tipos_comprobante": ["nv"]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Sub-caja creada exitosamente",
  "data": {
    "id": 2,
    "codigo": "V01-CAJA-002",
    "nombre": "BCP Yape - Facturas",
    "tipo_caja": "SC",
    "tipo_caja_label": "Sub-Caja",
    "despliegues_pago_ids": ["cmj8o0pmw000puk0ou3l9y49s"],
    "tipos_comprobante": ["01"],
    "tipos_comprobante_labels": ["Factura"],
    "saldo_actual": "0.00",
    "proposito": "Ventas con factura pagadas por Yape BCP",
    "estado": true,
    "es_caja_chica": false,
    "puede_eliminar": true,
    "puede_modificar": true,
    "created_at": "2026-01-18 10:00:00",
    "updated_at": "2026-01-18 10:00:00"
  }
}
```

**Errores:**
- `422`: Ya existe una sub-caja con esta configuración
- `422`: Las sub-cajas manuales NO pueden aceptar métodos de pago en efectivo
- `422`: Las sub-cajas manuales NO pueden usar "*" (todos los métodos)
- `404`: Caja principal no encontrada

---

### 📖 Obtener Sub-Caja por ID

**Endpoint:** `GET /api/cajas/sub-cajas/{id}`

**Descripción:** Obtiene los detalles de una sub-caja específica.

**Response:** Igual a la respuesta de crear

---

### 🔄 Actualizar Sub-Caja

**Endpoint:** `PUT /api/cajas/sub-cajas/{id}`

**Descripción:** Actualiza una sub-caja. No se puede modificar la Caja Chica.

**Request Body:**
```json
{
  "nombre": "BCP Yape - Todos los Comprobantes",
  "despliegue_pago_id": "cmj8o0pmw000puk0ou3l9y49s",
  "tipos_comprobante": ["01", "03", "nv"],
  "proposito": "Todas las ventas pagadas por Yape BCP",
  "estado": true
}
```

**Validaciones:**
- Todos los campos son opcionales (usar `sometimes`)
- Mismas validaciones que crear

**Response:**
```json
{
  "success": true,
  "message": "Sub-caja actualizada exitosamente",
  "data": {...}
}
```

**Errores:**
- `422`: No se puede modificar la Caja Chica
- `422`: Ya existe una sub-caja con esta configuración
- `404`: Sub-caja no encontrada

---

### 🗑️ Eliminar Sub-Caja

**Endpoint:** `DELETE /api/cajas/sub-cajas/{id}`

**Descripción:** Elimina una sub-caja. No se puede eliminar la Caja Chica ni sub-cajas con saldo.

**Response:**
```json
{
  "success": true,
  "message": "Sub-caja eliminada exitosamente"
}
```

**Errores:**
- `422`: No se puede eliminar la Caja Chica
- `422`: No se puede eliminar una sub-caja con saldo
- `404`: Sub-caja no encontrada

---

## 4️⃣ Transacciones

### 📖 Listar Transacciones de una Sub-Caja

**Endpoint:** `GET /api/cajas/sub-cajas/{subCajaId}/transacciones`

**Descripción:** Obtiene el historial de transacciones de una sub-caja.

**Query Parameters:**
- `per_page` (opcional): Número de registros por página (default: 15)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "txn_abc123",
      "tipo_transaccion": "ingreso",
      "tipo_transaccion_label": "Ingreso",
      "monto": "150.00",
      "saldo_anterior": "5100.00",
      "saldo_nuevo": "5250.00",
      "descripcion": "Venta con factura #F001-00123",
      "referencia_id": "venta_xyz789",
      "referencia_tipo": "venta",
      "user": {
        "id": "user123",
        "name": "Juan Pérez"
      },
      "fecha": "2026-01-18 14:30:00",
      "created_at": "2026-01-18 14:30:00"
    }
  ],
  "pagination": {
    "total": 150,
    "per_page": 15,
    "current_page": 1,
    "last_page": 10
  }
}
```

---

### ✏️ Registrar Transacción

**Endpoint:** `POST /api/cajas/transacciones`

**Descripción:** Registra una nueva transacción (ingreso o egreso) en una sub-caja.

**Request Body:**
```json
{
  "sub_caja_id": 1,
  "tipo_transaccion": "ingreso",
  "monto": 150.00,
  "descripcion": "Venta con factura #F001-00123",
  "referencia_id": "venta_xyz789",
  "referencia_tipo": "venta"
}
```

**Validaciones:**
- `sub_caja_id`: Requerido, debe existir
- `tipo_transaccion`: Requerido, valores: `ingreso` o `egreso`
- `monto`: Requerido, numérico, mínimo 0.01
- `descripcion`: Requerido, máximo 500 caracteres
- `referencia_id`: Opcional, máximo 191 caracteres
- `referencia_tipo`: Opcional, máximo 50 caracteres

**Response (201):**
```json
{
  "success": true,
  "message": "Transacción registrada exitosamente",
  "data": {
    "id": "txn_abc123",
    "tipo_transaccion": "ingreso",
    "tipo_transaccion_label": "Ingreso",
    "monto": "150.00",
    "saldo_anterior": "5100.00",
    "saldo_nuevo": "5250.00",
    "descripcion": "Venta con factura #F001-00123",
    "referencia_id": "venta_xyz789",
    "referencia_tipo": "venta",
    "user": {
      "id": "user123",
      "name": "Juan Pérez"
    },
    "fecha": "2026-01-18 14:30:00",
    "created_at": "2026-01-18 14:30:00"
  }
}
```

**Errores:**
- `422`: Saldo insuficiente (para egresos)
- `404`: Sub-caja no encontrada

---

### 📖 Obtener Transacción por ID

**Endpoint:** `GET /api/cajas/transacciones/{id}`

**Descripción:** Obtiene los detalles de una transacción específica.

**Response:** Igual a la respuesta de registrar

---

## 📊 Códigos de Estado HTTP

- `200`: OK - Solicitud exitosa
- `201`: Created - Recurso creado exitosamente
- `404`: Not Found - Recurso no encontrado
- `422`: Unprocessable Entity - Error de validación
- `500`: Internal Server Error - Error del servidor

---

## 🔍 Ejemplos de Uso

### Ejemplo 1: Crear Caja para un Vendedor

```bash
POST /api/cajas/cajas-principales
Authorization: Bearer {token}
Content-Type: application/json

{
  "codigo": "V01-CAJA",
  "nombre": "Caja Juan Pérez",
  "user_id": 1
}
```

**Resultado:** Se crea la caja principal + `sub_caja_chica_1` automáticamente con TODOS los métodos de efectivo.

---

### Ejemplo 2: Crear Sub-Caja para Yape BCP (UN método)

```bash
POST /api/cajas/sub-cajas
Authorization: Bearer {token}
Content-Type: application/json

{
  "caja_principal_id": 1,
  "nombre": "BCP Yape - Facturas",
  "despliegues_pago_ids": ["cmj8o0pmw000puk0ou3l9y49s"],
  "tipos_comprobante": ["01"],
  "proposito": "Solo facturas pagadas con Yape BCP"
}
```

---

### Ejemplo 3: Crear Sub-Caja con MÚLTIPLES métodos de pago

```bash
POST /api/cajas/sub-cajas
Authorization: Bearer {token}
Content-Type: application/json

{
  "caja_principal_id": 1,
  "nombre": "Pagos Digitales BCP",
  "despliegues_pago_ids": [
    "cmj8o0pmm0008uk0osi9l8w88",
    "cmj8o0pmw000puk0ou3l9y49s",
    "cmj8o0pmw000duk0oynfg2vvh"
  ],
  "tipos_comprobante": ["01", "03"],
  "proposito": "Facturas y Boletas con transferencias y Yape BCP"
}
```

---

### Ejemplo 4: Crear Sub-Caja para Notas de Venta - Todos los digitales

```bash
POST /api/cajas/sub-cajas
Authorization: Bearer {token}
Content-Type: application/json

{
  "caja_principal_id": 1,
  "nombre": "Notas de Venta - Digitales",
  "despliegues_pago_ids": [
    "cmj8o0pmm0008uk0osi9l8w88",
    "cmj8o0pmw000puk0ou3l9y49s",
    "cmj8o0pmw000puk0ou3l9y49t",
    "cmj8o0pmm000duk0oynfg2vvh"
  ],
  "tipos_comprobante": ["nv"],
  "proposito": "Todas las notas de venta con pagos digitales"
}
```

### Ejemplo 5: Registrar Ingreso por Venta

```bash
POST /api/cajas/transacciones
Authorization: Bearer {token}
Content-Type: application/json

{
  "sub_caja_id": 2,
  "tipo_transaccion": "ingreso",
  "monto": 250.50,
  "descripcion": "Venta #V001-00045 - Cliente: María López",
  "referencia_id": "01KDNF6H07VEGWCD242YYJ29K6",
  "referencia_tipo": "venta"
}
```

---

## 📝 Notas Importantes

### 1. **Caja Chica (`sub_caja_chica_1`)**
- ✅ Se crea **automáticamente** al crear una Caja Principal
- ✅ Nombre fijo: `sub_caja_chica_1`
- ✅ Acepta **TODOS los comprobantes**: Facturas (01), Boletas (03), Notas de Venta (nv)
- ✅ Acepta **TODOS los métodos de efectivo** encontrados en `desplieguedepago`
- ❌ **NO puede ser modificada ni eliminada**

### 2. **Sub-Cajas Manuales - Restricción de Efectivo**
- ❌ **NO pueden aceptar métodos de pago en efectivo**
- ❌ **NO pueden usar `["*"]`** (todos los métodos) porque incluiría efectivo
- ✅ Solo métodos digitales: Transferencias, Yape, Plin, Tarjetas, Crédito
- ✅ Pueden aceptar **múltiples métodos de pago** simultáneamente
- ✅ Pueden aceptar **múltiples tipos de comprobante** simultáneamente

### 3. **Integración con Sistema Existente**
- Las sub-cajas usan los métodos de pago de `desplieguedepago` (tabla existente)
- Compatible con el sistema de ventas actual
- Al registrar una venta, se puede asociar automáticamente a la sub-caja correspondiente

### 4. **Códigos Automáticos**
- Cajas Principales: Definido por el usuario (ej: `V01-CAJA`, `V02-CAJA`)
- Sub-Cajas: `{CODIGO_CAJA}-001`, `{CODIGO_CAJA}-002`, `{CODIGO_CAJA}-003`...
- Ejemplo: Si la caja es `V01-CAJA`, las sub-cajas serán `V01-CAJA-001`, `V01-CAJA-002`, etc.

### 5. **Validación de Saldo**
- No se permite realizar egresos si el saldo es insuficiente

### 6. **Configuración Única**
- No se pueden crear dos sub-cajas con la misma configuración exacta (despliegues_pago_ids + tipos_comprobante)

### 7. **Eliminación**
- Solo se pueden eliminar sub-cajas sin saldo y que no sean Caja Chica

### 8. **Asignación Inteligente de Ventas**
- El sistema busca la sub-caja más específica para cada venta
- Prioriza sub-cajas con menos métodos de pago (más específicas)
- Si el pago es en efectivo → siempre va a `sub_caja_chica_1`
- Si el pago es digital → va a la sub-caja manual compatible más específica
