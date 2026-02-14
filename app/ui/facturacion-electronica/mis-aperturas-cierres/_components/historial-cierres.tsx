"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Spin, Button, Form, message } from "antd";
import { FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import { cajaApi, type AperturaYCierreCaja } from "~/lib/api/caja";
import { QueryKeys } from "~/app/_lib/queryKeys";
import TableBase from "~/components/tables/table-base";
import { AgGridReact } from "ag-grid-react";
import { useColumnsCierres } from "./columns-cierres";
import dayjs, { Dayjs } from "dayjs";
import SelectUsuarios from "~/app/_components/form/selects/select-usuarios";
import ModalTicketCierre from "../../cierre-caja/_components/modal-ticket-cierre";
import ModalVendedoresCierre from "./modal-vendedores-cierre";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import { FaCalendar, FaSearch } from "react-icons/fa";
import FormBase from "~/components/form/form-base";
import ButtonBase from "~/components/buttons/button-base";

interface FilterValues {
  user_id?: string;
  desde?: Dayjs;
  hasta?: Dayjs;
}

export default function HistorialCierres() {
  const [form] = Form.useForm<FilterValues>();
  const [selectedCierre, setSelectedCierre] = useState<AperturaYCierreCaja | null>(null);
  const [cierreConResumen, setCierreConResumen] = useState<any>(null);
  const [modalTicketVisible, setModalTicketVisible] = useState(false);
  const [modalVendedoresVisible, setModalVendedoresVisible] = useState(false);
  const [selectedVendedor, setSelectedVendedor] = useState<any>(null);
  const [loadingCierre, setLoadingCierre] = useState(false);
  const gridRef = useRef<AgGridReact<AperturaYCierreCaja>>(null);
  
  // Filtros
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const { data: cierres = [], isLoading, refetch, error } = useQuery({
    queryKey: [QueryKeys.HISTORIAL_CIERRES, selectedUserId, dateRange],
    queryFn: async () => {
      console.log('📊 Cargando historial de cierres...');
      console.log('🔍 Filtros aplicados:', { selectedUserId, dateRange });
      
      const response = await cajaApi.historialTodas({
        page: 1,
        per_page: 1000,
      });

      console.log('📦 Respuesta completa del backend:', response);

      if (response.error) {
        console.error("❌ Error al cargar cierres:", response.error);
        return [];
      }

      if (response.data) {
        console.log('✅ Total de registros recibidos:', response.data.data?.length);
        
        // Filtrar solo los cierres (que tienen fecha_cierre)
        let cierresData = response.data.data.filter(
          (item) => item.fecha_cierre !== null
        );
        
        console.log('📋 Registros con fecha_cierre:', cierresData.length);
        
        // Filtrar por usuario si está seleccionado
        if (selectedUserId) {
          cierresData = cierresData.filter(
            (item) => item.user_id === selectedUserId
          );
          console.log('👤 Después de filtrar por usuario:', cierresData.length);
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
          console.log('📅 Después de filtrar por fecha:', cierresData.length);
        }
        
        console.log('✨ Cierres finales a mostrar:', cierresData.length);
        return cierresData || [];
      }

      console.log('⚠️ No hay response.data');
      return [];
    },
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  console.log('🎯 Estado del query:', { isLoading, error, cierresCount: cierres.length });

  const handleVerTicket = async (cierre: AperturaYCierreCaja) => {
    console.log('🎫 Ver ticket de cierre:', cierre);
    setSelectedCierre(cierre);
    
    // Cargar el cierre completo con resumen desde el backend
    setLoadingCierre(true);
    try {
      const response = await cajaApi.obtenerCierre(cierre.id);
      console.log('📦 Cierre completo con resumen:', response);
      
      if (response.data?.data) {
        const cierreCompleto = response.data.data;
        setCierreConResumen(cierreCompleto);
        
        // Verificar si hay múltiples vendedores
        const tieneMultiplesVendedores = cierre.distribuciones_vendedores && 
                                          cierre.distribuciones_vendedores.length > 1;
        
        if (tieneMultiplesVendedores) {
          // Mostrar modal de vendedores primero
          console.log('👥 Cierre con múltiples vendedores, mostrando modal de selección');
          setModalVendedoresVisible(true);
        } else {
          // Mostrar ticket directamente
          console.log('👤 Cierre con un solo vendedor o sin distribución, mostrando ticket directo');
          setModalTicketVisible(true);
        }
      } else {
        message.error('No se pudo cargar el cierre completo');
      }
    } catch (err) {
      console.error('❌ Error al cargar cierre:', err);
      message.error('Error al cargar el cierre');
    } finally {
      setLoadingCierre(false);
    }
  };

  const handleVerTicketVendedor = (vendedor: any) => {
    console.log('🎫 Ver ticket de vendedor específico:', vendedor);
    setSelectedVendedor(vendedor);
    setModalVendedoresVisible(false);
    setModalTicketVisible(true);
  };

  const handleCloseTicketModal = () => {
    setModalTicketVisible(false);
    setSelectedVendedor(null);
  };

  const handleCloseVendedoresModal = () => {
    setModalVendedoresVisible(false);
    setSelectedCierre(null);
  };

  const handleFinish = (values: FilterValues) => {
    console.log('🔍 Aplicando filtros:', values);
    setSelectedUserId(values.user_id);
    
    if (values.desde && values.hasta) {
      setDateRange([values.desde, values.hasta]);
    } else {
      setDateRange(null);
    }
  };

  const handleLimpiarFiltros = () => {
    form.resetFields();
    setSelectedUserId(undefined);
    setDateRange(null);
  };

  const columns = useColumnsCierres({
    onVerTicket: handleVerTicket,
  });

  // Mostrar mensaje si no hay cierres Y no hay filtros aplicados
  const hayFiltrosAplicados = selectedUserId || dateRange;
  
  if (!isLoading && !error && cierres.length === 0 && !hayFiltrosAplicados) {
    return (
      <div className="w-full">
        <div className="flex justify-center items-center h-[500px] flex-col gap-4">
          <span className="text-slate-400 text-6xl">📋</span>
          <span className="text-slate-600 text-lg font-medium">No hay cierres de caja registrados</span>
          <span className="text-slate-500 text-sm">
            Los cierres aparecerán aquí una vez que se cierre alguna caja
          </span>
          <Button onClick={() => refetch()} icon={<ReloadOutlined />}>
            Actualizar
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || loadingCierre) {
    return (
      <div className="w-full">
        <div className="flex justify-center items-center h-[500px]">
          <Spin size="large">
            <div className="p-12">{loadingCierre ? 'Cargando cierre...' : 'Cargando cierres...'}</div>
          </Spin>
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
        <FormBase
          form={form}
          name="filtros-cierres"
          onFinish={handleFinish}
          className="w-full"
        >
          <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <FilterOutlined className="text-amber-600" />
              <span className="font-semibold text-slate-700">Filtros</span>
            </div>
            <div className="grid grid-cols-12 gap-x-3 gap-y-2.5">
              <div className="col-span-3 flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                  Usuario:
                </label>
                <Form.Item name="user_id" noStyle>
                  <SelectUsuarios
                    className="w-full"
                    formWithMessage={false}
                    allowClear
                    placeholder="Todos los usuarios"
                    onChange={(value) => {
                      setSelectedUserId(value);
                    }}
                  />
                </Form.Item>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                  Desde:
                </label>
                <DatePickerBase
                  propsForm={{
                    name: "desde",
                    hasFeedback: false,
                    className: "!w-full",
                  }}
                  placeholder="Fecha"
                  formWithMessage={false}
                  prefix={
                    <FaCalendar size={15} className="text-amber-600 mx-1" />
                  }
                  allowClear
                  onChange={(date) => {
                    const hasta = form.getFieldValue('hasta');
                    if (date && hasta) {
                      setDateRange([date, hasta]);
                    } else {
                      setDateRange(null);
                    }
                  }}
                />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
                  Hasta:
                </label>
                <DatePickerBase
                  propsForm={{
                    name: "hasta",
                    hasFeedback: false,
                    className: "!w-full",
                  }}
                  placeholder="Hasta"
                  formWithMessage={false}
                  prefix={
                    <FaCalendar size={15} className="text-amber-600 mx-1" />
                  }
                  allowClear
                  onChange={(date) => {
                    const desde = form.getFieldValue('desde');
                    if (desde && date) {
                      setDateRange([desde, date]);
                    } else {
                      setDateRange(null);
                    }
                  }}
                />
              </div>
              <div className="col-span-5 flex items-center gap-2">
                <ButtonBase
                  color="info"
                  size="md"
                  type="submit"
                  className="flex items-center gap-2 w-full justify-center"
                >
                  <FaSearch />
                  Buscar
                </ButtonBase>
                <ButtonBase
                  color="default"
                  size="md"
                  type="button"
                  onClick={handleLimpiarFiltros}
                  className="flex items-center gap-2 w-full justify-center"
                >
                  Limpiar
                </ButtonBase>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => refetch()}
                  className="w-full"
                >
                  Actualizar
                </Button>
              </div>
            </div>
          </div>
        </FormBase>

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

      {/* Modal para seleccionar vendedor (cuando hay múltiples) */}
      {selectedCierre && (
        <ModalVendedoresCierre
          open={modalVendedoresVisible}
          onClose={handleCloseVendedoresModal}
          cierre={selectedCierre}
          onVerTicketVendedor={handleVerTicketVendedor}
        />
      )}

      {/* Modal para ver ticket de cierre */}
      {cierreConResumen && (
        <ModalTicketCierre
          open={modalTicketVisible}
          setOpen={(open) => {
            setModalTicketVisible(open);
            if (!open) {
              handleCloseTicketModal();
              setCierreConResumen(null);
            }
          }}
          data={cierreConResumen}
        />
      )}
    </>
  );
}
