import { useEffect } from 'react'
import dayjs from 'dayjs'
import { FormInstance } from 'antd'
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
    console.log('🔄 useInitVenta running with venta:', venta)
    form.resetFields()
    console.log('✅ Form reset complete')
    if (venta) {
      const dataFormated: FormCreateVenta = {
        fecha: dayjs(venta.fecha),
        tipo_moneda: venta.tipo_moneda as any,
        tipo_de_cambio: Number(venta.tipo_de_cambio),
        cliente_id: venta.cliente_id || undefined,
        tipo_documento: venta.tipo_documento as any,
        forma_de_pago: venta.forma_de_pago as any,
        // Datos del cliente si existen
        ruc_dni: (venta as any).ruc_dni || (venta as any).cliente?.numero_documento || undefined,
        cliente_nombre: (venta as any).cliente?.razon_social || 
          ((venta as any).cliente?.nombres && (venta as any).cliente?.apellidos 
            ? `${(venta as any).cliente.nombres} ${(venta as any).cliente.apellidos}`.trim() 
            : undefined),
        telefono: (venta as any).telefono || (venta as any).cliente?.telefono || undefined,
        direccion: (venta as any).direccion || (venta as any).cliente?.direccion || undefined,
        email: (venta as any).cliente?.email || undefined,
        productos: [
          // Productos normales
          ...venta.productos_por_almacen.flatMap((ppa) =>
            ppa.unidades_derivadas.map((ud) => ({
              _tipo: 'producto' as const,
              cantidad: Number(ud.cantidad),
              unidad_derivada_id: ud.unidad_derivada_normal.id,
              recargo: Number(ud.recargo),
              precio_venta:
                (Number(ud.precio) + Number(ud.recargo)) * Number(ud.factor),
              subtotal:
                (Number(ud.precio) + Number(ud.recargo)) *
                Number(ud.factor) *
                Number(ud.cantidad),
              marca_name: ppa.producto_almacen.producto.marca.name,
              producto_name: ppa.producto_almacen.producto.name,
              producto_codigo: ppa.producto_almacen.producto.cod_producto,
              unidad_derivada_name: ud.unidad_derivada_normal.name,
              unidad_derivada_factor: Number(ud.factor),
              producto_id: ppa.producto_almacen.producto_id,
            }))
          ),
          // Servicios de la venta
          ...((venta as any).servicios_venta || []).map((sv: any) => ({
            _tipo: 'servicio' as const,
            producto_id: -sv.servicio_id,
            producto_name: sv.servicio?.nombre || 'Servicio',
            producto_codigo: sv.servicio?.codigo_sunat || 'SRV',
            marca_name: '-',
            unidad_derivada_id: 0,
            unidad_derivada_name: 'SERVICIO',
            unidad_derivada_factor: 1,
            cantidad: Number(sv.cantidad),
            precio_venta: Number(sv.precio_unitario),
            recargo: 0,
            subtotal: Number(sv.subtotal),
            servicio_id: sv.servicio_id,
            servicio_nombre: sv.servicio?.nombre || 'Servicio',
            servicio_codigo_sunat: sv.servicio?.codigo_sunat || null,
            servicio_referencia: sv.referencia || undefined,
          })),
        ],
      }

      form.setFieldsValue(dataFormated)
      setAlmacenId(venta.almacen_id)
    } else {
      console.log('📝 Setting default values (no venta)')
      form.setFieldsValue({
        tipo_moneda: 's' as any, // Soles
        fecha: dayjs(),
        forma_de_pago: 'co' as any, // Contado
        tipo_documento: '03' as any, // Boleta (por defecto)
        tipo_de_cambio: 1,
        productos: [], // Asegurar que la tabla esté vacía
        estado_de_venta: 'cr' as any, // Creado
        // ✅ Valores por defecto para horarios de entrega
        hora_inicio: '09:00',
        hora_fin: '18:00',
      })
      console.log('✅ Default values set, productos should be empty array')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venta])
}
