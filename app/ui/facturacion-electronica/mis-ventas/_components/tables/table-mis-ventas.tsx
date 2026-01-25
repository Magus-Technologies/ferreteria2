"use client";

import React, { useRef, useState } from "react";
import TableWithTitle from "~/components/tables/table-with-title";
import type { getVentaResponseProps } from "~/lib/api/venta";
import { useColumnsMisVentas } from "./columns-mis-ventas";
import { useStoreFiltrosMisVentas } from "../../_store/store-filtros-mis-ventas";
import useGetVentas from "../../_hooks/use-get-ventas";
import { create } from "zustand";
import { AgGridReact } from "ag-grid-react";
import { orangeColors, greenColors, redColors } from "~/lib/colors";
import { GetRowIdParams, RowStyle } from "ag-grid-community";

type UseStoreVentaSeleccionada = {
  venta?: getVentaResponseProps;
  setVenta: (venta: getVentaResponseProps | undefined) => void;
};

export const useStoreVentaSeleccionada = create<UseStoreVentaSeleccionada>(
  (set) => ({
    venta: undefined,
    setVenta: (venta) => set({ venta }),
  })
);

// Función para calcular el color de una venta
function calcularColorVenta(venta: getVentaResponseProps): string {
  const formaDePago = venta.forma_de_pago;
  const estadoDeVenta = venta.estado_de_venta;
  const totalPagado = Number(venta.total_pagado || 0);

  // Calcular el total de la venta
  const productos = venta.productos_por_almacen || [];
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

  const resta = total - totalPagado;

  // Naranja: En Espera o Anulado
  if (estadoDeVenta === 'ee' || estadoDeVenta === 'an') {
    return orangeColors[2];
  }

  // Verde: Contado (siempre pagado) o Crédito completamente pagado
  if (formaDePago === 'co' || (formaDePago === 'cr' && resta <= 0.01)) {
    return greenColors[2];
  }

  // Rojo: Crédito con saldo pendiente
  if (formaDePago === 'cr' && resta > 0.01) {
    return redColors[2];
  }

  return 'transparent';
}

export default function TableMisVentas() {
  const tableRef = useRef<AgGridReact>(null);
  const filtros = useStoreFiltrosMisVentas((state) => state.filtros);
  const { response, loading } = useGetVentas({ where: filtros });

  const setVentaSeleccionada = useStoreVentaSeleccionada(
    (state) => state.setVenta
  );

  const [selectionColor, setSelectionColor] = useState<string>('transparent');

  // Seleccionar automáticamente el primer registro cuando se cargan los datos
  React.useEffect(() => {
    if (response && response.length > 0 && tableRef.current) {
      setTimeout(() => {
        const firstNode = tableRef.current?.api?.getDisplayedRowAtIndex(0);
        if (firstNode) {
          firstNode.setSelected(true);
          setVentaSeleccionada(firstNode.data);
          // Calcular color de la primera fila
          const color = calcularColorVenta(firstNode.data);
          setSelectionColor(color);
        }
      }, 100);
    }
  }, [response, setVentaSeleccionada]);

  // Función para aplicar estilos a las filas
  const getRowStyle = (params: { data?: getVentaResponseProps }): RowStyle | undefined => {
    if (!params.data) return undefined;
    
    const color = calcularColorVenta(params.data);
    
    return {
      background: color,
    };
  };

  // Manejador para el botón de PDF
  const handleVerPDF = (ventaId: string) => {
    window.open(`/api/pdf/venta/${ventaId}`, "_blank");
  };

  // Agregar event listeners para los botones de PDF
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest(".btn-ver-pdf") as HTMLButtonElement;
      
      if (button) {
        const ventaId = button.getAttribute("data-venta-id");
        if (ventaId) {
          handleVerPDF(ventaId);
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="w-full" style={{ height: "300px" }}>
      <TableWithTitle<getVentaResponseProps>
        id="mis-ventas"
        title="N° DE CLIENTES/VENTAS"
        loading={loading}
        columnDefs={useColumnsMisVentas()}
        rowData={response || []}
        tableRef={tableRef}
        selectionColor={selectionColor}
        getRowStyle={getRowStyle}
        onRowClicked={(event) => {
          event.node.setSelected(true);
        }}
        onSelectionChanged={({ selectedNodes, api }) => {
          const selectedVenta = selectedNodes?.[0]?.data as getVentaResponseProps;
          setVentaSeleccionada(selectedVenta);
          
          // Actualizar el color de selección dinámicamente
          if (selectedVenta) {
            const color = calcularColorVenta(selectedVenta);
            setSelectionColor(color);
            
            // Forzar redibujado de filas para aplicar el nuevo color inmediatamente
            api?.redrawRows();
          }
        }}
        onRowDoubleClicked={({ data }) => {
          setVentaSeleccionada(data);
        }}
      />
    </div>
  );
}
