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
import type { FormCreateCotizacion, DescuentoTipo } from "../../_types/cotizacion.types";
import ModalDocCotizacion, { CotizacionResponse } from "~/app/ui/facturacion-electronica/mis-cotizaciones/_components/modals/modal-doc-cotizacion";
import { fechaSubmit } from "~/utils/fechas";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import dayjs from "dayjs";
import { useStoreProductoAgregadoCotizacion, type ProductoCotizacionConUnidades } from "../../_store/store-producto-agregado-cotizacion";
import type { Cotizacion } from "~/lib/api/cotizaciones";
import { Spin } from "antd";

export default function BodyCotizar() {
  const [form] = Form.useForm<FormCreateCotizacion>();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const { almacen_id, setAlmacenId } = useStoreAlmacen();
  const [openDoc, setOpenDoc] = useState(false);
  const [cotizacionData, setCotizacionData] = useState<CotizacionResponse>();
  const [cotizacionActual, setCotizacionActual] = useState<Cotizacion>();
  
  const setProductosStore = useStoreProductoAgregadoCotizacion(
    (store) => store.setProductos
  );
  const searchParams = useSearchParams();
  const duplicarId = searchParams.get('duplicar');

  useEffect(() => {
    if (!duplicarId) return;

    const loadCotizacion = async () => {
      try {
        setLoadingData(true);
        const response = await cotizacionesApi.getById(duplicarId);

        if (response.error) {
          message.error(response.error.message || "Error al cargar la cotización para duplicar");
          return;
        }

        const cotizacion = response.data?.data;
        if (!cotizacion) {
          message.error("No se encontró la cotización");
          return;
        }

        setAlmacenId(cotizacion.almacen_id);
        setCotizacionActual(cotizacion);

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

        form.setFieldsValue({
          productos,
          vigencia_dias: cotizacion.vigencia_dias,
          vendedor: cotizacion.vendedor || undefined,
          forma_de_pago: cotizacion.forma_de_pago || undefined,
          ruc_dni: cotizacion.ruc_dni || undefined,
          cliente_id: cotizacion.cliente_id || undefined,
          telefono: cotizacion.telefono || undefined,
          direccion: cotizacion.direccion || undefined,
          tipo_documento: cotizacion.tipo_documento || undefined,
          observaciones: cotizacion.observaciones || undefined,
          reservar_stock: cotizacion.reservar_stock,
          recomendado_por_id: cotizacion.recomendado_por_id || undefined,
        });

      } catch (error) {
        console.error("Error al cargar cotización para duplicar:", error);
        message.error("Error inesperado al cargar la cotización para duplicar");
      } finally {
        setLoadingData(false);
      }
    };

    loadCotizacion();
  }, [duplicarId, form, setAlmacenId, setProductosStore]);

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
        fecha: fechaSubmit(values.fecha),
        fecha_proforma: fechaSubmit(values.fecha), // Usa la misma fecha
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
        fecha_vencimiento_reserva: values.fecha_vencimiento_reserva?.format("YYYY-MM-DD"),
        recomendado_por_id: values.recomendado_por_id,
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

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" tip="Cargando datos para duplicar..." />
      </div>
    );
  }

  return (
    <>
      <ModalDocCotizacion open={openDoc} setOpen={setOpenDoc} cotizacionId={cotizacionData?.id?.toString()} data={cotizacionData} />
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
          <FormCrearCotizacion
            form={form}
            initialCliente={cotizacionActual?.cliente ?? undefined}
            initialRecomendadoPor={cotizacionActual?.recomendado_por ?? undefined}
          />
        </div>
        <CardsInfoCotizacion form={form} />
      </FormBase>
    </>
  );
}
