'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tag, Popconfirm, message } from 'antd'
import dayjs from 'dayjs'
import { formatFechaPeru } from '~/utils/fechas'
import { ColDef } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import { greenColors } from '~/lib/colors'
import { QueryKeys } from '~/app/_lib/queryKeys'
import {
  transferenciaStockApi,
  type TransferenciaStock,
} from '~/lib/api/transferencia-stock'
import ButtonBase from '~/components/buttons/button-base'
import { FaBan, FaFilePdf } from 'react-icons/fa'
import ModalDocTransferenciaStock from '~/app/ui/gestion-comercial-e-inventario/_components/modals/modal-doc-transferencia-stock'
import type { TransferenciasFilters } from '../../page'

export default function TableTransferenciasStock({
  filters,
}: {
  filters?: TransferenciasFilters
}) {
  const queryClient = useQueryClient()
  const [openDoc, setOpenDoc] = useState(false)
  const [docData, setDocData] = useState<TransferenciaStock | undefined>()

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.TRANSFERENCIAS_STOCK, filters],
    queryFn: async () => {
      const result = await transferenciaStockApi.getAll({
        almacen_id: filters?.almacen_id || undefined,
        desde: filters?.desde || undefined,
        hasta: filters?.hasta || undefined,
        per_page: 500,
      })
      if (result.error) throw new Error(result.error.message)
      return result.data!
    },
  })

  const anularMutation = useMutation({
    mutationFn: (id: number) => transferenciaStockApi.anular(id),
    onSuccess: () => {
      message.success('Transferencia anulada')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.TRANSFERENCIAS_STOCK] })
      queryClient.invalidateQueries({ queryKey: ['productos-infinite'] })
    },
    onError: (error: any) => {
      message.error(error?.message || 'Error al anular')
    },
  })

  const columns: ColDef<TransferenciaStock>[] = [
    {
      colId: 'fecha',
      headerName: 'Fecha',
      field: 'fecha',
      width: 200,
      minWidth: 180,
      valueFormatter: (params) =>
        formatFechaPeru(params.value, 'DD/MM/YYYY hh:mm:ss A') || '-',
      sort: 'desc',
    },
    {
      colId: 'numero',
      headerName: 'N°',
      valueGetter: (params) =>
        params.data ? `TS${String(params.data.serie).padStart(4, '0')}-${String(params.data.numero).padStart(8, '0')}` : '-',
      width: 160,
      minWidth: 140,
    },
    {
      colId: 'producto',
      headerName: 'Producto',
      valueGetter: (params) => {
        const prod = params.data?.productos?.[0]
        if (!prod) return '-'
        return `${prod.producto_almacen_origen?.producto?.cod_producto} - ${prod.producto_almacen_origen?.producto?.name}`
      },
      flex: 1,
      minWidth: 250,
    },
    {
      colId: 'cantidad',
      headerName: 'Cantidad',
      valueGetter: (params) => {
        const prod = params.data?.productos?.[0]
        if (!prod) return '-'
        return `${Number(prod.cantidad).toFixed(3)} ${prod.unidad_derivada_inmutable?.name || ''}`
      },
      width: 140,
      minWidth: 120,
    },
    {
      colId: 'origen',
      headerName: 'Origen',
      valueGetter: (params) => params.data?.almacen_origen?.name || '-',
      width: 160,
      minWidth: 130,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <Tag color="red" className="!m-0">{params.value}</Tag>
        </div>
      ),
    },
    {
      colId: 'destino',
      headerName: 'Destino',
      valueGetter: (params) => params.data?.almacen_destino?.name || '-',
      width: 160,
      minWidth: 130,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <Tag color="green" className="!m-0">{params.value}</Tag>
        </div>
      ),
    },
    {
      colId: 'usuario',
      headerName: 'Usuario',
      valueGetter: (params) => params.data?.user?.name || '-',
      width: 150,
      minWidth: 120,
    },
    {
      colId: 'estado',
      headerName: 'Estado',
      field: 'estado',
      width: 100,
      minWidth: 90,
      cellRenderer: (params: any) => (
        <div className="flex items-center h-full">
          <Tag color={params.value ? 'green' : 'red'} className="!m-0">
            {params.value ? 'Activo' : 'Anulado'}
          </Tag>
        </div>
      ),
    },
    {
      colId: 'observaciones',
      headerName: 'Observaciones',
      field: 'descripcion',
      width: 180,
      minWidth: 120,
      valueFormatter: (params) => params.value || '-',
    },
    {
      colId: 'acciones',
      headerName: 'Acciones',
      width: 130,
      minWidth: 110,
      cellRenderer: (params: any) => {
        if (!params.data) return null
        return (
          <div className="flex items-center h-full gap-1">
            <ButtonBase
              color="info"
              size="sm"
              type="button"
              onClick={() => {
                setDocData(params.data)
                setOpenDoc(true)
              }}
            >
              <FaFilePdf size={12} />
            </ButtonBase>
            {params.data.estado && (
              <Popconfirm
                title="¿Anular esta transferencia?"
                description="Se revertirán los movimientos de stock"
                onConfirm={() => anularMutation.mutate(params.data.id)}
                okText="Sí, anular"
                cancelText="No"
              >
                <ButtonBase color="danger" size="sm" type="button">
                  <FaBan size={12} />
                </ButtonBase>
              </Popconfirm>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <>
      <ModalDocTransferenciaStock open={openDoc} setOpen={setOpenDoc} data={docData} />
      <TableWithTitle<TransferenciaStock>
        id="transferencias-stock.historial"
        title="Historial de Transferencias de Stock"
        selectionColor={greenColors[10]}
        columnDefs={columns}
        rowData={data?.data || []}
        loading={isLoading}
        pagination={false}
        optionsSelectColumns={[
          {
            label: 'Default',
            columns: [
              'Fecha', 'N°', 'Producto', 'Cantidad',
              'Origen', 'Destino', 'Usuario', 'Estado', 'Observaciones', 'Acciones',
            ],
          },
        ]}
      />
    </>
  )
}
