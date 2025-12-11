"use client";

import { Modal, Tag, Timeline } from "antd";
import { getVentaResponseProps } from "~/app/_actions/venta";
import TitleForm from "~/components/form/title-form";
import dayjs from "dayjs";
import { FaTruck, FaStore, FaCheckCircle, FaClock, FaTimesCircle } from "react-icons/fa";
import useGetEntregas from "../../_hooks/use-get-entregas";

interface ModalVerEntregasProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  venta?: getVentaResponseProps;
}

export default function ModalVerEntregas({
  open,
  setOpen,
  venta,
}: ModalVerEntregasProps) {
  const { response: entregas, loading } = useGetEntregas({
    where: venta?.id ? { venta_id: venta.id } : undefined,
  });

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Entregado":
        return "success";
      case "Pendiente":
        return "warning";
      case "EnCamino":
        return "processing";
      case "Cancelado":
        return "error";
      default:
        return "default";
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case "Entregado":
        return <FaCheckCircle className="text-green-600" />;
      case "Pendiente":
        return <FaClock className="text-yellow-600" />;
      case "EnCamino":
        return <FaTruck className="text-blue-600" />;
      case "Cancelado":
        return <FaTimesCircle className="text-red-600" />;
      default:
        return null;
    }
  };

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
      width={800}
      centered
      footer={null}
    >
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600">Cargando entregas...</p>
        </div>
      ) : !entregas || entregas.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FaTruck size={48} className="mx-auto mb-3 opacity-30" />
          <p>No hay entregas registradas para esta venta</p>
        </div>
      ) : (
        <div className="space-y-4">
          <Timeline
            items={(entregas || []).map((entrega) => ({
              color: getEstadoColor(entrega.estado_entrega),
              dot: getEstadoIcon(entrega.estado_entrega),
              children: (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {entrega.tipo_despacho === "Domicilio" ? (
                          <FaTruck className="text-blue-600" />
                        ) : (
                          <FaStore className="text-green-600" />
                        )}
                        <span className="font-semibold">
                          {entrega.tipo_despacho === "Domicilio"
                            ? "Despacho a Domicilio"
                            : "Despacho en Tienda"}
                        </span>
                        <Tag color={getEstadoColor(entrega.estado_entrega)}>
                          {entrega.estado_entrega}
                        </Tag>
                      </div>
                      <div className="text-sm text-gray-600">
                        {dayjs(entrega.fecha_entrega).format(
                          "DD/MM/YYYY HH:mm"
                        )}
                      </div>
                    </div>
                  </div>

                  {entrega.tipo_despacho === "Domicilio" && (
                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      {entrega.chofer && (
                        <div>
                          <span className="font-medium">Chofer:</span>{" "}
                          {entrega.chofer.name}
                        </div>
                      )}
                      {entrega.fecha_programada && (
                        <div>
                          <span className="font-medium">Fecha programada:</span>{" "}
                          {dayjs(entrega.fecha_programada).format("DD/MM/YYYY")}
                        </div>
                      )}
                      {entrega.hora_inicio && (
                        <div>
                          <span className="font-medium">Horario:</span>{" "}
                          {entrega.hora_inicio} - {entrega.hora_fin}
                        </div>
                      )}
                      {entrega.direccion_entrega && (
                        <div className="col-span-2">
                          <span className="font-medium">Dirección:</span>{" "}
                          {entrega.direccion_entrega}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <div className="font-medium mb-2">Productos entregados:</div>
                    <div className="space-y-1">
                      {entrega.productos_entregados.map((detalle, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between text-sm bg-white p-2 rounded"
                        >
                          <span>
                            {detalle.unidad_derivada_venta.producto_almacen_venta
                              .producto_almacen.producto.name}
                          </span>
                          <span className="font-medium">
                            {Number(detalle.cantidad_entregada).toFixed(2)}{" "}
                            {detalle.unidad_derivada_venta.unidad_derivada_inmutable.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {entrega.observaciones && (
                    <div className="mt-3 text-sm">
                      <span className="font-medium">Observaciones:</span>{" "}
                      {entrega.observaciones}
                    </div>
                  )}

                  <div className="mt-3 text-xs text-gray-500">
                    Registrado por: {entrega.user.name}
                  </div>
                </div>
              ),
            }))}
          />
        </div>
      )}
    </Modal>
  );
}
