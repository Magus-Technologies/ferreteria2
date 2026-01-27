"use client";

import { App } from "antd";
import { PlusCircle } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { prestamoVendedorApi } from "~/lib/api/prestamo-vendedor";
import ModalAprobarSolicitudEfectivo from "~/app/ui/facturacion-electronica/gestion-cajas/_components/modal-aprobar-solicitud-efectivo";
import ModalSolicitarEfectivo from "~/app/ui/facturacion-electronica/gestion-cajas/_components/modal-solicitar-efectivo";
import ButtonBase from "~/components/buttons/button-base";
import TableBase from "~/components/tables/table-base";
import { AgGridReact } from "ag-grid-react";
import { useColumnsPrestamosVendedores, type SolicitudEfectivo } from "./columns-prestamos-vendedores";

export default function HistorialPrestamosVendedores() {
  const { message } = App.useApp();
  const [solicitudes, setSolicitudes] = useState<SolicitudEfectivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudEfectivo | null>(null);
  const [openAprobar, setOpenAprobar] = useState(false);
  const [openSolicitar, setOpenSolicitar] = useState(false);
  const [aperturaId, setAperturaId] = useState<string>('');
  const gridRef = useRef<AgGridReact<SolicitudEfectivo>>(null);

  const cargarSolicitudes = async () => {
    setLoading(true);
    try {
      const response = await prestamoVendedorApi.listarSolicitudes();
      const data = Array.isArray((response as any).data?.data) ? (response as any).data.data : [];
      setSolicitudes(data);
    } catch (error) {
      message.error("Error al cargar solicitudes");
      setSolicitudes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();

    // Obtener apertura activa
    const fetchAperturaActiva = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cajas/activa`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        const data = await response.json();
        if (data.data?.id) {
          setAperturaId(data.data.id);
        }
      } catch (error) {
        // Error silencioso
      }
    };

    fetchAperturaActiva();
  }, []);

  const handleAprobar = (solicitud: SolicitudEfectivo) => {
    setSelectedSolicitud(solicitud);
    setOpenAprobar(true);
  };

  const handleRechazar = async (id: string) => {
    try {
      await prestamoVendedorApi.rechazarSolicitud(id);
      message.success("Solicitud rechazada");
      cargarSolicitudes();
    } catch (error) {
      message.error("Error al rechazar solicitud");
    }
  };

  const columns = useColumnsPrestamosVendedores({
    onAprobar: handleAprobar,
    onRechazar: handleRechazar,
  });

  return (
    <div className='w-full'>
      <div className='flex justify-between items-center mb-4'>
        <div className='text-lg font-semibold text-slate-700'>
          Préstamos entre Vendedores
        </div>
        <ButtonBase
          color='success'
          onClick={() => setOpenSolicitar(true)}
          className='flex items-center gap-2'
        >
          <PlusCircle className="h-4 w-4" />
          Solicitar Efectivo
        </ButtonBase>
      </div>

      <div className='h-[500px] w-full'>
        <TableBase<SolicitudEfectivo>
          ref={gridRef}
          rowData={solicitudes}
          columnDefs={columns}
          loading={loading}
          rowSelection={false}
          withNumberColumn={true}
          headerColor='var(--color-amber-600)'
        />
      </div>

      {selectedSolicitud && (
        <ModalAprobarSolicitudEfectivo
          open={openAprobar}
          setOpen={setOpenAprobar}
          solicitudId={selectedSolicitud.id}
          montoSolicitado={typeof selectedSolicitud.monto_solicitado === 'string' 
            ? parseFloat(selectedSolicitud.monto_solicitado) 
            : selectedSolicitud.monto_solicitado}
          solicitanteNombre={selectedSolicitud.vendedor_solicitante.name}
          onSuccess={cargarSolicitudes}
        />
      )}

      <ModalSolicitarEfectivo
        open={openSolicitar}
        setOpen={setOpenSolicitar}
        aperturaId={aperturaId}
      />
    </div>
  );
}
