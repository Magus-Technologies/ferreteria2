'use client'

import React, { useState } from 'react'
import { Modal, Switch, Slider, App, Spin, Divider, Tooltip, Badge } from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useModalConfiguraciones } from '~/app/_stores/store-modal-configuraciones'
import {
  configuracionNotificacionesApi,
  ConfiguracionNotificacion,
  TipoNotificacion,
} from '~/lib/api/configuracion-notificaciones'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { FaBell, FaBirthdayCake } from 'react-icons/fa'
import { MdPayment, MdLocalShipping } from 'react-icons/md'
import { BsTicketDetailedFill } from 'react-icons/bs'
import { AiFillBank } from 'react-icons/ai'
import { IoSettingsSharp } from 'react-icons/io5'

// ─── Metadatos de cada tipo de notificación ───────────────────────────────────
const TIPOS_INFO: Record<
  TipoNotificacion,
  {
    label: string
    descripcion: string
    icon: React.ReactNode
    color: string
    bg: string
    badge: string
  }
> = {
  cumpleanos: {
    label: 'Cumpleaños',
    descripcion: 'Aviso de cumpleaños de usuarios',
    icon: <FaBirthdayCake size={16} />,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    badge: 'bg-purple-100 text-purple-700',
  },
  entrega: {
    label: 'Entregas',
    descripcion: 'Entregas programadas a despachar',
    icon: <MdLocalShipping size={17} />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
  },
  pago: {
    label: 'Pagos',
    descripcion: 'Cobros y pagos pendientes',
    icon: <MdPayment size={17} />,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  vale: {
    label: 'Vales',
    descripcion: 'Vales de compra emitidos',
    icon: <BsTicketDetailedFill size={15} />,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    badge: 'bg-orange-100 text-orange-700',
  },
  caja: {
    label: 'Caja',
    descripcion: 'Apertura y cierre de caja',
    icon: <AiFillBank size={16} />,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    badge: 'bg-rose-100 text-rose-700',
  },
}

// ─── Fila de una notificación ─────────────────────────────────────────────────
function FilaNotificacion({
  config,
  onToggle,
  onDiasChange,
  onDiasChangeComplete,
  loadingTipo,
}: {
  config: ConfiguracionNotificacion
  onToggle: (tipo: TipoNotificacion, habilitado: boolean) => void
  onDiasChange: (tipo: TipoNotificacion, dias: number) => void
  onDiasChangeComplete: (tipo: TipoNotificacion, dias: number) => void
  loadingTipo: TipoNotificacion | null
}) {
  const info = TIPOS_INFO[config.tipo as TipoNotificacion]
  const isPending = loadingTipo === config.tipo
  const habilitado = config.habilitado

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        habilitado ? 'border-slate-200 shadow-sm' : 'border-slate-100 opacity-55'
      }`}
    >
      {/* Franja de color izquierda */}
      <div className='flex'>
        <div className={`w-1 flex-shrink-0 ${habilitado ? info.bg.replace('bg-', 'bg-') : 'bg-slate-100'}`}
          style={{ background: habilitado ? undefined : '#f1f5f9' }}
        />
        <div className={`flex-1 p-3.5 ${habilitado ? 'bg-white' : 'bg-slate-50'}`}>

          {/* Cabecera: icono + info + badge + switch */}
          <div className='flex items-center justify-between gap-3'>
            <div className='flex items-center gap-3'>
              {/* Icono con fondo colorido */}
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 ${info.bg} ${info.color}`}
              >
                {info.icon}
              </div>

              <div className='flex flex-col min-w-0'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <span className='font-semibold text-slate-700 text-sm leading-tight'>
                    {info.label}
                  </span>
                  {/* Badge estado */}
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                      habilitado
                        ? info.badge
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {habilitado ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>
                <span className='text-xs text-slate-400 leading-tight mt-0.5 truncate'>
                  {info.descripcion}
                </span>
              </div>
            </div>

            {/* Switch */}
            <Switch
              checked={habilitado}
              loading={isPending}
              onChange={(val) => onToggle(config.tipo as TipoNotificacion, val)}
              className={`flex-shrink-0 ${habilitado ? '!bg-emerald-500' : ''}`}
            />
          </div>

          {/* Slider de días (solo cumpleaños y habilitado) */}
          {config.tipo === 'cumpleanos' && habilitado && (
            <div className='mt-3 pt-3 border-t border-slate-100'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-xs font-semibold text-slate-500'>
                  Avisar con anticipación
                </span>
                <Tooltip
                  title={
                    config.dias_anticipacion === 0
                      ? 'Solo el día del cumpleaños'
                      : `${config.dias_anticipacion} día${config.dias_anticipacion > 1 ? 's' : ''} antes del cumpleaños`
                  }
                >
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg cursor-help ${info.badge}`}
                  >
                    {config.dias_anticipacion === 0
                      ? 'Solo el día'
                      : `${config.dias_anticipacion} día${config.dias_anticipacion > 1 ? 's' : ''} antes`}
                  </span>
                </Tooltip>
              </div>

              <div className='px-1'>
                <Slider
                  min={0}
                  max={30}
                  value={config.dias_anticipacion}
                  onChange={(val) => onDiasChange(config.tipo as TipoNotificacion, val)}
                  onChangeComplete={(val) => onDiasChangeComplete(config.tipo as TipoNotificacion, val)}
                  marks={{ 0: '0', 7: '7', 14: '14', 30: '30' }}
                  tooltip={{
                    formatter: (val) =>
                      val === 0 ? 'Solo el día' : `${val} días antes`,
                  }}
                />
              </div>

              <p className='text-xs text-slate-400 mt-2 leading-relaxed'>
                {config.dias_anticipacion === 0
                  ? 'Solo recibirás aviso el mismo día del cumpleaños.'
                  : `Recibirás un aviso cada día desde ${config.dias_anticipacion} días antes hasta el cumpleaños.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Contador de notificaciones activas ──────────────────────────────────────
function ResumenActivas({ configs }: { configs: ConfiguracionNotificacion[] }) {
  const activas = configs.filter((c) => c.habilitado).length
  const total = configs.length
  return (
    <div className='flex items-center gap-2 px-1 mb-3'>
      <div className='flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden'>
        <div
          className='h-full rounded-full bg-emerald-500 transition-all duration-500'
          style={{ width: `${(activas / total) * 100}%` }}
        />
      </div>
      <span className='text-xs text-slate-500 font-medium whitespace-nowrap'>
        {activas}/{total} activas
      </span>
    </div>
  )
}

// ─── Modal principal ──────────────────────────────────────────────────────────
export default function ModalConfiguraciones() {
  const { isOpen, closeModal } = useModalConfiguraciones()
  const { notification } = App.useApp()
  const queryClient = useQueryClient()

  const { data: configs, isLoading } = useQuery({
    queryKey: [QueryKeys.CONFIGURACION_NOTIFICACIONES],
    queryFn: async () => {
      const res = await configuracionNotificacionesApi.getAll()
      return res.data?.data ?? []
    },
    enabled: isOpen,
  })

  const [loadingTipo, setLoadingTipo] = useState<TipoNotificacion | null>(null)

  const mutation = useMutation({
    mutationFn: configuracionNotificacionesApi.guardar,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.CONFIGURACION_NOTIFICACIONES],
      })
      notification.success({
        message: 'Configuración guardada',
        description: `Notificaciones de ${TIPOS_INFO[variables.tipo].label} actualizadas`,
        duration: 2,
      })
    },
    onError: () => {
      notification.error({
        message: 'Error',
        description: 'No se pudo guardar la configuración',
      })
    },
    onSettled: () => setLoadingTipo(null),
  })

  const handleToggle = (tipo: TipoNotificacion, habilitado: boolean) => {
    const config = configs?.find((c) => c.tipo === tipo)
    setLoadingTipo(tipo)
    mutation.mutate({
      tipo,
      habilitado,
      dias_anticipacion: config?.dias_anticipacion ?? 7,
    })
  }

  const handleDiasChangeComplete = (tipo: TipoNotificacion, dias: number) => {
    const config = configs?.find((c) => c.tipo === tipo)
    setLoadingTipo(tipo)
    mutation.mutate({
      tipo,
      habilitado: config?.habilitado ?? true,
      dias_anticipacion: dias,
    })
  }

  const activasCount = configs?.filter((c) => c.habilitado).length ?? 0

  return (
    <Modal
      title={
        <div className='flex items-center gap-3'>
          <div className='flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900'>
            <IoSettingsSharp size={17} className='text-white' />
          </div>
          <div className='flex flex-col'>
            <span className='text-base font-bold text-slate-800 leading-tight'>
              Configuraciones
            </span>
            <span className='text-xs text-slate-400 font-normal leading-tight'>
              Gestiona tus notificaciones
            </span>
          </div>
          {!isLoading && configs && (
            <Badge
              count={activasCount}
              color='#10b981'
              className='ml-auto'
              title={`${activasCount} notificaciones activas`}
            />
          )}
        </div>
      }
      open={isOpen}
      onCancel={closeModal}
      footer={null}
      width={500}
      destroyOnHidden
      styles={{
        header: { paddingBottom: 12 },
        body: { paddingTop: 0, paddingBottom: 16 },
      }}
    >
      <Divider className='!mt-1 !mb-4' />

      {isLoading ? (
        <div className='flex flex-col items-center justify-center py-14 gap-3'>
          <Spin size='large' />
          <span className='text-sm text-slate-400'>Cargando configuraciones...</span>
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          {configs && <ResumenActivas configs={configs} />}

          <div className='flex flex-col gap-2.5'>
            {configs?.map((config) => (
              <FilaNotificacion
                key={config.tipo}
                config={config}
                onToggle={handleToggle}
                onDiasChange={(tipo, dias) => {
                  queryClient.setQueryData(
                    [QueryKeys.CONFIGURACION_NOTIFICACIONES],
                    (old: ConfiguracionNotificacion[] | undefined) =>
                      old?.map((c) =>
                        c.tipo === tipo ? { ...c, dias_anticipacion: dias } : c
                      ) ?? []
                  )
                }}
                onDiasChangeComplete={handleDiasChangeComplete}
                loadingTipo={loadingTipo}
              />
            ))}
          </div>

          <p className='text-center text-xs text-slate-300 mt-1'>
            Los cambios se guardan automáticamente
          </p>
        </div>
      )}
    </Modal>
  )
}
