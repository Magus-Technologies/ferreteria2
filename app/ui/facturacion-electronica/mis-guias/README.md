# Módulo de Guías de Remisión

## 📦 Estructura Creada

### Páginas Principales
- ✅ `page.tsx` - Lista de guías de remisión
- ✅ `crear-guia/page.tsx` - Formulario para crear/editar guías

### Componentes

#### Crear Guía (`crear-guia/_components/`)
- **others/**
  - `header-crear-guia.tsx` - Header con búsqueda de productos y selección de almacén
  - `body-crear-guia.tsx` - Cuerpo principal del formulario

- **form/**
  - `form-crear-guia.tsx` - Formulario con todos los campos de la guía
  - `form-table-guia.tsx` - Wrapper para la tabla de productos

- **tables/**
  - `table-guia.tsx` - Tabla de productos agregados
  - `columns-guia.tsx` - Definición de columnas de la tabla

- **cards/**
  - `cards-info-guia.tsx` - Panel lateral con resumen y acciones
  - `card-info-guia.tsx` - Card individual de información
  - `card-agregar-producto-guia.tsx` - Modal para agregar productos

#### Lista de Guías (`_components/`)
- **filters/**
  - `filters-mis-guias.tsx` - Filtros de búsqueda (fechas, tipo, stock)

- **tables/**
  - `table-mis-guias.tsx` - Tabla principal de guías
  - `columns-mis-guias.tsx` - Definición de columnas
  - `table-detalle-guia.tsx` - Tabla de detalle de productos

### Hooks
- `use-init-guia.ts` - Inicialización del formulario
- `use-create-guia.ts` - Lógica de creación de guías

### Stores (Zustand)
- `store-producto-agregado-guia.ts` - Estado de productos agregados
- `store-filtros-mis-guias.ts` - Estado de filtros de búsqueda

## 📋 Campos del Formulario

### Información General
- **Fecha Emisión** (requerido)
- **Fecha Traslado** (requerido)
- **Afecta Stock** (Sí/No)
- **Serie** (opcional)
- **Número** (opcional)
- **Destino** (dropdown)

### Cliente y Referencia
- **Cliente** (select con búsqueda)
- **Referencia** (texto libre)

### Motivo de Traslado (requerido)
- TRASLADO ENTRE ESTABLECIMIENTOS
- VENTA
- COMPRA
- DEVOLUCIÓN
- TRASLADO A ZONA PRIMARIA
- IMPORTACIÓN
- EXPORTACIÓN
- VENTA CON ENTREGA A TERCEROS
- OTROS

### Transporte
- **Modalidad de Transporte** (requerido)
  - Transporte privado (modalidad propia)
  - Transporte público
- **Tipo de Transporte** (opcional)
- **Vehículo (Placa)** (opcional)

### Puntos de Traslado
- **Punto de Partida** (requerido, textarea)
- **Punto de Llegada** (requerido, textarea)

### Tipo de Guía (requerido)
- GUIA REMISION ELECTRONICA - Remitente
- GUIA REMISION ELECTRONICA - Transportista
- GUIA REMISION FISICA

### Productos
Tabla con columnas:
- Código
- Producto
- Marca
- U. Medida
- Cantidad
- Costo
- P. Venta
- Acciones (eliminar)

### Panel de Resumen
- Total Costo
- Total Venta
- ☑ Validar Modalidad
- ☑ Validar P. Costo
- Botón: Crear/Editar Guía

## 🎨 Diseño

El diseño sigue el mismo patrón de **Ventas**:
- Layout de 2 columnas (formulario + panel lateral)
- Tabla de productos con AG Grid
- Modal para agregar productos
- Cards de información con totales
- Colores: Cyan/Teal para guías (vs Rose para ventas)

## 🔧 Pendientes (Backend)

### Actions a Crear
```typescript
// ferreteria2/app/_actions/guia.ts
- createGuia()
- getGuias()
- updateGuia()
- deleteGuia()
```

### Modelos Prisma
Necesitas agregar al schema:
```prisma
model GuiaRemision {
  id                  Int       @id @default(autoincrement())
  serie               String?
  numero              Int?
  fecha_emision       DateTime
  fecha_traslado      DateTime
  afecta_stock        Boolean   @default(true)
  destino_id          Int?
  cliente_id          Int?
  referencia          String?
  motivo_traslado     String
  modalidad_transporte String
  tipo_transporte     String?
  vehiculo_placa      String?
  chofer_id           Int?
  punto_partida       String
  punto_llegada       String
  tipo_guia           String
  validar_modalidad   Boolean   @default(true)
  validar_costo       Boolean   @default(true)
  user_id             String
  almacen_id          Int
  created_at          DateTime  @default(now())
  updated_at          DateTime  @updatedAt
  
  // Relaciones
  user                User      @relation(fields: [user_id], references: [id])
  almacen             Almacen   @relation(fields: [almacen_id], references: [id])
  cliente             Cliente?  @relation(fields: [cliente_id], references: [id])
  productos           GuiaProducto[]
}

model GuiaProducto {
  id                    Int       @id @default(autoincrement())
  guia_id               Int
  producto_id           Int
  unidad_derivada_id    Int
  cantidad              Decimal
  costo                 Decimal
  precio_venta          Decimal
  
  guia                  GuiaRemision @relation(fields: [guia_id], references: [id])
  producto              Producto     @relation(fields: [producto_id], references: [id])
}
```

## 🚀 Próximos Pasos

1. **Backend Laravel:**
   - Crear modelo `GuiaRemision`
   - Crear controlador `GuiaRemisionController`
   - Agregar rutas API
   - Implementar validaciones

2. **Frontend:**
   - Conectar con API real (reemplazar `createGuiaTemp`)
   - Implementar edición de guías
   - Implementar eliminación
   - Agregar generación de PDF
   - Implementar envío a SUNAT (si aplica)

3. **Permisos:**
   - Ya agregados en `lib/permissions.ts`:
     - `GUIA_LISTADO`
     - `GUIA_CREATE`
     - `GUIA_UPDATE`
     - `GUIA_DELETE`

## 📝 Notas

- El diseño replica exactamente el patrón de ventas
- Los colores principales son cyan/teal para diferenciar de ventas
- La estructura de carpetas es idéntica a ventas para mantener consistencia
- Todos los componentes usan lazy loading para optimizar performance
- Se incluyen validaciones en el formulario
- El store de productos usa el mismo patrón que ventas
