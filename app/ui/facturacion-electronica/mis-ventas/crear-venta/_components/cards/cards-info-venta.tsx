"use client";

import { DescuentoTipo, EstadoDeVenta } from "~/lib/api/venta";
import { Form, FormInstance } from "antd";
import { useMemo, useState } from "react";
import ButtonBase from "~/components/buttons/button-base";
import { FormCreateVenta } from "../others/body-vender";
import CardInfoVenta from "./card-info-venta";
import { FaMoneyBillWave } from "react-icons/fa";
import ModalMetodosPagoVenta from "../modals/modal-metodos-pago-venta";
import InputBase from "~/app/_components/form/inputs/input-base";
import { MdSell } from "react-icons/md";
import { FaPause } from "react-icons/fa6";
import ModalDetallesEntrega from "../modals/modal-detalles-entrega";
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";
import ModalCreateCliente from "~/app/ui/facturacion-electronica/mis-ventas/_components/modals/modal-create-cliente";
import type { Cliente } from "~/lib/api/cliente";

export default function CardsInfoVenta({ form }: { form: FormInstance }) {
  const tipo_moneda = Form.useWatch("tipo_moneda", form);
  const forma_de_pago = Form.useWatch("forma_de_pago", form);
  const tipo_documento = Form.useWatch("tipo_documento", form);
  const tipo_despacho = Form.useWatch("tipo_despacho", form) as
    | "EnTienda"
    | "Domicilio"
    | "Parcial";
  const productos = Form.useWatch(
    "productos",
    form,
  ) as FormCreateVenta["productos"];
  const direccionSeleccionada = Form.useWatch("direccion_seleccionada", form);
  const clienteNombre = Form.useWatch("cliente_nombre", form);
  const clienteId = Form.useWatch("cliente_id", form);

  // Obtener la dirección seleccionada del cliente
  const getDireccionCliente = () => {
    const direccionKey =
      `_cliente_direccion_${direccionSeleccionada?.replace("D", "")}` as keyof FormCreateVenta;
    return (
      form.getFieldValue(direccionKey) ||
      form.getFieldValue("direccion_entrega")
    );
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDetallesEntregaOpen, setModalDetallesEntregaOpen] =
    useState(false);
  const [modalEditarClienteOpen, setModalEditarClienteOpen] = useState(false);

  // Calcular SubTotal (suma de productos sin descuento)
  const subTotal = useMemo(
    () =>
      (productos || []).reduce(
        (acc, item) =>
          acc +
          (Number(item?.precio_venta ?? 0) + Number(item?.recargo ?? 0)) *
            Number(item?.cantidad ?? 0),
        0,
      ),
    [productos],
  );

  // Calcular Total Recargo
  const totalRecargo = useMemo(
    () =>
      (productos || []).reduce(
        (acc, item) =>
          acc + Number(item?.recargo ?? 0) * Number(item?.cantidad ?? 0),
        0,
      ),
    [productos],
  );

  // Calcular Total Descuento
  const totalDescuento = useMemo(
    () =>
      (productos || []).reduce((acc, item) => {
        const descuento_tipo = item?.descuento_tipo ?? DescuentoTipo.MONTO;
        const descuento = Number(item?.descuento ?? 0);
        const precio_venta = Number(item?.precio_venta ?? 0);
        const recargo = Number(item?.recargo ?? 0);
        const cantidad = Number(item?.cantidad ?? 0);

        if (descuento_tipo === DescuentoTipo.PORCENTAJE) {
          return acc + ((precio_venta + recargo) * descuento * cantidad) / 100;
        } else {
          return acc + descuento;
        }
      }, 0),
    [productos],
  );

  // Calcular Total Cobrado
  const totalCobrado = useMemo(
    () => subTotal - totalDescuento,
    [subTotal, totalDescuento],
  );

  // Total Comisión
  const totalComision = useMemo(
    () =>
      (productos || []).reduce((acc, item) => {
        const comision = Number(item?.comision ?? 0);
        const cantidad = Number(item?.cantidad ?? 0);
        const descuento = Number(item?.descuento ?? 0);
        const descuento_tipo = item?.descuento_tipo ?? DescuentoTipo.MONTO;
        const precio_venta = Number(item?.precio_venta ?? 0);
        const recargo = Number(item?.recargo ?? 0);

        const total_comision_bruta = comision * cantidad;

        let descuento_monto = 0;
        if (descuento_tipo === DescuentoTipo.PORCENTAJE) {
          descuento_monto =
            ((precio_venta + recargo) * descuento * cantidad) / 100;
        } else {
          descuento_monto = descuento;
        }

        const comision_final = Math.max(
          0,
          total_comision_bruta - descuento_monto,
        );

        return acc + comision_final;
      }, 0),
    [productos],
  );

  return (
    <>
      {/* Campo oculto para métodos de pago */}
      <InputBase
        propsForm={{
          name: "metodos_de_pago",
          hidden: true,
        }}
        hidden
      />

      <div className="flex flex-col gap-4 max-w-64">
        <ConfigurableElement
          componentId="crear-venta.card-subtotal"
          label="Card SubTotal"
        >
          <CardInfoVenta
            title="SubTotal"
            value={subTotal}
            moneda={tipo_moneda}
          />
        </ConfigurableElement>

        <ConfigurableElement
          componentId="crear-venta.card-recargo"
          label="Card Total Recargo"
        >
          <CardInfoVenta
            title="Total Recargo"
            value={totalRecargo}
            moneda={tipo_moneda}
          />
        </ConfigurableElement>

        <ConfigurableElement
          componentId="crear-venta.card-descuento"
          label="Card Total Descuento"
        >
          <CardInfoVenta
            title="Total Dscto"
            value={totalDescuento}
            moneda={tipo_moneda}
          />
        </ConfigurableElement>

        <ConfigurableElement
          componentId="crear-venta.card-total-cobrado"
          label="Card Total Cobrado"
        >
          <CardInfoVenta
            title="Total Cobrado"
            value={totalCobrado}
            moneda={tipo_moneda}
            className="border-rose-500 border-2"
          />
        </ConfigurableElement>

        <ConfigurableElement
          componentId="crear-venta.card-comision"
          label="Card Total Comisión"
        >
          <CardInfoVenta
            title="Total Comisión"
            value={totalComision}
            moneda={tipo_moneda}
          />
        </ConfigurableElement>

        <ConfigurableElement
          componentId="crear-venta.boton-cobrar"
          label="Botón Cobrar"
        >
          <ButtonBase
            onClick={() => setModalOpen(true)}
            disabled={forma_de_pago === "cr"}
            color="info"
            className="flex items-center justify-center gap-4 !rounded-md w-full h-full max-h-16 text-balance"
          >
            <FaMoneyBillWave className="min-w-fit" size={30} />
            Cobrar
          </ButtonBase>
        </ConfigurableElement>

        {/* Botón para crear venta a crédito */}
        {forma_de_pago === "cr" && (
          <ConfigurableElement
            componentId="crear-venta.boton-venta-credito"
            label="Botón Crear Venta a Crédito"
          >
            <ButtonBase
              onClick={() => {
                form.setFieldValue("estado_de_venta", EstadoDeVenta.CREADO);
                setModalDetallesEntregaOpen(true);
              }}
              color="success"
              className="flex items-center justify-center gap-4 !rounded-md w-full h-full max-h-16 text-balance"
            >
              <MdSell className="min-w-fit" size={30} />
              Crear Venta a Crédito
            </ButtonBase>
          </ConfigurableElement>
        )}

        {/* {(compra?._count?.recepciones_almacen ?? 0) > 0 ||
              (compra?._count?.pagos_de_compras ?? 0) > 0 ||
              compra?.estado_de_compra === EstadoDeCompra.Creado ? null : ( */}
        <ConfigurableElement
          componentId="crear-venta.boton-espera"
          label="Botón Poner en Espera"
        >
          <ButtonBase
            onClick={() => {
              form.setFieldValue("estado_de_venta", EstadoDeVenta.EN_ESPERA);
              form.submit();
            }}
            color="warning"
            className="flex items-center justify-center gap-4 !rounded-md w-full h-full max-h-16 text-balance"
          >
            <InputBase
              propsForm={{
                name: "estado_de_venta",
                hidden: true,
              }}
              hidden
            />
            <FaPause className="min-w-fit" size={30} /> Poner en Espera
          </ButtonBase>
        </ConfigurableElement>
      </div>

      {/* Modal para configurar detalles de entrega */}
      <ModalDetallesEntrega
        open={modalDetallesEntregaOpen}
        setOpen={setModalDetallesEntregaOpen}
        form={form}
        tipoDespacho={tipo_despacho || "EnTienda"}
        onConfirmar={() => {
          // El tipo de despacho ya está guardado en el formulario
          console.log("Entrega configurada");
        }}
        onEditarCliente={() => {
          // Abrir el modal de editar cliente encima del modal de detalles
          setModalEditarClienteOpen(true);
        }}
        direccion={getDireccionCliente()}
        clienteNombre={clienteNombre}
        clienteId={clienteId}
      />

      <ModalMetodosPagoVenta
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        form={form}
        totalCobrado={totalCobrado}
        tipo_moneda={tipo_moneda}
        tipo_documento={tipo_documento}
        onContinuar={() => {
          // Al dar continuar, abrir el modal de detalles de entrega
          setModalOpen(false);
          setModalDetallesEntregaOpen(true);
        }}
      />

      {/* Modal para editar cliente - Se abre encima del modal de detalles */}
      <ModalCreateCliente
        open={modalEditarClienteOpen}
        setOpen={setModalEditarClienteOpen}
        dataEdit={
          clienteId ? {
            id: clienteId,
            tipo_cliente: form.getFieldValue("tipo_cliente") || "PERSONA",
            numero_documento: form.getFieldValue("numero_documento"),
            razon_social: form.getFieldValue("razon_social") || null,
            nombres: form.getFieldValue("nombres") || "",
            apellidos: form.getFieldValue("apellidos") || "",
            telefono: form.getFieldValue("telefono") || null,
            celular: null,
            horario_atencion: null,
            fecha_nacimiento: null,
            puntos: 0,
            centimos: 0,
            contacto_referencia: null,
            email: form.getFieldValue("email") || null,
            estado: true,
          } as Cliente : undefined
        }
        onSuccess={(cliente) => {
          // Recargar las direcciones del cliente desde la API
          // TODO: Implementar recarga de direcciones desde la tabla direcciones_cliente
          setModalEditarClienteOpen(false);
        }}
      />
    </>
  );
}
