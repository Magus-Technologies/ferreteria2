'use client'

import { Select } from 'antd'
import { FormInstance } from 'antd/es/form'

interface FormDespachoEnTiendaProps {
  form: FormInstance
}

export default function FormDespachoEnTienda({ form }: FormDespachoEnTiendaProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        ¿Quién entrega? <span className="text-red-500">*</span>
      </label>
      <Select
        placeholder="Seleccionar"
        value={form.getFieldValue('quien_entrega')}
        onChange={(value) => form.setFieldValue('quien_entrega', value)}
        options={[
          { value: 'vendedor', label: '👤 Vendedor' },
          { value: 'almacen', label: '📦 Almacén' },
        ]}
        className="w-full"
      />
    </div>
  )
}
