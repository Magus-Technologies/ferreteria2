'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { Tag, Tooltip } from 'antd'
import { MdEdit, MdDelete, MdVisibility } from 'react-icons/md'
import dayjs from 'dayjs'

type GuiaRow = {
  id: number
  serie: string
  numero: number
  fecha_emision: string
  fecha_traslado: string
  tipo_guia: string
  cliente_nombre?: string
  motivo_traslado: string
  afecta_stock: boolean
  total_productos: number
}

export function useColumnsGuias() {
  const columns: ColDef<GuiaRow>[] = [
    {
      headerName: 'Serie-Número',
      field: 'serie',
      minWidth: 130,
      width: 130,
      cellRenderer: ({ data }: ICellRendererParams<GuiaRow>) => (
        <div className='flex items-center h-full font-semibold'>
          {data?.serie}-{String(data?.numero).padStart(6, '0')}
        </div>
      ),
    },
    {
      headerName: 'F. Emisión',
      field: 'fecha_emision',
      minWidth: 110,
      width: 110,
      cellRenderer: ({ value }: ICellRendererParams<GuiaRow>) => (
        <div className='flex items-center h-full'>
          {value ? dayjs(value).format('DD/MM/YYYY') : '-'}
        </div>
      ),
    },
    {
      headerName: 'F. Traslado',
      field: 'fecha_traslado',
      minWidth: 110,
      width: 110,
      cellRenderer: ({ value }: ICellRendererParams<GuiaRow>) => (
        <div className='flex items-center h-full'>
          {value ? dayjs(value).format('DD/MM/YYYY') : '-'}
        </div>
      ),
    },
    {
      headerName: 'Tipo',
      field: 'tipo_guia',
      minWidth: 180,
      width: 180,
      cellRenderer: ({ value }: ICellRendererParams<GuiaRow>) => {
        const tipos: Record<string, { label: string; color: string }> = {
          ELECTRONICA_REMITENTE: { label: 'E-Remitente', color: 'blue' },
          ELECTRONICA_TRANSPORTISTA: { label: 'E-Transportista', color: 'cyan' },
          FISICA: { label: 'Física', color: 'default' },
        }
        const tipo = tipos[value] || { label: value, color: 'default' }
        return (
          <div className='flex items-center h-full'>
            <Tag color={tipo.color}>{tipo.label}</Tag>
          </div>
        )
      },
    },
    {
      headerName: 'Cliente',
      field: 'cliente_nombre',
      minWidth: 200,
      flex: 1,
      cellRenderer: ({ value }: ICellRendererParams<GuiaRow>) => (
        <div className='flex items-center h-full'>
          <Tooltip title={value}>
            <div className='overflow-hidden text-ellipsis whitespace-nowrap'>
              {value || '-'}
            </div>
          </Tooltip>
        </div>
      ),
    },
    {
      headerName: 'Motivo',
      field: 'motivo_traslado',
      minWidth: 150,
      width: 150,
      cellRenderer: ({ value }: ICellRendererParams<GuiaRow>) => (
        <div className='flex items-center h-full'>
          <Tooltip title={value}>
            <div className='overflow-hidden text-ellipsis whitespace-nowrap text-xs'>
              {value}
            </div>
          </Tooltip>
        </div>
      ),
    },
    {
      headerName: 'Stock',
      field: 'afecta_stock',
      minWidth: 80,
      width: 80,
      cellRenderer: ({ value }: ICellRendererParams<GuiaRow>) => (
        <div className='flex items-center h-full justify-center'>
          <Tag color={value ? 'green' : 'red'}>{value ? 'Sí' : 'No'}</Tag>
        </div>
      ),
    },
    {
      headerName: 'Items',
      field: 'total_productos',
      minWidth: 70,
      width: 70,
      cellRenderer: ({ value }: ICellRendererParams<GuiaRow>) => (
        <div className='flex items-center h-full justify-center font-semibold'>
          {value || 0}
        </div>
      ),
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 120,
      minWidth: 120,
      pinned: 'right',
      cellRenderer: ({ data }: ICellRendererParams<GuiaRow>) => (
        <div className='flex items-center gap-2 h-full justify-center'>
          <Tooltip title='Ver'>
            <MdVisibility
              size={18}
              className='cursor-pointer text-blue-600 hover:scale-110 transition-all'
            />
          </Tooltip>
          <Tooltip title='Editar'>
            <MdEdit
              size={18}
              className='cursor-pointer text-orange-600 hover:scale-110 transition-all'
            />
          </Tooltip>
          <Tooltip title='Eliminar'>
            <MdDelete
              size={18}
              className='cursor-pointer text-rose-600 hover:scale-110 transition-all'
            />
          </Tooltip>
        </div>
      ),
    },
  ]

  return columns
}
