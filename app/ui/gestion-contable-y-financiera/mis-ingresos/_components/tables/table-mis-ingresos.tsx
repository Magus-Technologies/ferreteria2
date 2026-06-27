'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { useStoreFiltrosMisIngresos } from '../../_store/store-filtros-mis-ingresos'
import { useGetIngresos } from '../../_hooks/use-get-ingresos'
import { type IngresoExtra, anularIngresoExtra } from '~/lib/api/ingreso-extra'
import { formatFechaPeru } from '~/utils/fechas'
import TableWithTitle from '~/components/tables/table-with-title'
import { Button, Popconfirm, Tooltip } from 'antd'
import useApp from 'antd/es/app/useApp'
import { MdDelete, MdEditSquare } from 'react-icons/md'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import ModalCrearIngresoExtra from '../others/modal-crear-ingreso-extra'

const TableMisIngresos = memo(function TableMisIngresos() {
  const filtros = useStoreFiltrosMisIngresos(state => state.filtros)
  const queryClient = useQueryClient()
  const { message } = useApp()

  const [modalEditOpen, setModalEditOpen] = useState(false)
  const [ingresoEdit, setIngresoEdit] = useState<IngresoExtra | undefined>(undefined)
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null)

  const anularMutation = useMutation({
    mutationFn: anularIngresoExtra,
    onSuccess: () => {
      message.success('Ingreso eliminado correctamente')
      queryClient.invalidateQueries({ queryKey: ['ingresos-extras'] })
      queryClient.invalidateQueries({ queryKey: ['ingresos-extras-resumen'] })
    },
    onError: (error: Error) => {
      message.error(error.message || 'Error al eliminar el ingreso')
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
      motivoIngreso: filtros.motivoIngreso,
      cajeroRegistra: filtros.cajeroRegistra,
      sucursal: filtros.sucursal,
      busqueda: filtros.busqueda,
      estado: filtros.estado,
      per_page: 100,
      page: 1
    }
  }, [filtros])

  const { data: IngresosResponse, isLoading, error } = useGetIngresos(
    apiFilters || {},
    !!apiFilters
  )

  const IngresosData = IngresosResponse?.data || []

  const columns: ColDef<IngresoExtra>[] = useMemo(() => [
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
      headerName: 'ESTADO',
      field: 'estado',
      width: 110,
      cellRenderer: (params: ICellRendererParams) => {
        const estado = params.value
        if (estado === 'anulado') {
          return (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Anulado
            </span>
          )
        }
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            Activo
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
        const data = params.data as IngresoExtra
        if (!data) return null

        const isRowLoading = loadingActionId === data.id
        const isAnulado = data.estado === 'anulado'

        return (
          <div className="flex gap-2 items-center h-full">
            <Tooltip title={isAnulado ? 'Ingreso anulado' : 'Editar Ingreso'}>
              <Button
                type='text'
                size='small'
                icon={<MdEditSquare size={18} />}
                style={{ color: isAnulado ? '#94a3b8' : '#eab308' }}
                className='p-0 hover:!bg-transparent hover:scale-110 transition-all active:scale-95 cursor-pointer min-w-fit'
                disabled={isRowLoading || isAnulado}
                onClick={() => {
                  setIngresoEdit(data)
                  setModalEditOpen(true)
                }}
              />
            </Tooltip>
            <Tooltip title={isAnulado ? 'Ingreso anulado' : 'Anular Ingreso'}>
              <Popconfirm
                title='¿Estás seguro de anular este ingreso?'
                description='El monto se revertirá regresando el dinero a la caja.'
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
  ], [loadingActionId, anularMutation])

  const getRowId = useCallback((params: any) => params.data.id, [])

  if (!filtros) return null

  if (isLoading) {
    return (
      <div className='h-full flex items-center justify-center'>
        <div className='text-slate-500'>Cargando Ingresos...</div>
      </div>
    )
  }

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