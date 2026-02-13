"use client";

import { Form, FormInstance } from "antd";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useEffect } from "react";
import FormBase from "~/components/form/form-base";
import FormNotaCredito from "./form-nota-credito";
import CardsInfoNotaCredito from "./cards-info-nota-credito";
import FormTableNotaCredito from "./form-table-nota-credito";
import useCreateNotaCredito from "../_hooks/use-create-nota-credito";

export type FormCreateNotaCredito = {
  // ID de la venta (requerido por backend)
  venta_id?: string;
  
  // Datos del comprobante afectado
  tipo_documento_modifica: "01" | "03"; // 01=Factura, 03=Boleta
  serie_documento_modifica: string;
  numero_documento_modifica: string;
  
  // Datos del cliente
  cliente_id?: number;
  cliente_tipo_documento?: string;
  cliente_numero_documento?: string;
  cliente_nombre?: string;
  cliente_direccion?: string;
  cliente_telefono?: string;
  cliente_email?: string;
  
  // Motivo y fecha
  motivo_nota_id: number;
  motivo_sustento?: string; // ⭐ NUEVO: Sustento específico del motivo (requerido para código 10)
  motivo_descripcion?: string;
  fecha_emision: Dayjs;
  
  // Moneda
  tipo_moneda: "PEN" | "USD";
  tipo_de_cambio?: number;
  
  // Productos/Detalles
  productos: Array<{
    producto_id?: number;
    producto_name?: string;
    producto_codigo?: string;
    marca_name?: string;
    unidad_derivada_id?: number;
    unidad_derivada_name?: string;
    unidad_derivada_factor?: number;
    codigo?: string;
    descripcion: string;
    unidad_medida: string;
    cantidad: number;
    precio_unitario: number;
    precio_venta: number;
    subtotal: number;
  }>;
  
  // Observaciones
  observaciones?: string;
};

export default function BodyCrearNotaCredito({ form }: { form?: FormInstance<FormCreateNotaCredito> }) {
  const [internalForm] = Form.useForm<FormCreateNotaCredito>();
  const formToUse = form || internalForm;
  const { handleSubmit, loading } = useCreateNotaCredito(formToUse);

  // ✅ Inicializar fecha_emision con la fecha actual
  useEffect(() => {
    if (!formToUse.getFieldValue('fecha_emision')) {
      formToUse.setFieldValue('fecha_emision', dayjs());
    }
  }, [formToUse]);

  return (
    <FormBase<FormCreateNotaCredito>
      form={formToUse}
      name="nota-credito"
      className="flex flex-col xl:flex-row gap-4 xl:gap-6 w-full h-full"
      onFinish={handleSubmit}
      initialValues={{
        fecha_emision: dayjs(), // Valor inicial por defecto
        tipo_moneda: 'PEN',
        tipo_de_cambio: 1,
      }}
    >
      {/* Campo oculto para venta_id - Ant Design maneja el valor internamente */}
      <Form.Item name="venta_id" hidden>
        <input />
      </Form.Item>
      
      <div className="flex-1 flex flex-col gap-4 xl:gap-6 min-w-0 min-h-0">
        <div className="flex-1 min-h-0">
          <FormTableNotaCredito form={formToUse} />
        </div>
        <FormNotaCredito form={formToUse} />
      </div>
      <div className="w-full xl:w-auto">
        <CardsInfoNotaCredito form={formToUse} />
      </div>
    </FormBase>
  );
}
