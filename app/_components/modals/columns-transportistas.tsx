'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import dayjs from 'dayjs'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { transportistaApi, Transportista } from '~/lib/api/transportista'
import { Popconfirm, Tag, Tooltip } from 'antd'
import { MdEditSquare, MdPower, MdPowerOff } from 'react-icons/md'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { message } from 'antd'

export function useColumnsTransportistas({
  setDataEdit,
  setOpen,
}: {
  setDataEdit: (data: Transportista | undefined) => void
  setOpen: (open: boolean) => void
}) {
  const queryClient = useQueryClient()

  const { mutate: cambiarEstado, isPending: cambiandoEstado } = useMutation({
    mutationFn: async (transportista: Transportista) => {
      const result = await transportistaApi.update(transportista.id, {
        estado: !transportista.estado,
      })
      if (result.error) throw new Error(result.error.message)
      return result
    },
    onSuccess: (_data, transportista) => {
      message.success(
        transportista.estado
          ? 'Transportista desactivado correctamente'
          : 'Transportista activado correctamente'
      )
      queryClient.invalidateQueries({ queryKey: [QueryKeys.TRANSPORTISTAS] })
    },
    onError: (error: any) => {
      message.error(error.message || 'Error al cambiar el estado del transportista')
    },
  })

  const columns: ColDef<Transportista>[] = [
    {
      colId: 'ruc',
      headerName: 'RUC',
      field: 'ruc',
      width: 140,
      minWidth: 140,
      filter: true,
    },
    {
      colId: 'razon_social',
      headerName: 'Razón Social',
      field: 'razon_social',
      width: 260,
      minWidth: 200,
      filter: true,
      flex: 1,
    },
    {
      colId: 'nro_mtc',
      headerName: 'N° MTC',
      field: 'nro_mtc',
      width: 120,
      minWidth: 120,
      valueFormatter: params => params.value || '-',
      filter: true,
    },
    {
      colId: 'estado',
      headerName: 'Estado',
      field: 'estado',
      width: 110,
      minWidth: 110,
      cellRenderer: (params: ICellRendererParams<Transportista>) =>
        params.value ? (
          <Tag color='green'>Activo</Tag>
        ) : (
          <Tag color='red'>Inactivo</Tag>
        ),
      filter: true,
    },
    {
      colId: 'created_at',
      headerName: 'Registrado',
      field: 'created_at',
      width: 130,
      minWidth: 130,
      valueFormatter: params =>
        params.value ? dayjs(params.value).format('DD/MM/YYYY') : '-',
      filter: true,
    },
    {
      colId: 'acciones',
      headerName: 'Acciones',
      field: 'id',
      width: 80,
      cellRenderer: (params: ICellRendererParams<Transportista>) => {
        const transportista = params.data as Transportista
        return (
          <div className='flex items-center gap-2 h-full'>
            <Tooltip title='Editar'>
              <MdEditSquare
                onClick={() => {
                  setDataEdit(transportista)
                  setOpen(true)
                }}
                size={15}
                className={`text-yellow-500 hover:scale-105 transition-all active:scale-95 ${
                  cambiandoEstado
                    ? 'opacity-50 cursor-not-allowed pointer-events-none'
                    : 'cursor-pointer'
                } min-w-fit`}
              />
            </Tooltip>
            <Tooltip title={transportista.estado ? 'Desactivar' : 'Activar'}>
              <Popconfirm
                title={transportista.estado ? 'Desactivar' : 'Activar'}
                description={`¿Estás seguro de ${
                  transportista.estado ? 'desactivar' : 'activar'
                } este transportista?`}
                onConfirm={() => cambiarEstado(transportista)}
                okText={transportista.estado ? 'Desactivar' : 'Activar'}
                cancelText='Cancelar'
              >
                {transportista.estado ? (
                  <MdPowerOff
                    size={16}
                    className={`text-rose-700 hover:scale-105 transition-all active:scale-95 ${
                      cambiandoEstado
                        ? 'opacity-50 cursor-not-allowed pointer-events-none'
                        : 'cursor-pointer'
                    } min-w-fit`}
                  />
                ) : (
                  <MdPower
                    size={16}
                    className={`text-emerald-600 hover:scale-105 transition-all active:scale-95 ${
                      cambiandoEstado
                        ? 'opacity-50 cursor-not-allowed pointer-events-none'
                        : 'cursor-pointer'
                    } min-w-fit`}
                  />
                )}
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
