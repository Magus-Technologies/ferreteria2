'use client'

import ButtonBase from '~/components/buttons/button-base'
import { Input, App } from 'antd'
import { useGetResumenGanancias } from '~/app/ui/gestion-contable-y-financiera/mis-ganancias/_hooks/use-get-ganancias'
import { useStoreFiltrosMisGanancias } from '~/app/ui/gestion-contable-y-financiera/mis-ganancias/_store/store-filtros-mis-ganancias'
import { gananciasApi } from '~/lib/api/ganancias'
import { useState } from 'react'
import { FaMoneyBillWave, FaFileInvoiceDollar } from 'react-icons/fa'
import { FaMoneyBills, FaMoneyBillTrendUp } from 'react-icons/fa6'
import { GiPayMoney, GiReceiveMoney } from 'react-icons/gi'
import { MdAnalytics } from 'react-icons/md'
import ModalPagosCompras from '../modals/modal-pagos-compras'
import ModalPerdidas from '../modals/modal-perdidas'
import ModalAnalisisPerdidasVentas from '../modals/modal-analisis-perdidas-ventas'
import ModalAnalisisPepsCompras from '../modals/modal-analisis-peps-compras'

export default function CardsInfoGanancias() {
  const { message } = App.useApp()
  const [email, setEmail] = useState('GRUPOMREDENTORISA@GMAIL.COM')
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingPrint, setLoadingPrint] = useState(false)
  const [modalPagosOpen, setModalPagosOpen] = useState(false)
  const [modalPerdidasOpen, setModalPerdidasOpen] = useState(false)
  const [modalAnalisisPerdidasOpen, setModalAnalisisPerdidasOpen] = useState(false)
  const [modalPepsOpen, setModalPepsOpen] = useState(false)
  
  const filtros = useStoreFiltrosMisGanancias((state) => state.filtros)
  const { data, isLoading } = useGetResumenGanancias(filtros)
  
  const resumen = data?.data?.data || {
    ventas: 0,
    costo: 0,
    ganancia: 0,
    gastos_u: 0,
    neto: 0,
    perdida: 0
  }

  const handleEnviarCorreo = async () => {
    if (!email.trim()) {
      message.error('Por favor ingrese un correo electrónico')
      return
    }

    setLoadingEmail(true)
    try {
      const response = await gananciasApi.enviarCorreo(email, filtros)
      if (response.data) {
        message.success(response.data.message)
      } else if (response.error) {
        message.error(response.error.message || 'Error al enviar el correo')
      }
    } catch (error) {
      message.error('Error al enviar el correo')
    } finally {
      setLoadingEmail(false)
    }
  }

  const handleImprimir = async () => {
    setLoadingPrint(true)
    try {
      const response = await gananciasApi.exportar({ ...filtros, formato: 'pdf' })
      if (response.data) {
        // Abrir el PDF en una nueva ventana
        window.open(response.data.data.url, '_blank')
        message.success('Reporte generado exitosamente')
      } else if (response.error) {
        message.error(response.error.message || 'Error al generar el reporte')
      }
    } catch (error) {
      message.error('Error al generar el reporte')
    } finally {
      setLoadingPrint(false)
    }
  }
  return (
    <div className='flex flex-col gap-4 h-full'>
      {/* Ventas */}
      <div className='bg-white border border-slate-200 rounded-lg p-3'>
        <div className='flex items-center justify-center gap-1 mb-0.5'>
          <FaMoneyBillWave className='text-blue-600' size={12} />
          <div className='text-[11px] text-slate-600 font-medium'>Ventas</div>
        </div>
        <div className='text-base font-bold text-blue-600 text-center'>
          {isLoading ? '...' : resumen.ventas.toFixed(2)}
        </div>
      </div>

      {/* Costo */}
      <div className='bg-white border border-slate-200 rounded-lg p-3'>
        <div className='flex items-center justify-center gap-1 mb-0.5'>
          <GiPayMoney className='text-orange-600' size={12} />
          <div className='text-[11px] text-slate-600 font-medium'>Costo</div>
        </div>
        <div className='text-base font-bold text-orange-600 text-center'>
          {isLoading ? '...' : resumen.costo.toFixed(2)}
        </div>
      </div>

      {/* Ganancia */}
      <div className='bg-white border border-slate-200 rounded-lg p-2'>
        <div className='flex items-center justify-center gap-1 mb-0.5'>
          <FaMoneyBillTrendUp className='text-green-600' size={12} />
          <div className='text-[11px] text-slate-600 font-medium'>Ganancia</div>
        </div>
        <div className='text-base font-bold text-green-600 text-center'>
          {isLoading ? '...' : resumen.ganancia.toFixed(2)}
        </div>
      </div>

      {/* Gastos U */}
      <div 
        className='bg-white border border-slate-200 rounded-lg p-2 cursor-pointer hover:border-slate-400 transition-colors relative group'
        onClick={() => setModalPagosOpen(true)}
      >
        <div className='absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-slate-400 font-medium'>
          Ver detalles
        </div>
        <div className='flex items-center justify-center gap-1 mb-0.5'>
          <FaFileInvoiceDollar className='text-slate-600' size={12} />
          <div className='text-[11px] text-slate-600 font-medium'>Gastos U</div>
        </div>
        <div className='text-base font-bold text-slate-600 text-center'>
          {isLoading ? '...' : resumen.gastos_u.toFixed(2)}
        </div>
      </div>

      <ModalPagosCompras 
        open={modalPagosOpen} 
        onClose={() => setModalPagosOpen(false)} 
        filtros={filtros}
      />

      {/* Neto */}
      <div className='bg-white border border-slate-200 rounded-lg p-2'>
        <div className='flex items-center justify-center gap-1 mb-0.5'>
          <FaMoneyBills className='text-cyan-600' size={12} />
          <div className='text-[11px] text-slate-600 font-medium'>Neto</div>
        </div>
        <div className='text-base font-bold text-cyan-600 text-center'>
          {isLoading ? '...' : resumen.neto.toFixed(2)}
        </div>
      </div>

      {/* Perdida */}
      <div 
        className='bg-white border border-slate-200 rounded-lg p-2 cursor-pointer hover:border-red-300 transition-colors relative group'
        onClick={() => setModalPerdidasOpen(true)}
      >
        <div className='absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-red-400 font-medium'>
          Ver detalles
        </div>
        <div className='flex items-center justify-center gap-1 mb-0.5'>
          <GiReceiveMoney className='text-red-600' size={12} />
          <div className='text-[11px] text-slate-600 font-medium'>Perdida</div>
        </div>
        <div className='text-base font-bold text-red-600 text-center'>
          {isLoading ? '...' : resumen.perdida.toFixed(2)}
        </div>
      </div>

      <ModalPerdidas 
        open={modalPerdidasOpen} 
        onClose={() => setModalPerdidasOpen(false)} 
        filtros={filtros}
      />

      {/* Análisis de Pérdidas en Ventas */}
      <div 
        className='bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-2 cursor-pointer hover:border-red-400 transition-all relative group shadow-sm'
        onClick={() => setModalAnalisisPerdidasOpen(true)}
      >
        <div className='absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-red-500 font-bold'>
          ANALIZAR
        </div>
        <div className='flex items-center justify-center gap-1 mb-0.5'>
          <MdAnalytics className='text-red-600' size={12} />
          <div className='text-[10px] text-red-700 font-bold text-center'>Análisis Pérdidas</div>
        </div>
        <div className='text-[8px] text-red-600 text-center font-medium'>
          Click para ver detalles
        </div>
      </div>

      <ModalAnalisisPerdidasVentas
        open={modalAnalisisPerdidasOpen}
        onClose={() => setModalAnalisisPerdidasOpen(false)}
        filtros={filtros}
      />

      {/* Análisis PEPS - Diferencia de Cambio */}
      <div
        className='bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-2 cursor-pointer hover:border-blue-400 transition-all relative group shadow-sm'
        onClick={() => setModalPepsOpen(true)}
      >
        <div className='absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] text-blue-500 font-bold'>
          CALCULAR
        </div>
        <div className='flex items-center justify-center gap-1 mb-0.5'>
          <MdAnalytics className='text-blue-600' size={12} />
          <div className='text-[10px] text-blue-700 font-bold text-center'>PEPS + Cambio</div>
        </div>
        <div className='text-[8px] text-blue-600 text-center font-medium'>
          Diferencia de tipo de cambio
        </div>
      </div>

      <ModalAnalisisPepsCompras
        open={modalPepsOpen}
        onClose={() => setModalPepsOpen(false)}
        filtros={filtros}
      />

      {/* Correo electrónico */}
      <div className='bg-white border border-slate-200 rounded-lg p-2'>
        <div className='text-[10px] text-slate-600 mb-1.5 font-medium text-center'>Correo Destino</div>
        <Input
          placeholder='correo@ejemplo.com'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className='mb-1.5'
          size='small'
        />
        <div className='flex flex-col gap-1'>
          <ButtonBase
            color='default'
            size='sm'
            type='button'
            onClick={handleImprimir}
            disabled={loadingPrint}
            className='w-full text-[11px]'
          >
            {loadingPrint ? 'Imprimiendo...' : 'Imprimir'}
          </ButtonBase>
          <ButtonBase
            color='default'
            size='sm'
            type='button'
            onClick={handleEnviarCorreo}
            disabled={loadingEmail}
            className='w-full text-[11px]'
          >
            {loadingEmail ? 'Enviando...' : 'Enviar a Correo'}
          </ButtonBase>
        </div>
      </div>
    </div>
  )
}
