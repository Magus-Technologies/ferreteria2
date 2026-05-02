'use client'

import { Modal, Spin, DatePicker, Input, Select } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { gananciasApi } from '~/lib/api/ganancias'
import TableWithTitle from '~/components/tables/table-with-title'
import { useMemo, useState, useEffect } from 'react'
import { ColDef } from 'ag-grid-community'
import dayjs from 'dayjs'
import { FaTag, FaPercentage, FaHandHoldingUsd, FaArrowDown, FaFileInvoice, FaCalculator, FaSearch } from 'react-icons/fa'
import { useDebounce } from 'use-debounce'
import ButtonBase from '~/components/buttons/button-base'

const { RangePicker } = DatePicker

interface ModalAnalisisPerdidasVentasProps {
  open: boolean
  onClose: () => void
  filtros: any
}

type TipoPerdida = 'todas' | 'ventas_bajo_costo' | 'descuentos' | 'comisiones' | 'salidas' | 'notas_credito'

export default function ModalAnalisisPerdidasVentas({ open, onClose, filtros: filtrosGlobales }: ModalAnalisisPerdidasVentasProps) {
  // Filtros locales para el modal
  const [localFiltros, setLocalFiltros] = useState({
    desde: filtrosGlobales.desde || dayjs().format('YYYY-MM-DD'),
    hasta: filtrosGlobales.hasta || dayjs().format('YYYY-MM-DD'),
    search: '',
    tipo_perdida: '' as TipoPerdida | '',
  })
  const [debouncedSearch] = useDebounce(localFiltros.search, 500)

  // Sincronizar al abrir el modal
  useEffect(() => {
    if (open) {
      setLocalFiltros({
        desde: filtrosGlobales.desde || dayjs().format('YYYY-MM-DD'),
        hasta: filtrosGlobales.hasta || dayjs().format('YYYY-MM-DD'),
        search: '',
        tipo_perdida: '',
      })
    }
  }, [open, filtrosGlobales.desde, filtrosGlobales.hasta])

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['analisis-perdidas-ventas', localFiltros.desde, localFiltros.hasta, debouncedSearch, filtrosGlobales.almacen_id, localFiltros.tipo_perdida],
    queryFn: () => gananciasApi.getAnalisisPerdidas({
      ...localFiltros,
      search: debouncedSearch,
      almacen_id: filtrosGlobales.almacen_id
    }),
    enabled: open,
  })

  const detalles = data?.data?.data?.detalles || []
  const resumen = data?.data?.data?.resumen || {
    ventas_bajo_costo: 0,
    descuentos_aplicados: 0,
    comisiones_vendedor: 0,
    salidas_almacen: 0,
    notas_credito: 0,
    total_perdidas: 0,
  }
  const porCategoria = data?.data?.data?.por_categoria || []

  // Columnas para la tabla
  const columns = useMemo<ColDef[]>(() => [
    {
      headerName: 'FECHA',
      field: 'fecha',
      width: 120,
      valueFormatter: (p) => p.value ? dayjs(p.value).format('DD/MM/YYYY HH:mm') : '-',
    },
    {
      headerName: 'CATEGORÍA',
      field: 'categoria',
      width: 180,
      cellRenderer: (p: any) => {
        const categoria = p.value || ''
        let bgColor = 'bg-slate-100'
        let textColor = 'text-slate-700'
        
        if (categoria.includes('BAJO COSTO')) {
          bgColor = 'bg-orange-100'
          textColor = 'text-orange-700'
        } else if (categoria.includes('DESCUENTO')) {
          bgColor = 'bg-blue-100'
          textColor = 'text-blue-700'
        } else if (categoria.includes('COMISIÓN')) {
          bgColor = 'bg-green-100'
          textColor = 'text-green-700'
        } else if (categoria.includes('SALIDA')) {
          bgColor = 'bg-rose-100'
          textColor = 'text-rose-700'
        } else if (categoria.includes('NOTA')) {
          bgColor = 'bg-purple-100'
          textColor = 'text-purple-700'
        }
        
        return (
          <div className="flex items-center h-full">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${bgColor} ${textColor}`}>
              {categoria}
            </span>
          </div>
        )
      }
    },
    {
      headerName: 'PRODUCTO',
      field: 'producto',
      flex: 2,
      minWidth: 250,
    },
    {
      headerName: 'REFERENCIA',
      field: 'referencia',
      width: 150,
    },
    {
      headerName: 'CLIENTE/VENDEDOR',
      field: 'cliente',
      width: 180,
    },
    {
      headerName: 'CANT',
      field: 'cantidad',
      width: 80,
      type: 'numericColumn',
      valueFormatter: (p) => p.value ? Number(p.value).toFixed(2) : '-',
    },
    {
      headerName: 'MONTO PÉRDIDA',
      field: 'monto',
      width: 140,
      type: 'numericColumn',
      cellStyle: { fontWeight: 'bold', color: '#dc2626' } as any,
      valueFormatter: (p) => p.value ? `S/ ${Number(p.value).toFixed(2)}` : 'S/ 0.00',
    },
  ], [])

  const pinnedBottomRowData = useMemo(() => {
    if (detalles.length === 0) return []
    return [
      {
        producto: 'TOTAL PÉRDIDA ACUMULADA:',
        monto: resumen.total_perdidas,
      },
    ]
  }, [detalles, resumen.total_perdidas])

  return (
    <Modal
      title="Análisis de Pérdidas en Ventas"
      open={open}
      onCancel={onClose}
      footer={null}
      width={1400}
      centered
      styles={{ body: { padding: '16px' } }}
    >
      <div className="flex flex-col gap-4">
        {/* Filtros Internos */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Rango de Fechas</span>
            <RangePicker 
              className="w-64"
              allowClear
              value={localFiltros.desde && localFiltros.hasta ? [dayjs(localFiltros.desde), dayjs(localFiltros.hasta)] : null}
              onChange={(dates) => {
                setLocalFiltros(prev => ({
                  ...prev,
                  desde: dates ? dates[0]!.format('YYYY-MM-DD') : '',
                  hasta: dates ? dates[1]!.format('YYYY-MM-DD') : '',
                }))
              }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Categoría de Pérdida</span>
            <Select
              className="w-56"
              placeholder="Todas las categorías"
              allowClear
              value={localFiltros.tipo_perdida || undefined}
              onChange={(value) => setLocalFiltros(prev => ({ ...prev, tipo_perdida: value || '' }))}
              options={[
                { label: 'Todas las Categorías', value: 'todas' },
                { label: 'Ventas Bajo Costo', value: 'ventas_bajo_costo' },
                { label: 'Descuentos Aplicados', value: 'descuentos' },
                { label: 'Comisiones de Vendedor', value: 'comisiones' },
                { label: 'Salidas de Almacén', value: 'salidas' },
                { label: 'Notas de Crédito', value: 'notas_credito' },
              ]}
            />
          </div>
          
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Buscar Producto / Cliente / Referencia</span>
            <Input 
              placeholder="Escriba aquí para buscar..." 
              prefix={<FaSearch className="text-slate-400" />}
              allowClear
              value={localFiltros.search}
              onChange={(e) => setLocalFiltros(prev => ({ ...prev, search: e.target.value }))}
              onPressEnter={() => refetch()}
            />
          </div>

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

        {/* Cards Informativos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white border border-orange-100 rounded-lg p-3 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                <FaTag size={14} />
              </div>
              <div className="text-[9px] uppercase text-orange-600 font-bold">Bajo Costo</div>
            </div>
            <div className="text-lg font-bold text-orange-700">S/ {resumen.ventas_bajo_costo.toFixed(2)}</div>
          </div>

          <div className="bg-white border border-blue-100 rounded-lg p-3 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                <FaPercentage size={14} />
              </div>
              <div className="text-[9px] uppercase text-blue-600 font-bold">Descuentos</div>
            </div>
            <div className="text-lg font-bold text-blue-700">S/ {resumen.descuentos_aplicados.toFixed(2)}</div>
          </div>

          <div className="bg-white border border-green-100 rounded-lg p-3 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="bg-green-100 p-2 rounded-full text-green-600">
                <FaHandHoldingUsd size={14} />
              </div>
              <div className="text-[9px] uppercase text-green-600 font-bold">Comisiones</div>
            </div>
            <div className="text-lg font-bold text-green-700">S/ {resumen.comisiones_vendedor.toFixed(2)}</div>
          </div>

          <div className="bg-white border border-rose-100 rounded-lg p-3 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="bg-rose-100 p-2 rounded-full text-rose-600">
                <FaArrowDown size={14} />
              </div>
              <div className="text-[9px] uppercase text-rose-600 font-bold">Salidas</div>
            </div>
            <div className="text-lg font-bold text-rose-700">S/ {resumen.salidas_almacen.toFixed(2)}</div>
          </div>

          <div className="bg-white border border-purple-100 rounded-lg p-3 flex flex-col gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 p-2 rounded-full text-purple-600">
                <FaFileInvoice size={14} />
              </div>
              <div className="text-[9px] uppercase text-purple-600 font-bold">N. Crédito</div>
            </div>
            <div className="text-lg font-bold text-purple-700">S/ {resumen.notas_credito.toFixed(2)}</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col gap-2 text-white shadow-md">
            <div className="flex items-center gap-2">
              <div className="bg-slate-800 p-2 rounded-full text-slate-300">
                <FaCalculator size={14} />
              </div>
              <div className="text-[9px] uppercase text-slate-400 font-bold">Total</div>
            </div>
            <div className="text-lg font-bold">S/ {resumen.total_perdidas.toFixed(2)}</div>
          </div>
        </div>

        {/* Tabla */}
        <div className="h-[500px] w-full border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center bg-white">
              <Spin size="large" tip="Analizando pérdidas de ventas..." />
            </div>
          ) : (
            <TableWithTitle
              id="table-modal-analisis-perdidas-ventas"
              title={`Análisis de Pérdidas en Ventas - ${localFiltros.tipo_perdida ? localFiltros.tipo_perdida.replace(/_/g, ' ').toUpperCase() : 'TODAS LAS CATEGORÍAS'}`}
              columnDefs={columns}
              rowData={detalles}
              loading={isLoading}
              pinnedBottomRowData={pinnedBottomRowData}
              headerColor="var(--color-red-600)"
              selectionColor="#fee2e2"
              withNumberColumn={true}
            />
          )}
        </div>

        {/* Resumen por Categoría */}
        {porCategoria.length > 0 && (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase">Resumen por Categoría</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {porCategoria.map((cat: any, idx: number) => (
                <div key={idx} className="bg-white p-3 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">{cat.categoria}</div>
                  <div className="text-xl font-bold text-red-600">S/ {cat.monto.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{cat.cantidad} registro(s)</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
