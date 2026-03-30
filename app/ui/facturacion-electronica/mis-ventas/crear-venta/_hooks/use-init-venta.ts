import { useEffect } from 'react'
import dayjs from 'dayjs'
import { FormInstance } from 'antd'
import { useStoreAlmacen } from '~/store/store-almacen'
import { VentaConUnidadDerivadaNormal } from '../_components/others/header-crear-venta'
import { FormCreateVenta } from '../_components/others/body-vender'
import { clienteApi } from '~/lib/api/cliente'
import { productosApiV2 } from '~/lib/api/producto'
import { useStoreProductoAgregadoVenta } from '../_store/store-producto-agregado-venta'

export default function useInitVenta({
  venta,
  form,
}: {
  venta?: VentaConUnidadDerivadaNormal
  form: FormInstance<FormCreateVenta>
}) {
  const setAlmacenId = useStoreAlmacen((state) => state.setAlmacenId)
  const setProductos = useStoreProductoAgregadoVenta((state) => state.setProductos)

  useEffect(() => {
    form.resetFields()
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
        direccion_seleccionada: (venta as any).direccion_seleccionada || 'D1',
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
              stock_fraccion: Number((ppa.producto_almacen as any).stock_fraccion ?? 0),
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

      // Cargar stock actual y unidades derivadas de cada producto desde la API
      const productoIds = [
        ...new Set(
          venta.productos_por_almacen.map((ppa) => ppa.producto_almacen.producto_id)
        ),
      ]

      if (productoIds.length > 0) {
        Promise.all(
          productoIds.map((id) => productosApiV2.getById(id))
        )
          .then((responses) => {
            const productosBackend = responses
              .map((r) => r.data)
              .filter(Boolean) as any[]

            const storeProductos: any[] = []

            // Actualizar cada producto en el form con stock_fraccion real
            const productosForm = form.getFieldValue('productos') as FormCreateVenta['productos']
            if (!productosForm) return

            let updated = false
            const productosActualizados = productosForm.map((prod) => {
              if (prod._tipo === 'servicio') return prod

              const productoBackend = productosBackend.find(
                (p: any) => p.id === prod.producto_id
              )
              if (!productoBackend) return prod

              const productoEnAlmacen = productoBackend.producto_en_almacenes?.find(
                (pa: any) => pa.almacen_id === venta.almacen_id
              )
              if (!productoEnAlmacen) return prod

              updated = true

              // Agregar al store para que SelectUnidadDerivada y SelectTipoPrecio funcionen
              const yaExisteEnStore = storeProductos.some(
                (p) => p.producto_id === prod.producto_id
              )
              if (!yaExisteEnStore) {
                storeProductos.push({
                  producto_id: prod.producto_id,
                  producto_name: prod.producto_name,
                  unidades_derivadas_disponibles: productoEnAlmacen.unidades_derivadas,
                })
              }

              // Determinar tipo_precio basándose en el precio actual
              const udBackend = productoEnAlmacen.unidades_derivadas?.find(
                (ud: any) => ud.unidad_derivada?.id === prod.unidad_derivada_id
              )
              let tipo_precio = 'publico'
              if (udBackend) {
                const precioVenta = Number(prod.precio_venta)
                if (precioVenta === Number(udBackend.precio_publico) * Number(udBackend.factor)) {
                  tipo_precio = 'publico'
                } else if (precioVenta === Number(udBackend.precio_especial) * Number(udBackend.factor)) {
                  tipo_precio = 'especial'
                } else if (precioVenta === Number(udBackend.precio_minimo) * Number(udBackend.factor)) {
                  tipo_precio = 'minimo'
                } else if (precioVenta === Number(udBackend.precio_ultimo) * Number(udBackend.factor)) {
                  tipo_precio = 'ultimo'
                }
              }

              return {
                ...prod,
                stock_fraccion: Number(productoEnAlmacen.stock_fraccion ?? 0),
                tipo_precio,
              }
            })

            if (updated) {
              form.setFieldValue('productos', productosActualizados)
            }

            // Popular el store con los productos para que los selects funcionen
            if (storeProductos.length > 0) {
              setProductos(storeProductos)
            }
          })
          .catch((err) => {
            console.error('Error al cargar stock de productos:', err)
          })
      }

      // Cargar las direcciones del cliente desde la API
      const clienteId = venta.cliente_id || (venta as any).cliente?.id
      if (clienteId) {
        clienteApi.listarDirecciones(clienteId).then((response) => {
          if (response.data?.data) {
            const direcciones = response.data.data

            direcciones.forEach((dir) => {
              switch (dir.tipo) {
                case 'D1':
                  form.setFieldValue('_cliente_direccion_1', dir.direccion)
                  break
                case 'D2':
                  form.setFieldValue('_cliente_direccion_2', dir.direccion)
                  break
                case 'D3':
                  form.setFieldValue('_cliente_direccion_3', dir.direccion)
                  break
                case 'D4':
                  form.setFieldValue('_cliente_direccion_4', dir.direccion)
                  break
              }
            })

            // Restaurar la dirección según la selección guardada en la venta
            const direccionSeleccionada = (venta as any).direccion_seleccionada || 'D1'
            const dirMap: Record<string, string> = { D1: 'D1', D2: 'D2', D3: 'D3', D4: 'D4' }
            const dirSeleccionada = direcciones.find(d => d.tipo === dirMap[direccionSeleccionada])

            if (dirSeleccionada?.direccion) {
              form.setFieldValue('direccion', dirSeleccionada.direccion)
            } else if (!form.getFieldValue('direccion')) {
              // Fallback: usar la principal o D1
              const principal = direcciones.find(d => d.es_principal)
              const d1 = direcciones.find(d => d.tipo === 'D1')
              const direccionDefault = principal?.direccion || d1?.direccion || ''
              if (direccionDefault) {
                form.setFieldValue('direccion', direccionDefault)
              }
            }
          }
        }).catch(() => {
          // Silenciar errores de carga de direcciones
        })
      }
    } else {
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venta])
}
