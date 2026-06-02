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
import type { ValeCompra } from "~/lib/api/vales-compra";

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
    if (tipo_despacho === 'Omitir') {
      form.submit();
    } else {
      setModalDetallesEntregaOpen(true);
    }
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
  const valesExcluidos = useStoreProductoAgregadoVenta((s) => s.valesExcluidos);

  // Filtrar vales excluidos
  const valesActivos = useMemo(
    () => (valesAplicables || []).filter((v) => !valesExcluidos.includes(v.id)),
    [valesAplicables, valesExcluidos],
  );

  // Calcular descuento por vale (DESCUENTO misma/próxima compra, DOS_POR_UNO, PRODUCTO_GRATIS).
  // Espeja la lógica de ValeCompraService::aplicarValeAVenta para que el resumen
  // mostrado al usuario cuadre con lo que el backend persistirá al crear la venta.
  const baseSinVale = useMemo(() => subTotal - totalDescuento, [subTotal, totalDescuento]);
  const valesConDescuento = useMemo(() => {
    if (!valesActivos || valesActivos.length === 0) return [] as Array<{ vale: ValeCompra; monto: number; tipo: 'PORCENTAJE' | 'MONTO_FIJO' | null; valor: number }>;
    return valesActivos.map((v) => {
      if (v.tipo_promocion === 'DESCUENTO_MISMA_COMPRA' || v.tipo_promocion === 'DESCUENTO_PROXIMA_COMPRA') {
        const valor = Number(v.descuento_valor ?? 0);
        if (!valor) return { vale: v, monto: 0, tipo: v.descuento_tipo, valor };

        // El descuento se aplica sobre su DESTINO (recompensa, PASO 4), independiente
        // de la condición del PASO 3:
        //  - VENTA (o legacy null): toda la venta.
        //  - PRODUCTOS: subtotal de los productos en descuento_producto_ids.
        //  - CATEGORIAS: subtotal de los productos de descuento_categoria_ids.
        const alcance = v.descuento_alcance ?? 'VENTA';
        let baseScope = baseSinVale;
        if (alcance !== 'VENTA') {
          const prodIds = (v.descuento_producto_ids ?? []).map(Number);
          const catIds = (v.descuento_categoria_ids ?? []).map(Number);
          const lineas = productosReales.filter((p) => {
            if (alcance === 'PRODUCTOS') return p?.producto_id != null && prodIds.includes(Number(p.producto_id));
            return p?.categoria_id != null && catIds.includes(Number(p.categoria_id));
          });
          baseScope = lineas.reduce(
            (s, p) => s + Number(p?.precio_venta ?? 0) * Number(p?.cantidad ?? 0),
            0,
          );
        }

        if (v.descuento_tipo === 'PORCENTAJE') return { vale: v, monto: (baseScope * valor) / 100, tipo: v.descuento_tipo, valor };
        // Monto fijo: topado al subtotal del scope (no descuenta más de lo que califica).
        if (v.descuento_tipo === 'MONTO_FIJO') return { vale: v, monto: Math.min(valor, baseScope), tipo: v.descuento_tipo, valor };
        return { vale: v, monto: 0, tipo: v.descuento_tipo, valor };
      }

      if (v.tipo_promocion === 'DOS_POR_UNO') {
        const productoIdsVale = (v.productos ?? []).map((p) => p.id);
        if (productoIdsVale.length === 0) return { vale: v, monto: 0, tipo: null, valor: 0 };
        const lineasCoincidentes = productosReales.filter(
          (p) => p?.producto_id != null && productoIdsVale.includes(Number(p.producto_id)),
        );
        if (lineasCoincidentes.length === 0) return { vale: v, monto: 0, tipo: null, valor: 0 };
        const preciosValidos = lineasCoincidentes
          .map((p) => Number(p?.precio_venta ?? 0))
          .filter((n) => n > 0);
        if (preciosValidos.length === 0) return { vale: v, monto: 0, tipo: null, valor: 0 };
        const precioMin = Math.min(...preciosValidos);
        // Escalar: por cada `cantidad_minima` compradas, `cantidad_producto_gratis` gratis.
        // Ej.: 2x1 (mínimo 2, 1 gratis), compra 10 → grupos = floor(10/2)=5 → 5 gratis.
        const cantidadComprada = lineasCoincidentes.reduce((s, p) => s + Number(p?.cantidad ?? 0), 0);
        // Tamaño del grupo: campo propio del 2x1 (próxima compra) o cantidad_minima (legacy/misma).
        const tamGrupo = Number((v as any).dos_por_uno_cantidad_compra ?? v.cantidad_minima ?? 1) || 1;
        const gratisPorGrupo = Number(v.cantidad_producto_gratis ?? 1) || 1;
        // Respetar el límite de aplicaciones por venta (espeja ValeCompraService::calcularDescuentoBeneficio).
        // Ej.: max_vales_por_venta=2 con 2x1 y 10 unidades → solo 2 grupos → 2 gratis.
        let grupos = Math.floor(cantidadComprada / tamGrupo);
        if (v.max_vales_por_venta != null) {
          grupos = Math.min(grupos, Number(v.max_vales_por_venta));
        }
        const unidadesGratis = grupos * gratisPorGrupo;
        const monto = precioMin * unidadesGratis;
        return { vale: v, monto, tipo: null, valor: monto };
      }

      if (v.tipo_promocion === 'PRODUCTO_GRATIS') {
        const productoGratisId = v.producto_gratis_id ?? v.producto_gratis?.id ?? null;
        const cantidadGratis = Number(v.cantidad_producto_gratis ?? 1) || 1;
        let monto = 0;
        if (productoGratisId != null) {
          const linea = productosReales.find((p) => Number(p?.producto_id) === Number(productoGratisId));
          const precio = Number(linea?.precio_venta ?? 0);
          if (precio > 0) monto = precio * cantidadGratis;
        }
        if (monto === 0) {
          const fallback = Number(v.descuento_valor ?? 0);
          monto = fallback > 0 ? fallback : 0;
        }
        return { vale: v, monto, tipo: null, valor: monto };
      }

      return { vale: v, monto: 0, tipo: null, valor: 0 };
    });
  }, [valesActivos, baseSinVale, productosReales]);

  const descuentoVale = useMemo(
    () => valesConDescuento.reduce((acc, x) => acc + x.monto, 0),
    [valesConDescuento],
  );

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

        {descuentoVale > 0 && (
          <ConfigurableElement
            componentId="crear-venta.card-descuento-vale"
            label="Card Dscto Promoción"
          >
            <CardInfoVenta
              title="Dscto Promoción"
              value={descuentoVale}
              moneda={tipo_moneda}
              className="border-fuchsia-500 border-2"
            />
          </ConfigurableElement>
        )}

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
        valesInfo={valesConDescuento
          .filter(x => x.monto > 0)
          .map(x => ({
            nombre: x.vale.nombre,
            tipo: x.tipo,
            valor: x.valor,
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
