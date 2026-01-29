"use client";

import { FormInstance, FormListFieldData } from "antd";
import { StoreValue } from "antd/es/form/interface";
import { useEffect } from "react";
import TableBase from "~/components/tables/table-base";
import { useColumnsPrestamo } from "./columns-prestamo";
import type { FormCreatePrestamo } from "../../_types/prestamo.types";
import CellFocusWithoutStyle from "~/components/tables/cell-focus-without-style";
import { useStoreProductoAgregadoPrestamo } from "../../_store/store-producto-agregado-prestamo";

export default function TablePrestamo({
  form,
  fields,
  remove,
  add,
}: {
  form: FormInstance<FormCreatePrestamo>;
  fields: FormListFieldData[];
  remove: (index: number | number[]) => void;
  add: (defaultValue?: StoreValue, insertIndex?: number) => void;
}) {
  const productoAgregado = useStoreProductoAgregadoPrestamo(
    (state) => state.productoAgregado
  );
  const setProductoAgregado = useStoreProductoAgregadoPrestamo(
    (state) => state.setProductoAgregado
  );

  useEffect(() => {
    if (productoAgregado) {
      // Agregar al formulario usando add
      add(productoAgregado);

      // Calcular monto total
      const productos = form.getFieldValue("productos") || [];
      const montoTotal = [...productos, productoAgregado].reduce(
        (sum, p) => sum + p.subtotal,
        0
      );
      form.setFieldValue("monto_total", montoTotal);

      setProductoAgregado(undefined);
    }
  }, [productoAgregado, form, setProductoAgregado, add]);

  const handleEliminarProducto = (index: number) => {
    remove(index);

    // Recalcular monto total después de eliminar
    const productos = form.getFieldValue("productos") || [];
    const montoTotal = productos
      .filter((_: any, i: number) => i !== index)
      .reduce((sum: number, p: any) => sum + p.subtotal, 0);
    form.setFieldValue("monto_total", montoTotal);
  };

  return (
    <>
      <CellFocusWithoutStyle />
      <TableBase
        className="h-full"
        rowSelection={false}
        rowData={fields}
        columnDefs={useColumnsPrestamo(handleEliminarProducto, form)}
        suppressCellFocus={true}
      />
    </>
  );
}
