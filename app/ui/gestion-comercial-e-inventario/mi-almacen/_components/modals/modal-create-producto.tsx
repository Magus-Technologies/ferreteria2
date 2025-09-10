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
import { useStoreArchivosProducto } from '../../store/store-archivos-producto'
import useCreateProducto from '../../_hooks/use-create-producto'
import { useStoreEditOrCopyProducto } from '../../store/store-edit-or-copy-producto'
import { useEffect } from 'react'
import { urlToFile } from '~/utils/upload'
import { useStoreCodigoAutomatico } from '../../store/store-codigo-automatico'

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
  'compra' | 'estado'
> & {
  compra: Omit<FormCreateProductoProps['compra'], 'vencimiento'> & {
    vencimiento?: string
  }
  estado: boolean
}

export default function ModalCreateProducto() {
  const [form] = Form.useForm<FormCreateProductoProps>()

  const open = useStoreEditOrCopyProducto(state => state.openModal)
  const setOpen = useStoreEditOrCopyProducto(state => state.setOpenModal)
  const producto = useStoreEditOrCopyProducto(state => state.producto)
  const setProducto = useStoreEditOrCopyProducto(state => state.setProducto)

  const { crearProductoForm, loading } = useCreateProducto({
    setOpen,
    form,
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
      const producto_almacen = producto_en_almacenes[0]
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
      })
      setDisabled(true)
    }
  }, [form, producto, setFichaTecnicaFile, setImgFile, open, setDisabled])

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
