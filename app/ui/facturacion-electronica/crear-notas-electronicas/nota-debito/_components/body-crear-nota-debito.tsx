"use client";

import { Form, FormInstance } from "antd";
import { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import useApp from "antd/es/app/useApp";
import FormBase from "~/components/form/form-base";
import FormNotaDebito from "./form-nota-debito";
import CardsInfoNotaDebito from "./cards-info-nota-debito";
import FormTableNotaDebito from "./form-table-nota-debito";
import useCreateNotaDebito from "../_hooks/use-create-nota-debito";
import { ventaApi } from "~/lib/api/venta";
import { facturacionElectronicaApi } from "~/lib/api/facturacion-electronica";
import { aplicarComprobanteAForm } from "../_hooks/use-buscar-comprobante-inteligente";

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
  const { message } = useApp();
  // Si venimos de Mis Ventas, la URL trae ?venta_id=X → cargar el comprobante automáticamente
  const searchParams = useSearchParams();
  const ventaId = searchParams.get('venta_id');

  // ✅ Inicializar fecha_emision con la fecha actual
  useEffect(() => {
    if (!formToUse.getFieldValue('fecha_emision')) {
      formToUse.setFieldValue('fecha_emision', dayjs());
    }
  }, [formToUse]);

  // ✅ Auto-cargar el comprobante de la venta si viene por URL (desde Mis Ventas)
  useEffect(() => {
    if (!ventaId || formToUse.getFieldValue('venta_id')) return;

    let cancelled = false;

    (async () => {
      try {
        const ventaResponse = await ventaApi.getById(ventaId);
        // apiRequest devuelve { data: <body Laravel> } → la venta vive en data.data
        const ventaData = (ventaResponse.data as any)?.data;
        const comprobanteElectronico = ventaData?.comprobante_electronico;

        if (!comprobanteElectronico?.id) {
          message.warning('Esta venta no tiene comprobante electrónico asociado')
          return
        }

        const response = await facturacionElectronicaApi.getComprobanteById(comprobanteElectronico.id);
        const comprobante = response.data?.data;

        if (!comprobante || cancelled) return;

        // Requisito SUNAT: el comprobante original debe estar aceptado
        if (!['ACEPTADO', 'ACEPTADO_CON_OBSERVACIONES'].includes(comprobante.estado_sunat)) {
          message.warning(
            `El comprobante ${comprobante.serie}-${comprobante.numero} no está ACEPTADO por SUNAT (estado: ${comprobante.estado_sunat}). Solo se pueden crear notas de débito sobre facturas o boletas aceptadas.`
          );
          return;
        }

        // Unidad de medida con la que se vendió (la venta es la fuente real).
        const unidades = (ventaData?.productos_por_almacen || []).flatMap((pa: any) =>
          (pa?.unidades_derivadas || []).map((u: any) => u?.unidad_derivada_inmutable?.name || ''),
        );

        aplicarComprobanteAForm(formToUse, comprobante, unidades);

        message.success(
          `${comprobante.tipo_comprobante === '01' ? 'Factura' : 'Boleta'} ${comprobante.serie}-${comprobante.numero} cargado`
        );
      } catch (error) {
        if (!cancelled) {
          console.error('Error al cargar venta para nota de débito:', error);
          message.error('Error al cargar la venta seleccionada');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ventaId, formToUse, message]);

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
