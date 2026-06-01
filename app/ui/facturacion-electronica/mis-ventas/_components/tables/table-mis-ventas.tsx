"use client";

import React, { useRef } from "react";
import TableWithTitle from "~/components/tables/table-with-title";
import type { getVentaResponseProps } from "~/lib/api/venta";
import { calcularTotalesVentaConVales, useColumnsMisVentas } from "./columns-mis-ventas";
import { useStoreFiltrosMisVentas } from "../../_store/store-filtros-mis-ventas";
import useGetVentas from "../../_hooks/use-get-ventas";
import { create } from "zustand";
import { AgGridReact } from "ag-grid-react";
import { orangeColors, greenColors, redColors } from "~/lib/colors";
import { RowStyle } from "ag-grid-community";

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
  const totalPagado = Number(venta.total_pagado || 0);

  // Calcular el total de la venta
  const total = calcularTotalesVentaConVales(venta).total;

  const resta = total - totalPagado;
  const estado = venta.estado_de_venta;

  // Naranja: En Espera, Anulado o Contado
  if (estado === 'ee' || estado === 'an' || formaDePago === 'co') {
    return orangeColors[2];
  }
  // Verde: Crédito pagado (por estado 'pr' o por saldo calculado)
  if (estado === 'pr') {
    return greenColors[2];
  }
  if (formaDePago === 'cr' && resta <= 0.01) {
    return greenColors[2];
  }
  // Rojo: Crédito pendiente de pago
  if (formaDePago === 'cr' && resta > 0.01) {
    return redColors[2];
  }

  return 'transparent';
}

export default function TableMisVentas() {
  const tableRef = useRef<AgGridReact>(null);
  const filtros = useStoreFiltrosMisVentas((state) => state.filtros);
  const { response, loading } = useGetVentas({ where: filtros });

  const setVentaSeleccionada = useStoreVentaSeleccionada((state) => state.setVenta);
  const ventaActual         = useStoreVentaSeleccionada((state) => state.venta);

  // Al refrescar datos: re-seleccionar la venta previa por ID.
  // Si ya no existe en los nuevos datos (fue borrada o filtrada), seleccionar la primera.
  // Esto evita que un WebSocket refresh pise la selección mientras el usuario tiene un modal abierto.
  React.useEffect(() => {
    if (!response || response.length === 0 || !tableRef.current) return;
    setTimeout(() => {
      const api = tableRef.current?.api;
      if (!api) return;

      // Intentar re-seleccionar la venta que estaba seleccionada antes del refresh
      const idPrevio = ventaActual?.id;
      let nodoTarget: any = null;

      if (idPrevio) {
        api.forEachNode((node) => {
          if (node.data?.id === idPrevio) nodoTarget = node;
        });
      }

      // Si no se encontró la anterior (o no había ninguna), seleccionar la primera fila
      if (!nodoTarget) {
        nodoTarget = api.getDisplayedRowAtIndex(0);
      }

      if (nodoTarget) {
        nodoTarget.setSelected(true);
        // Solo actualizar el store si cambia la venta (evita re-renders innecesarios)
        if (!idPrevio || nodoTarget.data?.id !== idPrevio) {
          setVentaSeleccionada(nodoTarget.data);
        }
      }
    }, 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  // Función para aplicar estilos a las filas
  const getRowStyle = (params: { data?: getVentaResponseProps }): RowStyle | undefined => {
    if (!params.data) return undefined;
    
    const color = calcularColorVenta(params.data);
    
    return {
      background: color,
    };
  };

  // Manejador para el botón de PDF
  const handleVerPDF = async (ventaId: string) => {
    const { abrirPdf } = await import('~/lib/api/pdf')
    abrirPdf('venta', ventaId)
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
        id="mis-ventas-v2"
        title="N° DE CLIENTES/VENTAS"
        loading={loading}
        columnDefs={useColumnsMisVentas()}
        rowData={response || []}
        tableRef={tableRef}
        selectionColor="overlay"
        getRowStyle={getRowStyle}
        getRowId={({ data }) => String(data.id)}
        onRowClicked={(event) => {
          event.node.setSelected(true);
        }}
        onSelectionChanged={({ selectedNodes }) => {
          const selectedVenta = selectedNodes?.[0]?.data as getVentaResponseProps;
          setVentaSeleccionada(selectedVenta);
        }}
        onRowDoubleClicked={({ data }) => {
          setVentaSeleccionada(data);
        }}
      />
    </div>
  );
}
