'use client'

import { Form } from 'antd'
import InputBase from '~/app/_components/form/inputs/input-base'
import LabelBase from '~/components/form/label-base'
import type { ProductoPaquete } from './table-productos-paquete'
import { useMemo } from 'react'

interface FormDatosPaqueteProps {
  form: any
  productos: ProductoPaquete[]
}

export default function FormDatosPaquete({ form, productos }: FormDatosPaqueteProps) {
  // Calcular totales
  const totales = useMemo(() => {
    const costoTotal = productos.reduce((sum, p) => {
      // Aquí podrías obtener el costo real del producto si lo tienes
      // Por ahora usamos 0 ya que no tenemos el costo en ProductoPaquete
      return sum + 0
    }, 0)

    const ventaTotal = productos.reduce((sum, p) => {
      const precio = p.precio_sugerido || 0
      const cantidad = p.cantidad || 0
      return sum + (precio * cantidad)
    }, 0)

    return { costoTotal, ventaTotal }
  }, [productos])

  return (
    <Form form={form} layout="vertical">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-blue-900">Datos de Paquete</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LabelBase label="Paquete Nombre:" orientation="column">
            <Form.Item
              name="nombre"
              rules={[
                { required: true, message: 'El nombre es obligatorio' },
                { max: 255, message: 'Máximo 255 caracteres' },
              ]}
              className="!mb-0"
            >
              <InputBase
                placeholder="Ej: Kit Construcción Básico"
                size="large"
                uppercase={false}
              />
            </Form.Item>
          </LabelBase>

          <LabelBase label="Costo Total:" orientation="column">
            <div className="flex items-center h-10 px-3 bg-gray-100 rounded-lg border border-gray-300">
              <span className="text-lg font-semibold text-gray-700">
                S/. {totales.costoTotal.toFixed(2)}
              </span>
            </div>
          </LabelBase>

          <LabelBase label="P.Venta Total:" orientation="column">
            <div className="flex items-center h-10 px-3 bg-green-100 rounded-lg border border-green-300">
              <span className="text-lg font-semibold text-green-700">
                S/. {totales.ventaTotal.toFixed(2)}
              </span>
            </div>
          </LabelBase>
        </div>
      </div>
    </Form>
  )
}
