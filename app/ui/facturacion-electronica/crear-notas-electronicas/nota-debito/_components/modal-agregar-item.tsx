"use client";

import { Modal, Form, Input, InputNumber, Select, Alert } from "antd";
import { useState } from "react";

interface ModalAgregarItemProps {
  open: boolean;
  onClose: () => void;
  onAdd: (item: any) => void;
  motivoCodigo?: string; // Código SUNAT del motivo seleccionado
}

// Plantillas de ítems según el motivo
const PLANTILLAS_ITEMS: Record<string, { codigo: string; descripcion: string; placeholder: string }> = {
  "01": {
    codigo: "INT-MORA",
    descripcion: "Interés por mora",
    placeholder: "Ej: Interés por mora - 30 días de retraso",
  },
  "03": {
    codigo: "PENALIDAD",
    descripcion: "Penalidad",
    placeholder: "Ej: Penalidad por incumplimiento de contrato",
  },
  "10": {
    codigo: "OTROS",
    descripcion: "Otros conceptos",
    placeholder: "Ej: Cargo adicional por servicio especial",
  },
};

export default function ModalAgregarItem({
  open,
  onClose,
  onAdd,
  motivoCodigo,
}: ModalAgregarItemProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const plantilla = motivoCodigo ? PLANTILLAS_ITEMS[motivoCodigo] : null;

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // Calcular subtotal (cantidad * precio_unitario)
      const subtotal = values.cantidad * values.precio_unitario;
      
      const nuevoItem = {
        codigo: values.codigo,
        descripcion: values.descripcion,
        unidad_medida: values.unidad_medida || "NIU",
        cantidad: values.cantidad,
        precio_unitario: values.precio_unitario,
        precio_venta: values.precio_unitario, // Para ND, precio_venta = precio_unitario
        subtotal: subtotal,
      };

      onAdd(nuevoItem);
      form.resetFields();
      onClose();
    } catch (error) {
      console.error("Error al validar formulario:", error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  // Inicializar valores por defecto según la plantilla
  const handleAfterOpen = () => {
    if (plantilla) {
      form.setFieldsValue({
        codigo: plantilla.codigo,
        descripcion: plantilla.descripcion,
        unidad_medida: "NIU",
        cantidad: 1,
      });
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <span className="text-orange-600 text-xl">+</span>
          <span>Agregar Ítem a la Nota de Débito</span>
        </div>
      }
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Agregar"
      cancelText="Cancelar"
      width={600}
      confirmLoading={loading}
      afterOpenChange={(visible) => {
        if (visible) handleAfterOpen();
      }}
      okButtonProps={{
        className: "!bg-orange-600 hover:!bg-orange-700",
      }}
    >
      {plantilla && (
        <Alert
          message={`Plantilla para: ${plantilla.descripcion}`}
          description="Los campos se han prellenado con valores sugeridos. Puede modificarlos según necesite."
          type="info"
          showIcon
          className="mb-4"
        />
      )}

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          unidad_medida: "NIU",
          cantidad: 1,
        }}
      >
        <Form.Item
          label="Código"
          name="codigo"
          rules={[{ required: true, message: "Ingrese el código del ítem" }]}
          tooltip="Código interno para identificar el ítem (ej: INT-MORA, PENALIDAD)"
        >
          <Input
            placeholder={plantilla?.codigo || "Ej: INT-001"}
            maxLength={20}
          />
        </Form.Item>

        <Form.Item
          label="Descripción"
          name="descripcion"
          rules={[
            { required: true, message: "Ingrese la descripción del ítem" },
            { min: 10, message: "La descripción debe tener al menos 10 caracteres" },
          ]}
          tooltip="Descripción detallada del concepto que se está cobrando"
        >
          <Input.TextArea
            placeholder={plantilla?.placeholder || "Describa el concepto a cobrar"}
            rows={3}
            maxLength={500}
            showCount
          />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label="Unidad de Medida"
            name="unidad_medida"
            rules={[{ required: true, message: "Seleccione la unidad" }]}
            tooltip="NIU = Unidad (Servicios)"
          >
            <Select
              options={[
                { value: "NIU", label: "NIU - Unidad (Servicios)" },
                { value: "ZZ", label: "ZZ - Servicio" },
                { value: "MON", label: "MON - Monto" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Cantidad"
            name="cantidad"
            rules={[
              { required: true, message: "Ingrese la cantidad" },
              { type: "number", min: 0.01, message: "Debe ser mayor a 0" },
            ]}
          >
            <InputNumber
              className="w-full"
              min={0.01}
              precision={2}
              placeholder="1"
            />
          </Form.Item>
        </div>

        <Form.Item
          label="Precio Unitario (con IGV)"
          name="precio_unitario"
          rules={[
            { required: true, message: "Ingrese el precio" },
            { type: "number", min: 0.01, message: "Debe ser mayor a 0" },
          ]}
          tooltip="Ingrese el monto total a cobrar (ya incluye IGV)"
        >
          <InputNumber
            className="w-full"
            min={0.01}
            precision={2}
            prefix="S/."
            placeholder="0.00"
          />
        </Form.Item>

        <Form.Item noStyle shouldUpdate>
          {() => {
            const cantidad = form.getFieldValue("cantidad") || 0;
            const precioUnitario = form.getFieldValue("precio_unitario") || 0;
            const subtotal = cantidad * precioUnitario;

            return subtotal > 0 ? (
              <Alert
                message={
                  <div className="flex justify-between items-center">
                    <span>Subtotal (con IGV):</span>
                    <span className="font-bold text-lg">
                      S/. {subtotal.toFixed(2)}
                    </span>
                  </div>
                }
                type="success"
                showIcon={false}
              />
            ) : null;
          }}
        </Form.Item>
      </Form>
    </Modal>
  );
}
