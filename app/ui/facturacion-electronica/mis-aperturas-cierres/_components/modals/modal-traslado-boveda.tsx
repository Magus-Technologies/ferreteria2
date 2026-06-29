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
  /** @deprecated Ya no se usa: el vendedor se elige en la lista (efectivo por vendedor + caja). */
  vendedorId?: string;
}

interface FormValues {
  origen_value: string; // Almacena "vendedor_id|||sub_caja_id|||despliegue_pago_id"
  monto: number;
  justificacion?: string;
}

interface EfectivoPorVendedorRow {
  vendedor_id: string;
  vendedor_nombre: string;
  sub_caja_id: string | number;
  sub_caja_nombre: string;
  despliegue_pago_id: string;
  metodo_nombre: string;
  efectivo_disponible: string;
}

export default function ModalTrasladoBoveda({
  open,
  onCancel,
  onSuccess,
  aperturaCierreId,
}: ModalTrasladoBovedaProps) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [efectivoDisponible, setEfectivoDisponible] = useState<number>(0);
  const efectivoDisponibleRef = useRef<number>(0);

  // Efectivo (apertura + ventas) SEPARADO por vendedor + caja + método de efectivo.
  const { data: filas = [], isLoading: loadingFilas } = useQuery({
    queryKey: [QueryKeys.SUB_CAJAS, 'efectivo-por-vendedor', aperturaCierreId],
    queryFn: async () => {
      const qs = aperturaCierreId ? `?apertura_cierre_caja_id=${aperturaCierreId}` : ''
      const result = await apiRequest<{ success: boolean; data: EfectivoPorVendedorRow[] }>(
        `/cajas/sub-cajas/efectivo-por-vendedor${qs}`,
      )
      return result.data?.data || []
    },
    enabled: open,
  })

  // Mapa value → saldo para no depender de campos custom en el option de Ant Design
  const saldoMap = useMemo(() => {
    const map: Record<string, number> = {};
    filas.forEach((fila) => {
      const key = `${fila.vendedor_id}|||${fila.sub_caja_id}|||${fila.despliegue_pago_id}`;
      map[key] = parseFloat(fila.efectivo_disponible || '0');
    });
    return map;
  }, [filas]);

  const handleSubmit = async (values: FormValues) => {
    try {
      setLoading(true);

      const [vendedor_id, sub_caja_id, despliegue_pago_id] = values.origen_value.split('|||');

      const result = await trasladoBovedaApi.registrarTraslado({
        apertura_cierre_caja_id: aperturaCierreId,
        sub_caja_id,
        despliegue_pago_id,
        vendedor_id,
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
          label="Caja de Origen"
          rules={[{ required: true, message: "Seleccione la caja de origen" }]}
        >
          <Select
            placeholder="Seleccione la caja"
            loading={loadingFilas}
            showSearch
            optionFilterProp="label"
            notFoundContent={loadingFilas ? 'Cargando...' : 'No tienes efectivo disponible'}
            onChange={(value) => {
              const saldo = saldoMap[value as string] ?? 0;
              efectivoDisponibleRef.current = saldo;
              setEfectivoDisponible(saldo);
            }}
            options={filas.map((fila) => ({
              label: `${fila.sub_caja_nombre} / ${fila.metodo_nombre} - S/ ${parseFloat(fila.efectivo_disponible).toFixed(2)}`,
              value: `${fila.vendedor_id}|||${fila.sub_caja_id}|||${fila.despliegue_pago_id}`,
            }))}
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
            () => ({
              validator(_, value) {
                if (value == null || efectivoDisponible <= 0 || value <= efectivoDisponible) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(`El monto excede el efectivo disponible (S/ ${efectivoDisponible.toFixed(2)})`),
                );
              },
            }),
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
