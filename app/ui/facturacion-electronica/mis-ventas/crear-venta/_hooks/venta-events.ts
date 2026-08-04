/**
 * Event emitter simple para comunicar eventos de venta
 * Evita problemas de closures stale con callbacks
 */

type VentaCreadaListener = (data: any) => void
type VentaEsperaListener = () => void
type VentaEditadaListener = () => void

class VentaEventEmitter {
  private listeners: VentaCreadaListener[] = []
  private esperaListeners: VentaEsperaListener[] = []
  private editadaListeners: VentaEditadaListener[] = []

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

  /**
   * Se dispara cuando una edición de venta se guardó exitosamente (no
   * incluye "en espera"). Lo usa CardsInfoVenta para, si la venta ya tenía
   * un cobro previo y quedó una diferencia pendiente, abrir el modal de
   * "Cobrar/Devolver Diferencia" recién DESPUÉS de guardar los cambios de
   * productos — la diferencia se calcula server-side sobre el total ya
   * persistido, así que no puede resolverse antes de guardar.
   */
  onEditada(listener: VentaEditadaListener) {
    this.editadaListeners.push(listener)
    return () => {
      this.editadaListeners = this.editadaListeners.filter(l => l !== listener)
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

  emitEditada() {
    this.editadaListeners.forEach(listener => {
      try {
        listener()
      } catch (error) {
        console.error('Error en listener de ventaEditada:', error)
      }
    })
  }
}

// Instancia singleton
export const ventaEvents = new VentaEventEmitter()
