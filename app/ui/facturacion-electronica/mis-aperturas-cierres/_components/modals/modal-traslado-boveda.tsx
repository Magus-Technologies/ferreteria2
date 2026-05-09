"use client";

import { useState, useRef, useMemo } from "react";
import { Modal, Form, InputNumber, Input, Select, App } from "antd";
import { DollarOutlined } from "@ant-design/icons";
import { trasladoBovedaApi } from "../../../../../../lib/api/traslado-boveda";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "~/lib/api";
import { QueryKeys } from "~/app/_lib/queryKeys";

interface ModalTrasladoBovedaProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  aperturaCierreId: string;
  vendedorId: string;
}

interface FormValues {
  origen_value: string; // Will store "sub_caja_id-despliegue_pago_id"
  monto: number;
  justificacion?: string;
}

export default function ModalTrasladoBoveda({
  open,
  onCancel,
  onSuccess,
  aperturaCierreId,
  vendedorId,
}: ModalTrasladoBovedaProps) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [efectivoDisponible, setEfectivoDisponible] = useState<number>(0);
  const efectivoDisponibleRef = useRef<number>(0);

  // Cargar las sub cajas asignadas al usuario para ventas
  const { data: subCajas = [], isLoading: loadingSubCajas } = useQuery({
    queryKey: [QueryKeys.SUB_CAJAS, 'todas-con-saldo-vendedor'],
    queryFn: async () => {
      const result = await apiRequest<{ success: boolean; data: any[] }>('/cajas/sub-cajas/todas-con-saldo-vendedor')
      return result.data?.data || []
    },
    enabled: open,
  })

  // Mapa value → saldo para no depender de campos custom en el option de Ant Design
  const saldoMap = useMemo(() => {
    const map: Record<string, number> = {};
    subCajas.forEach((caja: any) => {
      (caja.metodos_pago || []).forEach((metodo: any) => {
        const key = `${caja.id}|||${metodo.despliegue_pago_id}`;
        map[key] = parseFloat(metodo.saldo_vendedor || '0');
      });
    });
    return map;
  }, [subCajas]);

  const handleSubmit = async (values: FormValues) => {
    try {
      setLoading(true);

      const [sub_caja_id, despliegue_pago_id] = values.origen_value.split('|||');

      const result = await trasladoBovedaApi.registrarTraslado({
        apertura_cierre_caja_id: aperturaCierreId,
        sub_caja_id,
        despliegue_pago_id,
        vendedor_id: vendedorId,
        monto: values.monto,
        justificacion: values.justificacion,
      });

      if (result?.error) {
        modal.warning({
          title: 'No se pudo registrar el traslado',
          content: result.error.message || 'Error al registrar traslado',
        });
        return;
      }

      message.success("Traslado a bóveda registrado exitosamente");
      form.resetFields();
      setEfectivoDisponible(0);
      efectivoDisponibleRef.current = 0;
      onSuccess();
    } catch (error: any) {
      modal.warning({
        title: 'No se pudo registrar el traslado',
        content: error.response?.data?.message || error?.message || 'Error al registrar traslado a bóveda',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setEfectivoDisponible(0);
    efectivoDisponibleRef.current = 0;
    onCancel();
  };

  return (
    <Modal
      title="Traslado de Efectivo a Bóveda"
      open={open}
      onCancel={handleCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Registrar Traslado"
      cancelText="Cancelar"
      width={600}
      destroyOnHidden
    >
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <DollarOutlined className="mr-2" />
          Efectivo disponible: <strong>S/ {efectivoDisponible.toFixed(2)}</strong>
        </p>
        <p className="text-xs text-blue-600 mt-1">
          El monto trasladado se restará del efectivo en caja y se registrará
          en la bóveda.
        </p>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <Form.Item
          name="origen_value"
          label="Caja y Método de Origen"
          rules={[{ required: true, message: "Seleccione el método de origen" }]}
        >
          <Select
            placeholder="Seleccione la caja"
            loading={loadingSubCajas}
            onChange={(value) => {
              const saldo = saldoMap[value as string] ?? 0;
              efectivoDisponibleRef.current = saldo;
              setEfectivoDisponible(saldo);
            }}
            options={subCajas.flatMap((caja: any) =>
              (caja.metodos_pago || [])
                .filter((metodo: any) => {
                  const nombreMetodo = (metodo.metodo_de_pago_nombre || '').toLowerCase();
                  const nombreDespliegue = (metodo.nombre || '').toLowerCase();
                  const cuenta = metodo.cuenta_bancaria;
                  const sinCuenta = !cuenta || cuenta === 'SIN-CUENTA' || cuenta === '-';
                  const esEfectivo = sinCuenta && (
                    nombreMetodo.includes('efectivo') ||
                    nombreDespliegue.includes('efectivo')
                  );
                  // Solo mostrar efectivos que tengan saldo > 0
                  const tieneSaldo = parseFloat(metodo.saldo_vendedor || '0') > 0;
                  return esEfectivo && tieneSaldo;
                })
                .map((metodo: any) => ({
                  label: `${caja.nombre} / ${metodo.nombre} - S/ ${parseFloat(metodo.saldo_vendedor).toFixed(2)}`,
                  value: `${caja.id}|||${metodo.despliegue_pago_id}`,
                  saldo_efectivo: metodo.saldo_vendedor,
                }))
            )}
          />
        </Form.Item>

        <Form.Item
          name="monto"
          label="Monto a Trasladar"
          rules={[
            { required: true, message: "Ingrese el monto" },
            {
              type: "number",
              min: 0.01,
              message: "El monto debe ser mayor a 0",
            },
          ]}
        >
          <InputNumber
            prefix="S/"
            placeholder="0.00"
            className="w-full"
            min={0.01}
            step={0.01}
            precision={2}
          />
        </Form.Item>

        <Form.Item
          name="justificacion"
          label="Justificación (Opcional)"
          rules={[{ max: 500, message: "Máximo 500 caracteres" }]}
        >
          <Input.TextArea
            placeholder="Motivo del traslado..."
          />
        </Form.Item>


      </Form>
    </Modal>
  );
}
