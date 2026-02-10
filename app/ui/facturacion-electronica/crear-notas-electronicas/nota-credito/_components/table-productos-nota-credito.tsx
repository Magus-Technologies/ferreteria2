"use client";

import { FormInstance, FormListFieldData } from "antd";
import { useRef } from "react";
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
      getRowHeight={() => 35}
      exportExcel={false}
      exportPdf={false}
      selectColumns={false}
      suppressRowHoverHighlight={true}
      getRowStyle={() => ({ background: 'white' })}
    />
  );
}
