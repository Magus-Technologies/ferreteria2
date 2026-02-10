"use client";

import { AgGridReact } from "ag-grid-react";
import { useMemo, useRef, useState } from "react";
import { ColDef } from "ag-grid-community";
import { useStoreFiltrosMisFacturas } from "../../_store/store-filtros-mis-facturas";
import useGetFacturas from "../../_hooks/use-get-facturas";
import { Tag, message } from "antd";
import dayjs from "dayjs";
import { FaFilePdf } from "react-icons/fa";
import ButtonBase from "~/components/buttons/button-base";
import TableBase from "~/components/tables/table-base";
import { facturacionElectronicaApi } from "~/lib/api/facturacion-electronica";

export default function TableMisFacturas() {
  const gridRef = useRef<AgGridReact>(null);
  const filtros = useStoreFiltrosMisFacturas((state) => state.filtros);
  const { response, isLoading, refetch } = useGetFacturas({ where: filtros });
  const [enviandoId, setEnviandoId] = useState<string | null>(null);

  const handleEnviarSunat = async (ventaId: string) => {
    try {
      setEnviandoId(ventaId);
      message.loading({ content: 'Enviando a SUNAT...', key: 'enviar-sunat', duration: 0 });
      
      const result = await facturacionElectronicaApi.enviarFacturaSunat(ventaId);
      
      if (result.error) {
        message.error({ 
          content: result.error.message || "Error al enviar a SUNAT", 
          key: 'enviar-sunat',
          duration: 5
        });
      } else {
        message.success({ 
          content: "Comprobante enviado a SUNAT exitosamente", 
          key: 'enviar-sunat',
          duration: 3
        });
        refetch();
      }
    } catch (error: any) {
      message.error({ 
        content: error?.message || "Error al enviar a SUNAT", 
        key: 'enviar-sunat',
        duration: 5
      });
    } finally {
      setEnviandoId(null);
    }
  };

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Serie-Número",
        field: "serie",
        width: 150,
        valueGetter: (params) => `${params.data.serie}-${String(params.data.correlativo).padStart(8, '0')}`,
      },
      {
        headerName: "Fecha Emisión",
        field: "fecha_emision",
        width: 130,
        valueFormatter: (params) =>
          params.value ? dayjs(params.value).format("DD/MM/YYYY") : "",
      },
      {
        headerName: "Cliente",
        field: "cliente_razon_social",
        flex: 1,
        minWidth: 200,
      },
      {
        headerName: "RUC/DNI",
        field: "cliente_numero_documento",
        width: 120,
      },
      {
        headerName: "Total",
        field: "importe_total",
        width: 120,
        valueFormatter: (params) => {
          const moneda = params.data?.moneda === 'USD' ? '$' : 'S/';
          return params.value ? `${moneda} ${Number(params.value).toFixed(2)}` : `${moneda} 0.00`;
        },
        cellStyle: { textAlign: "right", fontWeight: "600" },
      },
      {
        headerName: "Estado SUNAT",
        field: "estado_sunat",
        width: 140,
        cellRenderer: (params: any) => {
          const estado = params.value;
          let color = "default";
          if (estado === "ACEPTADO" || estado === "ACEPTADO_CON_OBSERVACIONES") color = "success";
          else if (estado === "PENDIENTE") color = "warning";
          else if (estado === "RECHAZADO") color = "error";
          return <Tag color={color}>{estado}</Tag>;
        },
      },
      {
        headerName: "Acciones",
        width: 400,
        cellRenderer: (params: any) => {
          const isAceptado = params.data.estado_sunat === "ACEPTADO" || 
                            params.data.estado_sunat === "ACEPTADO_CON_OBSERVACIONES";
          const isPendiente = params.data.estado_sunat === "PENDIENTE";
          const ventaId = params.data.venta_id;
          const isEnviando = enviandoId === ventaId;
          const hasVentaId = ventaId && ventaId !== null && ventaId !== 'null';
          
          return (
            <div className="flex gap-2 items-center h-full">
              {/* Ver XML */}
              <ButtonBase
                size="sm"
                color="info"
                onClick={() => {
                  // Si el XML está en los datos, abrirlo en nueva pestaña
                  if (params.data.xml_firmado) {
                    const xmlText = params.data.xml_firmado;
                    const blob = new Blob([xmlText], { type: 'application/xml' });
                    const blobUrl = URL.createObjectURL(blob);
                    
                    // Abrir en nueva pestaña
                    const newWindow = window.open(blobUrl, '_blank');
                    
                    // Limpiar el URL después de que se abra
                    if (newWindow) {
                      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                    } else {
                      message.error('No se pudo abrir la ventana. Verifica que los popups no estén bloqueados.');
                      URL.revokeObjectURL(blobUrl);
                    }
                    return;
                  }
                  
                  message.error('XML no disponible para este comprobante');
                }}
                title="Ver XML en nueva pestaña"
                disabled={!params.data.xml_firmado}
              >
                XML
              </ButtonBase>

              {/* Descargar CDR - solo si está aceptado */}
              {isAceptado && hasVentaId && (
                <ButtonBase
                  size="sm"
                  color="success"
                  onClick={async () => {
                    try {
                      message.loading({ content: 'Descargando CDR...', key: 'download-cdr', duration: 0 });
                      
                      // Obtener el token de autenticación
                      const token = localStorage.getItem('auth_token');
                      
                      // Agregar timestamp para evitar caché del navegador
                      const timestamp = new Date().getTime();
                      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/facturacion-electronica/facturas/${ventaId}/cdr?t=${timestamp}`, {
                        credentials: 'include',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                        },
                      });
                      
                      if (!response.ok) {
                        throw new Error('Error al descargar el CDR');
                      }
                      
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      // Cambiar extensión a .zip porque el CDR es un archivo ZIP
                      a.download = `R-${params.data.serie}-${String(params.data.correlativo).padStart(8, '0')}.zip`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                      
                      message.success({ content: 'CDR descargado exitosamente', key: 'download-cdr', duration: 2 });
                    } catch (error: any) {
                      message.error({ content: error?.message || 'Error al descargar el CDR', key: 'download-cdr', duration: 3 });
                    }
                  }}
                  title="Descargar CDR (Constancia de Recepción)"
                >
                  CDR
                </ButtonBase>
              )}

              {/* Enviar a SUNAT - solo si está pendiente */}
              {isPendiente && hasVentaId && (
                <ButtonBase
                  size="sm"
                  color="warning"
                  onClick={() => handleEnviarSunat(ventaId)}
                  title="Enviar a SUNAT"
                  disabled={isEnviando}
                  className="flex items-center gap-1"
                >
                  {isEnviando ? "Enviando..." : "Enviar SUNAT"}
                </ButtonBase>
              )}

              {/* Nota Crédito - solo si está aceptado */}
              {isAceptado && hasVentaId && (
                <ButtonBase
                  size="sm"
                  color="success"
                  onClick={() => {
                  // TODO: Implementar creación de nota de crédito
                  }}
                  title="Crear Nota de Crédito"
                  disabled
                >
                  N. Crédito
                </ButtonBase>
              )}

              {/* Nota Débito - solo si está aceptado */}
              {isAceptado && hasVentaId && (
                <ButtonBase
                  size="sm"
                  color="danger"
                  onClick={() => {
                    // TODO: Implementar creación de nota de débito
                  }}
                  title="Crear Nota de Débito"
                  disabled
                >
                  N. Débito
                </ButtonBase>
              )}

              {/* PDF */}
              <ButtonBase 
                size="sm" 
                color="danger" 
                className="flex items-center gap-1"
                onClick={() => {
                  if (!hasVentaId) {
                    message.error('No se encontró la venta asociada');
                    return;
                  }
                  // TODO: Implementar descarga de PDF
                  console.log('Descargar PDF:', params.data.id);
                }}
                title="Descargar PDF"
                disabled={!hasVentaId}
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
    <>
      <div style={{ height: 500, width: "100%" }}>
        <TableBase
          ref={gridRef}
          rowData={response}
          columnDefs={columnDefs}
          loading={isLoading}
          pagination={true}
          paginationPageSize={20}
          tableKey="mis-facturas"
          persistColumnState={true}
        />
      </div>
    </>
  );
}
