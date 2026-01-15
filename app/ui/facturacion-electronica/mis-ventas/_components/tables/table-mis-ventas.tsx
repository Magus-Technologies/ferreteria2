"use client";

import React, { useRef } from "react";
import TableWithTitle from "~/components/tables/table-with-title";
import { getVentaResponseProps } from "~/app/_actions/venta";
import { useColumnsMisVentas } from "./columns-mis-ventas";
import { useStoreFiltrosMisVentas } from "../../_store/store-filtros-mis-ventas";
import useGetVentas from "../../_hooks/use-get-ventas";
import { create } from "zustand";
import { AgGridReact } from "ag-grid-react";
import { orangeColors } from "~/lib/colors";

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

export default function TableMisVentas() {
  const tableRef = useRef<AgGridReact>(null);
  const filtros = useStoreFiltrosMisVentas((state) => state.filtros);
  const { response, loading } = useGetVentas({ where: filtros });

  const setVentaSeleccionada = useStoreVentaSeleccionada(
    (state) => state.setVenta
  );

  // Seleccionar automáticamente el primer registro cuando se cargan los datos
  React.useEffect(() => {
    if (response && response.length > 0 && tableRef.current) {
      // Esperar un momento para que la tabla se renderice completamente
      setTimeout(() => {
        const firstNode = tableRef.current?.api?.getDisplayedRowAtIndex(0);
        if (firstNode) {
          firstNode.setSelected(true);
          setVentaSeleccionada(firstNode.data);
        }
      }, 100);
    }
  }, [response, setVentaSeleccionada]);

  // Manejador para el botón de PDF
  const handleVerPDF = (ventaId: string) => {
    // Abrir el PDF en una nueva pestaña
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
        selectionColor={orangeColors[10]} // Color naranja para facturación electrónica
        onRowClicked={(event) => {
          // Seleccionar la fila cuando se hace clic en cualquier parte
          event.node.setSelected(true);
        }}
        onSelectionChanged={({ selectedNodes }) =>
          setVentaSeleccionada(
            selectedNodes?.[0]?.data as getVentaResponseProps
          )
        }
        onRowDoubleClicked={({ data }) => {
          setVentaSeleccionada(data);
        }}
      />
    </div>
  );
}
