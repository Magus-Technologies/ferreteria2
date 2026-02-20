import { Form } from 'antd'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import type {
  ProductoAlmacen,
  ProductoAlmacenUnidadDerivada,
  UnidadDerivada,
  UnidadDerivadaInmutableCompra,
} from '@prisma/client'
import type { Producto } from '~/app/_types/producto'
import type { Dayjs } from 'dayjs'
import TabsForm from '../tabs/tabs-form'
import { useStoreArchivosProducto } from '../../_store/store-archivos-producto'
import useCreateProducto from '../../_hooks/use-create-producto'
import { useStoreEditOrCopyProducto } from '../../_store/store-edit-or-copy-producto'
import { useEffect } from 'react'
import { getStorageUrl } from '~/utils/upload'
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

  const resetArchivos = useStoreArchivosProducto(state => state.resetArchivos)
  const setImgUrlExistente = useStoreArchivosProducto(state => state.setImgUrlExistente)
  const setFichaTecnicaUrlExistente = useStoreArchivosProducto(state => state.setFichaTecnicaUrlExistente)

  const setDisabled = useStoreCodigoAutomatico(state => state.setDisabled)

  useEffect(() => {
    if (!open) return
    
    // Limpiar la validación del código cuando se abre el modal
    setDisabled(true)
    
    if (producto) {
      if (producto.cod_producto) setDisabled(false)

      // Guardar URLs existentes para preview (no descargar como File)
      if (producto.img) {
        setImgUrlExistente(getStorageUrl(producto.img) || undefined)
      } else {
        setImgUrlExistente(undefined)
      }

      if (producto.ficha_tecnica) {
        setFichaTecnicaUrlExistente(getStorageUrl(producto.ficha_tecnica) || undefined)
      } else {
        setFichaTecnicaUrlExistente(undefined)
      }

      const { estado, producto_en_almacenes, cod_producto, ...restProducto } =
        producto
      const producto_almacen = producto_en_almacenes.find(
        item => item.almacen_id === almacen_id
      )
      if (!producto_almacen) return
      const costo_unidad = Number(producto_almacen.costo)
      
      // Resetear el form primero para limpiar el estado anterior
      form.resetFields()
      
      // Usar setTimeout para asegurar que el reseteo se complete antes de setear los valores
      setTimeout(() => {
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
            }
          }),
          ...(producto?.id ? { cod_producto } : {}),
        })
      }, 0)
    } else {
      form.resetFields()
      form.setFieldsValue({
        unidades_contenidas: 1,
        unidades_derivadas: [],
        estado: 1,
        name: textDefault,
        almacen_id,
      })
      setDisabled(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [producto, open])

  return (
    <ModalForm
      modalProps={{
        title: (
          <TitleForm className='!pb-0'>
            {producto?.id ? 'Editar Producto' : 'Agregar Producto'}
          </TitleForm>
        ),
        className: 'xl:min-w-[1300px]',
        // Usar width de Ant Design para controlar el ancho
        width: typeof window !== 'undefined' && window.innerWidth >= 1280 ? 1300 : '98vw',
        styles: {
          body: {
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingBottom: '16px',
          },
        },
        wrapClassName: '!flex !items-center',
        centered: true,
        okButtonProps: { loading, disabled: loading },
        okText: producto?.id ? 'Editar' : 'Crear',
      }}
      onCancel={() => {
        resetArchivos()
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
