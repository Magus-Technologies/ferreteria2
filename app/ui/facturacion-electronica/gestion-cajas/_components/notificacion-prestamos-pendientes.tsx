import { Badge, Popover, Spin, Tabs } from 'antd'
import { BellOutlined, DollarOutlined, WarningOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { prestamoVendedorApi, type SolicitudEfectivo } from '~/lib/api/prestamo-vendedor'
import { facturacionElectronicaApi, type ComprobanteElectronico } from '~/lib/api/facturacion-electronica'
import ModalAprobarSolicitudEfectivo from './modal-aprobar-solicitud-efectivo'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'

export function NotificacionPrestamosPendientes() {
  const router = useRouter()
  const [openAprobar, setOpenAprobar] = useState(false)
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudEfectivo | null>(null)

  // 1. Consultar préstamos (solicitudes de efectivo)
  const { data: prestamosData, refetch: refetchPrestamos, isError: isErrorPrestamos } = useQuery({
    queryKey: ['solicitudes-efectivo-pendientes'],
    queryFn: async () => {
      const resp = await prestamoVendedorApi.solicitudesPendientes()
      return resp
    },
    refetchInterval: 30000,
  })

  // 2. Consultar alertas de SUNAT (comprobantes por vencer)
  const { data: sunatData, refetch: refetchSunat, isLoading: isLoadingSunat } = useQuery({
    queryKey: ['sunat-alertas-pendientes'],
    queryFn: async () => {
      const resp = await facturacionElectronicaApi.getPendientesAlerta()
      return resp
    },
    refetchInterval: 60000,
  })

  const solicitudes = Array.isArray((prestamosData?.data as any)?.data)
    ? (prestamosData?.data as any).data
    : []

  const alertasSunat = Array.isArray((sunatData?.data as any)?.data)
    ? (sunatData?.data as any).data
    : []

  const totalNotifications = solicitudes.length + alertasSunat.length

  const handleAprobar = (solicitud: SolicitudEfectivo) => {
    setSelectedSolicitud(solicitud)
    setOpenAprobar(true)
  }

  const handleRechazar = async (solicitudId: string) => {
    await prestamoVendedorApi.rechazarSolicitud(solicitudId)
    refetchPrestamos()
  }

  const content = (
    <div className="w-96">
      <Tabs defaultActiveKey="1" size="small" items={[
        {
          key: '1',
          label: (
            <div className="flex items-center gap-2">
              <DollarOutlined />
              <span>Préstamos</span>
              {solicitudes.length > 0 && <Badge count={solicitudes.length} size="small" offset={[5, 0]} />}
            </div>
          ),
          children: (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {solicitudes.map((solicitud: SolicitudEfectivo) => (
                <div key={solicitud.id} className="border rounded-lg p-3 space-y-2 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{solicitud.vendedor_solicitante.name}</p>
                      <p className="text-xs text-slate-500">Solicita efectivo</p>
                    </div>
                    <p className="text-sm font-bold text-emerald-600">S/ {solicitud.monto_solicitado.toFixed(2)}</p>
                  </div>
                  {solicitud.motivo && <p className="text-xs text-gray-600 italic">"{solicitud.motivo}"</p>}
                  <div className="text-xs text-gray-400">
                    {dayjs(solicitud.created_at).format('DD MMM, HH:mm')}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => handleAprobar(solicitud)} className="flex-1 px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600">Aprobar</button>
                    <button onClick={() => handleRechazar(solicitud.id)} className="flex-1 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600">Rechazar</button>
                  </div>
                </div>
              ))}
              {solicitudes.length === 0 && <div className="py-8 text-center text-slate-400 text-sm">No hay solicitudes hoy</div>}
            </div>
          )
        },
        {
          key: '2',
          label: (
            <div className="flex items-center gap-2">
              <WarningOutlined />
              <span>Alertas SUNAT</span>
              {alertasSunat.length > 0 && <Badge count={alertasSunat.length} size="small" offset={[5, 0]} status="error" />}
            </div>
          ),
          children: (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <div className="bg-amber-50 border border-amber-200 p-2 rounded text-xs text-amber-800 mb-2">
                Documentos próximos a vencer que deben enviarse pronto.
              </div>
              {alertasSunat.map((doc: ComprobanteElectronico) => (
                <div key={doc.id} className="border border-red-100 rounded-lg p-3 space-y-1 hover:bg-red-50 transition-colors cursor-pointer"
                  onClick={() => router.push('/ui/facturacion-electronica/mis-ventas')}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-red-600">
                        {doc.tipo_comprobante === '01' ? 'Factura' : 'Boleta'} {doc.serie}-{doc.correlativo}
                      </p>
                      <p className="text-xs text-gray-700">{doc.cliente_razon_social || doc.cliente?.nombre}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold">S/ {Number(doc.total).toFixed(2)}</p>
                      {(() => {
                        const limit = doc.tipo_comprobante === '01' ? 3 : 7;
                        const diff = dayjs().startOf('day').diff(dayjs(doc.fecha_emision).startOf('day'), 'day');
                        const remaining = limit - diff;
                        let text = '';
                        if (remaining <= 0) text = 'Vence Hoy';
                        else if (remaining === 1) text = 'Vence Mañana';
                        else text = `Vence en ${remaining} días`;
                        return <p className="text-[10px] text-red-500 font-bold uppercase">{text}</p>;
                      })()}
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Emitido: {dayjs(doc.fecha_emision).format('DD/MM/YYYY')}
                  </div>
                </div>
              ))}
              {alertasSunat.length === 0 && <div className="py-8 text-center text-slate-400 text-sm">Todo al día con SUNAT</div>}
            </div>
          )
        }
      ]} />
    </div>
  )

  return (
    <>
      <Popover content={content} trigger="click" placement="bottomRight">
        <button className="relative p-2 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center">
          <Badge count={totalNotifications} offset={[-2, 2]} size="small">
            <BellOutlined className={`text-white text-xl ${totalNotifications > 0 ? 'animate-tada animate-infinite animate-duration-[2000ms]' : ''}`} />
          </Badge>
        </button>
      </Popover>

      {selectedSolicitud && (
        <ModalAprobarSolicitudEfectivo
          solicitudId={selectedSolicitud.id}
          open={openAprobar}
          setOpen={setOpenAprobar}
          montoSolicitado={selectedSolicitud.monto_solicitado}
          solicitanteNombre={selectedSolicitud.vendedor_solicitante.name}
          onSuccess={() => refetchPrestamos()}
        />
      )}
    </>
  )
}
