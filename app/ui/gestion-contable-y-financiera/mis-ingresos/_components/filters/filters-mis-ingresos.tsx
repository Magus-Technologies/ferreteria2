'use client'

import { Form, Drawer, Badge, Input } from 'antd'
import { FaSearch, FaFilter } from 'react-icons/fa'
import { FaCalendar, FaDollarSign } from 'react-icons/fa6'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import LabelBase from '~/components/form/label-base'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import SelectUsuarios from '~/app/_components/form/selects/select-usuarios'
import { Dayjs } from 'dayjs'
import { toUTCBD } from '~/utils/fechas'
import dayjs from 'dayjs'
import { useEffect, useState, useMemo } from 'react'
import { useStoreAlmacen } from '~/store/store-almacen'
import { useStoreFiltrosMisIngresos } from '../../_store/store-filtros-mis-ingresos'


interface ValuesFiltersMisIngresos {
  almacen_id: number
  concepto_ingreso?: string
  desde?: Dayjs
  hasta?: Dayjs
  user_id?: string
  busqueda?: string
}

export default function FiltersMisIngresos() {
  const [form] = Form.useForm<ValuesFiltersMisIngresos>()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const almacen_id = useStoreAlmacen(state => state.almacen_id)
  const setFiltros = useStoreFiltrosMisIngresos(state => state.setFiltros)

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    const values = form.getFieldsValue()
    let count = 0
    if (values.concepto_ingreso) count++
    if (values.desde) count++
    if (values.hasta) count++
    if (values.user_id) count++
    if (values.busqueda) count++
    return count
  }, [form])

  useEffect(() => {
    const data = {
      almacen_id,
      fecha: {
        gte: toUTCBD({ date: dayjs().subtract(30, 'days').startOf('day') }),
        lte: toUTCBD({ date: dayjs().endOf('day') }),
      },
    }
    setFiltros(data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <FormBase
      form={form}
      name='filtros-mis-ingresos'
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
          concepto_ingreso,
          ...rest
        } = values
        
        const data = {
          almacen_id: almacen_id || almacen_id,
          ...rest,
          fecha: {
            gte: desde ? toUTCBD({ date: desde.startOf('day') }) : undefined,
            lte: hasta ? toUTCBD({ date: hasta.endOf('day') }) : undefined,
          },
          // Agregar búsqueda si existe
          ...(busqueda && {
            OR: [
              { concepto: { contains: busqueda } },
              { comentario: { contains: busqueda } },
              // Para monto, intentar convertir a número si es posible
              ...(isNaN(Number(busqueda)) ? [] : [{ monto: Number(busqueda) }]),
            ]
          }),
          // Agregar búsqueda de concepto si existe
          ...(concepto_ingreso && {
            concepto: { contains: concepto_ingreso }
          }),
        }
        setFiltros(data)
        setDrawerOpen(false)
      }}
    >
      <TituloModulos
        title='Ingresos de Dinero'
        icon={<FaDollarSign className='text-rose-600' />}
      />

      {/* Filtros principales - Responsivos */}
      <div className='flex items-center gap-2 w-full mt-4 overflow-x-auto'>
        {/* Desktop: Mostrar todos los filtros en una sola fila */}
        <div className='hidden lg:flex items-center gap-3 flex-nowrap min-w-max w-full'>
          <ConfigurableElement componentId='gestion-contable.mis-ingresos.filtro-fecha-desde' label='Filtro Fecha Desde'>
            <LabelBase label='Desde:'>
              <DatePickerBase
                propsForm={{
                  name: 'desde',
                  hasFeedback: false,
                  className: '!min-w-[140px] !w-[140px] !max-w-[140px]',
                }}
                placeholder='Fecha desde'
                formWithMessage={false}
                prefix={<FaCalendar size={15} className='text-rose-600 mx-1' />}
                allowClear
              />
            </LabelBase>
          </ConfigurableElement>
          <ConfigurableElement componentId='gestion-contable.mis-ingresos.filtro-fecha-hasta' label='Filtro Fecha Hasta'>
            <LabelBase label='Hasta:'>
              <DatePickerBase
                propsForm={{
                  name: 'hasta',
                  hasFeedback: false,
                  className: '!min-w-[140px] !w-[140px] !max-w-[140px]',
                }}
                placeholder='Fecha hasta'
                formWithMessage={false}
                prefix={<FaCalendar size={15} className='text-rose-600 mx-1' />}
                allowClear
              />
            </LabelBase>
          </ConfigurableElement>
          <ConfigurableElement componentId='gestion-contable.mis-ingresos.filtro-usuario' label='Filtro Usuario'>
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
          <ConfigurableElement componentId='gestion-contable.mis-ingresos.filtro-concepto' label='Filtro Concepto'>
            <LabelBase label='Concepto:'>
              <Form.Item
                name='concepto_ingreso'
                className='!mb-0'
              >
                <Input
                  placeholder='Concepto de ingreso...'
                  className='!min-w-[150px] !w-[150px] !max-w-[150px]'
                />
              </Form.Item>
            </LabelBase>
          </ConfigurableElement>
          <ConfigurableElement componentId='gestion-contable.mis-ingresos.filtro-busqueda' label='Filtro Búsqueda'>
            <LabelBase label='Buscar:'>
              <div className='flex items-center gap-1'>
                <Form.Item
                  name='busqueda'
                  className='!mb-0 flex-1'
                >
                  <Input
                    placeholder='Monto, comentario...'
                    className='!min-w-[130px] !w-[130px] !max-w-[130px]'
                  />
                </Form.Item>
                <ButtonBase
                  color='info'
                  size='sm'
                  type='submit'
                  className='flex items-center gap-1 px-2'
                >
                  <FaSearch size={12} />
                  BUSCAR
                </ButtonBase>
                <ButtonBase
                  color='default'
                  size='sm'
                  type='button'
                  onClick={() => {
                    form.resetFields(['busqueda', 'concepto_ingreso'])
                    form.submit()
                  }}
                  className='px-2'
                >
                  Limpiar
                </ButtonBase>
              </div>
            </LabelBase>
          </ConfigurableElement>
        </div>

        {/* Mobile/Tablet: Solo almacén y botones */}
        <div className='flex lg:hidden items-center gap-2 w-full'>
          <div className='flex-1'>
            <ConfigurableElement componentId='gestion-contable.mis-ingresos.filtro-almacen-mobile' label='Filtro Almacén (móvil)'>
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
          <ConfigurableElement componentId='gestion-contable.mis-ingresos.boton-buscar-mobile' label='Botón Buscar (móvil)'>
            <ButtonBase
              color='info'
              size='md'
              type='submit'
              className='flex items-center gap-2 flex-shrink-0'
            >
              <FaSearch />
            </ButtonBase>
          </ConfigurableElement>
          <ConfigurableElement componentId='gestion-contable.mis-ingresos.boton-filtros-mobile' label='Botón Filtros (móvil)'>
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
            <FaFilter className='text-rose-600' />
            <span>Filtros de Búsqueda</span>
          </div>
        }
        placement='right'
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={Math.min(400, window.innerWidth - 40)}
      >
        <div className='flex flex-col gap-4'>
          <LabelBase label='Concepto de Ingreso:'>
            <Form.Item
              name='concepto_ingreso'
              className='!mb-0'
            >
              <Input
                placeholder='Concepto de ingreso...'
                className='w-full'
              />
            </Form.Item>
          </LabelBase>

          <LabelBase label='Búsqueda:'>
            <div className='flex items-center gap-2'>
              <Form.Item
                name='busqueda'
                className='!mb-0 flex-1'
              >
                <Input
                  placeholder='Monto, comentario...'
                  className='w-full'
                />
              </Form.Item>
              <ButtonBase
                color='info'
                size='sm'
                type='submit'
                className='flex items-center gap-1 px-3'
              >
                <FaSearch size={12} />
                BUSCAR
              </ButtonBase>
            </div>
          </LabelBase>

          <LabelBase label='Fecha Desde:'>
            <DatePickerBase
              propsForm={{
                name: 'desde',
                hasFeedback: false,
              }}
              placeholder='Fecha desde'
              formWithMessage={false}
              prefix={<FaCalendar size={15} className='text-rose-600 mx-1' />}
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
              prefix={<FaCalendar size={15} className='text-rose-600 mx-1' />}
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
                // Aplicar filtros con valores por defecto
                const data = {
                  almacen_id,
                  fecha: {
                    gte: toUTCBD({ date: dayjs().subtract(30, 'days').startOf('day') }),
                    lte: toUTCBD({ date: dayjs().endOf('day') }),
                  },
                }
                setFiltros(data)
                setDrawerOpen(false)
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
              BUSCAR
            </ButtonBase>
          </div>
        </div>
      </Drawer>
    </FormBase>
  )
}