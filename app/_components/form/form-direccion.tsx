'use client'

import { Form, Input, Button } from 'antd'
import { type FormInstance } from 'antd/es/form'
import { type DireccionCliente, type DireccionFormValues, type Coordenadas } from '~/lib/api/cliente'
import MapaDireccionMapbox from '~/app/ui/facturacion-electronica/mis-ventas/_components/maps/mapa-direccion-mapbox'
import { useState } from 'react'

interface FormDireccionProps {
  form: FormInstance
  direccion?: DireccionCliente
  modo: 'crear' | 'editar'
  onSubmit: (values: DireccionFormValues) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export default function FormDireccion({
  form,
  direccion,
  modo,
  onSubmit,
  onCancel,
  loading = false,
}: FormDireccionProps) {
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(
    direccion?.latitud && direccion?.longitud
      ? { lat: direccion.latitud, lng: direccion.longitud }
      : null
  )

  const handleCoordenadaChange = (coords: Coordenadas) => {
    setCoordenadas(coords)
    form.setFieldsValue({
      latitud: coords.lat,
      longitud: coords.lng,
    })
  }

  const handleFinish = async (values: any) => {
    const data: DireccionFormValues = {
      direccion: values.direccion,
      latitud: coordenadas?.lat || null,
      longitud: coordenadas?.lng || null,
    }
    await onSubmit(data)
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={
        direccion
          ? {
              direccion: direccion.direccion,
              latitud: direccion.latitud,
              longitud: direccion.longitud,
            }
          : undefined
      }
    >
      <Form.Item
        label="Dirección"
        name="direccion"
        rules={[
          { required: true, message: 'La dirección es requerida' },
          { max: 500, message: 'La dirección no puede exceder 500 caracteres' },
        ]}
      >
        <Input.TextArea
          placeholder="Ej: Av. Principal 123, Lima"
          rows={2}
          maxLength={500}
          showCount
        />
      </Form.Item>

      <Form.Item label="Ubicación en el mapa (opcional)">
        <div className="h-[300px] w-full">
          <MapaDireccionMapbox
            direccion={form.getFieldValue('direccion') || ''}
            onCoordenadaChange={handleCoordenadaChange}
            coordenadasIniciales={coordenadas}
            editable={true}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Haz clic en el mapa para marcar la ubicación exacta o arrastra el marcador
        </p>
      </Form.Item>

      <Form.Item name="latitud" hidden>
        <Input />
      </Form.Item>

      <Form.Item name="longitud" hidden>
        <Input />
      </Form.Item>

      <div className="flex justify-end gap-2 mt-4">
        <Button onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          {modo === 'crear' ? 'Crear Dirección' : 'Actualizar Dirección'}
        </Button>
      </div>
    </Form>
  )
}
