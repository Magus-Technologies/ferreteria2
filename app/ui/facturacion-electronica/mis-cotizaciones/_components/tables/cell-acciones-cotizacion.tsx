"use client";

import { ICellRendererParams } from "ag-grid-community";
import { FaFilePdf, FaFileInvoice } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import ButtonBase from "~/components/buttons/button-base";
import { useStoreModalPdfCotizacion } from "../../_store/store-modal-pdf-cotizacion";

export default function CellAccionesCotizacion(
  props: ICellRendererParams & { cotizacionId?: string }
) {
  const cotizacionId = props.cotizacionId || props.data?.id;
  const estadoCotizacion = props.data?.estado_cotizacion;
  const openModal = useStoreModalPdfCotizacion((state) => state.openModal);
  const router = useRouter();

  if (!cotizacionId) return null;

  const handleVerPDF = () => {
    openModal(cotizacionId);
  };

  const handleConvertirAVenta = () => {
    // Redirigir a crear venta con el ID de la cotización
    router.push(`/ui/facturacion-electronica/mis-ventas/crear-venta?cotizacion=${cotizacionId}`);
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
      <ButtonBase
        color="success"
        size="md"
        onClick={handleConvertirAVenta}
        className="flex items-center !px-3"
        title="Convertir a Venta"
        disabled={estadoCotizacion === 'co' || estadoCotizacion === 've' || estadoCotizacion === 'ca'}
      >
        <FaFileInvoice />
      </ButtonBase>
      
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
