# 🎯 Guía: Hacer Elementos Configurables

Esta guía explica cómo hacer que los botones, campos, cards y otros elementos de tu aplicación sean configurables desde el **Configurador Visual de Permisos**.

## 📋 Resumen

Para hacer un elemento configurable:
1. Importar `ConfigurableElement`
2. Envolver el elemento
3. Asignar un `componentId` único
4. Asignar un `label` descriptivo

## 🔧 Pasos Detallados

### 1. Importar el Componente

En cualquier archivo donde quieras hacer elementos configurables:

```tsx
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";
```

### 2. Envolver Elementos

#### Ejemplo: Botón

**Antes:**
```tsx
<Button color="success" onClick={handleCrear}>
  Crear Producto
</Button>
```

**Después:**
```tsx
<ConfigurableElement 
  componentId="producto.create" 
  label="Botón Crear Producto"
>
  <Button color="success" onClick={handleCrear}>
    Crear Producto
  </Button>
</ConfigurableElement>
```

#### Ejemplo: Campo de Formulario

**Antes:**
```tsx
<InputBase 
  placeholder="Nombre del producto"
  name="nombre"
/>
```

**Después:**
```tsx
<ConfigurableElement 
  componentId="producto.field-nombre" 
  label="Campo Nombre"
>
  <InputBase 
    placeholder="Nombre del producto"
    name="nombre"
  />
</ConfigurableElement>
```

#### Ejemplo: Select

**Antes:**
```tsx
<SelectClientes 
  propsForm={{ name: "cliente_id" }}
  allowClear
/>
```

**Después:**
```tsx
<ConfigurableElement 
  componentId="venta.field-cliente" 
  label="Campo Cliente"
>
  <SelectClientes 
    propsForm={{ name: "cliente_id" }}
    allowClear
  />
</ConfigurableElement>
```

#### Ejemplo: Card

**Antes:**
```tsx
<CardDashboard
  title="Total de Ventas"
  value={250000}
  prefix="S/. "
  icon={<FaMoneyBills size={20} />}
/>
```

**Después:**
```tsx
<ConfigurableElement 
  componentId="dashboard.card-total-ventas" 
  label="Card Total de Ventas"
>
  <CardDashboard
    title="Total de Ventas"
    value={250000}
    prefix="S/. "
    icon={<FaMoneyBills size={20} />}
  />
</ConfigurableElement>
```

#### Ejemplo: Columna de Tabla (AG Grid)

En el archivo de definición de columnas:

**Antes:**
```tsx
{
  headerName: "Acciones",
  width: 100,
  cellRenderer: CellAccionesVenta,
}
```

**Después:**
```tsx
{
  headerName: "Acciones",
  width: 100,
  cellRenderer: (params) => (
    <ConfigurableElement 
      componentId="venta.column-acciones" 
      label="Columna Acciones"
    >
      <CellAccionesVenta {...params} />
    </ConfigurableElement>
  ),
}
```

## 🏷️ Convención de Nombres para componentId

Sigue este patrón para `componentId`:

```
<módulo>.<tipo>-<nombre>
```

### Ejemplos por tipo:

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| **Botones** | `modulo.button-accion` | `producto.button-crear` |
| **Campos** | `modulo.field-nombre` | `venta.field-cliente` |
| **Cards** | `modulo.card-titulo` | `dashboard.card-ventas` |
| **Columnas** | `modulo.column-nombre` | `venta.column-acciones` |
| **Secciones** | `modulo.section-nombre` | `producto.section-precios` |
| **Tabs** | `modulo.tab-nombre` | `producto.tab-inventario` |
| **Filtros** | `modulo.filtro-nombre` | `venta.filtro-fecha` |

### Módulos comunes:

- `dashboard` - Dashboard principal
- `venta` - Ventas
- `producto` - Productos
- `cliente` - Clientes
- `compra` - Compras
- `guia` - Guías de remisión
- `cotizacion` - Cotizaciones

## 📝 Ejemplos Completos por Vista

### Dashboard (page.tsx)

```tsx
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";

export default function Dashboard() {
  return (
    <div>
      {/* Filtros */}
      <ConfigurableElement componentId="dashboard.filtro-fecha" label="Filtro de Fechas">
        <RangePickerBase />
      </ConfigurableElement>
      
      {/* Cards */}
      <ConfigurableElement componentId="dashboard.card-ventas" label="Card Ventas">
        <CardDashboard title="Total Ventas" value={1000} />
      </ConfigurableElement>
      
      {/* Gráficos */}
      <ConfigurableElement componentId="dashboard.grafico-categorias" label="Gráfico por Categoría">
        <VentasPorCategoria />
      </ConfigurableElement>
    </div>
  );
}
```

### Crear Venta (crear-venta/page.tsx)

```tsx
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";

export default function CrearVenta() {
  return (
    <Form>
      {/* Botones de acción */}
      <ConfigurableElement componentId="venta.button-guardar" label="Botón Guardar">
        <Button type="submit">Guardar</Button>
      </ConfigurableElement>
      
      {/* Campos */}
      <ConfigurableElement componentId="venta.field-cliente" label="Campo Cliente">
        <SelectClientes name="cliente_id" />
      </ConfigurableElement>
      
      <ConfigurableElement componentId="venta.field-fecha" label="Campo Fecha">
        <DatePickerBase name="fecha" />
      </ConfigurableElement>
      
      {/* Tabla de productos */}
      <ConfigurableElement componentId="venta.tabla-productos" label="Tabla de Productos">
        <TableProductos />
      </ConfigurableElement>
    </Form>
  );
}
```

### Tabla Mis Ventas (columns-mis-ventas.tsx)

```tsx
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";

export const columnsMisVentas = [
  // Columnas normales...
  {
    headerName: "Cliente",
    field: "cliente.razon_social",
  },
  
  // Columna de acciones configurable
  {
    headerName: "Acciones",
    cellRenderer: (params) => (
      <ConfigurableElement 
        componentId="venta.column-acciones" 
        label="Columna Acciones"
      >
        <div>
          <ConfigurableElement 
            componentId="venta.button-pdf" 
            label="Botón Ver PDF"
          >
            <Button onClick={() => verPDF(params.data.id)}>PDF</Button>
          </ConfigurableElement>
          
          <ConfigurableElement 
            componentId="venta.button-editar" 
            label="Botón Editar"
          >
            <Button onClick={() => editar(params.data.id)}>Editar</Button>
          </ConfigurableElement>
        </div>
      </ConfigurableElement>
    ),
  },
];
```

## 🎨 Comportamiento Visual

Cuando estés en **Modo Configuración**:

1. **Elemento Visible (no restringido)**:
   - Badge verde ✓
   - Opacidad normal
   - Hover: borde azul + tooltip "VISIBLE"

2. **Elemento Oculto (restringido)**:
   - Badge rojo ✗
   - Opacidad 40% + escala de grises
   - Hover: borde azul + tooltip "OCULTO"

3. **Al hacer click**:
   - Abre modal: "¿Mostrar u Ocultar?"
   - Guarda decisión en backend
   - Actualiza vista en tiempo real

## ⚠️ Notas Importantes

1. **IDs Únicos**: Cada `componentId` debe ser único en toda la aplicación
2. **Labels Descriptivos**: Usa labels que el administrador entienda
3. **No Duplicar**: No envuelvas el mismo elemento dos veces
4. **Performance**: El wrapper es ligero, no afecta el rendimiento
5. **Modo Normal**: Cuando NO estás en modo configuración, el wrapper no hace nada

## 🔄 Flujo Completo

```
1. Usuario ADMIN entra a /configuracion/permisos-visuales
2. Selecciona ROL: "CONTADOR"
3. Click en "Mis Ventas"
4. Se carga la vista REAL de Mis Ventas
5. Todos los elementos con ConfigurableElement muestran badges
6. Admin hace click en "Botón Exportar PDF"
7. Modal: "¿Mostrar u Ocultar?"
8. Admin elige "Ocultar"
9. Se guarda: restriction.name = "venta.button-pdf"
10. Usuario CONTADOR inicia sesión
11. En Mis Ventas, el botón "Exportar PDF" NO se renderiza
```

## 📦 Archivos a Modificar

Para cada vista que quieras configurar:

1. **page.tsx** - Página principal
2. **columns-*.tsx** - Definiciones de columnas de tablas
3. **filters-*.tsx** - Componentes de filtros
4. **cell-*.tsx** - Celdas personalizadas de AG Grid
5. **form-*.tsx** - Formularios

## 🚀 Ejemplo Completo: Mis Ventas

Ver archivo: `ferreteria2/app/ui/facturacion-electronica/mis-ventas/page.tsx`

```tsx
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";

export default function MisVentas() {
  return (
    <div>
      {/* Filtros */}
      <ConfigurableElement componentId="venta.filtro-fecha" label="Filtro Fecha">
        <DateRangePicker />
      </ConfigurableElement>
      
      <ConfigurableElement componentId="venta.filtro-cliente" label="Filtro Cliente">
        <SelectClientes />
      </ConfigurableElement>
      
      <ConfigurableElement componentId="venta.button-buscar" label="Botón Buscar">
        <Button type="submit">Buscar</Button>
      </ConfigurableElement>
      
      {/* Botones de acción */}
      <ConfigurableElement componentId="venta.button-exportar" label="Botón Exportar">
        <Button onClick={exportar}>Exportar</Button>
      </ConfigurableElement>
      
      {/* Tabla */}
      <TableMisVentas />
    </div>
  );
}
```

## ✅ Checklist

Cuando configures una vista:

- [ ] Importar `ConfigurableElement`
- [ ] Envolver todos los botones principales
- [ ] Envolver campos de formulario importantes
- [ ] Envolver filtros
- [ ] Envolver acciones de tabla
- [ ] Usar IDs descriptivos siguiendo la convención
- [ ] Usar labels que el admin entienda
- [ ] Probar en modo configuración
- [ ] Verificar que funcione en modo normal

## 🎓 Consejos

1. **Empieza gradual**: No envuelvas TODO de golpe, empieza con lo más importante
2. **Piensa como admin**: ¿Qué elementos querría ocultar/mostrar?
3. **Agrupa lógicamente**: Usa prefijos consistentes en los IDs
4. **Documenta**: Comenta elementos complejos
5. **Prueba**: Verifica en ambos modos (normal y configuración)
