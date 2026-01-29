'use client'

import { PropsWithChildren, useEffect, useState } from 'react'
import { Spin } from 'antd'

interface ProgressiveLoaderProps extends PropsWithChildren {
  delay?: number
  identifier: string
  priority?: 'critical' | 'high' | 'medium' | 'low'
  fallback?: React.ReactNode
}

// Singleton para controlar orden de carga
class LoaderQueue {
  private static instance: LoaderQueue
  private loadedItems = new Set<string>()
  private pendingItems: Array<{ id: string; callback: () => void; priority: number }> = []
  private isProcessing = false

  static getInstance() {
    if (!LoaderQueue.instance) {
      LoaderQueue.instance = new LoaderQueue()
    }
    return LoaderQueue.instance
  }

  private getPriorityValue(priority: string) {
    const priorities = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3
    }
    return priorities[priority as keyof typeof priorities] || 2
  }

  addToQueue(id: string, callback: () => void, priority: string, delay: number) {
    if (this.loadedItems.has(id)) return

    const priorityValue = this.getPriorityValue(priority)
    this.pendingItems.push({ id, callback, priority: priorityValue })
    this.pendingItems.sort((a, b) => a.priority - b.priority)

    if (!this.isProcessing) {
      this.processQueue(delay)
    }
  }

  private async processQueue(baseDelay: number) {
    this.isProcessing = true

    for (const item of this.pendingItems) {
      if (!this.loadedItems.has(item.id)) {
        await new Promise(resolve => setTimeout(resolve, baseDelay))
        this.loadedItems.add(item.id)
        item.callback()
      }
    }

    this.pendingItems = []
    this.isProcessing = false
  }

  isLoaded(id: string) {
    return this.loadedItems.has(id)
  }
}

/**
 * Cargador progresivo que evita avalancha de requests
 * Controla el orden y timing de carga de componentes pesados
 */
export default function ProgressiveLoader({
  children,
  identifier,
  delay = 100,
  priority = 'medium',
  fallback = <div className="flex justify-center py-4"><Spin size="small" /></div>
}: ProgressiveLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const queue = LoaderQueue.getInstance()

  useEffect(() => {
    if (queue.isLoaded(identifier)) {
      setIsLoaded(true)
      return
    }

    const timeoutId = setTimeout(() => {
      queue.addToQueue(
        identifier,
        () => setIsLoaded(true),
        priority,
        delay
      )
    }, 0) // Defer to next tick to avoid synchronous state updates

    return () => clearTimeout(timeoutId)
  }, [identifier, delay, priority, queue])

  if (!isLoaded) {
    return <>{fallback}</>
  }

  return <>{children}</>
}