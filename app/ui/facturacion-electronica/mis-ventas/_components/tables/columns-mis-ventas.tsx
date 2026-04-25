"use client";

import { ColDef } from "ag-grid-community";
import type { getVentaResponseProps } from "~/lib/api/venta";
import { formatFechaPeru } from "~/utils/fechas";
import CellAccionesVentaDropdown from "./cell-acciones-venta-dropdown";

export function useColumnsMisVentas() {
  const columnDefs: ColDef<getVentaResponseProps>[] = [
    // Columna # comentada porque ya viene automáticamente en la tabla
    // {
    //   headerName: '#',
    //   valueGetter: 'node.rowIndex + 1',
    //   width: 60,
    //   pinned: 'left',
    // },
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
      width: 130,
      valueFormatter: (params) =>
        formatFechaPeru(params.value, "DD/MM/YYYY"),
    },
    {
      headerName: "Estado",
      field: "estado_de_venta",
      width: 100,
      valueFormatter: (params) => {
        const estado = params.value;
        if (estado === 'cr') return 'Creado';
        if (estado === 'ee') return 'En Espera';
        if (estado === 'an') return 'Anulado';
        return estado || '';
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

