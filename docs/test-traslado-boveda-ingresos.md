# Test: Traslado a Bóveda — Ingresos no reflejados en efectivo disponible

## Fecha
2026-07-02

## Escenario de prueba

### 1. Apertura de Caja
- **Endpoint:** `GET /api/cajas/historial-aperturas/todas?page=1&per_page=1000`
- **Apertura activa:** ID `01KWHMN1WRA500NZQQV9AC27QB`
- **Monto apertura:** `200.00`
- **Sub-caja:** Caja Chica (ID 34)
- **Vendedor:** BRYZA LILIANA CARRION MORALES
- **Estado:** `abierta`

### 2. Registro de Ingreso Extra
- **Endpoint:** `POST /api/ingresos-extras`
- **Body:**
  ```json
  {
    "monto": "100.00",
    "concepto": "",
    "despliegue_pago_id": "01KV6PE3R2QP1R1TXQDXQGXYA9"
  }
  ```
- **Response:** `✅ Ingreso registrado correctamente`
- **Monto:** `100.00`
- **Método de pago (despliegue_pago_id):** `01KV6PE3R2QP1R1TXQDXQGXYA9`

### 3. Consulta de efectivo disponible (para Traslado a Bóveda)
- **Endpoint:** `GET /api/cajas/sub-cajas/efectivo-por-vendedor?apertura_cierre_caja_id=01KWHMN1WRA500NZQQV9AC27QB`
- **Response:**
  ```json
  {
    "efectivo_disponible": "200.00",
    "despliegue_pago_id": "01KV6NY00AEPNMX71DZC1DBXG6"
  }
  ```

## Problema detectado

El endpoint `efectivo-por-vendedor` devuelve **`200.00`** (solo el monto de apertura) cuando debería devolver **`300.00`** (200 apertura + 100 ingreso extra).

El ingreso extra de 100.00 **NO se está sumando** al cálculo del efectivo disponible.

## Datos relevantes

| Concepto | Valor |
|----------|-------|
| `apertura_cierre_caja_id` | `01KWHMN1WRA500NZQQV9AC27QB` |
| `despliegue_pago_id` (apertura) | `01KV6NY00AEPNMX71DZC1DBXG6` |
| `despliegue_pago_id` (ingreso) | `01KV6PE3R2QP1R1TXQDXQGXYA9` |
| `sub_caja_id` | 34 (Caja Chica) |
| Monto apertura | 200.00 |
| Monto ingreso extra | 100.00 |
| **Efectivo disponible esperado** | **300.00** |
| **Efectivo disponible devuelto** | **200.00** |

## Notas

- Los `despliegue_pago_id` son **diferentes** entre la apertura y el ingreso, lo que indica que el ingreso se registró con un método de pago distinto.
- El frontend (modal de traslado a bóveda) simplemente muestra lo que devuelve el backend, no hay lógica adicional de suma en el frontend.
- La causa es **backend** (Laravel): el endpoint `/cajas/sub-cajas/efectivo-por-vendedor` no incluye los `ingresos_extras` en el cálculo del `efectivo_disponible`.
