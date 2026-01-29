import { Modal } from 'antd'
import { EstadoDeCompra, Prisma } from '@prisma/client'
import FiltersComprasAnuladasEnEspera from '../others/filters-compras-anuladas-en-espera'
import TableComprasAnuladas from '../tables/table-compras-anuladas'
import TableComprasEnEspera from '../tables/table-compras-en-espera'
import TableDetalleDeCompraAnulada from '../tables/table-detalle-de-compra-anulada'
import TableDetalleDeCompraEnEspera from '../tables/table-detalle-de-compra-en-espera'

type ModalComprasAnuladasEnEsperaProps = {
  open: boolean
  setOpen: (open: boolean) => void
  estado_de_compra: EstadoDeCompra
  setFiltros: (data: Prisma.CompraWhereInput) => void
}

export default function ModalComprasAnuladasEnEspera({
  open,
  setOpen,
  estado_de_compra,
  setFiltros,
}: ModalComprasAnuladasEnEsperaProps) {
  return (
    <Modal
      centered
      width='fit-content'
      open={open}
      classNames={{ content: 'min-w-fit' }}
      title={`Compras ${
        estado_de_compra === EstadoDeCompra.Anulado ? 'Anuladas' : 'En Espera'
      }`}
      okText={'Seleccionar'}
      cancelText='Cerrar'
      footer={null}
      onCancel={() => {
        setOpen(false)
      }}
      maskClosable={false}
      keyboard={false}
      destroyOnHidden
    >
      <div className='flex items-center gap-2'>
        <FiltersComprasAnuladasEnEspera
          setFiltros={setFiltros}
          estado_de_compra={estado_de_compra}
        />
      </div>
      <div className='flex flex-col gap-4 h-[600px] mt-4'>
        {estado_de_compra === EstadoDeCompra.Anulado ? (
          <>
            <TableComprasAnuladas />
            <TableDetalleDeCompraAnulada />
          </>
        ) : (
          <>
            <TableComprasEnEspera />
            <TableDetalleDeCompraEnEspera />
          </>
        )}
      </div>
    </Modal>
  )
}
