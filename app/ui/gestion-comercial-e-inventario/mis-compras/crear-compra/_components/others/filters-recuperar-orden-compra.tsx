import { Form } from 'antd'
import { FaSearch } from 'react-icons/fa'
import { FaCalendar } from 'react-icons/fa6'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import LabelBase from '~/components/form/label-base'
import SelectProveedores from '~/app/_components/form/selects/select-proveedores'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import { Dayjs } from 'dayjs'
import { type OrdenCompraFilters } from '~/lib/api/orden-compra'
import dayjs from 'dayjs'

interface ValuesFiltersRecuperarOrdenCompra {
  proveedor_id?: number
  desde?: Dayjs
  hasta?: Dayjs
}

interface FiltersRecuperarOrdenCompraProps {
  setFiltros: (data: OrdenCompraFilters) => void
}

export default function FiltersRecuperarOrdenCompra({
  setFiltros,
}: FiltersRecuperarOrdenCompraProps) {
  const [form] = Form.useForm<ValuesFiltersRecuperarOrdenCompra>()

  return (
    <FormBase
      form={form}
      name='filters-recuperar-orden-compra'
      initialValues={{
        desde: dayjs().startOf('day'),
        hasta: dayjs().endOf('day'),
      }}
      className='w-full'
      onFinish={values => {
        const { desde, hasta, ...rest } = values
        const data = {
          ...rest,
          desde: desde ? desde.format('YYYY-MM-DD') : undefined,
          hasta: hasta ? hasta.format('YYYY-MM-DD') : undefined,
          estado: 'pendiente', // Solo órdenes pendientes
        } satisfies OrdenCompraFilters
        setFiltros(data)
      }}
    >
      <div className='flex flex-wrap items-center gap-3'>
        <LabelBase label='Proveedor:'>
          <SelectProveedores
            propsForm={{
              name: 'proveedor_id',
              hasFeedback: false,
              className: '!min-w-[300px] !w-[300px] !max-w-[300px]',
            }}
            size='large'
            className='w-full'
            classIconSearch='!mb-0'
            formWithMessage={false}
            allowClear
            form={form}
          />
        </LabelBase>

        <LabelBase label='Desde:'>
          <DatePickerBase
            propsForm={{
              name: 'desde',
              hasFeedback: false,
              className: '!min-w-[150px] !w-[150px] !max-w-[150px]',
            }}
            placeholder='Desde'
            formWithMessage={false}
            prefix={<FaCalendar size={15} className='text-orange-600 mx-1' />}
            allowClear
          />
        </LabelBase>

        <LabelBase label='Hasta:'>
          <DatePickerBase
            propsForm={{
              name: 'hasta',
              hasFeedback: false,
              className: '!min-w-[150px] !w-[150px] !max-w-[150px]',
            }}
            placeholder='Hasta'
            formWithMessage={false}
            prefix={<FaCalendar size={15} className='text-orange-600 mx-1' />}
            allowClear
          />
        </LabelBase>

        <ButtonBase
          color='warning'
          size='md'
          type='submit'
          className='flex items-center gap-2 mt-6'
        >
          <FaSearch />
          Buscar
        </ButtonBase>
      </div>
    </FormBase>
  )
}
