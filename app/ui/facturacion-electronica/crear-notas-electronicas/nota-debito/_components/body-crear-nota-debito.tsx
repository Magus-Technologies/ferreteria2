"use client";

import { Form } from "antd";
import { Dayjs } from "dayjs";
import FormBase from "~/components/form/form-base";
import FormNotaDebito from "./form-nota-debito";
import CardsInfoNotaDebito from "./cards-info-nota-debito";
import FormTableNotaDebito from "./form-table-nota-debito";
import useCreateNotaDebito from "../_hooks/use-create-nota-debito";

export type FormCreateNotaDebito = {
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

export default function BodyCrearNotaDebito() {
  const [form] = Form.useForm<FormCreateNotaDebito>();
  const { handleSubmit, loading } = useCreateNotaDebito();

  return (
    <FormBase<FormCreateNotaDebito>
      form={form}
      name="nota-debito"
      className="flex flex-col xl:flex-row gap-4 xl:gap-6 w-full h-full"
      onFinish={handleSubmit}
    >
      <div className="flex-1 flex flex-col gap-4 xl:gap-6 min-w-0 min-h-0">
        <div className="flex-1 min-h-0">
          <FormTableNotaDebito form={form} />
        </div>
        <FormNotaDebito form={form} />
      </div>
      <div className="w-full xl:w-auto">
        <CardsInfoNotaDebito form={form} />
      </div>
    </FormBase>
  );
}
