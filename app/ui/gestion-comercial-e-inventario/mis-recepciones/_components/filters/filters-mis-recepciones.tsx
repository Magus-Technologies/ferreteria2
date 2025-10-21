'use client'

import { Form } from 'antd'
import { FaSearch, FaTruckLoading } from 'react-icons/fa'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import LabelBase from '~/components/form/label-base'
import { Almacen, Prisma } from '@prisma/client'
import { FaCalendar } from 'react-icons/fa6'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import SelectUsuarios from '~/app/_components/form/selects/select-usuarios'
import { Dayjs } from 'dayjs'
import { toUTCBD } from '~/utils/fechas'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useStoreAlmacen } from '~/store/store-almacen'
import { useStoreFiltrosMisRecepciones } from '../../_store/store-filtros-mis-recepciones'

interface ValuesFiltersMisRecepciones {
  almacen_id: Almacen['id']
  desde?: Dayjs
  hasta?: Dayjs
  user_id?: string
}

export default function FiltersMisRecepciones() {
  const [form] = Form.useForm<ValuesFiltersMisRecepciones>()

  const almacen_id = useStoreAlmacen(state => state.almacen_id)

  const setFiltros = useStoreFiltrosMisRecepciones(state => state.setFiltros)

  useEffect(() => {
    const data = {
      compra: {
        almacen_id,
      },
      fecha: {
        gte: toUTCBD({ date: dayjs().startOf('day') }),
        lte: toUTCBD({ date: dayjs().endOf('day') }),
      },
    } satisfies Prisma.RecepcionAlmacenWhereInput
    setFiltros(data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <FormBase
      form={form}
      name='filtros-mis-recepciones'
      initialValues={{
        desde: dayjs().startOf('day'),
        hasta: dayjs().endOf('day'),
      }}
      className='w-full'
      onFinish={values => {
        const { desde, hasta, ...rest } = values
        const data = {
          ...rest,
          fecha: {
            gte: desde ? toUTCBD({ date: desde }) : undefined,
            lte: hasta ? toUTCBD({ date: hasta }) : undefined,
          },
        } satisfies Prisma.RecepcionAlmacenWhereInput
        setFiltros(data)
      }}
    >
      <TituloModulos
        title='Mis Recepciones'
        icon={<FaTruckLoading className='text-cyan-600' />}
      >
        <div className='flex items-center gap-4'>
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
        </div>
      </TituloModulos>
      <div className='flex items-center gap-4 mt-4'>
        <LabelBase label='Desde:'>
          <DatePickerBase
            propsForm={{
              name: 'desde',
              hasFeedback: false,
              className: '!min-w-[150px] !w-[150px] !max-w-[150px]',
            }}
            placeholder='Desde'
            formWithMessage={false}
            prefix={<FaCalendar size={15} className='text-cyan-600 mx-1' />}
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
            prefix={<FaCalendar size={15} className='text-cyan-600 mx-1' />}
            allowClear
          />
        </LabelBase>
        <LabelBase label='Usuario:'>
          <SelectUsuarios
            propsForm={{
              name: 'user_id',
              hasFeedback: false,
              className: '!min-w-[150px] !w-[150px] !max-w-[150px]',
            }}
            className='w-full'
            formWithMessage={false}
            allowClear
          />
        </LabelBase>
        <ButtonBase
          color='info'
          size='md'
          type='submit'
          className='flex items-center gap-2 w-fit'
        >
          <FaSearch />
          Buscar
        </ButtonBase>
      </div>
    </FormBase>
  )
}
