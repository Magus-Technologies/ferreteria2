'use client'

import { useState, useEffect, useRef } from 'react'
import { Button, Result, message, Space } from 'antd'
import { FaLock, FaUserShield } from 'react-icons/fa'
import { useAccesoVista } from '~/hooks/use-acceso-vista'
import { useAuth } from '~/lib/auth-context'
import { autorizacionesApi } from '~/lib/api/autorizaciones'
import ModalSupervisorOverride from '~/app/_components/modals/modal-supervisor-override'

/**
 * Bloquea las vistas de navegación marcadas como "Requiere autorización" para
 * el rol del usuario, mientras no tenga el acceso otorgado. En lugar del
 * contenido muestra una pantalla para solicitar el acceso a su superior
 * (organigrama / cargo / usuario, según la configuración del rol).
 *
 * Al aprobarse, el siguiente refresco del usuario incluye el acceso en
 * `auth_granted` y la vista deja de estar bloqueada.
 */
export default function AccesoGuard({ children }: { children: React.ReactNode }) {
  const { bloqueada, concedida, componentId } = useAccesoVista()
  const { refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [solicitada, setSolicitada] = useState(false)
  const [overrideOpen, setOverrideOpen] = useState(false)
  const consumidoRef = useRef(false)

  // Si la vista estaba concedida, intentar consumirla (solo afecta a las de
  // uso único). Así, si era "una sola vez", al refrescar la página vuelve el
  // candado. Para permanente/temporal es no-op.
  useEffect(() => {
    if (concedida && componentId && !consumidoRef.current) {
      consumidoRef.current = true
      autorizacionesApi.consumir({ modulo: componentId, accion: 'acceso' }).catch(() => {})
    }
  }, [concedida, componentId])

  if (!bloqueada) return <>{children}</>

  const solicitar = async () => {
    if (!componentId) return
    setLoading(true)
    try {
      const res = await autorizacionesApi.solicitar({
        modulo: componentId,
        accion: 'acceso',
        descripcion: 'Solicita acceso a una vista restringida',
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
    <div className="flex items-center justify-center h-full w-full p-6">
      <Result
        icon={<FaLock className="text-amber-500 mx-auto" size={48} />}
        title="Esta vista requiere autorización"
        subTitle={
          solicitada
            ? 'Tu solicitud fue enviada. En cuanto tu superior la apruebe podrás entrar.'
            : 'No tienes acceso a esta vista. Solicita autorización a tu superior para continuar.'
        }
        extra={
          <Space direction="vertical" align="center" size="small">
            {solicitada ? (
              <Button onClick={() => refreshUser()}>Ya me aprobaron, reintentar</Button>
            ) : (
              <Button type="primary" loading={loading} onClick={solicitar}>
                Solicitar acceso
              </Button>
            )}
            <Button
              type="link"
              icon={<FaUserShield />}
              onClick={() => setOverrideOpen(true)}
            >
              Autorizar con clave de supervisor
            </Button>
          </Space>
        }
      />

      {componentId && (
        <ModalSupervisorOverride
          open={overrideOpen}
          setOpen={setOverrideOpen}
          modulo={componentId}
          accion="acceso"
          onSuccess={() => refreshUser()}
        />
      )}
    </div>
  )
}
