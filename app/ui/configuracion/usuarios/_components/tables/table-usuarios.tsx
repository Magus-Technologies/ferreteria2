'use client'

import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { message, Popconfirm, Tag } from 'antd'
import { FaEdit, FaTrash, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import { ColDef } from 'ag-grid-community'
import TableBase from '~/components/tables/table-base'
import { usuariosApi, Usuario } from '~/lib/api/usuarios'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ModalUsuarioForm from '../modals/modal-usuario-form'
import ButtonBase from '~/components/buttons/button-base'

export default function TableUsuarios() {
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
        headerName: 'Documento',
        field: 'numero_documento',
        width: 120,
        valueGetter: (params) => params.data?.numero_documento || '-',
      },
      {
        headerName: 'Celular',
        field: 'celular',
        width: 120,
        valueGetter: (params) => params.data?.celular || '-',
      },
      {
        headerName: 'Empresa',
        field: 'empresa.razon_social',
        flex: 1,
        minWidth: 200,
        valueGetter: (params) => params.data?.empresa?.razon_social || '-',
      },
      {
        headerName: 'Estado',
        field: 'estado',
        width: 100,
        cellRenderer: (params: { data: Usuario }) => {
          return params.data.estado ? (
            <Tag color='success' icon={<FaCheckCircle />}>
              Activo
            </Tag>
          ) : (
            <Tag color='error' icon={<FaTimesCircle />}>
              Inactivo
            </Tag>
          )
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
