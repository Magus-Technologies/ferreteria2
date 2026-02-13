"use client";

import { Modal, Button } from "antd";
import { FaFilePdf } from "react-icons/fa6";
import { AperturaYCierreCaja } from "~/lib/api/caja";
import TableBase from "~/components/tables/table-base";
import { ColDef } from "ag-grid-community";
import { useRef } from "react";
import { AgGridReact } from "ag-grid-react";

interface VendedorDistribucion {
  vendedor_id: string;
  vendedor: string;
  monto: string;
  conteo_billetes_monedas?: any;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(value);
};

export default function ModalVendedoresCierre({
  open,
  onClose,
  cierre,
  onVerTicketVendedor,
}: {
  open: boolean;
  onClose: () => void;
  cierre: AperturaYCierreCaja | null;
  onVerTicketVendedor: (vendedor: VendedorDistribucion) => void;
}) {
  const gridRef = useRef<AgGridReact<VendedorDistribucion>>(null);

  const columns: ColDef<VendedorDistribucion>[] = [
    {
      headerName: "Vendedor",
      field: "vendedor",
      flex: 1,
      minWidth: 200,
    },
    {
      headerName: "Monto Asignado",
      field: "monto",
      width: 150,
      cellRenderer: (params: any) => {
        const monto = typeof params.value === "string" 
          ? parseFloat(params.value) 
          : params.value;
        return (
          <div className="text-right font-semibold text-green-600">
            {formatCurrency(monto)}
          </div>
        );
      },
    },
    {
      headerName: "Acciones",
      field: "vendedor_id",
      width: 100,
      pinned: "right",
      cellRenderer: (params: any) => {
        return (
          <div className="flex gap-1 items-center justify-center">
            <Button
              type="link"
              size="small"
              className="flex items-center gap-1"
              onClick={() => onVerTicketVendedor(params.data)}
            >
              <FaFilePdf className="text-red-600 text-lg" />
            </Button>
          </div>
        );
      },
    },
  ];

  const vendedores = cierre?.distribuciones_vendedores || [];

  return (
    <Modal
      title={
        <div className="flex items-center justify-between pr-8">
          <span>Distribución de Vendedores - Cierre</span>
          {cierre && cierre.fecha_cierre && (
            <span className="text-sm font-normal text-slate-500">
              {new Date(cierre.fecha_cierre).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </span>
          )}
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Cerrar
        </Button>,
      ]}
      width={700}
    >
      {cierre && (
        <div className="space-y-4">
          {/* Información del cierre */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-slate-600">Caja Principal:</span>
                <div className="font-medium">
                  {cierre.caja_principal?.nombre}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-600">Usuario Responsable:</span>
                <div className="font-medium">{cierre.user?.name}</div>
              </div>
              <div>
                <span className="text-xs text-slate-600">Monto Cierre:</span>
                <div className="font-semibold text-blue-600">
                  {cierre.monto_cierre ? formatCurrency(
                    typeof cierre.monto_cierre === "string"
                      ? parseFloat(cierre.monto_cierre)
                      : cierre.monto_cierre
                  ) : '-'}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-600">Vendedores:</span>
                <div className="font-medium">{vendedores.length}</div>
              </div>
            </div>
          </div>

          {/* Tabla de vendedores */}
          <div>
            <div className="mb-2">
              <span className="text-sm font-semibold text-slate-700">
                Seleccione un vendedor para ver su ticket de cierre:
              </span>
            </div>
            <div className="h-[300px] w-full">
              <TableBase<VendedorDistribucion>
                ref={gridRef}
                rowData={vendedores}
                columnDefs={columns}
                rowSelection={false}
                withNumberColumn={true}
                headerColor="var(--color-amber-600)"
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
