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
  fecha: string
  cantidad: number
  precio: number
  ingreso: number
  ganancia_tc_compra: number
  ganancia_tc_pago: number
  diferencia_cambio: number
  fracciones: PepsFraccionAnalisis[]
}

interface CompraView {
  compra_id: number
  serie_numero: string
  tc_compra: number
  tc_pago: number
  tc_pago_real: boolean
  costo_usd: number
  cantidad_total: number
  costo_tc_compra_total: number
  costo_tc_pago_total: number
  diferencia_total: number
  ventas: VentaEnCompra[]
}

const fmt = (n: number) => n.toFixed(2)
const fmtS = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2)
const colorPos = (n: number) => (n >= 0 ? '#16a34a' : '#dc2626')
const colorImpacto = (n: number) => (n <= 0 ? '#16a34a' : '#dc2626')

function buildComprasView(productos: PepsProductoAnalisis[]): CompraView[] {
  const comprasMap = new Map<number, CompraView>()
  const ventasMap = new Map<number, VentaEnCompra>()

  productos.forEach(producto => {
    producto.ventas.forEach(venta => {
      ventasMap.set(venta.venta_id, {
        venta_id: venta.venta_id,
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
        compra.costo_tc_pago_total += fraccion.costo_tc_pago
        compra.diferencia_total += fraccion.costo_tc_pago - fraccion.costo_tc_compra
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
      width: 175,
      align: 'center' as const,
      render: (_: any, row: CompraView) => (
        <span className="text-xs">
          <span className="text-blue-600 font-medium">{row.tc_compra.toFixed(4)}</span>
          <span className="text-slate-400 mx-1">→</span>
          <span className="text-green-600 font-medium">
            {row.tc_pago.toFixed(4)}
            {!row.tc_pago_real && <span className="text-slate-400 ml-0.5">*</span>}
          </span>
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
                <div className="text-lg font-bold" style={{ color: colorPos(resumen.diferencia_total) }}>
                  {fmtS(resumen.diferencia_total)}
                </div>
                <div className={`text-[10px] mt-0.5 ${resumen.perdida_por_cambio ? 'text-red-500' : 'text-green-500'}`}>
                  {resumen.total_productos} producto(s)
                </div>
              </div>
            </div>
          )}

          {/* Avisos */}
          {resumen?.aviso_sin_tc_pago && (
            <Alert type="info" showIcon
              message="Algunos pagos no tienen TC registrado. Se usa el TC de compra como referencia para esos lotes."
            />
          )}
          {resumen?.perdida_por_cambio && (
            <Alert type="warning" showIcon
              message={`La diferencia de tipo de cambio genera una pérdida neta de S/ ${fmt(Math.abs(resumen.diferencia_total))}. El TC al momento del pago fue mayor que al de la compra.`}
            />
          )}

          {/* Tabla compras */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spin size="large" tip="Calculando análisis PEPS..." />
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
                  background-color: #1e40af !important;
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
                <span className="mx-1 text-slate-400"> → </span>
                TC pago: <b className="text-green-600">{drawerCompra.tc_pago.toFixed(4)}</b>
                {!drawerCompra.tc_pago_real && <span className="text-slate-400 ml-1 text-[10px]">(referencial)</span>}
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
            <div className="grid grid-cols-3 gap-3 mb-1">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Unidades consumidas</div>
                <div className="text-base font-bold text-slate-700">{drawerCompra.cantidad_total.toFixed(2)} u</div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
                <div className="text-[10px] text-blue-600 font-bold uppercase mb-1">Costo TC compra</div>
                <div className="text-base font-bold text-blue-700">S/ {fmt(drawerCompra.costo_tc_compra_total)}</div>
              </div>
              <div className={`border rounded-lg p-3 text-center ${drawerCompra.diferencia_total > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                <div className={`text-[10px] font-bold uppercase mb-1 ${drawerCompra.diferencia_total > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Impacto TC total
                </div>
                <div className="text-base font-bold" style={{ color: colorImpacto(drawerCompra.diferencia_total) }}>
                  S/ {fmtS(drawerCompra.diferencia_total)}
                </div>
              </div>
            </div>

            {/* Ventas */}
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
              Ventas de esta compra ({drawerCompra.ventas.length})
            </div>

            {drawerCompra.ventas.map((venta, idx) => {
              const numCompras = venta.fracciones.length
              const badge = numCompras > 1
                ? <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700">{numCompras} compras</span>
                : <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-blue-50 text-blue-700">{venta.fracciones[0]?.serie_numero}</span>

              return (
                <div key={venta.venta_id} className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                  {/* Header venta */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200 flex-wrap">
                    <span className="font-semibold text-sm text-slate-700">Venta {idx + 1}</span>
                    {badge}
                    <span className="text-xs text-slate-500">
                      {dayjs(venta.fecha).format('DD/MM/YYYY')}
                      <span className="mx-1">·</span>
                      {venta.cantidad.toFixed(2)} u × S/{fmt(venta.precio)} = <b className="text-slate-700">S/{fmt(venta.ingreso)}</b>
                    </span>
                  </div>

                  {/* Desglose fracciones */}
                  <div className="px-3 py-2 bg-slate-50/50">
                    {venta.fracciones.map((f, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0 flex-wrap gap-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium text-[11px] shrink-0">
                            {f.serie_numero}
                          </span>
                          <span className="text-slate-600">
                            {f.cantidad.toFixed(2)} u × ${f.costo_usd.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex gap-4 text-xs shrink-0">
                          <span className="text-slate-500">
                            TC {f.tc_compra}:<b className="text-blue-600 ml-1">S/{fmt(f.costo_tc_compra)}</b>
                          </span>
                          <span className="text-slate-500">
                            TC {f.tc_pago}:<b className="text-green-600 ml-1">S/{fmt(f.costo_tc_pago)}</b>
                          </span>
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
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Ganancia con TC pago (real)</span>
                      <span style={{ color: colorPos(venta.ganancia_tc_pago) }}>S/ {fmt(venta.ganancia_tc_pago)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold border-t border-slate-100 pt-1 mt-0.5">
                      <span className="text-slate-500">Diferencia TC (impacto)</span>
                      <span style={{ color: colorImpacto(venta.diferencia_cambio) }}>S/ {fmtS(venta.diferencia_cambio)}</span>
                    </div>
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
