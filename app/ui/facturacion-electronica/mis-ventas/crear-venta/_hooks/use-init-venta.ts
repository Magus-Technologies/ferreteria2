import { useEffect } from 'react'
import dayjs from 'dayjs'
import { FormInstance } from 'antd'
import { useStoreAlmacen } from '~/store/store-almacen'
import { VentaConUnidadDerivadaNormal } from '../_components/others/header-crear-venta'
import { FormCreateVenta } from '../_components/others/body-vender'
import { clienteApi, TipoDireccion } from '~/lib/api/cliente'
import { setDireccionesClienteToForm } from '~/lib/utils/cliente-direcciones-form'
import { productosApiV2 } from '~/lib/api/producto'
import { useStoreProductoAgregadoVenta, generarRowId } from '../_store/store-producto-agregado-venta'

export default function useInitVenta({
  venta,
  form,
}: {
  venta?: VentaConUnidadDerivadaNormal
  form: FormInstance<FormCreateVenta>
}) {
  const setAlmacenId = useStoreAlmacen((state) => state.setAlmacenId)
  const setProductos = useStoreProductoAgregadoVenta((state) => state.setProductos)
  const setCarrito = useStoreProductoAgregadoVenta((state) => state.setCarrito)
  const setProductoAgregado = useStoreProductoAgregadoVenta((state) => state.setProductoAgregado)

  useEffect(() => {
    form.resetFields()
    setProductoAgregado(undefined)
    setProductos([])
    // La tabla de productos vive en Zustand, no en el form — form.resetFields()
    // ya no la limpia (ver store-producto-agregado-venta.ts).
    setCarrito([])
    if (venta) {
      // Precargar el form con la entrega que todavía se puede reprogramar
      // (pendiente o en camino). Antes se tomaba la primera del arreglo sin
      // mirar el estado: si la venta tenía una entrega cancelada y después
      // otra activa, el modal de "Editar Entrega" mostraba los datos de la
      // cancelada — chofer, vehículo y horario que ya no corrían.
      const entregasVenta: any[] = (venta as any).entregas_productos ?? []
      const entrega =
        entregasVenta.find((e) => e.estado_entrega === 'pe' || e.estado_entrega === 'ec') ??
        entregasVenta[0]
      // La hora viene de una columna TIME ("19:30:00"); el backend la valida
      // como "H:i" al reprogramar, y los pickers del modal también trabajan
      // con "HH:mm".
      const horaHHmm = (v: unknown) => (v ? String(v).slice(0, 5) : undefined)
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
      // `tipo_pedido` se guarda y se valida en minúsculas ('interno'/'externo')
      // y el select del modal usa esos mismos valores (`TipoPedido.INTERNO`).
      // Antes se mapeaba a 'INTERNO'/'EXTERNO': el select no encontraba la
      // opción y, al reprogramar, el backend rechazaba el valor.
      const tipoPedidoMap: Record<string, string> = {
        interno: 'interno',
        externo: 'externo',
      }

      // Filas iniciales del carrito — van a Zustand (setCarrito más abajo),
      // no al form: la tabla de productos ya no vive ahí.
      const productosIniciales: FormCreateVenta['productos'] = [
        // Productos normales
        ...venta.productos_por_almacen.flatMap((ppa) =>
          ppa.unidades_derivadas.map((ud) => ({
            _row_id: generarRowId(),
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
            // Si la cotización origen reservó stock, esa línea ya fue descontada:
            // el backend restará esta cantidad y descontará solo el excedente.
            _cantidad_reservada: (venta as any).reservar_stock === true ? Number(ud.cantidad) : 0,
            _unidad_reserva_id: (venta as any).reservar_stock === true ? ud.unidad_derivada_normal.id : undefined,
          }))
        ),
        // Servicios de la venta
        ...((venta as any).servicios_venta || []).map((sv: any) => ({
          _row_id: generarRowId(),
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
      ]

      const dataFormated: Omit<FormCreateVenta, 'productos'> = {
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
        fecha_programada: entrega?.fecha_programada ? dayjs(entrega.fecha_programada).format('YYYY-MM-DD') : undefined,
        hora_inicio: horaHHmm(entrega?.hora_inicio),
        hora_fin: horaHHmm(entrega?.hora_fin),
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
        //
        // EXCEPCIÓN: una venta EN ESPERA siempre tiene `stock_aplicado = false`,
        // pero por un motivo distinto — todavía no se confirmó, no porque el
        // cliente ya se haya llevado la mercadería. Tratarla como 'no' rompía dos
        // cosas al recuperarla:
        //
        //   1. El paso de entrega no aparecía. La condición de cards-info-venta
        //      (`EnTienda` + `descontar_stock === 'no'`) se cumplía siempre, así
        //      que al terminar de cobrar hacía form.submit() directo y nunca
        //      preguntaba quién entrega ni dejaba programar la entrega.
        //   2. El stock no se descontaba al confirmar: el backend calcula
        //      `$noDescontarStockUpdate` con este mismo flag.
        descontar_stock:
          (venta as any).estado_de_venta !== 'ee' && (venta as any).stock_aplicado === false
            ? 'no'
            : 'si',
        // Si la cotización origen ya reservó stock, no descontar pero sí marcar como aplicado.
        // Se manda como fallback: el backend prioriza `cotizacion_id` (abajo) y verifica
        // reservar_stock directo en la BD, así que este flag ya no es el único freno.
        stock_ya_aplicado: (venta as any).reservar_stock === true ? true : undefined,
        // Cuando `venta` es en realidad una cotización cargada (tiene estado_cotizacion,
        // las ventas no lo tienen), su `id` es el ID de la cotización. El backend usa esto
        // para verificar reservar_stock directo en la BD en vez de confiar en el flag de
        // arriba (que puede perderse si algo falla en la cadena del frontend).
        cotizacion_id: (venta as any).estado_cotizacion !== undefined ? (venta as any).id : undefined,
      }

      form.setFieldsValue(dataFormated as FormCreateVenta)
      setCarrito(productosIniciales)
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

            // Actualizar cada producto del carrito con stock_fraccion real
            const productosForm = useStoreProductoAgregadoVenta.getState()
              .carrito as FormCreateVenta['productos']
            if (!productosForm.length) return

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
              setCarrito(productosActualizados)
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
      // El carrito ya quedó vacío por el setCarrito([]) de arriba.
      form.setFieldsValue({
        tipo_moneda: 's' as any, // Soles
        fecha: dayjs(),
        forma_de_pago: 'co' as any, // Contado
        tipo_documento: '03' as any, // Boleta (por defecto)
        tipo_de_cambio: 1,
        estado_de_venta: 'cr' as any, // Creado
        // ✅ Valores por defecto para horarios de entrega
        hora_inicio: '09:00',
        hora_fin: '18:00',
      })
    }
    // Dispara solo cuando cambia la venta/cotización que se está cargando
    // (por id), NO en cada render. `venta` llega como objeto NUEVO en cada
    // render de su caller (ej. editar-venta/[id]/page.tsx construye
    // `ventaFormated` sin useMemo), así que depender de `[venta]` completo
    // reseteaba el carrito (setCarrito([]) más arriba) cada vez que
    // React Query refetcheaba esa venta en segundo plano (foco de ventana,
    // invalidación de ['venta', id] desde otra pantalla) — el vendedor
    // agregaba productos, el refetch vaciaba el carrito en silencio, y al
    // cobrar salía "ingresa al menos un producto o servicio".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venta?.id])
}
