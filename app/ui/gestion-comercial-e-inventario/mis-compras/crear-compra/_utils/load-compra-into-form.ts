import { type FormInstance } from 'antd'
import { type Compra } from '~/lib/api/compra'
import { message } from 'antd'

export const loadCompraIntoForm = (
  compra: Compra,
  form: FormInstance
): { success: boolean; message?: string } => {
  try {
    // Validar que la compra tenga datos
    if (!compra) {
      return { success: false, message: 'No hay datos de compra para cargar' }
    }

    // Validar que el proveedor exista
    if (!compra.proveedor) {
      message.warning('El proveedor de esta compra ya no existe')
    }

    // Validar que tenga productos
    if (!compra.productosPorAlmacen || compra.productosPorAlmacen.length === 0) {
      return {
        success: false,
        message: 'Esta compra no tiene productos para cargar',
      }
    }

    // Cargar datos del proveedor
    if (compra.proveedor_id) {
      form.setFieldValue('proveedor_id', compra.proveedor_id)
    }

    // Cargar tipo de documento y forma de pago
    form.setFieldValue('tipo_documento', compra.tipo_documento)
    form.setFieldValue('forma_de_pago', compra.forma_de_pago)
    form.setFieldValue('tipo_moneda', compra.tipo_moneda)
    form.setFieldValue('tipo_de_cambio', compra.tipo_de_cambio)
    form.setFieldValue('percepcion', compra.percepcion)

    // Transformar productos
    const productos = compra.productosPorAlmacen
      .map(pac => {
        // Validar que el producto almacén exista
        if (!pac.productoAlmacen) {
          message.warning(
            `Producto con ID ${pac.producto_almacen_id} ya no existe`
          )
          return null
        }

        return {
          producto_almacen_id: pac.producto_almacen_id,
          costo: pac.costo,
          unidades_derivadas: pac.unidadesDerivadas.map(ud => ({
            unidad_derivada_inmutable_id: ud.unidad_derivada_inmutable_id,
            factor: ud.factor,
            cantidad: ud.cantidad,
            cantidad_pendiente: ud.cantidad, // Reset pending quantity
            lote: '', // Clear lot number
            vencimiento: null, // Clear expiration date
            flete: ud.flete || 0,
            bonificacion: ud.bonificacion || false,
          })),
        }
      })
      .filter(Boolean) // Remove null entries

    if (productos.length === 0) {
      return {
        success: false,
        message: 'Ninguno de los productos de esta compra está disponible',
      }
    }

    // Cargar productos en el formulario
    form.setFieldValue('productos_por_almacen', productos)

    // Limpiar campos que no deben copiarse
    form.setFieldValue('serie', undefined)
    form.setFieldValue('numero', undefined)
    form.setFieldValue('descripcion', undefined)
    form.setFieldValue('guia', undefined)
    form.setFieldValue('egreso_dinero_id', undefined)
    form.setFieldValue('despliegue_de_pago_id', undefined)

    return { success: true }
  } catch (error) {
    console.error('Error loading compra into form:', error)
    return {
      success: false,
      message: 'Error al cargar datos en el formulario',
    }
  }
}
