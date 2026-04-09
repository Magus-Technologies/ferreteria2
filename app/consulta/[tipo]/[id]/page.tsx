'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Spin, Tag, Divider } from 'antd'
import Image from 'next/image'
import { FaFilePdf, FaPrint, FaArrowLeft } from 'react-icons/fa'
import { RainbowButton } from '~/components/magicui/rainbow-button'
import ButtonBase from '~/components/buttons/button-base'

interface DocumentoData {
  tipo: 'venta' | 'guia'
  tipo_documento_label: string
  numero_completo: string
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
  totales?: { subtotal: number; descuento: number; igv: number; total: number }
  peso_total?: number
  observaciones?: string | null
  pdf_url: string
}

const ESTADO_COLORS: Record<string, string> = { cr: 'blue', pr: 'green', an: 'red', ee: 'orange' }
const ESTADO_LABELS: Record<string, string> = { cr: 'Creado', pr: 'Procesado', an: 'Anulado', ee: 'En Espera' }

export default function ConsultaDocumentoPage() {
  const params = useParams()
  const router = useRouter()
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
        if (res.error) setError(res.error.message || 'Documento no encontrado')
        else setData(res.data)
      })
      .catch(() => setError('Error al consultar el documento'))
      .finally(() => setLoading(false))
  }, [tipo, id])

  if (loading) {
    return (
      <div className="bg-[url('/fondo-login.webp')] bg-cover bg-center bg-no-repeat h-dvh w-dvw flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/30 backdrop-blur-[2px]" />
        <Spin size="large" className="relative z-10" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-[url('/fondo-login.webp')] bg-cover bg-center bg-no-repeat h-dvh w-dvw flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/30 backdrop-blur-[2px]" />
        <div className="relative z-10 text-center p-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md mx-4">
          <div className="text-5xl mb-3">📄</div>
          <h1 className="text-lg font-bold text-gray-800 mb-2">Documento no encontrado</h1>
          <p className="text-sm text-gray-500 mb-5">{error}</p>
          <RainbowButton onClick={() => router.push('/consulta')} size="lg" variant="outline" className="active:scale-95">
            <FaArrowLeft className="mr-2" /> Volver a buscar
          </RainbowButton>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[url('/fondo-login.webp')] bg-cover bg-center bg-no-repeat min-h-dvh w-dvw relative overflow-auto">
      <div className="fixed inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/30 backdrop-blur-[2px]" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-6">
        {/* Volver */}
        <button
          onClick={() => router.push('/consulta')}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors text-sm"
        >
          <FaArrowLeft /> Nueva consulta
        </button>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
          {/* Header con logo */}
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-4">
              <Image src="/logo-horizontal.png" alt="Logo" width={140} height={50} className="h-10 w-auto object-contain" />
            </div>
            <div className="text-right text-xs text-gray-400">
              <div>{data.empresa.razon_social}</div>
              <div>RUC: {data.empresa.ruc}</div>
            </div>
          </div>

          {/* Tipo y número */}
          <div className="px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider opacity-80">{data.tipo_documento_label}</p>
              <p className="text-2xl font-bold">{data.numero_completo}</p>
            </div>
            {data.estado && (
              <Tag color={ESTADO_COLORS[data.estado] || 'default'} className="!text-sm !px-4 !py-1 !border-0 !font-bold">
                {ESTADO_LABELS[data.estado] || data.estado}
              </Tag>
            )}
          </div>

          {/* Info */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-sm">
              {data.tipo === 'venta' && (
                <>
                  <InfoItem label="Fecha" value={data.fecha} />
                  <InfoItem label="Forma de Pago" value={data.forma_pago} />
                  <InfoItem label="Vendedor" value={data.vendedor} />
                </>
              )}
              {data.tipo === 'guia' && (
                <>
                  <InfoItem label="F. Emisión" value={data.fecha_emision} />
                  <InfoItem label="F. Traslado" value={data.fecha_traslado} />
                  <InfoItem label="Motivo" value={data.motivo_traslado} />
                  <InfoItem label="Modalidad" value={data.modalidad} />
                  <InfoItem label="Origen" value={data.punto_partida} />
                  <InfoItem label="Destino" value={data.punto_llegada} />
                </>
              )}
              <InfoItem label="Cliente" value={data.cliente.nombre} />
              <InfoItem label="Documento" value={data.cliente.documento} />
            </div>
          </div>

          {/* Tabla productos */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              {data.tipo === 'venta' ? 'Productos' : 'Detalle'}
            </h3>
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              {data.tipo === 'venta' && data.productos && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs uppercase">
                      <th className="text-left py-2.5 px-3 font-semibold">Descripción</th>
                      <th className="text-center py-2.5 px-2 font-semibold">Cant.</th>
                      <th className="text-left py-2.5 px-2 font-semibold">Und.</th>
                      <th className="text-right py-2.5 px-2 font-semibold">P.U.</th>
                      <th className="text-right py-2.5 px-3 font-semibold">Importe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.productos.map((p, i) => (
                      <tr key={i} className={`border-b border-gray-100 ${i % 2 === 1 ? 'bg-gray-50/60' : ''}`}>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-gray-800">{p.nombre}</div>
                          <div className="text-[11px] text-gray-400">{p.codigo}{p.marca ? ` · ${p.marca}` : ''}</div>
                        </td>
                        <td className="text-center py-3 px-2 text-gray-700 font-medium">{p.cantidad}</td>
                        <td className="py-3 px-2 text-gray-600">{p.unidad}</td>
                        <td className="text-right py-3 px-2 text-gray-600">S/ {p.precio.toFixed(2)}</td>
                        <td className="text-right py-3 px-3 font-bold text-gray-800">S/ {p.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {data.tipo === 'guia' && data.detalles && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs uppercase">
                      <th className="text-left py-2.5 px-3 font-semibold">Descripción</th>
                      <th className="text-center py-2.5 px-2 font-semibold">Cant.</th>
                      <th className="text-left py-2.5 px-2 font-semibold">Und.</th>
                      <th className="text-right py-2.5 px-3 font-semibold">Peso (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.detalles.map((d, i) => (
                      <tr key={i} className={`border-b border-gray-100 ${i % 2 === 1 ? 'bg-gray-50/60' : ''}`}>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-gray-800">{d.nombre}</div>
                          <div className="text-[11px] text-gray-400">{d.codigo}</div>
                        </td>
                        <td className="text-center py-3 px-2 text-gray-700 font-medium">{d.cantidad}</td>
                        <td className="py-3 px-2 text-gray-600">{d.unidad}</td>
                        <td className="text-right py-3 px-3 font-bold">{d.peso.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Totales ventas */}
          {data.tipo === 'venta' && data.totales && (
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex justify-end">
                <div className="w-56 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-500">
                    <span>Op. Gravada</span>
                    <span>S/ {data.totales.subtotal.toFixed(2)}</span>
                  </div>
                  {data.totales.descuento > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Descuento</span>
                      <span>-S/ {data.totales.descuento.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-500">
                    <span>IGV (18%)</span>
                    <span>S/ {data.totales.igv.toFixed(2)}</span>
                  </div>
                  <Divider className="!my-1.5" />
                  <div className="flex justify-between font-bold text-lg text-gray-900">
                    <span>TOTAL</span>
                    <span>S/ {data.totales.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Peso total guía */}
          {data.tipo === 'guia' && data.peso_total !== undefined && (
            <div className="px-6 py-4 border-b border-gray-100 text-right">
              <span className="font-bold text-lg text-gray-900">PESO TOTAL: {data.peso_total.toFixed(2)} KG</span>
            </div>
          )}

          {/* Métodos de pago */}
          {data.metodos_pago && data.metodos_pago.length > 0 && (
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Métodos de Pago</h3>
              {data.metodos_pago.map((mp, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span className="text-gray-600">{mp.nombre}</span>
                  <span className="font-medium">S/ {mp.monto.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Botones */}
          <div className="px-6 py-5 flex items-center justify-center gap-3">
            <ButtonBase
              color="info"
              size="md"
              className="flex items-center gap-2"
              onClick={() => window.open(data.pdf_url + '?formato=a4', '_blank')}
            >
              <FaFilePdf /> Descargar PDF
            </ButtonBase>
            <ButtonBase
              color="default"
              size="md"
              className="flex items-center gap-2"
              onClick={() => window.open(data.pdf_url + '?formato=ticket', '_blank')}
            >
              <FaPrint /> Ver Ticket
            </ButtonBase>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div>
      <span className="text-xs text-gray-400 uppercase tracking-wider">{label}</span>
      <p className="font-medium text-gray-800 mt-0.5">{value}</p>
    </div>
  )
}
