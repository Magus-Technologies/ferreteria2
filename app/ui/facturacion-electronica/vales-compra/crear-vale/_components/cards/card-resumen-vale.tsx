'use client'

import { Form, FormInstance, Tag } from 'antd'
import { FormCreateVale } from '../others/body-crear-vale'
import { FaGift, FaHashtag, FaCalendar, FaPercentage, FaDollarSign } from 'react-icons/fa'
import dayjs from 'dayjs'

export default function CardResumenVale({ form }: { form: FormInstance<FormCreateVale> }) {
  const nombre = Form.useWatch('nombre', form)
  const tipoPromocion = Form.useWatch('tipo_promocion', form)
  const modalidad = Form.useWatch('modalidad', form)
  const cantidadMinima = Form.useWatch('cantidad_minima', form)
  const descuentoTipo = Form.useWatch('descuento_tipo', form)
  const descuentoValor = Form.useWatch('descuento_valor', form)
  const fechaInicio = Form.useWatch('fecha_inicio', form)
  const fechaFin = Form.useWatch('fecha_fin', form)
  const usaLimiteStock = Form.useWatch('usa_limite_stock', form)
  const stockDisponible = Form.useWatch('stock_disponible', form)

  const tipoPromocionLabels: Record<string, string> = {
    SORTEO: 'Sorteo',
    DESCUENTO_MISMA_COMPRA: 'Descuento Misma Compra',
    DESCUENTO_PROXIMA_COMPRA: 'Vale Próxima Compra',
    PRODUCTO_GRATIS: 'Producto Gratis',
  }

  const modalidadLabels: Record<string, string> = {
    CANTIDAD_MINIMA: 'Por Cantidad',
    POR_CATEGORIA: 'Por Categoría',
    POR_PRODUCTOS: 'Por Productos',
    MIXTO: 'Mixto',
  }

  return (
    <div className='bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shadow-lg p-4 sticky top-4'>
      <div className='flex items-center gap-2 mb-3'>
        <FaGift className='text-amber-600 text-lg' />
        <h3 className='text-base font-bold text-gray-800'>Resumen del Vale</h3>
      </div>

      <div className='space-y-3'>
        {/* Nombre */}
        {nombre && (
          <div>
            <p className='text-xs text-gray-500 uppercase mb-1'>Nombre</p>
            <p className='text-sm font-semibold text-gray-800'>{nombre}</p>
          </div>
        )}

        {/* Tipo de Promoción */}
        {tipoPromocion && (
          <div>
            <p className='text-xs text-gray-500 uppercase mb-1'>Tipo</p>
            <Tag color='blue' className='text-sm'>
              {tipoPromocionLabels[tipoPromocion]}
            </Tag>
          </div>
        )}

        {/* Modalidad */}
        {modalidad && (
          <div>
            <p className='text-xs text-gray-500 uppercase mb-1'>Modalidad</p>
            <Tag color='purple' className='text-sm'>
              {modalidadLabels[modalidad]}
            </Tag>
          </div>
        )}

        {/* Cantidad Mínima */}
        {cantidadMinima && (
          <div>
            <p className='text-xs text-gray-500 uppercase mb-1 flex items-center gap-1'>
              <FaHashtag className='text-blue-600' /> Cantidad Mínima
            </p>
            <p className='text-2xl font-bold text-blue-600'>{cantidadMinima}</p>
          </div>
        )}

        {/* Descuento */}
        {descuentoValor && (
          <div className='bg-green-100 rounded-lg p-2 border-2 border-green-300'>
            <p className='text-xs text-green-700 uppercase mb-0.5 flex items-center gap-1'>
              {descuentoTipo === 'PORCENTAJE' ? <FaPercentage /> : <FaDollarSign />}
              Descuento
            </p>
            <p className='text-2xl font-bold text-green-700'>
              {descuentoTipo === 'PORCENTAJE' ? `${descuentoValor}%` : `S/ ${descuentoValor}`}
            </p>
          </div>
        )}

        {/* Vigencia */}
        {fechaInicio && (
          <div>
            <p className='text-xs text-gray-500 uppercase mb-1 flex items-center gap-1'>
              <FaCalendar className='text-purple-600' /> Vigencia
            </p>
            <div className='text-sm space-y-1'>
              <p>
                <span className='font-semibold'>Desde:</span>{' '}
                {dayjs(fechaInicio).format('DD/MM/YYYY')}
              </p>
              {fechaFin ? (
                <p>
                  <span className='font-semibold'>Hasta:</span>{' '}
                  {dayjs(fechaFin).format('DD/MM/YYYY')}
                </p>
              ) : (
                <p className='text-gray-500'>Sin fecha límite</p>
              )}
            </div>
          </div>
        )}

        {/* Stock */}
        {usaLimiteStock && stockDisponible && (
          <div>
            <p className='text-xs text-gray-500 uppercase mb-1'>Stock Disponible</p>
            <p className='text-xl font-bold text-orange-600'>{stockDisponible}</p>
          </div>
        )}

        {/* Estado por defecto */}
        <div className='pt-4 border-t'>
          <p className='text-xs text-gray-500 uppercase mb-1'>Estado</p>
          <Tag color='green' className='text-sm font-semibold'>
            ACTIVO
          </Tag>
        </div>

        {/* Info adicional */}
        <div className='bg-blue-50 rounded-lg p-3 border border-blue-200'>
          <p className='text-xs text-blue-700'>
            ℹ️ El vale se activará automáticamente cuando se cumpla la cantidad mínima en una venta.
          </p>
        </div>
      </div>
    </div>
  )
}
