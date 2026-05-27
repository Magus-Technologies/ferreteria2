"use client";

import { DescuentoTipo, EstadoDeVenta } from "~/lib/api/venta";
import { Form, FormInstance } from "antd";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { clienteApi } from "~/lib/api/cliente";
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
import { TipoDireccion } from "~/lib/api/cliente";
import {
  setDireccionesClienteToForm,
  getDireccionFromForm,
} from "~/lib/utils/cliente-direcciones-form";
import { useCheckAperturaDiaria } from "../../_hooks/use-check-apertura-diaria";
import { BankOutlined } from "@ant-design/icons";
import { QueryKeys } from "~/app/_lib/queryKeys";
import { useStoreProductoAgregadoVenta } from "../../_store/store-producto-agregado-venta";

// Modales pesados cargados bajo demanda
const ModalMetodosPagoVenta = dynamic(() => import("../modals/modal-metodos-pago-venta"), { ssr: false });
const ModalDetallesEntrega = dynamic(() => import("../modals/modal-detalles-entrega"), { ssr: false });
const ModalCreateCliente = dynamic(() => import("~/app/ui/facturacion-electronica/mis-ventas/_components/modals/modal-create-cliente"), { ssr: false });
const ModalTrasladoBoveda = dynamic(() => import("~/app/ui/facturacion-electronica/mis-aperturas-cierres/_components/modals/modal-traslado-boveda"), { ssr: false });

export default function CardsInfoVenta({ form, ventaId, onMissingApertura, submitting }: { form: FormInstance; ventaId?: string; onMissingApertura?: () => void; submitting?: boolean }) {
  const tipo_moneda = Form.useWatch("tipo_moneda", form);
  const forma_de_pago = Form.useWatch("forma_de_pago", form);
  const numero_dias = Form.useWatch("numero_dias", form);
  const tipo_documento = Form.useWatch("tipo_documento", form);
  const tipo_despacho = Form.useWatch("tipo_despacho", form) as
    | "EnTienda"
    | "Domicilio"
    | "Parcial"
    | "Omitir";
  const productos = Form.useWatch(
    "productos",
    form,
  ) as FormCreateVenta["productos"];
  const direccionSeleccionada = Form.useWatch("direccion_seleccionada", form);
  const clienteNombre = Form.useWatch("cliente_nombre", form);
  const clienteId = Form.useWatch("cliente_id", form);

  // Obtener la dirección seleccionada del cliente — antes construía
  // dinámicamente `_cliente_direccion_${i}`. Ahora delega al helper
  // centralizado que conoce el mapeo `TipoDireccion → fieldname`.
  const getDireccionCliente = () => {
    const tipo = (direccionSeleccionada as TipoDireccion) || TipoDireccion.D1;
    return (
      getDireccionFromForm(form, tipo) ||
      form.getFieldValue("direccion_entrega")
    );
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDetallesEntregaOpen, setModalDetallesEntregaOpen] =
    useState(false);
  const [modalEditarClienteOpen, setModalEditarClienteOpen] = useState(false);
  const [surchargeTotal, setSurchargeTotal] = useState(0);

  // Cargar el cliente completo desde la API cuando se va a editar.
  // Se re-fetchea cada vez que se abre el modal (staleTime: 0) para
  // garantizar datos frescos y no usar caché que podría estar desactualizado.
  const { data: clienteData } = useQuery({
    queryKey: ['cliente', clienteId, 'editar'],
    queryFn: () => clienteApi.getById(clienteId!),
    enabled: !!clienteId && modalEditarClienteOpen,
    staleTime: 0,
    gcTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
    select: (res) => res.data?.data,
  });

  const queryClient = useQueryClient();

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

  // Crédito requiere N° de días — sin días no se puede saber el vencimiento.
  const creditoSinDias = forma_de_pago === "cr" && !Number(numero_dias);

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
          // Para sub-productos de paquete, descuento es por unidad → multiplicar por cantidad.
          // Para productos normales, descuento es monto total fijo → sumar sin escalar.
          const isPaqueteProducto = item?._tipo_fila === 'paquete_producto';
          return acc + (isPaqueteProducto ? descuento * cantidad : descuento);
        }
      }, 0),
    [productosReales],
  );

  // Vales aplicables (solo se considera el descuento inmediato de MISMA_COMPRA)
  const valesAplicables = useStoreProductoAgregadoVenta((s) => s.valesAplicables);

  // Calcular descuento total de vales (solo DESCUENTO_MISMA_COMPRA)
  const baseSinVale = useMemo(() => subTotal - totalDescuento, [subTotal, totalDescuento]);
  const descuentoVale = useMemo(() => {
    if (!valesAplicables || valesAplicables.length === 0) return 0;
    return valesAplicables.reduce((acc, v) => {
      if (v.tipo_promocion !== 'DESCUENTO_MISMA_COMPRA') return acc;
      const valor = Number(v.descuento_valor ?? 0);
      if (!valor) return acc;
      if (v.descuento_tipo === 'PORCENTAJE') {
        return acc + (baseSinVale * valor) / 100;
      }
      if (v.descuento_tipo === 'MONTO_FIJO') {
        return acc + valor;
      }
      return acc;
    }, 0);
  }, [valesAplicables, baseSinVale]);

  // Calcular Total Cobrado (incluye surcharge de métodos de pago y resta descuento de vale)
  const totalCobrado = useMemo(
    () => subTotal - totalDescuento - descuentoVale + surchargeTotal,
    [subTotal, totalDescuento, descuentoVale, surchargeTotal],
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
              disabled={submitting || creditoSinDias}
              loading={submitting}
              color="success"
              className="flex items-center justify-center gap-4 !rounded-md w-full h-full max-h-16 text-balance"
              title={creditoSinDias ? 'Ingresa el N° de días para habilitar' : undefined}
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
        tipoDespacho={(!tipo_despacho || tipo_despacho === 'Omitir') ? 'EnTienda' : tipo_despacho}
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
        baseAmount={subTotal - totalDescuento}
        descuentoVale={descuentoVale}
        valesInfo={valesAplicables
          .filter(v => v.tipo_promocion === 'DESCUENTO_MISMA_COMPRA' && Number(v.descuento_valor ?? 0) > 0)
          .map(v => ({
            nombre: v.nombre,
            tipo: v.descuento_tipo,
            valor: Number(v.descuento_valor ?? 0),
          }))}
        onSurchargeChange={setSurchargeTotal}
        onContinuar={() => {
          setModalOpen(false);
          if (tipo_despacho === 'Omitir') {
            // Omitir entrega: no necesita configurar despacho, enviar directo
            form.submit();
          } else {
            setModalDetallesEntregaOpen(true);
          }
        }}
      />

      {/* Modal para editar cliente - Se abre encima del modal de detalles */}
      <ModalCreateCliente
        open={modalEditarClienteOpen}
        setOpen={setModalEditarClienteOpen}
        dataEdit={clienteData}
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

          // Actualizar direcciones en campos ocultos.
          setDireccionesClienteToForm(form, cliente);

          // Invalidar la caché del cliente para que la próxima vez que se
          // abra el modal de editar se carguen los datos más recientes.
          queryClient.invalidateQueries({ queryKey: ['cliente', clienteId, 'editar'] });
          queryClient.invalidateQueries({ queryKey: [QueryKeys.DIRECCIONES_CLIENTE, clienteId] });

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
