import { Form } from 'antd'
import { Dispatch, SetStateAction } from 'react'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import type {
  Producto,
  ProductoAlmacen,
  ProductoAlmacenUnidadDerivada,
  ProductoAlmacenUnidadDerivadaCompra,
} from '@prisma/client'
import type { Dayjs } from 'dayjs'
import TabsForm from '../tabs/tabs-form'
import { useStoreArchivosProducto } from '../../store/store-archivos-producto'
import useCreateProducto from '../../_hooks/use-create-producto'

interface ModalCreateProductoProps {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export type UnidadDerivadaCreateProducto = Omit<
  ProductoAlmacenUnidadDerivada,
  'id' | 'producto_almacen_id'
> & {
  costo: number
}

export type FormCreateProductoProps = Omit<
  Producto,
  'id' | 'created_at' | 'updated_at' | 'img' | 'ficha_tecnica' | 'estado'
> & {
  producto_almacen: Pick<ProductoAlmacen, 'ubicacion_id'>
  compra: Pick<ProductoAlmacenUnidadDerivadaCompra, 'lote'> & {
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

export default function ModalCreateProducto({
  open,
  setOpen,
}: ModalCreateProductoProps) {
  const [form] = Form.useForm<FormCreateProductoProps>()

  const { crearProductoForm, loading } = useCreateProducto({
    setOpen,
    form,
  })

  const setImgFile = useStoreArchivosProducto(state => state.setImgFile)
  const setFichaTecnicaFile = useStoreArchivosProducto(
    state => state.setFichaTecnicaFile
  )

  return (
    <ModalForm
      modalProps={{
        title: <TitleForm className='!pb-0'>Agregar Producto</TitleForm>,
        className: 'min-w-[1300px]',
        wrapClassName: '!flex !items-center',
        centered: true,
        okButtonProps: { loading, disabled: loading },
      }}
      onCancel={() => {
        setImgFile(undefined)
        setFichaTecnicaFile(undefined)
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        initialValues: {
          unidades_contenidas: 1,
          unidades_derivadas: [],
          estado: 1,
        },
        onFinish: crearProductoForm,
      }}
    >
      <TabsForm form={form} />
    </ModalForm>
  )
}
