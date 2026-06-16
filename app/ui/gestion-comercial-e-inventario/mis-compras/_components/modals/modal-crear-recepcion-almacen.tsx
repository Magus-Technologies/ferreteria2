/* eslint-disable react-hooks/exhaustive-deps */
import { Form } from 'antd'
import ModalForm from '~/components/modals/modal-form'
import TitleForm from '~/components/form/title-form'
import { type Compra } from '~/lib/api/compra'
import { type OrdenCompra } from '~/lib/api/orden-compra'
import FormTableComprar from '../../crear-compra/_components/form/form-table-comprar'
import { FormCreateCompra } from '../../crear-compra/_components/others/body-comprar'
import { useEffect } from 'react'
import dayjs from 'dayjs'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import { FaCalendar } from 'react-icons/fa'
import useCreateRecepcionAlmacen from '../../_hooks/use-create-recepcion-almacen'
import FormCrearRecepcionAlmacen from '../form/form-crear-recepcion-almacen'
import { getNroDocCompra } from '~/app/_utils/get-nro-doc'
import { productosApiV2 } from '~/lib/api/producto'
import { useStoreAlmacen } from '~/store/store-almacen'
import { useStoreProductoAgregadoCompra } from '~/app/_stores/store-producto-agregado-compra'

export type FormCreateRecepcionAlmacen = Pick<
  FormCreateCompra,
  'productos' | 'fecha'
> & {
  almacen_id: number
  proveedor_id: number
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
  ordenCompra,
  setOrdenCompra,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  compra: Compra | undefined
  setCompra: (compra: Compra | undefined) => void
  ordenCompra?: OrdenCompra | undefined
  setOrdenCompra?: (orden: OrdenCompra | undefined) => void
}) {
  const [form] = Form.useForm<FormCreateRecepcionAlmacen>()
  const setProductosCompra = useStoreProductoAgregadoCompra(s => s.setProductos)

  const nro_doc = compra ? getNroDocCompra({ compra }) : (ordenCompra?.codigo ?? '')

  const { handleSubmit, loading } = useCreateRecepcionAlmacen({
    compra_id: compra?.id,
    orden_compra_id: ordenCompra?.id,
    onSuccess: () => {
      setOpen(false)
      setCompra(undefined)
      setOrdenCompra?.(undefined)
      // No redirigir: el hook ya invalida COMPRAS/ORDENES_COMPRA y la tabla
      // de mis-compras se refresca sola. El usuario se queda en esta vista.
    },
  })

  useEffect(() => {
    let cancelled = false

    // Enriquecer cada producto con las unidades derivadas disponibles del catálogo
    // (consultando por almacén) para que el select de unidad de la tabla muestre
    // la lista de unidades, igual que en Crear Compra. El backend de recepción
    // guarda por `unidad_derivada_name` + `factor`, así que cambiar de unidad es
    // seguro; el `unidad_derivada_id` solo sirve para preseleccionar en el select.
    const enrichUnidades = async (productos: any[]) => {
      const almacen_id = useStoreAlmacen.getState().almacen_id
      if (!almacen_id) return productos

      const ids = [
        ...new Set(productos.map(p => p.producto_id).filter(Boolean)),
      ] as number[]

      const detalles = await Promise.all(
        ids.map(id => productosApiV2.getDetallePrecios(id, { almacen_id }))
      )

      const mapUd = new Map<number, any[]>()
      ids.forEach((id, i) => mapUd.set(id, detalles[i]?.data?.unidades_derivadas ?? []))

      return productos.map(p => {
        const uds = mapUd.get(p.producto_id) ?? []
        if (uds.length === 0) return { ...p, unidades_derivadas_disponibles: [] }

        const nombre = String(p.unidad_derivada_name ?? '').trim().toLowerCase()
        const match =
          uds.find((ud: any) => ud.unidad_derivada?.name?.trim().toLowerCase() === nombre) ??
          uds.find((ud: any) => Number(ud.factor) === 1) ??
          uds[0]

        return {
          ...p,
          unidad_derivada_id: match?.unidad_derivada?.id ?? p.unidad_derivada_id,
          unidad_derivada_name: match?.unidad_derivada?.name ?? p.unidad_derivada_name,
          unidades_derivadas_disponibles: uds,
        }
      })
    }

    const load = async () => {
      form.resetFields()

      let productos: any[] = []

      if (compra && compra.productos_por_almacen) {
        const productos_formateados = compra.productos_por_almacen.flatMap(
          producto_por_almacen =>
            (producto_por_almacen.unidades_derivadas || []).map(unidad_derivada => ({
              producto: producto_por_almacen,
              unidad_derivada: unidad_derivada,
            }))
        )
        productos = productos_formateados
          .filter(p => {
            const unidad = p.unidad_derivada
            const cantidad_pendiente = unidad.cantidad_pendiente ?? unidad.cantidad ?? 0
            return Number(cantidad_pendiente) > 0
          })
          .map(p => {
            const producto = p.producto.producto_almacen?.producto
            const unidad_derivada = p.unidad_derivada
            const cantidad_pendiente_raw = unidad_derivada.cantidad_pendiente ?? unidad_derivada.cantidad ?? 0
            const cantidad_pendiente_num = Number(cantidad_pendiente_raw)

            if (!producto) return null

            return {
              producto_codigo: producto.cod_producto,
              producto_id: producto.id,
              producto_name: producto.name,
              bonificacion: unidad_derivada.bonificacion,
              marca_name: producto.marca?.name ?? '',
              unidad_derivada_name:
                unidad_derivada.unidad_derivada_inmutable?.name ?? '',
              unidad_derivada_id: unidad_derivada.unidad_derivada_inmutable?.id ?? 0,
              unidad_derivada_factor: unidad_derivada.factor,
              // Costo base por unidad (sin factor) para recalcular al cambiar de unidad
              costo_actual: Number(p.producto.costo),
              cantidad: cantidad_pendiente_num,
              cantidad_recepcionada:
                Math.max(0, Number(unidad_derivada.cantidad ?? 0) - cantidad_pendiente_num),
              cantidad_pendiente: cantidad_pendiente_num,
              precio_compra:
                Number(p.producto.costo) * Number(unidad_derivada.factor),
              subtotal:
                Number(p.producto.costo) *
                Number(unidad_derivada.factor) *
                Number(unidad_derivada.cantidad ?? 0),
              flete: unidad_derivada.flete,
              vencimiento: unidad_derivada.vencimiento
                ? dayjs(unidad_derivada.vencimiento)
                : undefined,
              lote: unidad_derivada.lote,
            }
          })
          .filter(Boolean) as any[]
      } else if (ordenCompra && ordenCompra.productos) {
        productos = ordenCompra.productos
          .filter((p: any) => Number(p.cantidad_pendiente ?? p.cantidad) > 0)
          .map((p: any) => {
            const cant_pend = Number(p.cantidad_pendiente ?? p.cantidad)
            return {
              producto_codigo: p.codigo,
              producto_id: p.producto_id,
              producto_name: p.nombre,
              bonificacion: false,
              marca_name: p.marca ?? '',
              unidad_derivada_name: p.unidad ?? '',
              unidad_derivada_id: 0,
              unidad_derivada_factor: 1, // Orden de compra simplificada usa factor 1
              costo_actual: Number(p.precio),
              cantidad: cant_pend,
              cantidad_recepcionada: Math.max(0, Number(p.cantidad) - cant_pend),
              cantidad_pendiente: cant_pend,
              precio_compra: Number(p.precio),
              subtotal: Number(p.subtotal),
              flete: Number(p.flete),
              vencimiento: p.vencimiento ? dayjs(p.vencimiento) : undefined,
              lote: p.lote,
            }
          })
      }

      // Traer las unidades del catálogo para habilitar el select de unidad
      productos = await enrichUnidades(productos)
      if (cancelled) return

      form.setFieldValue('productos', productos)
      // Poblar el store para que SelectUnidadDerivadaCompra encuentre las unidades
      setProductosCompra(productos)

      // Establecer el proveedor por defecto
      const proveedor_id = compra?.proveedor_id ?? ordenCompra?.proveedor_id
      if (proveedor_id) {
        form.setFieldValue('proveedor_id', proveedor_id)
      }

      form.setFieldValue('fecha', dayjs())

      // Almacén de destino por defecto: el seleccionado globalmente.
      form.setFieldValue('almacen_id', useStoreAlmacen.getState().almacen_id)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [compra, ordenCompra])

  useEffect(() => {
    if (!open) {
      setCompra(undefined)
      setOrdenCompra?.(undefined)
      // Limpiar el store al cerrar para no filtrar productos a otras vistas
      setProductosCompra([])
    }
  }, [open])

  return (
    <ModalForm
      modalProps={{
        title: (
          <TitleForm className='!pb-0'>
            <div className='flex gap-4 items-center'>
              <span className='text-nowrap'>
                Recepcionar en Almacén la {compra ? 'Compra' : 'Orden'} {nro_doc}
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
              <SelectAlmacen
                form={form}
                afecta_store={false}
                propsForm={{
                  name: 'almacen_id',
                  rules: [
                    {
                      required: true,
                      message: 'Selecciona el almacén',
                    },
                  ],
                }}
                formWithMessage={false}
                size='middle'
                sizeIcon={16}
                className='!w-[240px] !min-w-[240px] !max-w-[240px] font-normal!'
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
      <FormCrearRecepcionAlmacen form={form} compra={compra} ordenCompra={ordenCompra} />
    </ModalForm>
  )
}
