import { Form, FormInstance } from "antd";
import { VentaConUnidadDerivadaNormal } from "../others/header-crear-venta";
import TableVender from "../tables/table-vender";
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";
import { useConfigMode } from "~/app/ui/configuracion/permisos-visuales/_components/config-mode-context";

export default function FormTableVender({
  form,
  cantidad_pendiente = false,
  venta,
}: {
  form: FormInstance;
  cantidad_pendiente?: boolean;
  venta?: VentaConUnidadDerivadaNormal;
}) {
  const configMode = useConfigMode();
  
  return (
    <Form.List name="productos">
      {(fields, { add, remove }) => (
        <ConfigurableElement
          componentId="crear-venta.tabla-productos"
          label="Tabla de Productos"
          className={configMode?.enabled ? "flex flex-col h-full min-h-[400px]" : "flex flex-col h-full"}
        >
          <TableVender
            venta={venta}
            form={form}
            fields={fields}
            remove={remove}
            add={add}
            cantidad_pendiente={cantidad_pendiente}
          />
        </ConfigurableElement>
      )}
    </Form.List>
  );
}
