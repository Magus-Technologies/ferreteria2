import { Form } from 'antd'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import type {
  Producto,
  ProductoAlmacen,
  ProductoAlmacenUnidadDerivada,
  UnidadDerivada,
  UnidadDerivadaInmutableCompra,
} from '@prisma/client'
import type { Dayjs } from 'dayjs'
import TabsForm from '../tabs/tabs-form'
import { useStoreArchivosProducto } from '../../_store/store-archivos-producto'
import useCreateProducto from '../../_hooks/use-create-producto'
import { useStoreEditOrCopyProducto } from '../../_store/store-edit-or-copy-producto'
import { useEffect } from 'react'
import { urlToFile } from '~/utils/upload'
import { useStoreCodigoAutomatico } from '../../_store/store-codigo-automatico'
import { useStoreAlmacen } from '~/store/store-almacen'

export type UnidadDerivadaCreateProducto = Omit<
  ProductoAlmacenUnidadDerivada,
  'id' | 'producto_almacen_id'
> & {
  costo: number
  p_venta: number
  ganancia: number
  unidad_derivada?: UnidadDerivada
}

export type FormCreateProductoProps = Omit<
  Producto,
  'id' | 'created_at' | 'updated_at' | 'img' | 'ficha_tecnica' | 'estado'
> & {
  producto_almacen: Pick<ProductoAlmacen, 'ubicacion_id'>
  compra: Pick<UnidadDerivadaInmutableCompra, 'lote'> & {
    vencimiento?: Dayjs
    stock_entero?: number
    stock_fraccion?: number
  }
  unidades_derivadas: UnidadDerivadaCreateProducto[]
  almacen_id: number
  estado: number
}

export type FormCreateProductoFormatedProps = Omit<
  FormCreateProductoProps,
  'compra' | 'estado' | 'cod_producto'
> & {
  compra: Omit<FormCreateProductoProps['compra'], 'vencimiento'> & {
    vencimiento?: string
  }
  estado: boolean
  cod_producto?: string
}

export default function ModalCreateProducto({
  onSuccess,
  textDefault,
  setTextDefault,
}: {
  onSuccess?: (res: Producto) => void
  textDefault?: string
  setTextDefault?: (text: string) => void
}) {
  const [form] = Form.useForm<FormCreateProductoProps>()
  const almacen_id = useStoreAlmacen(store => store.almacen_id)

  const open = useStoreEditOrCopyProducto(state => state.openModal)
  const setOpen = useStoreEditOrCopyProducto(state => state.setOpenModal)
  const producto = useStoreEditOrCopyProducto(state => state.producto)
  const setProducto = useStoreEditOrCopyProducto(state => state.setProducto)

  const { crearProductoForm, loading } = useCreateProducto({
    setOpen,
    form,
    onSuccess,
  })

  const setImgFile = useStoreArchivosProducto(state => state.setImgFile)
  const setFichaTecnicaFile = useStoreArchivosProducto(
    state => state.setFichaTecnicaFile
  )

  const setDisabled = useStoreCodigoAutomatico(state => state.setDisabled)

  useEffect(() => {
    form.resetFields()
    if (producto) {
      if (producto.cod_producto) setDisabled(false)
      if (producto.img)
        urlToFile(producto.img).then(file => {
          setImgFile(file)
        })
      else setImgFile(undefined)

      if (producto.ficha_tecnica)
        urlToFile(producto.ficha_tecnica).then(file => {
          setFichaTecnicaFile(file)
        })
      else setFichaTecnicaFile(undefined)

      const { estado, producto_en_almacenes, cod_producto, ...restProducto } =
        producto
      const producto_almacen = producto_en_almacenes.find(
        item => item.almacen_id === almacen_id
      )
      if (!producto_almacen) return
      const costo_unidad = Number(producto_almacen.costo)
      form.setFieldsValue({
        ...restProducto,
        estado: Number(estado),
        producto_almacen,
        unidades_derivadas: producto_almacen.unidades_derivadas.map(item => {
          const { id, producto_almacen_id, ...rest } = item
          const costo = costo_unidad * Number(item.factor)
          const ganancia = Number(item.precio_publico) - costo
          const p_venta = costo != 0 ? (ganancia * 100) / costo : 0
          return {
            ...rest,
            costo,
            p_venta,
            ganancia,
            ...(producto?.id
              ? {
                  id,
                  producto_almacen_id,
                }
              : {}),
          }
        }),
        ...(producto?.id ? { cod_producto } : {}),
      })
    } else {
      form.setFieldsValue({
        unidades_contenidas: 1,
        unidades_derivadas: [],
        estado: 1,
        name: textDefault,
      })
      setDisabled(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [producto])

  return (
    <ModalForm
      modalProps={{
        title: (
          <TitleForm className='!pb-0'>
            {producto?.id ? 'Editar Producto' : 'Agregar Producto'}
          </TitleForm>
        ),
        className: 'min-w-[1300px]',
        wrapClassName: '!flex !items-center',
        centered: true,
        okButtonProps: { loading, disabled: loading },
        okText: producto?.id ? 'Editar' : 'Crear',
      }}
      onCancel={() => {
        setImgFile(undefined)
        setFichaTecnicaFile(undefined)
        setProducto(undefined)
        setDisabled(true)
        setTextDefault?.('')
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: crearProductoForm,
      }}
    >
      <TabsForm form={form} />
    </ModalForm>
  )
}
