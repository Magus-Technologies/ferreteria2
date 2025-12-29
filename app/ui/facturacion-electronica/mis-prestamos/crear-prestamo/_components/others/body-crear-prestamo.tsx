"use client";

import { Form, message } from "antd";
import { useState } from "react";
import { useRouter } from "next/navigation";
import FormBase from "~/components/form/form-base";
import FormTablePrestamo from "../form/form-table-prestamo";
import FormCrearPrestamo from "../form/form-crear-prestamo";
import CardsInfoPrestamo from "../cards/cards-info-prestamo";
import { prestamoApi, type CreatePrestamoRequest } from "~/lib/api/prestamo";
import { useStoreAlmacen } from "~/store/store-almacen";
import type { FormCreatePrestamo } from "../../_types/prestamo.types";

export default function BodyCrearPrestamo() {
  const [form] = Form.useForm<FormCreatePrestamo>();
  const [loading, setLoading] = useState(false);
  const { almacen_id } = useStoreAlmacen();
  const router = useRouter();

  const handleSubmit = async (values: FormCreatePrestamo) => {
    if (!almacen_id) {
      message.error("No se ha seleccionado un almacén");
      return;
    }

    if (!values.productos || values.productos.length === 0) {
      message.error("Debe agregar al menos un producto");
      return;
    }

    // Validación de cliente/proveedor según tipo_entidad
    if (values.tipo_entidad === 'CLIENTE' && !values.cliente_id) {
      message.error("Debe seleccionar un cliente para esta operación");
      return;
    }

    if (values.tipo_entidad === 'PROVEEDOR' && !values.proveedor_id) {
      message.error("Debe seleccionar un proveedor para esta operación");
      return;
    }

    setLoading(true);

    try {
      // Calcular monto total (suma de subtotales de productos) - Comentado: Solo se maneja por cantidad
      // const monto_total = values.productos.reduce(
      //   (acc, item) => acc + Number(item?.costo ?? 0) * Number(item?.cantidad ?? 0),
      //   0
      // );

      // Transformar datos del formulario al formato del backend
      const requestData: CreatePrestamoRequest = {
        productos: values.productos.map((p) => ({
          producto_id: p.producto_id,
          unidad_derivada_id: p.unidad_derivada_id,
          unidad_derivada_factor: p.unidad_derivada_factor,
          cantidad: p.cantidad,
          // costo: p.costo, // Comentado: Solo se maneja por cantidad
        })),
        fecha: values.fecha.format("YYYY-MM-DD HH:mm:ss"),
        fecha_vencimiento: values.fecha_vencimiento.format("YYYY-MM-DD HH:mm:ss"),
        tipo_operacion: values.tipo_operacion,
        tipo_entidad: values.tipo_entidad,
        tipo_moneda: values.tipo_moneda,
        tipo_de_cambio: values.tipo_de_cambio,
        cliente_id: values.tipo_entidad === 'CLIENTE' ? values.cliente_id : undefined,
        proveedor_id: values.tipo_entidad === 'PROVEEDOR' ? values.proveedor_id : undefined,
        ruc_dni: values.ruc_dni,
        telefono: values.telefono,
        direccion: values.direccion,
        monto_total: values.monto_total, // Ahora se ingresa manualmente en el formulario
        tasa_interes: values.tasa_interes,
        tipo_interes: values.tipo_interes,
        dias_gracia: values.dias_gracia,
        garantia: values.garantia,
        observaciones: values.observaciones,
        vendedor: values.vendedor,
        almacen_id: almacen_id,
      };

      // Llamar a la API
      const response = await prestamoApi.create(requestData);

      if (response.error) {
        // Manejar errores de validación
        if (response.error.errors) {
          const errorMessages = Object.entries(response.error.errors)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n");
          message.error(`Error de validación:\n${errorMessages}`);
        } else {
          message.error(
            response.error.message || "Error al crear el préstamo"
          );
        }
        return;
      }

      // Éxito
      message.success(
        response.data?.message || "Préstamo creado exitosamente"
      );

      // Mostrar número de préstamo generado
      if (response.data?.data.numero) {
        message.info(`Número de préstamo: ${response.data.data.numero}`, 5);
      }

      // Limpiar formulario
      form.resetFields();

      // Redirigir a la lista de préstamos después de 2 segundos
      setTimeout(() => {
        router.push('/ui/facturacion-electronica/mis-prestamos');
      }, 2000);
    } catch (error) {
      console.error("Error al crear préstamo:", error);
      message.error("Error inesperado al crear el préstamo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormBase<FormCreatePrestamo>
      form={form}
      name="prestamo"
      className="flex gap-6 size-full"
      onFinish={handleSubmit}
      onFinishFailed={() => {
        message.error('Por favor completa todos los campos requeridos');
      }}
      disabled={loading}
    >
      <div className="flex-1 flex flex-col gap-6">
        <FormTablePrestamo form={form} />
        <FormCrearPrestamo form={form} />
      </div>
      <CardsInfoPrestamo form={form} />
    </FormBase>
  );
}
