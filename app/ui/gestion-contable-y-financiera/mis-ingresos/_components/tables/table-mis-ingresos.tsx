'use client'

import { useRef, memo, useCallback, useMemo, useState, useEffect } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, SelectionChangedEvent, RowDoubleClickedEvent, RowClickedEvent, ICellRendererParams } from 'ag-grid-community'
import { useStoreFiltrosMisIngresos } from '../../_store/store-filtros-mis-ingresos'
import { useGetIngresos } from '../../_hooks/use-get-ingresos'
import { type IngresoExtra, anularIngresoExtra } from '~/lib/api/ingreso-extra'
import dayjs from 'dayjs'
import TableWithTitle from '~/components/tables/table-with-title'
import { Button, Modal, message, Tooltip, Popconfirm } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { FaCheck, FaTimes } from 'react-icons/fa'
import { MdDelete, MdEditSquare } from 'react-icons/md'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import ModalAprobarIngresoExtra from '../others/modal-aprobar-ingreso-extra'
import ModalCrearIngresoExtra from '../others/modal-crear-ingreso-extra'

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

const TableMisIngresos = memo(function TableMisIngresos() {
  const filtros = useStoreFiltrosMisIngresos(state => state.filtros)
  const queryClient = useQueryClient()

  const [modalAprobarOpen, setModalAprobarOpen] = useState(false)
  const [selectedIngresoId, setSelectedIngresoId] = useState<string | null>(null)

  const [modalEditOpen, setModalEditOpen] = useState(false)
  const [ingresoEdit, setIngresoEdit] = useState<IngresoExtra | undefined>(undefined)

  const [loadingActionId, setLoadingActionId] = useState<string | null>(null)

  // Mutación para anular
  const anularMutation = useMutation({
    mutationFn: anularIngresoExtra,
    onSuccess: () => {
      message.success('Ingreso anulado correctamente')
      queryClient.invalidateQueries({ queryKey: ['ingresos-extras'] })
      queryClient.invalidateQueries({ queryKey: ['ingresos-extras-resumen'] })
    },
    onError: (error: Error) => {
      message.error(error.message || 'Error al anular el Ingreso')
    },
    onSettled: () => {
      setLoadingActionId(null)
    }
  })

  const handleAprobarClicked = useCallback((id: string) => {
    setSelectedIngresoId(id)
    setModalAprobarOpen(true)
  }, [])

  const handleAnularClicked = useCallback((id: string) => {
    confirm({
      title: '¿Estás seguro de anular este Ingreso?',
      icon: <ExclamationCircleOutlined className="text-red-500" />,
      content: 'Si estaba aprobado, el monto se revertirá regresando el dinero a la caja.',
      okText: 'Sí, Anular',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk() {
        setLoadingActionId(id)
        anularMutation.mutate(id)
      },
    })
  }, [anularMutation])

  // Convert store filters to API filters
  const apiFilters = useMemo(() => {
    if (!filtros) return null

    return {
      fechaDesde: filtros.fechaDesde,
      fechaHasta: filtros.fechaHasta,
      motivoIngreso: filtros.motivoIngreso,
      cajeroRegistra: filtros.cajeroRegistra,
      sucursal: filtros.sucursal,
      busqueda: filtros.busqueda,
      per_page: 100,
      page: 1
    }
  }, [filtros])

  // Fetch Ingresos data
  const { data: IngresosResponse, isLoading, error } = useGetIngresos(
    apiFilters || {},
    !!apiFilters
  )

  const IngresosData = IngresosResponse?.data || []

  // Definir columnas según la imagen
  const columns: ColDef<IngresoExtra>[] = useMemo(() => [
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
      cellClass: 'font-semibold text-emerald-600',
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
        const data = params.data as IngresoExtra
        if (!data) return null

        const isRowLoading = loadingActionId === data.id
        const isAnulado = data.estado === 'anulado'
        const isAprobado = data.estado === 'aprobado'

        return (
          <div className="flex gap-2 items-center h-full">
            <Tooltip title={isAprobado ? "Ingreso ya aprobado" : "Aprobar Ingreso"}>
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
            <Tooltip title="Editar Ingreso">
              <Button
                type='text'
                size='small'
                icon={<MdEditSquare size={18} />}
                style={{ color: '#eab308' }}
                className='p-0 hover:!bg-transparent hover:scale-110 transition-all active:scale-95 cursor-pointer min-w-fit'
                disabled={isRowLoading}
                onClick={() => {
                  setIngresoEdit(data)
                  setModalEditOpen(true)
                }}
              />
            </Tooltip>
            <Tooltip title={isAnulado ? "Ingreso ya anulado" : "Anular Ingreso"}>
              <Popconfirm
                title='¿Estás seguro de anular este ingreso?'
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
        <div className='text-slate-500'>Cargando Ingresos...</div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className='h-full flex items-center justify-center'>
        <div className='text-red-500'>Error al cargar Ingresos: {error.message}</div>
      </div>
    )
  }

  return (
    <div className='h-full flex flex-col'>
      <div className='flex-1 h-0'>
        <TableWithTitle<IngresoExtra>
          id="mis-ingresos"
          title="Mis Ingresos Operativos"
          columnDefs={columns}
          rowData={IngresosData}
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

      <ModalAprobarIngresoExtra
        open={modalAprobarOpen}
        onClose={() => {
          setModalAprobarOpen(false)
          setSelectedIngresoId(null)
        }}
        IngresoId={selectedIngresoId}
      />

      <ModalCrearIngresoExtra
        open={modalEditOpen}
        onClose={() => {
          setModalEditOpen(false)
          setIngresoEdit(undefined)
        }}
        ingresoEdit={ingresoEdit}
      />
    </div>
  )
})

export default TableMisIngresos
