'use client'

import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message, Popconfirm, Tag } from 'antd'
import { FaEdit, FaTrash } from 'react-icons/fa'
import { ColDef } from 'ag-grid-community'
import TableBase from '~/components/tables/table-base'
import { usuariosApi, Usuario } from '~/lib/api/usuarios'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ModalUsuarioForm from '../modals/modal-usuario-form'
import ButtonBase from '~/components/buttons/button-base'

interface TableUsuariosProps {
  onUsuarioSelect: (usuario: Usuario | null) => void
}

export default function TableUsuarios({ onUsuarioSelect }: TableUsuariosProps) {
  const [usuarioEdit, setUsuarioEdit] = useState<Usuario | null>(null)
  const [openModal, setOpenModal] = useState(false)
  const queryClient = useQueryClient()

  // Query para obtener usuarios
  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.USUARIOS],
    queryFn: async () => {
      const response = await usuariosApi.getAll()
      if (response.error) {
        throw new Error(response.error.message)
      }
      return response.data?.data || []
    },
  })

  // Mutación para eliminar
  const deleteMutation = useMutation({
    mutationFn: (id: string) => usuariosApi.delete(id),
    onSuccess: (response) => {
      if (response.data) {
        message.success('Usuario desactivado exitosamente')
        queryClient.invalidateQueries({ queryKey: [QueryKeys.USUARIOS] })
      } else if (response.error) {
        message.error(response.error.message)
      }
    },
    onError: () => {
      message.error('Error al desactivar usuario')
    },
  })

  // Definición de columnas
  const columnDefs = useMemo<ColDef<Usuario>[]>(
    () => [
      {
        headerName: 'Estado',
        field: 'estado',
        width: 100,
        cellRenderer: (params: { data: Usuario }) => {
          return params.data.estado ? (
            <Tag color='success'>
              Activo
            </Tag>
          ) : (
            <Tag color='error'>
              Inactivo
            </Tag>
          )
        },
      },
      {
        headerName: 'Documento',
        field: 'numero_documento',
        width: 120,
        valueGetter: (params) => params.data?.numero_documento || '-',
      },
      {
        headerName: 'Nombre',
        field: 'name',
        flex: 1,
        minWidth: 200,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Email',
        field: 'email',
        flex: 1,
        minWidth: 200,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: 'Cargo u ocupación',
        field: 'cargo',
        width: 180,
        filter: 'agTextColumnFilter',
        valueGetter: (params) => params.data?.cargo || '-',
      },
      {
        headerName: 'Rol Sistema',
        field: 'rol_sistema',
        width: 140,
        valueGetter: (params) => params.data?.rol_sistema || '-',
      },
      {
        headerName: 'Fecha Inicio',
        field: 'fecha_inicio',
        width: 120,
        valueFormatter: (params) => {
          if (!params.value) return '-'
          const date = new Date(params.value)
          return date.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        },
      },
      {
        headerName: 'Acciones',
        width: 150,
        pinned: 'right',
        cellRenderer: (params: { data: Usuario }) => {
          return (
            <div className='flex gap-2 items-center h-full'>
              <ButtonBase
                size='sm'
                color='warning'
                onClick={() => {
                  setUsuarioEdit(params.data)
                  setOpenModal(true)
                }}
              >
                <FaEdit />
              </ButtonBase>
              <Popconfirm
                title='¿Desactivar usuario?'
                description='El usuario será desactivado pero no eliminado'
                onConfirm={() => deleteMutation.mutate(params.data.id)}
                okText='Sí, desactivar'
                cancelText='Cancelar'
                okButtonProps={{ danger: true }}
              >
                <ButtonBase size='sm' color='danger'>
                  <FaTrash />
                </ButtonBase>
              </Popconfirm>
            </div>
          )
        },
      },
    ],
    [deleteMutation]
  )

  return (
    <>
      <TableBase
        rowData={data || []}
        columnDefs={columnDefs}
        loading={isLoading}
        domLayout='autoHeight'
        pagination={true}
        paginationPageSize={20}
        onRowClicked={(event) => {
          // Seleccionar la fila cuando se hace clic en cualquier parte
          event.node.setSelected(true)
        }}
        onSelectionChanged={(event) => {
          const selectedNodes = event.api.getSelectedNodes()
          const usuario = selectedNodes[0]?.data || null
          onUsuarioSelect(usuario)
        }}
        getRowId={(params) => params.data.id}
      />

      <ModalUsuarioForm
        open={openModal}
        setOpen={(value) => {
          setOpenModal(value)
          if (!value) setUsuarioEdit(null)
        }}
        usuarioEdit={usuarioEdit}
      />
    </>
  )
}
