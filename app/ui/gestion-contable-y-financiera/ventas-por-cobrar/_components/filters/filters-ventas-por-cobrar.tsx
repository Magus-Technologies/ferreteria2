'use client'

// Filtros para ventas por cobrar
import { Form, Drawer, Badge, Select } from 'antd'
import { FaSearch, FaFilter, FaBrush } from 'react-icons/fa'
import { FaCalendar, FaFileInvoiceDollar } from 'react-icons/fa6'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
// import SelectClientes from '~/app/_components/form/selects/select-clientes' // Ya no se usa
import InputBase from '~/app/_components/form/inputs/input-base'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import LabelBase from '~/components/form/label-base'
import { TipoDocumento, type VentaWhereInput } from '~/types'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import SelectTipoDocumento from '~/app/_components/form/selects/select-tipo-documento'
import SelectUsuarios from '~/app/_components/form/selects/select-usuarios'
import { Dayjs } from 'dayjs'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useDebounce } from 'use-debounce'
import { useStoreAlmacen } from '~/store/store-almacen'
import { useStoreFiltrosVentasPorCobrar, type MoraRango, type EstadoPago } from '../../_store/store-filtros-ventas-por-cobrar'
import TotalVentasPorCobrar from '../others/total-ventas-por-cobrar'
import { FormaDePago } from '~/lib/api/venta'
import ModalClienteSearch from '~/app/_components/modals/modal-cliente-search'
import { useStoreClienteSeleccionado } from '~/app/ui/facturacion-electronica/mis-ventas/store/store-cliente-seleccionado'

interface ValuesFiltersVentasPorCobrar {
  almacen_id: number
  busqueda_cliente?: string // Cambio: ahora es texto libre para filtrar clientes
  desde?: Dayjs
  hasta?: Dayjs
  tipo_documento?: TipoDocumento
  user_id?: string
  busqueda?: string
  estado_pago?: 'pendientes' | 'pagadas' | 'todas'
}

const QUICK_FILTERS: { label: string; value: MoraRango }[] = [
  { label: 'Hoy',      value: 'hoy' },
  { label: '7 días',   value: 7 },
  { label: '15 días',  value: 15 },
  { label: '30 días',  value: 30 },
  { label: '60 días',  value: 60 },
  { label: 'Todas',    value: 'todas' },
  { label: 'Vencidas', value: 'vencidas' },
]

const ESTADO_PAGO_OPTIONS = [
  { label: 'Pendientes', value: 'pendientes' },
  { label: 'Pagadas', value: 'pagadas' },
  { label: 'Todas', value: 'todas' },
]

export default function FiltersVentasPorCobrar() {
  const [form] = Form.useForm<ValuesFiltersVentasPorCobrar>()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [quickFilterActive, setQuickFilterActive] = useState<MoraRango>(15)
  const [localEstadoPago, setLocalEstadoPago] = useState<EstadoPago>('pendientes')
  const [busquedaClienteText, setBusquedaClienteText] = useState('')
  const [debouncedBusquedaCliente] = useDebounce(busquedaClienteText, 300)
  const [openModalCliente, setOpenModalCliente] = useState(false)
  const clienteSeleccionado = useStoreClienteSeleccionado(state => state.cliente)

  const almacen_id = useStoreAlmacen(state => state.almacen_id)
  const setFiltros = useStoreFiltrosVentasPorCobrar(state => state.setFiltros)
  const setMoraRango = useStoreFiltrosVentasPorCobrar(state => state.setMoraRango)
  const setEstadoPago = useStoreFiltrosVentasPorCobrar(state => state.setEstadoPago)
  const setQuickFilterText = useStoreFiltrosVentasPorCobrar(state => state.setQuickFilterText)

  const applyQuickFilter = useCallback((rango: MoraRango, triggerSearch = false) => {
    setQuickFilterActive(rango)
    // Limpiar fechas del formulario
    form.setFieldsValue({ desde: undefined, hasta: undefined })

    if (triggerSearch) {
      setMoraRango(rango)
      const data = {
        almacen_id,
        forma_de_pago: FormaDePago.CREDITO,
        estado_de_venta: { in: ['Creado'] },
      } satisfies VentaWhereInput
      setFiltros(data)
    }
  }, [almacen_id, form, setFiltros, setMoraRango])

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    const values = form.getFieldsValue()
    let count = 0
    if (values.busqueda_cliente) count++
    if (values.desde) count++
    if (values.hasta) count++
    if (values.tipo_documento) count++
    if (values.user_id) count++
    if (values.busqueda) count++
    return count
  }, [form])

  useEffect(() => {
    // Aplicar el filtro rápido inicial (15 días) y disparar búsqueda inicial
    applyQuickFilter(15, true)
    // Inicializar el estado de pago y tipo de documento en el formulario
    form.setFieldValue('estado_pago', 'pendientes')
    form.setFieldValue('tipo_documento', '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [almacen_id])

  // Listener para cuando se cambian las fechas manualmente
  useEffect(() => {
    // Monitorear cambios en los campos de fecha
    const checkDateChanges = () => {
      const { desde, hasta } = form.getFieldsValue(['desde', 'hasta'])
      if ((desde || hasta) && quickFilterActive !== 'todas') {
        setQuickFilterActive('todas')
      }
    }

    // Ejecutar cuando el formulario cambia
    const timer = setTimeout(checkDateChanges, 50)
    return () => clearTimeout(timer)
  }, [form, quickFilterActive])

  // Actualizar el quickFilterText cuando cambie el texto debounced
  useEffect(() => {
    setQuickFilterText(debouncedBusquedaCliente)
  }, [debouncedBusquedaCliente, setQuickFilterText])

  return (
    <FormBase
      form={form}
      name='filtros-ventas-por-cobrar'
      initialValues={{}}
      className='w-full'
      onFinish={values => {
        const {
          desde,
          hasta,
          almacen_id: almacenIdForm,
          busqueda,
          busqueda_cliente,
          tipo_documento,
          user_id,
          estado_pago,
        } = values

        // Commitear estado de pago al store (antes de setFiltros)
        setEstadoPago(estado_pago ?? 'pendientes')

        // Commitear rango al store
        if (desde || hasta) {
          setQuickFilterActive('todas')
          setMoraRango('todas')
        } else {
          setMoraRango(quickFilterActive)
        }

        const data = {
          almacen_id: almacenIdForm || almacen_id,
          // Solo mostrar ventas a crédito
          forma_de_pago: FormaDePago.CREDITO,
          // Filtrar por estado de pago
          ...(estado_pago === 'pagadas' ? {
            saldo: 0,
            estado_de_venta: { in: ['Creado', 'Procesado'] },
          } : estado_pago === 'pendientes' ? {
            saldo: { gt: 0 },
            estado_de_venta: { in: ['Creado', 'Procesado'] },
          } : {
            estado_de_venta: { in: ['Creado', 'Procesado'] },
          }),
          // Agregar filtro de fechas si existe
          ...(desde || hasta ? {
            fecha: {
              ...(desde && { gte: desde.format('YYYY-MM-DD') }),
              ...(hasta && { lte: hasta.format('YYYY-MM-DD') }),
            }
          } : {}),
          // Agregar filtro de tipo de documento si existe
          ...(tipo_documento && {
            tipo_documento: tipo_documento
          }),
          // Agregar filtro de usuario si existe
          ...(user_id && {
            user_id: user_id
          }),
          // Agregar búsqueda de cliente (se enviará como 'search' al backend)
          ...(busqueda_cliente && {
            busqueda_cliente: busqueda_cliente
          }),
          // Agregar búsqueda si existe
          ...(busqueda && {
            OR: [
              { serie: { contains: busqueda } },
              // Para número, intentar convertir a entero si es posible
              ...(isNaN(Number(busqueda)) ? [] : [{ numero: Number(busqueda) }]),
              { cliente: { razon_social: { contains: busqueda } } },
              { cliente: { nombres: { contains: busqueda } } },
              { cliente: { apellidos: { contains: busqueda } } },
              { cliente: { numero_documento: { contains: busqueda } } },
            ]
          }),
        } satisfies VentaWhereInput
        setFiltros(data)
        setDrawerOpen(false)
      }}
    >
      <TituloModulos
        title='Listado de Facturas de Ventas Vencidas'
        icon={<FaFileInvoiceDollar className='text-red-600' />}
        extra={
          <div className='hidden lg:flex items-center gap-6 ml-6'>
            <ConfigurableElement componentId='gestion-contable.ventas-por-cobrar.total-ventas' label='Total Ventas por Cobrar'>
              <TotalVentasPorCobrar />
            </ConfigurableElement>
          </div>
        }
      />

      {/* Filtro rápido por días */}
      <div className='flex items-center gap-4 mt-3'>
        <div className='flex items-center gap-2'>
          <span className='text-xs font-semibold text-slate-500 mr-1'>Rango:</span>
          <Select
            value={quickFilterActive}
            onChange={(val) => applyQuickFilter(val as MoraRango, false)}
            className='w-36'
            options={QUICK_FILTERS.map(({ label, value }) => ({ label, value }))}
          />
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-xs font-semibold text-slate-500 mr-1'>Estado:</span>
          <Select
            value={localEstadoPago}
            onChange={(val) => {
              setLocalEstadoPago(val)
              form.setFieldValue('estado_pago', val)
            }}
            className='w-36'
            options={ESTADO_PAGO_OPTIONS}
          />
        </div>
      </div>

      {/* Filtros principales - Responsivos */}
      <div className='flex items-center gap-2 w-full mt-4 overflow-x-auto'>
        {/* Desktop: Mostrar todos los filtros en una sola fila */}
        <div className='hidden lg:flex items-center gap-3 flex-nowrap min-w-max w-full'>
          <ConfigurableElement componentId='gestion-contable.ventas-por-cobrar.filtro-fecha-desde' label='Filtro Fecha Desde'>
            <LabelBase label='Desde:'>
              <DatePickerBase
                propsForm={{
                  name: 'desde',
                  hasFeedback: false,
                  className: '!min-w-[140px] !w-[140px] !max-w-[140px]',
                }}
                placeholder='Fecha desde'
                formWithMessage={false}
                prefix={<FaCalendar size={15} className='text-red-600 mx-1' />}
                allowClear
              />
            </LabelBase>
          </ConfigurableElement>
          <ConfigurableElement componentId='gestion-contable.ventas-por-cobrar.filtro-fecha-hasta' label='Filtro Fecha Hasta'>
            <LabelBase label='Hasta:'>
              <DatePickerBase
                propsForm={{
                  name: 'hasta',
                  hasFeedback: false,
                  className: '!min-w-[140px] !w-[140px] !max-w-[140px]',
                }}
                placeholder='Fecha hasta'
                formWithMessage={false}
                prefix={<FaCalendar size={15} className='text-red-600 mx-1' />}
                allowClear
              />
            </LabelBase>
          </ConfigurableElement>
          <ConfigurableElement componentId='gestion-contable.ventas-por-cobrar.filtro-usuario' label='Filtro Usuario'>
            <LabelBase label='Usuario:'>
              <SelectUsuarios
                propsForm={{
                  name: 'user_id',
                  hasFeedback: false,
                  className: '!min-w-[140px] !w-[140px] !max-w-[140px]',
                }}
                className='w-full'
                formWithMessage={false}
                allowClear
                placeholder='Todos'
              />
            </LabelBase>
          </ConfigurableElement>
          <ConfigurableElement componentId='gestion-contable.ventas-por-cobrar.filtro-busqueda' label='Filtro Búsqueda'>
            <LabelBase label='Serie-N°:'>
              <InputBase
                propsForm={{
                  name: 'busqueda',
                  hasFeedback: false,
                  className: '!min-w-[130px] !w-[130px]',
                }}
                placeholder='B01-15'
                formWithMessage={false}
              />
            </LabelBase>
          </ConfigurableElement>
          <ConfigurableElement componentId='gestion-contable.ventas-por-cobrar.filtro-tipo-documento' label='Filtro Tipo Documento'>
            <LabelBase label='Tipo Doc:'>
              <SelectTipoDocumento
                propsForm={{
                  name: 'tipo_documento',
                  hasFeedback: false,
                  className: '!min-w-[100px] !w-[100px] !max-w-[100px]',
                }}
                className='w-full'
                formWithMessage={false}
                allowClear
              />
            </LabelBase>
          </ConfigurableElement>
          <ConfigurableElement componentId='gestion-contable.ventas-por-cobrar.filtro-cliente' label='Filtro Cliente'>
            <LabelBase label='Cliente:'>
              <InputBase
                className='!min-w-[250px] !w-[250px] !max-w-[250px]'
                placeholder='Buscar cliente...'
                value={busquedaClienteText}
                onChange={(e) => setBusquedaClienteText(e.target.value)}
                allowClear
                suffix={
                  <FaSearch 
                    className='text-blue-500 cursor-pointer hover:text-blue-700' 
                    size={16}
                    onClick={() => setOpenModalCliente(true)}
                    title='Buscar cliente en modal'
                  />
                }
              />
            </LabelBase>
          </ConfigurableElement>
          <ButtonBase
            color='info'
            size='md'
            type='submit'
            className='flex items-center gap-2 flex-shrink-0 mt-4 h-10'
          >
            <FaSearch />
            Buscar
          </ButtonBase>

          <ButtonBase
            color='default'
            size='md'
            type='button'
            className='flex items-center gap-2 flex-shrink-0 mt-4 h-10 border-slate-300 !text-slate-600'
            onClick={() => {
              form.resetFields()
              setBusquedaClienteText('')
              setQuickFilterActive('todas')
              form.setFieldValue('estado_pago', 'pendientes')
              form.submit()
            }}
          >
            <FaBrush />
            Limpiar
          </ButtonBase>
          {/* Icono de impresión oculto según requerimiento */}
          {/* <button
            type='button'
            onClick={() => {
              // Este evento será manejado desde el componente padre
              const event = new CustomEvent('imprimirReporteVentasPorCobrar')
              window.dispatchEvent(event)
            }}
            className='flex items-center justify-center flex-shrink-0 mt-4 w-10 h-10 rounded bg-red-600 text-white hover:bg-red-700'
            title='Imprimir reporte de ventas filtradas'
          >
            <FaPrint size={16} />
          </button> */}
        </div>

        {/* Mobile/Tablet: Solo almacén y botones */}
        <div className='flex lg:hidden items-center gap-2 w-full'>
          <div className='flex-1'>
            <ConfigurableElement componentId='gestion-contable.ventas-por-cobrar.filtro-almacen-mobile' label='Filtro Almacén (móvil)'>
              <SelectAlmacen
                propsForm={{
                  name: 'almacen_id',
                  hasFeedback: false,
                  rules: [{ required: true, message: '' }],
                }}
                className='w-full'
                formWithMessage={false}
                form={form}
              />
            </ConfigurableElement>
          </div>
          <ConfigurableElement componentId='gestion-contable.ventas-por-cobrar.boton-buscar-mobile' label='Botón Buscar (móvil)'>
            <ButtonBase
              color='info'
              size='md'
              type='submit'
              className='flex items-center gap-2 flex-shrink-0'
            >
              <FaSearch />
            </ButtonBase>
          </ConfigurableElement>
          <ConfigurableElement componentId='gestion-contable.ventas-por-cobrar.boton-filtros-mobile' label='Botón Filtros (móvil)'>
            <Badge count={activeFiltersCount} offset={[-5, 5]}>
              <ButtonBase
                color='warning'
                size='md'
                type='button'
                onClick={() => setDrawerOpen(true)}
                className='flex items-center gap-2 whitespace-nowrap'
              >
                <FaFilter />
                Filtros
              </ButtonBase>
            </Badge>
          </ConfigurableElement>
        </div>
      </div>

      {/* Drawer para móvil/tablet */}
      <Drawer
        title={
          <div className='flex items-center gap-2'>
            <FaFilter className='text-red-600' />
            <span>Filtros de Búsqueda</span>
          </div>
        }
        placement='right'
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={Math.min(400, window.innerWidth - 40)}
      >
        <div className='flex flex-col gap-4'>
          <LabelBase label='Cliente:'>
            <InputBase
              placeholder='Buscar cliente...'
              value={busquedaClienteText}
              onChange={(e) => setBusquedaClienteText(e.target.value)}
              allowClear
              suffix={
                <FaSearch 
                  className='text-blue-500 cursor-pointer hover:text-blue-700' 
                  size={16}
                  onClick={() => setOpenModalCliente(true)}
                />
              }
            />
          </LabelBase>

          <LabelBase label='Búsqueda:'>
            <InputBase
              propsForm={{
                name: 'busqueda',
                hasFeedback: false,
              }}
              placeholder='B01-15'
              formWithMessage={false}
            />
          </LabelBase>

          <LabelBase label='Fecha Desde:'>
            <DatePickerBase
              propsForm={{
                name: 'desde',
                hasFeedback: false,
              }}
              placeholder='Fecha desde'
              formWithMessage={false}
              prefix={<FaCalendar size={15} className='text-red-600 mx-1' />}
              allowClear
            />
          </LabelBase>

          <LabelBase label='Fecha Hasta:'>
            <DatePickerBase
              propsForm={{
                name: 'hasta',
                hasFeedback: false,
              }}
              placeholder='Fecha hasta'
              formWithMessage={false}
              prefix={<FaCalendar size={15} className='text-red-600 mx-1' />}
              allowClear
            />
          </LabelBase>

          <LabelBase label='Tipo Documento:'>
            <SelectTipoDocumento
              propsForm={{
                name: 'tipo_documento',
                hasFeedback: false,
              }}
              className='w-full'
              formWithMessage={false}
              allowClear
            />
          </LabelBase>

          <LabelBase label='Usuario:'>
            <SelectUsuarios
              propsForm={{
                name: 'user_id',
                hasFeedback: false,
              }}
              className='w-full'
              formWithMessage={false}
              allowClear
            />
          </LabelBase>

          <LabelBase label='Estado de Pago:'>
            <Select
              value={localEstadoPago}
              onChange={(val) => {
                setLocalEstadoPago(val)
                form.setFieldValue('estado_pago', val)
              }}
              className='w-full'
              options={ESTADO_PAGO_OPTIONS}
            />
          </LabelBase>

          <div className='flex gap-2 mt-4'>
            <ButtonBase
              color='default'
              size='md'
              type='button'
              onClick={() => {
                form.resetFields()
                setBusquedaClienteText('')
                form.submit()
              }}
              className='flex-1'
            >
              Limpiar
            </ButtonBase>
            <ButtonBase
              color='info'
              size='md'
              type='submit'
              className='flex-1 flex items-center justify-center gap-2'
            >
              <FaSearch />
              Aplicar
            </ButtonBase>
          </div>
        </div>
      </Drawer>

      <ModalClienteSearch
        open={openModalCliente}
        setOpen={setOpenModalCliente}
        textDefault={busquedaClienteText}
        onOk={() => {
          if (clienteSeleccionado) {
            setBusquedaClienteText(clienteSeleccionado.razon_social || `${clienteSeleccionado.nombres} ${clienteSeleccionado.apellidos}`)
          }
          setOpenModalCliente(false)
        }}
        onRowDoubleClicked={({ data }) => {
          if (data) {
            setBusquedaClienteText(data.razon_social || `${data.nombres} ${data.apellidos}`)
          }
          setOpenModalCliente(false)
        }}
      />
    </FormBase>
  )
}
