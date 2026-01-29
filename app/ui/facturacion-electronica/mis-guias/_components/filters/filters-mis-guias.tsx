'use client'

import { Form } from 'antd'
import { FaCalendar } from 'react-icons/fa6'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import LabelBase from '~/components/form/label-base'
import FormBase from '~/components/form/form-base'
import dayjs, { Dayjs } from 'dayjs'
import { useStoreFiltrosMisGuias } from '../../_store/store-filtros-mis-guias'
import SelectBase from '~/app/_components/form/selects/select-base'

type FormFiltersMisGuias = {
  fecha_desde: Dayjs
  fecha_hasta: Dayjs
  tipo_guia?: string
  afecta_stock?: string // 'true' | 'false'
}

export default function FiltersMisGuias() {
  const [form] = Form.useForm<FormFiltersMisGuias>()
  const setFiltros = useStoreFiltrosMisGuias((store) => store.setFiltros)

  function handleValuesChange(_: any, allValues: FormFiltersMisGuias) {
    setFiltros({
      fecha_desde: allValues.fecha_desde,
      fecha_hasta: allValues.fecha_hasta,
      tipo_guia: allValues.tipo_guia,
      afecta_stock: allValues.afecta_stock,
    })
  }

  return (
    <FormBase<FormFiltersMisGuias>
      form={form}
      name='filters-mis-guias'
      className='flex flex-wrap gap-4'
      onValuesChange={handleValuesChange}
      initialValues={{
        fecha_desde: dayjs().startOf('month'),
        fecha_hasta: dayjs().endOf('month'),
      }}
    >
      <LabelBase label='Desde:' className='w-auto'>
        <DatePickerBase
          propsForm={{
            name: 'fecha_desde',
          }}
          placeholder='Fecha desde'
          className='!w-[160px]'
          prefix={<FaCalendar size={15} className='text-cyan-700 mx-1' />}
        />
      </LabelBase>

      <LabelBase label='Hasta:' className='w-auto'>
        <DatePickerBase
          propsForm={{
            name: 'fecha_hasta',
          }}
          placeholder='Fecha hasta'
          className='!w-[160px]'
          prefix={<FaCalendar size={15} className='text-cyan-700 mx-1' />}
        />
      </LabelBase>

      <LabelBase label='Tipo de Guía:' className='w-auto'>
        <SelectBase
          propsForm={{
            name: 'tipo_guia',
          }}
          placeholder='Todos'
          allowClear
          className='!w-[200px]'
          options={[
            { label: 'Electrónica - Remitente', value: 'ELECTRONICA_REMITENTE' },
            { label: 'Electrónica - Transportista', value: 'ELECTRONICA_TRANSPORTISTA' },
            { label: 'Física', value: 'FISICA' },
          ]}
        />
      </LabelBase>

      <LabelBase label='Afecta Stock:' className='w-auto'>
        <SelectBase
          propsForm={{
            name: 'afecta_stock',
          }}
          placeholder='Todos'
          allowClear
          className='!w-[120px]'
          options={[
            { label: 'Sí', value: 'true' },
            { label: 'No', value: 'false' },
          ]}
        />
      </LabelBase>
    </FormBase>
  )
}
