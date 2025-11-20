import { useEffect } from 'react'
import dayjs from 'dayjs'
import { FormInstance } from 'antd'
import {
  EstadoDeVenta,
  FormaDePago,
  TipoDocumento,
  TipoMoneda,
} from '@prisma/client'
import { useStoreAlmacen } from '~/store/store-almacen'
import { VentaConUnidadDerivadaNormal } from '../_components/others/header-crear-venta'
import { FormCreateVenta } from '../_components/others/body-vender'

export default function useInitVenta({
  venta,
  form,
}: {
  venta?: VentaConUnidadDerivadaNormal
  form: FormInstance<FormCreateVenta>
}) {
  const setAlmacenId = useStoreAlmacen((state) => state.setAlmacenId)

  useEffect(() => {
    form.resetFields()
    form.setFieldValue('estado_de_venta', EstadoDeVenta.Creado)
    if (venta) {
      const dataFormated: FormCreateVenta = {
        fecha: dayjs(venta.fecha),
        tipo_moneda: venta.tipo_moneda,
        tipo_de_cambio: Number(venta.tipo_de_cambio),
        // cliente_id: venta.cliente_id || undefined,
        tipo_documento: venta.tipo_documento,
        serie: venta.serie || undefined,
        numero: venta.numero || undefined,
        forma_de_pago: venta.forma_de_pago,
        productos: venta.productos_por_almacen.flatMap((ppa) =>
          ppa.unidades_derivadas.map((ud) => ({
            cantidad: Number(ud.cantidad),
            unidad_derivada_id: ud.unidad_derivada_normal.id,
            precio_venta: Number(ppa.precio) * Number(ud.factor),
            subtotal:
              Number(ppa.precio) * Number(ud.factor) * Number(ud.cantidad),
            marca_name: ppa.producto_almacen.producto.marca.name,
            producto_name: ppa.producto_almacen.producto.name,
            producto_codigo: ppa.producto_almacen.producto.cod_producto,
            unidad_derivada_name: ud.unidad_derivada_normal.name,
            unidad_derivada_factor: Number(ud.factor),
            producto_id: ppa.producto_almacen.producto_id,
          }))
        ),
      }

      form.setFieldsValue(dataFormated)
      setAlmacenId(venta.almacen_id)
    } else
      form.setFieldsValue({
        tipo_moneda: TipoMoneda.Soles,
        fecha: dayjs(),
        forma_de_pago: FormaDePago.Contado,
        tipo_documento: TipoDocumento.Factura,
        tipo_de_cambio: 1,
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venta])
}
