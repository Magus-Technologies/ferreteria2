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
      {(fields, { remove }) => (
        <TableProductosNotaCredito
          form={form}
          fields={fields}
          remove={remove}
        />
      )}
    </Form.List>
  );
}

