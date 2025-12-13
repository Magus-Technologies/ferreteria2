import { useRef, useEffect, useState, useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { useServerQuery } from './use-server-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { ServerAction } from './use-server-mutation'
import { SelectionChangedEvent, RowDoubleClickedEvent } from 'ag-grid-community'

interface UseOptimizedTableProps<TParams, TResult, TItem> {
  action: ServerAction<TParams, TResult>
  queryKey: QueryKeys[]
  filtros: TParams
  staleTime?: number
  cacheTime?: number
  onSelectionChanged?: (item: TItem | undefined) => void
  onRowDoubleClicked?: (item: TItem | undefined) => void
}

/**
 * Hook optimizado para tablas con AGGrid que incluye:
 * - Cache configurado automáticamente
 * - Manejo de selección memoizado
 * - Ref para la tabla
 * - Loading y error states
 */
export function useOptimizedTable<TParams, TResult, TItem>({
  action,
  queryKey,
  filtros,
  staleTime = 2 * 60 * 1000, // 2 minutos por defecto
  cacheTime = 5 * 60 * 1000,  // 5 minutos por defecto
  onSelectionChanged,
  onRowDoubleClicked,
}: UseOptimizedTableProps<TParams, TResult, TItem>) {
  
  const tableRef = useRef<AgGridReact>(null)
  const [primeraVez, setPrimeraVez] = useState(true)

  // Query optimizada con cache
  const { response, refetch, loading, error } = useServerQuery({
    action,
    propsQuery: {
      queryKey,
      staleTime,
      gcTime: cacheTime,
    },
    params: filtros,
  })

  // Controlar primera ejecución
  useEffect(() => {
    if (!loading && filtros) setPrimeraVez(false)
  }, [loading, filtros])

  useEffect(() => {
    if (!primeraVez) refetch()
  }, [filtros, refetch, primeraVez])

  // Handlers memoizados para evitar re-renders
  const handleSelectionChanged = useMemo(() => {
    if (!onSelectionChanged) return undefined
    
    return (event: SelectionChangedEvent<TItem>) => {
      const selectedNodes = event.api?.getSelectedNodes() || []
      onSelectionChanged(selectedNodes?.[0]?.data as TItem)
    }
  }, [onSelectionChanged])

  const handleRowDoubleClicked = useMemo(() => {
    if (!onRowDoubleClicked) return undefined
    
    return (event: RowDoubleClickedEvent<TItem>) => {
      onRowDoubleClicked(event.data)
    }
  }, [onRowDoubleClicked])

  return {
    tableRef,
    data: response,
    loading,
    error,
    refetch,
    handleSelectionChanged,
    handleRowDoubleClicked,
    // Configuraciones optimizadas para AGGrid
    gridOptions: {
      suppressRowTransform: true,
      rowBuffer: 10,
      cacheBlockSize: 100,
      pagination: true,
      paginationPageSize: 50,
      paginationPageSizeSelector: [25, 50, 100, 200],
      suppressRowVirtualisation: false,
      suppressColumnVirtualisation: false,
      debounceVerticalScrollbar: true,
    }
  }
}

export default useOptimizedTable