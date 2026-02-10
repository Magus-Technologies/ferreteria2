'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useEffect, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { useStoreRecepcionAlmacenSeleccionada } from '../../_store/store-recepcion-almacen-seleccionado'
import { useStoreFiltrosMisRecepciones } from '../../_store/store-filtros-mis-recepciones'
import { useColumnsRecepcionesAlmacen } from './columns-recepciones-almacen'
import ModalDocRecepcionAlmacen from '../modals/modal-doc-recepcion-almacen'
import { greenColors } from '~/lib/colors'
import { useQuery } from '@tanstack/react-query'
import { recepcionAlmacenApi, type RecepcionAlmacenResponse } from '~/lib/api/recepcion-almacen'
import { App } from 'antd'


export default function TableRecepcionesAlmacen() {
  const tableRef = useRef<AgGridReact>(null)
  const { notification } = App.useApp()

  const [primera_vez, setPrimeraVez] = useState(true)

  const setRecepcionAlmacenSeleccionada = useStoreRecepcionAlmacenSeleccionada(
    store => store.setRecepcionAlmacen
  )

  const filtros = useStoreFiltrosMisRecepciones(state => state.filtros)

  const { data, refetch, isPending, isFetching } = useQuery({
    queryKey: [QueryKeys.RECEPCIONES_ALMACEN],
    queryFn: async () => {
      const res = await recepcionAlmacenApi.list(filtros)
      if (res.error) {
        notification.error({
          message: 'Error',
          description: res.error.message,
        })
        return []
      }
      return res.data?.data ?? []
    },
    enabled: !!filtros,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const response = data ?? []
  const loading = isPending || isFetching

  useEffect(() => {
    if (!loading && filtros) setPrimeraVez(false)
  }, [loading, filtros])

  useEffect(() => {
    if (!primera_vez) refetch()
  }, [filtros, refetch, primera_vez])

  const [openModalDocRecepcionAlmacen, setOpenModalDocRecepcionAlmacen] =
    useState(false)
  const [dataModalDocRecepcionAlmacen, setDataModalDocRecepcionAlmacen] =
    useState<RecepcionAlmacenResponse>()

  return (
    <>
      <ModalDocRecepcionAlmacen
        open={openModalDocRecepcionAlmacen}
        setOpen={setOpenModalDocRecepcionAlmacen}
        data={dataModalDocRecepcionAlmacen}
      />
      <TableWithTitle<RecepcionAlmacenResponse>
        id='g-c-e-i.mis-recepciones.recepciones-almacen'
        selectionColor={greenColors[10]}
        onSelectionChanged={({ selectedNodes }) =>
          setRecepcionAlmacenSeleccionada(
            selectedNodes?.[0]?.data as RecepcionAlmacenResponse
          )
        }
        tableRef={tableRef}
        title='Recepciones de Almacén'
        loading={loading}
        columnDefs={useColumnsRecepcionesAlmacen({
          setDataModalDocRecepcionAlmacen,
          setOpenModalDocRecepcionAlmacen,
        })}
        rowData={response}
        optionsSelectColumns={[
          {
            label: 'Default',
            columns: [
              '#',
              'N° Documento',
              'Fecha',
              'Registrador',
              'Proveedor',
              'Compra',
              'Activo',
              'Acciones',
            ],
          },
        ]}
      />
    </>
  )
}
