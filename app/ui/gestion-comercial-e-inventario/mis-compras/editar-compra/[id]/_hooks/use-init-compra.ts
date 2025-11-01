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
} from '@prisma/client'
import { useStoreAlmacen } from '~/store/store-almacen'

export default function useInitCompra({
  compra,
  form,
}: {
  compra?: CompraConUnidadDerivadaNormal
  form: FormInstance<FormCreateCompra>
}) {
  const setAlmacenId = useStoreAlmacen(state => state.setAlmacenId)

  useEffect(() => {
    form.resetFields()
    form.setFieldValue('estado_de_compra', EstadoDeCompra.Creado)
    if (compra) {
      const dataFormated: FormCreateCompra = {
        fecha: dayjs(compra.fecha),
        tipo_moneda: compra.tipo_moneda,
        tipo_de_cambio: Number(compra.tipo_de_cambio),
        proveedor_id: compra.proveedor_id || undefined,
        tipo_documento: compra.tipo_documento,
        serie: compra.serie,
        numero: compra.numero,
        guia: compra.guia || undefined,
        forma_de_pago: compra.forma_de_pago,
        numero_dias: compra.numero_dias || undefined,
        fecha_vencimiento: compra.fecha_vencimiento
          ? dayjs(compra.fecha_vencimiento)
          : undefined,
        percepcion: compra.percepcion ? Number(compra.percepcion) : undefined,
        productos: compra.productos_por_almacen.flatMap(ppa =>
          ppa.unidades_derivadas.map(ud => ({
            cantidad: Number(ud.cantidad),
            unidad_derivada_id: ud.unidad_derivada_normal.id,
            precio_compra: Number(ppa.costo) * Number(ud.factor),
            lote: ud.lote || undefined,
            vencimiento: ud.vencimiento ? dayjs(ud.vencimiento) : undefined,
            bonificacion: ud.bonificacion,
            flete: Number(ud.flete),
            subtotal:
              Number(ppa.costo) * Number(ud.factor) * Number(ud.cantidad),
            marca_name: ppa.producto_almacen.producto.marca.name,
            producto_name: ppa.producto_almacen.producto.name,
            producto_codigo: ppa.producto_almacen.producto.cod_producto,
            unidad_derivada_name: ud.unidad_derivada_normal.name,
            unidad_derivada_factor: ud.factor,
            producto_id: ppa.producto_almacen.producto_id,
          }))
        ),
      }

      form.setFieldsValue(dataFormated)
      setAlmacenId(compra.almacen_id)
    } else
      form.setFieldsValue({
        tipo_moneda: TipoMoneda.Soles,
        fecha: dayjs(),
        forma_de_pago: FormaDePago.Contado,
        tipo_documento: TipoDocumento.Factura,
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compra])
}
