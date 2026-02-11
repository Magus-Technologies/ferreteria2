"use client";

import { FormInstance, FormListFieldData, Button, Form } from "antd";
import { FormCreateNotaDebito } from "./body-crear-nota-debito";
import TableBase from "~/components/tables/table-base";
import CellFocusWithoutStyle from "~/components/tables/cell-focus-without-style";
import { useColumnsNotaDebito } from "./columns-nota-debito";
import { PlusOutlined } from "@ant-design/icons";
import { useState } from "react";
import ModalAgregarItem from "./modal-agregar-item";
import { useMotivoInfo } from "../_hooks/use-motivo-info";

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
  const [modalOpen, setModalOpen] = useState(false);
  
  // Obtener el motivo seleccionado para pasar al modal
  const motivoNotaId = Form.useWatch("motivo_nota_id", form);
  
  // Obtener información del motivo incluyendo el código SUNAT
  const motivoInfo = useMotivoInfo(motivoNotaId);

  const handleAgregarItem = (item: any) => {
    add(item);
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-semibold text-gray-700">
          Productos / Conceptos de la Nota de Débito
        </h3>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
          size="small"
          className="!text-orange-600 !border-orange-600 hover:!bg-orange-50"
        >
          Agregar Ítem (Interés, Penalidad, etc.)
        </Button>
      </div>
      
      <div className="flex-1 min-h-0">
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
      </div>

      <ModalAgregarItem
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleAgregarItem}
        motivoCodigo={motivoInfo?.codigoSunat}
      />
    </div>
  );
}
