'use client'

import { Form } from 'antd'
import { FaSearch } from 'react-icons/fa'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import LabelBase from '~/components/form/label-base'
import {
  Almacen,
  Compra,
  EstadoDeCompra,
  Prisma,
  Proveedor,
} from '@prisma/client'
import { FaCalendar } from 'react-icons/fa6'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import SelectProveedores from '~/app/_components/form/selects/select-proveedores'
import SelectTipoDocumento from '~/app/_components/form/selects/select-tipo-documento'
import { Dayjs } from 'dayjs'
import { TipoDocumento } from '@prisma/client'
import { toUTCBD } from '~/utils/fechas'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useStoreAlmacen } from '~/store/store-almacen'
import SelectEstadoDeCompra from '~/app/_components/form/selects/select-estado-de-compra'

interface ValuesFiltersMisCompras {
  almacen_id: Almacen['id']
  proveedor_id?: Proveedor['id']
  desde?: Dayjs
  hasta?: Dayjs
  tipo_documento?: TipoDocumento
  serie?: Compra['serie']
  numero?: Compra['numero']
}

export default function FiltersComprasAnuladasEnEspera({
  setFiltros,
  estado_de_compra,
}: {
  setFiltros: (data: Prisma.CompraWhereInput) => void
  estado_de_compra?: EstadoDeCompra
}) {
  const [form] = Form.useForm<ValuesFiltersMisCompras>()

  const almacen_id = useStoreAlmacen(state => state.almacen_id)

  useEffect(() => {
    const data = {
      almacen_id,
      fecha: {
        gte: toUTCBD({ date: dayjs().startOf('day') }),
        lte: toUTCBD({ date: dayjs().endOf('day') }),
      },
      estado_de_compra,
    } satisfies Prisma.CompraWhereInput
    setFiltros(data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <FormBase
      form={form}
      name='filtros-mi-almacen'
      initialValues={{
        desde: dayjs().startOf('day'),
        hasta: dayjs().endOf('day'),
        estado_de_compra,
      }}
      className='w-full'
      onFinish={values => {
        const { desde, hasta, ...rest } = values
        const data = {
          ...rest,
          fecha: {
            gte: desde ? toUTCBD({ date: desde.startOf('day') }) : undefined,
            lte: hasta ? toUTCBD({ date: hasta.endOf('day') }) : undefined,
          },
        } satisfies Prisma.CompraWhereInput
        setFiltros(data)
      }}
    >
      <div className='flex items-center gap-4'>
        <SelectProveedores
          propsForm={{
            name: 'proveedor_id',
            hasFeedback: false,
            className: '!min-w-[400px] !w-[400px] !max-w-[400px]',
          }}
          className='w-full'
          classIconSearch='!mb-0'
          formWithMessage={false}
          allowClear
          form={form}
        />
        <LabelBase label='Fecha Compra:'>
          <DatePickerBase
            propsForm={{
              name: 'desde',
              hasFeedback: false,
              className: '!min-w-[150px] !w-[150px] !max-w-[150px]',
            }}
            placeholder='Fecha Compra'
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
        <LabelBase label='Tipo Documento:'>
          <SelectTipoDocumento
            propsForm={{
              name: 'tipo_documento',
              hasFeedback: false,
              className: '!min-w-[150px] !w-[150px] !max-w-[150px]',
            }}
            className='w-full'
            formWithMessage={false}
            allowClear
          />
        </LabelBase>
        <SelectEstadoDeCompra
          propsForm={{
            name: 'estado_de_compra',
            hidden: true,
          }}
        />
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
