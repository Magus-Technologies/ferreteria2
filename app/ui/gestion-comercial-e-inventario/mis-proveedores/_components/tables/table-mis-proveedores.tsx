'use client'

import { useState, useRef, useEffect } from 'react'
import { Button, Tag, Tooltip, Modal } from 'antd'
import { FaEdit, FaTrash, FaStar, FaEye } from 'react-icons/fa'
import type { ColDef } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import TableWithTitle from '~/components/tables/table-with-title'
import { Proveedor, proveedorApi } from '~/lib/api/proveedor'
import { useStoreFiltrosMisProveedores } from '../../_store/store-filtros-mis-proveedores'
import { useStoreProveedorSeleccionado } from '../../_store/store-proveedor-seleccionado'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { App } from 'antd'
import ModalCreateProveedor from '../modals/modal-create-proveedor'
import ModalCalificacionesProveedor from '../modals/modal-calificaciones-proveedor'
import ModalDetalleProveedor from '../modals/modal-detalle-proveedor'
import { greenColors } from '~/lib/colors'

export default function TableMisProveedores() {
  const { filtros } = useStoreFiltrosMisProveedores()
  const { setProveedorId } = useStoreProveedorSeleccionado()
  const { notification } = App.useApp()
  const queryClient = useQueryClient()
  const tableRef = useRef<AgGridReact<Proveedor>>(null)

  const [proveedorParaEditar, setProveedorParaEditar] = useState<Proveedor | undefined>()
  const [modalEditarOpen, setModalEditarOpen] = useState(false)
  const [proveedorParaCalificar, setProveedorParaCalificar] = useState<Proveedor | null>(null)
  const [modalCalificacionesOpen, setModalCalificacionesOpen] = useState(false)
  const [proveedorParaDetalle, setProveedorParaDetalle] = useState<Proveedor | null>(null)
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false)
  const [proveedorAEliminar, setProveedorAEliminar] = useState<number | null>(null)

  const { data: response, isFetching, refetch } = useQuery({
    queryKey: [QueryKeys.PROVEEDORES, filtros],
    queryFn: async () => {
      if (filtros.ordenar_por === 'compras') {
        const result = await proveedorApi.getProveedoresOrdenadosPorCompras({
          search: filtros.search || undefined,
          estado: filtros.estado,
          calificacion: filtros.calificacion,
          tipo_proveedor: filtros.tipo_proveedor,
          per_page: 100,
        })
        if (result.error) throw new Error(result.error.message)
        return result.data?.data || []
      }

      const result = await proveedorApi.getAll({
        search: filtros.search || undefined,
        estado: filtros.estado,
        calificacion: filtros.calificacion,
        tipo_proveedor: filtros.tipo_proveedor,
        per_page: 100,
      })
      if (result.error) throw new Error(result.error.message)
      return result.data?.data || []
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => proveedorApi.delete(id),
    onSuccess: (response) => {
      if (response.error) {
        notification.error({ message: 'Error', description: response.error.message })
        return
      }
      notification.success({ message: 'Proveedor eliminado' })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PROVEEDORES] })
      refetch()
    },
    onError: (error: Error) => {
      notification.error({ message: 'Error', description: error.message })
    },
  })

  const { data: proveedoresConCompras } = useQuery({
    queryKey: [QueryKeys.PROVEEDORES, 'con-compras'],
    queryFn: async () => {
      const result = await proveedorApi.getProveedoresConCompras()
      if (result.error) return new Set<number>()
      return new Set(result.data?.data || [])
    },
  })

  const proveedores = Array.isArray(response) ? response : []

  const initialSelectionDone = useRef(false)

  useEffect(() => {
    if (!proveedores.length || initialSelectionDone.current) return
    const timer = setTimeout(() => {
      const api = tableRef.current?.api
      if (!api) return
      const firstNode = api.getDisplayedRowAtIndex(0)
      if (firstNode?.data) {
        firstNode.setSelected(true)
        setProveedorId(firstNode.data.id)
        initialSelectionDone.current = true
      }
    }, 50)
    return () => clearTimeout(timer)
  }, [proveedores, setProveedorId])

  const columnDefs: ColDef<Proveedor>[] = [
    {
      colId: 'tipo_proveedor',
      headerName: 'Tipo',
      field: 'tipo_proveedor',
      width: 110,
      cellRenderer: (params: any) => {
        const tipo = params.value as string
        return (
          <Tag color={tipo === 'empresa' ? 'blue' : 'purple'}>
            {tipo === 'empresa' ? 'Empresa' : 'Persona'}
          </Tag>
        )
      },
    },
    {
      colId: 'ruc',
      headerName: 'RUC / DNI',
      field: 'ruc',
      width: 120,
      valueGetter: (params) => params.data?.ruc || '-',
    },
    {
      colId: 'razon_social',
      headerName: 'Razón Social',
      field: 'razon_social',
      flex: 1,
      minWidth: 200,
    },
    {
      colId: 'direccion',
      headerName: 'Dirección',
      field: 'direccion',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.data?.direccion || '-',
    },
    {
      colId: 'telefono',
      headerName: 'Teléfono',
      field: 'telefono',
      width: 120,
      valueGetter: (params) => params.data?.telefono || '-',
    },
    {
      colId: 'email',
      headerName: 'Email',
      field: 'email',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.data?.email || '-',
    },
    {
      colId: 'calificacion',
      headerName: 'Calificación',
      field: 'ultimaCalificacion.estado',
      width: 120,
      cellRenderer: (params: any) => {
        const calificacion = params.data?.ultimaCalificacion?.estado
        if (!calificacion) return <span className="text-gray-400">Sin calificar</span>
        const colorMap: Record<string, string> = {
          excelente: 'green', bueno: 'blue', regular: 'orange', problematico: 'red',
        }
        const labelMap: Record<string, string> = {
          excelente: 'Excelente', bueno: 'Bueno', regular: 'Regular', problematico: 'Problemático',
        }
        return <Tag color={colorMap[calificacion] || 'default'}>{labelMap[calificacion] || calificacion}</Tag>
      },
    },
    {
      colId: 'observacion',
      headerName: 'Observación',
      field: 'ultimaCalificacion.observacion',
      flex: 1,
      minWidth: 200,
      cellRenderer: (params: any) => {
        const observacion = params.data?.ultimaCalificacion?.observacion
        if (!observacion) return <span className="text-gray-400">-</span>
        return (
          <Tooltip title={observacion}>
            <span className="truncate block">{observacion}</span>
          </Tooltip>
        )
      },
    },
    {
      colId: 'estado',
      headerName: 'Estado',
      field: 'estado',
      width: 100,
      cellRenderer: (params: any) => (
        <Tag color={params.value ? 'green' : 'red'}>
          {params.value ? 'Activo' : 'Inactivo'}
        </Tag>
      ),
    },
    {
      colId: 'acciones',
      headerName: 'Acciones',
      width: 145,
      cellRenderer: (params: any) => {
        const proveedor = params.data as Proveedor
        if (!proveedor) return null
        const tieneCompras = proveedoresConCompras?.has(proveedor.id) ?? false

        return (
          <div className="flex items-center gap-1">
            {/* Ver detalle */}
            <Button
              type="text"
              size="small"
              className="flex items-center justify-center hover:bg-blue-50"
              onClick={() => { setProveedorParaDetalle(proveedor); setModalDetalleOpen(true) }}
            >
              <FaEye className="text-blue-600" size={14} />
            </Button>

            {/* Calificaciones */}
            <Button
              type="text"
              size="small"
              className="flex items-center justify-center hover:bg-amber-50"
              onClick={() => { setProveedorParaCalificar(proveedor); setModalCalificacionesOpen(true) }}
            >
              <FaStar className="text-amber-600" size={14} />
            </Button>

            {/* Editar */}
            <Button
              type="text"
              size="small"
              className="flex items-center justify-center hover:bg-green-50"
              onClick={() => { setProveedorParaEditar(proveedor); setModalEditarOpen(true) }}
            >
              <FaEdit className="text-green-600" size={14} />
            </Button>

            {/* Eliminar — gris y deshabilitado si tiene compras */}
            <Tooltip title={tieneCompras ? 'No se puede eliminar: tiene compras registradas' : 'Eliminar'}>
              <Button
                type="text"
                size="small"
                disabled={tieneCompras}
                className="flex items-center justify-center"
                onClick={() => setProveedorAEliminar(proveedor.id)}
              >
                <FaTrash className={tieneCompras ? 'text-gray-300' : 'text-red-600'} size={14} />
              </Button>
            </Tooltip>
          </div>
        )
      },
    },
  ]

  return (
    <>
      <TableWithTitle<Proveedor>
        id="mis-proveedores"
        title="PROVEEDORES"
        loading={isFetching}
        columnDefs={columnDefs}
        rowData={proveedores}
        tableRef={tableRef}
        domLayout="normal"
        selectionColor={greenColors[10]}
        onSelectionChanged={() => {}}
        onRowClicked={(event) => {
          if (event.data) setProveedorId(event.data.id)
        }}
        defaultColDef={{ sortable: true, filter: true, resizable: true }}
        getRowId={(params) => params.data.id.toString()}
        className="h-full"
        exportExcel={true}
        exportPdf={true}
        selectColumns={true}
      />

      <ModalDetalleProveedor
        open={modalDetalleOpen}
        setOpen={setModalDetalleOpen}
        proveedor={proveedorParaDetalle}
      />

      <ModalCreateProveedor
        open={modalEditarOpen}
        setOpen={setModalEditarOpen}
        dataEdit={proveedorParaEditar}
        onSuccess={() => {
          setModalEditarOpen(false)
          setProveedorParaEditar(undefined)
          queryClient.invalidateQueries({ queryKey: [QueryKeys.PROVEEDORES] })
          refetch()
        }}
      />

      {proveedorParaCalificar && (
        <ModalCalificacionesProveedor
          open={modalCalificacionesOpen}
          onClose={() => { setModalCalificacionesOpen(false); setProveedorParaCalificar(null) }}
          proveedorId={proveedorParaCalificar.id}
          proveedorNombre={proveedorParaCalificar.razon_social}
        />
      )}

      <Modal
        title="¿Eliminar proveedor?"
        open={proveedorAEliminar !== null}
        onOk={() => {
          if (proveedorAEliminar) {
            deleteMutation.mutate(proveedorAEliminar)
            setProveedorAEliminar(null)
          }
        }}
        onCancel={() => setProveedorAEliminar(null)}
        okText="Sí, eliminar"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
      >
        <p>Esta acción no se puede deshacer. ¿Deseas continuar?</p>
      </Modal>
    </>
  )
}
