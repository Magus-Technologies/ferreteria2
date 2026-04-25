import { type FormInstance } from 'antd'
import { type OrdenCompra } from '~/lib/api/orden-compra'
import { message } from 'antd'
import dayjs from 'dayjs'
import { productosApiV2 } from '~/lib/api/producto'
import { useStoreAlmacen } from '~/store/store-almacen'

export const loadCompraIntoForm = async (
  ordenCompra: OrdenCompra,
  form: FormInstance
): Promise<{ success: boolean; message?: string }> => {
  try {
    // Validar que la orden de compra tenga datos
    if (!ordenCompra) {
      return { success: false, message: 'No hay datos de orden de compra para cargar' }
    }

    // Validar que el proveedor exista
    if (!ordenCompra.proveedor) {
      message.warning('El proveedor de esta orden de compra ya no existe')
    }

    // Validar que tenga productos
    if (!ordenCompra.productos || ordenCompra.productos.length === 0) {
      return {
        success: false,
        message: 'Esta orden de compra no tiene productos para cargar',
      }
    }

    // Cargar datos del proveedor
    if (ordenCompra.proveedor_id) {
      form.setFieldValue('proveedor_id', ordenCompra.proveedor_id)
    }
    if (ordenCompra.proveedor) {
      form.setFieldValue('proveedor_ruc', ordenCompra.proveedor.ruc ?? '')
      form.setFieldValue('proveedor_razon_social', ordenCompra.proveedor.razon_social ?? '')
    }

    // Cargar tipo de documento y forma de pago
    form.setFieldValue('tipo_documento', ordenCompra.tipo_documento)
    form.setFieldValue('forma_de_pago', ordenCompra.forma_de_pago)
    form.setFieldValue('tipo_moneda', ordenCompra.tipo_moneda)
    form.setFieldValue('tipo_de_cambio', ordenCompra.tipo_de_cambio)
    form.setFieldValue('percepcion', ordenCompra.percepcion)
    form.setFieldValue('fecha', dayjs(ordenCompra.fecha))

    // Guardar el ID de la orden de compra para vincularla
    form.setFieldValue('orden_compra_id', ordenCompra.id)

    const almacen_id = useStoreAlmacen.getState().almacen_id
    if (!almacen_id) {
      return { success: false, message: 'No hay un almacén seleccionado' }
    }

    // Resolver unidad_derivada_id y factor por producto consultando el almacén
    const productosOrden = ordenCompra.productos
    const detallesPorProducto = await Promise.all(
      productosOrden.map(p =>
        p.producto_id
          ? productosApiV2.getDetallePrecios(p.producto_id, { almacen_id })
          : Promise.resolve(null)
      )
    )

    // Transformar productos de OrdenCompra a formato de Compra
    const productos = productosOrden
      .map((producto, index) => {
        if (!producto.producto_id) {
          message.warning(`Producto ${producto.nombre} no tiene ID válido`)
          return null
        }

        const detalle = detallesPorProducto[index]?.data
        const unidadesDerivadas = detalle?.unidades_derivadas ?? []
        const unidadNombre = (producto.unidad ?? '').trim().toLowerCase()
        const matchUnidad =
          unidadesDerivadas.find(
            ud => ud.unidad_derivada?.name?.trim().toLowerCase() === unidadNombre
          ) ?? unidadesDerivadas.find(ud => Number(ud.factor) === 1)

        if (!matchUnidad) {
          message.warning(
            `No se encontró la unidad "${producto.unidad}" para ${producto.nombre}`
          )
          return null
        }

        return {
          producto_id: producto.producto_id,
          producto_name: producto.nombre,
          producto_codigo: producto.codigo ?? '',
          marca_name: producto.marca,
          unidad_derivada_id: matchUnidad.unidad_derivada_id,
          unidad_derivada_name: matchUnidad.unidad_derivada?.name ?? producto.unidad,
          unidad_derivada_factor: Number(matchUnidad.factor) || 1,
          cantidad: producto.cantidad,
          precio_compra: producto.precio,
          flete: producto.flete || 0,
          bonificacion: false,
          lote: producto.lote || '',
          vencimiento: producto.vencimiento ? dayjs(producto.vencimiento) : null,
          subtotal: producto.subtotal,
        }
      })
      .filter(Boolean) // Remove null entries

    if (productos.length === 0) {
      return {
        success: false,
        message: 'Ninguno de los productos de esta orden está disponible',
      }
    }

    // Cargar productos en el formulario
    form.setFieldValue('productos', productos)

    // Limpiar campos que no deben copiarse
    form.setFieldValue('serie', ordenCompra.serie || undefined)
    form.setFieldValue('numero', ordenCompra.numero || undefined)
    form.setFieldValue('guia', ordenCompra.guia || undefined)
    form.setFieldValue('descripcion', undefined)
    form.setFieldValue('egreso_dinero_id', ordenCompra.egreso_dinero_id || undefined)
    form.setFieldValue('despliegue_de_pago_id', ordenCompra.despliegue_de_pago_id || undefined)

    return { success: true }
  } catch (error) {
    console.error('Error loading orden compra into form:', error)
    return {
      success: false,
      message: 'Error al cargar datos en el formulario',
    }
  }
}
