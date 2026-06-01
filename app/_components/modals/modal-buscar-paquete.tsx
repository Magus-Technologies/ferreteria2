'use client'

import { Modal, ModalProps } from 'antd'
import { classOkButtonModal } from '~/lib/clases'
import InputBase from '../form/inputs/input-base'
import TablePaquetesBusqueda from '~/app/ui/facturacion-electronica/mis-ventas/_components/tables/table-paquetes-busqueda'
import { useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { useStorePaqueteSeleccionado } from '~/app/ui/facturacion-electronica/mis-ventas/store/store-paquete-seleccionado'
import type { Paquete, PaqueteProducto } from '~/lib/api/paquete'
import ButtonCreatePaquete from '../form/buttons/button-create-paquete'
import TableWithTitle from '~/components/tables/table-with-title'
import { ColDef } from 'ag-grid-community'
import { orangeColors } from '~/lib/colors'

function TableDetallePaquete({ productos }: { productos: PaqueteProducto[] }) {
  const columnDefs: ColDef<PaqueteProducto>[] = [
    {
      headerName: 'Código',
      colId: 'codigo',
      width: 90,
      valueGetter: (params) => params.data?.producto?.cod_producto || '-',
    },
    {
      headerName: 'Producto',
      colId: 'producto',
      flex: 2,
      cellClass: 'font-medium',
      valueGetter: (params) => params.data?.producto?.name || '-',
    },
    {
      headerName: 'Marca',
      colId: 'marca',
      width: 100,
      valueGetter: (params) => params.data?.producto?.marca?.name || '-',
    },
    {
      headerName: 'U. Derivada',
      colId: 'unidad_derivada',
      width: 110,
      valueGetter: (params) => params.data?.unidad_derivada?.name || '-',
    },
    {
      headerName: 'Cantidad',
      field: 'cantidad',
      width: 90,
      cellClass: 'text-right',
    },
    {
      headerName: 'Precio',
      colId: 'precio_final',
      width: 110,
      cellClass: 'text-right font-semibold',
      valueGetter: (params) => {
        if (!params.data) return 0
        const tipo = params.data.tipo_precio
        const campo = `precio_${tipo}` as keyof PaqueteProducto
        const precio = Number(params.data[campo] ?? 0)
        const descCampo = `descuento_${tipo}` as keyof PaqueteProducto
        const desc = Number(params.data[descCampo] ?? 0)
        return Math.max(0, precio - desc)
      },
      valueFormatter: (params) => `S/. ${Number(params.value || 0).toFixed(2)}`,
    },
  ]

  return (
    <TableWithTitle<PaqueteProducto>
      id="paquetes.detalle-busqueda"
      title="Detalle del Paquete"
      selectionColor={orangeColors[10]}
      columnDefs={columnDefs}
      rowData={productos}
      getRowId={(params) => String(params.data.id)}
      pagination={false}
      overlayNoRowsTemplate='<span class="text-gray-500">Selecciona un paquete para ver sus productos</span>'
      optionsSelectColumns={[
        {
          label: 'Default',
          columns: ['Código', 'Producto', 'Marca', 'U. Derivada', 'Cantidad', 'Precio'],
        },
      ]}
    />
  )
}

type ModalBuscarPaqueteProps = {
  open: boolean
  setOpen: (open: boolean) => void
  onOk: ModalProps['onOk']
  textDefault: string
  onRowDoubleClicked?: ({
    data,
  }: {
    data: Paquete | undefined
  }) => void
  rowDataOverride?: Paquete[]
}

export default function ModalBuscarPaquete({
  open,
  setOpen,
  onOk,
  textDefault,
  onRowDoubleClicked,
  rowDataOverride,
}: ModalBuscarPaqueteProps) {
  const [text, setText] = useState(textDefault)
  const [paqueteDetalle, setPaqueteDetalle] = useState<Paquete | undefined>(undefined)

  useEffect(() => {
    setText(textDefault)
  }, [textDefault])

  const [value] = useDebounce(text, 500)

  const setPaqueteSeleccionadoStore = useStorePaqueteSeleccionado(
    store => store.setPaquete
  )

  useEffect(() => {
    if (open) {
      setPaqueteSeleccionadoStore(undefined)
      setPaqueteDetalle(undefined)
    }
  }, [open, setPaqueteSeleccionadoStore])

  return (
    <Modal
      centered
      width='fit-content'
      open={open}
      classNames={{ content: 'min-w-fit' }}
      title={'Buscar Paquete'}
      okText={'Seleccionar'}
      onOk={onOk}
      cancelText='Cerrar'
      cancelButtonProps={{ className: 'rounded-xl' }}
      okButtonProps={{
        className: classOkButtonModal,
      }}
      onCancel={() => {
        setOpen(false)
        setText('')
      }}
      maskClosable={false}
      keyboard={false}
      destroyOnHidden
    >
      <div className='space-y-3 mt-4'>
        <div className='flex items-center gap-2'>
          <InputBase
            placeholder='Buscar por nombre o descripción...'
            value={text}
            onChange={e => setText(e.target.value)}
            className='max-w-[500px]'
          />
          <ButtonCreatePaquete className='mb-0!' />
        </div>

        <div className='h-[320px] min-w-[1000px] w-full'>
          <TablePaquetesBusqueda
            value={value}
            onRowDoubleClicked={onRowDoubleClicked}
            rowDataOverride={rowDataOverride}
            onPaqueteSeleccionado={(paquete) => {
              setPaqueteSeleccionadoStore(paquete)
              setPaqueteDetalle(paquete)
            }}
          />
        </div>

        <div className="h-[200px]">
          <TableDetallePaquete productos={paqueteDetalle?.productos || []} />
        </div>
      </div>
    </Modal>
  )
}
