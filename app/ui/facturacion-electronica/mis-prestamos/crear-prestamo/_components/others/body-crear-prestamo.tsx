"use client";

import { Form, message } from "antd";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import FormBase from "~/components/form/form-base";
import FormTablePrestamo from "../form/form-table-prestamo";
import FormCrearPrestamo from "../form/form-crear-prestamo";
import CardsInfoPrestamo from "../cards/cards-info-prestamo";
import { prestamoApi, TipoMoneda, TipoOperacion, TipoEntidad, type CreatePrestamoRequest } from "~/lib/api/prestamo";
import { useStoreAlmacen } from "~/store/store-almacen";
import { useStoreProductoAgregadoPrestamo } from "../../_store/store-producto-agregado-prestamo";
import { useStoreProveedorSeleccionado } from "~/app/ui/gestion-comercial-e-inventario/mis-proveedores/store/store-proveedor-seleccionado";
import { useStoreClienteSeleccionado } from "~/app/ui/facturacion-electronica/mis-ventas/store/store-cliente-seleccionado";
import type { FormCreatePrestamo } from "../../_types/prestamo.types";
import ModalDocPrestamo from "~/app/ui/facturacion-electronica/mis-prestamos/_components/modals/modal-doc-prestamo";

export default function BodyCrearPrestamo() {
  const [form] = Form.useForm<FormCreatePrestamo>();
  const [loading, setLoading] = useState(false);
  const { almacen_id } = useStoreAlmacen();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prestamoIdEdit = searchParams.get("id");
  const isEdit = !!prestamoIdEdit;
  const [openDoc, setOpenDoc] = useState(false);
  const [prestamoId, setPrestamoId] = useState<string>();

  const setTipoOperacion = useStoreProductoAgregadoPrestamo((s) => s.setTipoOperacion);
  const setTipoEntidad = useStoreProductoAgregadoPrestamo((s) => s.setTipoEntidad);
  const setTipoMoneda = useStoreProductoAgregadoPrestamo((s) => s.setTipoMoneda);
  const setProductosPrefill = useStoreProductoAgregadoPrestamo((s) => s.setProductosPrefill);
  const setProveedorSearchText = useStoreProveedorSeleccionado((s) => s.setSearchText);
  const setClienteSearchText = useStoreClienteSeleccionado((s) => s.setSearchText);

  // Precargar datos del préstamo en modo edición
  useEffect(() => {
    if (!prestamoIdEdit) return;
    (async () => {
      const res = await prestamoApi.getById(prestamoIdEdit);
      const p = res.data?.data;
      if (res.error || !p) {
        message.error(res.error?.message || "No se pudo cargar el préstamo");
        return;
      }

      setTipoOperacion(p.tipo_operacion);
      setTipoEntidad(p.tipo_entidad);
      setTipoMoneda(p.tipo_moneda ?? TipoMoneda.SOLES);

      // El backend serializa relaciones en snake_case; se deja fallback camelCase
      const pAny = p as any;
      const papList =
        pAny.productos_por_almacen ?? pAny.productosPorAlmacen ?? [];
      const productos = papList.map((pap: any) => {
        const u = (pap.unidades_derivadas ?? pap.unidadesDerivadas)?.[0];
        const prodAlmacen = pap.producto_almacen ?? pap.productoAlmacen;
        const prod = prodAlmacen?.producto;
        return {
          producto_id: prod?.id as number,
          producto_name: prod?.name ?? "",
          producto_codigo: prod?.cod_producto ?? "",
          marca_name: prod?.marca?.name ?? "",
          unidad_derivada_id: u?.unidad_derivada_id as number,
          unidad_derivada_name: u?.name ?? "",
          unidad_derivada_factor: Number(u?.factor ?? 1),
          cantidad: Number(u?.cantidad ?? 0),
        };
      });

      form.setFieldsValue({
        numero: p.numero,
        fecha: p.fecha ? dayjs(p.fecha) : dayjs(),
        fecha_vencimiento: p.fecha_vencimiento
          ? dayjs(p.fecha_vencimiento)
          : dayjs(),
        tipo_operacion: p.tipo_operacion,
        tipo_entidad: p.tipo_entidad,
        tipo_moneda: p.tipo_moneda ?? TipoMoneda.SOLES,
        tipo_de_cambio: p.tipo_de_cambio ?? 1,
        cliente_id: p.cliente_id,
        proveedor_id: p.proveedor_id,
        ruc_dni: p.ruc_dni,
        telefono: p.telefono,
        direccion: p.direccion,
        tasa_interes: p.tasa_interes,
        tipo_interes: p.tipo_interes,
        dias_gracia: p.dias_gracia,
        garantia: p.garantia,
        observaciones: p.observaciones,
        vendedor: p.vendedor,
      });

      // Proveedor/Cliente: setear nombre visible y el texto de búsqueda del
      // documento para que el select auto-seleccione (rellena id/razón social)
      const prov = pAny.proveedor;
      const cli = pAny.cliente;
      if (p.tipo_entidad === "PROVEEDOR" && prov) {
        form.setFieldValue("proveedor_nombre" as any, prov.razon_social ?? "");
        if (prov.ruc) setProveedorSearchText(String(prov.ruc));
      } else if (p.tipo_entidad === "CLIENTE" && cli) {
        const nombreCli =
          cli.razon_social ||
          `${cli.nombres ?? ""} ${cli.apellidos ?? ""}`.trim();
        form.setFieldValue("cliente_nombre" as any, nombreCli);
        if (cli.numero_documento)
          setClienteSearchText(String(cli.numero_documento));
      }

      // Los productos se cargan vía add() en la tabla (Form.List)
      setProductosPrefill(productos);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prestamoIdEdit]);

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
          unidad_derivada_name: p.unidad_derivada_name,
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
        tipo_moneda: values.tipo_moneda ?? TipoMoneda.SOLES,
        tipo_de_cambio: values.tipo_de_cambio ?? 1,
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

      // Llamar a la API (crear o actualizar según el modo)
      const response = isEdit
        ? await prestamoApi.update(prestamoIdEdit as string, requestData)
        : await prestamoApi.create(requestData);

      if (response.error) {
        // Manejar errores de validación
        if (response.error.errors) {
          const errorMessages = Object.entries(response.error.errors)
            .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
            .join("\n");
          message.error(`Error de validación:\n${errorMessages}`);
        } else {
          message.error(
            response.error.message ||
              (isEdit
                ? "Error al actualizar el préstamo"
                : "Error al crear el préstamo")
          );
        }
        return;
      }

      // Éxito
      message.success(
        response.data?.message ||
          (isEdit
            ? "Préstamo actualizado exitosamente"
            : "Préstamo creado exitosamente")
      );

      if (isEdit) {
        // Limpiar formulario y stores antes de navegar
        form.resetFields();
        setTipoOperacion(TipoOperacion.PRESTAR);
        setTipoEntidad(TipoEntidad.CLIENTE);
        setTipoMoneda(TipoMoneda.SOLES);
        setProductosPrefill([]);
        setProveedorSearchText('');
        setClienteSearchText('');
        router.push("/ui/facturacion-electronica/mis-prestamos/crear-prestamo");
        return;
      }

      // Abrir modal con el documento PDF (solo al crear)
      if (response.data?.data?.id) {
        setPrestamoId(String(response.data.data.id));
        setOpenDoc(true);
      }

      // Limpiar formulario
      form.resetFields();
    } catch (error) {
      console.error("Error al guardar préstamo:", error);
      message.error(
        isEdit
          ? "Error inesperado al actualizar el préstamo"
          : "Error inesperado al crear el préstamo"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ModalDocPrestamo
        open={openDoc}
        setOpen={setOpenDoc}
        prestamoId={prestamoId}
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
          <FormCrearPrestamo form={form} isEdit={isEdit} />
        </div>
        <div className="w-full xl:w-auto">
          <CardsInfoPrestamo form={form} isEdit={isEdit} />
        </div>
      </FormBase>
    </>
  );
}
