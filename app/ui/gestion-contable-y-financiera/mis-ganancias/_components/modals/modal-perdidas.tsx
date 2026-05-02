'use client'

import { Modal, Spin, Input } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { gananciasApi } from '~/lib/api/ganancias'
import TableWithTitle from '~/components/tables/table-with-title'
import { useMemo, useState, useEffect } from 'react'
import { ColDef } from 'ag-grid-community'
import dayjs from 'dayjs'
import { FaArrowDown, FaTag, FaCalculator, FaSearch } from 'react-icons/fa'
import { useDebounce } from 'use-debounce'
import ButtonBase from '~/components/buttons/button-base'

interface ModalPerdidasProps {
  open: boolean
  onClose: () => void
  filtros: any
}

export default function ModalPerdidas({ open, onClose, filtros: filtrosGlobales }: ModalPerdidasProps) {
  // Filtros locales para el modal
  const [localFiltros, setLocalFiltros] = useState({
    desde: filtrosGlobales.desde || dayjs().format('YYYY-MM-DD'),
    hasta: filtrosGlobales.hasta || dayjs().format('YYYY-MM-DD'),
    search: '',
  })
  const [debouncedSearch] = useDebounce(localFiltros.search, 500)

  // Sincronizar al abrir el modal
  useEffect(() => {
    if (open) {
      setLocalFiltros({
        desde: filtrosGlobales.desde || dayjs().format('YYYY-MM-DD'),
        hasta: filtrosGlobales.hasta || dayjs().format('YYYY-MM-DD'),
        search: '',
      })
    }
  }, [open, filtrosGlobales.desde, filtrosGlobales.hasta])

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['perdidas-detalle', localFiltros.desde, localFiltros.hasta, debouncedSearch, filtrosGlobales.almacen_id],
    queryFn: () => gananciasApi.getPerdidasDetalle({
      ...localFiltros,
      search: debouncedSearch,
      almacen_id: filtrosGlobales.almacen_id
    }),
    enabled: open && !!localFiltros.desde && !!localFiltros.hasta,
  })

  const detalles = data?.data?.data?.detalles || []
  const resumen = data?.data?.data?.resumen || { total_ventas_bajo_costo: 0, total_salidas_almacen: 0, total_perdida: 0 }

  const columns = useMemo<ColDef[]>(() => [
    {
      headerName: 'FECHA',
      field: 'fecha',
      width: 110,
      valueFormatter: (p) => p.value ? dayjs(p.value).format('DD/MM/YYYY') : '-',
    },
    {
      headerName: 'PRODUCTO',
      field: 'producto',
      flex: 2,
      minWidth: 250,
    },
    {
      headerName: 'MOTIVO / TIPO',
      field: 'motivo',
      width: 180,
      cellRenderer: (p: any) => (
        <div className="flex items-center h-full">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
            p.value === 'VENTA BAJO COSTO' ? 'bg-orange-100 text-orange-700' : 'bg-rose-100 text-rose-700'
          }`}>
            {p.value}
          </span>
        </div>
      )
    },
    {
      headerName: 'REFERENCIA',
      field: 'referencia',
      width: 150,
    },
    {
      headerName: 'CANT',
      field: 'cantidad',
      width: 80,
      type: 'numericColumn',
      valueFormatter: (p) => Number(p.value).toFixed(2),
    },
    {
      headerName: 'MONTO PÉRDIDA',
      field: 'monto',
      width: 130,
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
        monto: resumen.total_perdida,
      },
    ]
  }, [detalles, resumen.total_perdida])

  return (
    <Modal
      title="Análisis Detallado de Pérdidas"
      open={open}
      onCancel={onClose}
      footer={null}
      width={1200}
      centered
      styles={{ body: { padding: '16px' } }}
    >
      <div className="flex flex-col gap-4">
        {/* Filtros Internos */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-wrap items-end gap-3">
          {/* Fecha Desde */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Desde</span>
            <input 
              type="date"
              value={localFiltros.desde}
              onChange={(e) => setLocalFiltros(prev => ({ ...prev, desde: e.target.value }))}
              className="px-2 py-1 border border-slate-300 rounded text-sm"
            />
          </div>

          {/* Fecha Hasta */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Hasta</span>
            <input 
              type="date"
              value={localFiltros.hasta}
              onChange={(e) => setLocalFiltros(prev => ({ ...prev, hasta: e.target.value }))}
              className="px-2 py-1 border border-slate-300 rounded text-sm"
            />
          </div>
          
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Buscar Producto / Referencia</span>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-orange-100 rounded-lg p-4 flex items-center gap-4 shadow-sm">
            <div className="bg-orange-100 p-3 rounded-full text-orange-600">
              <FaTag size={20} />
            </div>
            <div>
              <div className="text-[10px] uppercase text-orange-600 font-bold">Ventas Bajo Costo</div>
              <div className="text-xl font-bold text-orange-700">S/ {resumen.total_ventas_bajo_costo.toFixed(2)}</div>
            </div>
          </div>

          <div className="bg-white border border-rose-100 rounded-lg p-4 flex items-center gap-4 shadow-sm">
            <div className="bg-rose-100 p-3 rounded-full text-rose-600">
              <FaArrowDown size={20} />
            </div>
            <div>
              <div className="text-[10px] uppercase text-rose-600 font-bold">Salidas de Almacén</div>
              <div className="text-xl font-bold text-rose-700">S/ {resumen.total_salidas_almacen.toFixed(2)}</div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center gap-4 text-white shadow-md">
            <div className="bg-slate-800 p-3 rounded-full text-slate-300">
              <FaCalculator size={20} />
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-400 font-bold">Pérdida Total</div>
              <div className="text-xl font-bold">S/ {resumen.total_perdida.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="h-[450px] w-full border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center bg-white">
              <Spin size="large" tip="Analizando pérdidas..." />
            </div>
          ) : (
            <TableWithTitle
              id="table-modal-perdidas"
              title={`Historial de Pérdidas y Salidas`}
              columnDefs={columns}
              rowData={detalles}
              loading={isLoading}
              pinnedBottomRowData={pinnedBottomRowData}
              headerColor="var(--color-rose-600)"
              selectionColor="#fee2e2"
              withNumberColumn={true}
            />
          )}
        </div>
      </div>
    </Modal>
  )
}
