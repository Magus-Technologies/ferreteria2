// Card específico para cotizaciones que usa el store correcto
import CardAgregarProductoVentaBase from '~/app/ui/facturacion-electronica/mis-ventas/crear-venta/_components/cards/card-agregar-producto-venta'
import { useStoreProductoAgregadoCotizacion } from '../../_store/store-producto-agregado-cotizacion'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'

export default function CardAgregarProductoCotizacion({
  setOpen,
}: {
  setOpen: (open: boolean) => void
}) {
  const setProductoAgregadoCotizacion = useStoreProductoAgregadoCotizacion(
    (store) => store.setProductoAgregado
  )
  // Para que el loader de "Más"/"Más y Salir" (en el card base) sepa cuándo
  // terminó de agregarse: acá se agrega a la tabla de COTIZACIÓN, no a la de
  // ventas, así que hay que pasarle su propio array en vez del default.
  const productosCotizacion = useStoreProductoAgregadoCotizacion(
    (store) => store.productos
  )

  return (
    <ConfigurableElement
      componentId="crear-cotizacion.card-agregar-producto"
      label="Card Agregar Producto"
    >
      <CardAgregarProductoVentaBase
        setOpen={setOpen}
        productosDestino={productosCotizacion}
        onOk={(values) => {
          // Usar el store de cotizaciones en lugar del de ventas
          setProductoAgregadoCotizacion(values as any)
        }}
      />
    </ConfigurableElement>
  )
}
