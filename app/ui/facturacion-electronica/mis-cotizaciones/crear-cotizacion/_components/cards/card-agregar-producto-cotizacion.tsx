// Card específico para cotizaciones que usa el store correcto
import CardAgregarProductoVentaBase from '~/app/ui/facturacion-electronica/mis-ventas/crear-venta/_components/cards/card-agregar-producto-venta'
import { useStoreProductoAgregadoCotizacion } from '../../_store/store-producto-agregado-cotizacion'

export default function CardAgregarProductoCotizacion({
  setOpen,
}: {
  setOpen: (open: boolean) => void
}) {
  const setProductoAgregadoCotizacion = useStoreProductoAgregadoCotizacion(
    (store) => store.setProductoAgregado
  )

  return (
    <CardAgregarProductoVentaBase
      setOpen={setOpen}
      onOk={(values) => {
        console.log('🎯 CardAgregarProductoCotizacion - onOk ejecutado');
        console.log('📦 Valores recibidos:', values);
        // Usar el store de cotizaciones en lugar del de ventas
        setProductoAgregadoCotizacion(values as any)
        console.log('✅ Producto agregado al store de cotizaciones');
      }}
    />
  )
}
