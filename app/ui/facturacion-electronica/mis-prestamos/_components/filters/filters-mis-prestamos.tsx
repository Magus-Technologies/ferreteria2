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
import { TipoOperacion, EstadoPrestamo, TipoEntidad } from '~/lib/api/prestamo'
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
  tipo_entidad?: TipoEntidad
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

  useEffect(() => {
    const data = {
      almacen_id,
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
    if (values.tipo_entidad) count++
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
      >
        <div className='flex items-center gap-2 flex-wrap'>
          <SelectAlmacen
            propsForm={{
              name: 'almacen_id',
              hasFeedback: false,
              className: 'w-full sm:!min-w-[220px] sm:!w-[220px]',
              rules: [{ required: true, message: '' }],
            }}
            className='w-full'
            formWithMessage={false}
            form={form}
          />

          {/* Mobile/Tablet: Botón para abrir drawer */}
          <div className='flex lg:hidden items-center gap-2'>
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
      <div className='hidden lg:block mt-4'>
        <div className='grid grid-cols-12 gap-x-3 gap-y-2.5'>
          {/* Fila 1 */}
          <div className='col-span-4 grid grid-cols-2 gap-3'>
            <FilterDateRangeFields
              fromName='desde'
              toName='hasta'
              itemClassName='flex items-center gap-2'
            />
          </div>
          <div className='col-span-4 flex items-center gap-2'>
            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
              Cliente:
            </label>
            <SelectClientes
              autoFocus
              propsForm={{
                name: 'cliente_id',
                hasFeedback: false,
                className: '!w-full',
              }}
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
          <div className='col-span-2 flex items-center gap-2'>
            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
              N° Préstamo:
            </label>
            <InputBase
              uppercase={true}
              propsForm={{
                name: 'numero',
                hasFeedback: false,
                className: '!w-full',
              }}
              placeholder='PRE-2025-001'
              formWithMessage={false}
            />
          </div>
          <div className='col-span-2 flex items-center gap-2'>
            <ConfigurableElement componentId="mis-prestamos.boton-buscar" label="Botón Buscar">
              <ButtonBase
                color='info'
                size='md'
                type='submit'
                className='flex items-center gap-2 w-full justify-center'
              >
                <FaSearch />
                Buscar
              </ButtonBase>
            </ConfigurableElement>
          </div>

          {/* Fila 2 */}
          <div className='col-span-2 flex items-center gap-2'>
            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
              Tipo:
            </label>
            <SelectBase
              propsForm={{
                name: 'tipo_entidad',
                hasFeedback: false,
                className: '!w-full',
              }}
              placeholder='Todos'
              formWithMessage={false}
              allowClear
              options={[
                { value: TipoEntidad.CLIENTE, label: 'Cliente' },
                { value: TipoEntidad.PROVEEDOR, label: 'Proveedor' },
              ]}
            />
          </div>
          <div className='col-span-2 flex items-center gap-2'>
            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
              Operación:
            </label>
            <SelectBase
              propsForm={{
                name: 'tipo_operacion',
                hasFeedback: false,
                className: '!w-full',
              }}
              placeholder='Todas'
              formWithMessage={false}
              allowClear
              options={[
                { value: TipoOperacion.PRESTAR, label: 'Prestar' },
                { value: TipoOperacion.PEDIR_PRESTADO, label: 'Pedir Prestado' },
              ]}
            />
          </div>
          <div className='col-span-2 flex items-center gap-2'>
            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
              Estado:
            </label>
            <SelectBase
              propsForm={{
                name: 'estado_prestamo',
                hasFeedback: false,
                className: '!w-full',
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

          {/* Fila 3 - Botones de acción */}
          <div className='col-span-2 flex items-center gap-2'>
            <ConfigurableElement componentId="mis-prestamos.boton-registrar-devolucion" label="Botón Registrar Devolución">
              <ButtonBase
                color='success'
                size='md'
                type='button'
                className='flex items-center gap-2 whitespace-nowrap w-full justify-center'
                onClick={() => prestamoSeleccionado && setModalDevolucionOpen(true)}
                disabled={!prestamoSeleccionado}
              >
                <FaBoxOpen />
                Registrar Devolución
              </ButtonBase>
            </ConfigurableElement>
          </div>
          <div className='col-span-2 flex items-center gap-2'>
            <ConfigurableElement componentId="mis-prestamos.boton-ver-devoluciones" label="Botón Ver Devoluciones">
              <ButtonBase
                color='info'
                size='md'
                type='button'
                className='flex items-center gap-2 whitespace-nowrap w-full justify-center'
                onClick={() => prestamoSeleccionado && setModalVerDevolucionesOpen(true)}
                disabled={!prestamoSeleccionado}
              >
                <FaClockRotateLeft />
                Ver Devoluciones
              </ButtonBase>
            </ConfigurableElement>
          </div>
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
            />
          </div>
          <div>
            <label className='text-sm font-semibold text-gray-700 block mb-2'>
              Tipo:
            </label>
            <SelectBase
              propsForm={{ name: 'tipo_entidad', hasFeedback: false }}
              placeholder='Todos'
              formWithMessage={false}
              allowClear
              options={[
                { value: TipoEntidad.CLIENTE, label: 'Cliente' },
                { value: TipoEntidad.PROVEEDOR, label: 'Proveedor' },
              ]}
            />
          </div>
          <div>
            <label className='text-sm font-semibold text-gray-700 block mb-2'>
              Operación:
            </label>
            <SelectBase
              propsForm={{ name: 'tipo_operacion', hasFeedback: false }}
              placeholder='Todas'
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
