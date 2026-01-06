'use client'

import { Form } from 'antd'
import { FaSearch } from 'react-icons/fa'
import { MdPointOfSale } from 'react-icons/md'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import SelectClientes from '~/app/_components/form/selects/select-clientes'
import { FaCalendar } from 'react-icons/fa6'
import dayjs, { Dayjs } from 'dayjs'
import { useEffect } from 'react'
import { useStoreAlmacen } from '~/store/store-almacen'
import InputBase from '~/app/_components/form/inputs/input-base'
import SelectBase from '~/app/_components/form/selects/select-base'
import { TipoOperacion, EstadoPrestamo } from '~/lib/api/prestamo'

interface ValuesFiltersMisPrestamos {
  almacen_id: number
  cliente_id?: number
  desde?: Dayjs
  hasta?: Dayjs
  numero?: string
  tipo_operacion?: TipoOperacion
  estado_prestamo?: EstadoPrestamo
}

export default function FiltersMisPrestamos() {
  const [form] = Form.useForm<ValuesFiltersMisPrestamos>()
  const almacen_id = useStoreAlmacen((state) => state.almacen_id)

  useEffect(() => {
    form.setFieldValue('almacen_id', almacen_id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [almacen_id])

  return (
    <FormBase
      form={form}
      name='filtros-mis-prestamos'
      initialValues={{
        desde: dayjs().startOf('month'),
        hasta: dayjs().endOf('day'),
      }}
      className='w-full'
      onFinish={(values) => {
        console.log('Filtros:', values)
        // Aquí irá la lógica de filtrado
      }}
    >
      <TituloModulos
        title='Mis Prestamos'
        icon={<MdPointOfSale className='text-amber-600' />}
      >
        <SelectAlmacen
          propsForm={{
            name: 'almacen_id',
            hasFeedback: false,
            className: '!min-w-[220px] !w-[220px] !max-w-[220px]',
            rules: [{ required: true, message: '' }],
          }}
          className='w-full'
          formWithMessage={false}
          form={form}
        />
      </TituloModulos>

      {/* Filtros con labels inline */}
      <div className='mt-4 space-y-2.5'>
        {/* Fila 1: Fecha Desde, Hasta, Cliente */}
        <div className='flex items-center gap-3 flex-wrap'>
          <div className='flex items-center gap-2'>
            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
              Fecha Desde:
            </label>
            <DatePickerBase
              propsForm={{
                name: 'desde',
                hasFeedback: false,
                className: '!w-[150px]',
              }}
              placeholder='Fecha Desde'
              formWithMessage={false}
              prefix={<FaCalendar size={15} className='text-amber-600 mx-1' />}
              allowClear
            />
          </div>
          <div className='flex items-center gap-2'>
            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
              Hasta:
            </label>
            <DatePickerBase
              propsForm={{
                name: 'hasta',
                hasFeedback: false,
                className: '!w-[150px]',
              }}
              placeholder='Hasta'
              formWithMessage={false}
              prefix={<FaCalendar size={15} className='text-amber-600 mx-1' />}
              allowClear
            />
          </div>
          <div className='flex items-center gap-2'>
            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
              Cliente:
            </label>
            <SelectClientes
              propsForm={{
                name: 'cliente_id',
                hasFeedback: false,
                className: '!w-[350px]',
              }}
              className='w-full'
              classIconSearch='!mb-0'
              formWithMessage={false}
              allowClear
              form={form}
              placeholder='Todos los clientes'
            />
          </div>
          <div className='flex items-center gap-2'>
            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
              N° Préstamo:
            </label>
            <InputBase
              uppercase={true}
              propsForm={{
                name: 'numero',
                hasFeedback: false,
                className: '!w-[100px]',
              }}
              placeholder='PRE-2025-001'
              formWithMessage={false}
            />
          </div>
          <div className='flex items-center gap-2'>
            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
              Operación:
            </label>
            <SelectBase
              propsForm={{
                name: 'tipo_operacion',
                hasFeedback: false,
                className: '!w-[100px]',
              }}
              placeholder='Todas'
              formWithMessage={false}
              allowClear
              options={[
                { value: TipoOperacion.PRESTAR, label: 'PRESTAR' },
                { value: TipoOperacion.PEDIR_PRESTADO, label: 'PEDIR PRESTADO' },
              ]}
            />
          </div>
          <div className='flex items-center gap-2'>
            <label className='text-xs font-semibold text-gray-700 whitespace-nowrap'>
              Estado:
            </label>
            <SelectBase
              propsForm={{
                name: 'estado_prestamo',
                hasFeedback: false,
                className: '!w-[140px]',
              }}
              placeholder='Todos'
              formWithMessage={false}
              allowClear
              options={[
                { value: EstadoPrestamo.PENDIENTE, label: 'PENDIENTE' },
                { value: EstadoPrestamo.PAGADO_PARCIAL, label: 'PAGADO PARCIAL' },
                { value: EstadoPrestamo.PAGADO_TOTAL, label: 'PAGADO TOTAL' },
                { value: EstadoPrestamo.VENCIDO, label: 'VENCIDO' },
              ]}
            />
          </div>
          <ButtonBase
            color='info'
            size='md'
            type='submit'
            className='flex items-center gap-2'
          >
            <FaSearch />
            Buscar
          </ButtonBase>
        </div>

        {/* Fila 2: N° Préstamo, Operación, Estado, Botón Buscar */}
        <div className='flex items-center gap-3 flex-wrap'>
          
        </div>
      </div>
    </FormBase>
  )
}
