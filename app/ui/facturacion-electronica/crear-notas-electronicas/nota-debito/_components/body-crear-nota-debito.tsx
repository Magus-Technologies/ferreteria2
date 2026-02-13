"use client";

import { Form, FormInstance } from "antd";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useEffect } from "react";
import FormBase from "~/components/form/form-base";
import FormNotaDebito from "./form-nota-debito";
import CardsInfoNotaDebito from "./cards-info-nota-debito";
import FormTableNotaDebito from "./form-table-nota-debito";
import useCreateNotaDebito from "../_hooks/use-create-nota-debito";

export type FormCreateNotaDebito = {
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
  motivo_descripcion?: string;
  motivo_sustento?: string; // Campo específico para motivo 10 (Otros conceptos)
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

export default function BodyCrearNotaDebito({ form }: { form?: FormInstance<FormCreateNotaDebito> }) {
  const [internalForm] = Form.useForm<FormCreateNotaDebito>();
  const formToUse = form || internalForm;
  const { handleSubmit, loading } = useCreateNotaDebito(formToUse);

  // ✅ Inicializar fecha_emision con la fecha actual
  useEffect(() => {
    if (!formToUse.getFieldValue('fecha_emision')) {
      formToUse.setFieldValue('fecha_emision', dayjs());
    }
  }, [formToUse]);

  return (
    <FormBase<FormCreateNotaDebito>
      form={formToUse}
      name="nota-debito"
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
          <FormTableNotaDebito form={formToUse} />
        </div>
        <FormNotaDebito form={formToUse} />
      </div>
      <div className="w-full xl:w-auto">
        <CardsInfoNotaDebito form={formToUse} />
      </div>
    </FormBase>
  );
}
