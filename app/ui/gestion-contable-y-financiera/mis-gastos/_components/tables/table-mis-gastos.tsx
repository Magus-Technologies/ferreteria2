'use client'

import { useRef, memo, useCallback, useMemo, useState, useEffect } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, SelectionChangedEvent, RowDoubleClickedEvent, RowClickedEvent, ICellRendererParams } from 'ag-grid-community'
import { useStoreFiltrosMisGastos } from '../../_store/store-filtros-mis-gastos'
import { useGetGastos } from '../../_hooks/use-get-gastos'
import { type GastoExtra, anularGastoExtra } from '~/lib/api/gasto-extra'
import dayjs from 'dayjs'
import TableWithTitle from '~/components/tables/table-with-title'
import { Button, Modal, message, Tooltip, Popconfirm } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { FaCheck, FaTimes } from 'react-icons/fa'
import { MdDelete, MdEditSquare } from 'react-icons/md'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import ModalAprobarGastoExtra from '../others/modal-aprobar-gasto-extra'
import ModalCrearGastoExtra from '../others/modal-crear-gasto-extra'

const { confirm } = Modal

// Componente para renderizar el estado
const EstadoCellRenderer = (props: ICellRendererParams) => {
  const estado = props.value as 'pendiente' | 'aprobado' | 'anulado'

  if (estado === 'anulado') {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Anulado
      </span>
    )
  }

  if (estado === 'pendiente') {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
        Pendiente
      </span>
    )
  }

  return (
    <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
      Aprobado
    </span>
  )
}

const TableMisGastos = memo(function TableMisGastos() {
  const filtros = useStoreFiltrosMisGastos(state => state.filtros)
  const queryClient = useQueryClient()

  const [modalAprobarOpen, setModalAprobarOpen] = useState(false)
  const [selectedGastoId, setSelectedGastoId] = useState<string | null>(null)

  const [modalEditOpen, setModalEditOpen] = useState(false)
  const [gastoEdit, setGastoEdit] = useState<GastoExtra | undefined>(undefined)

  const [loadingActionId, setLoadingActionId] = useState<string | null>(null)

  // Mutación para anular
  const anularMutation = useMutation({
    mutationFn: anularGastoExtra,
    onSuccess: () => {
      message.success('Gasto anulado correctamente')
      queryClient.invalidateQueries({ queryKey: ['gastos-extras'] })
      queryClient.invalidateQueries({ queryKey: ['gastos-extras-resumen'] })
    },
    onError: (error: Error) => {
      message.error(error.message || 'Error al anular el gasto')
    },
    onSettled: () => {
      setLoadingActionId(null)
    }
  })

  const handleAprobarClicked = useCallback((id: string) => {
    setSelectedGastoId(id)
    setModalAprobarOpen(true)
  }, [])

  // Convert store filters to API filters
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

  // Fetch gastos data
  const { data: gastosResponse, isLoading, error } = useGetGastos(
    apiFilters || {},
    !!apiFilters
  )

  const gastosData = gastosResponse?.data || []

  // Definir columnas según la imagen
  const columns: ColDef<GastoExtra>[] = useMemo(() => [
    {
      headerName: 'FECHA REGISTRO',
      field: 'created_at',
      width: 140,
      valueFormatter: (params) => {
        if (!params.value) return ''
        return dayjs(params.value).format('DD/MM/YYYY HH:mm')
      },
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
      headerName: 'SUPERVISOR',
      field: 'supervisor.name',
      width: 150,
      valueGetter: params => params.data?.supervisor?.name || '-'
    },
    {
      headerName: 'ESTADO',
      field: 'estado',
      width: 120,
      cellRenderer: EstadoCellRenderer,
      cellClass: 'flex items-center',
    },
    {
      headerName: 'ACCIONES',
      field: 'id',
      width: 180,
      pinned: 'right',
      cellRenderer: (params: ICellRendererParams) => {
        const data = params.data as GastoExtra
        if (!data) return null

        const isRowLoading = loadingActionId === data.id
        const isAnulado = data.estado === 'anulado'
        const isAprobado = data.estado === 'aprobado'

        return (
          <div className="flex gap-2 items-center h-full">
            <Tooltip title={isAprobado ? "Gasto ya aprobado" : "Aprobar Gasto"}>
              <Button
                type='text'
                size='small'
                icon={<FaCheck size={16} />}
                style={{ color: isAprobado ? '#94a3b8' : '#059669' }}
                className='p-0 hover:!bg-transparent hover:scale-110 transition-all active:scale-95 cursor-pointer min-w-fit'
                loading={isRowLoading}
                disabled={isRowLoading || isAprobado}
                onClick={() => handleAprobarClicked(data.id)}
              />
            </Tooltip>
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
            <Tooltip title={isAnulado ? "Gasto ya anulado" : "Anular Gasto"}>
              <Popconfirm
                title='¿Estás seguro de anular este gasto?'
                description='Si estaba aprobado, el monto se revertirá regresando el dinero a la caja.'
                onConfirm={() => {
                  setLoadingActionId(data.id)
                  anularMutation.mutate(data.id)
                }}
                okText='Sí, Anular'
                cancelText='Cancelar'
                okButtonProps={{ danger: true }}
                disabled={isRowLoading || isAnulado}
              >
                <Button
                  type='text'
                  size='small'
                  icon={<MdDelete size={18} />}
                  style={{ color: isAnulado ? '#94a3b8' : '#e11d48' }}
                  className='p-0 hover:!bg-transparent hover:scale-110 transition-all active:scale-95 cursor-pointer min-w-fit'
                  loading={isRowLoading && anularMutation.isPending}
                  disabled={isRowLoading || isAnulado}
                />
              </Popconfirm>
            </Tooltip>
          </div>
        )
      }
    }
  ], [handleAprobarClicked, anularMutation])

  const getRowId = useCallback((params: any) => params.data.id, [])

  // Solo renderizar cuando hay filtros
  if (!filtros) return null

  // Show loading state
  if (isLoading) {
    return (
      <div className='h-full flex items-center justify-center'>
        <div className='text-slate-500'>Cargando gastos...</div>
      </div>
    )
  }

  // Show error state
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

      <ModalAprobarGastoExtra
        open={modalAprobarOpen}
        onClose={() => {
          setModalAprobarOpen(false)
          setSelectedGastoId(null)
        }}
        gastoId={selectedGastoId}
      />

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