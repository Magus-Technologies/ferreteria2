'use client'

import { Form, Input, Segmented, Select, Switch, type FormInstance } from 'antd'
import { useCallback } from 'react'
import dynamic from 'next/dynamic'
import { FaCalendarAlt, FaCheck, FaMapMarkedAlt, FaTruck, FaUserEdit } from 'react-icons/fa'
import dayjs from 'dayjs'
import type { ColDef } from 'ag-grid-community'
import ButtonBase from '~/components/buttons/button-base'
import SelectDespachadores from '~/app/_components/form/selects/select-despachadores'
import SelectVehiculos from '~/app/_components/form/selects/select-vehiculos'
import TextareaBase from '~/app/_components/form/inputs/textarea-base'
import TableWithTitle from '~/components/tables/table-with-title'
import { orangeColors } from '~/lib/colors'
import { TipoPedido } from '~/lib/api/entrega-producto'
import type { TipoDireccion, ClienteDireccion } from '~/lib/api/cliente'
import type { ProductoEntrega } from '../../../../../_hooks/use-productos-entrega'
import { useDetallesEntrega } from '../context'
import { useReverseGeocoding } from '../hooks/use-reverse-geocoding'
import type { Coordenadas, SeccionOcultable } from '../types'
import type { Cargo } from '../hooks/use-cargos'

// Mapa cargado dinámicamente para evitar SSR.
const MapaDireccionMapbox = dynamic(
  () => import('../../../../../_components/maps/mapa-direccion-mapbox'),
  { ssr: false },
)

interface SeccionRestoProgramadoProps {
  form: FormInstance
  clienteNombre?: string
  onEditarCliente: () => void
  direcciones: ClienteDireccion[]
  cargandoDirecciones: boolean
  cargos: Cargo[]
  columnDefsResto: ColDef<ProductoEntrega>[]
  restoDireccionEntrega?: string
  ocultar?: Set<SeccionOcultable>
}

/**
 * Sub-sección "¿Programar entrega del resto?" — vive dentro del modo Parcial.
 *
 * Incluye:
 *  - Switch principal (programarResto).
 *  - Tabla de productos restantes (filtrada por `total - entregar > 0`).
 *  - Tipo de pedido + asignación + calendario + vehículo (todo con prefijo
 *    `_resto_*` en los campos del form para no chocar con la sección
 *    Domicilio que comparte el mismo modelo).
 *  - Selector D1/D2/D3/D4 + referencia + mapa Mapbox.
 *  - Observaciones (no en el form, en state local del context).
 */
export function SeccionRestoProgramado({
  form,
  clienteNombre,
  onEditarCliente,
  direcciones,
  cargandoDirecciones,
  cargos,
  columnDefsResto,
  restoDireccionEntrega,
  ocultar,
}: SeccionRestoProgramadoProps) {
  const {
    productosEntrega,
    programarResto,
    setProgramarResto,
    mostrarMapaResto,
    setMostrarMapaResto,
    coordenadasResto,
    setCoordenadasResto,
    direccionSeleccionadaResto,
    setDireccionSeleccionadaResto,
    tipoPedidoResto,
    setTipoPedidoResto,
    vehiculoPreseleccionadoResto,
    setVehiculoPreseleccionadoResto,
    ubicacionGpsResto,
    setUbicacionGpsResto,
    observacionesResto,
    setObservacionesResto,
    slotResto,
    setModalCalendarioResto,
  } = useDetallesEntrega()

  // Reverse geocoding propio que escribe en `ubicacionGpsResto`.
  const obtenerUbicacionGpsResto = useReverseGeocoding(setUbicacionGpsResto)

  // Cambio de Tipo de Pedido del Resto.
  const handleTipoPedidoChangeResto = (value: TipoPedido) => {
    setTipoPedidoResto(value)
    form.setFieldValue('_resto_tipo_pedido', value)
    if (value === TipoPedido.INTERNO) {
      form.setFieldValue('_resto_cargo_destino', undefined)
    } else {
      form.setFieldValue('_resto_despachador_id', undefined)
    }
  }

  // Cambio de dirección activa (D1-D4) en la sección Resto.
  const handleDireccionChangeResto = useCallback(
    (tipo: TipoDireccion) => {
      setDireccionSeleccionadaResto(tipo)
      const direccionObj = direcciones.find((d) => d.tipo === tipo)
      if (!direccionObj) return

      form.setFieldValue('_resto_direccion_entrega', direccionObj.direccion)
      form.setFieldValue('_resto_referencia_entrega', direccionObj.referencia || '')

      if (direccionObj.latitud && direccionObj.longitud) {
        const coords = {
          lat: Number(direccionObj.latitud),
          lng: Number(direccionObj.longitud),
        }
        setCoordenadasResto(coords)
        form.setFieldValue('_resto_latitud', coords.lat)
        form.setFieldValue('_resto_longitud', coords.lng)
        setMostrarMapaResto(true)
        obtenerUbicacionGpsResto(coords.lat, coords.lng)
      } else {
        setCoordenadasResto(null)
        setUbicacionGpsResto('')
        form.setFieldValue('_resto_latitud', undefined)
        form.setFieldValue('_resto_longitud', undefined)
      }
    },
    [
      direcciones,
      form,
      obtenerUbicacionGpsResto,
      setCoordenadasResto,
      setDireccionSeleccionadaResto,
      setMostrarMapaResto,
      setUbicacionGpsResto,
    ],
  )

  // Coordenadas marcadas en el mapa del Resto.
  const handleCoordenadaChangeResto = useCallback(
    (nuevas: Coordenadas, direccionObtenida?: string) => {
      setCoordenadasResto(nuevas)
      form.setFieldValue('_resto_latitud', nuevas.lat)
      form.setFieldValue('_resto_longitud', nuevas.lng)
      if (direccionObtenida) setUbicacionGpsResto(direccionObtenida)
    },
    [form, setCoordenadasResto, setUbicacionGpsResto],
  )

  // Cuando se oculta el switch (modo `actualizar-entrega`), los campos del
  // resto se muestran siempre — no hay un toggle de "¿programar resto?".
  const switchOculto = ocultar?.has('programar-resto') ?? false
  const mostrarCamposResto = switchOculto
    ? true
    : programarResto && productosEntrega.some((p) => p.total - p.entregar > 0)

  return (
    <div className="border-t border-gray-200 pt-4">
      {!switchOculto && (
        <div className="flex items-center gap-3">
          <Switch checked={programarResto} onChange={setProgramarResto} size="small" />
          <span className="text-sm font-medium text-gray-700">
            ¿Programar entrega del resto?
          </span>
          {productosEntrega.some((p) => p.total - p.entregar > 0) && (
            <span className="text-xs text-gray-500">
              ({productosEntrega.reduce((acc, p) => acc + (p.total - p.entregar), 0)} unidad(es) pendiente(s))
            </span>
          )}
        </div>
      )}

      {mostrarCamposResto && (
        <div className="mt-4 space-y-4">
          {!ocultar?.has('tabla-productos') && (
            <div style={{ height: '150px' }}>
              <TableWithTitle<ProductoEntrega>
                id="productos-entrega-resto"
                title="Productos pendientes para entrega programada"
                selectionColor={orangeColors[10]}
                columnDefs={columnDefsResto}
                rowData={productosEntrega.filter((p) => p.total - p.entregar > 0)}
              />
            </div>
          )}

          {/* Campos ocultos — todos con prefijo `_resto_*` */}
          <div style={{ display: 'none' }}>
            <Form.Item name="_resto_tipo_pedido"><Input /></Form.Item>
            <Form.Item name="_resto_cargo_destino"><Input /></Form.Item>
          </div>

          {!ocultar?.has('tipo-pedido') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Pedido:</label>
              <Segmented
                value={tipoPedidoResto}
                onChange={(value) => handleTipoPedidoChangeResto(value as TipoPedido)}
                options={[
                  { value: TipoPedido.INTERNO, label: 'Asignar a usuario' },
                  { value: TipoPedido.EXTERNO, label: 'Enviar a cargo' },
                ]}
                className="mb-3"
                block
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              {tipoPedidoResto === TipoPedido.INTERNO ? (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Designar Despachador: <span className="text-red-500">*</span>
                  </label>
                  <SelectDespachadores
                    form={form}
                    propsForm={{ name: '_resto_despachador_id' }}
                    placeholder="Sin asignar (todos los despachadores lo verán)"
                    className="w-full"
                    allowClear
                    onChange={(_id, despachador) => {
                      if (despachador?.vehiculo && despachador.vehiculo.id) {
                        form.setFieldValue('_resto_vehiculo_id', despachador.vehiculo.id)
                        setVehiculoPreseleccionadoResto(despachador.vehiculo)
                      } else if (!despachador) {
                        form.setFieldValue('_resto_vehiculo_id', undefined)
                        setVehiculoPreseleccionadoResto(null)
                      }
                    }}
                  />
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo destino: <span className="text-red-500">*</span>
                  </label>
                  <Select
                    placeholder="Seleccionar cargo destino"
                    value={form.getFieldValue('_resto_cargo_destino')}
                    onChange={(value) => form.setFieldValue('_resto_cargo_destino', value)}
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
              {slotResto ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm text-emerald-800 font-medium flex items-center gap-2">
                    <FaCheck size={11} className="text-emerald-600 flex-shrink-0" />
                    <span>
                      {dayjs(slotResto.start).format('ddd D MMM')},{' '}
                      {dayjs(slotResto.start).format('HH:mm')} —{' '}
                      {dayjs(slotResto.end).format('HH:mm')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalCalendarioResto(true)}
                    className="text-slate-400 hover:text-slate-600 text-xs underline whitespace-nowrap"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <ButtonBase
                  color="info"
                  size="md"
                  type="button"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => setModalCalendarioResto(true)}
                >
                  <FaCalendarAlt size={14} />
                  Elegir en Calendario
                </ButtonBase>
              )}
              <div style={{ display: 'none' }}>
                <Form.Item name="_resto_fecha_programada"><Input /></Form.Item>
              </div>
            </div>
          </div>

          {/* Vehículo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaTruck className="inline mr-1 text-orange-500" size={13} />
              Vehículo: <span className="text-gray-400 text-xs">(opcional)</span>
            </label>
            <SelectVehiculos
              form={form}
              propsForm={{ name: '_resto_vehiculo_id' }}
              placeholder="Sin vehículo asignado"
              className="w-full"
              allowClear
              vehiculoPreseleccionado={vehiculoPreseleccionadoResto}
            />
            <div style={{ display: 'none' }}>
              <Form.Item name="_resto_vehiculo_id"><Input /></Form.Item>
            </div>
          </div>

          {/* Selector D1-D4 + Referencia + Mapa */}
          <div className="space-y-3">
            <div style={{ display: 'none' }}>
              <Form.Item name="_resto_direccion_entrega"><Input /></Form.Item>
              <Form.Item name="_resto_latitud"><Input /></Form.Item>
              <Form.Item name="_resto_longitud"><Input /></Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                        const activa = direccionSeleccionadaResto === tipo
                        const disabled = !dir
                        return (
                          <button
                            key={tipo}
                            type="button"
                            disabled={disabled}
                            onClick={() => handleDireccionChangeResto(tipo)}
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
                    propsForm={{ name: '_resto_referencia_entrega' }}
                    placeholder="Ej: frente al parque, portón verde, entre calle X y Y..."
                    rows={3}
                  />
                  {ubicacionGpsResto && (
                    <p
                      className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded mt-1 truncate"
                      title={ubicacionGpsResto}
                    >
                      📍 Ubicación GPS: {ubicacionGpsResto}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <ButtonBase
                    color="info"
                    size="sm"
                    type="button"
                    className="flex items-center gap-2 text-sm flex-1"
                    onClick={() => setMostrarMapaResto(!mostrarMapaResto)}
                  >
                    <FaMapMarkedAlt size={14} />
                    {mostrarMapaResto ? 'Ocultar' : 'Ver'} Mapa
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
                  <Input.TextArea
                    value={observacionesResto}
                    onChange={(e) => setObservacionesResto(e.target.value)}
                    placeholder="Observaciones (opcional)"
                    rows={3}
                  />
                </div>
              </div>

              {/* Mapa */}
              <div>
                {mostrarMapaResto ? (
                  <div className="h-full min-h-[300px]">
                    <MapaDireccionMapbox
                      key={`resto-${direccionSeleccionadaResto}-${coordenadasResto?.lat}-${coordenadasResto?.lng}`}
                      direccion={restoDireccionEntrega || ''}
                      clienteNombre={clienteNombre}
                      onCoordenadaChange={handleCoordenadaChangeResto}
                      coordenadasIniciales={coordenadasResto}
                      editable={true}
                    />
                  </div>
                ) : (
                  <div className="h-full min-h-[300px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
                    <FaMapMarkedAlt size={32} className="text-gray-300" />
                    <span>{restoDireccionEntrega ? 'Click en "Ver Mapa" para marcar ubicación' : 'Sin dirección'}</span>
                    {coordenadasResto && (
                      <span className="text-xs text-green-600 font-mono">
                        Ubicación guardada: {coordenadasResto.lat.toFixed(4)}, {coordenadasResto.lng.toFixed(4)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

