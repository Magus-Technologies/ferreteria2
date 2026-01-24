"use client";

import { Modal, Form, InputNumber, message } from "antd";
import { useAprobarSolicitudEfectivo } from "../_hooks/use-aprobar-solicitud-efectivo";

interface ModalAprobarSolicitudEfectivoProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  solicitudId: number;
  onSuccess?: () => void;
}

export default function ModalAprobarSolicitudEfectivo({
  open,
  setOpen,
  solicitudId,
  onSuccess,
}: ModalAprobarSolicitudEfectivoProps) {
  const [form] = Form.useForm();
  const { aprobar, loading } = useAprobarSolicitudEfectivo();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const success = await aprobar({
        solicitud_id: solicitudId,
        monto_aprobado: values.monto_aprobado,
      });

      if (success) {
        message.success("Solicitud aprobada exitosamente");
        form.resetFields();
        setOpen(false);
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error al aprobar solicitud:", error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setOpen(false);
  };

  return (
    <Modal
      title="Aprobar Solicitud de Efectivo"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Aprobar"
      cancelText="Cancelar"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Monto a Aprobar"
          name="monto_aprobado"
          rules={[
            { required: true, message: "El monto es requerido" },
            { type: "number", min: 0.01, message: "El monto debe ser mayor a 0" },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            placeholder="Ingrese el monto a aprobar"
            prefix="S/"
            min={0}
            step={0.01}
            precision={2}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
