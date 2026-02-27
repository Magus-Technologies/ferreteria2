"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Spin, Button, Space, Form } from "antd";
import { FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import { cajaApi, type AperturaYCierreCaja } from "~/lib/api/caja";
import { QueryKeys } from "~/app/_lib/queryKeys";
import TableBase from "~/components/tables/table-base";
import { AgGridReact } from "ag-grid-react";
import { useColumnsAperturas } from "./columns-aperturas";
import { useServerQuery } from "~/hooks/use-server-query";
import dayjs, { Dayjs } from "dayjs";
import ModalTicketApertura from "../../_components/modals/modal-ticket-apertura";
import SelectUsuarios from "~/app/_components/form/selects/select-usuarios";
import { cajaPrincipalApi, type CajaPrincipal } from "~/lib/api/caja-principal";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import { FaCalendar } from "react-icons/fa6";
import { Select } from "antd";
import FormBase from "~/components/form/form-base";
import ButtonBase from "~/components/buttons/button-base";
import { FaSearch } from "react-icons/fa";

interface FilterValues {
  user_id?: string;
  desde?: Dayjs;
  hasta?: Dayjs;
  estado?: string;
}

export default function HistorialAperturas() {
  const [form] = Form.useForm<FilterValues>();
  const gridRef = useRef<AgGridReact<AperturaYCierreCaja>>(null);
  const [selectedApertura, setSelectedApertura] = useState<AperturaYCierreCaja | null>(null);
  const [modalTicketVisible, setModalTicketVisible] = useState(false);
  const [selectedVendedor, setSelectedVendedor] = useState<any>(null);

  // Filtros
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [selectedEstado, setSelectedEstado] = useState<string | undefined>(undefined);
  const [selectedCajaPrincipalId, setSelectedCajaPrincipalId] = useState<number | undefined>(undefined);

  // Cajas principales para el filtro
  const { data: cajasPrincipales = [] } = useQuery({
    queryKey: ['cajas-principales-lista'],
    queryFn: async () => {
      const response = await cajaPrincipalApi.getAll();
      return response.data?.data || [];
    },
  });

  const { data: aperturas = [], isLoading, refetch } = useQuery({
    queryKey: [QueryKeys.HISTORIAL_APERTURAS_TODAS, selectedUserId, dateRange, selectedEstado, selectedCajaPrincipalId],
    queryFn: async () => {
      const response = await cajaApi.historialTodas({
        page: 1,
        per_page: 1000,
        caja_principal_id: selectedCajaPrincipalId,
        // user_id and other filters are currently done in frontend below, but could be passed here.
      });

      if (response.error) {
        console.error("❌ Error al cargar aperturas:", response.error);
        return [];
      }

      if (response.data) {
        let aperturasData = response.data.data || [];

        // Filtrar por usuario (vendedor) si está seleccionado
        if (selectedUserId) {
          aperturasData = aperturasData.filter(
            (item) => item.vendedor_id === selectedUserId || item.user_id === selectedUserId
          );
        }

        // Filtrar por estado si está seleccionado
        if (selectedEstado) {
          aperturasData = aperturasData.filter(
            (item) => item.estado === selectedEstado
          );
        }

        // Filtrar por rango de fechas si está seleccionado
        if (dateRange && dateRange[0] && dateRange[1]) {
          const startDate = dateRange[0].startOf('day');
          const endDate = dateRange[1].endOf('day');

          aperturasData = aperturasData.filter((item) => {
            if (!item.fecha_apertura) return false;
            const fechaApertura = dayjs(item.fecha_apertura);
            return fechaApertura.isAfter(startDate) && fechaApertura.isBefore(endDate);
          });
        }

        return aperturasData;
      }

      return [];
    },
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  const handleVerTicket = (apertura: AperturaYCierreCaja) => {
    console.log('🎫 Ver ticket de apertura (vendedor específico):', apertura);
    setSelectedApertura(apertura);

    // Si la fila tiene un vendedor específico, lo pre-seleccionamos para el ticket
    if (apertura.vendedor) {
      setSelectedVendedor(apertura.vendedor);
    } else {
      setSelectedVendedor(null);
    }

    setModalTicketVisible(true);
  };

  const handleCloseTicketModal = () => {
    setModalTicketVisible(false);
    setSelectedVendedor(null);
    setSelectedApertura(null);
  };

  const handleFinish = (values: FilterValues) => {
    console.log('🔍 Aplicando filtros:', values);
    setSelectedUserId(values.user_id);
    setSelectedEstado(values.estado);

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
    setSelectedEstado(undefined);
    setSelectedCajaPrincipalId(undefined);
  };

  const columns = useColumnsAperturas({
    onVerTicket: handleVerTicket,
  });

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex justify-center items-center h-[500px]">
          <Spin size="large">
            <div className="p-12">Cargando aperturas...</div>
          </Spin>
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
          name="filtros-aperturas"
          onFinish={handleFinish}
          className="w-full"
        >
          <div className="mb-6">
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
                  Caja:
                </label>
                <Select
                  className="w-full"
                  placeholder="Todas las cajas"
                  allowClear
                  value={selectedCajaPrincipalId}
                  onChange={(value) => setSelectedCajaPrincipalId(value)}
                  options={cajasPrincipales.map((c: CajaPrincipal) => ({
                    label: c.nombre,
                    value: c.id,
                  }))}
                  size="middle"
                />
              </div>
              {/* Ocultamos el filtro de Estado para ahorrar espacio, o podemos dejarlo si reducimos botones al igual que en cierres */}
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
              <div className="col-span-3 flex items-center gap-2">
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
              </div>
            </div>
          </div>
        </FormBase>

        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-semibold">Historial de Aperturas de Caja</span>
          <span className="text-sm text-slate-500">
            Total: {aperturas.length} aperturas
          </span>
        </div>
        <div className="h-[500px] w-full">
          <TableBase<AperturaYCierreCaja>
            ref={gridRef}
            rowData={aperturas}
            columnDefs={columns}
            rowSelection={false}
            withNumberColumn={true}
            headerColor="var(--color-amber-600)"
          />
        </div>
      </div>

      {/* Modal para ver ticket de apertura */}
      {selectedApertura && (
        <ModalTicketApertura
          open={modalTicketVisible}
          onClose={handleCloseTicketModal}
          apertura={selectedApertura}
          vendedorSeleccionado={selectedVendedor}
        />
      )}
    </>
  );
}
