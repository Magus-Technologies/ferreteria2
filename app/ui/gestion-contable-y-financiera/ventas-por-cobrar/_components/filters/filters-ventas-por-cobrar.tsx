'use client'

// Filtros para ventas por cobrar
import { Form, Drawer, Badge } from 'antd'
import { FaSearch, FaFilter } from 'react-icons/fa'
import { FaCalendar, FaFileInvoiceDollar } from 'react-icons/fa6'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import SelectClientes from '~/app/_components/form/selects/select-clientes'
import InputBase from '~/app/_components/form/inputs/input-base'
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
import { useStoreFiltrosVentasPorCobrar } from '../../_store/store-filtros-ventas-por-cobrar'
import TotalVentasPorCobrar from '../others/total-ventas-por-cobrar'
import { FormaDePago } from '~/lib/api/venta'

interface ValuesFiltersVentasPorCobrar {
  almacen_id: number
  cliente_id?: number
  desde?: Dayjs
  hasta?: Dayjs
  tipo_documento?: TipoDocumento
  user_id?: string
  busqueda?: string
}

export default function FiltersVentasPorCobrar() {
  const [form] = Form.useForm<ValuesFiltersVentasPorCobrar>()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const almacen_id = useStoreAlmacen(state => state.almacen_id)
  const setFiltros = useStoreFiltrosVentasPorCobrar(state => state.setFiltros)

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    const values = form.getFieldsValue()
    let count = 0
    if (values.cliente_id) count++
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
      // Solo mostrar ventas a crédito con saldo pendiente
      forma_de_pago: FormaDePago.CREDITO,
      fecha: {
        gte: toUTCBD({ date: dayjs().subtract(30, 'days').startOf('day') }),
        lte: toUTCBD({ date: dayjs().endOf('day') }),
      },
      estado_de_venta: {
        in: ['Creado', 'Procesado'],
      },
    } satisfies Prisma.VentaWhereInput
    setFiltros(data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <FormBase
      form={form}
      name='filtros-ventas-por-cobrar'
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
          cliente_id,
          ...rest
        } = values
        
        const data = {
          almacen_id: almacen_id || almacen_id,
          // Solo mostrar ventas a crédito
          forma_de_pago: FormaDePago.CREDITO,
          ...rest,
          fecha: {
            gte: desde ? toUTCBD({ date: desde.startOf('day') }) : undefined,
            lte: hasta ? toUTCBD({ date: hasta.endOf('day') }) : undefined,
          },
          estado_de_venta: {
            in: ['Creado', 'Procesado'],
          },
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
          // Agregar filtro de cliente si existe
          ...(cliente_id && {
            cliente_id: cliente_id
          }),
        } satisfies Prisma.VentaWhereInput
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
              <SelectClientes
                propsForm={{
                  name: 'cliente_id',
                  hasFeedback: false,
                  className: '!min-w-[250px] !w-[250px] !max-w-[250px]',
                }}
                className='w-full'
                classIconSearch='!mb-0'
                formWithMessage={false}
                allowClear
                form={form}
                placeholder='Todos los clientes'
              />
            </LabelBase>
          </ConfigurableElement>
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
            <SelectClientes
              propsForm={{
                name: 'cliente_id',
                hasFeedback: false,
              }}
              className='w-full'
              classIconSearch='!mb-0'
              formWithMessage={false}
              allowClear
              form={form}
              placeholder='Todos los clientes'
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
    </FormBase>
  )
}
