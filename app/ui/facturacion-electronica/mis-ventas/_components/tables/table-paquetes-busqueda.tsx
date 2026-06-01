'use client'

import TableWithTitle, {
  TableWithTitleProps,
} from '~/components/tables/table-with-title'
import type { Paquete } from '~/lib/api/paquete'
import { useState, useRef, useEffect } from 'react'
import { usePaquetes } from '~/hooks/use-paquetes'
import { useDebounce } from 'use-debounce'
import { ColDef, ICellRendererParams } from 'ag-grid-community'
import ModalCrearEditarPaquete from '~/app/_components/modals/modal-crear-editar-paquete'
import { orangeColors } from '~/lib/colors'
import ColumnAction from '~/components/tables/column-action'
import { permissions } from '~/lib/permissions'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { paqueteApi } from '~/lib/api/paquete'

interface TablePaquetesBusquedaProps
  extends Omit<
    TableWithTitleProps<Paquete>,
    'id' | 'title' | 'onRowDoubleClicked'
  > {
  value: string
  onRowDoubleClicked?: ({
    data,
  }: {
    data: Paquete | undefined
  }) => void
  onPaqueteSeleccionado?: (paquete: Paquete | undefined) => void
  rowDataOverride?: Paquete[]
}

export default function TablePaquetesBusqueda({
  value,
  onRowDoubleClicked,
  onPaqueteSeleccionado,
  rowDataOverride,
  ...props
}: TablePaquetesBusquedaProps) {
  const [debouncedValue] = useDebounce(value, 500)

  // Siempre buscar, incluso con string vacío
  const { data, isLoading } = usePaquetes(
    { search: debouncedValue || undefined, activo: true, per_page: 50 },
    { enabled: !rowDataOverride },
  )

  const [openModalEditar, setOpenModalEditar] = useState(false)
  const [paqueteParaEditar, setPaqueteParaEditar] = useState<Paquete>()
  const tableGridRef = useRef<any>(null)

  const rowData = rowDataOverride ?? data?.data ?? []

  useEffect(() => {
    if (!rowData || rowData.length === 0) return
    let cancelled = false
    let attempts = 0
    const trySelect = () => {
      if (cancelled) return
      const api = tableGridRef.current?.api
      const firstNode = api?.getDisplayedRowAtIndex(0)
      if (firstNode) {
        const alreadySelected = (api?.getSelectedNodes()?.length ?? 0) > 0
        if (!alreadySelected) {
          firstNode.setSelected(true)
          onPaqueteSeleccionado?.(firstNode.data as Paquete)
        }
        return
      }
      if (++attempts < 20) requestAnimationFrame(trySelect)
    }
    requestAnimationFrame(trySelect)
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowData.length])

  const columnDefs: ColDef<Paquete>[] = [
    {
      headerName: 'Nombre',
      field: 'nombre',
      flex: 2,
      cellClass: 'font-medium',
      filter: true,
    },
    {
      headerName: 'Productos',
      field: 'productos_count',
      width: 120,
      cellClass: 'text-center',
      filter: true,
      cellRenderer: (params: any) => {
        const count = params.data?.productos_count || params.data?.productos?.length || 0
        return (
          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
            {count} producto{count !== 1 ? 's' : ''}
          </span>
        )
      },
    },
    {
      headerName: 'Precio Público',
      colId: 'precio_publico_total',
      width: 120,
      cellClass: 'text-right font-semibold',
      valueGetter: (params) => {
        const productos = params.data?.productos || []
        return productos.reduce((sum: number, p: any) => {
          return sum + Number(p.precio_publico || 0) * Number(p.cantidad || 0)
        }, 0)
      },
      valueFormatter: (params) => `S/. ${Number(params.value || 0).toFixed(2)}`,
    },
    {
      headerName: 'Acciones',
      colId: 'acciones',
      field: 'id',
      width: 80,
      cellRenderer: (params: ICellRendererParams<Paquete>) => {
        return (
          <ColumnAction
            id={params.value}
            permiso={permissions.PRODUCTO_BASE}
            propsDelete={{
              action: async ({ id }: { id: number }) => {
                const result = await paqueteApi.delete(id)
                if (result.error) {
                  return { error: result.error }
                }
                return { data: 'ok' }
              },
              msgSuccess: 'Paquete eliminado correctamente',
              queryKey: [QueryKeys.PAQUETES],
            }}
            onEdit={() => {
              setPaqueteParaEditar(params.data)
              setOpenModalEditar(true)
            }}
          />
        )
      },
    },
  ]

  return (
    <>
      <ModalCrearEditarPaquete
        open={openModalEditar}
        onClose={() => {
          setOpenModalEditar(false)
          setPaqueteParaEditar(undefined)
        }}
        paqueteId={paqueteParaEditar?.id}
        onSuccess={() => {
          // React Query invalidará el cache automáticamente
        }}
      />
      
      <TableWithTitle<Paquete>
        {...props}
        tableRef={tableGridRef}
        id='mis-ventas.paquetes'
        title='Paquetes'
        selectionColor={orangeColors[10]}
        loading={!rowDataOverride && isLoading}
        columnDefs={columnDefs}
        rowData={rowData}
        onSelectionChanged={({ selectedNodes }) => {
          const paquete = selectedNodes?.[0]?.data as Paquete
          onPaqueteSeleccionado?.(paquete)
        }}
        onRowDoubleClicked={({ data }) => {
          onPaqueteSeleccionado?.(data)
          onRowDoubleClicked?.({ data })
        }}
        optionsSelectColumns={[
          {
            label: 'Default',
            columns: [
              'Nombre',
              'Productos',
              'P. Total',
              'Acciones',
            ],
          },
        ]}
      />
    </>
  )
}

