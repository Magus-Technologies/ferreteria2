"use client";

import { ICellRendererParams } from "ag-grid-community";
import { FaFilePdf, FaFileInvoice, FaPencil, FaCopy, FaTrash, FaTruck } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { message, Popconfirm } from "antd";
import { useQueryClient } from "@tanstack/react-query";
import ButtonBase from "~/components/buttons/button-base";
import { useStoreModalPdfCotizacion } from "../../_store/store-modal-pdf-cotizacion";
import { cotizacionesApi } from "~/lib/api/cotizaciones";
import { QueryKeys } from "~/app/_lib/queryKeys";

export default function CellAccionesCotizacion(
  props: ICellRendererParams & { cotizacionId?: string }
) {
  const cotizacionId = props.cotizacionId || props.data?.id;
  const estadoCotizacion = props.data?.estado_cotizacion;
  const openModal = useStoreModalPdfCotizacion((state) => state.openModal);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [eliminando, setEliminando] = useState(false);
  const yaEliminada = estadoCotizacion === 'el';

  if (!cotizacionId) return null;

  const bloqueada = estadoCotizacion === 'co' || estadoCotizacion === 've' || estadoCotizacion === 'el';

  const handleVerPDF = () => openModal(cotizacionId);

  const handleConvertirAVenta = () => {
    router.push(`/ui/facturacion-electronica/mis-ventas/crear-venta?cotizacion=${cotizacionId}`);
  };

  const handleEditar = () => {
    router.push(`/ui/facturacion-electronica/mis-cotizaciones/editar-cotizacion/${cotizacionId}`);
  };

  const handleEliminar = async () => {
    setEliminando(true);
    try {
      const res = await cotizacionesApi.eliminar(cotizacionId);
      if (res.error) {
        message.error(res.error.message || "Error al eliminar");
        return;
      }
      message.success("Cotización eliminada");
      queryClient.invalidateQueries({ queryKey: [QueryKeys.COTIZACIONES] });
    } finally {
      setEliminando(false);
    }
  };

  // Verificar si todas las unidades de la cotización ya fueron guiadas
  // (requiere que el backend exponga cantidad_guiada en UnidadDerivadaInmutableCotizacion)
  const todoGuiadoCotizacion = (props.data?.productos_por_almacen ?? props.data?.productosPorAlmacen ?? []).length > 0 &&
    (props.data?.productos_por_almacen ?? props.data?.productosPorAlmacen ?? []).every((pa: any) =>
      (pa?.unidades_derivadas ?? []).every(
        (u: any) => Number(u?.cantidad_guiada ?? 0) >= Number(u?.cantidad ?? 0),
      ),
    )

  const handleCrearGuia = () => {
    router.push(`/ui/facturacion-electronica/mis-guias/crear-guia?cotizacion_id=${cotizacionId}&motivo_codigo=03`)
  };

  const handleDuplicar = () => {
    router.push(`/ui/facturacion-electronica/mis-cotizaciones/crear-cotizacion?duplicar=${cotizacionId}`);
  };

  return (
    <div style={{ display: "flex", gap: "8px", justifyContent: "center", height: "100%", alignItems: "center" }}>
      <ButtonBase
        color="info"
        size="md"
        onClick={handleEditar}
        className="flex items-center !px-3"
        title="Editar Cotización"
        disabled={bloqueada}
      >
        <FaPencil />
      </ButtonBase>

      <ButtonBase
        color="success"
        size="md"
        onClick={handleConvertirAVenta}
        className="flex items-center !px-3"
        title="Convertir a Venta"
        disabled={bloqueada}
      >
        <FaFileInvoice />
      </ButtonBase>

      <ButtonBase
        color="info"
        size="md"
        onClick={handleCrearGuia}
        className="flex items-center !px-3"
        title="Crear Guía de Remisión"
        disabled={estadoCotizacion === 've' || estadoCotizacion === 'ca' || estadoCotizacion === 'el' || todoGuiadoCotizacion}
      >
        <FaTruck />
      </ButtonBase>

      <ButtonBase
        color="warning"
        size="md"
        onClick={handleDuplicar}
        className="flex items-center !px-3"
        title="Duplicar Cotización"
      >
        <FaCopy />
      </ButtonBase>

      <Popconfirm
        title="¿Eliminar cotización?"
        description="Se marcará como eliminada pero seguirá visible."
        onConfirm={handleEliminar}
        okText="Eliminar"
        cancelText="Cancelar"
        disabled={bloqueada}
      >
        <ButtonBase
          color="danger"
          size="md"
          className="flex items-center !px-3"
          title="Eliminar Cotización"
          loading={eliminando}
          disabled={bloqueada}
        >
          <FaTrash />
        </ButtonBase>
      </Popconfirm>

      <ButtonBase
        color="danger"
        size="md"
        onClick={handleVerPDF}
        className="flex items-center !px-3"
        title="Ver PDF"
      >
        <FaFilePdf />
      </ButtonBase>
    </div>
  );
}
