'use client'

import { useEffect, useState } from 'react'
import { Modal, App } from 'antd'
import { useAuth } from '~/lib/auth-context'
import { cumpleanosApi, CumpleanosUsuario } from '~/lib/api/cumpleanos'

const SESSION_KEY_PREFIX = 'birthday_alert_shown_'

export default function BirthdayAlert() {
  const { user } = useAuth()
  const { notification } = App.useApp()
  const [birthdayUser, setBirthdayUser] = useState<CumpleanosUsuario | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (!user?.id) return

    // Solo mostrar 1 vez al día por usuario
    const sessionKey = `${SESSION_KEY_PREFIX}${user.id}`
    const shown = sessionStorage.getItem(sessionKey)
    if (shown === new Date().toDateString()) return

    const fetchCumpleanos = async () => {
      try {
        const res = await cumpleanosApi.getProximos()

        if (res.error) return

        const datos = res.data?.data || []
        if (datos.length === 0) return

        sessionStorage.setItem(sessionKey, new Date().toDateString())

        // Separar: cumpleaños de hoy vs próximos
        const cumpleHoy = datos.filter((d: CumpleanosUsuario) => d.tipo === 'hoy')
        const cumpleProximo = datos.filter((d: CumpleanosUsuario) => d.tipo !== 'hoy')

        // Mostrar modal para cumpleaños de HOY
        if (cumpleHoy.length > 0) {
          const esElUsuario = cumpleHoy.find((c: CumpleanosUsuario) => c.id === user.id)
          setBirthdayUser(esElUsuario || cumpleHoy[0])
          setModalOpen(true)

          cumpleHoy
            .filter((c: CumpleanosUsuario) => c.id !== (esElUsuario?.id || cumpleHoy[0].id))
            .forEach((c: CumpleanosUsuario, i: number) => {
              setTimeout(() => {
                notification.success({
                  message: 'Cumplea\u00f1os Hoy',
                  description: `Hoy es el cumplea\u00f1os de ${c.nombre}. Cumple ${c.edad} a\u00f1os!`,
                  placement: 'topRight',
                  duration: 15,
                })
              }, (i + 1) * 2000)
            })
        }

        // Notificaciones para próximos cumpleaños (3 y 7 días)
        cumpleProximo.forEach((c: CumpleanosUsuario, i: number) => {
          const delay = cumpleHoy.length > 0 ? (cumpleHoy.length + i) * 2000 : i * 1500
          setTimeout(() => {
            notification.info({
              message: c.dias_restantes <= 3
                ? `Cumplea\u00f1os en ${c.dias_restantes} d\u00eda${c.dias_restantes > 1 ? 's' : ''}`
                : 'Cumplea\u00f1os Pr\u00f3ximo',
              description: `${c.nombre} cumple ${c.edad} a\u00f1os en ${c.dias_restantes} d\u00eda${c.dias_restantes > 1 ? 's' : ''} (${c.fecha_nacimiento})`,
              placement: 'topRight',
              duration: 12,
            })
          }, delay + 1000)
        })
      } catch (err) {
        console.error('[BirthdayAlert] Error:', err)
      }
    }

    const timer = setTimeout(fetchCumpleanos, 2000)
    return () => clearTimeout(timer)
  }, [user?.id, notification]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!birthdayUser) return null

  const esElMismoUsuario = birthdayUser.id === user?.id

  return (
    <Modal
      open={modalOpen}
      onCancel={() => setModalOpen(false)}
      footer={null}
      centered
      width={480}
      closable
      styles={{
        content: {
          padding: 0,
          borderRadius: 16,
          overflow: 'hidden',
        },
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '40px 32px',
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Confeti decorativo */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
          {['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'].map(
            (color, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: 8 + (i % 3) * 4,
                  height: 8 + (i % 3) * 4,
                  backgroundColor: color,
                  borderRadius: i % 2 === 0 ? '50%' : '2px',
                  top: `${10 + (i * 13) % 80}%`,
                  left: `${5 + (i * 17) % 90}%`,
                  opacity: 0.7,
                  transform: `rotate(${i * 45}deg)`,
                  animation: `confetti-float ${2 + (i % 3)}s ease-in-out infinite alternate`,
                }}
              />
            )
          )}
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>
            {esElMismoUsuario ? '🎂' : '🎉'}
          </div>

          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              margin: '0 0 8px',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            {esElMismoUsuario ? '\u00a1Feliz Cumplea\u00f1os!' : '\u00a1Cumplea\u00f1os Hoy!'}
          </h1>

          <p style={{ fontSize: 20, margin: '0 0 4px', fontWeight: 600 }}>
            {esElMismoUsuario
              ? `${birthdayUser.nombre}, hoy es tu d\u00eda especial`
              : `Hoy es el cumplea\u00f1os de ${birthdayUser.nombre}`}
          </p>

          <p style={{ fontSize: 16, opacity: 0.9, margin: '0 0 16px' }}>
            {esElMismoUsuario
              ? `Cumples ${birthdayUser.edad} a\u00f1os. \u00a1Que todos tus deseos se hagan realidad!`
              : `Cumple ${birthdayUser.edad} a\u00f1os. \u00a1No olvides felicitarle!`}
          </p>

          <div style={{ fontSize: 32, marginTop: 8 }}>
            🎈🎁🎊🥳🎈
          </div>

          <button
            onClick={() => setModalOpen(false)}
            style={{
              marginTop: 24,
              padding: '10px 32px',
              fontSize: 16,
              fontWeight: 700,
              color: '#764ba2',
              backgroundColor: 'white',
              border: 'none',
              borderRadius: 24,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {esElMismoUsuario ? 'Gracias!' : 'Entendido'}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes confetti-float {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(-15px) rotate(180deg); }
        }
      `}</style>
    </Modal>
  )
}
