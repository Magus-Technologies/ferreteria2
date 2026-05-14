'use client'

import { Modal, Tag, Descriptions } from 'antd'
import { FaBuilding, FaIdCard } from 'react-icons/fa'
import type { Proveedor } from '~/lib/api/proveedor'

interface ModalDetalleProveedorProps {
  open: boolean
  setOpen: (open: boolean) => void
  proveedor: Proveedor | null
}

export default function ModalDetalleProveedor({
  open,
  setOpen,
  proveedor,
}: ModalDetalleProveedorProps) {
  if (!proveedor) return null

  const esEmpresa = proveedor.tipo_proveedor === 'empresa'

  return (
    <Modal
      title={
        <div className='flex items-center gap-2'>
          {esEmpresa
            ? <FaBuilding className='text-blue-600' size={16} />
            : <FaIdCard className='text-purple-600' size={16} />}
          <span>Detalle del Proveedor</span>
        </div>
      }
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={560}
      destroyOnHidden
    >
      <div className='flex flex-col gap-4 pt-2'>
        {/* Nombre y tipo */}
        <div className='bg-gray-50 rounded-lg px-4 py-3'>
          <div className='font-bold text-lg'>{proveedor.razon_social}</div>
          <div className='flex items-center gap-2 mt-1'>
            <Tag color={esEmpresa ? 'blue' : 'purple'}>
              {esEmpresa ? 'Empresa' : 'Persona Natural'}
            </Tag>
            <Tag color={proveedor.estado ? 'green' : 'red'}>
              {proveedor.estado ? 'Activo' : 'Inactivo'}
            </Tag>
          </div>
        </div>

        {/* Datos */}
        <Descriptions column={1} size='small' bordered>
          <Descriptions.Item label={esEmpresa ? 'RUC' : 'DNI'}>
            {proveedor.ruc ?? <span className='text-gray-400'>—</span>}
          </Descriptions.Item>
          <Descriptions.Item label='Dirección'>
            {proveedor.direccion ?? <span className='text-gray-400'>—</span>}
          </Descriptions.Item>
          <Descriptions.Item label='Teléfono'>
            {proveedor.telefono ?? <span className='text-gray-400'>—</span>}
          </Descriptions.Item>
          <Descriptions.Item label='Email'>
            {proveedor.email ?? <span className='text-gray-400'>—</span>}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </Modal>
  )
}
