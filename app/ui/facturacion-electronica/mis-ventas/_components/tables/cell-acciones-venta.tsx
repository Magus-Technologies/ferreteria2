"use client";

import { ICellRendererParams } from "ag-grid-community";
import { FaFilePdf, FaTruck } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import ButtonBase from "~/components/buttons/button-base";
import { useStoreModalPdfVenta } from "../../_store/store-modal-pdf-venta";
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";

export default function CellAccionesVenta(
  props: ICellRendererParams & { ventaId?: string }
) {
  const ventaId = props.ventaId || props.data?.id;
  const venta = props.data;
  const router = useRouter();
  const openModal = useStoreModalPdfVenta((state) => state.openModal);

  if (!ventaId) return null;

  const handleVerPDF = () => {
    openModal(ventaId);
  };

  const handleCrearGuia = () => {
    // Navegar a crear guía con los datos de la venta
    router.push(`/ui/facturacion-electronica/mis-guias/crear-guia?venta_id=${ventaId}`);
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        justifyContent: "center",
        height: "100%",
        alignItems: "center",
      }}
    >
      <ConfigurableElement
        componentId="mis-ventas.boton-ver-pdf"
        label="Botón Ver PDF"
        noFullWidth
      >
        <ButtonBase
          color="danger"
          size="md"
          onClick={handleVerPDF}
          className="flex items-center !px-3"
          title="Ver PDF"
        >
          <FaFilePdf />
        </ButtonBase>
      </ConfigurableElement>

      <ConfigurableElement
        componentId="mis-ventas.boton-crear-guia"
        label="Botón Crear Guía"
        noFullWidth
      >
        <ButtonBase
          color="info"
          size="md"
          onClick={handleCrearGuia}
          className="flex items-center !px-3"
          title="Crear Guía de Remisión"
        >
          <FaTruck />
        </ButtonBase>
      </ConfigurableElement>
    </div>
  );
}
