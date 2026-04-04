'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Spin, Tag, Divider, Button } from 'antd'
import { FaFilePdf, FaStore, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa'

interface DocumentoData {
  tipo: 'venta' | 'guia'
  tipo_documento_label: string
  numero_completo: string
  serie?: string
  numero?: number
  fecha?: string
  fecha_emision?: string
  fecha_traslado?: string
  forma_pago?: string
  estado?: string
  motivo_traslado?: string
  modalidad?: string
  punto_partida?: string
  punto_llegada?: string
  vehiculo_placa?: string
  chofer?: string
  cliente: { nombre: string; documento: string }
  vendedor?: string
  empresa: {
    razon_social: string
    ruc: string
    direccion: string
    telefono: string
    email: string
    logo: string | null
  }
  productos?: Array<{
    nombre: string
    codigo: string
    marca?: string
    cantidad: number
    unidad: string
    precio: number
    descuento?: number
    subtotal: number
  }>
  detalles?: Array<{
    nombre: string
    codigo: string
    cantidad: number
    unidad: string
    peso: number
  }>
  metodos_pago?: Array<{ nombre: string; monto: number }>
  totales?: {
    subtotal: number
    descuento: number
    igv: number
    total: number
  }
  peso_total?: number
  observaciones?: string | null
  pdf_url: string
}

const ESTADO_COLORS: Record<string, string> = {
  cr: 'blue',
  pr: 'green',
  an: 'red',
  ee: 'orange',
}

const ESTADO_LABELS: Record<string, string> = {
  cr: 'Creado',
  pr: 'Procesado',
  an: 'Anulado',
  ee: 'En Espera',
}

export default function ConsultaDocumentoPage() {
  const params = useParams()
  const tipo = params.tipo as string
  const id = params.id as string

  const [data, setData] = useState<DocumentoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

    fetch(`${apiUrl}/consulta-documento/${tipo}/${id}`)
      .then(res => res.json())
      .then(res => {
        if (res.error) {
          setError(res.error.message || 'Documento no encontrado')
        } else {
          setData(res.data)
        }
      })
      .catch(() => setError('Error al consultar el documento'))
      .finally(() => setLoading(false))
  }, [tipo, id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spin size="large" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <div className="text-6xl mb-4">📄</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Documento no encontrado</h1>
          <p className="text-gray-500">{error || 'El documento solicitado no existe o ya no está disponible.'}</p>
        </div>
      </div>
    )
  }

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
  const logoUrl = data.empresa.logo ? `${apiBase}/storage/${data.empresa.logo}` : null

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header empresa */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex items-center gap-4 mb-4">
            {logoUrl && (
              <img src={logoUrl} alt="Logo" className="h-16 w-auto object-contain" />
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900">{data.empresa.razon_social}</h1>
              <p className="text-sm text-gray-500">RUC: {data.empresa.ruc}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <FaMapMarkerAlt /> {data.empresa.direccion}
            </span>
            <span className="flex items-center gap-1">
              <FaPhone /> {data.empresa.telefono}
            </span>
            <span className="flex items-center gap-1">
              <FaEnvelope /> {data.empresa.email}
            </span>
          </div>
        </div>

        {/* Info del documento */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-800">{data.tipo_documento_label}</h2>
              <p className="text-2xl font-bold text-blue-600">{data.numero_completo}</p>
            </div>
            {data.estado && (
              <Tag color={ESTADO_COLORS[data.estado] || 'default'} className="!text-sm !px-3 !py-1">
                {ESTADO_LABELS[data.estado] || data.estado}
              </Tag>
            )}
          </div>

          <Divider className="!my-3" />

          <div className="grid grid-cols-2 gap-3 text-sm">
            {data.tipo === 'venta' && (
              <>
                <div>
                  <span className="text-gray-500">Fecha:</span>
                  <span className="ml-2 font-medium">{data.fecha}</span>
                </div>
                <div>
                  <span className="text-gray-500">Forma de Pago:</span>
                  <span className="ml-2 font-medium">{data.forma_pago}</span>
                </div>
                <div>
                  <span className="text-gray-500">Vendedor:</span>
                  <span className="ml-2 font-medium">{data.vendedor}</span>
                </div>
              </>
            )}
            {data.tipo === 'guia' && (
              <>
                <div>
                  <span className="text-gray-500">F. Emision:</span>
                  <span className="ml-2 font-medium">{data.fecha_emision}</span>
                </div>
                <div>
                  <span className="text-gray-500">F. Traslado:</span>
                  <span className="ml-2 font-medium">{data.fecha_traslado}</span>
                </div>
                <div>
                  <span className="text-gray-500">Motivo:</span>
                  <span className="ml-2 font-medium">{data.motivo_traslado}</span>
                </div>
                <div>
                  <span className="text-gray-500">Modalidad:</span>
                  <span className="ml-2 font-medium">{data.modalidad}</span>
                </div>
                <div>
                  <span className="text-gray-500">Origen:</span>
                  <span className="ml-2 font-medium">{data.punto_partida}</span>
                </div>
                <div>
                  <span className="text-gray-500">Destino:</span>
                  <span className="ml-2 font-medium">{data.punto_llegada}</span>
                </div>
              </>
            )}
            <div>
              <span className="text-gray-500">Cliente:</span>
              <span className="ml-2 font-medium">{data.cliente.nombre}</span>
            </div>
            <div>
              <span className="text-gray-500">Documento:</span>
              <span className="ml-2 font-medium">{data.cliente.documento}</span>
            </div>
          </div>
        </div>

        {/* Tabla de productos/detalles */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">
            {data.tipo === 'venta' ? 'PRODUCTOS' : 'DETALLE'}
          </h3>

          <div className="overflow-x-auto">
            {data.tipo === 'venta' && data.productos && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-xs text-gray-500 uppercase">
                    <th className="text-left py-2 pr-2">Producto</th>
                    <th className="text-center py-2 px-2">Cant.</th>
                    <th className="text-left py-2 px-2">Unid.</th>
                    <th className="text-right py-2 px-2">P.U.</th>
                    <th className="text-right py-2 pl-2">Subt.</th>
                  </tr>
                </thead>
                <tbody>
                  {data.productos.map((p, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 pr-2">
                        <div className="font-medium text-gray-800">{p.nombre}</div>
                        <div className="text-xs text-gray-400">{p.codigo} | {p.marca}</div>
                      </td>
                      <td className="text-center py-2 px-2">{p.cantidad}</td>
                      <td className="py-2 px-2">{p.unidad}</td>
                      <td className="text-right py-2 px-2">S/ {p.precio.toFixed(2)}</td>
                      <td className="text-right py-2 pl-2 font-medium">S/ {p.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {data.tipo === 'guia' && data.detalles && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-xs text-gray-500 uppercase">
                    <th className="text-left py-2 pr-2">Producto</th>
                    <th className="text-center py-2 px-2">Cant.</th>
                    <th className="text-left py-2 px-2">Unid.</th>
                    <th className="text-right py-2 pl-2">Peso (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.detalles.map((d, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 pr-2">
                        <div className="font-medium text-gray-800">{d.nombre}</div>
                        <div className="text-xs text-gray-400">{d.codigo}</div>
                      </td>
                      <td className="text-center py-2 px-2">{d.cantidad}</td>
                      <td className="py-2 px-2">{d.unidad}</td>
                      <td className="text-right py-2 pl-2">{d.peso.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Totales (solo ventas) */}
        {data.tipo === 'venta' && data.totales && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <div className="flex flex-col items-end gap-1 text-sm">
              <div className="flex justify-between w-48">
                <span className="text-gray-500">Subtotal:</span>
                <span>S/ {data.totales.subtotal.toFixed(2)}</span>
              </div>
              {data.totales.descuento > 0 && (
                <div className="flex justify-between w-48">
                  <span className="text-gray-500">Descuento:</span>
                  <span className="text-red-500">-S/ {data.totales.descuento.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between w-48">
                <span className="text-gray-500">IGV (18%):</span>
                <span>S/ {data.totales.igv.toFixed(2)}</span>
              </div>
              <Divider className="!my-1 !w-48" />
              <div className="flex justify-between w-48">
                <span className="font-bold text-gray-800">TOTAL:</span>
                <span className="font-bold text-lg text-blue-600">S/ {data.totales.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Peso total (solo guía) */}
        {data.tipo === 'guia' && data.peso_total !== undefined && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <div className="flex justify-end items-center gap-2 text-sm">
              <span className="font-bold text-gray-800">PESO TOTAL:</span>
              <span className="font-bold text-lg text-blue-600">{data.peso_total.toFixed(2)} KG</span>
            </div>
          </div>
        )}

        {/* Métodos de pago */}
        {data.metodos_pago && data.metodos_pago.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <h3 className="text-sm font-bold text-gray-700 mb-2">METODOS DE PAGO</h3>
            {data.metodos_pago.map((mp, i) => (
              <div key={i} className="flex justify-between text-sm py-1">
                <span className="text-gray-600">{mp.nombre}</span>
                <span className="font-medium">S/ {mp.monto.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Botón descargar PDF */}
        <div className="text-center mb-6">
          <Button
            type="primary"
            size="large"
            icon={<FaFilePdf />}
            onClick={() => window.open(data.pdf_url + '?formato=a4', '_blank')}
            className="!rounded-full !px-8"
          >
            Descargar PDF
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 pb-4">
          <FaStore className="inline mr-1" />
          {data.empresa.razon_social} - RUC {data.empresa.ruc}
        </div>
      </div>
    </div>
  )
}
