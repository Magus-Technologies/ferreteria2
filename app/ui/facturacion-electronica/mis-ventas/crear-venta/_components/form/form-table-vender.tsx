import { FormInstance } from "antd";
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

  // La tabla de productos vive en Zustand, no en el form (ver
  // store-producto-agregado-venta.ts) — ya no necesita el Form.List que la
  // envolvía antes para darle `fields`/`add`/`remove`.
  return (
    <ConfigurableElement
      componentId="crear-venta.tabla-productos"
      label="Tabla de Productos"
      className={`flex flex-col h-full min-w-0 ${configMode?.enabled ? "min-h-[400px]" : "min-h-[300px] sm:min-h-0"}`}
    >
      <TableVender
        venta={venta}
        form={form}
        cantidad_pendiente={cantidad_pendiente}
      />
    </ConfigurableElement>
  );
}
