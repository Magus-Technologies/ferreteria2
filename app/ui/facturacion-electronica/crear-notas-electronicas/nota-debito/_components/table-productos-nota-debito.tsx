"use client";

import { FormInstance, FormListFieldData } from "antd";
import { FormCreateNotaDebito } from "./body-crear-nota-debito";
import TableBase from "~/components/tables/table-base";
import CellFocusWithoutStyle from "~/components/tables/cell-focus-without-style";
import { useColumnsNotaDebito } from "./columns-nota-debito";

interface TableProductosNotaDebitoProps {
  form: FormInstance<FormCreateNotaDebito>;
  fields: FormListFieldData[];
  remove: (index: number | number[]) => void;
  add: (defaultValue?: any, insertIndex?: number) => void;
}

export default function TableProductosNotaDebito({
  form,
  fields,
  remove,
  add,
}: TableProductosNotaDebitoProps) {
  return (
    <>
      <CellFocusWithoutStyle />
      <TableBase
        className="h-full"
        rowSelection={false}
        rowData={fields}
        columnDefs={useColumnsNotaDebito({
          remove,
          form,
        })}
        suppressCellFocus={true}
      />
    </>
  );
}
