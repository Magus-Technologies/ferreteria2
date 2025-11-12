/* eslint-disable react-hooks/exhaustive-deps */
import { Form } from 'antd'
import ModalForm from '~/components/modals/modal-form'
import TitleForm from '~/components/form/title-form'
import { getComprasResponseProps } from '~/app/_actions/compra'
import FormTableComprar from '../../crear-compra/_components/form/form-table-comprar'
import { FormCreateCompra } from '../../crear-compra/_components/others/body-comprar'
import { useEffect } from 'react'
import dayjs from 'dayjs'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import { FaCalendar } from 'react-icons/fa'
import useCreateRecepcionAlmacen from '../../_hooks/use-create-recepcion-almacen'
import { useRouter } from 'next/navigation'
import FormCrearRecepcionAlmacen from '../form/form-crear-recepcion-almacen'
import { getNroDocCompra } from '~/app/_utils/get-nro-doc'

export type FormCreateRecepcionAlmacen = Pick<
  FormCreateCompra,
  'productos' | 'fecha'
> & {
  transportista_ruc: string
  transportista_razon_social: string
  transportista_placa: string
  transportista_licencia: string
  transportista_dni: string
  transportista_name: string
  transportista_guia_remision: string
  observaciones: string
}

export default function ModalCrearRecepcionAlmacen({
  open,
  setOpen,
  compra,
  setCompra,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  compra: getComprasResponseProps | undefined
  setCompra: (compra: getComprasResponseProps | undefined) => void
}) {
  const [form] = Form.useForm<FormCreateRecepcionAlmacen>()
  const route = useRouter()

  const nro_doc = getNroDocCompra({ compra })

  const { handleSubmit, loading } = useCreateRecepcionAlmacen({
    compra_id: compra?.id,
    onSuccess: () => {
      setOpen(false)
      setCompra(undefined)
      route.push('/ui/gestion-comercial-e-inventario/mis-recepciones')
    },
  })

  useEffect(() => {
    form.resetFields()
    if (compra) {
      const productos_formateados = compra.productos_por_almacen.flatMap(
        producto_por_almacen =>
          producto_por_almacen.unidades_derivadas.map(unidad_derivada => ({
            producto: producto_por_almacen,
            unidad_derivada: unidad_derivada,
          }))
      )
      form.setFieldValue(
        'productos',
        productos_formateados
          .filter(p => Number(p.unidad_derivada.cantidad_pendiente) > 0)
          .map(p => {
            const producto = p.producto.producto_almacen.producto
            const unidad_derivada = p.unidad_derivada
            return {
              producto_codigo: producto.cod_producto,
              producto_id: producto.id,
              producto_name: producto.name,
              bonificacion: unidad_derivada.bonificacion,
              marca_name: producto.marca.name,
              unidad_derivada_name:
                unidad_derivada.unidad_derivada_inmutable.name,
              unidad_derivada_id: unidad_derivada.unidad_derivada_inmutable.id,
              unidad_derivada_factor: unidad_derivada.factor,
              cantidad: unidad_derivada.cantidad_pendiente,
              cantidad_recepcionada:
                Number(unidad_derivada.cantidad) -
                Number(unidad_derivada.cantidad_pendiente),
              cantidad_pendiente: unidad_derivada.cantidad_pendiente,
              precio_compra:
                Number(p.producto.costo) * Number(unidad_derivada.factor),
              subtotal:
                Number(p.producto.costo) *
                Number(unidad_derivada.factor) *
                Number(unidad_derivada.cantidad),
              flete: unidad_derivada.flete,
              vencimiento: unidad_derivada.vencimiento
                ? dayjs(unidad_derivada.vencimiento)
                : undefined,
              lote: unidad_derivada.lote,
            }
          })
      )
    }
    form.setFieldValue('fecha', dayjs())
  }, [compra])

  useEffect(() => {
    if (!open) setCompra(undefined)
  }, [open])

  return (
    <ModalForm
      modalProps={{
        title: (
          <TitleForm className='!pb-0'>
            <div className='flex gap-4 items-center'>
              <span className='text-nowrap'>
                Recepcionar en Almacén la Compra {nro_doc}
              </span>
              <DatePickerBase
                propsForm={{
                  name: 'fecha',
                  rules: [
                    {
                      required: true,
                      message: 'Por favor, ingresa la fecha',
                    },
                  ],
                }}
                formWithMessage={false}
                placeholder='Fecha'
                className='!w-[160px] !min-w-[160px] !max-w-[160px] font-normal!'
                prefix={<FaCalendar size={15} className='text-rose-700 mx-1' />}
              />
            </div>
          </TitleForm>
        ),
        className: 'min-w-[1430px]',
        wrapClassName: '!flex !items-center',
        centered: true,
        okButtonProps: { loading, disabled: loading },
        okText: 'Recepcionar',
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: handleSubmit,
      }}
    >
      <div className='h-[250px] min-h-[250px]'>
        <FormTableComprar
          form={form}
          incluye_precios={false}
          cantidad_pendiente={true}
        />
      </div>
      <FormCrearRecepcionAlmacen form={form} />
    </ModalForm>
  )
}
