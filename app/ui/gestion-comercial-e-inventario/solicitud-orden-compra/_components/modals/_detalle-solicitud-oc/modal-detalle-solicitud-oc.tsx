'use client'

import { Tag, Spin, Button, Modal, Tooltip, message } from 'antd'
import { FilePdfOutlined, CalendarOutlined, UserOutlined, CheckCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { FaShoppingCart, FaRegBuilding, FaBox } from 'react-icons/fa'
import ModalForm from '~/components/modals/modal-form'
import TitleForm from '~/components/form/title-form'
import { classOkButtonModal } from '~/lib/clases'
import { greenColors } from '~/lib/colors'
import type { RequerimientoInterno, RequerimientoInternoProducto } from '~/lib/api/requerimiento-interno'
import { requerimientoInternoApi } from '~/lib/api/requerimiento-interno'
import dayjs from 'dayjs'
import { formatFechaPeru } from '~/utils/fechas'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { cargosHierarchyApi } from '~/lib/api/cargos-hierarchy'
import { useAuth } from '~/lib/auth-context'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'
import ModalShowDoc from '~/app/_components/modals/modal-show-doc'
import TableWithTitle from '~/components/tables/table-with-title'
import { ColDef, ICellRendererParams } from 'ag-grid-community'

const PRIORIDAD_CONFIG: Record<string, { color: string; bg: string; text: string }> = {
  BAJA: { color: 'blue', bg: 'bg-blue-50', text: 'text-blue-700' },
  MEDIA: { color: 'orange', bg: 'bg-orange-50', text: 'text-orange-700' },
  ALTA: { color: 'red', bg: 'bg-red-50', text: 'text-red-700' },
  URGENTE: { color: 'volcano', bg: 'bg-red-50', text: 'text-red-700' },
}

const ESTADO_CONFIG: Record<string, { color: string; label: string }> = {
  pendiente: { color: 'processing', label: 'PENDIENTE' },
  aprobado: { color: 'success', label: 'APROBADO' },
  rechazada: { color: 'error', label: 'RECHAZADA' },
  anulada: { color: 'default', label: 'ANULADA' },
}

const COLUMNAS_SOC = [
  { label: 'Código', value: 'codigo' },
  { label: 'Cantidad', value: 'cantidad' },
  { label: 'Unidad', value: 'unidad' },
  { label: 'Descripción', value: 'descripcion' },
]

function buildDetalleSOC(productos: RequerimientoInternoProducto[], columnas: string[]): string {
  if (!productos.length || !columnas.length) return ''

  const extractores: Record<string, (p: RequerimientoInternoProducto) => string> = {
    codigo: (p) => p.producto?.cod_producto || '—',
    cantidad: (p) => String(p.cantidad),
    unidad: (p) => p.unidad || p.producto?.unidad_medida?.name || '—',
    descripcion: (p) => p.producto?.name || p.nombre_adicional || '—',
  }

  const LABELS: Record<string, string> = {
    codigo: 'Cód',
    cantidad: 'Cant',
    unidad: 'Und',
    descripcion: 'Desc',
  }

  const colsActivas = columnas.filter((c) => extractores[c])

  const lineas = productos.map((p) => {
    const partes = colsActivas.map((c) => `${LABELS[c]}: ${extractores[c](p)}`)
    return `• ${partes.join(' | ')}`
  })

  return `DETALLE:\n${lineas.join('\n')}`
}

interface ModalDetalleSolicitudOCProps {
  open: boolean
  requerimiento: RequerimientoInterno | null
  loading?: boolean
  onClose: () => void
}

export default function ModalDetalleSolicitudOC({
  open,
  requerimiento,
  loading = false,
  onClose,
}: ModalDetalleSolicitudOCProps) {
  const { user } = useAuth()
  const { data: empresa } = useEmpresaPublica()
  const [escalationModalOpen, setEscalationModalOpen] = useState(false)
  const [selectedCargo, setSelectedCargo] = useState<number | null>(null)
  const [parentCargoInfo, setParentCargoInfo] = useState<{ id: number; descripcion: string } | null>(null)
  const [escalationLoading, setEscalationLoading] = useState(false)
  const [approvalLoading, setApprovalLoading] = useState(false)

  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const fetchedRef = useRef<number | null>(null)
  const [productosLoaded, setProductosLoaded] = useState<RequerimientoInternoProducto[]>([])
  const [productosModalOpen, setProductosModalOpen] = useState(false)

  const fetchPdf = useCallback(async (id: number) => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || ''
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL
    const res = await fetch(`${API_URL}/api/pdf/requerimiento-interno/${id}?formato=a4`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/pdf',
      },
    })
    if (!res.ok) throw new Error(`Error al generar PDF: ${res.status}`)
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  }, [])

  useEffect(() => {
    if (escalationModalOpen && requerimiento) {
      loadParentCargoForEscalation()
    }
  }, [escalationModalOpen, requerimiento])

  useEffect(() => {
    if (open && requerimiento?.id && fetchedRef.current !== requerimiento.id) {
      fetchedRef.current = requerimiento.id
      setPdfLoading(true)

      fetchPdf(requerimiento.id)
        .then((url) => { setPdfUrl(url) })
        .catch((err) => { console.error('Error cargando PDF:', err) })
        .finally(() => { setPdfLoading(false) })

      if (!requerimiento.productos || requerimiento.productos.length === 0) {
        requerimientoInternoApi.getById(requerimiento.id).then((res) => {
          if (res.data?.data?.productos) {
            setProductosLoaded(res.data.data.productos)
          }
        }).catch(() => {})
      } else {
        setProductosLoaded(requerimiento.productos)
      }
    }

    if (!open) {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
        setPdfUrl(null)
      }
      fetchedRef.current = null
      setProductosLoaded([])
      setPdfModalOpen(false)
    }
  }, [open, requerimiento?.id, fetchPdf, requerimiento?.productos, pdfUrl, open])

  const loadParentCargoForEscalation = async () => {
    try {
      const result = await cargosHierarchyApi.getAllCargos()
      const allCargos = result.data?.data || []

      const reqCargoObj = allCargos.find((c) => c.descripcion?.toLowerCase() === requerimiento?.cargo?.toLowerCase())
      const parentCode = reqCargoObj?.parent || null

      if (parentCode) {
        const parentCargoObj = allCargos.find((c) => c.codigo === parentCode)
        if (parentCargoObj) {
          setParentCargoInfo({
            id: parentCargoObj.id,
            descripcion: parentCargoObj.descripcion
          })
          setSelectedCargo(parentCargoObj.id)
        }
      }
    } catch (error) {
      message.error('Error al cargar cargo superior')
      console.error(error)
    }
  }

  const handleAprobar = async () => {
    if (!requerimiento) return

    setApprovalLoading(true)
    try {
      await requerimientoInternoApi.aprobar(requerimiento.id)
      message.success('Solicitud aprobada correctamente')
      onClose()
    } catch (error) {
      message.error('Error al aprobar la solicitud')
      console.error(error)
    } finally {
      setApprovalLoading(false)
    }
  }

  const handleEscalar = async () => {
    if (!requerimiento || !selectedCargo) {
      message.warning('Selecciona un cargo para escalar')
      return
    }

    setEscalationLoading(true)
    try {
      await requerimientoInternoApi.pasarAprobacion(requerimiento.id, {
        to_cargo_id: selectedCargo,
        reason: 'Escalado para revisión'
      })
      message.success('Solicitud escalada correctamente')
      setEscalationModalOpen(false)
      setSelectedCargo(null)
      onClose()
    } catch (error) {
      message.error('Error al escalar la solicitud')
      console.error(error)
    } finally {
      setEscalationLoading(false)
    }
  }

  const productosColumns = useMemo<ColDef<RequerimientoInternoProducto>[]>(() => [
    {
      headerName: 'Código',
      field: 'producto.cod_producto',
      width: 120,
      minWidth: 100,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInternoProducto>) => (
        <div className="flex items-center h-full font-semibold text-blue-600">
          {data?.producto?.cod_producto || '—'}
        </div>
      ),
    },
    {
      headerName: 'Producto',
      field: 'producto.name',
      flex: 1,
      minWidth: 200,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInternoProducto>) => (
        <div className="flex items-center h-full overflow-hidden text-ellipsis whitespace-nowrap">
          {data?.producto?.name || data?.nombre_adicional || '—'}
        </div>
      ),
    },
    {
      headerName: 'Marca',
      field: 'producto.marca.name',
      width: 130,
      minWidth: 100,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInternoProducto>) => (
        <div className="flex items-center h-full">
          {data?.producto?.marca?.name ? <Tag color="green">{data.producto.marca.name}</Tag> : '—'}
        </div>
      ),
    },
    {
      headerName: 'Unidad',
      field: 'unidad',
      width: 90,
      minWidth: 80,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInternoProducto>) => (
        <div className="flex items-center h-full text-sm">
          {data?.unidad || data?.producto?.unidad_medida?.name || '—'}
        </div>
      ),
    },
    {
      headerName: 'Cantidad',
      field: 'cantidad',
      width: 100,
      minWidth: 80,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInternoProducto>) => (
        <div className="flex items-center h-full font-semibold text-emerald-600">
          {data?.cantidad ?? 0}
        </div>
      ),
    },
    {
      headerName: 'Estado',
      field: 'estado_producto',
      width: 110,
      minWidth: 100,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInternoProducto>) => {
        const estadoColors: Record<string, string> = {
          pendiente: 'orange',
          parcial: 'processing',
          completo: 'success',
        }
        return (
          <div className="flex items-center h-full">
            {data?.estado_producto ? (
              <Tag color={estadoColors[data.estado_producto]} className="!rounded-full !text-xs">
                {data.estado_producto.toUpperCase()}
              </Tag>
            ) : '—'}
          </div>
        )
      },
    },
  ], [])

  const canApprove = requerimiento &&
    requerimiento.approval_state === 'en_revision' &&
    requerimiento.assigned_cargo_id &&
    user?.cargo === requerimiento.cargo

  if (!requerimiento) return null

  const esSOC = requerimiento.tipo_solicitud === 'SOC'
  const prioridadConfig = PRIORIDAD_CONFIG[requerimiento.prioridad] || PRIORIDAD_CONFIG.MEDIA
  const estadoConfig = ESTADO_CONFIG[requerimiento.estado] || ESTADO_CONFIG.pendiente
  const productos = requerimiento.productos || []

  const empresaNombre = empresa?.razon_social || ''
  const whatsappMensajeAuto =
    `Hola!\n\nLe compartimos nuestro Requerimiento Interno desde ${empresaNombre}\n\n` +
    `REQUERIMIENTO:\n\t${requerimiento.codigo}\n` +
    `TÍTULO:\n\t${requerimiento.titulo}\n` +
    `ÁREA:\n\t${requerimiento.cargo}\n`

  const pdfPublicUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pdf/requerimiento-interno/${requerimiento.id}`

  const nroDoc = requerimiento.codigo ?? 'Requerimiento Interno'

  return (
    <>
      <ModalForm
        open={open}
        setOpen={(isOpen) => {
          if (!isOpen) onClose()
        }}
        modalProps={{
          title: (
            <div className="flex items-center justify-between pr-8">
              <div>
                <TitleForm className="!pb-0">Detalle de Solicitud de OC</TitleForm>
                <span className="text-xs text-slate-400 font-mono tracking-wider">{requerimiento.codigo}</span>
              </div>
              <Tag color={estadoConfig.color} className="!font-bold !text-xs !rounded-full !px-3 !border-none">
                {estadoConfig.label}
              </Tag>
            </div>
          ),
          width: 900,
          centered: true,
          footer: (
            <div className="flex items-center justify-between w-full">
              <div className="text-[10px] text-slate-400 space-x-4">
                <span>Creado: {formatFechaPeru(requerimiento.created_at, 'DD/MM/YYYY HH:mm')}</span>
                <span>•</span>
                <span>Actualizado: {formatFechaPeru(requerimiento.updated_at, 'DD/MM/YYYY HH:mm')}</span>
              </div>
              <div className="flex gap-2">
                <Tooltip title="Ver PDF">
                  <Button
                    icon={<FilePdfOutlined />}
                    onClick={() => setPdfModalOpen(true)}
                    className="!rounded-lg !border-blue-600 !text-blue-600 hover:!border-blue-700 hover:!text-blue-700"
                  >
                    Ver PDF
                  </Button>
                </Tooltip>
                {canApprove && (
                  <>
                    <Tooltip title="Escalar a cargo superior para revisión">
                      <Button
                        icon={<QuestionCircleOutlined />}
                        onClick={() => setEscalationModalOpen(true)}
                        className="!rounded-lg !border-amber-600 !text-amber-600 hover:!border-amber-700 hover:!text-amber-700"
                      >
                        Escalar
                      </Button>
                    </Tooltip>
                    <Tooltip title="Aprobar esta solicitud">
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={handleAprobar}
                        loading={approvalLoading}
                        className="!bg-emerald-600 hover:!bg-emerald-700 !border-none !rounded-lg"
                      >
                        Aprobar
                      </Button>
                    </Tooltip>
                  </>
                )}
                <Button
                  type="primary"
                  onClick={onClose}
                  className="!bg-emerald-600 hover:!bg-emerald-700 !border-none !rounded-lg"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          ),
        }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Spin size="large" />
            <span className="text-slate-400 text-sm">Cargando información...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/30 p-5 rounded-2xl border border-blue-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
                  <FaShoppingCart size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag color="blue" className="!rounded-full !px-3 !font-bold !text-[10px] !border-none !m-0">
                      {esSOC ? 'SOLICITUD DE OC' : 'ORDEN DE COMPRA'}
                    </Tag>
                    <Tag color={prioridadConfig.color} className="!rounded-full !px-3 !font-bold !text-[10px] !border-none !m-0">
                      {requerimiento.prioridad}
                    </Tag>
                    {productos.length > 0 && (
                      <Button
                        icon={<FaBox size={14} />}
                        onClick={() => setProductosModalOpen(true)}
                        className="!rounded-lg !text-sm !h-9 !px-5 !bg-emerald-600 !border-emerald-600 !text-white hover:!bg-emerald-700 hover:!border-emerald-700 !font-semibold"
                      >
                        {productos.length} Producto(s)
                      </Button>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 mt-2 leading-tight">{requerimiento.titulo}</h2>
                  <p className="text-xs text-slate-500 mt-1 font-mono">{requerimiento.codigo}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <InfoCard icon={<FaRegBuilding className="text-blue-600" size={14} />} label="Cargo Solicitante" value={requerimiento.cargo} />
              <InfoCard icon={<CalendarOutlined className="text-blue-600" />} label="Fecha Requerida" value={dayjs(requerimiento.fecha_requerida).format('DD/MM/YYYY')} />
              <InfoCard icon={<UserOutlined className="text-blue-600" />} label="Solicitante" value={requerimiento.user?.name || '—'} />
            </div>

            {requerimiento.proveedor_sugerido && (
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0"><FaRegBuilding size={16} /></div>
                <div className="flex-1">
                  <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Proveedor Sugerido</p>
                  <p className="font-bold text-slate-800 text-sm">{requerimiento.proveedor_sugerido.razon_social}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-blue-500 font-bold uppercase">RUC</p>
                  <p className="text-sm text-slate-700 font-mono">{requerimiento.proveedor_sugerido.ruc}</p>
                </div>
              </div>
            )}

            {requerimiento.observaciones && (
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Observaciones</p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed italic border-l-3 border-blue-400 pl-3">{requerimiento.observaciones}</p>
              </div>
            )}

            {requerimiento.approval_state && (
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Estado de Aprobación</p>
                <div className="flex items-center gap-3">
                  <Tag color={requerimiento.approval_state === 'aprobado' ? 'success' : requerimiento.approval_state === 'en_revision' ? 'processing' : 'default'}>
                    {requerimiento.approval_state.toUpperCase()}
                  </Tag>
                  {requerimiento.approved_by && (
                    <span className="text-xs text-slate-500">
                      Aprobado por: {requerimiento.approved_by}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </ModalForm>

      <ModalShowDoc
        open={pdfModalOpen}
        setOpen={(val) => { if (!val) setPdfModalOpen(false) }}
        nro_doc={nroDoc}
        tipoDocumento="compra"
        backendPdfUrl={pdfUrl}
        backendPdfLoading={pdfLoading}
        clienteTelefonos={undefined}
        whatsappMensajeAuto={whatsappMensajeAuto}
        whatsappConfig={{
          pdfPublicUrl,
          columnas: COLUMNAS_SOC,
          defaultColumnas: ['codigo', 'cantidad', 'unidad', 'descripcion'],
          buildDetalle: (columnas) => buildDetalleSOC(productosLoaded, columnas),
        }}
      >
        <></>
      </ModalShowDoc>

      <Modal
        open={escalationModalOpen}
        onCancel={() => {
          setEscalationModalOpen(false)
          setSelectedCargo(null)
          setParentCargoInfo(null)
        }}
        title="Escalar Solicitud"
        centered
        width={500}
        footer={[
          <Button key="cancel" onClick={() => { setEscalationModalOpen(false); setSelectedCargo(null); setParentCargoInfo(null) }}>
            Cancelar
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={escalationLoading}
            onClick={handleEscalar}
            disabled={!selectedCargo || !parentCargoInfo}
            className={classOkButtonModal}
          >
            Escalar
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800">
              <strong>Nota:</strong> Esta solicitud será escalada al cargo superior en la jerarquía para su revisión y aprobación.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Cargo Actual</label>
              <div className="text-sm font-semibold text-slate-700">{requerimiento?.cargo || '—'}</div>
            </div>

            <div className="flex items-center justify-center py-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                ↑
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Escalado a</label>
              {parentCargoInfo ? (
                <div className="text-sm font-bold text-emerald-600 bg-emerald-50 p-3 rounded border border-emerald-200">
                  {parentCargoInfo.descripcion}
                </div>
              ) : (
                <div className="text-sm text-slate-400 italic">No hay cargo superior disponible</div>
              )}
            </div>
          </div>

          {parentCargoInfo && (
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-sm text-emerald-800">
              La solicitud será enviada a <strong>{parentCargoInfo.descripcion}</strong> para su aprobación
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={productosModalOpen}
        onCancel={() => setProductosModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <FaBox className="text-emerald-600" />
            <span>Productos de la Solicitud</span>
            <Tag color="green" className="!rounded-full !text-xs !border-none !m-0">
              {productos.length}
            </Tag>
          </div>
        }
        centered
        width={900}
        footer={[
          <Button key="close" type="primary" onClick={() => setProductosModalOpen(false)} className="!bg-emerald-600 hover:!bg-emerald-700 !border-none !rounded-lg">
            Cerrar
          </Button>,
        ]}
      >
        <TableWithTitle<RequerimientoInternoProducto>
          id="productos-solicitud-oc"
          title=""
          columnDefs={productosColumns}
          rowData={productos.length > 0 ? productos : productosLoaded}
          rowSelection={false}
          withNumberColumn={true}
          pagination={false}
          domLayout="autoHeight"
          exportExcel={false}
          exportPdf={false}
          selectColumns={false}
          selectionColor={greenColors[10]}
        />
      </Modal>
    </>
  )
}

/* Sub-components */

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center gap-1">
      <div className="mb-1">{icon}</div>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-tight">{label}</p>
      <p className="font-bold text-slate-700 text-sm truncate w-full">{value}</p>
    </div>
  )
}