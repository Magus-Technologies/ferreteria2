"use client";

import { ICellRendererParams } from "ag-grid-community";
import { FaFilePdf } from "react-icons/fa6";
import ButtonBase from "~/components/buttons/button-base";
import { useStoreModalPdfVenta } from "../../_store/store-modal-pdf-venta";

export default function CellAccionesVenta(
  props: ICellRendererParams & { ventaId?: string }
) {
  const ventaId = props.ventaId || props.data?.id;
  const openModal = useStoreModalPdfVenta((state) => state.openModal);

  if (!ventaId) return null;

  const handleVerPDF = () => {
    openModal(ventaId);
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
        color="danger"
        size="md"
        onClick={handleVerPDF}
        className="flex items-center !px-3"
      >
        <FaFilePdf />
        
      </ButtonBase>
    </div>
  );
}
