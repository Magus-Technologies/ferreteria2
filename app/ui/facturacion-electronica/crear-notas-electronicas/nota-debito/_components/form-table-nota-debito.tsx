"use client";

import { Form, FormInstance } from "antd";
import TableProductosNotaDebito from "./table-productos-nota-debito";

export default function FormTableNotaDebito({
  form,
}: {
  form: FormInstance;
}) {
  return (
    <Form.List name="productos">
      {(fields, { add, remove }) => (
        <TableProductosNotaDebito
          form={form}
          fields={fields}
          remove={remove}
          add={add}
        />
      )}
    </Form.List>
  );
}
