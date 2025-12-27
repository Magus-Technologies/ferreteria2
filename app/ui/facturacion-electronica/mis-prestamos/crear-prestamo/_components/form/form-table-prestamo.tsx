"use client";

import { FormInstance, Form } from "antd";
import { useEffect } from "react";
import type { FormCreatePrestamo } from "../../_types/prestamo.types";
import TablePrestamo from "../tables/table-prestamo";
import { useStoreProductoAgregadoPrestamo } from "../../_store/store-producto-agregado-prestamo";

export default function FormTablePrestamo({
  form,
}: {
  form: FormInstance<FormCreatePrestamo>;
}) {
  const productoAgregado = useStoreProductoAgregadoPrestamo(
    (state) => state.productoAgregado
  );
  const setProductoAgregado = useStoreProductoAgregadoPrestamo(
    (state) => state.setProductoAgregado
  );

  useEffect(() => {
    if (productoAgregado) {
      const productosActuales = form.getFieldValue("productos") || [];
      const nuevosProductos = [...productosActuales, productoAgregado];
      form.setFieldValue("productos", nuevosProductos);

      // Calcular monto total
      const montoTotal = nuevosProductos.reduce(
        (sum, p) => sum + p.subtotal,
        0
      );
      form.setFieldValue("monto_total", montoTotal);

      setProductoAgregado(undefined);
    }
  }, [productoAgregado, form, setProductoAgregado]);

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <Form.Item name="productos" initialValue={[]}>
        <TablePrestamo form={form} />
      </Form.Item>
    </div>
  );
}
