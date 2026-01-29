"use client";

import { FormInstance, Form } from "antd";
import type { FormCreatePrestamo } from "../../_types/prestamo.types";
import TablePrestamo from "../tables/table-prestamo";

export default function FormTablePrestamo({
  form,
}: {
  form: FormInstance<FormCreatePrestamo>;
}) {
  return (
    <Form.List name="productos">
      {(fields, { add, remove }) => (
        <TablePrestamo form={form} fields={fields} remove={remove} add={add} />
      )}
    </Form.List>
  );
}
