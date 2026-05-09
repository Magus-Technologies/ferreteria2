'use client'

import { Modal, Spin, Alert, Collapse, Table, Tag } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import { gananciasApi, type PepsProductoAnalisis, type PepsVentaAnalisis, type PepsFraccionAnalisis } from '~/lib/api/ganancias'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import LabelBase from '~/components/form/label-base'
import ButtonBase from '~/components/buttons/button-base'
import { FaSearch, FaExchangeAlt, FaChartLine } from 'react-icons/fa'

interface ModalAnalisisPepsComprasProps {
  open: boolean
  onClose: () => void
  filtros: any
}

const fmt = (n: number) => n.toFixed(2)
const fmtS = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2)
const colorVal = (n: number) => (n >= 0 ? '#16a34a' : '#dc2626')

export default function ModalAnalisisPepsCompras({ open, onClose, filtros: filtrosGlobales }: ModalAnalisisPepsComprasProps) {
  const [localFiltros, setLocalFiltros] = useState({
    desde: filtrosGlobales.desde || dayjs().startOf('month').format('YYYY-MM-DD'),
    hasta: filtrosGlobales.hasta || dayjs().format('YYYY-MM-DD'),
  })

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

  return (
    <Modal
      title="Análisis PEPS — Diferencia de Tipo de Cambio"
      open={open}
      onCancel={onClose}
      footer={null}
      width={1200}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-center shadow-sm">
              <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Ingreso total</div>
              <div className="text-lg font-bold text-slate-700">S/ {fmt(resumen.ingreso_total)}</div>
            </div>
            <div className="bg-white border border-green-100 rounded-lg p-3 text-center shadow-sm">
              <div className="text-[10px] text-green-600 font-bold uppercase mb-1">Ganancia real (TC pago)</div>
              <div className="text-lg font-bold" style={{ color: colorVal(resumen.ganancia_tc_pago) }}>
                S/ {fmt(resumen.ganancia_tc_pago)}
              </div>
            </div>
            <div className={`border rounded-lg p-3 text-center shadow-sm ${resumen.perdida_por_cambio ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <div className={`text-[10px] font-bold uppercase mb-1 flex items-center justify-center gap-1 ${resumen.perdida_por_cambio ? 'text-red-600' : 'text-green-600'}`}>
                <FaExchangeAlt size={10} />
                Impacto diferencia TC
              </div>
              <div className="text-lg font-bold" style={{ color: colorVal(resumen.diferencia_total) }}>
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

        {/* Lista de productos expandible */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spin size="large" tip="Calculando análisis PEPS..." />
          </div>
        ) : productos.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <FaChartLine size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay compras en USD con ventas registradas para el período seleccionado.</p>
          </div>
        ) : (
          <Collapse
            accordion={false}
            defaultActiveKey={productos.map((p) => String(p.producto_id))}
            items={productos.map((producto) => ({
              key: String(producto.producto_id),
              label: <ProductoHeader producto={producto} />,
              children: <VentasTable ventas={producto.ventas} />,
            }))}
          />
        )}
      </div>
    </Modal>
  )
}

function ProductoHeader({ producto }: { producto: PepsProductoAnalisis }) {
  const r = producto.resumen_producto
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-sm text-slate-800">{producto.producto_nombre}</span>
        {producto.marca_nombre && (
          <span className="ml-2 text-[10px] text-slate-400 uppercase">{producto.marca_nombre}</span>
        )}
      </div>
      <div className="flex gap-3 text-xs shrink-0">
        <span className="text-slate-400">{producto.total_ventas} venta(s)</span>
        <span style={{ color: colorVal(r.ganancia_tc_pago) }}>Real: S/ {r.ganancia_tc_pago.toFixed(2)}</span>
        <span className="font-bold" style={{ color: colorVal(r.diferencia_cambio) }}>
          Dif: {(r.diferencia_cambio >= 0 ? '+' : '')}S/ {r.diferencia_cambio.toFixed(2)}
        </span>
      </div>
    </div>
  )
}

function VentasTable({ ventas }: { ventas: PepsVentaAnalisis[] }) {
  const columns = useMemo(() => [
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      width: 100,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
    },
    {
      title: 'Cant.',
      dataIndex: 'cantidad',
      key: 'cantidad',
      width: 70,
      align: 'right' as const,
      render: (v: number) => v.toFixed(2),
    },
    {
      title: 'Precio S/',
      dataIndex: 'precio',
      key: 'precio',
      width: 95,
      align: 'right' as const,
      render: (v: number) => `S/ ${v.toFixed(2)}`,
    },
    {
      title: 'Ingreso S/',
      dataIndex: 'ingreso',
      key: 'ingreso',
      width: 105,
      align: 'right' as const,
      render: (v: number) => <b>S/ {v.toFixed(2)}</b>,
    },
    {
      title: 'Costo TC compra',
      dataIndex: 'total_costo_tc_compra',
      key: 'costo_c',
      width: 135,
      align: 'right' as const,
      render: (v: number) => <span style={{ color: '#2563eb' }}>S/ {v.toFixed(2)}</span>,
    },
    {
      title: 'Costo TC pago',
      dataIndex: 'total_costo_tc_pago',
      key: 'costo_p',
      width: 125,
      align: 'right' as const,
      render: (v: number) => <span style={{ color: '#16a34a' }}>S/ {v.toFixed(2)}</span>,
    },
    {
      title: 'Ganancia real',
      dataIndex: 'ganancia_tc_pago',
      key: 'gan_p',
      width: 120,
      align: 'right' as const,
      render: (v: number) => <b style={{ color: colorVal(v) }}>S/ {v.toFixed(2)}</b>,
    },
    {
      title: 'Dif. cambio',
      dataIndex: 'diferencia_cambio',
      key: 'dif',
      width: 115,
      align: 'right' as const,
      render: (v: number) => (
        <b style={{ color: colorVal(v) }}>
          {(v >= 0 ? '+' : '')}S/ {v.toFixed(2)}
        </b>
      ),
    },
    {
      title: 'Lotes PEPS',
      dataIndex: 'fracciones',
      key: 'fracciones',
      render: (fracciones: PepsFraccionAnalisis[]) =>
        fracciones.map((f, i) => (
          <Tag key={i} color="blue" className="text-[10px] mb-0.5">
            {f.serie_numero}
            {!f.tc_pago_real && ' *'}
          </Tag>
        )),
    },
    {
      title: '',
      dataIndex: 'sin_stock',
      key: 'stock',
      width: 80,
      render: (v: boolean, row: PepsVentaAnalisis) =>
        v ? <Tag color="red" className="text-[10px]">Falta {row.faltante} u</Tag> : null,
    },
  ], [])

  return (
    <div className="peps-ventas-table">
      <style>{`
        .peps-ventas-table .ant-table-thead > tr > th {
          background-color: var(--color-rose-600) !important;
          color: white !important;
          font-size: 11px;
          font-weight: 700;
        }
        .peps-ventas-table .ant-table-thead > tr > th::before {
          display: none !important;
        }
      `}</style>
      <Table
        size="small"
        dataSource={ventas}
        columns={columns}
        rowKey="venta_id"
        pagination={false}
        scroll={{ x: 'max-content' }}
      />
    </div>
  )
}
