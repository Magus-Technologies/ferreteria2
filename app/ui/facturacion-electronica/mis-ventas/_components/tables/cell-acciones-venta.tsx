"use client";

import { ICellRendererParams } from "ag-grid-community";
import { FaFilePdf } from "react-icons/fa6";
import ButtonBase from "~/components/buttons/button-base";

export default function CellAccionesVenta(
  props: ICellRendererParams & { ventaId?: string }
) {
  const ventaId = props.ventaId || props.data?.id;

  if (!ventaId) return null;

  const handleVerPDF = () => {
    window.open(`/api/pdf/venta/${ventaId}`, "_blank");
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
        size="sm"
        onClick={handleVerPDF}
        className="flex items-center gap-1"
      >
        <FaFilePdf />
        PDF
      </ButtonBase>
    </div>
  );
}
