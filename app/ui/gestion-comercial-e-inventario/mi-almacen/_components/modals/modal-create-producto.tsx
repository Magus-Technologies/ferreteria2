import { Form } from 'antd'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import type {
  ProductoAlmacen,
  ProductoAlmacenUnidadDerivada,
  UnidadDerivada,
  UnidadDerivadaInmutableCompra,
} from '~/types'
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
  open: openProp,
  setOpen: setOpenProp,
}: {
  onSuccess?: (res: Producto) => void
  textDefault?: string
  setTextDefault?: (text: string) => void
  open?: boolean
  setOpen?: (open: boolean) => void
}) {
  const [form] = Form.useForm<FormCreateProductoProps>()
  const almacen_id = useStoreAlmacen(store => store.almacen_id)

  const storeOpen = useStoreEditOrCopyProducto(state => state.openModal)
  const storeSetOpen = useStoreEditOrCopyProducto(state => state.setOpenModal)
  
  const open = openProp !== undefined ? openProp : storeOpen
  const setOpen = setOpenProp !== undefined ? setOpenProp : storeSetOpen

  const producto = useStoreEditOrCopyProducto(state => state.producto)
  const setProducto = useStoreEditOrCopyProducto(state => state.setProducto)
  const isDuplicate = useStoreEditOrCopyProducto(state => state.isDuplicate)
  const setIsDuplicate = useStoreEditOrCopyProducto(state => state.setIsDuplicate)

  const isEditing = !!producto?.id
  const isCreating = !producto

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
    
    if (producto && producto.producto_en_almacenes) {
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
        // Si es duplicado, agregar sufijo al nombre
        let productName = restProducto.name
        if (isDuplicate) {
          // Buscar el último número usado en productos con nombres similares
          // Por ahora, simplemente agregamos " (COPIA)" al nombre
          productName = `${restProducto.name} (COPIA)`
        }
        
        form.setFieldsValue({
          ...restProducto,
          name: productName,
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
          ...(producto?.id && !isDuplicate ? { cod_producto } : {}),
        })
      }, 0)
    } else {
      // Caso: crear nuevo producto o producto manual
      form.resetFields()
      
      // Usar setTimeout para asegurar que el form se resetee antes de setear valores
      setTimeout(() => {
        form.setFieldsValue({
          unidades_contenidas: 1,
          unidades_derivadas: [],
          estado: 1,
          name: textDefault || '',
          almacen_id,
        })
      }, 0)
      
      setDisabled(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [producto, open, textDefault, isDuplicate])

  return (
    <ModalForm
      modalProps={{
        title: (
          <TitleForm className='!pb-0'>
            {isEditing ? 'Editar Producto' : isDuplicate ? 'Duplicar Producto' : 'Agregar Producto'}
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
        okText: isEditing ? 'Editar' : isDuplicate ? 'Duplicar' : 'Crear',
      }}
      onCancel={() => {
        resetArchivos()
        setProducto(undefined)
        setIsDuplicate(false)
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
