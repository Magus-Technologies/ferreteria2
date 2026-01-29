'use client'

import { Modal } from 'antd'
import { useState } from 'react'
import ButtonBase from '~/components/buttons/button-base'
import TitleForm from '~/components/form/title-form'

interface ModalSeleccionarTipoDespachoProps {
  open: boolean
  setOpen: (open: boolean) => void
  onSelectTipo: (tipo: 'EnTienda' | 'Domicilio' | 'Parcial') => void
  ventaNumero?: string
}

export default function ModalSeleccionarTipoDespacho({
  open,
  setOpen,
  onSelectTipo,
  ventaNumero,
}: ModalSeleccionarTipoDespachoProps) {
  const [selectedTipo, setSelectedTipo] = useState<'EnTienda' | 'Domicilio' | 'Parcial' | null>(null)

  const handleConfirmar = () => {
    if (selectedTipo) {
      onSelectTipo(selectedTipo)
      setOpen(false)
      setSelectedTipo(null)
    }
  }

  const tiposDespacho = [
    {
      value: 'EnTienda' as const,
      icon: '🏪',
      title: 'Despacho en Tienda',
      subtitle: 'Entrega inmediata',
      description: 'El cliente recoge en tienda o se entrega de inmediato',
      color: 'bg-green-50 border-green-300 hover:bg-green-100',
      selectedColor: 'bg-green-100 border-green-500 ring-2 ring-green-500',
    },
    {
      value: 'Domicilio' as const,
      icon: '🚚',
      title: 'Despacho a Domicilio',
      subtitle: 'Programar entrega',
      description: 'Programar fecha, hora y chofer para entrega a domicilio',
      color: 'bg-blue-50 border-blue-300 hover:bg-blue-100',
      selectedColor: 'bg-blue-100 border-blue-500 ring-2 ring-blue-500',
    },
    {
      value: 'Parcial' as const,
      icon: '📦',
      title: 'Despacho Parcial',
      subtitle: 'Parte ahora, parte después',
      description: 'Cliente lleva algunos productos ahora, el resto se programa',
      color: 'bg-orange-50 border-orange-300 hover:bg-orange-100',
      selectedColor: 'bg-orange-100 border-orange-500 ring-2 ring-orange-500',
    },
  ]

  return (
    <Modal
      title={
        <TitleForm className="!pb-0">
          SELECCIONAR TIPO DE DESPACHO
          {ventaNumero && (
            <div className="text-sm font-normal text-gray-600 mt-1">
              Venta N° {ventaNumero}
            </div>
          )}
        </TitleForm>
      }
      open={open}
      onCancel={() => {
        setOpen(false)
        setSelectedTipo(null)
      }}
      width={700}
      centered
      footer={
        <div className="flex justify-end gap-2">
          <ButtonBase
            color="default"
            size="md"
            onClick={() => {
              setOpen(false)
              setSelectedTipo(null)
            }}
          >
            Cancelar
          </ButtonBase>
          <ButtonBase
            color="success"
            size="md"
            onClick={handleConfirmar}
            disabled={!selectedTipo}
          >
            Continuar
          </ButtonBase>
        </div>
      }
    >
      <div className="space-y-3 py-4">
        <p className="text-sm text-gray-600 mb-4">
          Selecciona cómo deseas realizar la entrega de los productos:
        </p>

        {tiposDespacho.map((tipo) => (
          <div
            key={tipo.value}
            className={`
              border-2 rounded-lg p-4 cursor-pointer transition-all
              ${selectedTipo === tipo.value ? tipo.selectedColor : tipo.color}
            `}
            onClick={() => setSelectedTipo(tipo.value)}
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl">{tipo.icon}</div>
              <div className="flex-1">
                <div className="font-semibold text-lg text-gray-900">
                  {tipo.title}
                </div>
                <div className="text-sm font-medium text-gray-600 mb-1">
                  {tipo.subtitle}
                </div>
                <div className="text-sm text-gray-500">
                  {tipo.description}
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  checked={selectedTipo === tipo.value}
                  onChange={() => setSelectedTipo(tipo.value)}
                  className="w-5 h-5 cursor-pointer"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
