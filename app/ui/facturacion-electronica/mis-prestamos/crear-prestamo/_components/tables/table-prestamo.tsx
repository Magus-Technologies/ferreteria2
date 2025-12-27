"use client";

import { FormInstance, Form } from "antd";
import TableWithTitle from "~/components/tables/table-with-title";
import { useColumnsPrestamo } from "./columns-prestamo";
import type { FormCreatePrestamo } from "../../_types/prestamo.types";

export default function TablePrestamo({
  form,
}: {
  form: FormInstance<FormCreatePrestamo>;
}) {
  const productos = Form.useWatch("productos", form) || [];

  const handleEliminarProducto = (index: number) => {
    const nuevosProductos = productos.filter((_: any, i: number) => i !== index);
    form.setFieldValue("productos", nuevosProductos);

    // Recalcular monto total
    const montoTotal = nuevosProductos.reduce(
      (sum: number, p: any) => sum + p.subtotal,
      0
    );
    form.setFieldValue("monto_total", montoTotal);
  };

  return (
    <div style={{ height: '200px', width: '100%' }}>
      <TableWithTitle
        id="tabla-productos-prestamo"
        title="Productos del Préstamo"
        columnDefs={useColumnsPrestamo(handleEliminarProducto)}
        rowData={productos}
        loading={false}
      />
    </div>
  );
}
