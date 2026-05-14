'use client'

import { useState, useRef } from 'react'
import { Button, Tag, Tooltip, Modal } from 'antd'
import { FaEdit, FaTrash, FaStar, FaCheck, FaTimes } from 'react-icons/fa'
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
  
  // Estados para confirmación de acciones
  const [proveedorAEliminar, setProveedorAEliminar] = useState<number | null>(null)
  const [proveedorADesactivar, setProveedorADesactivar] = useState<number | null>(null)
  const [proveedorAActivar, setProveedorAActivar] = useState<number | null>(null)

  // Query para obtener los proveedores
  const { data: response, isFetching, refetch } = useQuery({
    queryKey: [QueryKeys.PROVEEDORES, filtros],
    queryFn: async () => {
      // Si se selecciona ordenar por compras, usar el endpoint especial
      if (filtros.ordenar_por === 'compras') {
        const result = await proveedorApi.getProveedoresOrdenadosPorCompras({
          search: filtros.search || undefined,
          estado: filtros.estado,
          calificacion: filtros.calificacion,
          tipo_proveedor: filtros.tipo_proveedor,
          per_page: 100,
        })

        if (result.error) {
          throw new Error(result.error.message)
        }

        return result.data?.data || []
      }

      // Si no, usar el endpoint normal
      const result = await proveedorApi.getAll({
        search: filtros.search || undefined,
        estado: filtros.estado,
        calificacion: filtros.calificacion,
        tipo_proveedor: filtros.tipo_proveedor,
        per_page: 100,
      })

      if (result.error) {
        throw new Error(result.error.message)
      }

      return result.data?.data || []
    },
  })

  // Mutation para eliminar proveedor
  const deleteMutation = useMutation({
    mutationFn: (id: number) => proveedorApi.delete(id),
    onSuccess: (response) => {
      console.log('Delete response:', response)
      
      if (response.error) {
        notification.error({
          message: 'Error',
          description: response.error.message,
        })
        return
      }

      notification.success({
        message: 'Proveedor eliminado',
        description: 'El proveedor ha sido eliminado exitosamente',
      })

      queryClient.invalidateQueries({ queryKey: [QueryKeys.PROVEEDORES] })
      refetch()
    },
    onError: (error: Error) => {
      console.error('Delete error:', error)
      notification.error({
        message: 'Error',
        description: error.message || 'Error al eliminar el proveedor',
      })
    },
  })

  // Mutation para cambiar estado del proveedor
  const updateEstadoMutation = useMutation({
    mutationFn: (data: { id: number; estado: boolean }) =>
      proveedorApi.update(data.id, { ...data, estado: data.estado } as any),
    onSuccess: (response, variables) => {
      if (response.error) {
        notification.error({
          message: 'Error',
          description: response.error.message,
        })
        return
      }

      notification.success({
        message: variables.estado ? 'Proveedor activado' : 'Proveedor desactivado',
        description: `El proveedor ha sido ${variables.estado ? 'activado' : 'desactivado'} exitosamente`,
      })

      queryClient.invalidateQueries({ queryKey: [QueryKeys.PROVEEDORES] })
      refetch()
    },
    onError: (error: Error) => {
      notification.error({
        message: 'Error',
        description: error.message || 'Error al cambiar el estado del proveedor',
      })
    },
  })

  const handleEditar = (proveedor: Proveedor) => {
    setProveedorParaEditar(proveedor)
    setModalEditarOpen(true)
  }

  const handleCalificaciones = (proveedor: Proveedor) => {
    setProveedorParaCalificar(proveedor)
    setModalCalificacionesOpen(true)
  }

  const proveedores = Array.isArray(response) ? response : []

  // Hook para obtener IDs de proveedores que tienen compras
  const { data: proveedoresConCompras } = useQuery({
    queryKey: [QueryKeys.PROVEEDORES, 'con-compras'],
    queryFn: async () => {
      const result = await proveedorApi.getProveedoresConCompras()
      if (result.error) {
        console.error('Error fetching providers with purchases:', result.error)
        return new Set<number>()
      }
      return new Set(result.data?.data || [])
    },
  })

  const columnDefs: ColDef<Proveedor>[] = [
    {
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
      headerName: 'RUC / DNI',
      field: 'ruc',
      width: 120,
      valueGetter: (params) => params.data?.ruc || '-',
    },
    {
      headerName: 'Razón Social',
      field: 'razon_social',
      flex: 1,
      minWidth: 200,
    },
    {
      headerName: 'Dirección',
      field: 'direccion',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.data?.direccion || '-',
    },
    {
      headerName: 'Teléfono',
      field: 'telefono',
      width: 120,
      valueGetter: (params) => params.data?.telefono || '-',
    },
    {
      headerName: 'Email',
      field: 'email',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.data?.email || '-',
    },
    {
      headerName: 'Calificación',
      field: 'ultimaCalificacion.estado',
      width: 120,
      cellRenderer: (params: any) => {
        const calificacion = params.data?.ultimaCalificacion?.estado
        if (!calificacion) return <span className="text-gray-400">Sin calificar</span>

        const colorMap: Record<string, string> = {
          excelente: 'green',
          bueno: 'blue',
          regular: 'orange',
          problematico: 'red',
        }

        const labelMap: Record<string, string> = {
          excelente: 'Excelente',
          bueno: 'Bueno',
          regular: 'Regular',
          problematico: 'Problemático',
        }

        return (
          <Tag color={colorMap[calificacion] || 'default'}>
            {labelMap[calificacion] || calificacion}
          </Tag>
        )
      },
    },
    {
      headerName: 'Observación',
      field: 'ultimaCalificacion.observacion',
      flex: 1,
      minWidth: 200,
      valueGetter: (params) => params.data?.ultimaCalificacion?.observacion || '-',
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
      headerName: 'Estado',
      field: 'estado',
      width: 100,
      cellRenderer: (params: any) => {
        const estado = params.value
        return (
          <Tag color={estado ? 'green' : 'red'}>
            {estado ? 'Activo' : 'Inactivo'}
          </Tag>
        )
      },
    },
    {
      headerName: 'Acciones',
      width: 150,
      pinned: 'right',
      cellRenderer: (params: any) => {
        const proveedor = params.data as Proveedor
        if (!proveedor) return null

        const tieneCompras = proveedoresConCompras?.has(proveedor.id) ?? false

        return (
          <div className="flex items-center gap-1">
            {/* Botón Calificaciones */}
            <Button
              type="text"
              size="small"
              className="flex items-center justify-center hover:bg-amber-50"
              onClick={() => handleCalificaciones(proveedor)}
            >
              <FaStar className="text-amber-600" size={14} />
            </Button>

            {/* Botón Editar */}
            <Button
              type="text"
              size="small"
              className="flex items-center justify-center hover:bg-green-50"
              onClick={() => handleEditar(proveedor)}
            >
              <FaEdit className="text-green-600" size={14} />
            </Button>

            {/* Botón Activar/Desactivar */}
            {proveedor.estado ? (
              <Button
                type="text"
                size="small"
                className="flex items-center justify-center hover:bg-red-50"
                title="Desactivar proveedor"
                onClick={() => setProveedorADesactivar(proveedor.id)}
              >
                <FaTimes className="text-red-600" size={14} />
              </Button>
            ) : (
              <Button
                type="text"
                size="small"
                className="flex items-center justify-center hover:bg-green-50"
                title="Activar proveedor"
                onClick={() => setProveedorAActivar(proveedor.id)}
              >
                <FaCheck className="text-green-600" size={14} />
              </Button>
            )}

            {/* Botón Eliminar - Solo si no tiene compras */}
            {!tieneCompras && (
              <Button
                type="text"
                size="small"
                className="flex items-center justify-center hover:bg-red-50"
                title="Eliminar proveedor"
                onClick={() => setProveedorAEliminar(proveedor.id)}
              >
                <FaTrash className="text-red-600" size={14} />
              </Button>
            )}
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
          if (event.data) {
            setProveedorId(event.data.id)
          }
        }}
        defaultColDef={{
          sortable: true,
          filter: true,
          resizable: true,
        }}
        getRowId={(params) => params.data.id.toString()}
        className="h-full"
        exportExcel={true}
        exportPdf={true}
        selectColumns={true}
      />

      {/* Modal para editar proveedor */}
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

      {/* Modal para calificaciones del proveedor */}
      {proveedorParaCalificar && (
        <ModalCalificacionesProveedor
          open={modalCalificacionesOpen}
          onClose={() => {
            setModalCalificacionesOpen(false)
            setProveedorParaCalificar(null)
          }}
          proveedorId={proveedorParaCalificar.id}
          proveedorNombre={proveedorParaCalificar.razon_social}
        />
      )}

      {/* Modal para confirmar eliminación */}
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

      {/* Modal para confirmar desactivación */}
      <Modal
        title="¿Desactivar proveedor?"
        open={proveedorADesactivar !== null}
        onOk={() => {
          if (proveedorADesactivar) {
            updateEstadoMutation.mutate({ id: proveedorADesactivar, estado: false })
            setProveedorADesactivar(null)
          }
        }}
        onCancel={() => setProveedorADesactivar(null)}
        okText="Sí, desactivar"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
      >
        <p>El proveedor no podrá ser utilizado hasta que sea reactivado.</p>
      </Modal>

      {/* Modal para confirmar activación */}
      <Modal
        title="¿Activar proveedor?"
        open={proveedorAActivar !== null}
        onOk={() => {
          if (proveedorAActivar) {
            updateEstadoMutation.mutate({ id: proveedorAActivar, estado: true })
            setProveedorAActivar(null)
          }
        }}
        onCancel={() => setProveedorAActivar(null)}
        okText="Sí, activar"
        cancelText="Cancelar"
      >
        <p>El proveedor volverá a estar disponible.</p>
      </Modal>
    </>
  )
}
