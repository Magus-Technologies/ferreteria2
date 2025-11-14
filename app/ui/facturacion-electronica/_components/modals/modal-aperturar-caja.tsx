import { Form } from 'antd'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import dayjs from 'dayjs'
import useAperturarCaja from '../../_hooks/use-aperturar-caja'
import { useSession } from 'next-auth/react'
import ConteoDinero from '../others/conteo-dinero'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import LabelBase from '~/components/form/label-base'

type ModalAperturarCajaProps = {
  open: boolean
  setOpen: (open: boolean) => void
}

export interface AperturarCajaFormValues {
  monto_apertura: number
}

export default function ModalAperturarCaja({
  open,
  setOpen,
}: ModalAperturarCajaProps) {
  const [form] = Form.useForm<AperturarCajaFormValues>()

  const { crearAperturarCaja, loading } = useAperturarCaja({
    onSuccess: () => {
      setOpen(false)
      form.resetFields()
    },
  })

  const { data: session } = useSession()

  return (
    <ModalForm
      modalProps={{
        width: 380,
        classNames: { content: 'min-w-fit' },
        title: <TitleForm>Aperturar Caja</TitleForm>,
        wrapClassName: '!flex !items-center',
        centered: true,
        okButtonProps: { loading, disabled: loading },
        okText: 'Aperturar',
        afterOpenChange: () => form.focusField('cantidad'),
      }}
      onCancel={() => {
        form.resetFields()
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: crearAperturarCaja,
      }}
    >
      <div className='flex items-center justify-around gap-6'>
        <div className='flex items-center gap-2'>
          <div className='font-bold text-slate-500'>Cajero:</div>
          <div className='font-semibold'>{session?.user?.name}</div>
        </div>
        <div className='flex items-center gap-2'>
          <div className='font-bold text-slate-500'>Fecha Actual:</div>
          <div className='font-semibold'>{dayjs().format('DD/MM/YYYY')}</div>
        </div>
      </div>
      <div className='flex items-center gap-2 text-2xl font-bold justify-center mt-4'>
        <div className='text-slate-500'>Saldo Anterior:</div>
        <div
          className={`${
            (session?.user?.efectivo ?? 0) > 0
              ? 'text-emerald-600'
              : 'text-rose-700'
          }`}
        >
          {session?.user?.efectivo.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}
        </div>
      </div>
      <ConteoDinero
        className='mx-auto my-4'
        onChange={value =>
          form.setFieldValue(
            'monto_apertura',
            value + (session?.user?.efectivo ?? 0)
          )
        }
      />
      <LabelBase
        label='SALDO APERTURA:'
        className='!text-2xl justify-center w-fit! mx-auto'
        classNames={{ labelParent: 'mb-7', label: 'font-bold!' }}
      >
        <InputNumberBase
          className='max-w-28'
          size='large'
          propsForm={{
            name: 'monto_apertura',
            rules: [
              {
                required: true,
                message: 'Por favor, ingresa el monto de apertura',
              },
            ],
          }}
        />
      </LabelBase>
    </ModalForm>
  )
}
