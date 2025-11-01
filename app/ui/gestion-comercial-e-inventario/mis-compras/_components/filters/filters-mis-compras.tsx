'use client'

import { Form } from 'antd'
import { FaPlusCircle, FaSearch } from 'react-icons/fa'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import FormBase from '~/components/form/form-base'
import LabelBase from '~/components/form/label-base'
import { EstadoDeCompra, Prisma } from '@prisma/client'
import { useStoreFiltrosMisCompras } from '../../_store/store-filtros-mis-compras'
import { FaCalendar, FaCartShopping } from 'react-icons/fa6'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import SelectFormaDePago from '~/app/_components/form/selects/select-forma-de-pago'
import SelectProveedores from '~/app/_components/form/selects/select-proveedores'
import SelectTipoDocumento from '~/app/_components/form/selects/select-tipo-documento'
import SelectUsuarios from '~/app/_components/form/selects/select-usuarios'
import { Dayjs } from 'dayjs'
import { FormaDePago, TipoDocumento } from '@prisma/client'
import { toUTCBD } from '~/utils/fechas'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useStoreAlmacen } from '~/store/store-almacen'
import SelectEstadoDeCuenta, {
  EstadoDeCuenta,
} from '~/app/_components/form/selects/select-estado-de-cuenta'
import TotalCompras from '../others/total-compras'
import Link from 'next/link'
import SelectEstadoDeCompra, {
  EstadoDeCompraSelect,
} from '~/app/_components/form/selects/select-estado-de-compra'
import SelectPendienteDeRecepcionAlmacen from '~/app/_components/form/selects/select-pendiente-de-recepcion-almacen'

interface ValuesFiltersMisCompras {
  almacen_id: number
  proveedor_id?: number
  desde?: Dayjs
  hasta?: Dayjs
  forma_de_pago?: FormaDePago
  tipo_documento?: TipoDocumento
  user_id?: string
  estado_de_cuenta?: EstadoDeCuenta
  estado_de_compra?: EstadoDeCompra
  pendiente_de_recepcion?: EstadoDeCompra
}

export default function FiltersMisCompras() {
  const [form] = Form.useForm<ValuesFiltersMisCompras>()

  const almacen_id = useStoreAlmacen(state => state.almacen_id)

  const setFiltros = useStoreFiltrosMisCompras(state => state.setFiltros)

  useEffect(() => {
    const data = {
      almacen_id,
      fecha: {
        gte: toUTCBD({ date: dayjs().startOf('day') }),
        lte: toUTCBD({ date: dayjs().endOf('day') }),
      },
      estado_de_compra: {
        in: [EstadoDeCompra.Creado, EstadoDeCompra.Procesado],
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
        estado_de_compra: EstadoDeCompraSelect.Activos,
      }}
      className='w-full'
      onFinish={values => {
        const {
          desde,
          hasta,
          estado_de_compra,
          pendiente_de_recepcion,
          ...rest
        } = values
        delete rest.estado_de_cuenta
        const data = {
          ...rest,
          fecha: {
            gte: desde ? toUTCBD({ date: desde.startOf('day') }) : undefined,
            lte: hasta ? toUTCBD({ date: hasta.endOf('day') }) : undefined,
          },
          ...(pendiente_de_recepcion
            ? { estado_de_compra: pendiente_de_recepcion }
            : estado_de_compra
            ? {
                estado_de_compra:
                  estado_de_compra === EstadoDeCompraSelect.Activos
                    ? {
                        in: [EstadoDeCompra.Creado, EstadoDeCompra.Procesado],
                      }
                    : estado_de_compra,
              }
            : {}),
        } satisfies Prisma.CompraWhereInput
        setFiltros(data)
      }}
    >
      <TituloModulos
        title='Mis Compras'
        icon={<FaCartShopping className='text-cyan-600' />}
        extra={
          <div className='flex items-center gap-6 ml-6'>
            <Link href='/ui/gestion-comercial-e-inventario/mis-compras/crear-compra'>
              <ButtonBase
                color='success'
                size='lg'
                type='button'
                className='flex items-center gap-2 w-fit'
              >
                <FaPlusCircle />
                Crear Compra
              </ButtonBase>
            </Link>
            <TotalCompras />
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
      </div>
      <div className='flex items-center gap-4 mt-4'>
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
        <LabelBase label='Estado de Compra:'>
          <SelectEstadoDeCompra
            propsForm={{
              name: 'estado_de_compra',
              hasFeedback: false,
              className: '!min-w-[150px] !w-[150px] !max-w-[150px]',
            }}
            className='w-full'
            formWithMessage={false}
            allowClear
          />
        </LabelBase>
        <LabelBase label='Pendiente de Recepción:'>
          <SelectPendienteDeRecepcionAlmacen
            propsForm={{
              name: 'pendiente_de_recepcion',
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
