/**
 * Event emitter simple para comunicar eventos de venta
 * Evita problemas de closures stale con callbacks
 */

type VentaCreadaListener = (data: any) => void
type VentaEsperaListener = () => void

class VentaEventEmitter {
  private listeners: VentaCreadaListener[] = []
  private esperaListeners: VentaEsperaListener[] = []

  on(listener: VentaCreadaListener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  onEspera(listener: VentaEsperaListener) {
    this.esperaListeners.push(listener)
    return () => {
      this.esperaListeners = this.esperaListeners.filter(l => l !== listener)
    }
  }

  emit(data: any) {
    this.listeners.forEach(listener => {
      try {
        listener(data)
      } catch (error) {
        console.error('Error en listener de ventaCreada:', error)
      }
    })
  }

  emitEspera() {
    this.esperaListeners.forEach(listener => {
      try {
        listener()
      } catch (error) {
        console.error('Error en listener de ventaEspera:', error)
      }
    })
  }
}

// Instancia singleton
export const ventaEvents = new VentaEventEmitter()
