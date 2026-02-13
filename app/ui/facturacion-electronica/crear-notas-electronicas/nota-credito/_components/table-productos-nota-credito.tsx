"use client";

import { FormInstance, FormListFieldData } from "antd";
import { useRef, useEffect } from "react";
import TableWithTitle from "~/components/tables/table-with-title";
import { useColumnsNotaCredito } from "./columns-nota-credito";

interface TableProductosNotaCreditoProps {
  form: FormInstance;
  fields: FormListFieldData[];
  remove: (index: number | number[]) => void;
}

export default function TableProductosNotaCredito({
  form,
  fields,
  remove,
}: TableProductosNotaCreditoProps) {
  const tableGridRef = useRef<any>(null);
  const columnDefs = useColumnsNotaCredito({ remove, form });

  // Limpiar cualquier estado guardado en localStorage al montar el componente
  useEffect(() => {
    const storageKey = "ag-grid-state-f-e.table-productos-nota-credito";
    localStorage.removeItem(storageKey);
  }, []);

  // Forzar redibujado y resetear orden de columnas cuando cambien los fields
  useEffect(() => {
    if (tableGridRef.current?.api) {
      setTimeout(() => {
        // Resetear el orden de columnas al orden definido en columnDefs
        const columnState = columnDefs.map((col: any, index) => ({
          colId: col.colId,
          hide: false,
          width: col.width || undefined,
        }));
        
        tableGridRef.current.api.applyColumnState({
          state: columnState,
          applyOrder: true,
        });
        
        tableGridRef.current.api.refreshCells({ force: true });
        tableGridRef.current.api.sizeColumnsToFit();
      }, 100);
    }
  }, [fields.length, columnDefs]);

  return (
    <TableWithTitle
      tableRef={tableGridRef}
      id="f-e.table-productos-nota-credito"
      title="Productos de la Nota de Crédito"
      columnDefs={columnDefs}
      rowData={fields}
      loading={false}
      rowSelection={false}
      pagination={false}
      domLayout="autoHeight"
      rowHeight={48}
      headerHeight={40}
      exportExcel={false}
      exportPdf={false}
      selectColumns={false}
      suppressRowHoverHighlight={true}
      persistColumnState={false}
      withNumberColumn={false}
    />
  );
}
