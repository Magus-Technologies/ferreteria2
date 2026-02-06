"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Modal, Descriptions, Spin, DatePicker, Select, Button, Space } from "antd";
import { FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import { cajaApi, type AperturaYCierreCaja } from "~/lib/api/caja";
import { QueryKeys } from "~/app/_lib/queryKeys";
import TableBase from "~/components/tables/table-base";
import { AgGridReact } from "ag-grid-react";
import { useColumnsCierres } from "./columns-cierres";
import ResumenDetalleCierre from "../../cierre-caja/_components/resumen-detalle-cierre";
import { useAuth } from "~/lib/auth-context";
import { useServerQuery } from "~/hooks/use-server-query";
import dayjs, { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(value);
};

export default function HistorialCierres() {
  const [selectedCierre, setSelectedCierre] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [movimientos, setMovimientos] = useState<any>(null);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);
  const gridRef = useRef<AgGridReact<AperturaYCierreCaja>>(null);
  const { user } = useAuth();
  
  // Filtros
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  // Verificar si el usuario es admin
  // Opción 1: Por nombre o email (para usuarios sin roles cargados)
  const isAdminByName = user?.name?.toUpperCase() === 'ADMIN' || 
                        user?.email?.toLowerCase().includes('admin');
  
  // Opción 2: Por roles (si existen)
  const isAdminByRole = (user as any)?.roles?.some((role: any) => 
    role.name.toLowerCase() === 'admin' || role.name.toLowerCase() === 'administrador'
  ) || false;
  
  const isAdmin = isAdminByName || isAdminByRole;

  console.log(' Usuario actual:', user);
  console.log(' isAdmin:', isAdmin);
  console.log(' Roles:', (user as any)?.roles);

  // Obtener lista de usuarios
  const { response: usuariosResponse } = useServerQuery({
    action: async () => {
      return await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }).then(res => res.json());
    },
    params: undefined,
    propsQuery: {
      queryKey: [QueryKeys.USUARIOS],
    },
  });

  const usuarios = ((usuariosResponse as any)?.data || []);

  const { data: cierres = [], isLoading, refetch, error } = useQuery({
    queryKey: [QueryKeys.HISTORIAL_CIERRES, selectedUserId, dateRange],
    queryFn: async () => {
      console.log(' Cargando historial de cierres...');
      console.log(' Filtros aplicados:', { selectedUserId, dateRange });
      
      const response = await cajaApi.historialTodas({
        page: 1,
        per_page: 1000,
      });

      console.log(' Respuesta completa del backend:', response);
      console.log(' response.data:', response.data);
      console.log(' response.error:', response.error);

      if (response.error) {
        console.error("❌ Error al cargar cierres:", response.error);
        return [];
      }

      if (response.data) {
        console.log(' Total de registros recibidos:', response.data.data?.length);
        console.log(' Primeros 3 registros:', response.data.data?.slice(0, 3));
        
        // Filtrar solo los cierres (estado cerrada)
        let cierresData = response.data.data.filter(
          (item) => item.estado === "cerrada"
        );
        
        console.log(' Registros con estado "cerrada":', cierresData.length);
        
        // Filtrar por usuario si está seleccionado
        if (selectedUserId) {
          cierresData = cierresData.filter(
            (item) => item.user_id === selectedUserId
          );
          console.log(' Después de filtrar por usuario:', cierresData.length);
        }
        
        // Filtrar por rango de fechas si está seleccionado
        if (dateRange && dateRange[0] && dateRange[1]) {
          const startDate = dateRange[0].startOf('day');
          const endDate = dateRange[1].endOf('day');
          
          cierresData = cierresData.filter((item) => {
            if (!item.fecha_cierre) return false;
            const fechaCierre = dayjs(item.fecha_cierre);
            return fechaCierre.isAfter(startDate) && fechaCierre.isBefore(endDate);
          });
          console.log(' Después de filtrar por fecha:', cierresData.length);
        }
        
        console.log(' Cierres finales a mostrar:', cierresData.length);
        console.log(' Datos finales:', cierresData);
        return cierresData || [];
      }

      console.log(' No hay response.data');
      return [];
    },
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  console.log('🎯 Estado del query:', { isLoading, error, cierresCount: cierres.length });

  const verDetalles = async (record: AperturaYCierreCaja) => {
    setSelectedCierre(record);
    setModalVisible(true);
    setLoadingMovimientos(true);

    try {
      // Obtener el resumen completo del cierre desde el endpoint de cierre de caja
      const response = await cajaApi.detalleMovimientos(record.id);
      console.log(' Detalle completo del cierre:', response);
      
      if (response.error) {
        console.error("Error al cargar movimientos:", response.error);
        return;
      }
      
      if (response.data) {
        setMovimientos(response.data.data);
      }
    } catch (error) {
      console.error("Error al cargar movimientos:", error);
    } finally {
      setLoadingMovimientos(false);
    }
  };

  const handleLimpiarFiltros = () => {
    setSelectedUserId(undefined);
    setDateRange(null);
  };

  const columns = useColumnsCierres({
    onVerDetalles: verDetalles,
    isAdmin: isAdmin,
  });

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex justify-center items-center h-[500px]">
          <Spin size="large" tip="Cargando cierres..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="flex justify-center items-center h-[500px] flex-col gap-4">
          <span className="text-red-500 text-lg">Error al cargar cierres</span>
          <span className="text-slate-500">{String(error)}</span>
          <Button onClick={() => refetch()}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        {/* Filtros */}
        <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <FilterOutlined className="text-cyan-600" />
            <span className="font-semibold text-slate-700">Filtros</span>
          </div>
          <Space wrap size="middle">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Usuario</label>
              <Select
                placeholder="Todos los usuarios"
                style={{ width: 200 }}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (String(option?.label ?? '')).toLowerCase().includes(input.toLowerCase())
                }
                value={selectedUserId}
                onChange={setSelectedUserId}
                options={usuarios.map((user: any) => ({
                  value: user.id,
                  label: user.name,
                }))}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Rango de Fechas</label>
              <RangePicker
                format="DD/MM/YYYY"
                placeholder={["Fecha inicio", "Fecha fin"]}
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null] | null)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
              >
                Actualizar
              </Button>
              <Button
                onClick={handleLimpiarFiltros}
              >
                Limpiar Filtros
              </Button>
            </div>
          </Space>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-semibold">Historial de Cierres de Caja</span>
          <span className="text-sm text-slate-500">
            Total: {cierres.length} cierres
          </span>
        </div>
        <div className="h-[500px] w-full">
          <TableBase<AperturaYCierreCaja>
            ref={gridRef}
            rowData={cierres}
            columnDefs={columns}
            rowSelection={false}
            withNumberColumn={true}
            headerColor="var(--color-amber-600)"
          />
        </div>
      </div>

      <Modal
        title={
          <div className="flex items-center justify-between pr-8">
            <span>Detalles del Cierre de Caja</span>
            {selectedCierre && (
              <span className="text-sm font-normal text-slate-500">
                {dayjs(selectedCierre.fecha_cierre).format("DD/MM/YYYY HH:mm")}
              </span>
            )}
          </div>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedCierre(null);
          setMovimientos(null);
        }}
        footer={null}
        width={1200}
        style={{ top: 20 }}
      >
        {selectedCierre && (
          <div className="space-y-4">
            {/* Información básica del cierre */}
            <Descriptions bordered column={3} size="small">
              <Descriptions.Item label="Usuario">
                <div>
                  <div className="font-medium">{selectedCierre.user?.name}</div>
                  <div className="text-xs text-slate-500">{selectedCierre.user?.email}</div>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Caja">
                {selectedCierre.sub_caja?.nombre} ({selectedCierre.sub_caja?.codigo})
              </Descriptions.Item>
              <Descriptions.Item label="Duración">
                {dayjs(selectedCierre.fecha_cierre).diff(dayjs(selectedCierre.fecha_apertura), 'hours')} horas
              </Descriptions.Item>
              <Descriptions.Item label="Monto Apertura">
                <span className="font-semibold text-green-600">
                  {formatCurrency(parseFloat(selectedCierre.monto_apertura))}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Monto Cierre">
                <span className="font-semibold text-blue-600">
                  {formatCurrency(parseFloat(selectedCierre.monto_cierre || "0"))}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Diferencia">
                {(() => {
                  const diferencia = parseFloat(selectedCierre.monto_cierre || "0") - parseFloat(selectedCierre.monto_apertura);
                  return (
                    <span className={`font-semibold ${diferencia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {diferencia >= 0 ? '+' : ''}{formatCurrency(diferencia)}
                    </span>
                  );
                })()}
              </Descriptions.Item>
            </Descriptions>

            {/* Resumen detallado */}
            {loadingMovimientos ? (
              <div className="flex justify-center py-8">
                <Spin size="large" tip="Cargando detalles del cierre..." />
              </div>
            ) : movimientos ? (
              <ResumenDetalleCierre 
                resumen={movimientos.resumen || movimientos}
                montoEsperado={parseFloat(selectedCierre.monto_cierre || "0")}
              />
            ) : (
              <div className="text-center py-8 text-slate-500">
                No se pudo cargar el detalle del cierre
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
