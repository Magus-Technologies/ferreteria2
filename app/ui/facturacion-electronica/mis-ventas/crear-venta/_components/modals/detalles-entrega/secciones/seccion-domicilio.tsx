'use client'

import { Form, Input, Segmented, Select, type FormInstance } from 'antd'
import { useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { FaCalendarAlt, FaCheck, FaMapMarkedAlt, FaTruck, FaUserEdit } from 'react-icons/fa'
import dayjs from 'dayjs'
import type { ColDef } from 'ag-grid-community'
import ButtonBase from '~/components/buttons/button-base'
import SelectDespachadores from '~/app/_components/form/selects/select-despachadores'
import TextareaBase from '~/app/_components/form/inputs/textarea-base'
import SelectVehiculos from '~/app/_components/form/selects/select-vehiculos'
import TableWithTitle from '~/components/tables/table-with-title'
import { orangeColors } from '~/lib/colors'
import { TipoPedido } from '~/lib/api/entrega-producto'
import type { TipoDireccion, DireccionCliente } from '~/lib/api/cliente'
import type { ProductoEntrega } from '../../../../../_hooks/use-productos-entrega'
import { useDetallesEntrega } from '../context'
import { useReverseGeocoding } from '../hooks/use-reverse-geocoding'
import type { Coordenadas, SeccionOcultable } from '../types'
import type { Cargo } from '../hooks/use-cargos'
import TablaProductosEntrega from '../../../../../_components/tables/tabla-productos-entrega'

// Mapa cargado dinámicamente para evitar problemas de SSR.
const MapaDireccionMapbox = dynamic(
  () => import('../../../../../_components/maps/mapa-direccion-mapbox'),
  { ssr: false },
)

interface SeccionDomicilioProps {
  form: FormInstance
  clienteNombre?: string
  direccion?: string
  onEditarCliente: () => void
  direcciones: DireccionCliente[]
  cargandoDirecciones: boolean
  cargos: Cargo[]
  columnDefsDomicilio: ColDef<ProductoEntrega>[]
  totalAProgramar: number
  totalSinProgramar: number
  ocultar?: Set<SeccionOcultable>
  /**
   * Tabla simplificada (Total/Entregado/Pendiente/Entregar) en lugar de
   * la tabla nativa de "Programar ahora". Activado en modo
   * `actualizar-entrega` (mis-entregas).
   */
  tablaSimple?: boolean
}

/**
 * Sección "Despacho a Domicilio" del modal — incluye:
 *  - Tabla de productos a programar (read-only para "entrega ahora").
 *  - Tipo de pedido (Interno/Externo) + asignación.
 *  - Calendario para fecha/hora del slot.
 *  - Vehículo (con auto-precarga del despachador asignado).
 *  - Selector D1/D2/D3/D4 + referencia + mapa Mapbox.
 *  - Botón "Editar Cliente" + observaciones.
 */
export function SeccionDomicilio({
  form,
  clienteNombre,
  direccion,
  onEditarCliente,
  direcciones,
  cargandoDirecciones,
  cargos,
  columnDefsDomicilio,
  totalAProgramar,
  totalSinProgramar,
  ocultar,
  tablaSimple,
}: SeccionDomicilioProps) {
  const {
    productosEntrega,
    setProductosEntrega,
    mostrarMapa,
    setMostrarMapa,
    coordenadas,
    setCoordenadas,
    direccionSeleccionada,
    setDireccionSeleccionada,
    vehiculoPreseleccionadoDomicilio,
    setVehiculoPreseleccionadoDomicilio,
    tipoPedido,
    setTipoPedido,
    ubicacionGps,
    setUbicacionGps,
    slotDomicilio,
    setSlotDomicilio,
    setModalCalendarioDomicilio,
  } = useDetallesEntrega()

  // Cuando el modal se pre-rellena con datos de una entrega existente
  // (modo restante o actualizar), el form ya tiene fecha_programada/hora_*
  // pero slotDomicilio arranca null — el botón mostraría "Elegir en Calendario"
  // aunque el dato esté en el form. Este efecto reconstruye el slot a partir
  // de los valores del form para que el botón muestre la fecha asignada.
  const fechaProgramadaWatch = Form.useWatch('fecha_programada', form)
  const horaInicioWatch = Form.useWatch('hora_inicio', form)
  const horaFinWatch = Form.useWatch('hora_fin', form)

  // Watchers para mostrar el mensaje "requerido" debajo de cada campo
  // obligatorio mientras esté vacío (despachador interno y vehículo).
  const despachadorIdWatch = Form.useWatch('despachador_id', form) as string | undefined
  const vehiculoIdWatch = Form.useWatch('vehiculo_id', form) as number | undefined
  const calendarioDeshabilitado =
    (tipoPedido === TipoPedido.INTERNO && !despachadorIdWatch) || !vehiculoIdWatch

  useEffect(() => {
    if (slotDomicilio) return
    // Leer el valor AUTORITATIVO del form (no el watch): Form.useWatch va un tick
    // por detrás de form.setFieldValue. Al limpiar el slot por cambio de vehículo,
    // el watch todavía tenía la fecha vieja y reconstruía el slot recién borrado.
    // getFieldValue ya devuelve el valor limpio, así que la reconstrucción solo
    // ocurre en hidratación real (prefill), no tras un cambio de vehículo.
    const fecha = form.getFieldValue('fecha_programada')
    if (!fecha) return
    const horaI = form.getFieldValue('hora_inicio') || '00:00'
    const horaF = form.getFieldValue('hora_fin') || horaI
    const start = dayjs(`${fecha} ${horaI}`).toDate()
    const end = dayjs(`${fecha} ${horaF}`).toDate()
    setSlotDomicilio({ start, end })
  }, [fechaProgramadaWatch, horaInicioWatch, horaFinWatch, slotDomicilio, setSlotDomicilio, form])

  // Reverse geocoding propio para esta sección — apunta al setter del context.
  const obtenerUbicacionGps = useReverseGeocoding(setUbicacionGps)

  // Cambio de Tipo de Pedido (Interno → asignar despachador, Externo → cargo).
  const handleTipoPedidoChange = (value: TipoPedido) => {
    setTipoPedido(value)
    form.setFieldValue('tipo_pedido', value)
    if (value === TipoPedido.INTERNO) {
      form.setFieldValue('cargo_destino', undefined)
    } else {
      form.setFieldValue('despachador_id', undefined)
    }
  }

  // Coordenadas marcadas en el mapa.
  const handleCoordenadaChange = useCallback(
    (nuevas: Coordenadas, direccionObtenida?: string) => {
      setCoordenadas(nuevas)
      form.setFieldValue('latitud', nuevas.lat)
      form.setFieldValue('longitud', nuevas.lng)
      if (direccionObtenida) setUbicacionGps(direccionObtenida)
    },
    [form, setCoordenadas, setUbicacionGps],
  )

  // Cambio de dirección activa (D1-D4): sincroniza form, coordenadas y mapa.
  const handleDireccionChange = useCallback(
    (tipo: TipoDireccion) => {
      setDireccionSeleccionada(tipo)
      const direccionObj = direcciones.find((d) => d.tipo === tipo)
      if (!direccionObj) return

      form.setFieldValue('direccion_entrega', direccionObj.direccion)
      form.setFieldValue('direccion_seleccionada', tipo)
      form.setFieldValue('referencia_entrega', direccionObj.referencia || '')

      if (direccionObj.latitud && direccionObj.longitud) {
        const coords = {
          lat: Number(direccionObj.latitud),
          lng: Number(direccionObj.longitud),
        }
        setCoordenadas(coords)
        form.setFieldValue('latitud', coords.lat)
        form.setFieldValue('longitud', coords.lng)
        setMostrarMapa(true)
        obtenerUbicacionGps(coords.lat, coords.lng)
      } else {
        setCoordenadas(null)
        setUbicacionGps('')
        form.setFieldValue('latitud', undefined)
        form.setFieldValue('longitud', undefined)
      }
    },
    [
      direcciones,
      form,
      obtenerUbicacionGps,
      setCoordenadas,
      setDireccionSeleccionada,
      setMostrarMapa,
      setUbicacionGps,
    ],
  )

  return (
    <div className="space-y-4">
      {/* Tabla de productos: editar cuántos entregar en esta entrega.
          En modo `actualizar-entrega` (mis-entregas) usamos la tabla simple
          (Total/Entregado/Pendiente/Entregar) en lugar de la tabla nativa
          de Domicilio (Programar ahora). */}
      {!ocultar?.has('tabla-productos') && productosEntrega.length > 0 && (
        tablaSimple ? (
          <TablaProductosEntrega
            productos={productosEntrega}
            onProductoChange={setProductosEntrega}
            simple
          />
        ) : (
          <div className="space-y-2">
            <div style={{ height: '180px' }}>
              <TableWithTitle<ProductoEntrega>
                id="productos-entrega-domicilio"
                title="Lista de productos"
                selectionColor={orangeColors[10]}
                columnDefs={columnDefsDomicilio}
                rowData={productosEntrega}
              />
            </div>
            <div className="flex flex-wrap gap-2 justify-end text-xs">
              <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5">
                <span className="text-orange-700">A programar: </span>
                <span className="font-bold text-orange-800">{totalAProgramar.toFixed(2)}</span>
              </div>
              <div
                className={`border rounded-lg px-3 py-1.5 ${
                  totalSinProgramar > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <span className={totalSinProgramar > 0 ? 'text-red-700' : 'text-gray-600'}>
                  Pendientes sin programar:{' '}
                </span>
                <span className={`font-bold ${totalSinProgramar > 0 ? 'text-red-800' : 'text-gray-700'}`}>
                  {totalSinProgramar.toFixed(2)}
                </span>
              </div>
            </div>
            {totalSinProgramar > 0 && (
              <p className="text-xs text-gray-500 text-right italic">
                Las unidades sin programar quedarán como pendientes en la venta.
                Podrás programarlas luego desde <span className="font-semibold">Mis Entregas</span>.
              </p>
            )}
          </div>
        )
      )}

      {/* Campos ocultos para tipo_pedido y cargo_destino */}
      <div style={{ display: 'none' }}>
        <Form.Item name="tipo_pedido"><Input /></Form.Item>
        <Form.Item name="cargo_destino"><Input /></Form.Item>
      </div>

      {/* Tipo de Pedido + Asignación */}
      {!ocultar?.has('tipo-pedido') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Pedido:</label>
          <Segmented
            value={tipoPedido}
            onChange={(value) => handleTipoPedidoChange(value as TipoPedido)}
            options={[
              { value: TipoPedido.INTERNO, label: 'Asignar a usuario' },
              { value: TipoPedido.EXTERNO, label: 'Enviar a cargo' },
            ]}
            className="mb-3"
            block
          />
        </div>
      )}

      {/* Fila 1: Despachador/Cargo + botón calendario */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          {tipoPedido === TipoPedido.INTERNO ? (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Designar Despachador: <span className="text-red-500">*</span>
              </label>
              <SelectDespachadores
                form={form}
                propsForm={{ name: 'despachador_id' }}
                placeholder="Seleccionar despachador"
                className="w-full"
                allowClear
                onChange={(_id, despachador) => {
                  // Auto-cargar el vehículo por defecto del despachador.
                  if (despachador?.vehiculo && despachador.vehiculo.id) {
                    form.setFieldValue('vehiculo_id', despachador.vehiculo.id)
                    setVehiculoPreseleccionadoDomicilio(despachador.vehiculo)
                  } else if (!despachador) {
                    form.setFieldValue('vehiculo_id', undefined)
                    setVehiculoPreseleccionadoDomicilio(null)
                  }
                  setSlotDomicilio(null)
                  form.setFieldValue('fecha_programada', undefined)
                  form.setFieldValue('hora_inicio', undefined)
                  form.setFieldValue('hora_fin', undefined)
                }}
              />
              {!despachadorIdWatch && (
                <p className="text-xs text-red-500 mt-1">Este campo es requerido</p>
              )}
            </>
          ) : (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cargo destino: <span className="text-red-500">*</span>
              </label>
              <Select
                placeholder="Seleccionar cargo destino"
                value={form.getFieldValue('cargo_destino')}
                onChange={(value) => form.setFieldValue('cargo_destino', value)}
                options={cargos.map((c) => ({ value: c.codigo, label: c.descripcion }))}
                className="w-full"
              />
            </>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha y Hora: <span className="text-red-500">*</span>
          </label>
          {slotDomicilio ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm text-emerald-800 font-medium flex items-center gap-2">
                <FaCheck size={11} className="text-emerald-600 flex-shrink-0" />
                <span>
                  {dayjs(slotDomicilio.start).format('ddd D MMM')},{' '}
                  {dayjs(slotDomicilio.start).format('HH:mm')} —{' '}
                  {dayjs(slotDomicilio.end).format('HH:mm')}
                </span>
              </div>
              {!calendarioDeshabilitado && (
                <button
                  type="button"
                  onClick={() => setModalCalendarioDomicilio(true)}
                  className="text-slate-400 hover:text-slate-600 text-xs underline whitespace-nowrap"
                >
                  Cambiar
                </button>
              )}
            </div>
          ) : (
            <ButtonBase
              color="info"
              size="md"
              type="button"
              disabled={calendarioDeshabilitado}
              className="w-full flex items-center justify-center gap-2"
              onClick={() => setModalCalendarioDomicilio(true)}
            >
              <FaCalendarAlt size={14} />
              Elegir en Calendario
            </ButtonBase>
          )}
          {!slotDomicilio && (
            <p className="text-xs text-red-500 mt-1">Este campo es requerido</p>
          )}
          {/* Campos ocultos del slot — registrados para que getFieldsValue() los incluya */}
          <div style={{ display: 'none' }}>
            <Form.Item name="fecha_programada"><Input /></Form.Item>
            <Form.Item name="hora_inicio"><Input /></Form.Item>
            <Form.Item name="hora_fin"><Input /></Form.Item>
          </div>
        </div>
      </div>

      {/* Vehículo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <FaTruck className="inline mr-1 text-orange-500" size={13} />
          Vehículo: <span className="text-red-500">*</span>
        </label>
        <SelectVehiculos
          form={form}
          propsForm={{ name: 'vehiculo_id' }}
          placeholder="Seleccionar vehículo"
          className="w-full"
          allowClear
          vehiculoPreseleccionado={vehiculoPreseleccionadoDomicilio}
          onChange={(_id, vehiculo) => {
            setVehiculoPreseleccionadoDomicilio(
              vehiculo
                ? {
                    id: vehiculo.id,
                    name: vehiculo.name,
                    tipo: vehiculo.tipo,
                    placa: vehiculo.placa ?? null,
                  }
                : null,
            )
            setSlotDomicilio(null)
            form.setFieldValue('fecha_programada', undefined)
            form.setFieldValue('hora_inicio', undefined)
            form.setFieldValue('hora_fin', undefined)
          }}
        />
        {!vehiculoIdWatch && (
          <p className="text-xs text-red-500 mt-1">Este campo es requerido</p>
        )}
        <div style={{ display: 'none' }}>
          <Form.Item name="vehiculo_id"><Input /></Form.Item>
        </div>
      </div>

      {/* Selector D1-D4 + Referencia + Mapa */}
      <div className="space-y-3">
        <div style={{ display: 'none' }}>
          <Form.Item name="direccion_entrega"><Input /></Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Columna izquierda: Selector + Referencia + botones */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección de entrega: <span className="text-red-500">*</span>
              </label>
              {cargandoDirecciones ? (
                <div className="text-xs text-gray-400">Cargando direcciones del cliente...</div>
              ) : direcciones.length === 0 ? (
                <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded p-2">
                  Este cliente no tiene direcciones registradas. Edita el cliente para agregarlas.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {(['D1', 'D2', 'D3', 'D4'] as TipoDireccion[]).map((tipo) => {
                    const dir = direcciones.find((d) => d.tipo === tipo)
                    const activa = direccionSeleccionada === tipo
                    const disabled = !dir
                    return (
                      <button
                        key={tipo}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleDireccionChange(tipo)}
                        className={`text-left px-3 py-2 rounded-lg border transition ${
                          disabled
                            ? 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed'
                            : activa
                            ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-200 text-orange-800'
                            : 'bg-white border-gray-300 hover:border-orange-400 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{tipo}</span>
                          {dir?.es_principal && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                              Principal
                            </span>
                          )}
                          {dir?.latitud && dir?.longitud && (
                            <span className="text-[10px] text-green-600">📍 GPS</span>
                          )}
                        </div>
                        <div className="text-xs mt-1 line-clamp-2">
                          {dir?.referencia || (
                            dir
                              ? <span className="italic text-gray-400">Sin referencia</span>
                              : <span className="italic">No registrada</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referencia: <span className="text-gray-400 text-xs">(ubicación para el chofer)</span>
              </label>
              <TextareaBase
                propsForm={{ name: 'referencia_entrega' }}
                placeholder="Ej: frente al parque, portón verde, entre calle X y Y..."
                rows={3}
              />
              {ubicacionGps && (
                <p
                  className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded mt-1 truncate"
                  title={ubicacionGps}
                >
                  📍 Ubicación GPS: {ubicacionGps}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <ButtonBase
                color="info"
                size="sm"
                type="button"
                className="flex items-center gap-2 text-sm flex-1"
                onClick={() => setMostrarMapa(!mostrarMapa)}
              >
                <FaMapMarkedAlt size={14} />
                {mostrarMapa ? 'Ocultar' : 'Ver'} Mapa
              </ButtonBase>

              <ButtonBase
                color="warning"
                size="sm"
                type="button"
                className="flex items-center gap-2 text-sm flex-1"
                onClick={onEditarCliente}
              >
                <FaUserEdit size={14} />
                Editar Cliente
              </ButtonBase>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones:</label>
              <TextareaBase
                propsForm={{ name: 'observaciones' }}
                placeholder="Observaciones (opcional)"
                rows={3}
              />
            </div>
          </div>

          {/* Columna derecha: Mapa */}
          <div>
            {mostrarMapa ? (
              <div className="h-full min-h-[300px]">
                <MapaDireccionMapbox
                  key={`${direccionSeleccionada}-${mostrarMapa ? 'visible' : 'hidden'}`}
                  direccion={form.getFieldValue('direccion_entrega') || direccion || ''}
                  clienteNombre={clienteNombre}
                  onCoordenadaChange={handleCoordenadaChange}
                  coordenadasIniciales={coordenadas}
                  editable={true}
                />
              </div>
            ) : (
              <div className="h-full min-h-[300px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
                <FaMapMarkedAlt size={32} className="text-gray-300" />
                <span>{direccion ? 'Click en "Ver Mapa" para marcar ubicación' : 'Sin dirección'}</span>
                {coordenadas && (
                  <span className="text-xs text-green-600 font-mono">
                    Ubicación guardada: {coordenadas.lat.toFixed(4)}, {coordenadas.lng.toFixed(4)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
