'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { choferApi, Chofer } from '~/lib/api/chofer'
import { Popconfirm, Tooltip } from 'antd'
import { MdDelete, MdEditSquare } from 'react-icons/md'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'

export function useColumnsChoferes({
  setDataEdit,
  setOpen,
}: {
  setDataEdit: (data: Chofer | undefined) => void
  setOpen: (open: boolean) => void
}) {
  const queryClient = useQueryClient()

  const { mutate: eliminarChofer, isPending: deleteLoading } = useMutation({
    mutationFn: async (id: number) => {
      const result = await choferApi.delete(id)
      if (result.error) throw new Error(result.error.message)
      return result
    },
    onSuccess: () => {
      message.success('Chofer eliminado correctamente')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.CHOFERES] })
    },
    onError: (error: any) => {
      message.error(error.message || 'Error al eliminar el chofer')
    },
  })

  const columns: ColDef<Chofer>[] = [
    {
      headerName: 'DNI',
      field: 'dni',
      width: 120,
      minWidth: 120,
      filter: true,
    },
    {
      headerName: 'Nombres',
      field: 'nombres',
      width: 200,
      minWidth: 200,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'Apellidos',
      field: 'apellidos',
      width: 200,
      minWidth: 200,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'Licencia',
      field: 'licencia',
      width: 150,
      minWidth: 150,
      filter: true,
    },
    {
      headerName: 'Teléfono',
      field: 'telefono',
      width: 120,
      minWidth: 120,
      valueFormatter: (params) => params.value || '-',
      filter: true,
    },
    {
      headerName: 'Email',
      field: 'email',
      width: 200,
      minWidth: 200,
      valueFormatter: (params) => params.value || '-',
      filter: true,
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 80,
      cellRenderer: (params: ICellRendererParams<Chofer>) => {
        return (
          <div className='flex items-center gap-2 h-full'>
            <Tooltip title='Editar'>
              <MdEditSquare
                onClick={() => {
                  setDataEdit(params.data)
                  setOpen(true)
                }}
                size={15}
                className={`text-yellow-500 hover:scale-105 transition-all active:scale-95 ${
                  deleteLoading
                    ? 'opacity-50 cursor-not-allowed pointer-events-none'
                    : 'cursor-pointer'
                } min-w-fit`}
              />
            </Tooltip>
            <Tooltip title='Eliminar'>
              <Popconfirm
                title='Eliminar'
                description='¿Estás seguro de eliminar este chofer?'
                onConfirm={() => eliminarChofer(params.value)}
                okText='Eliminar'
                cancelText='Cancelar'
              >
                <MdDelete
                  size={15}
                  className={`text-rose-700 hover:scale-105 transition-all active:scale-95 ${
                    deleteLoading
                      ? 'opacity-50 cursor-not-allowed pointer-events-none'
                      : 'cursor-pointer'
                  } min-w-fit`}
                />
              </Popconfirm>
            </Tooltip>
          </div>
        )
      },
      type: 'actions',
    },
  ]

  return columns
}
