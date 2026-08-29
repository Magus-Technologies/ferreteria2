'use client'

import { Form, Drawer, Badge } from 'antd'
import { FaSearch, FaFilter } from 'react-icons/fa'
import { MdPointOfSale } from 'react-icons/md'
import { FaBoxOpen, FaClockRotateLeft } from 'react-icons/fa6'
import { useState, useMemo, useEffect } from 'react'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import FilterDateRangeFields from '~/app/_components/filters/filter-date-range-fields'
import SelectClientes from '~/app/_components/form/selects/select-clientes'
import dayjs, { Dayjs } from 'dayjs'
import { useStoreAlmacen } from '~/store/store-almacen'
import InputBase from '~/app/_components/form/inputs/input-base'
import SelectBase from '~/app/_components/form/selects/select-base'
import { TipoOperacion, EstadoPrestamo } from '~/lib/api/prestamo'
import { useStoreFiltrosMisPrestamos } from '../../store/store-filtros-mis-prestamos'
import { UseStorePrestamoSeleccionada } from '../tables/table-mis-prestamos'
import ModalRegistrarDevolucion from '../modals/modal-registrar-devolucion'
import ModalVerDevoluciones from '../modals/modal-ver-devoluciones'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'

interface ValuesFiltersMisPrestamos {
  almacen_id: number
  cliente_id?: number
  cliente_search_text?: string
  desde?: Dayjs
  hasta?: Dayjs
  numero?: string
  tipo_operacion?: TipoOperacion
  estado_prestamo?: EstadoPrestamo
}

export default function FiltersMisPrestamos() {
  const [form] = Form.useForm<ValuesFiltersMisPrestamos>()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [clienteSearchText, setClienteSearchText] = useState<string>('')
  const [modalDevolucionOpen, setModalDevolucionOpen] = useState(false)
  const [modalVerDevolucionesOpen, setModalVerDevolucionesOpen] = useState(false)

  const almacen_id = useStoreAlmacen((state) => state.almacen_id)
  const setFiltros = useStoreFiltrosMisPrestamos((state) => state.setFiltros)
  const prestamoSeleccionado = UseStorePrestamoSeleccionada((state) => state.prestamo)

  // Si ya se devolvió/entregó todo, no queda nada por registrar: se bloquea el
  // botón verde. Se valida por estado y por saldo pendiente (lo que llegue antes).
  const todoDevuelto =
    !!prestamoSeleccionado &&
    (prestamoSeleccionado.estado_prestamo === 'pagado_total' ||
      Number(prestamoSeleccionado.monto_pendiente ?? 0) <= 0)

  useEffect(() => {
    const hoy = dayjs().format('YYYY-MM-DD')
    const data = {
      almacen_id,
      fecha_desde: hoy,
      fecha_hasta: hoy,
    }
    setFiltros(data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    const values = form.getFieldsValue()
    let count = 0
    if (values.cliente_id) count++
    if (values.tipo_operacion) count++
    if (values.estado_prestamo) count++
    if (values.numero) count++
    return count
  }, [form])

  const handleFinish = (values: ValuesFiltersMisPrestamos) => {
    
    const { desde, hasta, cliente_id, numero, ...rest } = values

    // Construir objeto de filtros solo con valores definidos
    const data: any = {
      ...rest,
      // Si hay cliente_id, usarlo (cliente seleccionado)
      ...(cliente_id ? { cliente_id } : {}),
      // Si NO hay cliente_id pero SÍ hay texto de búsqueda, usar search
      ...(!cliente_id && clienteSearchText ? { search: clienteSearchText } : {}),
      // Incluir fechas si existen
      ...(desde ? { fecha_desde: desde.format('YYYY-MM-DD') } : {}),
      ...(hasta ? { fecha_hasta: hasta.format('YYYY-MM-DD') } : {}),
      // Número de préstamo
      ...(numero ? { search: numero } : {}),
    }
    
    // Limpiar valores undefined, null o vacíos
    Object.keys(data).forEach(key => {
      if (data[key] === undefined || data[key] === null || data[key] === '') {
        delete data[key]
      }
    })

    // Fuerza una nueva petición al backend en cada clic de Buscar,
    // aunque los filtros no hayan cambiado
    data.searchTrigger = Date.now()

    setFiltros(data)
    setDrawerOpen(false)
  }

  return (
    <FormBase
      form={form}
      name='filtros-mis-prestamos'
      initialValues={{
        desde: dayjs().startOf('day'),
        hasta: dayjs().endOf('day'),
      }}
      className='w-full'
      onFinish={handleFinish}
    >
      <TituloModulos
        title='Mis Préstamos'
        icon={<MdPointOfSale className='text-amber-600' />}
        extra={
          <ConfigurableElement
            componentId='mis-prestamos.filtro-rango-fechas'
            label='Campo Fecha Desde y Hasta'
          >
            <div className='hidden shrink-0 grid-cols-2 gap-1 text-sm font-normal md:ml-4 md:grid'>
              <FilterDateRangeFields
                fromName='desde'
                toName='hasta'
                fromLabel='Desde:'
                fromFieldClassName='!w-[136px]'
                toFieldClassName='!w-[136px]'
                itemClassName='flex min-w-0 items-center gap-1'
                fromPlaceholder='Fecha'
              />
            </div>
          </ConfigurableElement>
        }
      >
        <div className='flex items-center gap-2 flex-wrap'>
          {/* Mobile/Tablet: Botón para abrir drawer */}
          <div className='flex md:hidden items-center gap-2'>
            <ButtonBase
              color='info'
              size='md'
              type='submit'
              className='flex items-center gap-2'
            >
              <FaSearch />
            </ButtonBase>
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
          </div>
        </div>
      </TituloModulos>

      {/* Filtros Desktop - Ocupan todo el espacio */}
      <div className='hidden md:block mt-2'>
        <div className='flex flex-wrap items-center gap-x-2 gap-y-2'>
          <div className='flex w-[300px] shrink-0 min-w-0 items-center gap-2'>
            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
              Cliente:
            </label>
            <SelectClientes
              autoFocus
              propsForm={{
                name: 'cliente_id',
                hasFeedback: false,
                className: '!min-w-0 !flex-1 !w-auto',
              }}
              className='min-w-0 !w-full'
              classNameContainer='min-w-0 !gap-1'
              classIconSearch='!mb-0'
              formWithMessage={false}
              allowClear
              form={form}
              placeholder='Digite nombre del cliente'
              onSearchChange={(text) => {
                setClienteSearchText(text)
              }}
              onChange={(value) => {
                if (value) {
                  setClienteSearchText('')
                }
                if (!value) {
                  form.setFieldValue('cliente_id', undefined)
                }
              }}
            />
          </div>

          <div className='flex shrink-0 items-center gap-1'>
            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
              N° Préstamo:
            </label>
            <InputBase
              uppercase={true}
              propsForm={{
                name: 'numero',
                hasFeedback: false,
                className: '!w-[160px] !min-w-[160px] !max-w-[160px]',
              }}
              placeholder='PRE-2025-001'
              formWithMessage={false}
              className='!w-[160px]'
            />
          </div>

          <div className='flex shrink-0 items-center gap-1'>
            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
              Tipo:
            </label>
            <SelectBase
              propsForm={{
                name: 'tipo_operacion',
                hasFeedback: false,
                 className: 'w-full sm:!min-w-[140px] sm:!w-[140px] sm:!max-w-[140px]',
              }}
              placeholder='Todos'
              formWithMessage={false}
              allowClear
              options={[
                { value: TipoOperacion.PRESTAR, label: 'Prestar' },
                { value: TipoOperacion.PEDIR_PRESTADO, label: 'Pedir Prestado' },
              ]}
            />
          </div>

          <div className='flex shrink-0 items-center gap-1'>
            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
              Estado:
            </label>
            <SelectBase
              propsForm={{
                name: 'estado_prestamo',
                hasFeedback: false,
                className: 'w-full sm:!min-w-[150px] sm:!w-[150px] sm:!max-w-[150px]',
              }}
              placeholder='Todos'
              formWithMessage={false}
              allowClear
              options={[
                { value: EstadoPrestamo.PENDIENTE, label: 'Pendiente' },
                { value: EstadoPrestamo.PAGADO_PARCIAL, label: 'Devuelto Parcial' },
                { value: EstadoPrestamo.PAGADO_TOTAL, label: 'Devuelto Total' },
                { value: EstadoPrestamo.VENCIDO, label: 'Vencido' },
              ]}
            />
          </div>

          <ConfigurableElement componentId="mis-prestamos.boton-buscar" label="Botón Buscar">
            <ButtonBase
              color='info'
              size='sm'
              type='submit'
              className='!w-auto !min-w-0 !max-w-none !px-3 flex shrink-0 items-center justify-center gap-2 whitespace-nowrap'
            >
              <FaSearch />
              Buscar
            </ButtonBase>
          </ConfigurableElement>

          <ConfigurableElement componentId="mis-prestamos.boton-registrar-devolucion" label="Botón Registrar Devolución">
            <ButtonBase
              color='success'
              size='sm'
              type='button'
              className='!w-auto !min-w-0 !max-w-none !px-3 flex shrink-0 items-center justify-center gap-2 whitespace-nowrap'
              onClick={() =>
                prestamoSeleccionado && !todoDevuelto && setModalDevolucionOpen(true)
              }
              disabled={!prestamoSeleccionado || todoDevuelto}
              title={
                todoDevuelto
                  ? 'Este préstamo ya fue devuelto en su totalidad'
                  : undefined
              }
            >
              <FaBoxOpen />
              Registrar Devolución
            </ButtonBase>
          </ConfigurableElement>

          <ConfigurableElement componentId="mis-prestamos.boton-ver-devoluciones" label="Botón Ver Devoluciones">
            <ButtonBase
              color='info'
              size='sm'
              type='button'
              className='!w-auto !min-w-0 !max-w-none !px-3 flex shrink-0 items-center justify-center gap-2 whitespace-nowrap'
              onClick={() => prestamoSeleccionado && setModalVerDevolucionesOpen(true)}
              disabled={!prestamoSeleccionado}
            >
              <FaClockRotateLeft />
              Ver Devoluciones
            </ButtonBase>
          </ConfigurableElement>
        </div>
      </div>

      {/* Drawer para móvil/tablet */}
      <Drawer
        title={
          <div className='flex items-center gap-2'>
            <FaFilter className='text-amber-600' />
            <span>Filtros de Búsqueda</span>
          </div>
        }
        placement='right'
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={Math.min(
          400,
          typeof window !== 'undefined' ? window.innerWidth - 40 : 360
        )}
      >
        <div className='flex flex-col gap-4'>
          <FilterDateRangeFields
            fromName='desde'
            toName='hasta'
            fromPlaceholder='Fecha Desde'
            stacked
          />
          <div>
            <label className='text-sm font-semibold text-gray-700 block mb-2'>
              Cliente:
            </label>
            <SelectClientes
              autoFocus
              propsForm={{ name: 'cliente_id', hasFeedback: false }}
              className='w-full'
              classIconSearch='!mb-0'
              formWithMessage={false}
              allowClear
              form={form}
              placeholder='Digite nombre del cliente'
              onSearchChange={(text) => {
                setClienteSearchText(text)
              }}
              onChange={(value) => {
                if (value) {
                  setClienteSearchText('')
                }
                if (!value) {
                  form.setFieldValue('cliente_id', undefined)
                }
              }}
            />
          </div>
          <div>
            <label className='text-sm font-semibold text-gray-700 block mb-2'>
              N° Préstamo:
            </label>
            <InputBase
              uppercase={true}
              propsForm={{ name: 'numero', hasFeedback: false }}
              placeholder='PRE-2025-001'
              formWithMessage={false}
              className='w-full sm:!min-w-[130px] sm:!w-[130px] sm:!max-w-[130px]'
            />
          </div>
          <div>
            <label className='text-sm font-semibold text-gray-700 block mb-2'>
              Tipo:
            </label>
            <SelectBase
              propsForm={{ name: 'tipo_operacion', hasFeedback: false }}
              placeholder='Todos'
              formWithMessage={false}
              allowClear
              options={[
                { value: TipoOperacion.PRESTAR, label: 'Prestar' },
                { value: TipoOperacion.PEDIR_PRESTADO, label: 'Pedir Prestado' },
              ]}
            />
          </div>
          <div>
            <label className='text-sm font-semibold text-gray-700 block mb-2'>
              Estado:
            </label>
            <SelectBase
              propsForm={{ name: 'estado_prestamo', hasFeedback: false }}
              placeholder='Todos'
              formWithMessage={false}
              allowClear
              options={[
                { value: EstadoPrestamo.PENDIENTE, label: 'Pendiente' },
                { value: EstadoPrestamo.PAGADO_PARCIAL, label: 'Devuelto Parcial' },
                { value: EstadoPrestamo.PAGADO_TOTAL, label: 'Devuelto Total' },
                { value: EstadoPrestamo.VENCIDO, label: 'Vencido' },
              ]}
            />
          </div>
          <div className='flex gap-2 mt-4'>
            <ButtonBase
              color='default'
              size='md'
              type='button'
              onClick={() => {
                form.resetFields()
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

      <ModalRegistrarDevolucion
        open={modalDevolucionOpen}
        setOpen={setModalDevolucionOpen}
        prestamo={prestamoSeleccionado}
      />

      <ModalVerDevoluciones
        open={modalVerDevolucionesOpen}
        setOpen={setModalVerDevolucionesOpen}
        prestamo={prestamoSeleccionado}
      />
    </FormBase>
  )
}
