"use client";

import { Form, message, Spin } from "antd";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FormBase from "~/components/form/form-base";
import FormTableCotizar from "~/app/ui/facturacion-electronica/mis-cotizaciones/crear-cotizacion/_components/form/form-table-cotizar";
import FormCrearCotizacion from "~/app/ui/facturacion-electronica/mis-cotizaciones/crear-cotizacion/_components/form/form-crear-cotizacion";
import CardsInfoCotizacion from "~/app/ui/facturacion-electronica/mis-cotizaciones/crear-cotizacion/_components/cards/cards-info-cotizacion";
import {
  cotizacionesApi,
  type CreateCotizacionRequest,
  type Cotizacion,
} from "~/lib/api/cotizaciones";
import { useStoreAlmacen } from "~/store/store-almacen";
import type { FormCreateCotizacion, DescuentoTipo } from "~/app/ui/facturacion-electronica/mis-cotizaciones/crear-cotizacion/_types/cotizacion.types";
import ModalDocCotizacion, { CotizacionResponse } from "~/app/ui/facturacion-electronica/mis-cotizaciones/_components/modals/modal-doc-cotizacion";
import dayjs from "dayjs";

interface BodyEditarCotizacionProps {
  cotizacionId: string;
}

export default function BodyEditarCotizacion({ cotizacionId }: BodyEditarCotizacionProps) {
  const [form] = Form.useForm<FormCreateCotizacion>();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const { almacen_id, setAlmacenId } = useStoreAlmacen();
  const [openDoc, setOpenDoc] = useState(false);
  const [cotizacionData, setCotizacionData] = useState<CotizacionResponse>();
  const router = useRouter();

  // Cargar datos de la cotización existente
  useEffect(() => {
    const loadCotizacion = async () => {
      try {
        setLoadingData(true);
        const response = await cotizacionesApi.getById(cotizacionId);

        if (response.error) {
          message.error(response.error.message || "Error al cargar la cotización");
          router.push('/ui/facturacion-electronica/mis-cotizaciones');
          return;
        }

        const cotizacion = response.data?.data;
        if (!cotizacion) {
          message.error("No se encontró la cotización");
          router.push('/ui/facturacion-electronica/mis-cotizaciones');
          return;
        }

        // Verificar si la cotización puede editarse
        if (['co', 've', 'ca'].includes(cotizacion.estado_cotizacion)) {
          message.error("No se puede editar una cotización confirmada, vendida o cancelada");
          router.push('/ui/facturacion-electronica/mis-cotizaciones');
          return;
        }

        // Establecer el almacén
        setAlmacenId(cotizacion.almacen_id);

        // Transformar productos para el formulario
        const productos: FormCreateCotizacion["productos"] = cotizacion.productos_por_almacen?.flatMap((pac) =>
          pac.unidades_derivadas.map((ud) => ({
            producto_id: pac.producto_almacen.producto.id,
            producto_name: pac.producto_almacen.producto.name,
            producto_codigo: pac.producto_almacen.producto.cod_producto || '',
            marca_name: pac.producto_almacen.producto.marca.name,
            unidad_derivada_id: ud.unidad_derivada_inmutable.id,
            unidad_derivada_name: ud.unidad_derivada_inmutable.name,
            unidad_derivada_factor: ud.factor,
            cantidad: ud.cantidad,
            precio_venta: ud.precio,
            recargo: ud.recargo,
            subtotal: ud.cantidad * ud.precio,
            descuento_tipo: (ud.descuento_tipo === '%' ? 'Porcentaje' : 'Monto') as DescuentoTipo,
            descuento: ud.descuento,
          }))
        ) || [];

        // Establecer valores iniciales del formulario
        form.setFieldsValue({
          productos,
          fecha: dayjs(cotizacion.fecha),
          vigencia_dias: cotizacion.vigencia_dias,
          fecha_vencimiento: cotizacion.fecha_vencimiento ? dayjs(cotizacion.fecha_vencimiento) : undefined,
          vendedor: cotizacion.vendedor || undefined,
          forma_de_pago: cotizacion.forma_de_pago || undefined,
          ruc_dni: cotizacion.ruc_dni || undefined,
          cliente_id: cotizacion.cliente_id || undefined,
          telefono: cotizacion.telefono || undefined,
          direccion: cotizacion.direccion || undefined,
          tipo_documento: cotizacion.tipo_documento || undefined,
          observaciones: cotizacion.observaciones || undefined,
          reservar_stock: cotizacion.reservar_stock,
        });

      } catch (error) {
        console.error("Error al cargar cotización:", error);
        message.error("Error inesperado al cargar la cotización");
        router.push('/ui/facturacion-electronica/mis-cotizaciones');
      } finally {
        setLoadingData(false);
      }
    };

    if (cotizacionId) {
      loadCotizacion();
    }
  }, [cotizacionId, form, router, setAlmacenId]);

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
      const requestData: Partial<CreateCotizacionRequest> = {
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
        fecha_proforma: values.fecha.format("YYYY-MM-DD HH:mm:ss"),
        tipo_moneda: "s",
        vigencia_dias: values.vigencia_dias,
        fecha_vencimiento: values.fecha_vencimiento?.format("YYYY-MM-DD HH:mm:ss"),
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

      // Llamar a la API de actualización
      const response = await cotizacionesApi.update(cotizacionId, requestData);

      if (response.error) {
        // Manejar errores de validación
        if (response.error.errors) {
          const errorMessages = Object.entries(response.error.errors)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n");
          message.error(`Error de validación:\n${errorMessages}`);
        } else {
          message.error(
            response.error.message || "Error al actualizar la cotización"
          );
        }
        return;
      }

      // Éxito
      message.success(
        response.data?.message || "Cotización actualizada exitosamente"
      );

      // Abrir modal con el documento PDF
      if (response.data?.data) {
        setCotizacionData(response.data.data);
        setOpenDoc(true);
      }

      // Redirigir a la lista después de cerrar el modal
      setTimeout(() => {
        router.push('/ui/facturacion-electronica/mis-cotizaciones');
      }, 1000);

    } catch (error) {
      console.error("Error al actualizar cotización:", error);
      message.error("Error inesperado al actualizar la cotización");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" tip="Cargando cotización..." />
      </div>
    );
  }

  return (
    <>
      <ModalDocCotizacion open={openDoc} setOpen={setOpenDoc} data={cotizacionData} />
      <FormBase<FormCreateCotizacion>
        form={form}
        name="editar-cotizacion"
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
