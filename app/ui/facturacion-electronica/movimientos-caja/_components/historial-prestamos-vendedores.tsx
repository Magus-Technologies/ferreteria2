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
import FiltersPrestamosVendedores from "./filters-prestamos-vendedores";

export default function HistorialPrestamosVendedores() {
  const { message } = App.useApp();
  const [solicitudes, setSolicitudes] = useState<SolicitudEfectivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudEfectivo | null>(null);
  const [openAprobar, setOpenAprobar] = useState(false);
  const [openSolicitar, setOpenSolicitar] = useState(false);
  const [aperturaId, setAperturaId] = useState<string>('');
  const [filters, setFilters] = useState<any>({});
  const gridRef = useRef<AgGridReact<SolicitudEfectivo>>(null);

  const cargarSolicitudes = async (currentFilters = filters) => {
    setLoading(true);
    try {
      // listarSolicitudes no acepta parámetros, así que no pasamos filtros
      const response = await prestamoVendedorApi.listarSolicitudes();
      const data = Array.isArray((response as any).data?.data) ? (response as any).data.data : [];
      
      // Aplicar filtros en el frontend si existen
      let filteredData = data;
      
      if (Object.keys(currentFilters).length > 0) {
        filteredData = data.filter((solicitud: any) => {
          // Filtro por vendedor
          if (currentFilters.vendedor_id && solicitud.vendedor_solicitante?.id !== currentFilters.vendedor_id) {
            return false;
          }
          
          // Filtro por estado
          if (currentFilters.estado && solicitud.estado !== currentFilters.estado) {
            return false;
          }
          
          // Filtro por monto mínimo
          if (currentFilters.monto_min) {
            const monto = typeof solicitud.monto_solicitado === 'string' 
              ? parseFloat(solicitud.monto_solicitado) 
              : solicitud.monto_solicitado;
            if (monto < currentFilters.monto_min) {
              return false;
            }
          }
          
          // Filtro por monto máximo
          if (currentFilters.monto_max) {
            const monto = typeof solicitud.monto_solicitado === 'string' 
              ? parseFloat(solicitud.monto_solicitado) 
              : solicitud.monto_solicitado;
            if (monto > currentFilters.monto_max) {
              return false;
            }
          }
          
          // Filtro por fecha desde
          if (currentFilters.desde) {
            const fechaSolicitud = new Date(solicitud.created_at);
            const fechaDesde = new Date(currentFilters.desde);
            if (fechaSolicitud < fechaDesde) {
              return false;
            }
          }
          
          // Filtro por fecha hasta
          if (currentFilters.hasta) {
            const fechaSolicitud = new Date(solicitud.created_at);
            const fechaHasta = new Date(currentFilters.hasta);
            fechaHasta.setHours(23, 59, 59, 999); // Incluir todo el día
            if (fechaSolicitud > fechaHasta) {
              return false;
            }
          }
          
          return true;
        });
      }
      
      setSolicitudes(filteredData);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleFilter = (newFilters: any) => {
    setFilters(newFilters);
    cargarSolicitudes(newFilters);
  };

  const columns = useColumnsPrestamosVendedores({
    onAprobar: handleAprobar,
    onRechazar: handleRechazar,
  });

  return (
    <div className='w-full'>
      <FiltersPrestamosVendedores onFilter={handleFilter} />

      <div className='flex justify-between items-center mb-4'>
        <div>
          <div className='text-lg font-semibold text-slate-700'>
            Préstamos entre Vendedores
          </div>
        </div>
        
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
