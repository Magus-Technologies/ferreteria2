'use client'

import { Modal, Spin, Alert, Table, Drawer, Tag } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import { gananciasApi, type PepsProductoAnalisis, type PepsFraccionAnalisis } from '~/lib/api/ganancias'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import LabelBase from '~/components/form/label-base'
import ButtonBase from '~/components/buttons/button-base'
import { FaSearch, FaExchangeAlt, FaChartLine } from 'react-icons/fa'

interface ModalAnalisisPepsComprasProps {
  open: boolean
  onClose: () => void
  filtros: any
}

interface VentaEnCompra {
  venta_id: number
  serie_numero?: string
  fecha: string
  cantidad: number
  precio: number
  ingreso: number
  ganancia_tc_compra: number
  ganancia_tc_pago?: number
  diferencia_cambio?: number
  fracciones: PepsFraccionAnalisis[]
}

interface CompraView {
  compra_id: number
  serie_numero: string
  tc_compra: number
  tc_pago?: number
  tc_pago_real: boolean
  tc_es_fallback: boolean
  costo_usd: number
  cantidad_total: number
  costo_tc_compra_total: number
  costo_tc_pago_total: number
  diferencia_total: number
  ventas: VentaEnCompra[]
}

const fmt = (n: number | undefined) => (n !== undefined ? n.toFixed(2) : '0.00')
const fmtS = (n: number | undefined) => {
  if (n === undefined) return '+0.00'
  return (n >= 0 ? '+' : '') + n.toFixed(2)
}
const colorPos = (n: number | undefined) => (n !== undefined && n >= 0 ? '#16a34a' : '#dc2626')
const colorImpacto = (n: number | undefined) => (n !== undefined && n <= 0 ? '#16a34a' : '#dc2626')

function buildComprasView(productos: PepsProductoAnalisis[]): CompraView[] {
  const comprasMap = new Map<number, CompraView>()
  const ventasMap = new Map<number, VentaEnCompra>()

  productos.forEach(producto => {
    producto.ventas.forEach(venta => {
      ventasMap.set(venta.venta_id, {
        venta_id: venta.venta_id,
        serie_numero: venta.serie_numero,
        fecha: venta.fecha,
        cantidad: venta.cantidad,
        precio: venta.precio,
        ingreso: venta.ingreso,
        ganancia_tc_compra: venta.ganancia_tc_compra,
        ganancia_tc_pago: venta.ganancia_tc_pago,
        diferencia_cambio: venta.diferencia_cambio,
        fracciones: venta.fracciones,
      })
    })
  })

  productos.forEach(producto => {
    producto.ventas.forEach(venta => {
      venta.fracciones.forEach(fraccion => {
        if (!comprasMap.has(fraccion.compra_id)) {
          comprasMap.set(fraccion.compra_id, {
            compra_id: fraccion.compra_id,
            serie_numero: fraccion.serie_numero,
            tc_compra: fraccion.tc_compra,
            tc_pago: fraccion.tc_pago,
            tc_pago_real: fraccion.tc_pago_real,
            tc_es_fallback: (fraccion as any).tc_es_fallback ?? false,
            costo_usd: fraccion.costo_usd,
            cantidad_total: 0,
            costo_tc_compra_total: 0,
            costo_tc_pago_total: 0,
            diferencia_total: 0,
            ventas: [],
          })
        }

        const compra = comprasMap.get(fraccion.compra_id)!

        if (!compra.ventas.find(v => v.venta_id === venta.venta_id)) {
          const ventaFull = ventasMap.get(venta.venta_id)
          if (ventaFull) compra.ventas.push(ventaFull)
        }

        compra.cantidad_total += fraccion.cantidad
        compra.costo_tc_compra_total += fraccion.costo_tc_compra
        if (fraccion.costo_tc_pago !== undefined) {
          compra.costo_tc_pago_total += fraccion.costo_tc_pago
          compra.diferencia_total += fraccion.costo_tc_pago - fraccion.costo_tc_compra
        }
      })
    })
  })

  return Array.from(comprasMap.values()).sort((a, b) => a.compra_id - b.compra_id)
}

export default function ModalAnalisisPepsCompras({ open, onClose, filtros: filtrosGlobales }: ModalAnalisisPepsComprasProps) {
  const [localFiltros, setLocalFiltros] = useState({
    desde: filtrosGlobales.desde || dayjs().startOf('month').format('YYYY-MM-DD'),
    hasta: filtrosGlobales.hasta || dayjs().format('YYYY-MM-DD'),
  })
  const [drawerCompra, setDrawerCompra] = useState<CompraView | null>(null)

  useEffect(() => {
    if (open) {
      setLocalFiltros({
        desde: filtrosGlobales.desde || dayjs().startOf('month').format('YYYY-MM-DD'),
        hasta: filtrosGlobales.hasta || dayjs().format('YYYY-MM-DD'),
      })
    }
  }, [open, filtrosGlobales.desde, filtrosGlobales.hasta])

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['analisis-peps', localFiltros.desde, localFiltros.hasta, filtrosGlobales.almacen_id],
    queryFn: () => gananciasApi.getAnalisisPeps({
      desde: localFiltros.desde,
      hasta: localFiltros.hasta,
      almacen_id: filtrosGlobales.almacen_id,
    }),
    enabled: open,
  })

  const resultado = data?.data?.data
  const resumen = resultado?.resumen
  const productos = resultado?.productos ?? []
  const pendingPayments = resultado?.pending_payments ?? []
  const comprasView = useMemo(() => buildComprasView(productos), [productos])

  const mainColumns = useMemo(() => [
    {
      title: 'Compra',
      dataIndex: 'serie_numero',
      key: 'serie_numero',
      render: (v: string, row: CompraView) => (
        <div>
          <div className="font-semibold text-slate-700 text-sm">{v}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">${row.costo_usd.toFixed(4)}/u</div>
        </div>
      ),
    },
    {
      title: 'TC Compra → Pago',
      key: 'tc',
      width: 200,
      align: 'center' as const,
      render: (_: any, row: CompraView) => (
        <span className="text-xs">
          <span className="text-blue-600 font-medium">{row.tc_compra.toFixed(4)}</span>
          {row.tc_pago_real && row.tc_pago ? (
            <>
              <span className="text-slate-400 mx-1">→</span>
              <span className="text-green-600 font-medium">{row.tc_pago.toFixed(4)}</span>
              {(row as any).tc_es_fallback && (
                <span className="text-amber-500 text-[10px] ml-1" title="Pago registrado sin TC — se usa el TC de compra">*sin TC</span>
              )}
            </>
          ) : (
            <span className="text-slate-300 text-[10px] ml-1">(sin pago)</span>
          )}
        </span>
      ),
    },
    {
      title: 'Unid. consumidas',
      dataIndex: 'cantidad_total',
      key: 'cantidad_total',
      width: 140,
      align: 'right' as const,
      render: (v: number) => <span className="text-slate-600">{v.toFixed(2)} u</span>,
    },
    {
      title: 'Impacto TC',
      dataIndex: 'diferencia_total',
      key: 'dif',
      width: 120,
      align: 'right' as const,
      render: (v: number) => <b style={{ color: colorImpacto(v) }}>S/ {fmtS(v)}</b>,
    },
    {
      title: 'Ventas',
      dataIndex: 'ventas',
      key: 'ventas',
      width: 75,
      align: 'center' as const,
      render: (ventas: VentaEnCompra[]) => (
        <Tag color="blue" className="text-[11px]">{ventas.length}</Tag>
      ),
    },
  ], [])

  return (
    <>
      <Modal
        title="Análisis PEPS — Diferencia de Tipo de Cambio"
        open={open}
        onCancel={onClose}
        footer={null}
        width={780}
        centered
        destroyOnHidden
        styles={{ body: { padding: '16px' } }}
      >
        <div className="flex flex-col gap-4">

          {/* Filtros */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-wrap items-end gap-3">
            <LabelBase label="Desde" orientation="column" className="!gap-1">
              <DatePickerBase
                value={localFiltros.desde ? dayjs(localFiltros.desde) : null}
                onChange={(date) => setLocalFiltros(prev => ({ ...prev, desde: date ? date.format('YYYY-MM-DD') : '' }))}
                allowClear
                className="!w-[130px]"
              />
            </LabelBase>
            <LabelBase label="Hasta" orientation="column" className="!gap-1">
              <DatePickerBase
                value={localFiltros.hasta ? dayjs(localFiltros.hasta) : null}
                onChange={(date) => setLocalFiltros(prev => ({ ...prev, hasta: date ? date.format('YYYY-MM-DD') : '' }))}
                allowClear
                className="!w-[130px]"
              />
            </LabelBase>
            <ButtonBase
              color="info"
              size="md"
              className="flex items-center gap-2 h-[32px] px-6"
              onClick={() => refetch()}
              loading={isFetching}
            >
              <FaSearch size={12} />
              Buscar
            </ButtonBase>
          </div>

          {/* Cards resumen */}
          {resumen && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-sm">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Ingreso total</div>
                <div className="text-lg font-bold text-slate-700">S/ {fmt(resumen.ingreso_total)}</div>
              </div>
              {resumen.ganancia_tc_pago !== undefined ? (
                <>
                  <div className="bg-white border border-green-100 rounded-lg p-3 text-center shadow-sm">
                    <div className="text-[10px] text-green-600 font-bold uppercase mb-1">Ganancia real (TC pago)</div>
                    <div className="text-lg font-bold" style={{ color: colorPos(resumen.ganancia_tc_pago) }}>
                      S/ {fmt(resumen.ganancia_tc_pago)}
                    </div>
                  </div>
                  <div className={`border rounded-lg p-3 text-center shadow-sm ${resumen.perdida_por_cambio ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <div className={`text-[10px] font-bold uppercase mb-1 flex items-center justify-center gap-1 ${resumen.perdida_por_cambio ? 'text-red-600' : 'text-green-600'}`}>
                      <FaExchangeAlt size={10} />
                      Impacto diferencia TC
                    </div>
                    <div className="text-lg font-bold" style={{ color: colorImpacto(resumen.diferencia_total) }}>
                      {fmtS(resumen.diferencia_total)}
                    </div>
                    <div className={`text-[10px] mt-0.5 ${resumen.perdida_por_cambio ? 'text-red-500' : 'text-green-500'}`}>
                      {resumen.total_productos} producto(s)
                    </div>
                  </div>
                </>
              ) : (
                <div className="col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-3 text-center shadow-sm">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Estado</div>
                  <div className="text-sm text-slate-600">Sin pagos registrados</div>
                  <div className="text-[10px] text-slate-400 mt-1">{resumen.total_productos} producto(s)</div>
                </div>
              )}
            </div>
          )}

          {/* Avisos */}
          {resumen?.aviso_sin_tc_pago && (
            <Alert type="info" showIcon
              message="Algunos pagos no tienen TC registrado. Se usa el TC de compra como referencia para esos lotes."
            />
          )}
          
          {/* Alertas de riesgo por TC */}
          {resumen?.compras_con_riesgo && resumen.compras_con_riesgo.length > 0 && (
            <Alert type="warning" showIcon
              message={`⚠️ ${resumen.compras_con_riesgo.length} compra(s) con variación de TC > 2%`}
              description={
                <div className="text-xs space-y-1 mt-2">
                  {resumen.compras_con_riesgo.map((compra, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span>{compra.serie_numero}: {compra.variacion_porcentaje > 0 ? '+' : ''}{compra.variacion_porcentaje}%</span>
                      <span className={`font-semibold ${compra.variacion_porcentaje > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {compra.recomendacion}
                      </span>
                    </div>
                  ))}
                </div>
              }
            />
          )}

          {/* Impacto si pagas hoy */}
          {resumen && !resumen.aviso_sin_tc_pago && (
            <Alert type="info" showIcon
              message={`Impacto si pagas hoy (TC actual ${resumen.tc_actual.toFixed(4)}): ${resumen.impacto_si_pagas_hoy >= 0 ? '+' : ''}S/ ${resumen.impacto_si_pagas_hoy.toFixed(2)}`}
              description={resumen.impacto_si_pagas_hoy > 0 ? 'Pagarías más (TC subió)' : 'Pagarías menos (TC bajó)'}
            />
          )}

          {resumen?.perdida_por_cambio && resumen.diferencia_total !== undefined && (
            <Alert type="warning" showIcon
              message={`La diferencia de tipo de cambio genera una pérdida neta de S/ ${fmt(Math.abs(resumen.diferencia_total))}. El TC al momento del pago fue mayor que al de la compra.`}
            />
          )}

          {/* Tabla compras */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spin size="large" />
            </div>
          ) : comprasView.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <FaChartLine size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay compras en USD con ventas registradas para el período seleccionado.</p>
            </div>
          ) : (
            <div className="peps-main-table">
              <style>{`
                .peps-main-table .ant-table-thead > tr > th {
                  background-color: var(--color-rose-600) !important;
                  color: white !important;
                  font-size: 11px;
                  font-weight: 700;
                }
                .peps-main-table .ant-table-thead > tr > th::before { display: none !important; }
                .peps-main-table .ant-table-row { cursor: pointer; }
                .peps-main-table .ant-table-row:hover > td { background-color: #eff6ff !important; }
              `}</style>
              <p className="text-[11px] text-slate-400 mb-2">Haz clic en una fila para ver el detalle de ventas de esa compra.</p>
              <Table
                size="small"
                dataSource={comprasView}
                columns={mainColumns}
                rowKey="compra_id"
                pagination={false}
                onRow={(row) => ({ onClick: () => setDrawerCompra(row) })}
              />
            </div>
          )}

          {/* Compras pendientes de pago (sin ventas) */}
          {pendingPayments && pendingPayments.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="mb-3">
                <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <FaExchangeAlt size={14} className="text-amber-600" />
                  Compras pendientes de pago (sin ventas)
                </h3>
                <p className="text-xs text-slate-500">
                  Compras en USD a crédito sin pagos registrados. Analiza el TC para decidir cuándo pagar.
                </p>
              </div>
              <div className="space-y-2">
                {pendingPayments.map((compra) => (
                  <div key={compra.compra_id} className={`border rounded-lg p-3 ${compra.riesgo_alto ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <div className="font-semibold text-slate-700 text-sm">{compra.serie_numero}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {compra.proveedor}
                          <span className="mx-1 text-slate-300">·</span>
                          {dayjs(compra.fecha).format('DD/MM/YYYY')}
                          <span className="mx-1 text-slate-300">·</span>
                          {compra.dias_desde_compra} días
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="text-right">
                          <div className="text-slate-600">${compra.costo_usd.toFixed(4)}</div>
                          <div className="text-slate-400 text-[10px]">S/ {compra.costo_soles.toFixed(2)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-blue-600 font-medium">TC: {compra.tc_compra.toFixed(4)}</div>
                          <div className={`font-medium ${compra.variacion_porcentaje > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {compra.variacion_porcentaje > 0 ? '+' : ''}{compra.variacion_porcentaje.toFixed(2)}%
                          </div>
                        </div>
                        <div className={`text-right px-2 py-1 rounded ${compra.impacto_si_pagas_hoy > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          <div className="font-semibold text-xs">
                            {compra.impacto_si_pagas_hoy > 0 ? '+' : ''}S/ {compra.impacto_si_pagas_hoy.toFixed(2)}
                          </div>
                          <div className="text-[10px]">{compra.recomendacion}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Drawer detalle */}
      <Drawer
        title={
          drawerCompra ? (
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-base text-slate-800">{drawerCompra.serie_numero}</span>
              <span className="text-xs text-slate-500 font-normal">
                ${drawerCompra.costo_usd.toFixed(4)}/u
                <span className="mx-2 text-slate-300">·</span>
                TC compra: <b className="text-blue-600">{drawerCompra.tc_compra.toFixed(4)}</b>
                {drawerCompra.tc_pago_real && drawerCompra.tc_pago ? (
                  <>
                    <span className="mx-1 text-slate-400"> → </span>
                    TC pago: <b className="text-green-600">{drawerCompra.tc_pago.toFixed(4)}</b>
                  </>
                ) : (
                  <span className="text-slate-400 ml-1 text-[10px]">(sin pago registrado)</span>
                )}
              </span>
            </div>
          ) : null
        }
        open={!!drawerCompra}
        onClose={() => setDrawerCompra(null)}
        width={820}
        destroyOnHidden
      >
        {drawerCompra && (
          <div className="flex flex-col gap-3">

            {/* Resumen compra */}
            <div className="grid grid-cols-4 gap-3 mb-1">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Unidades consumidas</div>
                <div className="text-base font-bold text-slate-700">{drawerCompra.cantidad_total.toFixed(2)} u</div>
              </div>
              {/* Ganancia total de las ventas de esta compra (real si hay pago, si no con TC compra) */}
              {(() => {
                const gananciaCompra = drawerCompra.ventas.reduce((s, v) => s + (v.ganancia_tc_compra || 0), 0)
                const gananciaPago = drawerCompra.ventas.reduce((s, v) => s + (v.ganancia_tc_pago || 0), 0)
                const gananciaMostrar = drawerCompra.tc_pago_real ? gananciaPago : gananciaCompra
                return (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-emerald-600 font-bold uppercase mb-1">
                      {drawerCompra.tc_pago_real ? 'Ganancia real' : 'Ganancia'}
                    </div>
                    <div className="text-base font-bold" style={{ color: colorPos(gananciaMostrar) }}>
                      S/ {fmt(gananciaMostrar)}
                    </div>
                  </div>
                )
              })()}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
                <div className="text-[10px] text-blue-600 font-bold uppercase mb-1">Costo TC compra</div>
                <div className="text-base font-bold text-blue-700">S/ {fmt(drawerCompra.costo_tc_compra_total)}</div>
              </div>
              {drawerCompra.tc_pago_real ? (
                <div className={`border rounded-lg p-3 text-center ${drawerCompra.diferencia_total > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                  <div className={`text-[10px] font-bold uppercase mb-1 ${drawerCompra.diferencia_total > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    Impacto TC total
                  </div>
                  <div className="text-base font-bold" style={{ color: colorImpacto(drawerCompra.diferencia_total) }}>
                    S/ {fmtS(drawerCompra.diferencia_total)}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Estado</div>
                  <div className="text-sm text-slate-600">Sin pago</div>
                </div>
              )}
            </div>

            {/* Ventas */}
            <div className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--color-rose-600)' }}>
              Ventas de esta compra ({drawerCompra.ventas.length})
            </div>

            {drawerCompra.ventas.map((venta, idx) => {
              const numCompras = venta.fracciones.length

              return (
                <div key={venta.venta_id} className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                  {/* Header venta */}
                  <div className="flex items-center gap-2 px-3 py-2 border-b flex-wrap" style={{ backgroundColor: 'var(--color-rose-600)', borderColor: 'var(--color-rose-600)' }}>
                    <span className="font-semibold text-sm text-white">Venta {idx + 1}</span>
                    {/* Serie del comprobante de VENTA */}
                    {venta.serie_numero && (
                      <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-white text-rose-700" title="Comprobante de venta">
                        {venta.serie_numero}
                      </span>
                    )}
                    {/* Origen de la mercadería (compras) */}
                    {numCompras > 1 && (
                      <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700" title="Se surtió de varias compras">
                        {numCompras} compras
                      </span>
                    )}
                    <span className="text-xs text-rose-100">
                      {dayjs(venta.fecha).format('DD/MM/YYYY')}
                      <span className="mx-1">·</span>
                      {venta.cantidad.toFixed(2)} u × S/{fmt(venta.precio)} = <b className="text-white">S/{fmt(venta.ingreso)}</b>
                    </span>
                  </div>

                  {/* Desglose fracciones */}
                  <div className="px-3 py-2 bg-slate-50/50">
                    {venta.fracciones.map((f, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0 flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium text-[11px] shrink-0" title="Compra de origen (PEPS)">
                            Compra {f.serie_numero}
                          </span>
                          <span className="text-slate-600">
                            {f.cantidad.toFixed(2)} u × ${f.costo_usd.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex gap-4 text-xs shrink-0">
                          <span className="text-slate-500">
                            TC {f.tc_compra}:<b className="text-blue-600 ml-1">S/{fmt(f.costo_tc_compra)}</b>
                          </span>
                          {f.costo_tc_pago !== undefined && (
                            <span className="text-slate-500">
                              TC {f.tc_pago}:<b className="text-green-600 ml-1">S/{fmt(f.costo_tc_pago)}</b>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totales venta */}
                  <div className="px-3 py-2 border-t border-slate-200 flex flex-col gap-1">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-slate-600">Ganancia con TC compra</span>
                      <span style={{ color: colorPos(venta.ganancia_tc_compra) }}>S/ {fmt(venta.ganancia_tc_compra)}</span>
                    </div>
                    {venta.ganancia_tc_pago !== undefined && (
                      <>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500">Ganancia con TC pago (real)</span>
                          <span style={{ color: colorPos(venta.ganancia_tc_pago) }}>S/ {fmt(venta.ganancia_tc_pago)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold border-t border-slate-100 pt-1 mt-0.5">
                          <span className="text-slate-500">Diferencia TC (impacto)</span>
                          <span style={{ color: colorImpacto(venta.diferencia_cambio) }}>S/ {fmtS(venta.diferencia_cambio)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}

          </div>
        )}
      </Drawer>
    </>
  )
}
