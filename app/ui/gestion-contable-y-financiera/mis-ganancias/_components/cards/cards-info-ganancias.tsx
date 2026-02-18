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

export default function CardsInfoGanancias() {
  const { message } = App.useApp()
  const [email, setEmail] = useState('GRUPOMREDENTORISA@GMAIL.COM')
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingPrint, setLoadingPrint] = useState(false)
  
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
    <div className='flex flex-col gap-3 h-full'>
      {/* Ventas */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaMoneyBillWave className='text-blue-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Ventas</div>
        </div>
        <div className='text-2xl font-bold text-blue-600 text-center'>
          {isLoading ? '...' : resumen.ventas.toFixed(2)}
        </div>
      </div>

      {/* Costo */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <GiPayMoney className='text-orange-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Costo</div>
        </div>
        <div className='text-2xl font-bold text-orange-600 text-center'>
          {isLoading ? '...' : resumen.costo.toFixed(2)}
        </div>
      </div>

      {/* Ganancia */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaMoneyBillTrendUp className='text-green-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Ganancia</div>
        </div>
        <div className='text-2xl font-bold text-green-600 text-center'>
          {isLoading ? '...' : resumen.ganancia.toFixed(2)}
        </div>
      </div>

      {/* Gastos U */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaFileInvoiceDollar className='text-slate-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Gastos U</div>
        </div>
        <div className='text-2xl font-bold text-slate-600 text-center'>
          {isLoading ? '...' : resumen.gastos_u.toFixed(2)}
        </div>
      </div>

      {/* Neto */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaMoneyBills className='text-cyan-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Neto</div>
        </div>
        <div className='text-2xl font-bold text-cyan-600 text-center'>
          {isLoading ? '...' : resumen.neto.toFixed(2)}
        </div>
      </div>

      {/* Perdida */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <GiReceiveMoney className='text-red-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Perdida</div>
        </div>
        <div className='text-2xl font-bold text-red-600 text-center'>
          {isLoading ? '...' : resumen.perdida.toFixed(2)}
        </div>
      </div>

      {/* Correo electrónico */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='text-sm text-slate-600 mb-2 font-medium text-center'>Correo electrónico Destino</div>
        <Input
          placeholder='correo@ejemplo.com'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className='mb-3'
        />
        <div className='flex flex-col gap-2'>
          <ButtonBase
            color='default'
            size='sm'
            type='button'
            onClick={handleImprimir}
            disabled={loadingPrint}
            className='w-full'
          >
            {loadingPrint ? 'Imprimiendo...' : 'Imprimir'}
          </ButtonBase>
          <ButtonBase
            color='default'
            size='sm'
            type='button'
            onClick={handleEnviarCorreo}
            disabled={loadingEmail}
            className='w-full'
          >
            {loadingEmail ? 'Enviando...' : 'Enviar a Correo'}
          </ButtonBase>
        </div>
      </div>
    </div>
  )
}
