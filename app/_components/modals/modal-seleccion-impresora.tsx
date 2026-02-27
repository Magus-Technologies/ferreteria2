'use client'

import { Modal, Select, Tag, Spin, Empty, Tooltip } from 'antd'
import { useEffect, useState } from 'react'
import { FaPrint, FaStar, FaRegStar } from 'react-icons/fa6'
import { HiRefresh } from 'react-icons/hi'
import ButtonBase from '~/components/buttons/button-base'
import { classOkButtonModal } from '~/lib/clases'
import { useStoreImpresora, TipoFormato } from '~/store/store-impresora'

interface ModalSeleccionImpresoraProps {
  open: boolean
  setOpen: (open: boolean) => void
  impresoras: string[]
  cargando: boolean
  imprimiendo: boolean
  formato: TipoFormato
  onImprimir: (nombreImpresora: string) => Promise<boolean>
  onRefrescar: () => Promise<string[]>
}

export default function ModalSeleccionImpresora({
  open,
  setOpen,
  impresoras,
  cargando,
  imprimiendo,
  formato,
  onImprimir,
  onRefrescar,
}: ModalSeleccionImpresoraProps) {
  const { getImpresoraDefault, setImpresoraDefault } = useStoreImpresora()
  const impresoraDefault = getImpresoraDefault(formato)
  const [seleccionada, setSeleccionada] = useState<string | null>(null)

  // Cuando se abre el modal, pre-seleccionar la impresora por defecto
  useEffect(() => {
    if (open) {
      setSeleccionada(impresoraDefault)
    }
  }, [open, impresoraDefault])

  const handleImprimir = async () => {
    if (!seleccionada) return
    const ok = await onImprimir(seleccionada)
    if (ok) {
      setOpen(false)
    }
  }

  const handleSetDefault = (nombre: string) => {
    setImpresoraDefault(formato, nombre)
  }

  const etiquetaFormato = formato === 'ticket' ? 'Ticket (80mm)' : 'A4'

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <FaPrint className="text-cyan-600" />
          <span>Seleccionar Impresora</span>
          <Tag color="blue">{etiquetaFormato}</Tag>
        </div>
      }
      open={open}
      onCancel={() => setOpen(false)}
      maskClosable={false}
      destroyOnHidden
      width={480}
      footer={
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">
            {impresoras.length} impresora{impresoras.length !== 1 ? 's' : ''} encontrada{impresoras.length !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <ButtonBase
              color="default"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </ButtonBase>
            <ButtonBase
              color="success"
              size="sm"
              onClick={handleImprimir}
              disabled={!seleccionada || imprimiendo}
            >
              {imprimiendo ? (
                <span className="flex items-center gap-2">
                  <Spin size="small" /> Imprimiendo...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FaPrint /> Imprimir
                </span>
              )}
            </ButtonBase>
          </div>
        </div>
      }
    >
      <div className="py-3 flex flex-col gap-4">
        {/* Selector de impresora */}
        <div>
          <label className="block text-sm font-medium mb-1.5 text-gray-700">
            Impresora
          </label>
          <div className="flex gap-2">
            <Select
              className="flex-1"
              placeholder={cargando ? 'Buscando impresoras...' : 'Selecciona una impresora'}
              value={seleccionada}
              onChange={setSeleccionada}
              loading={cargando}
              disabled={cargando}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={impresoras.map((imp) => ({
                value: imp,
                label: imp,
              }))}
              notFoundContent={
                cargando ? (
                  <div className="py-4 text-center">
                    <Spin size="small" />
                    <p className="text-xs text-gray-400 mt-2">Buscando impresoras...</p>
                  </div>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No se encontraron impresoras"
                  />
                )
              }
            />
            <Tooltip title="Refrescar impresoras">
              <ButtonBase
                color="info"
                size="sm"
                onClick={onRefrescar}
                disabled={cargando}
                className="!px-2.5"
              >
                <HiRefresh className={cargando ? 'animate-spin' : ''} />
              </ButtonBase>
            </Tooltip>
          </div>
        </div>

        {/* Impresora por defecto */}
        {seleccionada && (
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
              seleccionada === impresoraDefault
                ? 'bg-amber-50 border border-amber-200'
                : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
            }`}
            onClick={() => {
              if (seleccionada !== impresoraDefault) {
                handleSetDefault(seleccionada)
              }
            }}
          >
            {seleccionada === impresoraDefault ? (
              <FaStar className="text-amber-500 text-base flex-shrink-0" />
            ) : (
              <FaRegStar className="text-gray-400 text-base flex-shrink-0" />
            )}
            <span className={`text-sm ${seleccionada === impresoraDefault ? 'text-amber-700 font-medium' : 'text-gray-600'}`}>
              {seleccionada === impresoraDefault
                ? `Predeterminada para ${etiquetaFormato}`
                : 'Click para establecer como predeterminada'}
            </span>
          </div>
        )}

        {/* Info QZ Tray */}
        <div className="text-xs text-gray-400 border-t pt-2 mt-1">
          Impresión directa via QZ Tray. Si no ves tu impresora, verifica que esté
          encendida y conectada al equipo.
        </div>
      </div>
    </Modal>
  )
}
