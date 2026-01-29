'use client'

import { Modal, Button, Spin } from 'antd'
import { FaBoxOpen } from 'react-icons/fa'
import { classOkButtonModal } from '~/lib/clases'
import { usePaqueteForm } from './paquetes/use-paquete-form'
import FormDatosPaquete from './paquetes/form-datos-paquete'
import TableProductosPaquete from './paquetes/table-productos-paquete'
import SelectProductos from '../form/selects/select-productos'
import { useStoreProductoSeleccionadoSearch } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search'
import { useStoreAlmacen } from '~/store/store-almacen'
import { useState } from 'react'
import CardAgregarProductoPaquete from './paquetes/card-agregar-producto-paquete'

interface ModalCrearEditarPaqueteProps {
  open: boolean
  onClose: () => void
  paqueteId?: number
  onSuccess?: () => void
}

export default function ModalCrearEditarPaquete({
  open,
  onClose,
  paqueteId,
  onSuccess,
}: ModalCrearEditarPaqueteProps) {
  const {
    form,
    productos,
    isEditing,
    isLoadingPaquete,
    isPending,
    agregarProducto,
    eliminarProducto,
    actualizarUnidadDerivada,
    actualizarCantidad,
    actualizarPrecio,
    handleSubmit,
  } = usePaqueteForm(paqueteId, open, onClose, onSuccess)

  const [openModalAgregarProducto, setOpenModalAgregarProducto] = useState(false)

  const productoSeleccionado = useStoreProductoSeleccionadoSearch((store) => store.producto)
  const setProductoSeleccionado = useStoreProductoSeleccionadoSearch((store) => store.setProducto)
  const almacen_id = useStoreAlmacen((store) => store.almacen_id)

  return (
    <>
      <Modal
        open={openModalAgregarProducto}
        onCancel={() => setOpenModalAgregarProducto(false)}
        footer={null}
        title={
          <div className="text-xl font-bold text-left text-balance mb-3">
            <span className="text-slate-400 block">AGREGAR:</span>{' '}
            {productoSeleccionado?.name}
          </div>
        }
        width={typeof window !== 'undefined' && window.innerWidth >= 640 ? 300 : '95vw'}
        classNames={{ content: 'min-w-fit' }}
        destroyOnHidden
        maskClosable={false}
        keyboard={false}
      >
        <CardAgregarProductoPaquete
          setOpen={setOpenModalAgregarProducto}
          onAgregar={agregarProducto}
        />
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <FaBoxOpen className="text-cyan-600" size={20} />
            <span>{isEditing ? 'Editar Paquete' : 'Crear Paquete'}</span>
          </div>
        }
        open={open}
        onCancel={onClose}
        width={1200}
        centered
        footer={[
          <Button key="cancel" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleSubmit}
            loading={isPending}
            className={classOkButtonModal}
          >
            {isEditing ? 'Actualizar' : 'Crear'}
          </Button>,
        ]}
        destroyOnClose
      >
        {isLoadingPaquete ? (
          <div className="flex justify-center items-center py-20">
            <Spin size="large" tip="Cargando paquete..." />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sección de búsqueda de productos */}
            <div className="flex items-center gap-2">
              <SelectProductos
                allowClear
                size="large"
                className="flex-1"
                classNameIcon="text-cyan-600 mx-1"
                classIconSearch="!mb-0"
                withSearch
                withTipoBusqueda
                showUltimasCompras={false}
                selectionColor="#fb923c"
                handleOnlyOneResult={(producto) => {
                  setProductoSeleccionado(producto)
                  if (producto) setOpenModalAgregarProducto(true)
                }}
                onChange={(_, producto) => {
                  setProductoSeleccionado(producto)
                  if (producto) setOpenModalAgregarProducto(true)
                }}
                placeholder="Escaneo o digite el código o nombre del producto"
              />
            </div>

            {/* Tabla de productos */}
            <div className="min-h-[300px]">
              <TableProductosPaquete
                productos={productos}
                onEliminar={eliminarProducto}
                onUnidadDerivadaChange={actualizarUnidadDerivada}
                onCantidadChange={actualizarCantidad}
                onPrecioChange={actualizarPrecio}
              />
            </div>

            {/* Datos del paquete */}
            <FormDatosPaquete form={form} productos={productos} />
          </div>
        )}
      </Modal>
    </>
  )
}

