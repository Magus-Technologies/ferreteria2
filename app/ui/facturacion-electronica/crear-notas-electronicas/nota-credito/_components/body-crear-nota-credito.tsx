"use client";

import { Form, message } from "antd";
import { Dayjs } from "dayjs";
import { useState } from "react";
import FormBase from "~/components/form/form-base";
import FormNotaCredito from "./form-nota-credito";
import CardsInfoNotaCredito from "./cards-info-nota-credito";

export type FormCreateNotaCredito = {
  // Datos del comprobante afectado
  tipo_documento_modifica: "01" | "03"; // 01=Factura, 03=Boleta
  serie_documento_modifica: string;
  numero_documento_modifica: string;
  
  // Datos del cliente
  cliente_tipo_documento?: string;
  cliente_numero_documento?: string;
  cliente_nombre?: string;
  cliente_direccion?: string;
  
  // Motivo y fecha
  motivo_nota_id: number;
  motivo_descripcion?: string;
  fecha_emision: Dayjs;
  
  // Moneda
  tipo_moneda: "PEN" | "USD";
  
  // Productos/Detalles
  productos: Array<{
    producto_id?: number;
    codigo?: string;
    descripcion: string;
    unidad_medida: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }>;
  
  // Observaciones
  observaciones?: string;
};

export default function BodyCrearNotaCredito() {
  const [form] = Form.useForm<FormCreateNotaCredito>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: FormCreateNotaCredito) => {
    if (!values.productos || values.productos.length === 0) {
      message.error("Debe agregar al menos un producto");
      return;
    }

    setLoading(true);
    try {
      // Aquí iría la lógica para crear la nota de crédito
      // Por ahora solo mostramos un mensaje
      console.log("Crear Nota de Crédito:", values);
      message.success("Nota de Crédito creada exitosamente");
      form.resetFields();
    } catch (error: any) {
      message.error(error.message || "Error al crear nota de crédito");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormBase<FormCreateNotaCredito>
      form={form}
      name="nota-credito"
      className="flex flex-col xl:flex-row gap-4 xl:gap-6 w-full h-full"
      onFinish={handleSubmit}
    >
      <div className="flex-1 flex flex-col gap-4 xl:gap-6 min-w-0">
        <FormNotaCredito form={form} loading={loading} />
      </div>

      <div className="xl:w-[280px] flex-shrink-0">
        <CardsInfoNotaCredito form={form} loading={loading} />
      </div>
    </FormBase>
  );
}
