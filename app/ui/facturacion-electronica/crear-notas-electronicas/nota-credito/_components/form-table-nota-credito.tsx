"use client";

import { Form, FormInstance } from "antd";
import TableProductosNotaCredito from "./table-productos-nota-credito";

export default function FormTableNotaCredito({
  form,
}: {
  form: FormInstance;
}) {
  return (
    <Form.List name="productos">
      {(fields, { add, remove }) => (
        <TableProductosNotaCredito
          form={form}
          fields={fields}
          remove={remove}
          add={add}
        />
      )}
    </Form.List>
  );
}
