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
import ModalDocPrestamo, {
  PrestamoResponse,
} from "~/app/ui/facturacion-electronica/mis-prestamos/_components/modals/modal-doc-prestamo";

export default function BodyCrearPrestamo() {
  const [form] = Form.useForm<FormCreatePrestamo>();
  const [loading, setLoading] = useState(false);
  const { almacen_id } = useStoreAlmacen();
  const router = useRouter();
  const [openDoc, setOpenDoc] = useState(false);
  const [prestamoData, setPrestamoData] = useState<PrestamoResponse>();

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
    if (values.tipo_entidad === "CLIENTE" && !values.cliente_id) {
      message.error("Debe seleccionar un cliente para esta operación");
      return;
    }

    if (values.tipo_entidad === "PROVEEDOR" && !values.proveedor_id) {
      message.error("Debe seleccionar un proveedor para esta operación");
      return;
    }

    setLoading(true);

    try {
      // Transformar datos del formulario al formato del backend
      const requestData: CreatePrestamoRequest = {
        productos: values.productos.map((p) => ({
          producto_id: p.producto_id,
          unidad_derivada_id: p.unidad_derivada_id,
          unidad_derivada_factor: p.unidad_derivada_factor,
          cantidad: p.cantidad,
          // costo no se envía (opcional)
        })),
        fecha: values.fecha.format("YYYY-MM-DD HH:mm:ss"),
        fecha_vencimiento: values.fecha_vencimiento.format(
          "YYYY-MM-DD HH:mm:ss"
        ),
        tipo_operacion: values.tipo_operacion,
        tipo_entidad: values.tipo_entidad,
        tipo_moneda: values.tipo_moneda,
        tipo_de_cambio: values.tipo_de_cambio,
        cliente_id:
          values.tipo_entidad === "CLIENTE" ? values.cliente_id : undefined,
        proveedor_id:
          values.tipo_entidad === "PROVEEDOR" ? values.proveedor_id : undefined,
        ruc_dni: values.ruc_dni,
        telefono: values.telefono,
        direccion: values.direccion,
        // monto_total no se envía (se calcula automáticamente en el backend)
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
          message.error(response.error.message || "Error al crear el préstamo");
        }
        return;
      }

      // Éxito
      message.success(response.data?.message || "Préstamo creado exitosamente");

      // Abrir modal con el documento PDF
      if (response.data?.data) {
        setPrestamoData(response.data.data);
        setOpenDoc(true);
      }

      // Limpiar formulario
      form.resetFields();
    } catch (error) {
      console.error("Error al crear préstamo:", error);
      message.error("Error inesperado al crear el préstamo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ModalDocPrestamo
        open={openDoc}
        setOpen={setOpenDoc}
        data={prestamoData}
      />
      <FormBase<FormCreatePrestamo>
        form={form}
        name="prestamo"
        className='flex flex-col xl:flex-row gap-4 xl:gap-6 w-full h-full'
        onFinish={handleSubmit}
        onFinishFailed={() => {
          message.error("Por favor completa todos los campos requeridos");
        }}
        disabled={loading}
      >
        <div className="flex-1 flex flex-col gap-4 xl:gap-6 min-w-0 min-h-0">
          <div className="flex-1 min-h-0">
            <FormTablePrestamo form={form} />
          </div>
          <FormCrearPrestamo form={form} />
        </div>
        <div className="w-full xl:w-auto">
          <CardsInfoPrestamo form={form} />
        </div>
      </FormBase>
    </>
  );
}
