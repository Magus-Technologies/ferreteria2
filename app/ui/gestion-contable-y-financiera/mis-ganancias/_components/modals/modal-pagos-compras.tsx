'use client'

import { Modal, Spin, Input } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { gananciasApi } from '~/lib/api/ganancias'
import TableWithTitle from '~/components/tables/table-with-title'
import { useMemo, useState, useEffect } from 'react'
import { ColDef } from 'ag-grid-community'
import dayjs from 'dayjs'
import { FaMoneyBillWave, FaSearch } from 'react-icons/fa'
import { useDebounce } from 'use-debounce'
import ButtonBase from '~/components/buttons/button-base'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import LabelBase from '~/components/form/label-base'

interface ModalPagosComprasProps {
  open: boolean
  onClose: () => void
  filtros: any
}

export default function ModalPagosCompras({ open, onClose, filtros: filtrosGlobales }: ModalPagosComprasProps) {
  const [localFiltros, setLocalFiltros] = useState({
    desde: filtrosGlobales.desde || dayjs().format('YYYY-MM-DD'),
    hasta: filtrosGlobales.hasta || dayjs().format('YYYY-MM-DD'),
    search: '',
  })
  const [debouncedSearch] = useDebounce(localFiltros.search, 500)

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
      desde: localFiltros.desde,
      hasta: localFiltros.hasta,
      search: debouncedSearch,
      almacen_id: filtrosGlobales.almacen_id
    }),
    enabled: open && !!localFiltros.desde && !!localFiltros.hasta,
  })

  const gastosRaw = data?.data?.data?.gastos || []

  // Solo gastos operativos libres (gasto_extra, no vinculados a una compra)
  const gastosOperativos = useMemo(() =>
    gastosRaw
      .filter((g: any) => g.tipo === 'gasto_extra')
      .sort((a: any, b: any) => dayjs(b.created_at || b.fecha).unix() - dayjs(a.created_at || a.fecha).unix()),
    [gastosRaw]
  )

  const totalGastos = useMemo(() =>
    gastosOperativos.reduce((sum: number, g: any) => sum + (Number(g.monto) || 0), 0),
    [gastosOperativos]
  )

  const columnas = useMemo<ColDef[]>(() => [
    {
      headerName: 'FECHA REGISTRO',
      field: 'created_at',
      width: 175,
      valueFormatter: (p) => {
        const val = p.value || p.data?.fecha
        return val ? dayjs(val).format('DD/MM/YYYY HH:mm:ss') : '-'
      },
    },
    {
      headerName: 'DESCRIPCIÓN',
      field: 'descripcion',
      flex: 1,
      minWidth: 220,
      valueFormatter: (p) => p.value || p.data?.tipo_gasto?.toUpperCase() || '-',
    },
    {
      headerName: 'MONTO',
      field: 'monto',
      width: 130,
      type: 'numericColumn',
      cellStyle: { fontWeight: 'bold', color: '#dc2626' } as any,
      valueFormatter: (p) => p.value ? `S/ ${Number(p.value).toFixed(2)}` : 'S/ 0.00',
    },
  ], [])

  const pinnedBottomRowData = useMemo(() => {
    if (gastosOperativos.length === 0) return []
    return [{ descripcion: 'TOTAL GASTOS OPERATIVOS:', monto: totalGastos }]
  }, [gastosOperativos, totalGastos])

  return (
    <Modal
      title="Gastos Operativos"
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
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
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Buscar Descripción</span>
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
            color="danger"
            size="md"
            className="flex items-center gap-2 h-[32px] px-6"
            onClick={() => refetch()}
            loading={isFetching}
          >
            <FaSearch size={12} />
            Buscar
          </ButtonBase>
        </div>

        {/* Card total */}
        <div className="bg-white border border-rose-200 rounded-lg p-4 flex items-center gap-4 shadow-sm w-fit">
          <div className="bg-rose-100 p-3 rounded-full text-rose-600">
            <FaMoneyBillWave size={20} />
          </div>
          <div>
            <div className="text-[10px] uppercase text-rose-600 font-bold">Total Gastos Operativos</div>
            <div className="text-2xl font-bold text-rose-700">S/ {totalGastos.toFixed(2)}</div>
          </div>
          <div className="ml-6 text-center">
            <div className="text-[10px] uppercase text-slate-500 font-bold">Registros</div>
            <div className="text-2xl font-bold text-slate-700">{gastosOperativos.length}</div>
          </div>
        </div>

        {/* Tabla */}
        <div className="h-[450px] w-full border border-rose-200 rounded-lg overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center bg-white">
              <Spin size="large" tip="Cargando gastos operativos..." />
            </div>
          ) : (
            <TableWithTitle
              id="table-modal-gastos-operativos"
              title="Gastos Operativos Libres"
              columnDefs={columnas}
              rowData={gastosOperativos}
              loading={isLoading}
              pinnedBottomRowData={pinnedBottomRowData}
              headerColor="#dc2626"
              selectionColor="#fef2f2"
              withNumberColumn={true}
              getRowStyle={() => ({ borderLeft: '3px solid #fca5a5' })}
            />
          )}
        </div>
      </div>
    </Modal>
  )
}
