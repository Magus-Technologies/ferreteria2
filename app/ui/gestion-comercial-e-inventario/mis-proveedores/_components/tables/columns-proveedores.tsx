'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import ColumnAction from '~/components/tables/column-action'
import { permissions } from '~/lib/permissions'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { proveedorApi, type Proveedor } from '~/lib/api/proveedor'

import { Button, message, Popconfirm } from 'antd'
import { FaCheck } from 'react-icons/fa'

export function useColumnsProveedores({
  setDataEdit,
  setOpen,
  onReactivar,
}: {
  setDataEdit: (data: Proveedor | undefined) => void
  setOpen: (open: boolean) => void
  onReactivar?: () => void
}) {
  const columns: ColDef<Proveedor>[] = [
    {
      headerName: 'RUC',
      field: 'ruc',
      width: 120,
      minWidth: 120,
      filter: true,
    },
    {
      headerName: 'Razón Social',
      field: 'razon_social',
      width: 300,
      minWidth: 300,
      filter: true,
      flex: 1,
    },
    {
      headerName: 'Dirección',
      field: 'direccion',
      width: 120,
      minWidth: 120,
      valueFormatter: params => params.value || '-',
      filter: true,
    },
    {
      headerName: 'Teléfono',
      field: 'telefono',
      width: 120,
      minWidth: 120,
      valueFormatter: params => params.value || '-',
      filter: true,
    },
    {
      headerName: 'Email',
      field: 'email',
      width: 120,
      minWidth: 120,
      valueFormatter: params => params.value || '-',
      filter: true,
    },
    {
      headerName: 'Activo',
      field: 'estado',
      width: 90,
      minWidth: 90,
      type: 'boolean',
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 120, // increased width because we have more actions
      cellRenderer: (params: ICellRendererParams<Proveedor>) => {
        const isInactive = params.data && params.data.estado === false

        return (
          <div className='flex items-center gap-2 h-full'>
            <ColumnAction
              id={params.value}
              permiso={permissions.PROVEEDOR_BASE}
              autorizacion={{ modulo: 'proveedores', descripcion: `Proveedor: ${params.data?.razon_social || ''}` }}
              propsDelete={{
                action: async ({ id }: { id: number }) => {
                  const result = await proveedorApi.delete(id)
                  if (result.error) {
                    return { error: result.error }
                  }
                  return { data: 'ok' }
                },
                msgSuccess: 'Proveedor eliminado correctamente',
                queryKey: [QueryKeys.PROVEEDORES, QueryKeys.PROVEEDORES_SEARCH],
              }}
              onEdit={() => {
                setDataEdit(params.data)
                setOpen(true)
              }}
            />
            {isInactive && (
              <Popconfirm
                title='¿Activar este proveedor?'
                description='El proveedor volverá a estar activo.'
                onConfirm={async () => {
                  try {
                    // El backend requiere el objeto completo (RUC, Razón social, etc)
                    const payload = params.data ? { ...params.data, estado: true } : { estado: true }

                    const result = await proveedorApi.update(params.value, payload as any)
                    if (result.error) {
                      message.error('Error al activar proveedor')
                    } else {
                      message.success('Proveedor activado correctamente')
                      onReactivar?.()
                    }
                  } catch {
                    message.error('Error al activar proveedor')
                  }
                }}
                okText='Sí, activar'
                cancelText='Cancelar'
              >
                <Button
                  type='link'
                  size='small'
                  icon={<FaCheck />}
                  className='text-green-600 hover:!text-green-700 p-0'
                  title='Activar proveedor'
                />
              </Popconfirm>
            )}
          </div>
        )
      },
      type: 'actions',
    },
  ]

  return columns
}
