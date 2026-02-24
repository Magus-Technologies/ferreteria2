"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Spin, Button, Form, message, Modal, Input } from "antd";
import { FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import { cajaApi, type AperturaYCierreCaja } from "~/lib/api/caja";
import { apiRequest } from "~/lib/api";
import { deudaPersonalApi } from "~/lib/api/deuda-personal";
import { cierreCajaApi } from "~/lib/api/cierre-caja";
import { cajaPrincipalApi, type CajaPrincipal } from "~/lib/api/caja-principal";
import { Select } from "antd";
import { QueryKeys } from "~/app/_lib/queryKeys";
import TableBase from "~/components/tables/table-base";
import { AgGridReact } from "ag-grid-react";
import { useColumnsCierres } from "./columns-cierres";
import dayjs, { Dayjs } from "dayjs";
import SelectUsuarios from "~/app/_components/form/selects/select-usuarios";
import ModalTicketCierre from "../../cierre-caja/_components/modal-ticket-cierre";
import ModalVendedoresCierre from "./modal-vendedores-cierre";
import DatePickerBase from "~/app/_components/form/fechas/date-picker-base";
import SelectSupervisor from "../../_components/selects/select-supervisor";
import { FaCalendar, FaSearch, FaMoneyBillWave, FaRedo } from "react-icons/fa";
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
  const queryClient = useQueryClient();
  const router = useRouter();

  // Estado para pagar deuda
  const [modalPagarDeudaVisible, setModalPagarDeudaVisible] = useState(false);
  const [cierreParaDeuda, setCierreParaDeuda] = useState<AperturaYCierreCaja | null>(null);
  const [pagandoDeuda, setPagandoDeuda] = useState(false);
  const [observacionDeuda, setObservacionDeuda] = useState('');

  // Estado para aprobar cierre
  const [modalAprobarVisible, setModalAprobarVisible] = useState(false);
  const [cierreParaAprobar, setCierreParaAprobar] = useState<AperturaYCierreCaja | null>(null);
  const [supervisorId, setSupervisorId] = useState<string | undefined>(undefined);
  const [supervisorNombre, setSupervisorNombre] = useState('');
  const [supervisorPassword, setSupervisorPassword] = useState('');
  const [aprobandoCierre, setAprobandoCierre] = useState(false);

  // Estado para ReCerrar
  const [modalReCerrarVisible, setModalReCerrarVisible] = useState(false);
  const [cierreParaReCerrar, setCierreParaReCerrar] = useState<AperturaYCierreCaja | null>(null);
  const [verificandoReCerrar, setVerificandoReCerrar] = useState(false);

  // Filtros
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [selectedCajaPrincipalId, setSelectedCajaPrincipalId] = useState<number | undefined>(undefined);

  // Cajas principales para el filtro
  const { data: cajasPrincipales = [] } = useQuery({
    queryKey: ['cajas-principales-lista'],
    queryFn: async () => {
      const response = await cajaPrincipalApi.getAll();
      return response.data?.data || [];
    },
  });

  const { data: cierres = [], isLoading, refetch, error } = useQuery({
    queryKey: [QueryKeys.HISTORIAL_CIERRES, selectedUserId, dateRange, selectedCajaPrincipalId],
    queryFn: async () => {
      console.log('📊 Cargando historial de arqueos diarios...');

      const filters: any = {};
      if (selectedUserId) {
        filters.user_id = selectedUserId;
      }
      if (dateRange && dateRange[0] && dateRange[1]) {
        filters.fecha_inicio = dateRange[0].format('YYYY-MM-DD');
        filters.fecha_fin = dateRange[1].format('YYYY-MM-DD');
      }
      if (selectedCajaPrincipalId) {
        filters.caja_principal_id = selectedCajaPrincipalId;
      }

      const response = await cajaApi.listarArqueos(filters);

      console.log('📦 Respuesta arqueos diarios:', response);

      if (response.error) {
        console.error("❌ Error al cargar arqueos:", response.error);
        return [];
      }

      if (response.data) {
        const arqueosData = response.data.data?.data || response.data.data || [];
        console.log('✨ Arqueos diarios a mostrar:', arqueosData.length);
        return arqueosData;
      }

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
    setSelectedCajaPrincipalId(undefined);
  };

  // === Aprobar Cierre ===
  const handleAprobarCierre = (cierre: AperturaYCierreCaja) => {
    setCierreParaAprobar(cierre);
    setSupervisorId(undefined);
    setSupervisorNombre('');
    setSupervisorPassword('');
    setModalAprobarVisible(true);
  };

  const handleConfirmarAprobacion = async () => {
    if (!cierreParaAprobar || !supervisorId || !supervisorPassword) {
      message.warning('Seleccione un supervisor e ingrese la contraseña');
      return;
    }

    setAprobandoCierre(true);
    try {
      const response: any = await cierreCajaApi.aprobarCierre(
        cierreParaAprobar.id,
        supervisorId,
        supervisorPassword
      );

      if (response?.success) {
        message.success('Cierre aprobado exitosamente');
        setModalAprobarVisible(false);
        setCierreParaAprobar(null);
        // Refrescar la lista
        queryClient.invalidateQueries({ queryKey: [QueryKeys.HISTORIAL_CIERRES] });
        refetch();
      } else {
        message.error(response?.message || 'Error al aprobar el cierre');
      }
    } catch (err: any) {
      console.error('Error al aprobar cierre:', err);
      message.error(err?.message || 'Error al aprobar el cierre');
    } finally {
      setAprobandoCierre(false);
    }
  };

  const handleCancelarAprobacion = () => {
    setModalAprobarVisible(false);
    setCierreParaAprobar(null);
    setSupervisorId(undefined);
    setSupervisorNombre('');
    setSupervisorPassword('');
  };

  const handleReCerrarCaja = (cierre: AperturaYCierreCaja) => {
    setCierreParaReCerrar(cierre);
    setSupervisorId(undefined);
    setSupervisorNombre('');
    setSupervisorPassword('');
    setModalReCerrarVisible(true);
  };

  const handleConfirmarReCerrar = async () => {
    if (!cierreParaReCerrar || !supervisorId || !supervisorPassword) {
      message.warning('Seleccione un supervisor e ingrese la contraseña para autorizar el Re-Cierre');
      return;
    }

    setVerificandoReCerrar(true);
    try {
      // Validar supervisor usando el endpoint genérico
      const response: any = await apiRequest('/cajas/cierre/validar-supervisor', {
        method: 'POST',
        body: JSON.stringify({
          supervisor_id: supervisorId,
          supervisor_password: supervisorPassword
        })
      });

      if (response?.data?.success) {
        message.success('Autorización confirmada');
        setModalReCerrarVisible(false);
        
        // CORREGIDO: Pasar supervisor validado en la URL para que no se pida nuevamente
        const redirectId = (cierreParaReCerrar as any)?.apertura_id || cierreParaReCerrar.id;
        router.push(
          `/ui/facturacion-electronica/cierre-caja?cierre_id=${redirectId}&re_cierre=true&supervisor_id=${supervisorId}&supervisor_validado=true`
        );
      } else {
        message.error(response?.data?.message || response?.error || 'Contraseña de supervisor incorrecta');
      }
    } catch (err: any) {
      console.error('Error al autorizar re-cierre:', err);
      message.error(err?.message || 'Error al validar credenciales del supervisor');
    } finally {
      setVerificandoReCerrar(false);
    }
  };

  const handleCancelarReCerrar = () => {
    setModalReCerrarVisible(false);
    setCierreParaReCerrar(null);
    setSupervisorId(undefined);
    setSupervisorNombre('');
    setSupervisorPassword('');
  };

  const handlePagarDeuda = (cierre: AperturaYCierreCaja) => {
    setCierreParaDeuda(cierre);
    setObservacionDeuda('');
    setModalPagarDeudaVisible(true);
  };

  const handleConfirmarPagoDeuda = async () => {
    if (!(cierreParaDeuda as any)?.deuda) return;

    setPagandoDeuda(true);
    try {
      const response = await deudaPersonalApi.pagar((cierreParaDeuda as any).deuda.id, observacionDeuda);
      if (response?.success) {
        message.success('Deuda registrada como pagada exitosamente');
        setModalPagarDeudaVisible(false);
        setCierreParaDeuda(null);
        queryClient.invalidateQueries({ queryKey: [QueryKeys.HISTORIAL_CIERRES] });
        refetch();
      } else {
        message.error(response?.message || 'Error al pagar deuda');
      }
    } catch (err: any) {
      console.error('Error al pagar deuda:', err);
      message.error(err.message || 'Error al pagar deuda');
    } finally {
      setPagandoDeuda(false);
    }
  };

  const handleCancelarPagoDeuda = () => {
    setModalPagarDeudaVisible(false);
    setCierreParaDeuda(null);
    setObservacionDeuda('');
  };

  const columns = useColumnsCierres({
    onVerTicket: handleVerTicket,
    onAprobarCierre: handleAprobarCierre,
    onReCerrarCaja: handleReCerrarCaja,
    onPagarDeuda: handlePagarDeuda,
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

      {/* Modal para aprobar cierre pendiente */}
      <Modal
        title={
          <div className='text-lg font-semibold text-slate-800'>
            Aprobar Cierre de Caja
          </div>
        }
        open={modalAprobarVisible}
        onOk={handleConfirmarAprobacion}
        onCancel={handleCancelarAprobacion}
        confirmLoading={aprobandoCierre}
        okText='Aprobar'
        cancelText='Cancelar'
        width={500}
        destroyOnClose
      >
        <div className='py-4 space-y-4'>
          <div className='p-3 bg-amber-50 border border-amber-200 rounded'>
            <p className='text-sm text-slate-700'>
              Para aprobar este cierre, seleccione un supervisor e ingrese su contraseña.
            </p>
          </div>

          <div>
            <div className='text-sm font-medium text-slate-600 mb-1'>Supervisor</div>
            <SelectSupervisor
              value={supervisorId}
              onChange={(value: string | undefined, option: any) => {
                setSupervisorId(value);
                setSupervisorNombre(option?.label || '');
              }}
              size='middle'
            />
          </div>

          {supervisorId && (
            <div>
              <div className='text-sm font-medium text-slate-600 mb-1'>
                Contraseña de Supervisor
                {supervisorNombre && (
                  <span className='ml-1 text-blue-600'>({supervisorNombre})</span>
                )}
              </div>
              <Input.Password
                placeholder='Ingrese la contraseña de supervisor'
                value={supervisorPassword}
                onChange={(e) => setSupervisorPassword(e.target.value)}
                size='large'
                autoFocus
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Modal para Re-Cerrar Caja */}
      <Modal
        title={
          <div className='text-lg font-semibold text-slate-800 flex items-center gap-2'>
            <FaRedo className="text-blue-600" />
            Autorizar Re-Cierre
          </div>
        }
        open={modalReCerrarVisible}
        onOk={handleConfirmarReCerrar}
        onCancel={handleCancelarReCerrar}
        confirmLoading={verificandoReCerrar}
        okText='Autorizar y Continuar'
        cancelText='Cancelar'
        width={500}
        destroyOnClose
      >
        <div className='py-4 space-y-4'>
          <div className='p-3 bg-blue-50 border border-blue-200 rounded'>
            <p className='text-sm text-slate-700'>
              Para habilitar el re-cierre de esta caja, se requiere autorización de un supervisor. Por favor, seleccione un supervisor e ingrese su contraseña.
            </p>
          </div>

          <div>
            <div className='text-sm font-medium text-slate-600 mb-1'>Supervisor</div>
            <SelectSupervisor
              value={supervisorId}
              onChange={(value: string | undefined, option: any) => {
                setSupervisorId(value);
                setSupervisorNombre(option?.label || '');
              }}
              size='middle'
            />
          </div>

          {supervisorId && (
            <div>
              <div className='text-sm font-medium text-slate-600 mb-1'>
                Contraseña de Supervisor
                {supervisorNombre && (
                  <span className='ml-1 text-blue-600'>({supervisorNombre})</span>
                )}
              </div>
              <Input.Password
                placeholder='Ingrese la contraseña de supervisor'
                value={supervisorPassword}
                onChange={(e) => setSupervisorPassword(e.target.value)}
                size='large'
                autoFocus
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Modal para Pagar Deuda */}
      <Modal
        title={
          <div className='text-lg font-semibold text-slate-800 flex items-center gap-2'>
            <FaMoneyBillWave className="text-amber-600" />
            Abonar a Deuda Faltante
          </div>
        }
        open={modalPagarDeudaVisible}
        onOk={handleConfirmarPagoDeuda}
        onCancel={handleCancelarPagoDeuda}
        confirmLoading={pagandoDeuda}
        okText='Registrar Pago'
        cancelText='Cancelar'
        width={500}
        destroyOnClose
      >
        <div className='py-4 space-y-4'>
          <div className='p-3 bg-amber-50 border border-amber-200 rounded'>
            <p className='text-sm text-slate-700'>
              Se registrará el pago de la deuda pendiente por <strong>S/ {(cierreParaDeuda as any)?.deuda?.monto}</strong> asociada al cierre de caja.
            </p>
          </div>
          <div>
            <div className='text-sm font-medium text-slate-600 mb-1'>Observaciones (Opcional)</div>
            <Input.TextArea
              rows={3}
              placeholder='Ej: Dinero depositado en cuenta, entregado en efectivo, etc.'
              value={observacionDeuda}
              onChange={(e) => setObservacionDeuda(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
