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
  const totales = useMemo(() => {
    const costoTotal = productos.reduce((sum, p) => {
      const costo = p.costo || 0
      const cantidad = p.cantidad || 0
      return sum + (costo * cantidad)
    }, 0)

    const ventaPublico = productos.reduce((sum, p) => {
      return sum + (Number(p.precio_publico || 0) * (p.cantidad || 0))
    }, 0)

    const ventaEspecial = productos.reduce((sum, p) => {
      return sum + (Number(p.precio_especial || 0) * (p.cantidad || 0))
    }, 0)

    const ventaMinimo = productos.reduce((sum, p) => {
      return sum + (Number(p.precio_minimo || 0) * (p.cantidad || 0))
    }, 0)

    const ventaUltimo = productos.reduce((sum, p) => {
      return sum + (Number(p.precio_ultimo || 0) * (p.cantidad || 0))
    }, 0)

    return { costoTotal, ventaPublico, ventaEspecial, ventaMinimo, ventaUltimo }
  }, [productos])

  return (
    <Form form={form} layout="vertical">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-blue-900">Datos de Paquete</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <LabelBase label="Total P. Público:" orientation="column">
            <div className="flex items-center h-10 px-3 bg-green-100 rounded-lg border border-green-300">
              <span className="text-base font-semibold text-green-700">
                S/. {totales.ventaPublico.toFixed(2)}
              </span>
            </div>
          </LabelBase>

          <LabelBase label="Total P. Especial:" orientation="column">
            <div className="flex items-center h-10 px-3 bg-blue-100 rounded-lg border border-blue-300">
              <span className="text-base font-semibold text-blue-700">
                S/. {totales.ventaEspecial.toFixed(2)}
              </span>
            </div>
          </LabelBase>

          <LabelBase label="Total P. Mínimo:" orientation="column">
            <div className="flex items-center h-10 px-3 bg-amber-100 rounded-lg border border-amber-300">
              <span className="text-base font-semibold text-amber-700">
                S/. {totales.ventaMinimo.toFixed(2)}
              </span>
            </div>
          </LabelBase>

          <LabelBase label="Total P. Último:" orientation="column">
            <div className="flex items-center h-10 px-3 bg-purple-100 rounded-lg border border-purple-300">
              <span className="text-base font-semibold text-purple-700">
                S/. {totales.ventaUltimo.toFixed(2)}
              </span>
            </div>
          </LabelBase>
        </div>
      </div>
    </Form>
  )
}
