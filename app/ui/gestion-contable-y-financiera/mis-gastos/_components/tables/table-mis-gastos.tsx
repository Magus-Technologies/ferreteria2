'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { useStoreFiltrosMisGastos } from '../../_store/store-filtros-mis-gastos'
import { useGetGastos } from '../../_hooks/use-get-gastos'
import { type GastoExtra, eliminarGastoExtra } from '~/lib/api/gasto-extra'
import dayjs from 'dayjs'
import { formatFechaPeru } from '~/utils/fechas'
import TableWithTitle from '~/components/tables/table-with-title'
import { Button, Popconfirm, Tooltip } from 'antd'
import useApp from 'antd/es/app/useApp'
import { MdDelete, MdEditSquare } from 'react-icons/md'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import ModalCrearGastoExtra from '../others/modal-crear-gasto-extra'

const TableMisGastos = memo(function TableMisGastos() {
  const filtros = useStoreFiltrosMisGastos(state => state.filtros)
  const queryClient = useQueryClient()
  const { message } = useApp()

  const [modalEditOpen, setModalEditOpen] = useState(false)
  const [gastoEdit, setGastoEdit] = useState<GastoExtra | undefined>(undefined)
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null)

  const eliminarMutation = useMutation({
    mutationFn: eliminarGastoExtra,
    onSuccess: () => {
      message.success('Gasto eliminado correctamente')
      queryClient.invalidateQueries({ queryKey: ['gastos-extras'] })
      queryClient.invalidateQueries({ queryKey: ['gastos-extras-resumen'] })
    },
    onError: (error: Error) => {
      message.error(error.message || 'Error al eliminar el gasto')
    },
    onSettled: () => {
      setLoadingActionId(null)
    }
  })

  const apiFilters = useMemo(() => {
    if (!filtros) return null
    return {
      fechaDesde: filtros.fechaDesde,
      fechaHasta: filtros.fechaHasta,
      motivoGasto: filtros.motivoGasto,
      cajeroRegistra: filtros.cajeroRegistra,
      sucursal: filtros.sucursal,
      busqueda: filtros.busqueda,
      per_page: 100,
      page: 1
    }
  }, [filtros])

  const { data: gastosResponse, isLoading, error } = useGetGastos(
    apiFilters || {},
    !!apiFilters
  )

  const gastosData = gastosResponse?.data || []

  const columns: ColDef<GastoExtra>[] = useMemo(() => [
    {
      headerName: 'FECHA REGISTRO',
      field: 'created_at',
      width: 140,
      valueFormatter: (params) => formatFechaPeru(params.value, 'DD/MM/YYYY HH:mm'),
      sort: 'desc',
    },
    {
      headerName: 'MONTO',
      field: 'monto',
      width: 100,
      valueFormatter: (params) => {
        const monto = Number(params.value || 0)
        return `S/. ${monto.toFixed(2)}`
      },
      cellClass: 'font-semibold text-rose-600',
      type: 'numericColumn',
    },
    {
      headerName: 'CONCEPTO',
      field: 'concepto',
      width: 250,
      flex: 1,
    },
    {
      headerName: 'MÉTODO DE PAGO / CAJA',
      field: 'despliegue_pago.name',
      width: 170,
      valueGetter: (params) => {
        const dp = params.data?.despliegue_pago
        if (!dp) return '-'
        const subcaja = dp.subcaja_nombre || ''
        const metodo = dp.metodo_de_pago?.name || ''
        const despliegueName = dp.name || ''
        return [subcaja, metodo, despliegueName].filter(Boolean).join('/') || '-'
      }
    },
    {
      headerName: 'USUARIO CREADOR',
      field: 'user.name',
      width: 150,
      valueGetter: params => params.data?.user?.name || 'Desconocido'
    },
    {
      headerName: 'COMPRA ASOCIADA',
      field: 'compra',
      width: 200,
      valueGetter: (params) => {
        const compra = params.data?.compra
        if (!compra) return '—'
        const doc = [compra.serie, compra.numero].filter(Boolean).join('-')
        const proveedor = compra.proveedor?.nombre ?? ''
        return [doc, proveedor].filter(Boolean).join(' | ')
      },
    },
    {
      headerName: 'ESTADO',
      field: 'compra',
      width: 120,
      cellRenderer: (params: ICellRendererParams<GastoExtra>) => {
        const usado = !!params.data?.compra
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${usado ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
            {usado ? 'Usado' : 'Disponible'}
          </span>
        )
      },
      cellClass: 'flex items-center',
    },
    {
      headerName: 'ACCIONES',
      field: 'id',
      width: 120,
      pinned: 'right',
      cellRenderer: (params: ICellRendererParams) => {
        const data = params.data as GastoExtra
        if (!data) return null

        const isRowLoading = loadingActionId === data.id
        const isUsado = !!data.compra

        return (
          <div className="flex gap-2 items-center h-full">
            <Tooltip title="Editar Gasto">
              <Button
                type='text'
                size='small'
                icon={<MdEditSquare size={18} />}
                style={{ color: '#eab308' }}
                className='p-0 hover:!bg-transparent hover:scale-110 transition-all active:scale-95 cursor-pointer min-w-fit'
                disabled={isRowLoading}
                onClick={() => {
                  setGastoEdit(data)
                  setModalEditOpen(true)
                }}
              />
            </Tooltip>
            <Tooltip title={isUsado ? 'No se puede eliminar: ya está asociado a una compra' : 'Eliminar Gasto'}>
              <Popconfirm
                title='¿Estás seguro de eliminar este gasto?'
                onConfirm={() => {
                  setLoadingActionId(data.id)
                  eliminarMutation.mutate(data.id)
                }}
                okText='Sí, Eliminar'
                cancelText='Cancelar'
                okButtonProps={{ danger: true }}
                disabled={isRowLoading || isUsado}
              >
                <Button
                  type='text'
                  size='small'
                  icon={<MdDelete size={18} />}
                  style={{ color: isUsado ? '#94a3b8' : '#e11d48' }}
                  className='p-0 hover:!bg-transparent hover:scale-110 transition-all active:scale-95 cursor-pointer min-w-fit'
                  loading={isRowLoading && eliminarMutation.isPending}
                  disabled={isRowLoading || isUsado}
                />
              </Popconfirm>
            </Tooltip>
          </div>
        )
      }
    }
  ], [loadingActionId, eliminarMutation])

  const getRowId = useCallback((params: any) => params.data.id, [])

  if (!filtros) return null

  if (isLoading) {
    return (
      <div className='h-full flex items-center justify-center'>
        <div className='text-slate-500'>Cargando gastos...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='h-full flex items-center justify-center'>
        <div className='text-red-500'>Error al cargar gastos: {error.message}</div>
      </div>
    )
  }

  return (
    <div className='h-full flex flex-col'>
      <div className='flex-1 h-0'>
        <TableWithTitle<GastoExtra>
          id="mis-gastos"
          title="Mis Gastos Operativos"
          columnDefs={columns}
          rowData={gastosData}
          getRowId={getRowId}
          headerColor='#e11d48'
          selectionColor='#fecdd3'
          pagination={false}
          suppressRowClickSelection={false}
          rowSelection={false}
          exportExcel={true}
          exportPdf={true}
          selectColumns={true}
        />
      </div>

      <ModalCrearGastoExtra
        open={modalEditOpen}
        onClose={() => {
          setModalEditOpen(false)
          setGastoEdit(undefined)
        }}
        gastoEdit={gastoEdit}
      />
    </div>
  )
})

export default TableMisGastos
