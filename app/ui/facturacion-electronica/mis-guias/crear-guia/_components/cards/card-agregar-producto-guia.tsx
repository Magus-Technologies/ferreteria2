'use client'

import { Form, App } from 'antd'
import { useEffect } from 'react'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import FormBase from '~/components/form/form-base'
import LabelBase from '~/components/form/label-base'
import { useStoreProductoSeleccionadoSearch } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search'
import { useStoreProductoAgregadoGuia } from '../../_store/store-producto-agregado-guia'
import { useStoreAlmacen } from '~/store/store-almacen'
import SelectBase from '~/app/_components/form/selects/select-base'
import { FaBoxes, FaPlusCircle, FaWeightHanging } from 'react-icons/fa'
import ButtonBase from '~/components/buttons/button-base'

type FormCardAgregarProductoGuia = {
  unidad_derivada_id: number
  cantidad: number
  costo: number
  precio_venta: number
}

export default function CardAgregarProductoGuia({
  setOpen,
  withMasYSalir = false,
}: {
  setOpen: (value: boolean) => void
  withMasYSalir?: boolean
}) {
  const [form] = Form.useForm<FormCardAgregarProductoGuia>()
  const { notification } = App.useApp()

  const productoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    (store) => store.producto
  )
  const setProductoAgregadoGuiaStore = useStoreProductoAgregadoGuia(
    (store) => store.setProductoAgregado
  )
  const almacen_id = useStoreAlmacen((store) => store.almacen_id)

  const unidad_derivada_id = Form.useWatch('unidad_derivada_id', form)

  // Obtener el producto en el almacén actual
  const producto_en_almacen =
    productoSeleccionadoSearchStore?.producto_en_almacenes?.find(
      (item) => item.almacen_id === almacen_id
    )
  const unidades_derivadas = producto_en_almacen?.unidades_derivadas

  useEffect(() => {
    if (unidad_derivada_id && unidades_derivadas) {
      const unidad_derivada = unidades_derivadas.find(
        (u) => u.unidad_derivada.id === unidad_derivada_id
      )
      if (unidad_derivada) {
        form.setFieldsValue({
          costo: Number((unidad_derivada as any).costo ?? 0),
          precio_venta: Number((unidad_derivada as any).precio_publico ?? 0),
        })
      }
    }
  }, [unidad_derivada_id, unidades_derivadas, form])

  // Autoseleccionar primera unidad derivada
  useEffect(() => {
    const primeraUnidad = unidades_derivadas?.[0]?.unidad_derivada?.id
    if (primeraUnidad) {
      form.setFieldValue('unidad_derivada_id', primeraUnidad)
    }
  }, [unidades_derivadas, form])

  function handleOk(closeModal?: boolean) {
    const values = form.getFieldsValue()
    if (!productoSeleccionadoSearchStore) return
    if (!values.cantidad || !values.unidad_derivada_id) {
      return notification.error({
        message: 'Complete todos los campos obligatorios',
      })
    }

    const unidad_derivada = unidades_derivadas?.find(
      (u) => u.unidad_derivada.id === values.unidad_derivada_id
    )

    if (!unidad_derivada) return

    setProductoAgregadoGuiaStore({
      producto_id: productoSeleccionadoSearchStore.id,
      producto_name: productoSeleccionadoSearchStore.name,
      producto_codigo: productoSeleccionadoSearchStore.cod_producto,
      marca_name: productoSeleccionadoSearchStore.marca?.name ?? '',
      unidad_derivada_id: unidad_derivada.unidad_derivada.id,
      unidad_derivada_name: unidad_derivada.unidad_derivada.name,
      unidad_derivada_factor: Number((unidad_derivada as any).factor),
      cantidad: values.cantidad,
      costo: values.costo,
      precio_venta: values.precio_venta,
    })

    form.resetFields()
    if (closeModal) setOpen(false)
  }

  return (
    <FormBase<FormCardAgregarProductoGuia>
      form={form}
      name='card-agregar-producto-guia'
      onFinish={() => handleOk(true)}
      className='flex flex-col gap-4'
      initialValues={{
        cantidad: 1,
        costo: 0,
        precio_venta: 0,
      }}
    >
      <LabelBase label='Cantidad:' orientation='column'>
        <InputNumberBase
          propsForm={{
            name: 'cantidad',
            rules: [
              {
                required: true,
                message: 'Ingresa la cantidad',
              },
            ],
          }}
          placeholder='Cantidad'
          prefix={<FaBoxes size={15} className='text-cyan-700 mx-1' />}
          min={0.01}
          precision={2}
          className='w-full'
          autoFocus
        />
      </LabelBase>

      <LabelBase label='Unidad Derivada:' orientation='column'>
        <SelectBase
          propsForm={{
            name: 'unidad_derivada_id',
            rules: [
              {
                required: true,
                message: 'Selecciona una unidad derivada',
              },
            ],
          }}
          placeholder='Unidad Derivada'
          prefix={<FaWeightHanging size={15} className='text-cyan-700 mx-1' />}
          className='w-full'
          options={
            unidades_derivadas?.map((item) => ({
              value: item.unidad_derivada.id,
              label: item.unidad_derivada.name,
            })) || []
          }
        />
      </LabelBase>

      <LabelBase label='Costo:' orientation='column'>
        <InputNumberBase
          propsForm={{
            name: 'costo',
          }}
          prefix='S/. '
          min={0}
          precision={4}
          className='w-full'
        />
      </LabelBase>

      <LabelBase label='Precio Venta:' orientation='column'>
        <InputNumberBase
          propsForm={{
            name: 'precio_venta',
          }}
          prefix='S/. '
          min={0}
          precision={4}
          className='w-full'
          readOnly
        />
      </LabelBase>

      {withMasYSalir ? (
        <div className='flex items-center justify-between gap-2'>
          <ButtonBase
            color='success'
            className='flex items-center justify-center gap-3 !rounded-md w-full h-full text-balance px-4! hover:!scale-100'
            onClick={() => handleOk(false)}
          >
            <FaPlusCircle className='min-w-fit' size={12} /> Más
          </ButtonBase>
          <ButtonBase
            color='warning'
            className='flex items-center justify-center gap-3 !rounded-md w-full h-full text-nowrap px-4! hover:!scale-100'
            onClick={() => handleOk(true)}
          >
            <FaPlusCircle className='min-w-fit' size={12} /> Más y Salir
          </ButtonBase>
        </div>
      ) : (
        <button
          type='submit'
          className='w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded transition-colors'
        >
          Agregar
        </button>
      )}
    </FormBase>
  )
}
