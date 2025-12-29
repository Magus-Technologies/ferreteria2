'use client'

import { TipoMoneda } from '@prisma/client'
import { FormInstance, Modal } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import ButtonBase from '~/components/buttons/button-base'
import { FaPlus, FaSave } from 'react-icons/fa'
import FormMetodoPagoItem from '../form/form-metodo-pago-item'

interface MetodoDePago {
  despliegue_de_pago_id?: string
  monto?: number
}

export default function ModalMetodosPagoVenta({
  open,
  onCancel,
  form,
  totalCobrado,
  tipo_moneda,
}: {
  open: boolean
  onCancel: () => void
  form: FormInstance
  totalCobrado: number
  tipo_moneda: TipoMoneda
}) {
  const [metodosPago, setMetodosPago] = useState<MetodoDePago[]>([
    { despliegue_de_pago_id: undefined, monto: undefined },
  ])

  const [error, setError] = useState<string>('')

  // Sincronizar estado del modal con valores del formulario cuando se abre
  useEffect(() => {
    if (open) {
      const metodosExistentes = form.getFieldValue('metodos_de_pago')
      if (metodosExistentes && metodosExistentes.length > 0) {
        setMetodosPago(metodosExistentes)
      } else {
        setMetodosPago([{ despliegue_de_pago_id: undefined, monto: undefined }])
      }
      setError('')
    }
  }, [open, form])

  // Calcular total de métodos de pago
  const totalMetodosPago = useMemo(
    () =>
      metodosPago.reduce((acc, metodo) => acc + Number(metodo.monto ?? 0), 0),
    [metodosPago]
  )

  // Calcular diferencia
  const diferencia = useMemo(
    () => totalCobrado - totalMetodosPago,
    [totalCobrado, totalMetodosPago]
  )

  // Validar cuando cambian los métodos de pago
  useEffect(() => {
    if (metodosPago.length === 0) {
      setError('Debe haber al menos 1 método de pago')
      return
    }

    // Verificar que todos tengan despliegue seleccionado
    const todosTienenDespliegue = metodosPago.every(
      (m) => m.despliegue_de_pago_id
    )
    if (!todosTienenDespliegue) {
      setError(
        'Todos los métodos deben tener un despliegue de pago seleccionado'
      )
      return
    }

    // Verificar que todos tengan monto
    const todosTienenMonto = metodosPago.every((m) => m.monto && m.monto > 0)
    if (!todosTienenMonto) {
      setError('Todos los métodos deben tener un monto mayor a 0')
      return
    }

    // Verificar que la suma sea exacta
    if (Math.abs(diferencia) > 0.01) {
      setError(
        `La suma de los métodos de pago debe ser exactamente igual al Total Cobrado. Diferencia: ${diferencia.toFixed(
          2
        )}`
      )
      return
    }

    setError('')
  }, [metodosPago, diferencia])

  const handleAgregarMetodo = () => {
    setMetodosPago([
      ...metodosPago,
      { despliegue_de_pago_id: undefined, monto: undefined },
    ])
  }

  const handleEliminarMetodo = (index: number) => {
    const nuevosMetodos = metodosPago.filter((_, i) => i !== index)
    setMetodosPago(nuevosMetodos)
  }

  const handleChangeMetodo = (
    index: number,
    field: keyof MetodoDePago,
    value: string | number | undefined
  ) => {
    const nuevosMetodos = [...metodosPago]
    nuevosMetodos[index] = { ...nuevosMetodos[index], [field]: value }
    setMetodosPago(nuevosMetodos)
  }

  const handleGuardar = () => {
    if (error) return

    console.log('💾 GUARDANDO métodos de pago:', metodosPago)

    // Guardar en el formulario
    form.setFieldValue('metodos_de_pago', metodosPago)

    // Verificar que se guardó correctamente
    const valorGuardado = form.getFieldValue('metodos_de_pago')
    console.log('✅ Valor guardado en formulario:', valorGuardado)

    onCancel()
  }

  const handleCancelar = () => {
    // Resetear estado
    setMetodosPago([{ despliegue_de_pago_id: undefined, monto: undefined }])
    setError('')
    onCancel()
  }

  // Obtener despliegues ya seleccionados
  const desplieguesSeleccionados = useMemo(
    () =>
      metodosPago
        .map((m) => m.despliegue_de_pago_id)
        .filter((id) => id !== undefined) as string[],
    [metodosPago]
  )

  return (
    <Modal
      title='Métodos de Pago'
      open={open}
      onCancel={handleCancelar}
      width={700}
      footer={null}
    >
      <div className='flex flex-col gap-4'>
        <div className='flex justify-between items-center p-4 bg-slate-100 rounded-lg'>
          <div className='flex flex-col'>
            <span className='text-sm text-slate-600'>Total a Cobrar:</span>
            <span className='text-2xl font-bold text-slate-800'>
              {tipo_moneda === TipoMoneda.Soles ? 'S/.' : '$.'}{' '}
              {totalCobrado.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className='flex flex-col'>
            <span className='text-sm text-slate-600'>Total Métodos:</span>
            <span
              className={`text-2xl font-bold ${
                Math.abs(diferencia) < 0.01 ? 'text-green-600' : 'text-rose-600'
              }`}
            >
              {tipo_moneda === TipoMoneda.Soles ? 'S/.' : '$.'}{' '}
              {totalMetodosPago.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className='flex flex-col'>
            <span className='text-sm text-slate-600'>Diferencia:</span>
            <span
              className={`text-2xl font-bold ${
                Math.abs(diferencia) < 0.01 ? 'text-green-600' : 'text-rose-600'
              }`}
            >
              {tipo_moneda === TipoMoneda.Soles ? 'S/.' : '$.'}{' '}
              {diferencia.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        <div className='flex flex-col gap-2'>
          {metodosPago.map((metodo, index) => (
            <FormMetodoPagoItem
              key={index}
              index={index}
              metodo={metodo}
              onChange={handleChangeMetodo}
              onEliminar={handleEliminarMetodo}
              desplieguesExcluidos={desplieguesSeleccionados.filter(
                (id) => id !== metodo.despliegue_de_pago_id
              )}
              tipo_moneda={tipo_moneda}
              mostrarEliminar={metodosPago.length > 1}
            />
          ))}
        </div>

        <ButtonBase
          onClick={handleAgregarMetodo}
          color='info'
          className='flex items-center justify-center gap-2'
        >
          <FaPlus size={16} />
          Agregar Método de Pago
        </ButtonBase>

        {error && (
          <div className='p-3 bg-rose-100 border border-rose-300 rounded-lg text-rose-700 text-sm'>
            {error}
          </div>
        )}

        <div className='flex gap-4 justify-end mt-4'>
          <ButtonBase onClick={handleCancelar} color='default'>
            Cancelar
          </ButtonBase>
          <ButtonBase
            onClick={handleGuardar}
            color='success'
            disabled={!!error}
            className='flex items-center gap-2'
          >
            <FaSave size={16} />
            Guardar
          </ButtonBase>
        </div>
      </div>
    </Modal>
  )
}
