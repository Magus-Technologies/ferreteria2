'use client'

import { Modal } from 'antd'
import { FaLock } from 'react-icons/fa'
import ButtonBase from '~/components/buttons/button-base'

const ACCION_LABELS: Record<string, string> = {
  crear: 'Crear',
  editar: 'Editar',
  eliminar: 'Eliminar',
}

const MODULO_LABELS: Record<string, string> = {
  productos: 'Productos',
  clientes: 'Clientes',
  proveedores: 'Proveedores',
  ventas: 'Ventas',
  cotizaciones: 'Cotizaciones',
  compras: 'Compras',
  'vales-compra': 'Vales de Compra',
  prestamos: 'Préstamos',
  guias: 'Guías de Remisión',
  entregas: 'Entregas',
  categorias: 'Categorías',
  marcas: 'Marcas',
  caja: 'Caja',
}

interface ModalSolicitarAutorizacionProps {
  open: boolean
  onClose: () => void
  modulo: string
  accion: 'crear' | 'editar' | 'eliminar'
  descripcion: string
  onSolicitar: () => Promise<void>
  solicitando: boolean
}

export default function ModalSolicitarAutorizacion({
  open,
  onClose,
  modulo,
  accion,
  descripcion,
  onSolicitar,
  solicitando,
}: ModalSolicitarAutorizacionProps) {
  const handleSolicitar = async () => {
    await onSolicitar()
    onClose()
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={420}
      destroyOnHidden
    >
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaLock className="text-amber-600 text-2xl" />
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-2">
          Autorización Requerida
        </h3>

        <p className="text-gray-500 text-sm mb-4">
          No tienes permiso para <strong>{ACCION_LABELS[accion]?.toLowerCase()}</strong> en{' '}
          <strong>{MODULO_LABELS[modulo] || modulo}</strong>.
          Debes solicitar autorización a un administrador.
        </p>

        <div className="bg-gray-50 rounded-lg p-3 mb-5 text-left">
          <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Detalle</div>
          <div className="text-sm text-gray-700">{descripcion}</div>
        </div>

        <div className="flex gap-3">
          <ButtonBase
            color="default"
            size="md"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </ButtonBase>
          <ButtonBase
            color="warning"
            size="md"
            onClick={handleSolicitar}
            loading={solicitando}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <FaLock size={12} />
            Solicitar Autorización
          </ButtonBase>
        </div>
      </div>
    </Modal>
  )
}
