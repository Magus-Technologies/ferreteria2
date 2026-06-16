'use client'

import { Form, Input, Select } from 'antd'
import FormBase from '~/components/form/form-base'
import Image from 'next/image'
import { FaSearch, FaSpinner, FaFileInvoice, FaLock } from 'react-icons/fa'
import { RainbowButton } from '~/components/magicui/rainbow-button'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ConsultaValues {
  ruc_emisor?: string
  serie: string
  correlativo: string
  tipo_documento: string
  monto: string
}

export default function ConsultaPage() {
  const router = useRouter()
  const [form] = Form.useForm<ConsultaValues>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConsultar = async (values: ConsultaValues) => {
    const monto = values.monto?.trim()
    if (!monto) {
      setError('Debe ingresar el monto neto del comprobante')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
      const params = new URLSearchParams({
        serie: values.serie,
        correlativo: values.correlativo,
        tipo_documento: values.tipo_documento,
        ...(values.ruc_emisor && { ruc_emisor: values.ruc_emisor }),
      })

      const res = await fetch(`${apiUrl}/consulta-documento/buscar?${params}`)
      const data = await res.json()

      if (data.error) {
        setError(data.error.message || 'Documento no encontrado')
      } else if (data.data) {
        router.push(`/consulta/${data.data.tipo}/${data.data.id}?monto=${encodeURIComponent(monto)}`)
      }
    } catch {
      setError('Error al consultar. Intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[url('/fondo-login.webp')] bg-cover bg-center bg-no-repeat h-dvh w-dvw flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/30 backdrop-blur-[2px]" />

      <div
        className="bg-white/95 backdrop-blur-sm
                   px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-8 lg:py-10
                   rounded-xl sm:rounded-2xl
                   shadow-2xl shadow-black/20
                   w-[calc(100dvw-2rem)] sm:w-[min(90dvw,28rem)] md:w-[min(85dvw,32rem)] lg:w-auto lg:max-w-md xl:max-w-lg
                   max-h-dvh overflow-y-auto
                   mx-4 sm:mx-0
                   relative z-10"
      >
        {/* Logo */}
        <div className="mb-4 sm:mb-6 flex justify-center">
          <Image
            className="w-48 h-auto sm:w-56 md:w-64 object-contain"
            src="/logo-horizontal.png"
            alt="Logo"
            width={350}
            height={300}
            priority
          />
        </div>

        {/* Título */}
        <div className="text-center mb-4 sm:mb-6">
          <FaFileInvoice className="mx-auto text-2xl sm:text-3xl text-cyan-500 mb-2" />
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">
            Consulta Comprobante Electrónico
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Ingrese los datos del comprobante a consultar
          </p>
        </div>

        {/* Formulario */}
        <FormBase<ConsultaValues>
          form={form}
          name="consulta"
          size="large"
          onFinish={handleConsultar}
        >
          <Form.Item name="ruc_emisor">
            <Input
              prefix={<FaFileInvoice className="text-cyan-500 mx-2 text-base" />}
              placeholder="RUC del emisor (opcional)"
              className="text-sm sm:text-base"
            />
          </Form.Item>

          <div className="flex gap-3">
            <Form.Item
              name="serie"
              className="flex-1"
              rules={[{ required: true, message: 'Ingrese serie' }]}
            >
              <Input
                placeholder="Serie (F001)"
                className="text-sm sm:text-base uppercase"
                maxLength={4}
                onChange={e => form.setFieldValue('serie', e.target.value.toUpperCase())}
              />
            </Form.Item>
            <Form.Item
              name="correlativo"
              className="flex-1"
              rules={[{ required: true, message: 'Ingrese correlativo' }]}
            >
              <Input
                placeholder="Correlativo"
                className="text-sm sm:text-base"
                maxLength={8}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="tipo_documento"
            rules={[{ required: true, message: 'Seleccione tipo' }]}
          >
            <Select
              placeholder="Seleccione el tipo de documento"
              className="w-full"
              size="large"
              options={[
                { value: '01', label: 'Factura Electrónica' },
                { value: '03', label: 'Boleta de Venta Electrónica' },
                { value: 'NV', label: 'Nota de Venta' },
                { value: '09', label: 'Guía de Remisión' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="monto"
            rules={[{ required: true, message: 'Ingrese el monto neto' }]}
          >
            <Input
              prefix={<FaLock className="text-cyan-500 mx-2 text-base" />}
              placeholder="Monto neto del comprobante (S/)"
              className="text-sm sm:text-base"
              type="text"
              inputMode="decimal"
            />
          </Form.Item>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4 text-center">
              {error}
            </div>
          )}

          <RainbowButton
            type="submit"
            className="w-full mt-2 active:scale-95 transition-all hover:scale-105
                       text-base sm:text-lg
                       h-10 sm:h-11 md:h-12"
            size="lg"
            variant="outline"
            disabled={loading}
          >
            <FaSearch className="mr-2" />
            Consultar Comprobante
            {loading && <FaSpinner className="ml-2 animate-spin" />}
          </RainbowButton>
        </FormBase>
      </div>
    </div>
  )
}
