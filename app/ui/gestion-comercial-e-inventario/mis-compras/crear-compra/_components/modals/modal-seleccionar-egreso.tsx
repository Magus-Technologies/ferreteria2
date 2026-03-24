'use client'

import { Modal } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { apiRequest } from '~/lib/api'
import { GastoExtraDisponible } from '~/app/_components/form/selects/select-egresos-dinero'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useDebounce } from 'use-debounce'
import InputBase from '~/app/_components/form/inputs/input-base'
import TableWithTitle from '~/components/tables/table-with-title'
import { ColDef } from 'ag-grid-community'
import { classOkButtonModal } from '~/lib/clases'
import { greenColors } from '~/lib/colors'
import { GiPayMoney } from 'react-icons/gi'

interface ModalSeleccionarEgresoProps {
  open: boolean
  onClose: () => void
  excluirCompraId?: string
  onSelect: (gasto: GastoExtraDisponible) => void
}

const colDefs: ColDef<GastoExtraDisponible>[] = [
  {
    headerName: 'Fecha',
    field: 'created_at',
    width: 100,
    valueFormatter: ({ value }) => (value ? dayjs(value).format('DD/MM/YY') : ''),
  },
  {
    headerName: 'Concepto',
    field: 'concepto',
    flex: 1,
    minWidth: 200,
  },
  {
    headerName: 'Monto',
    field: 'monto',
    width: 120,
    type: 'numericColumn',
    valueFormatter: ({ value }) => (value != null ? `S/. ${Number(value).toFixed(2)}` : ''),
  },
  {
    headerName: 'Método de Pago',
    valueGetter: ({ data }) => data?.despliegue_pago?.metodo_de_pago?.name ?? '—',
    width: 140,
  },
  {
    headerName: 'Registrado por',
    valueGetter: ({ data }) => data?.user?.name ?? '—',
    width: 150,
  },
]

export default function ModalSeleccionarEgreso({
  open,
  onClose,
  excluirCompraId,
  onSelect,
}: ModalSeleccionarEgresoProps) {
  const [busqueda, setBusqueda] = useState('')
  const [gastoSeleccionado, setGastoSeleccionado] = useState<GastoExtraDisponible | undefined>()
  const [textoBusqueda] = useDebounce(busqueda, 500)

  const { data = [], isLoading } = useQuery({
    queryKey: [QueryKeys.EGRESOS_DINERO, excluirCompraId],
    queryFn: async () => {
      const response = await apiRequest<{ success: boolean; data: GastoExtraDisponible[] }>(
        '/gastos-extras/disponibles',
        { params: excluirCompraId ? { excluir_compra_id: excluirCompraId } : undefined }
      )
      return response.data?.data || []
    },
    enabled: open,
    staleTime: 0,
    retry: false,
    throwOnError: false,
  })

  const rowData = useMemo(() => {
    if (!textoBusqueda) return data
    return data.filter(item =>
      item.concepto.toLowerCase().includes(textoBusqueda.toLowerCase())
    )
  }, [data, textoBusqueda])

  const handleOk = () => {
    if (!gastoSeleccionado) return
    onSelect(gastoSeleccionado)
    handleClose()
  }

  const handleClose = () => {
    setBusqueda('')
    setGastoSeleccionado(undefined)
    onClose()
  }

  return (
    <Modal
      centered
      width='fit-content'
      open={open}
      classNames={{ content: 'min-w-fit' }}
      title={
        <span className='flex items-center gap-2'>
          <GiPayMoney className='text-cyan-600' size={18} />
          Seleccionar Egreso Asociado
        </span>
      }
      okText='Seleccionar'
      cancelText='Cerrar'
      cancelButtonProps={{ className: 'rounded-xl' }}
      okButtonProps={{
        className: classOkButtonModal,
        disabled: !gastoSeleccionado,
      }}
      onOk={handleOk}
      onCancel={handleClose}
      maskClosable={false}
      keyboard={false}
      destroyOnHidden
    >
      <div className='flex items-center gap-2'>
        <InputBase
          placeholder='Buscar por concepto...'
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          uppercase={false}
          className='max-w-[400px]'
          allowClear
        />
      </div>
      <div className='h-[450px] min-w-[650px] w-full mt-4'>
        <TableWithTitle<GastoExtraDisponible>
          id='mis-compras.modal-seleccionar-egreso'
          title='Gastos Operativos Disponibles'
          exportExcel={false}
          exportPdf={false}
          selectColumns={false}
          rowData={rowData}
          columnDefs={colDefs}
          loading={isLoading}
          selectionColor={greenColors[10]}
          isVisible={open}
          onSelectionChanged={({ selectedNodes }) => {
            setGastoSeleccionado(selectedNodes?.[0]?.data)
          }}
          onRowDoubleClicked={({ data: gasto }) => {
            if (!gasto) return
            onSelect(gasto)
            handleClose()
          }}
        />
      </div>
    </Modal>
  )
}
