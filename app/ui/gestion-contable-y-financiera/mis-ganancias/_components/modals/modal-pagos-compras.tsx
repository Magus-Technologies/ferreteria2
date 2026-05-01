'use client'

import { Modal, Spin, DatePicker, Input } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { gananciasApi } from '~/lib/api/ganancias'
import TableWithTitle from '~/components/tables/table-with-title'
import { useMemo, useState, useEffect } from 'react'
import { ColDef } from 'ag-grid-community'
import dayjs from 'dayjs'
import { apiRequest } from '~/lib/api'
import { FaShoppingCart, FaCheckCircle, FaExclamationCircle, FaSearch } from 'react-icons/fa'
import { useDebounce } from 'use-debounce'
import ButtonBase from '~/components/buttons/button-base'

const { RangePicker } = DatePicker

interface ModalPagosComprasProps {
  open: boolean
  onClose: () => void
  filtros: any
}

export default function ModalPagosCompras({ open, onClose, filtros: filtrosGlobales }: ModalPagosComprasProps) {
  // Filtros locales para el modal
  const [localFiltros, setLocalFiltros] = useState({
    desde: filtrosGlobales.desde || dayjs().format('YYYY-MM-DD'),
    hasta: filtrosGlobales.hasta || dayjs().format('YYYY-MM-DD'),
    search: '',
  })
  const [debouncedSearch] = useDebounce(localFiltros.search, 500)

  // Sincronizar con el almacén global cuando se abre el modal
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
    queryKey: ['pagos-compras', localFiltros.desde, localFiltros.hasta, debouncedSearch, filtrosGlobales.almacen_id],
    queryFn: () => gananciasApi.getPagosCompras({
      ...localFiltros,
      search: debouncedSearch,
      almacen_id: filtrosGlobales.almacen_id
    }),
    enabled: open,
  })

  // Query para obtener despliegues de pago con el formato detallado
  const { data: desplieguesData } = useQuery({
    queryKey: ['metodos-para-ventas-modal'],
    queryFn: async () => {
      const response = await apiRequest<{ success: boolean; data: any[] }>('/cajas/sub-cajas/metodos-para-ventas')
      return response.data
    },
    enabled: open,
  })

  const despliegueMap = useMemo(() => {
    if (!desplieguesData?.data) return {}
    return desplieguesData.data.reduce((acc, metodo) => {
      acc[metodo.despliegue_pago_id] = metodo.label.toUpperCase()
      return acc
    }, {} as Record<string, string>)
  }, [desplieguesData])

  const pagos = data?.data?.data?.pagos || []
  const resumen = data?.data?.data?.resumen || { total_compras: 0, total_pagado: 0, pendiente: 0 }

  const columns = useMemo<ColDef[]>(() => [
    {
      headerName: 'FECHA',
      field: 'fecha',
      width: 110,
      valueFormatter: (p) => p.value ? dayjs(p.value).format('DD/MM/YYYY') : '-',
    },
    {
      headerName: 'PROVEEDOR',
      field: 'proveedor',
      flex: 2,
      minWidth: 200,
    },
    {
      headerName: 'DOCUMENTO',
      field: 'numero',
      width: 130,
      valueFormatter: (p) => {
        if (!p.data) return ''
        return `${p.data.serie || ''}-${String(p.data.numero || '').padStart(8, '0')}`
      },
    },
    {
      headerName: 'DESPLIEGUE DE PAGO',
      field: 'despliegue_id',
      width: 250,
      valueFormatter: (p) => despliegueMap[p.value] || p.data?.metodo_pago?.toUpperCase() || '-',
      cellStyle: { fontSize: '10px' } as any
    },
    {
      headerName: 'MONTO',
      field: 'monto',
      width: 110,
      type: 'numericColumn',
      cellStyle: { fontWeight: 'bold' },
      valueFormatter: (p) => p.value ? `S/ ${Number(p.value).toFixed(2)}` : 'S/ 0.00',
    },
    {
      headerName: 'OPERACIÓN',
      field: 'numero_operacion',
      width: 130,
      valueFormatter: (p) => p.value || '-',
    },
  ], [despliegueMap])

  const pinnedBottomRowData = useMemo(() => {
    if (pagos.length === 0) return []
    return [
      {
        proveedor: 'TOTAL PAGADO:',
        monto: resumen.total_pagado,
      },
    ]
  }, [pagos, resumen.total_pagado])

  return (
    <Modal
      title="Análisis de Pagos y Gastos de Compras"
      open={open}
      onCancel={onClose}
      footer={null}
      width={1200}
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
          
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Buscar Proveedor / Operación / Documento</span>
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
          <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-4 shadow-sm">
            <div className="bg-blue-100 p-3 rounded-full text-blue-600">
              <FaShoppingCart size={20} />
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-500 font-bold">Total Compras</div>
              <div className="text-xl font-bold text-slate-700">S/ {resumen.total_compras.toFixed(2)}</div>
            </div>
          </div>

          <div className="bg-white border border-emerald-100 rounded-lg p-4 flex items-center gap-4 shadow-sm">
            <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
              <FaCheckCircle size={20} />
            </div>
            <div>
              <div className="text-[10px] uppercase text-emerald-600 font-bold">Total Pagado</div>
              <div className="text-xl font-bold text-emerald-700">S/ {resumen.total_pagado.toFixed(2)}</div>
            </div>
          </div>

          <div className="bg-white border border-rose-100 rounded-lg p-4 flex items-center gap-4 shadow-sm">
            <div className="bg-rose-100 p-3 rounded-full text-rose-600">
              <FaExclamationCircle size={20} />
            </div>
            <div>
              <div className="text-[10px] uppercase text-rose-600 font-bold">Falta Pagar (Pendiente)</div>
              <div className="text-xl font-bold text-rose-700">S/ {resumen.pendiente.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="h-[450px] w-full border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center bg-white">
              <Spin size="large" tip="Cargando desglose de pagos..." />
            </div>
          ) : (
            <TableWithTitle
              id="table-modal-pagos-compras"
              title={`Historial de Pagos Realizados`}
              columnDefs={columns}
              rowData={pagos}
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


