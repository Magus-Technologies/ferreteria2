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
import { useStoreProductoAgregadoCotizacion, type ProductoCotizacionConUnidades } from "~/app/ui/facturacion-electronica/mis-cotizaciones/crear-cotizacion/_store/store-producto-agregado-cotizacion";
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
  const [cotizacionActual, setCotizacionActual] = useState<Cotizacion>();
  const setProductosStore = useStoreProductoAgregadoCotizacion(
    (store) => store.setProductos
  );
  const router = useRouter();

  // Redirigir cuando el usuario cierra el modal del PDF
  useEffect(() => {
    if (cotizacionData && !openDoc) {
      router.push('/ui/facturacion-electronica/mis-cotizaciones/crear-cotizacion');
    }
  }, [openDoc, cotizacionData, router]);

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

        // Guardar cotización para usar en el render
        setCotizacionActual(cotizacion);

        // Transformar productos para el formulario.
        // Importante: el `unidad_derivada_inmutable` guarda solo el nombre snapshot
        // (ej. "CAJAX25") y NO el id real de la unidad actual. Para que los selects
        // de tipo_precio/unidad_derivada hagan match con las opciones disponibles
        // del producto, resolvemos la unidad actual buscando por `factor` (que sí
        // es estable y único por producto_almacen).
        const productos: FormCreateCotizacion["productos"] = cotizacion.productos_por_almacen?.flatMap((pac) =>
          pac.unidades_derivadas.map((ud) => {
            const factorBuscado = Number(ud.factor);
            const unidadDisponible = pac.producto_almacen.unidades_derivadas?.find(
              (u) => Number(u.factor) === factorBuscado
            );
            return {
              producto_id: pac.producto_almacen.producto.id,
              producto_name: pac.producto_almacen.producto.name,
              producto_codigo: pac.producto_almacen.producto.cod_producto || '',
              marca_name: pac.producto_almacen.producto.marca.name,
              unidad_derivada_id: unidadDisponible?.unidad_derivada.id ?? ud.unidad_derivada_inmutable.id,
              unidad_derivada_name: unidadDisponible?.unidad_derivada.name ?? ud.unidad_derivada_inmutable.name,
              unidad_derivada_factor: Number(ud.factor),
              cantidad: Number(ud.cantidad),
              precio_venta: Number(ud.precio),
              recargo: Number(ud.recargo),
              subtotal: Number(ud.cantidad) * Number(ud.precio),
              descuento_tipo: (ud.descuento_tipo === '%' ? 'Porcentaje' : 'Monto') as DescuentoTipo,
              descuento: Number(ud.descuento),
            };
          })
        ) || [];

        // Poblar el store con las unidades derivadas disponibles de cada
        // producto. Los selects de tipo_precio y unidad_derivada en columns-cotizar
        // leen de aquí; sin esto, al refrescar la página de edición muestran
        // "-" porque el store solo se llena al agregar productos manualmente.
        const productosStore: ProductoCotizacionConUnidades[] =
          cotizacion.productos_por_almacen?.map((pac) => {
            const primeraUd = pac.unidades_derivadas[0];
            const factorBuscado = Number(primeraUd?.factor ?? 0);
            const unidadDisponible = pac.producto_almacen.unidades_derivadas?.find(
              (u) => Number(u.factor) === factorBuscado
            );
            return {
              producto_id: pac.producto_almacen.producto.id,
              producto_name: pac.producto_almacen.producto.name,
              producto_codigo: pac.producto_almacen.producto.cod_producto || '',
              marca_name: pac.producto_almacen.producto.marca.name,
              unidad_derivada_id: unidadDisponible?.unidad_derivada.id ?? primeraUd?.unidad_derivada_inmutable.id ?? 0,
              unidad_derivada_name: unidadDisponible?.unidad_derivada.name ?? primeraUd?.unidad_derivada_inmutable.name ?? '',
              unidad_derivada_factor: factorBuscado,
              cantidad: Number(primeraUd?.cantidad ?? 0),
              precio_venta: Number(primeraUd?.precio ?? 0),
              recargo: Number(primeraUd?.recargo ?? 0),
              subtotal: Number(primeraUd?.cantidad ?? 0) * Number(primeraUd?.precio ?? 0),
              descuento_tipo: (primeraUd?.descuento_tipo === '%' ? 'Porcentaje' : 'Monto') as DescuentoTipo,
              descuento: Number(primeraUd?.descuento ?? 0),
              unidades_derivadas_disponibles: pac.producto_almacen.unidades_derivadas,
            };
          }) || [];
        setProductosStore(productosStore);

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
          fecha_vencimiento_reserva: cotizacion.fecha_vencimiento_reserva ? dayjs(cotizacion.fecha_vencimiento_reserva) : undefined,
          recomendado_por_id: cotizacion.recomendado_por_id || undefined,
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
  }, [cotizacionId, form, router, setAlmacenId, setProductosStore]);

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
      // Transformar datos del formulario al formato del backend.
      // Nota: `fecha` y `fecha_proforma` se omiten intencionalmente — son la
      // fecha de emisión original de la cotización y no deben modificarse al editar.
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
        fecha_vencimiento_reserva: values.fecha_vencimiento_reserva?.format("YYYY-MM-DD"),
        recomendado_por_id: values.recomendado_por_id,
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

      // Abrir modal con el documento PDF; la redirección ocurre al cerrar el modal
      if (response.data?.data) {
        setCotizacionData(response.data.data);
        setOpenDoc(true);
      } else {
        router.push('/ui/facturacion-electronica/mis-cotizaciones/crear-cotizacion');
      }

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
      <ModalDocCotizacion open={openDoc} setOpen={setOpenDoc} cotizacionId={cotizacionData?.id?.toString()} data={cotizacionData} />
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
          <FormCrearCotizacion
            form={form}
            initialCliente={cotizacionActual?.cliente ?? undefined}
            initialRecomendadoPor={cotizacionActual?.recomendado_por ?? undefined}
          />
        </div>
        <CardsInfoCotizacion form={form} isEditing />
      </FormBase>
    </>
  );
}
