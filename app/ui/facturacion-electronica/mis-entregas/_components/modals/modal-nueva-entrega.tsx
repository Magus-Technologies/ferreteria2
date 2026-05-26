'use client'

import { useState, useEffect, useMemo } from 'react'
import { Modal, Button, Select, DatePicker, Input, Spin } from 'antd'
import { FaTruck } from 'react-icons/fa'
import dayjs from 'dayjs'
import { useAuth } from '~/lib/auth-context'
import { ventaApi } from '~/lib/api/venta'
import { choferApi } from '~/lib/api/chofer'
import { vehiculosApi } from '~/lib/api/catalogos'
import { almacenesApi } from '~/lib/api/almacen'
import type { ResumenVenta } from '~/lib/api/entregas'

interface Props {
  open: boolean
  onClose: () => void
  onCrear: (data: any) => Promise<void>
  venta: ResumenVenta | undefined
  loading?: boolean
}

export default function ModalNuevaEntrega({ open, onClose, onCrear, venta, loading }: Props) {
  const { user } = useAuth()

  // Formulario
  const [tipoEntrega,    setTipoEntrega]    = useState('de')
  const [tipoDespacho,   setTipoDespacho]   = useState('in')
  const [quienEntrega,   setQuienEntrega]   = useState('almacen')
  const [almacenId,      setAlmacenId]      = useState<number | null>(null)
  const [choferId,       setChoferId]       = useState<string | null>(null)
  const [vehiculoId,     setVehiculoId]     = useState<number | null>(null)
  const [fechaProg,      setFechaProg]      = useState<string | null>(null)
  const [horaInicio,     setHoraInicio]     = useState<string | null>(null)
  const [direccion,      setDireccion]      = useState('')
  const [referencia,     setReferencia]     = useState('')
  const [observaciones,  setObservaciones]  = useState('')

  // Data remota
  const [ventaDetalle,   setVentaDetalle]   = useState<any>(null)
  const [almacenes,      setAlmacenes]      = useState<any[]>([])
  const [choferes,       setChoferes]       = useState<any[]>([])
  const [vehiculos,      setVehiculos]      = useState<any[]>([])
  const [loadingData,    setLoadingData]    = useState(false)

  // Cargar datos cuando abre
  useEffect(() => {
    if (!open || !venta) return
    setLoadingData(true)

    Promise.all([
      ventaApi.getById(venta.venta_id),
      almacenesApi.getAll(),
      choferApi.getAll({}),
      vehiculosApi.getAll(),
    ]).then(([vRes, aRes, cRes, vehRes]) => {
      setVentaDetalle(vRes.data?.data ?? vRes.data ?? null)
      setAlmacenes(aRes.data?.data ?? [])
      setChoferes((cRes.data as any)?.data ?? [])
      setVehiculos(vehRes.data?.data ?? [])
    }).finally(() => setLoadingData(false))
  }, [open, venta])

  // Reset al cerrar
  useEffect(() => {
    if (!open) {
      setTipoEntrega('de'); setTipoDespacho('in'); setQuienEntrega('almacen')
      setAlmacenId(null); setChoferId(null); setVehiculoId(null)
      setFechaProg(null); setHoraInicio(null)
      setDireccion(''); setReferencia(''); setObservaciones('')
      setVentaDetalle(null)
    }
  }, [open])

  // Extraer productos pendientes de la venta
  // La respuesta de GET /ventas/{id} usa snake_case en las relaciones:
  //   productosPorAlmacen → productos_por_almacen
  //   unidadesDerivadas   → unidades_derivadas
  //   productoAlmacen     → producto_almacen
  const productosPendientes = useMemo(() => {
    if (!ventaDetalle) return []
    const unidades: any[] = []
    const productos = ventaDetalle.productos_por_almacen ?? []
    for (const prod of productos) {
      for (const udv of prod.unidades_derivadas ?? []) {
        if ((udv.cantidad_pendiente ?? 0) > 0) {
          unidades.push({
            unidad_derivada_venta_id: udv.id,
            cantidad: udv.cantidad_pendiente,
            nombre: prod.producto_almacen?.producto?.name ?? 'Producto',
            unidad: udv.unidad_derivada_inmutable?.name ?? '—',
          })
        }
      }
    }
    return unidades
  }, [ventaDetalle])

  const puedeEnviar = almacenId && productosPendientes.length > 0 && user?.id

  const handleSubmit = async () => {
    if (!puedeEnviar || !venta) return
    await onCrear({
      venta_id:           venta.venta_id,
      tipo_entrega:       tipoEntrega,
      tipo_despacho:      tipoDespacho,
      quien_entrega:      quienEntrega,
      almacen_salida_id:  almacenId,
      chofer_id:          choferId,
      vehiculo_id:        vehiculoId,
      tipo_pedido:        'interno',
      fecha_programada:   fechaProg,
      hora_inicio:        horaInicio,
      direccion_entrega:  direccion || null,
      referencia_entrega: referencia || null,
      observaciones:      observaciones || null,
      productos:          productosPendientes.map(p => ({
        unidad_derivada_venta_id: p.unidad_derivada_venta_id,
        cantidad: p.cantidad,
      })),
      user_creador_id: user!.id,
    })
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
            <FaTruck className="text-blue-600" />
          </div>
          <div>
            <div className="font-bold text-slate-800">Nueva Entrega</div>
            <div className="text-xs text-slate-500">
              {venta ? `${venta.venta_numero} — ${venta.cliente_nombre}` : ''}
            </div>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={540}
      centered
      destroyOnHidden
      footer={
        <div className="flex justify-between pt-2">
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            type="primary"
            icon={<FaTruck />}
            disabled={!puedeEnviar}
            loading={loading}
            onClick={handleSubmit}
          >
            Crear Entrega
          </Button>
        </div>
      }
    >
      {loadingData ? (
        <div className="flex justify-center py-8"><Spin /></div>
      ) : (
        <div className="space-y-4 py-1">

          {/* Tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de entrega</label>
              <Select className="w-full" value={tipoEntrega} onChange={setTipoEntrega}
                options={[
                  { value: 'rt', label: 'Recojo en Tienda' },
                  { value: 'de', label: 'Domicilio' },
                  { value: 'pa', label: 'Paquetería' },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Despacho</label>
              <Select className="w-full" value={tipoDespacho} onChange={setTipoDespacho}
                options={[
                  { value: 'in', label: 'Inmediato' },
                  { value: 'pr', label: 'Programado' },
                ]}
              />
            </div>
          </div>

          {/* Logística */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Quien entrega</label>
              <Select className="w-full" value={quienEntrega} onChange={v => { setQuienEntrega(v); if (v !== 'chofer') { setChoferId(null); setVehiculoId(null) } }}
                options={[
                  { value: 'almacen', label: 'Almacén' },
                  { value: 'vendedor', label: 'Vendedor' },
                  { value: 'chofer', label: 'Chofer' },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Almacén salida <span className="text-red-500">*</span></label>
              <Select className="w-full" value={almacenId} onChange={setAlmacenId} placeholder="Seleccionar"
                options={almacenes.map((a: any) => ({ value: a.id, label: a.name }))}
              />
            </div>
          </div>

          {/* Chofer + Vehículo */}
          {quienEntrega === 'chofer' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Chofer</label>
                <Select className="w-full" value={choferId} onChange={setChoferId} placeholder="Seleccionar" allowClear
                  options={choferes.map((c: any) => ({ value: c.id, label: c.name }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Vehículo</label>
                <Select className="w-full" value={vehiculoId} onChange={setVehiculoId} placeholder="Seleccionar" allowClear
                  options={vehiculos.map((v: any) => ({ value: v.id, label: `${v.name} (${v.placa ?? '—'})` }))}
                />
              </div>
            </div>
          )}

          {/* Fecha programada */}
          {tipoDespacho === 'pr' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha programada</label>
                <DatePicker className="w-full" format="DD/MM/YYYY"
                  onChange={d => setFechaProg(d ? d.format('YYYY-MM-DD') : null)}
                  disabledDate={d => d.isBefore(dayjs(), 'day')}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hora inicio</label>
                <Input placeholder="08:00" value={horaInicio ?? ''}
                  onChange={e => setHoraInicio(e.target.value || null)} />
              </div>
            </div>
          )}

          {/* Dirección */}
          {tipoEntrega === 'de' && (
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dirección de entrega</label>
                <Input value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Av. ..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Referencia</label>
                <Input value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Cerca de ..." />
              </div>
            </div>
          )}

          {/* Productos pendientes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Productos a entregar ({productosPendientes.length})
            </label>
            {productosPendientes.length === 0 ? (
              <div className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3 text-center">
                {ventaDetalle ? 'Sin productos pendientes' : 'Cargando...'}
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-36 overflow-y-auto">
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-slate-100">
                    {productosPendientes.map((p, i) => (
                      <tr key={i} className="bg-white">
                        <td className="px-3 py-2 text-slate-700">{p.nombre}</td>
                        <td className="px-3 py-2 text-slate-500 whitespace-nowrap">{p.unidad}</td>
                        <td className="px-3 py-2 text-right font-semibold text-emerald-700 whitespace-nowrap">
                          {Number(p.cantidad).toFixed(0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Observaciones</label>
            <Input.TextArea rows={2} value={observaciones}
              onChange={e => setObservaciones(e.target.value)} placeholder="Opcional..." />
          </div>
        </div>
      )}
    </Modal>
  )
}
