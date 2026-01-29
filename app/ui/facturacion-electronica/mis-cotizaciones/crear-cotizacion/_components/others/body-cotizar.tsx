"use client";

import { Form, message } from "antd";
import { useState } from "react";
import FormBase from "~/components/form/form-base";
import FormTableCotizar from "../form/form-table-cotizar";
import FormCrearCotizacion from "../form/form-crear-cotizacion";
import CardsInfoCotizacion from "../cards/cards-info-cotizacion";
import {
  cotizacionesApi,
  type CreateCotizacionRequest,
} from "~/lib/api/cotizaciones";
import { useStoreAlmacen } from "~/store/store-almacen";
import type { FormCreateCotizacion } from "../../_types/cotizacion.types";
import ModalDocCotizacion, { CotizacionResponse } from "~/app/ui/facturacion-electronica/mis-cotizaciones/_components/modals/modal-doc-cotizacion";

export default function BodyCotizar() {
  const [form] = Form.useForm<FormCreateCotizacion>();
  const [loading, setLoading] = useState(false);
  const { almacen_id } = useStoreAlmacen();
  const [openDoc, setOpenDoc] = useState(false);
  const [cotizacionData, setCotizacionData] = useState<CotizacionResponse>();

  const handleSubmit = async (values: FormCreateCotizacion) => {
    if (!almacen_id) {
      message.error("No se ha seleccionado un almacén");
      return;
    }

    if (!values.productos || values.productos.length === 0) {
      message.error("Debe agregar al menos un producto");
      return;
    }

    setLoading(true);

    try {
      // Transformar datos del formulario al formato del backend
      const requestData: CreateCotizacionRequest = {
        productos: values.productos.map((p) => ({
          producto_id: p.producto_id,
          unidad_derivada_id: p.unidad_derivada_id,
          unidad_derivada_factor: p.unidad_derivada_factor,
          cantidad: p.cantidad,
          precio_venta: p.precio_venta,
          recargo: p.recargo,
          descuento_tipo: p.descuento_tipo === "Porcentaje" ? "%" : "m",
          descuento: p.descuento,
        })),
        fecha: values.fecha.format("YYYY-MM-DD HH:mm:ss"),
        fecha_proforma: values.fecha.format("YYYY-MM-DD HH:mm:ss"), // Usa la misma fecha
        tipo_moneda: "s", // TODO: Obtener del formulario cuando se agregue el campo
        // tipo_de_cambio: values.tipo_de_cambio, // TODO: Agregar campo en el formulario
        vigencia_dias: values.vigencia_dias,
        fecha_vencimiento: values.fecha_vencimiento?.format(
          "YYYY-MM-DD HH:mm:ss"
        ),
        vendedor: values.vendedor,
        forma_de_pago: values.forma_de_pago,
        ruc_dni: values.ruc_dni,
        cliente_id: values.cliente_id,
        telefono: values.telefono,
        direccion: values.direccion,
        tipo_documento: values.tipo_documento,
        observaciones: values.observaciones,
        reservar_stock: values.reservar_stock ?? false,
        almacen_id: almacen_id,
      };

      // Llamar a la API
      const response = await cotizacionesApi.create(requestData);

      if (response.error) {
        // Manejar errores de validación
        if (response.error.errors) {
          const errorMessages = Object.entries(response.error.errors)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n");
          message.error(`Error de validación:\n${errorMessages}`);
        } else {
          message.error(
            response.error.message || "Error al crear la cotización"
          );
        }
        return;
      }

      // Éxito
      message.success(
        response.data?.message || "Cotización creada exitosamente"
      );

      // Abrir modal con el documento PDF
      if (response.data?.data) {
        setCotizacionData(response.data.data);
        setOpenDoc(true);
      }

      // Limpiar formulario
      form.resetFields();
    } catch (error) {
      console.error("Error al crear cotización:", error);
      message.error("Error inesperado al crear la cotización");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ModalDocCotizacion open={openDoc} setOpen={setOpenDoc} data={cotizacionData} />
      <FormBase<FormCreateCotizacion>
        form={form}
        name="cotizacion"
        className="flex gap-6 size-full"
        onFinish={handleSubmit}
        onFinishFailed={() => {
          message.error('Por favor completa todos los campos requeridos');
        }}
        disabled={loading}
      >
        <div className="flex-1 flex flex-col gap-6 min-w-0 min-h-0">
          <div className="flex-1 min-h-0">
            <FormTableCotizar form={form} />
          </div>
          <FormCrearCotizacion form={form} />
        </div>
        <CardsInfoCotizacion form={form} />
      </FormBase>
    </>
  );
}
