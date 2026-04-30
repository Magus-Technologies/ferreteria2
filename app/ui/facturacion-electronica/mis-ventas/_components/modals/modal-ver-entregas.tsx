"use client";

import { Modal, Tag, Collapse } from "antd";
import {
  FaTruck,
  FaUserTie,
  FaWarehouse,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaCommentDots,
  FaFileInvoice,
  FaUser,
  FaPhone,
  FaBoxOpen,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import type { getVentaResponseProps } from "~/lib/api/venta";
import TitleForm from "~/components/form/title-form";
import { formatFechaPeru } from "~/utils/fechas";
import useGetEntregas from "../../_hooks/use-get-entregas";
import {
  TIPO_ENTREGA_LABEL_CON_ICON as TIPO_ENTREGA_LABEL,
  TIPO_DESPACHO_LABEL_CON_ICON as TIPO_DESPACHO_LABEL,
  ESTADO_ENTREGA_LABEL,
  ESTADO_ENTREGA_COLOR,
  QUIEN_ENTREGA_LABEL,
  TIPO_PEDIDO_LABEL,
} from "~/app/_lib/entrega-labels";

interface ModalVerEntregasProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  venta?: getVentaResponseProps;
}

// Construye el record de estado con icono — los iconos quedan locales porque
// usan componentes JSX. Label/color vienen del módulo central.
const ESTADO_LABEL: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pe: {
    label: ESTADO_ENTREGA_LABEL.pe,
    color: ESTADO_ENTREGA_COLOR.pe,
    icon: <FaClock className="text-orange-600" />,
  },
  ec: {
    label: ESTADO_ENTREGA_LABEL.ec,
    color: ESTADO_ENTREGA_COLOR.ec,
    icon: <FaTruck className="text-blue-600" />,
  },
  en: {
    label: ESTADO_ENTREGA_LABEL.en,
    color: ESTADO_ENTREGA_COLOR.en,
    icon: <FaCheckCircle className="text-green-600" />,
  },
  ca: {
    label: ESTADO_ENTREGA_LABEL.ca,
    color: ESTADO_ENTREGA_COLOR.ca,
    icon: <FaTimesCircle className="text-red-600" />,
  },
};

function EntregaDetalle({ entrega }: { entrega: any }) {
  const productos = entrega.productos_entregados || [];
  const totalEntregado = productos.reduce(
    (acc: number, p: any) => acc + Number(p.cantidad_entregada || 0),
    0,
  );

  return (
    <div className="space-y-4">
      {/* Tags de tipo */}
      <div className="flex items-center gap-2 flex-wrap">
        {entrega.tipo_entrega && (
          <Tag color="purple" className="!text-sm !py-1 !px-3">
            {TIPO_ENTREGA_LABEL[entrega.tipo_entrega] || entrega.tipo_entrega}
          </Tag>
        )}
        {entrega.tipo_despacho && (
          <Tag color="cyan" className="!text-sm !py-1 !px-3">
            {TIPO_DESPACHO_LABEL[entrega.tipo_despacho] || entrega.tipo_despacho}
          </Tag>
        )}
        {entrega.quien_entrega && (
          <Tag color="geekblue" className="!text-sm !py-1 !px-3">
            Entrega: {QUIEN_ENTREGA_LABEL[entrega.quien_entrega as keyof typeof QUIEN_ENTREGA_LABEL] || entrega.quien_entrega}
          </Tag>
        )}
        {entrega.tipo_pedido && (
          <Tag color="gold" className="!text-sm !py-1 !px-3">
            Pedido: {TIPO_PEDIDO_LABEL[entrega.tipo_pedido] || entrega.tipo_pedido}
          </Tag>
        )}
        {entrega.cargo_destino && (
          <Tag color="volcano" className="!text-sm !py-1 !px-3">
            Cargo: {entrega.cargo_destino}
          </Tag>
        )}
      </div>

      {/* Información de Entrega */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
        <div className="text-xs font-bold uppercase text-slate-500 tracking-wide mb-2">
          Información de Entrega
        </div>
        {entrega.direccion_entrega && (
          <div className="flex items-start gap-2 text-sm">
            <FaMapMarkerAlt className="text-slate-400 text-xs mt-0.5" />
            <div>
              <div className="text-slate-800">{entrega.direccion_entrega}</div>
              {entrega.referencia_entrega && (
                <div className="text-slate-500 text-xs">
                  Ref: {entrega.referencia_entrega}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <FaCalendarAlt className="text-slate-400 text-xs" />
          <span className="text-slate-700">
            Registrada: {formatFechaPeru(entrega.fecha_entrega, "DD/MM/YYYY hh:mm:ss A")}
          </span>
        </div>
        {entrega.fecha_programada && (
          <div className="flex items-center gap-2 text-sm">
            <FaCalendarAlt className="text-slate-400 text-xs" />
            <span className="text-slate-700">
              Programada: {formatFechaPeru(entrega.fecha_programada, "DD/MM/YYYY")}
            </span>
          </div>
        )}
        {(entrega.hora_inicio || entrega.hora_fin) && (
          <div className="flex items-center gap-2 text-sm">
            <FaClock className="text-slate-400 text-xs" />
            <span className="text-slate-700">
              {entrega.hora_inicio || "?"} — {entrega.hora_fin || "?"}
            </span>
          </div>
        )}
        {entrega.almacenSalida?.name && (
          <div className="flex items-center gap-2 text-sm">
            <FaWarehouse className="text-slate-400 text-xs" />
            <span className="text-slate-700">
              Almacén salida: {entrega.almacenSalida.name}
            </span>
          </div>
        )}
        {/* "Entregado por" = quien marcó la entrega como ENTREGADO
            (campo user_entregado, distinto de user que es el creador).
            Solo aparece si la entrega está completada. Si quedó PENDIENTE
            (caso EnTienda con quien_entrega=almacen esperando al cliente),
            mostrar el rol esperado pero sin nombre. */}
        {entrega.user_entregado?.name ? (
          <div className="flex items-center gap-2 text-sm">
            <FaUserTie className="text-slate-400 text-xs" />
            <span className="text-slate-700">
              Entregado por: <span className="font-semibold">{entrega.user_entregado.name}</span>
              {entrega.quien_entrega && (
                <span className="text-slate-500">
                  {' '}({QUIEN_ENTREGA_LABEL[entrega.quien_entrega as keyof typeof QUIEN_ENTREGA_LABEL] || entrega.quien_entrega})
                </span>
              )}
            </span>
          </div>
        ) : entrega.quien_entrega && entrega.estado_entrega !== 'en' && (
          <div className="flex items-center gap-2 text-sm">
            <FaUserTie className="text-slate-400 text-xs" />
            <span className="text-slate-500 italic">
              Pendiente de entregar — {QUIEN_ENTREGA_LABEL[entrega.quien_entrega as keyof typeof QUIEN_ENTREGA_LABEL] || entrega.quien_entrega}
            </span>
          </div>
        )}
        {entrega.despachador?.name && (
          <div className="flex items-center gap-2 text-sm">
            <FaUserTie className="text-slate-400 text-xs" />
            <span className="text-slate-700">
              Despachador: {entrega.despachador.name}
            </span>
          </div>
        )}
        {entrega.vehiculo?.name && (
          <div className="flex items-center gap-2 text-sm">
            <FaTruck className="text-slate-400 text-xs" />
            <span className="text-slate-700">
              Vehículo: {entrega.vehiculo.name}
              {entrega.vehiculo.placa ? ` (${entrega.vehiculo.placa})` : ""}
            </span>
          </div>
        )}
        {entrega.observaciones && (
          <div className="flex items-start gap-2 text-sm">
            <FaCommentDots className="text-slate-400 text-xs mt-0.5" />
            <span className="text-slate-700">{entrega.observaciones}</span>
          </div>
        )}
      </div>

      {/* Productos */}
      {productos.length > 0 ? (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-100 px-4 py-2 text-xs font-bold uppercase text-slate-600 tracking-wide flex items-center justify-between">
            <span>Productos en esta entrega</span>
            <span className="text-slate-500 font-normal normal-case">
              Pedido / Entregado / Pendiente venta
            </span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[260px] overflow-y-auto">
            {productos.map((p: any, i: number) => {
              const udv = p.unidad_derivada_venta;
              const prod =
                udv?.producto_almacen_venta?.producto_almacen?.producto;
              const nombre = prod?.name || "Producto";
              const codigo = prod?.cod_producto;
              const unidad = udv?.unidad_derivada_inmutable?.name || "";
              const cantidadEntregada = Number(p.cantidad_entregada || 0);
              const cantidadTotal = Number(udv?.cantidad || 0);
              const cantidadPendiente = Number(udv?.cantidad_pendiente || 0);
              return (
                <div
                  key={p.id || i}
                  className="px-4 py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-800 truncate">
                      {nombre}
                    </div>
                    {codigo && (
                      <div className="text-xs text-slate-500">{codigo}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs whitespace-nowrap">
                    <span className="text-slate-500">
                      {cantidadTotal} {unidad}
                    </span>
                    <span className="text-slate-300">/</span>
                    <span className="font-bold text-green-700">
                      {cantidadEntregada} {unidad}
                    </span>
                    <span className="text-slate-300">/</span>
                    <span
                      className={
                        cantidadPendiente > 0
                          ? "text-orange-600 font-semibold"
                          : "text-slate-400"
                      }
                    >
                      {cantidadPendiente} {unidad}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="bg-slate-50 px-4 py-2 text-xs text-slate-600 flex justify-end gap-2">
            <span>Total entregado en esta entrega:</span>
            <span className="font-bold text-green-700">
              {totalEntregado.toFixed(2)}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-400 italic text-center py-4">
          Sin productos registrados en esta entrega
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100">
        <span>
          Registrado por: <span className="font-medium text-slate-600">{entrega.user?.name || "—"}</span>
        </span>
        <span>
          {formatFechaPeru(entrega.created_at, "DD/MM/YYYY hh:mm:ss A")}
        </span>
      </div>
    </div>
  );
}

export default function ModalVerEntregas({
  open,
  setOpen,
  venta,
}: ModalVerEntregasProps) {
  const { response: entregas, loading } = useGetEntregas({
    filters: venta?.id ? { venta_id: venta.id } : undefined,
  });

  const cliente = venta?.cliente as any;
  const clienteNombre =
    cliente?.razon_social ||
    `${cliente?.nombres || ""} ${cliente?.apellidos || ""}`.trim() ||
    "SIN CLIENTE";

  const items = (entregas || []).map((entrega: any, idx: number) => {
    const estado = ESTADO_LABEL[entrega.estado_entrega] || {
      label: entrega.estado_entrega,
      color: "default",
      icon: null,
    };
    return {
      key: String(entrega.id || idx),
      label: (
        <div className="flex items-center justify-between gap-3 w-full pr-2">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-lg">{estado.icon}</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-800 truncate">
                Entrega #{idx + 1} —{" "}
                {TIPO_ENTREGA_LABEL[entrega.tipo_entrega]?.replace(/^[^\s]+\s/, "") ||
                  entrega.tipo_entrega}
              </div>
              <div className="text-xs text-slate-500">
                {entrega.fecha_programada
                  ? `Programada: ${formatFechaPeru(entrega.fecha_programada, "DD/MM/YYYY")}`
                  : `Registrada: ${formatFechaPeru(entrega.fecha_entrega, "DD/MM/YYYY hh:mm:ss A")}`}
              </div>
            </div>
          </div>
          <Tag color={estado.color} className="!text-xs !py-0.5 !px-2 !font-semibold">
            {estado.label}
          </Tag>
        </div>
      ),
      children: <EntregaDetalle entrega={entrega} />,
    };
  });

  return (
    <Modal
      title={
        <TitleForm className="!pb-0">
          HISTORIAL DE ENTREGAS
          {venta && (
            <div className="text-sm font-normal text-gray-600 mt-1">
              {venta.tipo_documento} N° {venta.serie}-{venta.numero}
            </div>
          )}
        </TitleForm>
      }
      open={open}
      onCancel={() => setOpen(false)}
      width={820}
      centered
      footer={null}
      destroyOnHidden
    >
      {/* Cliente */}
      {venta && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <FaUser className="text-amber-600 text-xs" />
            <span className="text-slate-800 font-semibold">{clienteNombre}</span>
            {cliente?.numero_documento && (
              <span className="text-slate-500 text-xs">
                — {cliente.numero_documento}
              </span>
            )}
          </div>
          {cliente?.telefono && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <FaPhone className="text-slate-400 text-xs" />
              <span>{cliente.telefono}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <FaFileInvoice className="text-slate-400 text-xs" />
            <span>
              Venta {venta.serie}-{venta.numero}
            </span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Cargando entregas...</p>
        </div>
      ) : !entregas || entregas.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FaBoxOpen size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No hay entregas registradas</p>
          <p className="text-xs mt-1">
            Esta venta aún no tiene entregas creadas
          </p>
        </div>
      ) : (
        <Collapse
          items={items}
          defaultActiveKey={items.length > 0 ? [items[0].key] : []}
          className="!bg-white"
        />
      )}
    </Modal>
  );
}
