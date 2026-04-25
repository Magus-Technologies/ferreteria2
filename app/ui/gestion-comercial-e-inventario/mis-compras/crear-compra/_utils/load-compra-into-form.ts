import { type FormInstance } from 'antd'
import { type OrdenCompra } from '~/lib/api/orden-compra'
import { message } from 'antd'
import dayjs from 'dayjs'

export const loadCompraIntoForm = (
  ordenCompra: OrdenCompra,
  form: FormInstance
): { success: boolean; message?: string } => {
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

    // Transformar productos de OrdenCompra a formato de Compra
    const productos = ordenCompra.productos
      .map(producto => {
        if (!producto.producto_id) {
          message.warning(`Producto ${producto.nombre} no tiene ID válido`)
          return null
        }

        return {
          producto_id: producto.producto_id,
          producto_name: producto.nombre,
          marca_name: producto.marca,
          unidad_derivada_name: producto.unidad,
          unidad_derivada_factor: 1, // Ajustar según tu lógica
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
