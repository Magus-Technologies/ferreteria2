import { useEffect } from 'react'
import dayjs from 'dayjs'
import { FormInstance } from 'antd'
import { useStoreAlmacen } from '~/store/store-almacen'
import { VentaConUnidadDerivadaNormal } from '../_components/others/header-crear-venta'
import { FormCreateVenta } from '../_components/others/body-vender'
import { clienteApi, TipoDireccion } from '~/lib/api/cliente'
import { setDireccionesClienteToForm } from '~/lib/utils/cliente-direcciones-form'
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
  const setProductoAgregado = useStoreProductoAgregadoVenta((state) => state.setProductoAgregado)

  useEffect(() => {
    form.resetFields()
    setProductoAgregado(undefined)
    setProductos([])
    if (venta) {
      // Mapear datos de la primera entrega si existe
      const entrega = (venta as any).entregas_productos?.[0]
      const tipoEntregaMap: Record<string, 'EnTienda' | 'Domicilio' | 'Parcial'> = {
        rt: 'EnTienda',
        de: 'Domicilio',
        pa: 'Parcial',
      }
      const tipoDespachoVentaMap: Record<string, 'EnTienda' | 'Domicilio' | 'Parcial'> = {
        et: 'EnTienda',
        do: 'Domicilio',
        pa: 'Parcial',
      }
      const tipoPedidoMap: Record<string, string> = {
        interno: 'INTERNO',
        externo: 'EXTERNO',
      }

      const dataFormated: FormCreateVenta = {
        fecha: dayjs(venta.fecha),
        tipo_moneda: venta.tipo_moneda as any,
        tipo_de_cambio: Number(venta.tipo_de_cambio),
        cliente_id: venta.cliente_id || undefined,
        recomendado_por_id: (venta as any).recomendado_por_id || undefined,
        tipo_documento: venta.tipo_documento as any,
        forma_de_pago: venta.forma_de_pago as any,
        numero_dias: venta.numero_dias ? Number(venta.numero_dias) : undefined,
        fecha_vencimiento: venta.fecha_vencimiento ? dayjs(venta.fecha_vencimiento) : undefined,
        // Datos del cliente si existen
        ruc_dni: (venta as any).ruc_dni || (venta as any).cliente?.numero_documento || undefined,
        cliente_nombre: (venta as any).cliente?.razon_social ||
          ((venta as any).cliente?.nombres && (venta as any).cliente?.apellidos
            ? `${(venta as any).cliente.nombres} ${(venta as any).cliente.apellidos}`.trim()
            : undefined),
        telefono: (venta as any).telefono || (venta as any).cliente?.telefono || undefined,
        // Slots del selector Cel 1 / Cel 2 — cargar ambos teléfonos del cliente.
        telefono_seleccionado: 'C1',
        _cliente_telefono_1: (venta as any).cliente?.telefono || '',
        _cliente_telefono_2: (venta as any).cliente?.celular || '',
        direccion: (venta as any).direccion || (venta as any).cliente?.direccion || undefined,
        email: (venta as any).cliente?.email || undefined,
        direccion_seleccionada: (venta as any).direccion_seleccionada || TipoDireccion.D1,
        // Tipo de despacho pertenece a la venta; las entregas hijas pueden ser rt/de
        // en ventas parciales, así que no deben sobreescribir este valor.
        tipo_despacho:
          tipoDespachoVentaMap[venta.tipo_despacho ?? ''] ??
          (entrega ? tipoEntregaMap[entrega.tipo_entrega] : 'EnTienda'),
        despachador_id: entrega?.chofer_id || undefined,
        fecha_programada: entrega?.fecha_programada ? dayjs(entrega.fecha_programada) : undefined,
        hora_inicio: entrega?.hora_inicio || undefined,
        hora_fin: entrega?.hora_fin || undefined,
        direccion_entrega: entrega?.direccion_entrega || undefined,
        referencia_entrega: entrega?.referencia_entrega || undefined,
        latitud: entrega?.latitud ? Number(entrega.latitud) : undefined,
        longitud: entrega?.longitud ? Number(entrega.longitud) : undefined,
        observaciones: entrega?.observaciones || undefined,
        // Si viene de cotización (tiene estado_cotizacion, las ventas no lo tienen), usar
        // 'vendedor' para que el backend auto-entregue y descuente stock al crear la venta.
        // Con 'almacen' (el default cuando queda undefined) el backend crea un placeholder
        // con cantidad=0 y el stock nunca se descuenta hasta que el almacenero confirma.
        quien_entrega: entrega?.quien_entrega ||
          ((venta as any).estado_cotizacion !== undefined ? 'vendedor' : undefined),
        tipo_pedido: entrega?.tipo_pedido ? tipoPedidoMap[entrega.tipo_pedido] : undefined,
        cargo_destino: entrega?.cargo_destino || undefined,
        vehiculo_id: entrega?.vehiculo_id ? Number(entrega.vehiculo_id) : undefined,
        // Si es venta editada con stock no aplicado, no descontar de nuevo.
        descontar_stock: (venta as any).stock_aplicado === false ? 'no' : 'si',
        // Si la cotización origen ya reservó stock, no descontar pero sí marcar como aplicado.
        stock_ya_aplicado: (venta as any).reservar_stock === true ? true : undefined,
        productos: [
          // Productos normales
          ...venta.productos_por_almacen.flatMap((ppa) =>
            ppa.unidades_derivadas.map((ud) => ({
              _tipo: 'producto' as const,
              cantidad: Number(ud.cantidad),
              unidad_derivada_id: ud.unidad_derivada_normal.id,
              recargo: Number(ud.recargo),
              precio_venta: Number(ud.precio),
              descuento_tipo: ud.descuento_tipo as any,
              descuento: Number(ud.descuento ?? 0),
              subtotal:
                (Number(ud.precio) + Number(ud.recargo)) *
                Number(ud.cantidad),
              marca_name: ppa.producto_almacen.producto.marca.name,
              producto_name: ppa.producto_almacen.producto.name,
              producto_codigo: ppa.producto_almacen.producto.cod_producto,
              unidad_derivada_name: ud.unidad_derivada_normal.name,
              unidad_derivada_factor: Number(ud.factor),
              producto_id: ppa.producto_almacen.producto_id,
              stock_fraccion: Number((ppa.producto_almacen as any).stock_fraccion ?? 0),
              img: ppa.producto_almacen.producto.img ?? null,
              // marca/categoria: las usan los vales con alcance PRODUCTOS/CATEGORIAS
              marca_id: (ppa.producto_almacen.producto as any).marca_id ?? null,
              categoria_id: (ppa.producto_almacen.producto as any).categoria_id ?? null,
              // costo y comision se persisten con `?? 0` en el backend al
              // re-guardar — si no se cargan al editar, se PIERDEN.
              costo: Number((ppa as any).costo ?? 0),
              comision: Number((ud as any).comision ?? 0),
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

      // Poblar el store inmediatamente con las unidades que ya vienen en la cotización/venta,
      // así los selects muestran el valor correcto sin esperar el fetch de stock.
      const storeInmediato: any[] = []
      venta.productos_por_almacen.forEach((ppa) => {
        const udsDispo = (ppa.producto_almacen as any).unidades_derivadas
        if (!udsDispo?.length) return
        const yaExiste = storeInmediato.some((p) => p.producto_id === ppa.producto_almacen.producto_id)
        if (!yaExiste) {
          storeInmediato.push({
            producto_id: ppa.producto_almacen.producto_id,
            producto_name: ppa.producto_almacen.producto.name,
            img: ppa.producto_almacen.producto.img ?? null,
            unidades_derivadas_disponibles: udsDispo,
          })
        }
      })
      if (storeInmediato.length > 0) {
        setProductos(storeInmediato)
      }

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
                  img: productoBackend.img ?? null,
                  unidades_derivadas_disponibles: productoEnAlmacen.unidades_derivadas,
                })
              }

              // Determinar tipo_precio basándose en el precio actual.
              // Buscar primero por ID (caso normal), luego por factor como fallback.
              const udBackend = productoEnAlmacen.unidades_derivadas?.find(
                (ud: any) => ud.unidad_derivada?.id === prod.unidad_derivada_id
              ) ?? productoEnAlmacen.unidades_derivadas?.find(
                (ud: any) => Number(ud.factor) === prod.unidad_derivada_factor
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
                // Todos los almacenes del producto — la columna Cantidad usa
                // esto para el popover "Ver sucursales" (igual que al agregar
                // un producto nuevo en crear-venta).
                producto_en_almacenes: productoBackend.producto_en_almacenes,
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
            // Setea los campos legacy desde el array (antes hacía switch).
            setDireccionesClienteToForm(form, { direcciones })

            // Restaurar la dirección según la selección guardada en la venta.
            const direccionSeleccionada =
              ((venta as any).direccion_seleccionada as TipoDireccion) || TipoDireccion.D1
            const dirSeleccionada = direcciones.find((d) => d.tipo === direccionSeleccionada)

            if (dirSeleccionada?.direccion) {
              form.setFieldValue('direccion', dirSeleccionada.direccion)
            } else if (!form.getFieldValue('direccion')) {
              // Fallback: usar la principal o D1
              const principal = direcciones.find(d => d.es_principal)
              const d1 = direcciones.find(d => d.tipo === TipoDireccion.D1)
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
