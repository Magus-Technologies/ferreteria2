'use client'

import { useMemo } from 'react'
import TableBase from '~/components/tables/table-base'
import { useColumnsGuias } from './columns-mis-guias'
import { useStoreFiltrosMisGuias } from '../../_store/store-filtros-mis-guias'
import { toUTCBD } from '~/utils/fechas'

// TODO: Reemplazar con hook real cuando esté disponible
function useGetGuias() {
  const filtros = useStoreFiltrosMisGuias((store) => store.filtros)
  
  // Datos de ejemplo
  const data = useMemo(() => [], [])
  
  return {
    data,
    isLoading: false,
    isError: false,
  }
}

export default function TableMisGuias() {
  const { data, isLoading } = useGetGuias()

  return (
    <TableBase
      className='h-[400px] md:h-[500px]'
      rowSelection={false}
      rowData={data || []}
      columnDefs={useColumnsGuias()}
      loading={isLoading}
    />
  )
}
