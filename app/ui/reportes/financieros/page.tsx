'use client'

import { useState } from 'react'
import { FaBuilding, FaArrowCircleRight, FaArrowCircleLeft } from 'react-icons/fa'
import { Select, Progress } from 'antd'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'

const ingresos = [
  { categoria: 'SERVICIOS', tipo: 'VENTA', monto: 10348.00, porcentaje: 53.47 },
  { categoria: 'PRODUCTOS', tipo: 'VENTA', monto: 8089.00, porcentaje: 41.80 },
  { categoria: 'PRODUCTO', tipo: 'VENTA', monto: 822.00, porcentaje: 4.25 },
  { categoria: 'OTROS', tipo: 'VENTA', monto: 94.00, porcentaje: 0.48 },
]

const gastos = [
  { categoria: 'COMPRA DE ADORNOS', tipo: 'EXTRAS', monto: 1000.00, porcentaje: 31.09 },
  { categoria: 'ADELANTO DE SUELDOS', tipo: 'EXTRAS', monto: 1000.00, porcentaje: 31.09 },
  { categoria: 'COMPRAS DE MERCADERIA', tipo: 'COMPRA', monto: 716.00, porcentaje: 22.27 },
  { categoria: '65 - TRANSPORTE', tipo: 'EXTRAS', monto: 500.00, porcentaje: 15.55 },
]

export default function ReporteFinancierosPage() {
  const canAccess = usePermission(permissions.REPORTES_FINANCIEROS_INDEX)
  const [periodo, setPeriodo] = useState('anio_actual')

  if (!canAccess) return <NoAutorizado />

  const totalIngresos = ingresos.reduce((sum, i) => sum + i.monto, 0)
  const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0)

  return (
    <ContenedorGeneral>
      <TituloModulos
        title="Administrativos"
        icon={<FaBuilding className="text-teal-600" />}
      >
        <div className='flex items-center gap-2'>
          <span className='text-xs text-slate-500'>Seleccionar periodo:</span>
          <Select
            value={periodo}
            onChange={setPeriodo}
            size='small'
            style={{ width: 140 }}
            options={[
              { value: 'anio_actual', label: 'Ano Actual' },
              { value: 'mes_actual', label: 'Mes Actual' },
              { value: 'semana_actual', label: 'Semana Actual' },
            ]}
          />
        </div>
      </TituloModulos>

      {/* Datos Generales */}
      <div className='mt-4 w-full'>
        <h3 className='font-bold text-slate-700 text-sm uppercase'>Datos Generales</h3>
        <p className='text-xs text-slate-400 mb-4'>Detalle de Ingresos y Gastos en Ano Actual</p>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
          {/* Cuentas por Pagar / Cobrar */}
          <div className='flex flex-col gap-4'>
            <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-center'>
              <div className='text-3xl font-bold text-slate-700'>
                S/. {totalGastos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </div>
              <div className='mt-3 bg-teal-600 text-white text-xs font-medium py-2 px-3 rounded'>
                Cuentas por Pagar
              </div>
              <p className='text-xs text-slate-400 mt-1'>Total de compras pendientes de pago y gastos provisionados</p>
            </div>
            <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-center'>
              <div className='text-3xl font-bold text-slate-700'>
                S/. {totalIngresos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </div>
              <div className='mt-3 bg-teal-600 text-white text-xs font-medium py-2 px-3 rounded'>
                Cuentas por Cobrar
              </div>
              <p className='text-xs text-slate-400 mt-1'>Total de ventas pendientes de cobro e ingresos provisionados</p>
            </div>
          </div>

          {/* Detalle de Ingresos */}
          <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-4'>
            <h4 className='font-semibold text-slate-700 text-sm mb-3'>Detalle de Ingresos</h4>
            <div className='flex flex-col gap-3'>
              {ingresos.map((item, i) => (
                <div key={i} className='flex items-center gap-3'>
                  <FaArrowCircleRight className='text-teal-500 flex-shrink-0' size={20} />
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-semibold text-slate-700 truncate'>{item.categoria}</span>
                      <span className='text-sm font-bold text-slate-700 ml-2'>S/. {item.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs text-slate-400'>{item.tipo}</span>
                      <span className='text-xs text-slate-400'>{item.porcentaje}%</span>
                    </div>
                    <Progress percent={item.porcentaje} showInfo={false} size='small' strokeColor='#14b8a6' />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detalle de Gastos */}
          <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-4'>
            <h4 className='font-semibold text-slate-700 text-sm mb-3'>Detalle de Gastos</h4>
            <div className='flex flex-col gap-3'>
              {gastos.map((item, i) => (
                <div key={i} className='flex items-center gap-3'>
                  <FaArrowCircleLeft className='text-teal-500 flex-shrink-0' size={20} />
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-semibold text-slate-700 truncate'>{item.categoria}</span>
                      <span className='text-sm font-bold text-slate-700 ml-2'>S/. {item.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs text-slate-400'>{item.tipo}</span>
                      <span className='text-xs text-slate-400'>{item.porcentaje}%</span>
                    </div>
                    <Progress percent={item.porcentaje} showInfo={false} size='small' strokeColor='#14b8a6' />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ContenedorGeneral>
  )
}
