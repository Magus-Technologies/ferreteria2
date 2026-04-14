"use client";

import { DescuentoTipo, EstadoDeVenta } from "~/lib/api/venta";
import { Form, FormInstance } from "antd";
import { useMemo, useState } from "react";
import useApp from "antd/es/app/useApp";
import ButtonBase from "~/components/buttons/button-base";
import { FormCreateVenta } from "../others/body-vender";
import CardInfoVenta from "./card-info-venta";
import { FaMoneyBillWave } from "react-icons/fa";
import dynamic from "next/dynamic";
import InputBase from "~/app/_components/form/inputs/input-base";
import { MdSell } from "react-icons/md";
import { FaPause } from "react-icons/fa6";
import ButtonRecuperarVentaEnEspera from "../buttons/button-recuperar-venta-en-espera";
import ButtonRecuperarVentaAnulada from "../buttons/button-recuperar-venta-anulada";
import ButtonCargarCotizacion from "../buttons/button-cargar-cotizacion";
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";
import type { Cliente } from "~/lib/api/cliente";
import { useCheckAperturaDiaria } from "../../_hooks/use-check-apertura-diaria";
import { BankOutlined } from "@ant-design/icons";

// Modales pesados cargados bajo demanda
const ModalMetodosPagoVenta = dynamic(() => import("../modals/modal-metodos-pago-venta"), { ssr: false });
const ModalDetallesEntrega = dynamic(() => import("../modals/modal-detalles-entrega"), { ssr: false });
const ModalCreateCliente = dynamic(() => import("~/app/ui/facturacion-electronica/mis-ventas/_components/modals/modal-create-cliente"), { ssr: false });
const ModalTrasladoBoveda = dynamic(() => import("~/app/ui/facturacion-electronica/mis-aperturas-cierres/_components/modals/modal-traslado-boveda"), { ssr: false });

export default function CardsInfoVenta({ form, ventaId, onMissingApertura, submitting }: { form: FormInstance; ventaId?: string; onMissingApertura?: () => void; submitting?: boolean }) {
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

  const { cajaActiva } = useCheckAperturaDiaria();
  const [modalTrasladoBovedaOpen, setModalTrasladoBovedaOpen] = useState(false);
  const { message } = useApp();

  const requiereCliente = tipo_despacho === "Domicilio" || tipo_despacho === "Parcial";

  const handleCobrarClick = () => {
    if (requiereCliente && !clienteId) {
      message.warning("Por favor seleccione un cliente para despacho a domicilio");
      return;
    }
    setModalOpen(true);
  };

  const handleCreditoClick = () => {
    if (requiereCliente && !clienteId) {
      message.warning("Por favor seleccione un cliente para despacho a domicilio");
      return;
    }
    form.setFieldValue("estado_de_venta", EstadoDeVenta.CREADO);
    setModalDetallesEntregaOpen(true);
  };

  // Filtrar cabeceras de paquete para cálculos (son resumen, no productos reales)
  const productosReales = useMemo(
    () => (productos || []).filter(p => p?._tipo_fila !== 'paquete_cabecera' && p?._tipo_fila !== 'vale_promocional'),
    [productos],
  );

  // Calcular SubTotal (suma de productos sin descuento)
  const subTotal = useMemo(
    () =>
      productosReales.reduce(
        (acc, item) =>
          acc +
          (Number(item?.precio_venta ?? 0) + Number(item?.recargo ?? 0)) *
            Number(item?.cantidad ?? 0),
        0,
      ),
    [productosReales],
  );

  // Calcular Total Recargo
  const totalRecargo = useMemo(
    () =>
      productosReales.reduce(
        (acc, item) =>
          acc + Number(item?.recargo ?? 0) * Number(item?.cantidad ?? 0),
        0,
      ),
    [productosReales],
  );

  // Calcular Total Descuento
  const totalDescuento = useMemo(
    () =>
      productosReales.reduce((acc, item) => {
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
    [productosReales],
  );

  // Calcular Total Cobrado
  const totalCobrado = useMemo(
    () => subTotal - totalDescuento,
    [subTotal, totalDescuento],
  );

  // Total Comisión
  const totalComision = useMemo(
    () =>
      productosReales.reduce((acc, item) => {
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
    [productosReales],
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

      <div className="flex flex-col gap-3 xl:gap-4 xl:max-w-64">
        <ConfigurableElement
          componentId="crear-venta.boton-recuperar-espera"
          label="Botón Recuperar Venta en Espera"
        >
          <ButtonRecuperarVentaEnEspera />
        </ConfigurableElement>

        <ConfigurableElement
          componentId="crear-venta.boton-recuperar-anulada"
          label="Botón Recuperar Venta Anulada"
        >
          <ButtonRecuperarVentaAnulada />
        </ConfigurableElement>

        <ConfigurableElement
          componentId="crear-venta.boton-cargar-cotizacion"
          label="Botón Cargar Cotización"
        >
          <ButtonCargarCotizacion />
        </ConfigurableElement>

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
            onClick={handleCobrarClick}
            disabled={forma_de_pago === "cr" || submitting}
            loading={submitting}
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
              onClick={handleCreditoClick}
              disabled={submitting}
              loading={submitting}
              color="success"
              className="flex items-center justify-center gap-4 !rounded-md w-full h-full max-h-16 text-balance"
            >
              <MdSell className="min-w-fit" size={30} />
              {ventaId ? 'Editar Venta a Crédito' : 'Crear Venta a Crédito'}
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
            disabled={submitting}
            loading={submitting}
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

        <ConfigurableElement
          componentId="crear-venta.boton-traslado-boveda"
          label="Botón Traslado a Bóveda"
        >
          <ButtonBase
            onClick={() => setModalTrasladoBovedaOpen(true)}
            color="default"
            className="flex items-center justify-center gap-4 !rounded-md w-full h-full max-h-16 text-balance"
          >
            <BankOutlined className="min-w-fit text-xl" />
            Traslado a Bóveda
          </ButtonBase>
        </ConfigurableElement>

      </div>

      {/* Modal para configurar detalles de entrega */}
      <ModalDetallesEntrega
        open={modalDetallesEntregaOpen}
        setOpen={setModalDetallesEntregaOpen}
        form={form}
        ventaId={ventaId}
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
          // Cerrar modal de pago y abrir modal de detalles de entrega para todos los tipos
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
            fecha_nacimiento: form.getFieldValue("fecha_nacimiento") || null,
            puntos: 0,
            centimos: 0,
            contacto_referencia: null,
            email: form.getFieldValue("email") || null,
            estado: true,
          } as Cliente : undefined
        }
        onSuccess={(cliente) => {
          // Actualizar los datos del cliente en el formulario de venta
          const nombreCompleto = cliente.razon_social
            ? cliente.razon_social
            : `${cliente.nombres || ""} ${cliente.apellidos || ""}`.trim();
          
          form.setFieldValue("cliente_nombre", nombreCompleto);
          form.setFieldValue("ruc_dni", cliente.numero_documento);
          form.setFieldValue("telefono", cliente.telefono || "");
          form.setFieldValue("email", cliente.email || "");
          form.setFieldValue("fecha_nacimiento", cliente.fecha_nacimiento || null);

          // Actualizar direcciones en campos ocultos
          const direcciones = cliente.direcciones || [];
          form.setFieldValue("_cliente_direccion_1", direcciones.find(d => d.tipo === 'D1')?.direccion || '');
          form.setFieldValue("_cliente_direccion_2", direcciones.find(d => d.tipo === 'D2')?.direccion || '');
          form.setFieldValue("_cliente_direccion_3", direcciones.find(d => d.tipo === 'D3')?.direccion || '');
          form.setFieldValue("_cliente_direccion_4", direcciones.find(d => d.tipo === 'D4')?.direccion || '');

          setModalEditarClienteOpen(false);
        }}
      />

      {cajaActiva && (
        <ModalTrasladoBoveda
          open={modalTrasladoBovedaOpen}
          onCancel={() => setModalTrasladoBovedaOpen(false)}
          onSuccess={() => setModalTrasladoBovedaOpen(false)}
          aperturaCierreId={String(cajaActiva.id)}
          vendedorId={String(cajaActiva.user_id)}
        />
      )}
    </>
  );
}
