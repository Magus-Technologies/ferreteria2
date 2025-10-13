'use client'

import { Form } from 'antd'
import { FaPlusCircle, FaSearch } from 'react-icons/fa'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import LabelBase from '~/components/form/label-base'
import { Prisma } from '@prisma/client'
import { useStoreFiltrosMisCompras } from '../../_store/store-filtros-mis-compras'
import { FaCalendar, FaCartShopping } from 'react-icons/fa6'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import SelectFormaDePago from '~/app/_components/form/selects/select-forma-de-pago'
import SelectProveedores from '~/app/_components/form/selects/select-proveedores'
import SelectTipoDocumento from '~/app/_components/form/selects/select-tipo-documento'
import SelectUsuarios from '~/app/_components/form/selects/select-usuarios'
import { Dayjs } from 'dayjs'
import { FormaDePago, TipoDocumento } from '@prisma/client'
import { toLocalString } from '~/utils/fechas'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useStoreAlmacen } from '~/store/store-almacen'
import SelectEstadoDeCuenta, {
  EstadoDeCuenta,
} from '~/app/_components/form/selects/select-estado-de-cuenta'

interface ValuesFiltersMisCompras {
  almacen_id: number
  proveedor_id?: number
  desde?: Dayjs
  hasta?: Dayjs
  forma_de_pago?: FormaDePago
  tipo_documento?: TipoDocumento
  user_id?: string
  estado_de_cuenta?: EstadoDeCuenta
}

export default function FiltersMisCompras() {
  const [form] = Form.useForm<ValuesFiltersMisCompras>()

  const almacen_id = useStoreAlmacen(state => state.almacen_id)

  const router = useRouter()

  const setFiltros = useStoreFiltrosMisCompras(state => state.setFiltros)

  useEffect(() => {
    const data = {
      almacen_id,
      created_at: {
        gte: toLocalString({ date: dayjs().startOf('day') }),
        lte: toLocalString({ date: dayjs().endOf('day') }),
      },
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
      }}
      className='w-full'
      onFinish={values => {
        const { desde, hasta, ...rest } = values
        delete rest.estado_de_cuenta
        const data = {
          ...rest,
          created_at: {
            gte: desde ? toLocalString({ date: desde }) : undefined,
            lte: hasta ? toLocalString({ date: hasta }) : undefined,
          },
        } satisfies Prisma.CompraWhereInput
        setFiltros(data)
      }}
    >
      <TituloModulos
        title='Mis Compras'
        icon={<FaCartShopping className='text-cyan-600' />}
        extra={
          <div className='flex items-center gap-6 ml-6'>
            <ButtonBase
              color='success'
              size='lg'
              type='button'
              className='flex items-center gap-2 w-fit'
              onClick={() =>
                router.push(
                  '/ui/gestion-comercial-e-inventario/mis-compras/crear-compra'
                )
              }
            >
              <FaPlusCircle />
              Crear Compra
            </ButtonBase>
            <div className='flex items-center gap-2 font-bold text-2xl'>
              <div className='text-slate-700'>TOTAL:</div>
              <div className='text-slate-900 text-nowrap'>
                S/.{' '}
                {(0).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>
        }
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
          <SelectProveedores
            propsForm={{
              name: 'proveedor_id',
              hasFeedback: false,
              className: '!min-w-[400px] !w-[400px] !max-w-[400px]',
            }}
            size='large'
            className='w-full'
            classIconSearch='!mb-0'
            formWithMessage={false}
            allowClear
            form={form}
          />
        </div>
      </TituloModulos>
      <div className='flex items-center gap-4 mt-4'>
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
        <LabelBase label='Forma de Pago:'>
          <SelectFormaDePago
            propsForm={{
              name: 'forma_de_pago',
              hasFeedback: false,
              className: '!min-w-[150px] !w-[150px] !max-w-[150px]',
            }}
            className='w-full'
            formWithMessage={false}
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
        <LabelBase label='Estado de Cuenta:'>
          <SelectEstadoDeCuenta
            propsForm={{
              name: 'estado_de_cuenta',
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
