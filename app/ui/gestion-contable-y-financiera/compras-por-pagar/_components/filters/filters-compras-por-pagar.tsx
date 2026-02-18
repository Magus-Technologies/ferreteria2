'use client'

// Filtros para compras por pagar - versión actualizada sin SelectProveedores
import { Form, Drawer, Badge } from 'antd'
import { FaSearch, FaFilter } from 'react-icons/fa'
import { FaCalendar, FaFileInvoiceDollar } from 'react-icons/fa6'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import LabelBase from '~/components/form/label-base'
import { Prisma } from '@prisma/client'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'

import SelectTipoDocumento from '~/app/_components/form/selects/select-tipo-documento'
import SelectUsuarios from '~/app/_components/form/selects/select-usuarios'
import { Dayjs } from 'dayjs'
import { TipoDocumento } from '@prisma/client'
import { toUTCBD } from '~/utils/fechas'
import dayjs from 'dayjs'
import { useEffect, useState, useMemo } from 'react'
import { useStoreAlmacen } from '~/store/store-almacen'
import { useStoreFiltrosComprasPorPagar } from '../../_store/store-filtros-compras-por-pagar'
import TotalComprasPorPagar from '../others/total-compras-por-pagar'
import { FormaDePago } from '~/lib/api/venta'
import ModalProveedorSearch from '~/app/_components/modals/modal-proveedor-search'
import type { Proveedor } from '~/lib/api/proveedor'
import { useStoreProveedorSeleccionado } from '~/app/ui/gestion-comercial-e-inventario/mis-proveedores/store/store-proveedor-seleccionado'

interface ValuesFiltersComprasPorPagar {
  almacen_id: number
  proveedor_busqueda?: string
  desde?: Dayjs
  hasta?: Dayjs
  tipo_documento?: TipoDocumento
  user_id?: string
  busqueda?: string
}

export default function FiltersComprasPorPagar() {
  const [form] = Form.useForm<ValuesFiltersComprasPorPagar>()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [openModalProveedorSearch, setOpenModalProveedorSearch] = useState(false)
  const [textDefault, setTextDefault] = useState('')

  const almacen_id = useStoreAlmacen(state => state.almacen_id)
  const setFiltros = useStoreFiltrosComprasPorPagar(state => state.setFiltros)

  const proveedorSeleccionadoStore = useStoreProveedorSeleccionado(
    store => store.proveedor
  )
  const setProveedorSeleccionadoStore = useStoreProveedorSeleccionado(
    store => store.setProveedor
  )

  // Función para manejar la selección de proveedor
  function handleProveedorSelect({ data }: { data?: Proveedor } = {}) {
    const proveedor = data || proveedorSeleccionadoStore
    if (proveedor) {
      form.setFieldValue('proveedor_busqueda', proveedor.razon_social)
      setProveedorSeleccionadoStore(undefined)
      setOpenModalProveedorSearch(false)
    }
  }

  // Función para abrir el modal de búsqueda de proveedor
  function openProveedorModal() {
    const currentValue = form.getFieldValue('proveedor_busqueda') || ''
    setTextDefault(currentValue)
    setOpenModalProveedorSearch(true)
  }

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    const values = form.getFieldsValue()
    let count = 0
    if (values.proveedor_busqueda) count++
    if (values.desde) count++
    if (values.hasta) count++
    if (values.tipo_documento) count++
    if (values.user_id) count++
    if (values.busqueda) count++
    return count
  }, [form])

  useEffect(() => {
    const data = {
      almacen_id,
      // Solo mostrar compras a crédito con saldo pendiente
      forma_de_pago: FormaDePago.CREDITO,
      fecha: {
        gte: toUTCBD({ date: dayjs().subtract(30, 'days').startOf('day') }),
        lte: toUTCBD({ date: dayjs().endOf('day') }),
      },
      estado_de_compra: {
        in: ['Creado', 'Procesado'],
      },
    } satisfies Prisma.CompraWhereInput
    setFiltros(data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <FormBase
      form={form}
      name='filtros-compras-por-pagar'
      initialValues={{
        desde: dayjs().subtract(30, 'days').startOf('day'),
        hasta: dayjs().endOf('day'),
      }}
      className='w-full'
      onFinish={values => {
        const {
          desde,
          hasta,
          almacen_id,
          busqueda,
          proveedor_busqueda,
          ...rest
        } = values
        
        const data = {
          almacen_id: almacen_id || almacen_id,
          // Solo mostrar compras a crédito
          forma_de_pago: FormaDePago.CREDITO,
          ...rest,
          fecha: {
            gte: desde ? toUTCBD({ date: desde.startOf('day') }) : undefined,
            lte: hasta ? toUTCBD({ date: hasta.endOf('day') }) : undefined,
          },
          estado_de_compra: {
            in: ['Creado', 'Procesado'],
          },
          // Agregar búsqueda si existe
          ...(busqueda && {
            OR: [
              { serie: { contains: busqueda } },
              // Para número, intentar convertir a entero si es posible
              ...(isNaN(Number(busqueda)) ? [] : [{ numero: Number(busqueda) }]),
              { proveedor: { razon_social: { contains: busqueda } } },
              { proveedor: { ruc: { contains: busqueda } } },
            ]
          }),
          // Agregar búsqueda de proveedor si existe
          ...(proveedor_busqueda && {
            proveedor: {
              OR: [
                { razon_social: { contains: proveedor_busqueda } },
                { ruc: { contains: proveedor_busqueda } },
              ]
            }
          }),
        } satisfies Prisma.CompraWhereInput
        setFiltros(data)
        setDrawerOpen(false)
      }}
    >
      <TituloModulos
        title='Listado de Facturas de Compras Vencidas'
        icon={<FaFileInvoiceDollar className='text-red-600' />}
        extra={
          <div className='hidden lg:flex items-center gap-6 ml-6'>
            <ConfigurableElement componentId='gestion-contable.compras-por-pagar.total-compras' label='Total Compras por Pagar'>
              <TotalComprasPorPagar />
            </ConfigurableElement>
          </div>
        }
      />

      {/* Filtros principales - Responsivos */}
      <div className='flex items-center gap-2 w-full mt-4 overflow-x-auto'>
        {/* Desktop: Mostrar todos los filtros en una sola fila */}
        <div className='hidden lg:flex items-center gap-3 flex-nowrap min-w-max w-full'>
          <ConfigurableElement componentId='gestion-contable.compras-por-pagar.filtro-fecha-desde' label='Filtro Fecha Desde'>
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
          <ConfigurableElement componentId='gestion-contable.compras-por-pagar.filtro-fecha-hasta' label='Filtro Fecha Hasta'>
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
          <ConfigurableElement componentId='gestion-contable.compras-por-pagar.filtro-usuario' label='Filtro Usuario'>
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
          <ConfigurableElement componentId='gestion-contable.compras-por-pagar.filtro-busqueda' label='Filtro Búsqueda'>
            <LabelBase label='Serie-N°:'>
              <Form.Item
                name='busqueda'
                className='!mb-0'
              >
                <input
                  type='text'
                  placeholder='Serie, número...'
                  className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent min-w-[130px] w-[130px]'
                />
              </Form.Item>
            </LabelBase>
          </ConfigurableElement>
          <ConfigurableElement componentId='gestion-contable.compras-por-pagar.filtro-tipo-documento' label='Filtro Tipo Documento'>
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
          <ConfigurableElement componentId='gestion-contable.compras-por-pagar.filtro-proveedor' label='Filtro Proveedor'>
            <LabelBase label='Proveedor:'>
              <div className='flex items-center gap-2'>
                <Form.Item
                  name='proveedor_busqueda'
                  className='!mb-0 flex-1'
                >
                  <input
                    type='text'
                    placeholder='Buscar proveedor...'
                    className='px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent min-w-[150px] w-[150px]'
                    onKeyUp={(e) => {
                      if (e.key === 'Enter') {
                        openProveedorModal()
                      }
                    }}
                  />
                </Form.Item>
                <FaSearch
                  className='text-yellow-600 cursor-pointer'
                  size={15}
                  onClick={openProveedorModal}
                />
              </div>
            </LabelBase>
          </ConfigurableElement>
        </div>

        {/* Mobile/Tablet: Solo almacén y botones */}
        <div className='flex lg:hidden items-center gap-2 w-full'>
          <div className='flex-1'>
            <ConfigurableElement componentId='gestion-contable.compras-por-pagar.filtro-almacen-mobile' label='Filtro Almacén (móvil)'>
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
          <ConfigurableElement componentId='gestion-contable.compras-por-pagar.boton-buscar-mobile' label='Botón Buscar (móvil)'>
            <ButtonBase
              color='info'
              size='md'
              type='submit'
              className='flex items-center gap-2 flex-shrink-0'
            >
              <FaSearch />
            </ButtonBase>
          </ConfigurableElement>
          <ConfigurableElement componentId='gestion-contable.compras-por-pagar.boton-filtros-mobile' label='Botón Filtros (móvil)'>
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
          <LabelBase label='Proveedor:'>
            <div className='flex items-center gap-2'>
              <Form.Item
                name='proveedor_busqueda'
                className='!mb-0 flex-1'
              >
                <input
                  type='text'
                  placeholder='Buscar proveedor...'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent'
                  onKeyUp={(e) => {
                    if (e.key === 'Enter') {
                      openProveedorModal()
                    }
                  }}
                />
              </Form.Item>
              <FaSearch
                className='text-yellow-600 cursor-pointer'
                size={15}
                onClick={openProveedorModal}
              />
            </div>
          </LabelBase>

          <LabelBase label='Búsqueda:'>
            <Form.Item
              name='busqueda'
              className='!mb-0'
            >
              <input
                type='text'
                placeholder='Serie, número, RUC...'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent'
              />
            </Form.Item>
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

      {/* Modal de búsqueda de proveedor */}
      <ModalProveedorSearch
        open={openModalProveedorSearch}
        setOpen={setOpenModalProveedorSearch}
        onOk={() => handleProveedorSelect()}
        textDefault={textDefault}
        onRowDoubleClicked={handleProveedorSelect}
      />
    </FormBase>
  )
}