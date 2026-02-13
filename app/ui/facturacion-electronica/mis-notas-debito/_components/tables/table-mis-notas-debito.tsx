"use client";

import { AgGridReact } from "ag-grid-react";
import { useMemo, useRef, useState } from "react";
import { ColDef } from "ag-grid-community";
import { useStoreFiltrosMisNotasDebito } from "../../_store/store-filtros-mis-notas-debito";
import useGetNotasDebito from "../../_hooks/use-get-notas-debito";
import { Tag, message } from "antd";
import dayjs from "dayjs";
import ButtonBase from "~/components/buttons/button-base";
import { FaFilePdf, FaPaperPlane, FaCheckCircle } from "react-icons/fa";
import { useStoreModalPdfNotaDebito } from "../../_store/store-modal-pdf-nota-debito";
import { facturacionElectronicaApi } from "~/lib/api/facturacion-electronica";
import TableBase from "~/components/tables/table-base";

export default function TableMisNotasDebito() {
  const gridRef = useRef<AgGridReact>(null);
  const filtros = useStoreFiltrosMisNotasDebito((state) => state.filtros);
  const { response, isLoading, refetch } = useGetNotasDebito({ where: filtros });
  const [enviandoId, setEnviandoId] = useState<string | null>(null);

  const handleEnviarSunat = async (id: string) => {
    try {
      console.log('=== DEBUG: Enviando a SUNAT ===');
      console.log('ID recibido:', id);
      console.log('Tipo de ID:', typeof id);
      console.log('ID es válido:', id && id !== 'undefined' && id !== 'null');
      
      setEnviandoId(id);
      const result = await facturacionElectronicaApi.enviarNotaDebitoSunat(id);

      if (result.error) {
        message.error(result.error.message || "Error al enviar a SUNAT");
      } else {
        message.success("Nota de débito enviada a SUNAT exitosamente");
        refetch();
      }
    } catch (error) {
      console.error('Error al enviar:', error);
      message.error("Error al enviar a SUNAT");
    } finally {
      setEnviandoId(null);
    }
  };

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Serie-Número",
        field: "numero_completo",
        width: 150,
        valueGetter: (params) => params.data.numero_completo || `${params.data.serie}-${params.data.numero}`,
      },
      {
        headerName: "Fecha Emisión",
        field: "fecha",
        width: 130,
        valueFormatter: (params) =>
          params.value ? dayjs(params.value).format("DD/MM/YYYY") : "",
      },
      {
        headerName: "Factura Afectada",
        field: "referencia_documento",
        width: 150,
        valueGetter: (params) => params.data.referencia_documento ||
          (params.data.venta ? `${params.data.venta.serie}-${params.data.venta.numero}` : ""),
      },
      {
        headerName: "Motivo",
        field: "motivo.descripcion",
        flex: 1,
        minWidth: 200,
        valueGetter: (params) => params.data.motivo?.descripcion || params.data.descripcion || "",
      },
      {
        headerName: "Total",
        field: "monto_total",
        width: 120,
        valueFormatter: (params) =>
          params.value ? `S/ ${Number(params.value).toFixed(2)}` : "S/ 0.00",
        cellStyle: { textAlign: "right", fontWeight: "600" },
      },
      {
        headerName: "Estado SUNAT",
        field: "estado",
        width: 140,
        cellRenderer: (params: any) => {
          const estado = params.value;
          let color = "default";
          let texto = estado;

          if (estado === "aceptado" || estado === "enviado") {
            color = "success";
            texto = "Aceptado";
          } else if (estado === "borrador" || estado === "pendiente") {
            color = "warning";
            texto = "Pendiente";
          } else if (estado === "rechazado") {
            color = "error";
            texto = "Rechazado";
          }

          return <Tag color={color}>{texto}</Tag>;
        },
      },
      {
        headerName: "Acciones",
        width: 300,
        cellRenderer: (params: any) => {
          const isEnviando = enviandoId === params.data.id;
          const puedeEnviar = params.data.puede_enviarse;
          const tieneXml = params.data.comprobante_electronico?.tiene_xml;
          const tieneCdr = params.data.comprobante_electronico?.tiene_cdr;
          const estadoSunat = params.data.comprobante_electronico?.estado_sunat;

          return (
            <div className="flex gap-2 items-center h-full">
              {/* Ver XML */}
              <ButtonBase
                size="sm"
                color="info"
                onClick={async () => {
                  try {
                    // Llamar al endpoint para obtener el XML
                    const token = localStorage.getItem('auth_token');
                    const response = await fetch(
                      `http://localhost:8000/api/facturacion-electronica/notas-debito/${params.data.id}/xml`,
                      {
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Accept': 'application/xml',
                        },
                      }
                    );

                    if (!response.ok) {
                      message.error('XML no disponible');
                      return;
                    }

                    const xmlText = await response.text();
                    const blob = new Blob([xmlText], { type: 'application/xml' });
                    const blobUrl = URL.createObjectURL(blob);

                    const newWindow = window.open(blobUrl, '_blank');

                    if (newWindow) {
                      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                    } else {
                      message.error('No se pudo abrir la ventana');
                      URL.revokeObjectURL(blobUrl);
                    }
                  } catch (error) {
                    message.error('Error al obtener XML');
                  }
                }}
                title="Ver XML en nueva pestaña"
                disabled={!tieneXml}
              >
                XML
              </ButtonBase>

              {/* Enviar a SUNAT o Ver CDR */}
              {puedeEnviar ? (
                <ButtonBase
                  size="sm"
                  color="success"
                  className="flex items-center gap-1"
                  onClick={() => handleEnviarSunat(params.data.id)}
                  disabled={isEnviando}
                  title="Enviar a SUNAT"
                >
                  <FaPaperPlane />
                  {isEnviando ? "..." : "Enviar"}
                </ButtonBase>
              ) : tieneCdr ? (
                <ButtonBase
                  size="sm"
                  color="success"
                  className="flex items-center gap-1"
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('auth_token');
                      const response = await fetch(
                        `http://localhost:8000/api/facturacion-electronica/notas-debito/${params.data.id}/cdr`,
                        {
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/zip',
                          },
                        }
                      );

                      if (!response.ok) {
                        message.error('CDR no disponible');
                        return;
                      }

                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `R-${params.data.serie}-${params.data.numero}.zip`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                      message.success('CDR descargado correctamente');
                    } catch (error) {
                      message.error('Error al descargar CDR');
                    }
                  }}
                  title={`Estado SUNAT: ${estadoSunat || 'Desconocido'}`}
                >
                  <FaCheckCircle />
                  CDR
                </ButtonBase>
              ) : null}

              {/* PDF */}
              <ButtonBase
                size="sm"
                color="danger"
                className="flex items-center gap-1"
                onClick={() => {
                  const openModal = useStoreModalPdfNotaDebito.getState().openModal;
                  openModal(params.data.id.toString());
                }}
                title="Ver PDF"
              >
                <FaFilePdf />
                PDF
              </ButtonBase>
            </div>
          );
        },
      },
    ],
    [enviandoId]
  );

  return (
    <div style={{ height: 500, width: "100%" }}>
      <TableBase
        ref={gridRef}
        rowData={response}
        columnDefs={columnDefs}
        loading={isLoading}
        pagination={true}
        paginationPageSize={20}
        tableKey="mis-notas-debito"
        persistColumnState={true}
      />
    </div>
  );
}
