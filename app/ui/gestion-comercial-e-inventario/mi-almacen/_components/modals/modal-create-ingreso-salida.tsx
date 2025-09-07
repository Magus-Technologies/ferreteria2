import { Form } from 'antd'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import LabelBase from '~/components/form/label-base'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import FormSelectUnidadDerivadaProducto from '../form/form-select-unidad-derivada-producto'
import { FaCalendar } from 'react-icons/fa'
import type { Dayjs } from 'dayjs'
import {
  Almacen,
  Producto,
  Proveedor,
  TipoIngresoSalida,
  UnidadDerivada,
} from '@prisma/client'
import useCreateIngresoSalida from '../../_hooks/use-create-ingreso-salida'
import { IngresoSalidaEnum } from '~/app/_lib/tipos-ingresos-salidas'

export type FormCreateIngresoSalidaProps = {
  fecha?: Dayjs
  almacen_id: Almacen['id']
  producto_id: Producto['id']
  unidad_derivada_id: UnidadDerivada['id']
  cantidad: number
  proveedor_id: Proveedor['id']
  tipo_ingreso_id: TipoIngresoSalida['id']
  descripcion?: string
}

export type FormCreateIngresoSalidaFormatedProps = Omit<
  FormCreateIngresoSalidaProps,
  'fecha'
> & {
  fecha?: string
  tipo: IngresoSalidaEnum
}

type ModalCreateIngresoSalidaProps = {
  tipo: IngresoSalidaEnum
  open: boolean
  setOpen: (open: boolean) => void
}

export default function ModalCreateIngresoSalida({
  tipo,
  open,
  setOpen,
}: ModalCreateIngresoSalidaProps) {
  const [form] = Form.useForm()

  const { crearIngresoSalidaForm, loading } = useCreateIngresoSalida({
    setOpen,
    form,
    tipo,
  })

  return (
    <ModalForm
      modalProps={{
        title: (
          <TitleForm>
            Crear {tipo === IngresoSalidaEnum.ingreso ? 'Ingreso' : 'Salida'}
          </TitleForm>
        ),
        className: 'min-w-[600px]',
        wrapClassName: '!flex !items-center',
        centered: true,
        okButtonProps: { loading, disabled: loading },
        okText: 'Crear',
      }}
      onCancel={() => {
        form.resetFields()
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: crearIngresoSalidaForm,
      }}
    >
      <div className='flex gap-4 items-center justify-center'>
        <LabelBase
          label='Fecha:'
          className='w-full'
          classNames={{ labelParent: 'mb-6' }}
        >
          <DatePickerBase
            prefix={<FaCalendar className='text-cyan-600 mx-1' />}
            propsForm={{
              name: 'fecha',
            }}
            placeholder='Fecha'
          />
        </LabelBase>
        <LabelBase
          label='Almacén:'
          className='w-full'
          classNames={{ labelParent: 'mb-6' }}
        >
          <SelectAlmacen
            size='middle'
            className='w-full'
            classNameIcon='text-rose-700 mx-1'
            propsForm={{
              name: 'almacen_id',
              rules: [
                {
                  required: true,
                  message: 'Por favor, selecciona un Almacén',
                },
              ],
            }}
            form={form}
          />
        </LabelBase>
      </div>
      <FormSelectUnidadDerivadaProducto tipo={tipo} form={form} open={open} />
    </ModalForm>
  )
}
