"use client";

import { FormInstance, FormListFieldData } from "antd";
import TableBase from "~/components/tables/table-base";
import CellFocusWithoutStyle from "~/components/tables/cell-focus-without-style";
import { useColumnsNotaCredito } from "./columns-nota-credito";

interface TableProductosNotaCreditoProps {
  form: FormInstance<any>;
  fields: FormListFieldData[];
  remove: (index: number | number[]) => void;
  add: (defaultValue?: any, insertIndex?: number) => void;
}

export default function TableProductosNotaCredito({
  form,
  fields,
  remove,
}: TableProductosNotaCreditoProps) {
  return (
    <>
      <CellFocusWithoutStyle />
      <TableBase
        className="h-full"
        rowSelection={false}
        rowData={fields}
        columnDefs={useColumnsNotaCredito({
          remove,
          form,
        })}
        suppressCellFocus={true}
        rowHeight={32}
        headerHeight={32}
        withNumberColumn={false}
      />
    </>
  );
}

