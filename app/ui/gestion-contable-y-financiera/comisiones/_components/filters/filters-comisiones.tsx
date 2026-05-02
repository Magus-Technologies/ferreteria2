'use client'

import { Form } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { useEffect } from 'react'
import FormBase from '~/components/form/form-base'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import SelectUsuarios from '~/app/_components/form/selects/select-usuarios'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import { useStoreFiltrosComisiones } from '../../_store/store-filtros-comisiones'
import { FaCalendar } from 'react-icons/fa'
import { GiMoneyStack } from 'react-icons/gi'
import { useStoreAlmacen } from '~/store/store-almacen'

interface Values {
  desde?: Dayjs
  hasta?: Dayjs
  almacen_id?: number
  user_id?: string
}

export default function FiltersComisiones() {
  const [form] = Form.useForm<Values>()
  const filtros = useStoreFiltrosComisiones(s => s.filtros)
  const setFiltros = useStoreFiltrosComisiones(s => s.setFiltros)
  const almacenStore = useStoreAlmacen(s => s.almacen_id)

  useEffect(() => {
    form.setFieldsValue({
      desde: dayjs(filtros.desde),
      hasta: dayjs(filtros.hasta),
      almacen_id: filtros.almacen_id ?? almacenStore,
      user_id: filtros.user_id,
    })
  }, [form, filtros, almacenStore])

  const onValuesChange = (_: unknown, all: Values) => {
    setFiltros({
      desde: all.desde ? all.desde.format('YYYY-MM-DD') : undefined,
      hasta: all.hasta ? all.hasta.format('YYYY-MM-DD') : undefined,
      almacen_id: all.almacen_id,
      user_id: all.user_id,
    })
  }

  return (
    <div className='flex items-center gap-3 flex-wrap'>
      <TituloModulos title='Comisiones' icon={<GiMoneyStack />} />

      <FormBase form={form} onValuesChange={onValuesChange} layout='inline' className='flex-1'>
        <Form.Item name='desde' className='mb-0!'>
          <DatePickerBase
            placeholder='Desde'
            prefix={<FaCalendar className='text-orange-500 mx-1' />}
            className='w-[150px]'
          />
        </Form.Item>
        <Form.Item name='hasta' className='mb-0!'>
          <DatePickerBase
            placeholder='Hasta'
            prefix={<FaCalendar className='text-orange-500 mx-1' />}
            className='w-[150px]'
          />
        </Form.Item>
        <Form.Item name='almacen_id' className='mb-0!'>
          <SelectAlmacen className='min-w-[200px]' allowClear />
        </Form.Item>
        <Form.Item name='user_id' className='mb-0!'>
          <SelectUsuarios className='min-w-[200px]' allowClear placeholder='Todos los vendedores' />
        </Form.Item>
      </FormBase>
    </div>
  )
}
