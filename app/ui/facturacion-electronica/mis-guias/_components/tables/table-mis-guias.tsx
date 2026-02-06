"use client";

import React, { useRef, useState } from "react";
import TableWithTitle from "~/components/tables/table-with-title";
import type { GuiaRemision } from "~/lib/api/guia-remision";
import { useColumnsMisGuias } from "./columns-mis-guias";
import useGetGuias from "../../_hooks/use-get-guias";
import { create } from "zustand";
import { AgGridReact } from "ag-grid-react";
import { orangeColors, greenColors, redColors } from "~/lib/colors";
import { RowStyle } from "ag-grid-community";

type UseStoreGuiaSeleccionada = {
  guia?: GuiaRemision;
  setGuia: (guia: GuiaRemision | undefined) => void;
};

export const useStoreGuiaSeleccionada = create<UseStoreGuiaSeleccionada>(
  (set) => ({
    guia: undefined,
    setGuia: (guia) => set({ guia }),
  })
);

// Función para calcular el color de una guía
function calcularColorGuia(guia: GuiaRemision): string {
  const estado = guia.estado;

  // Naranja: BORRADOR
  if (estado === 'BORRADOR') {
    return orangeColors[2];
  }

  // Verde: EMITIDA
  if (estado === 'EMITIDA') {
    return greenColors[2];
  }

  // Rojo: ANULADA
  if (estado === 'ANULADA') {
    return redColors[2];
  }

  return 'transparent';
}

export default function TableMisGuias() {
  const tableRef = useRef<AgGridReact>(null);
  const { guias, loading, refetch } = useGetGuias();

  const setGuiaSeleccionada = useStoreGuiaSeleccionada(
    (state) => state.setGuia
  );

  const [selectionColor, setSelectionColor] = useState<string>('transparent');

  // Seleccionar automáticamente el primer registro cuando se cargan los datos
  React.useEffect(() => {
    if (guias && guias.length > 0 && tableRef.current) {
      setTimeout(() => {
        const firstNode = tableRef.current?.api?.getDisplayedRowAtIndex(0);
        if (firstNode) {
          firstNode.setSelected(true);
          setGuiaSeleccionada(firstNode.data);
          // Calcular color de la primera fila
          const color = calcularColorGuia(firstNode.data);
          setSelectionColor(color);
        }
      }, 100);
    }
  }, [guias, setGuiaSeleccionada]);

  // Función para aplicar estilos a las filas
  const getRowStyle = (params: { data?: GuiaRemision }): RowStyle | undefined => {
    if (!params.data) return undefined;
    
    const color = calcularColorGuia(params.data);
    
    return {
      background: color,
    };
  };

  return (
    <div className="w-full" style={{ height: "300px" }}>
      <TableWithTitle<GuiaRemision>
        id="mis-guias"
        title="GUÍAS DE REMISIÓN"
        loading={loading}
        columnDefs={useColumnsMisGuias(refetch)}
        rowData={guias || []}
        tableRef={tableRef}
        selectionColor={selectionColor}
        getRowStyle={getRowStyle}
        onRowClicked={(event) => {
          event.node.setSelected(true);
        }}
        onSelectionChanged={({ selectedNodes, api }) => {
          const selectedGuia = selectedNodes?.[0]?.data as GuiaRemision;
          setGuiaSeleccionada(selectedGuia);
          
          // Actualizar el color de selección dinámicamente
          if (selectedGuia) {
            const color = calcularColorGuia(selectedGuia);
            setSelectionColor(color);
            
            // Forzar redibujado de filas para aplicar el nuevo color inmediatamente
            api?.redrawRows();
          }
        }}
        onRowDoubleClicked={({ data }) => {
          setGuiaSeleccionada(data);
        }}
      />
    </div>
  );
}
