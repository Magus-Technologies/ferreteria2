'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Modal, Input, Form, FormInstance, message } from 'antd'
import { FaTruck, FaPlus, FaSearch } from 'react-icons/fa'
import { IoClose } from 'react-icons/io5'
import { vehiculosApi, type Vehiculo } from '~/lib/api/catalogos'
import { QueryKeys } from '~/app/_lib/queryKeys'
import LabelBase from '~/components/form/label-base'
import ModalVehiculoSearch from '../../modals/modal-vehiculo-search'

interface SelectVehiculosProps {
  placeholder?: string
  classNameIcon?: string
  sizeIcon?: number
  showCreate?: boolean
  form?: FormInstance
  propsForm?: { name: string; [key: string]: any }
  className?: string
  allowClear?: boolean
  value?: number
  onChange?: (value: number | undefined) => void
  [key: string]: any
}

export default function SelectVehiculos({
  placeholder = 'Buscar Vehículo...',
  classNameIcon = 'text-orange-600',
  sizeIcon = 16,
  showCreate = true,
  form,
  propsForm,
  className = '',
  allowClear = false,
  onChange,
}: SelectVehiculosProps) {
  const queryClient = useQueryClient()
  const [openBuscar, setOpenBuscar] = useState(false)
  const [openCrear, setOpenCrear] = useState(false)
  const [creando, setCreando] = useState(false)
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<Vehiculo>()
  const [nuevoVehiculo, setNuevoVehiculo] = useState({ name: '', tipo: '', marca_modelo: '', placa: '' })

  function handleSelect(vehiculo?: Vehiculo) {
    if (vehiculo) {
      setVehiculoSeleccionado(vehiculo)
      if (form && propsForm?.name) {
        form.setFieldValue(propsForm.name, vehiculo.id)
      }
      onChange?.(vehiculo.id)
      setOpenBuscar(false)
    }
  }

  function handleClear() {
    setVehiculoSeleccionado(undefined)
    if (form && propsForm?.name) {
      form.setFieldValue(propsForm.name, undefined)
    }
    onChange?.(undefined)
  }

  const handleCrear = async () => {
    if (!nuevoVehiculo.name || !nuevoVehiculo.tipo) {
      message.warning('Nombre y tipo son obligatorios')
      return
    }
    setCreando(true)
    try {
      const res = await vehiculosApi.create(nuevoVehiculo)
      if (res.error) {
        message.error(res.error.message)
        return
      }
      message.success('Vehículo creado')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.VEHICULOS] })
      setOpenCrear(false)
      setNuevoVehiculo({ name: '', tipo: '', marca_modelo: '', placa: '' })
    } finally {
      setCreando(false)
    }
  }

  const displayValue = vehiculoSeleccionado
    ? `${vehiculoSeleccionado.name}${vehiculoSeleccionado.placa ? ` (${vehiculoSeleccionado.placa})` : ''} - ${vehiculoSeleccionado.tipo}`
    : ''

  return (
    <>
      {propsForm && (
        <div style={{ display: 'none' }}>
          <Form.Item name={propsForm.name}>
            <Input />
          </Form.Item>
        </div>
      )}

      <div className={`flex items-center gap-2 ${className}`}>
        <Input
          readOnly
          value={displayValue}
          placeholder={placeholder}
          prefix={<FaTruck className={classNameIcon} size={sizeIcon} />}
          suffix={
            allowClear && vehiculoSeleccionado ? (
              <IoClose
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                size={16}
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
              />
            ) : undefined
          }
          className="cursor-pointer"
          onClick={() => setOpenBuscar(true)}
        />
        <FaSearch
          className='text-yellow-600 cursor-pointer flex-shrink-0'
          size={16}
          onClick={() => setOpenBuscar(true)}
        />
        {showCreate && (
          <FaPlus
            className='text-green-600 cursor-pointer flex-shrink-0'
            size={14}
            onClick={() => setOpenCrear(true)}
          />
        )}
      </div>

      {/* Modal de búsqueda — mismo diseño que clientes/despachadores */}
      <ModalVehiculoSearch
        open={openBuscar}
        setOpen={setOpenBuscar}
        onOk={() => {}}
        onRowDoubleClicked={handleSelect}
      />

      {/* Modal de creación rápida */}
      <Modal
        title='Crear Vehículo'
        open={openCrear}
        onCancel={() => setOpenCrear(false)}
        onOk={handleCrear}
        okText='Crear'
        confirmLoading={creando}
        width={400}
        centered
        zIndex={2100}
      >
        <div className='space-y-3 py-2'>
          <LabelBase label='Nombre: *' orientation='column'>
            <Input
              placeholder='Ej: Moto Honda'
              value={nuevoVehiculo.name}
              onChange={e => setNuevoVehiculo(p => ({ ...p, name: e.target.value }))}
            />
          </LabelBase>
          <LabelBase label='Tipo: *' orientation='column'>
            <Input
              placeholder='Ej: MOTO, CAMION, FURGONETA'
              value={nuevoVehiculo.tipo}
              onChange={e => setNuevoVehiculo(p => ({ ...p, tipo: e.target.value.toUpperCase() }))}
            />
          </LabelBase>
          <LabelBase label='Marca / Modelo:' orientation='column'>
            <Input
              placeholder='Ej: HONDA XR 150, HYUNDAI HD65'
              value={nuevoVehiculo.marca_modelo}
              onChange={e => setNuevoVehiculo(p => ({ ...p, marca_modelo: e.target.value.toUpperCase() }))}
            />
          </LabelBase>
          <LabelBase label='Placa:' orientation='column'>
            <Input
              placeholder='Ej: ABC-123'
              value={nuevoVehiculo.placa}
              onChange={e => setNuevoVehiculo(p => ({ ...p, placa: e.target.value.toUpperCase() }))}
            />
          </LabelBase>
        </div>
      </Modal>
    </>
  )
}
