"use client";

import { ColDef } from "ag-grid-community";
import type { getVentaResponseProps } from "~/lib/api/venta";
import dayjs from "dayjs";
import CellAccionesVenta from "./cell-acciones-venta";

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
    },
    {
      headerName: "F.Venta",
      field: "fecha",
      width: 120,
      valueFormatter: (params) =>
        params.value ? dayjs(params.value).format("DD/MM/YYYY") : "",
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
      headerName: "Estado",
      field: "estado_de_venta",
      width: 100,
      valueFormatter: (params) => {
        const estado = params.value;
        if (estado === 'cr') return 'Creado';
        if (estado === 'ee') return 'En Espera';
        if (estado === 'pr') return 'Procesado';
        if (estado === 'an') return 'Anulado';
        return estado || '';
      },
    },
    {
      headerName: "Entrega",
      colId: "entrega_estado",
      width: 130,
      valueGetter: (params) => {
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
        if (totalPendiente === 0) return 'Completa';
        if (totalPendiente < totalCantidad) return 'Parcial';
        return 'Pendiente';
      },
      cellStyle: (params) => {
        const value = params.value;
        if (value === 'Completa') return { color: '#16a34a', fontWeight: 'bold' };
        if (value === 'Parcial') return { color: '#d97706', fontWeight: 'bold' };
        if (value === 'Pendiente') return { color: '#dc2626', fontWeight: 'bold' };
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
      width: 100,
      pinned: "right",
      cellRenderer: CellAccionesVenta,
      cellRendererParams: (params: { data?: getVentaResponseProps }) => ({
        ventaId: params.data?.id || "",
      }),
    },
  ];

  return columnDefs;
}

