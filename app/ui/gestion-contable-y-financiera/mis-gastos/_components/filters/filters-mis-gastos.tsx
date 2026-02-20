'use client'

import { Form, Input, Select } from 'antd'
import { FaSearch, FaMoneyBillWave } from 'react-icons/fa'
import { FaCalendar } from 'react-icons/fa6'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import LabelBase from '~/components/form/label-base'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useEffect, useMemo } from 'react'
import { useStoreFiltrosMisGastos } from '../../_store/store-filtros-mis-gastos'
import TotalMisGastos from '../others/total-mis-gastos'

interface ValuesFiltersMisGastos {
  fechaDesde?: Dayjs
  fechaHasta?: Dayjs
  motivoGasto?: string
  cajeroRegistra?: string
  sucursal?: string
  busqueda?: string
}

export default function FiltersMisGastos() {
  const [form] = Form.useForm<ValuesFiltersMisGastos>()

  const setFiltros = useStoreFiltrosMisGastos(state => state.setFiltros)

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    const values = form.getFieldsValue()
    let count = 0
    if (values.fechaDesde) count++
    if (values.fechaHasta) count++
    if (values.motivoGasto) count++
    if (values.cajeroRegistra) count++
    if (values.sucursal) count++
    if (values.busqueda) count++
    return count
  }, [form])

  useEffect(() => {
    const data = {
      fechaDesde: dayjs().subtract(30, 'days').startOf('day').format('YYYY-MM-DD'),
      fechaHasta: dayjs().endOf('day').format('YYYY-MM-DD'),
    }
    setFiltros(data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <FormBase
      form={form}
      name='filtros-mis-gastos'
      initialValues={{
        fechaDesde: dayjs().subtract(30, 'days').startOf('day'),
        fechaHasta: dayjs().endOf('day'),
      }}
      className='w-full'
      onFinish={values => {
        const {
          fechaDesde,
          fechaHasta,
          ...rest
        } = values
        
        const data = {
          fechaDesde: fechaDesde?.format('YYYY-MM-DD'),
          fechaHasta: fechaHasta?.format('YYYY-MM-DD'),
          ...rest,
        }
        setFiltros(data)
      }}
    >
      <TituloModulos
        title='Gastos Operativos'
        icon={<FaMoneyBillWave className='text-rose-600' />}
      />

      {/* Filtros principales - Responsivos */}
      <div className='flex items-center gap-2 w-full mt-4 overflow-x-auto'>
        {/* Desktop: Mostrar todos los filtros en una sola fila */}
        <div className='hidden lg:flex items-end gap-3 flex-nowrap min-w-max w-full'>
          <ConfigurableElement componentId='gestion-contable.mis-gastos.filtro-fecha-desde' label='Filtro Fecha Desde'>
            <LabelBase label='Fecha gasto:'>
              <DatePickerBase
                propsForm={{
                  name: 'fechaDesde',
                  hasFeedback: false,
                  className: '!min-w-[140px] !w-[140px] !max-w-[140px]',
                }}
                placeholder='Desde'
                formWithMessage={false}
                prefix={<FaCalendar size={15} className='text-rose-600 mx-1' />}
                allowClear
              />
            </LabelBase>
          </ConfigurableElement>

          <ConfigurableElement componentId='gestion-contable.mis-gastos.filtro-fecha-hasta' label='Filtro Fecha Hasta'>
            <LabelBase label='Hasta:'>
              <DatePickerBase
                propsForm={{
                  name: 'fechaHasta',
                  hasFeedback: false,
                  className: '!min-w-[140px] !w-[140px] !max-w-[140px]',
                }}
                placeholder='Hasta'
                formWithMessage={false}
                prefix={<FaCalendar size={15} className='text-rose-600 mx-1' />}
                allowClear
              />
            </LabelBase>
          </ConfigurableElement>

          <ConfigurableElement componentId='gestion-contable.mis-gastos.filtro-motivo' label='Filtro Motivo de Gasto'>
            <LabelBase label='Motivo de gasto:'>
              <Form.Item name='motivoGasto' className='!mb-0'>
                <Input
                  placeholder='Motivo de gasto'
                  className='!min-w-[150px] !w-[150px] !max-w-[150px] !h-[32px]'
                />
              </Form.Item>
            </LabelBase>
          </ConfigurableElement>

          <ConfigurableElement componentId='gestion-contable.mis-gastos.filtro-cajero' label='Filtro Cajero Registra'>
            <LabelBase label='Cajero Registra:'>
              <Form.Item name='cajeroRegistra' className='!mb-0'>
                <Select
                  placeholder='EFRAIN'
                  className='!min-w-[140px] !w-[140px] !max-w-[140px]'
                  options={[
                    { label: 'EFRAIN', value: 'EFRAIN' },
                    { label: 'ADMIN', value: 'ADMIN' },
                    { label: 'VENDEDOR', value: 'VENDEDOR' },
                  ]}
                  allowClear
                />
              </Form.Item>
            </LabelBase>
          </ConfigurableElement>

          <ConfigurableElement componentId='gestion-contable.mis-gastos.filtro-sucursal' label='Filtro Sucursal'>
            <LabelBase label='Sucursal:'>
              <Form.Item name='sucursal' className='!mb-0'>
                <Select
                  placeholder='MI REDENTOR'
                  className='!min-w-[140px] !w-[140px] !max-w-[140px]'
                  options={[
                    { label: 'MI REDENTOR', value: 'MI REDENTOR' },
                    { label: 'PRINCIPAL', value: 'PRINCIPAL' },
                  ]}
                  allowClear
                />
              </Form.Item>
            </LabelBase>
          </ConfigurableElement>

          <ConfigurableElement componentId='gestion-contable.mis-gastos.boton-buscar' label='Botón Buscar'>
            <ButtonBase
              type='submit'
              color='info'
              size='sm'
              className='flex items-center gap-1 px-2 !h-[32px]'
            >
              <FaSearch size={12} />
              BUSCAR
            </ButtonBase>
          </ConfigurableElement>
        </div>

        {/* Mobile/Tablet: Solo botón buscar */}
        <div className='flex lg:hidden items-center gap-2 w-full'>
          <div className='flex-1'></div>
          <ConfigurableElement componentId='gestion-contable.mis-gastos.boton-buscar-mobile' label='Botón Buscar (móvil)'>
            <ButtonBase
              type='submit'
              color='info'
              size='md'
              className='flex items-center gap-2 flex-shrink-0'
            >
              <FaSearch />
              BUSCAR
            </ButtonBase>
          </ConfigurableElement>
        </div>
      </div>
    </FormBase>
  )
}