import { useEffect } from 'react'
import { FormCreateCompra } from '../../../crear-compra/_components/others/body-comprar'
import dayjs from 'dayjs'
import { CompraConUnidadDerivadaNormal } from '../../../crear-compra/_components/others/header'
import { FormInstance } from 'antd'
import {
  EstadoDeCompra,
  FormaDePago,
  TipoDocumento,
  TipoMoneda,
} from '~/types'
import { useStoreAlmacen } from '~/store/store-almacen'
import { useStoreProductoAgregadoCompra } from '~/app/_stores/store-producto-agregado-compra'
import { productosApiV2 } from '~/lib/api/producto'

// Helper para mapear valores de Laravel (raw DB) a enums de Prisma (para el formulario)
function mapTipoMoneda(tipoMoneda: string): TipoMoneda {
  if (tipoMoneda === 's' || tipoMoneda === TipoMoneda.Soles) return TipoMoneda.Soles
  if (tipoMoneda === 'd' || tipoMoneda === TipoMoneda.d) return TipoMoneda.d
  return TipoMoneda.Soles
}

function mapEstadoDeCompra(estado: string): EstadoDeCompra {
  if (estado === 'cr' || estado === EstadoDeCompra.Creado) return EstadoDeCompra.Creado
  if (estado === 'ee' || estado === EstadoDeCompra.EnEspera) return EstadoDeCompra.EnEspera
  if (estado === 'an' || estado === EstadoDeCompra.Anulado) return EstadoDeCompra.Anulado
  if (estado === 'pr' || estado === EstadoDeCompra.Procesado) return EstadoDeCompra.Procesado
  return EstadoDeCompra.Creado
}

export default function useInitCompra({
  compra,
  form,
  isRecuperacion = false,
}: {
  compra?: CompraConUnidadDerivadaNormal
  form: FormInstance<FormCreateCompra>
  isRecuperacion?: boolean
}) {
  const setAlmacenId = useStoreAlmacen(state => state.setAlmacenId)
  const setProductosCompra = useStoreProductoAgregadoCompra(
    state => state.setProductos
  )

  useEffect(() => {
    form.resetFields()
    if (compra) {
      const dataFormated: FormCreateCompra = {
        fecha: dayjs(compra.fecha),
        tipo_moneda: mapTipoMoneda(compra.tipo_moneda),
        tipo_de_cambio: Number(compra.tipo_de_cambio),
        proveedor_id: compra.proveedor_id || undefined,
        proveedor_razon_social: compra.proveedor?.razon_social || '',
        proveedor_ruc: compra.proveedor?.ruc || '',
        tipo_documento: compra.tipo_documento as any,
        serie: compra.serie ?? '',
        numero: compra.numero != null ? String(compra.numero) : undefined,
        descripcion: compra.descripcion ?? undefined,
        guia: compra.guia ?? '',
        forma_de_pago: compra.forma_de_pago as any,
        numero_dias: compra.numero_dias ?? undefined,
        fecha_vencimiento: compra.fecha_vencimiento
          ? dayjs(compra.fecha_vencimiento)
          : undefined,
        percepcion: compra.percepcion != null ? Number(compra.percepcion) : undefined,
        estado_de_compra: mapEstadoDeCompra(compra.estado_de_compra as string),
        egreso_dinero_id: compra.egreso_dinero_id ?? undefined,
        gasto_extra_id: compra.gasto_extra_id ?? undefined,
        despliegue_de_pago_id: compra.despliegue_de_pago_id ?? undefined,
        orden_compra_id: compra.orden_compra_id ?? undefined,
        productos: compra.productos_por_almacen.flatMap(ppa =>
          ppa.unidades_derivadas.map(ud => ({
            cantidad: Number(ud.cantidad),
            unidad_derivada_id: ud.unidad_derivada_normal.id,
            precio_compra: Number(ppa.costo) * Number(ud.factor),
            lote: ud.lote ?? undefined,
            vencimiento: ud.vencimiento ? dayjs(ud.vencimiento) : undefined,
            bonificacion: ud.bonificacion,
            flete: Number(ud.flete),
            subtotal:
              Number(ppa.costo) * Number(ud.factor) * Number(ud.cantidad),
            marca_name: ppa.producto_almacen?.producto?.marca?.name,
            producto_name: ppa.producto_almacen?.producto?.name,
            producto_codigo: ppa.producto_almacen?.producto?.cod_producto,
            unidad_derivada_name: ud.unidad_derivada_normal.name,
            unidad_derivada_factor: Number(ud.factor),
            producto_id: ppa.producto_almacen?.producto?.id ?? 0,
          }))
        ),
      }

      form.setFieldsValue(dataFormated)
      setAlmacenId(compra.almacen_id)

      // En recuperación (compra anulada / en espera) la columna Unidad debe ser
      // un select, igual que al recuperar una orden de compra. Para ello hay que
      // consultar las unidades derivadas disponibles de cada producto y poblar el
      // store que lee SelectUnidadDerivadaCompra.
      if (isRecuperacion && dataFormated.productos.length > 0) {
        let cancelado = false

        ;(async () => {
          const idsUnicos = [
            ...new Set(
              dataFormated.productos
                .map(p => p.producto_id)
                .filter((id): id is number => !!id)
            ),
          ]

          const detalles = await Promise.all(
            idsUnicos.map(id =>
              productosApiV2.getDetallePrecios(id, {
                almacen_id: compra.almacen_id,
              })
            )
          )
          if (cancelado) return

          const disponiblesPorProducto = new Map<number, any[]>()
          const costoPorProducto = new Map<number, number>()
          idsUnicos.forEach((id, i) => {
            disponiblesPorProducto.set(
              id,
              detalles[i]?.data?.unidades_derivadas ?? []
            )
            costoPorProducto.set(
              id,
              Number(detalles[i]?.data?.producto_almacen?.costo ?? 0)
            )
          })

          const productosEnriquecidos = dataFormated.productos.map(p => {
            const disponibles = disponiblesPorProducto.get(p.producto_id) ?? []
            const nombre = (p.unidad_derivada_name ?? '').trim().toLowerCase()
            const match =
              disponibles.find(
                ud =>
                  ud.unidad_derivada?.name?.trim().toLowerCase() === nombre
              ) ??
              disponibles.find(
                ud => Number(ud.factor) === Number(p.unidad_derivada_factor)
              )

            return {
              ...p,
              unidad_derivada_id:
                match?.unidad_derivada?.id ?? p.unidad_derivada_id,
              unidad_derivada_name:
                match?.unidad_derivada?.name ?? p.unidad_derivada_name,
              unidad_derivada_factor: match
                ? Number(match.factor)
                : p.unidad_derivada_factor,
              costo_actual: costoPorProducto.get(p.producto_id) ?? 0,
              unidades_derivadas_disponibles: disponibles,
            }
          })

          form.setFieldValue('productos', productosEnriquecidos)
          setProductosCompra(productosEnriquecidos)
        })()

        return () => {
          cancelado = true
        }
      }
    } else
      form.setFieldsValue({
        tipo_moneda: TipoMoneda.Soles,
        fecha: dayjs(),
        forma_de_pago: FormaDePago.Contado,
        tipo_documento: TipoDocumento.Factura,
        tipo_de_cambio: 1,
        estado_de_compra: EstadoDeCompra.Creado,
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compra, isRecuperacion])
}
