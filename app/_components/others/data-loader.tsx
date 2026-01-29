'use client'

import { PropsWithChildren, useEffect, useState } from 'react'
import { Spin } from 'antd'

interface DataLoaderProps extends PropsWithChildren {
  delay?: number
  fallback?: React.ReactNode
  priority?: 'high' | 'medium' | 'low'
}

/**
 * Componente optimizado para cargar datos de forma escalonada
 * Evita que todos los componentes carguen datos al mismo tiempo
 */
export default function DataLoader({
  children,
  delay = 0,
  fallback = <Spin size="small" />,
  priority = 'medium'
}: DataLoaderProps) {
  const [canLoad, setCanLoad] = useState(false)

  useEffect(() => {
    // Escalonar las cargas según la prioridad
    const priorityDelays = {
      high: 0,
      medium: 100,
      low: 300
    }

    const totalDelay = delay + priorityDelays[priority]

    const timer = setTimeout(() => {
      setCanLoad(true)
    }, totalDelay)

    return () => clearTimeout(timer)
  }, [delay, priority])

  if (!canLoad) {
    return <>{fallback}</>
  }

  return <>{children}</>
}