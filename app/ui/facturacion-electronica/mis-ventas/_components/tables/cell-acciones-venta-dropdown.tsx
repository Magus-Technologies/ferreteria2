"use client";

import { ICellRendererParams } from "ag-grid-community";
import { FaFilePdf, FaTruck, FaFileCode, FaPaperPlane, FaDownload, FaEdit, FaHistory } from "react-icons/fa";
import { MoreOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { Dropdown, message } from "antd";
import type { MenuProps } from "antd";
import { useState, useMemo } from "react";
import ButtonBase from "~/components/buttons/button-base";
import { useStoreModalPdfVenta } from "../../_store/store-modal-pdf-venta";
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";
import { facturacionElectronicaApi } from "~/lib/api/facturacion-electronica";
import ModalHistorialVenta from "../modals/modal-historial-venta";

export default function CellAccionesVentaDropdown(
  props: ICellRendererParams & { ventaId?: string }
) {
  const ventaId = props.ventaId || props.data?.id;
  const venta = props.data;
  const router = useRouter();
  const openModal = useStoreModalPdfVenta((state) => state.openModal);
  const [loading, setLoading] = useState(false);
  const [historialOpen, setHistorialOpen] = useState(false);

  if (!ventaId) return null;

  // Usar useMemo para recalcular cuando props.data cambie
  const comprobanteInfo = useMemo(() => {
    const comprobanteElectronico = venta?.comprobante_electronico;
    const estadoSunat = comprobanteElectronico?.estado_sunat;
    const tieneXml = comprobanteElectronico?.tiene_xml || false;
    const tieneCdr = comprobanteElectronico?.tiene_cdr || false;
    const isAceptado = estadoSunat === "ACEPTADO" || estadoSunat === "ACEPTADO_CON_OBSERVACIONES";
    
    return {
      comprobanteElectronico,
      estadoSunat,
      tieneXml,
      tieneCdr,
      isAceptado
    };
  }, [venta?.comprobante_electronico]);

  const { comprobanteElectronico, estadoSunat, tieneXml, tieneCdr, isAceptado } = comprobanteInfo;

  // Determinar label de edición según tipo de documento
  const tipoDocumento = venta?.tipo_documento;
  const editLabel = tipoDocumento === '01' ? 'Editar Factura'
    : tipoDocumento === '03' ? 'Editar Boleta'
    : tipoDocumento === 'nv' ? 'Editar Nota de Venta'
    : 'Editar Venta';

  // Verificar si se puede editar (no anulado ni procesado)
  const estadoVenta = venta?.estado_de_venta;
  const canEdit = estadoVenta !== 'an' && estadoVenta !== 'pr';

  const handleEditar = () => {
    router.push(`/ui/facturacion-electronica/mis-ventas/editar-venta/${ventaId}`);
  };

  const handleVerPDF = () => {
    openModal(ventaId);
  };

  const handleCrearGuia = () => {
    router.push(`/ui/facturacion-electronica/mis-guias/crear-guia?venta_id=${ventaId}`);
  };

  const handleEnviarSunat = async () => {
    try {
      setLoading(true);
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
        
        // Esperar un momento para que el backend guarde el CDR
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Obtener los datos actualizados de la venta
        const ventaApi = await import('~/lib/api/venta');
        const ventaActualizada = await ventaApi.ventaApi.getById(ventaId);
        
        if (ventaActualizada.data?.data && props.node) {
          // Actualizar el nodo con los datos nuevos
          props.node.setData(ventaActualizada.data.data);
          
          // Forzar actualización de la fila en AG Grid
          props.api?.refreshCells({
            rowNodes: [props.node],
            force: true
          });
        }
      }
    } catch (error: any) {
      message.error({ 
        content: error?.message || "Error al enviar a SUNAT", 
        key: 'enviar-sunat',
        duration: 5
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerXML = () => {
    if (!comprobanteElectronico?.xml_firmado && !tieneXml) {
      message.error('XML no disponible para este comprobante');
      return;
    }
    
    // Si el XML está en los datos, abrirlo en nueva pestaña
    if (comprobanteElectronico?.xml_firmado) {
      const xmlText = comprobanteElectronico.xml_firmado;
      const blob = new Blob([xmlText], { type: 'application/xml' });
      const blobUrl = URL.createObjectURL(blob);
      
      const newWindow = window.open(blobUrl, '_blank');
      
      if (newWindow) {
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      } else {
        message.error('No se pudo abrir la ventana. Verifica que los popups no estén bloqueados.');
        URL.revokeObjectURL(blobUrl);
      }
    }
  };

  const handleDescargarCDR = async () => {
    try {
      message.loading({ content: 'Descargando CDR...', key: 'download-cdr', duration: 0 });
      
      const token = localStorage.getItem('auth_token');
      const timestamp = new Date().getTime();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/facturacion-electronica/facturas/${ventaId}/cdr?t=${timestamp}`,
        {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al descargar el CDR');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `R-${comprobanteElectronico?.serie}-${String(comprobanteElectronico?.correlativo).padStart(8, '0')}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      message.success({ content: 'CDR descargado exitosamente', key: 'download-cdr', duration: 2 });
    } catch (error: any) {
      message.error({ content: error?.message || 'Error al descargar el CDR', key: 'download-cdr', duration: 3 });
    }
  };

  // Construir el menú del dropdown
  const menuItems: MenuProps['items'] = [
    {
      key: 'editar',
      label: <span className="flex items-center gap-2"><FaEdit className="text-amber-600" /> {editLabel}</span>,
      onClick: handleEditar,
      disabled: !canEdit,
    },
    {
      key: 'historial',
      label: <span className="flex items-center gap-2"><FaHistory className="text-slate-600" /> Historial</span>,
      onClick: () => setHistorialOpen(true),
    },
    {
      key: 'pdf',
      label: <span className="flex items-center gap-2"><FaFilePdf className="text-red-600" /> Ver PDF</span>,
      onClick: handleVerPDF,
    },
    {
      key: 'guia',
      label: <span className="flex items-center gap-2"><FaTruck className="text-blue-600" /> Crear Guía</span>,
      onClick: handleCrearGuia,
    },
    {
      type: 'divider',
    },
    {
      key: 'ver-xml',
      label: <span className="flex items-center gap-2"><FaFileCode className="text-green-600" /> Ver XML</span>,
      onClick: handleVerXML,
      disabled: !tieneXml,
    },
    {
      key: 'enviar-sunat',
      label: <span className="flex items-center gap-2"><FaPaperPlane className="text-purple-600" /> Enviar a SUNAT</span>,
      onClick: handleEnviarSunat,
      disabled: loading || !tieneXml || isAceptado,
    },
    {
      key: 'descargar-cdr',
      label: <span className="flex items-center gap-2"><FaDownload className="text-orange-600" /> Descargar CDR</span>,
      onClick: handleDescargarCDR,
      disabled: !tieneCdr,
    },
  ];

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
        componentId="mis-ventas.dropdown-acciones"
        label="Dropdown Acciones"
        noFullWidth
      >
        <Dropdown
          menu={{ items: menuItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <ButtonBase
            color="info"
            size="md"
            className="flex items-center justify-center !px-2"
            title="Acciones"
            disabled={loading}
          >
            <MoreOutlined style={{ fontSize: '18px' }} />
          </ButtonBase>
        </Dropdown>
      </ConfigurableElement>

      <ModalHistorialVenta
        open={historialOpen}
        onClose={() => setHistorialOpen(false)}
        ventaId={ventaId}
        ventaSerie={venta?.serie}
        ventaNumero={venta?.numero}
      />
    </div>
  );
}
