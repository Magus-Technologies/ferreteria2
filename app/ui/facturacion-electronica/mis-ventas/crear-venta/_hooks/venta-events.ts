/**
 * Event emitter simple para comunicar eventos de venta
 * Evita problemas de closures stale con callbacks
 */

type VentaCreadaListener = (data: any) => void

class VentaEventEmitter {
  private listeners: VentaCreadaListener[] = []

  on(listener: VentaCreadaListener) {
    console.log('📡 Registrando listener de ventaCreada')
    this.listeners.push(listener)

    // Retornar función de cleanup
    return () => {
      console.log('🧹 Removiendo listener de ventaCreada')
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  emit(data: any) {
    console.log('📢 Emitiendo evento ventaCreada, listeners:', this.listeners.length)
    this.listeners.forEach(listener => {
      try {
        listener(data)
      } catch (error) {
        console.error('Error en listener de ventaCreada:', error)
      }
    })
  }
}

// Instancia singleton
export const ventaEvents = new VentaEventEmitter()
