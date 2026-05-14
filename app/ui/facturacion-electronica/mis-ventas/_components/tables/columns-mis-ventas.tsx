"use client";

import { ColDef } from "ag-grid-community";
import type { getVentaResponseProps } from "~/lib/api/venta";
import { formatFechaPeru } from "~/utils/fechas";
import CellAccionesVentaDropdown from "./cell-acciones-venta-dropdown";
import CellSeleccionarNota from "./cell-seleccionar-nota";

export function useColumnsMisVentas() {
  const columnDefs: ColDef<getVentaResponseProps>[] = [
    // Checkbox solo visible en filas con tipo_documento = 'nv' (Nota de Venta).
    // Permite seleccionar varias notas y convertirlas a Factura/Boleta.
    {
      headerName: "",
      colId: "seleccionar_nota",
      width: 50,
      pinned: "left",
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: CellSeleccionarNota,
      cellStyle: { display: "flex", alignItems: "center", justifyContent: "center" },
    },
    {
      headerName: "T.Doc",
      field: "tipo_documento",
      width: 100,
      valueFormatter: ({ value }) => {
        if (value === '01') return 'Factura'
        if (value === '03') return 'Boleta'
        if (value === 'nv') return 'Nota de Venta'
        return value
      },
    },
    {
      headerName: "F.Venta",
      field: "fecha",
      width: 180,
      valueFormatter: (params) =>
        formatFechaPeru(params.value, "DD/MM/YYYY hh:mm:ss A"),
    },
    {
      headerName: "S.Numero",
      colId: "serie_numero",
      field: "serie",
      width: 150,
      valueGetter: (params) => {
        const serie = params.data?.serie || "";
        const numero = params.data?.numero || "";
        return serie && numero ? `${serie}-${numero}` : "";
      },
    },
    {
      headerName: "Cliente",
      colId: "cliente_nombre",
      field: "cliente.razon_social",
      width: 350,
      valueGetter: (params) => {
        const cliente = params.data?.cliente;
        if (!cliente) return "CLIENTES VARIOS";
        
        const nombre = cliente.razon_social || `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim();
        const documento = cliente.numero_documento || '';
        
        return documento ? `${documento} - ${nombre}` : nombre;
      },
    },
    {
      headerName: "Subtotal",
      colId: "subtotal",
      field: "productos_por_almacen",
      width: 120,
      valueGetter: (params) => {
        const productos = params.data?.productos_por_almacen || [];
        const total = productos.reduce((sum: number, producto: any) => {
          const productoTotal = producto.unidades_derivadas.reduce(
            (pSum: number, unidad: any) => {
              const cantidad = Number(unidad.cantidad);
              const precio = Number(unidad.precio); // Precio CON IGV
              const recargo = Number(unidad.recargo || 0);
              const descuento = Number(unidad.descuento || 0);
              
              // Calcular total de la línea
              const subtotalLinea = precio * cantidad;
              const subtotalConRecargo = subtotalLinea + recargo;
              
              // Aplicar descuento
              let montoLinea = subtotalConRecargo;
              if (unidad.descuento_tipo === '%') {
                montoLinea = subtotalConRecargo - (subtotalConRecargo * descuento / 100);
              } else {
                montoLinea = subtotalConRecargo - descuento;
              }
              
              return pSum + montoLinea;
            },
            0
          );
          return sum + productoTotal;
        }, 0);
        
        // El total incluye IGV, dividir entre 1.18 para obtener subtotal sin IGV
        return total / 1.18;
      },
      valueFormatter: (params) => `S/. ${Number(params.value || 0).toFixed(2)}`,
    },
    {
      headerName: "IGV",
      colId: "igv",
      field: "productos_por_almacen",
      width: 100,
      valueGetter: (params) => {
        const productos = params.data?.productos_por_almacen || [];
        const total = productos.reduce((sum: number, producto: any) => {
          const productoTotal = producto.unidades_derivadas.reduce(
            (pSum: number, unidad: any) => {
              const cantidad = Number(unidad.cantidad);
              const precio = Number(unidad.precio);
              const recargo = Number(unidad.recargo || 0);
              const descuento = Number(unidad.descuento || 0);
              
              const subtotalLinea = precio * cantidad;
              const subtotalConRecargo = subtotalLinea + recargo;
              
              let montoLinea = subtotalConRecargo;
              if (unidad.descuento_tipo === '%') {
                montoLinea = subtotalConRecargo - (subtotalConRecargo * descuento / 100);
              } else {
                montoLinea = subtotalConRecargo - descuento;
              }
              
              return pSum + montoLinea;
            },
            0
          );
          return sum + productoTotal;
        }, 0);
        
        // IGV = Total - Subtotal = Total - (Total / 1.18)
        return total - (total / 1.18);
      },
      valueFormatter: (params) => `S/. ${Number(params.value || 0).toFixed(2)}`,
    },
    {
      headerName: "Total",
      colId: "total",
      field: "productos_por_almacen",
      width: 120,
      valueGetter: (params) => {
        const productos = params.data?.productos_por_almacen || [];
        const total = productos.reduce((sum: number, producto: any) => {
          const productoTotal = producto.unidades_derivadas.reduce(
            (pSum: number, unidad: any) => {
              const cantidad = Number(unidad.cantidad);
              const precio = Number(unidad.precio);
              const recargo = Number(unidad.recargo || 0);
              const descuento = Number(unidad.descuento || 0);
              
              const subtotalLinea = precio * cantidad;
              const subtotalConRecargo = subtotalLinea + recargo;
              
              let montoLinea = subtotalConRecargo;
              if (unidad.descuento_tipo === '%') {
                montoLinea = subtotalConRecargo - (subtotalConRecargo * descuento / 100);
              } else {
                montoLinea = subtotalConRecargo - descuento;
              }
              
              return pSum + montoLinea;
            },
            0
          );
          return sum + productoTotal;
        }, 0);
        
        // El total ya incluye IGV
        return total;
      },
      valueFormatter: (params) => `S/. ${Number(params.value || 0).toFixed(2)}`,
    },
    {
      headerName: "Método Pago",
      colId: "despliegue_pago",
      width: 160,
      valueGetter: (params) => {
        const pagos = params.data?.despliegue_de_pago_ventas ?? params.data?.despliegueDePagoVentas
        if (!pagos || pagos.length === 0) return '—'
        return pagos[0].despliegue_de_pago?.name || '—'
      },
    },
    {
      headerName: "Sobrecargo",
      colId: "sobrecargo_total",
      width: 120,
      valueGetter: (params) => {
        const pagos = params.data?.despliegue_de_pago_ventas ?? params.data?.despliegueDePagoVentas
        if (!pagos || pagos.length === 0) return 0
        return pagos.reduce((sum: number, p: any) => sum + Number(p.sobrecargo_aplicado || 0), 0)
      },
      valueFormatter: (params) => {
        const val = Number(params.value || 0)
        if (val === 0) return '—'
        return `S/. ${val.toFixed(2)}`
      },
      cellStyle: (params) => {
        if (Number(params.value || 0) > 0) return { color: '#d97706', fontWeight: 'bold' } as Record<string, string>
        return { color: '#9ca3af' } as Record<string, string>
      },
    },
    {
      headerName: "F.Pago",
      field: "forma_de_pago",
      width: 100,
      valueFormatter: (params) => {
        const formaPago = params.value;
        if (formaPago === 'co') return 'Contado';
        if (formaPago === 'cr') return 'Crédito';
        return formaPago || '';
      },
    },
    {
      headerName: "F.Vencimiento",
      field: "fecha_vencimiento",
      width: 180,
      valueFormatter: (params) =>
        params.value ? formatFechaPeru(params.value, "DD/MM/YYYY hh:mm:ss A") : "-",
    },
    {
      headerName: "Estado",
      field: "estado_de_venta",
      width: 100,
      cellRenderer: (params: any) => {
        const estado = params.value;
        const config: Record<string, { label: string; bg: string; text: string }> = {
          'pr': { label: 'Pagado',    bg: '#dcfce7', text: '#16a34a' },
          'cr': { label: 'Creado',    bg: '#f1f5f9', text: '#475569' },
          'ee': { label: 'En Espera', bg: '#fef9c3', text: '#854d0e' },
          'an': { label: 'Anulado',   bg: '#fee2e2', text: '#dc2626' },
        };
        const { label, bg, text } = config[estado] ?? { label: estado || '', bg: '#f1f5f9', text: '#475569' };
        return (
          <div className="flex items-center h-full">
            <span style={{ background: bg, color: text, fontWeight: 'bold', fontSize: '11px', padding: '2px 8px', borderRadius: '9999px' }}>
              {label}
            </span>
          </div>
        );
      },
    },
    {
      headerName: "Tipo Despacho",
      field: "tipo_despacho",
      width: 130,
      valueFormatter: (params) => {
        const tipo = params.value;
        if (tipo === 'et') return '🏪 En Tienda';
        if (tipo === 'do') return '🏠 Domicilio';
        if (tipo === 'pa') return '🔀 Parcial';
        return tipo || '—';
      },
      cellStyle: (params) => {
        const tipo = params.value;
        if (tipo === 'et') return { color: '#0284c7', fontWeight: 'bold' };
        if (tipo === 'do') return { color: '#7c3aed', fontWeight: 'bold' };
        if (tipo === 'pa') return { color: '#d97706', fontWeight: 'bold' };
        return null;
      },
    },
    {
      headerName: "Entrega",
      colId: "entrega_estado",
      width: 130,
      valueGetter: (params) => {
        if (params.data?.estado_de_venta === 'an') return 'Anulado';
        
        const productos = params.data?.productos_por_almacen || [];
        let totalPendiente = 0;
        let totalCantidad = 0;
        productos.forEach((producto: any) => {
          (producto.unidades_derivadas || []).forEach((unidad: any) => {
            totalCantidad += Number(unidad.cantidad || 0);
            totalPendiente += Number(unidad.cantidad_pendiente || 0);
          });
        });
        
        if (totalCantidad === 0) return 'Sin productos';
        
        // Verificar el estado real de las entregas físicas
        const entregas = params.data?.entregas_productos || params.data?.entregasProductos || [];
        
        if (entregas.length > 0) {
          // Verificar estados de entregas: pe=Pendiente, ec=En Camino, en=Entregado, ca=Cancelado
          const hayEntregasPendientes = entregas.some((e: any) => e.estado_entrega === 'pe');
          const hayEntregasEnCamino = entregas.some((e: any) => e.estado_entrega === 'ec');
          const todasEntregadas = entregas.every((e: any) => e.estado_entrega === 'en');
          
          // Solo mostrar "Completa" si todas las entregas están físicamente entregadas
          if (todasEntregadas && totalPendiente === 0) return 'Completa';
          if (hayEntregasEnCamino) return 'En Camino';
          if (hayEntregasPendientes) return 'Pendiente';
        }
        
        // Si no hay entregas creadas, usar la lógica anterior basada en cantidad_pendiente
        if (totalPendiente === 0) return 'Completa';
        if (totalPendiente < totalCantidad) return 'Parcial';
        return 'Pendiente';
      },
      cellStyle: (params) => {
        const value = params.value;
        if (value === 'Completa') return { color: '#16a34a', fontWeight: 'bold' };
        if (value === 'En Camino') return { color: '#3b82f6', fontWeight: 'bold' };
        if (value === 'Parcial') return { color: '#d97706', fontWeight: 'bold' };
        if (value === 'Pendiente') return { color: '#dc2626', fontWeight: 'bold' };
        if (value === 'Anulado') return { color: '#6b7280', fontWeight: 'bold' };
        return null;
      },
    },
    {
      headerName: "Usuario",
      colId: "usuario_nombre",
      field: "user.name",
      flex: 1,
      minWidth: 100,
      valueGetter: (params) => params.data?.user?.name || "",
    },
    {
      // "Editada" — usa total_ediciones del backend (count de venta_historial
      // con accion='edicion'). Sí cuando ≥1 edición, No cuando 0.
      headerName: "Editada",
      colId: "editada",
      width: 110,
      valueGetter: (params) => {
        const n = Number(params.data?.total_ediciones ?? 0)
        if (n === 0) return "No"
        return n === 1 ? "Sí (1)" : `Sí (${n})`
      },
      cellStyle: (params) => {
        // Cast a Record<string,string> para que AG Grid acepte el union de
        // estilos (su index signature no permite `fontWeight: undefined`).
        if (params.value === "No") return { color: '#6b7280' } as Record<string, string>
        return { color: '#d97706', fontWeight: 'bold' } as Record<string, string>
      },
    },
    {
      headerName: "Acciones",
      field: "id",
      width: 110,
      pinned: "right",
      cellRenderer: CellAccionesVentaDropdown,
      cellRendererParams: (params: { data?: getVentaResponseProps }) => ({
        ventaId: params.data?.id || "",
      }),
    },
  ];

  return columnDefs;
}

