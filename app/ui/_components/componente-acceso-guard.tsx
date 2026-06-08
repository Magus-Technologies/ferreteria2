'use client'

import { useState, useEffect, useRef } from 'react'
import { Button, message } from 'antd'
import { FaLock, FaUserShield } from 'react-icons/fa'
import { useAuth } from '~/lib/auth-context'
import { autorizacionesApi } from '~/lib/api/autorizaciones'
import ModalSupervisorOverride from '~/app/_components/modals/modal-supervisor-override'

/**
 * Versión a escala de componente del AccesoGuard de vistas. Si el componente
 * (card, filtro, etc.) está marcado como "Requiere autorización" para el rol del
 * usuario y aún no la tiene concedida, en lugar de renderizarlo lo muestra
 * bloqueado (difuminado + candado) con un botón para solicitar autorización a su
 * superior, o autorizar en sitio con clave de supervisor.
 *
 * Reutiliza exactamente el mismo flujo y datos que las vistas: `auth_required` /
 * `auth_granted` del payload del usuario, y accion='acceso'.
 */
export default function ComponenteAccesoGuard({
  componentId,
  children,
}: {
  componentId: string
  children: React.ReactNode
}) {
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [solicitada, setSolicitada] = useState(false)
  const [overrideOpen, setOverrideOpen] = useState(false)
  const consumidoRef = useRef(false)

  const required = (user?.auth_required ?? []).includes(componentId)
  const granted = (user?.auth_granted ?? []).includes(componentId)
  const bloqueada = required && !granted
  const concedida = required && granted

  // Si estaba concedida, intentar consumirla (solo afecta a las de uso único).
  useEffect(() => {
    if (concedida && !consumidoRef.current) {
      consumidoRef.current = true
      autorizacionesApi.consumir({ modulo: componentId, accion: 'acceso' }).catch(() => {})
    }
  }, [concedida, componentId])

  if (!bloqueada) return <>{children}</>

  const solicitar = async () => {
    setLoading(true)
    try {
      const res = await autorizacionesApi.solicitar({
        modulo: componentId,
        accion: 'acceso',
        descripcion: 'Solicita acceso a un componente restringido',
      })
      if (res.data) {
        message.success('Solicitud enviada. Recibirás acceso cuando sea aprobada.')
        setSolicitada(true)
      } else {
        message.error(res.error?.message || 'No se pudo enviar la solicitud')
      }
    } catch {
      message.error('Error al enviar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full">
      {/* Contenido real difuminado, sin interacción */}
      <div className="opacity-30 blur-[2px] pointer-events-none select-none">
        {children}
      </div>

      {/* Overlay de bloqueo */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-amber-300 bg-white/70 p-3 text-center">
        <FaLock className="text-amber-500" size={18} />
        <span className="text-xs font-semibold text-gray-700">Requiere autorización</span>
        {solicitada ? (
          <Button size="small" onClick={() => refreshUser()}>
            Ya me aprobaron, reintentar
          </Button>
        ) : (
          <Button size="small" type="primary" loading={loading} onClick={solicitar}>
            Solicitar autorización
          </Button>
        )}
        <Button
          size="small"
          type="link"
          icon={<FaUserShield />}
          onClick={() => setOverrideOpen(true)}
        >
          Clave de supervisor
        </Button>
      </div>

      <ModalSupervisorOverride
        open={overrideOpen}
        setOpen={setOverrideOpen}
        modulo={componentId}
        accion="acceso"
        onSuccess={() => refreshUser()}
      />
    </div>
  )
}
