/**
 * Bus de eventos realtime (pub-sub en memoria).
 *
 * `use-realtime.ts` ya mantiene UN solo listener sobre el canal `model-changes`
 * y se encarga de invalidar las queries de React Query.
 *
 * Este bus permite que otros componentes escuchen el mismo evento sin abrir
 * un segundo listener de Echo (que duplicaría handlers y rompería el cleanup
 * compartido del canal).
 */

export interface ModelChangedPayload {
  module: string
  action: string
  record_id: string | null
  user_id: string | null
  timestamp: string
}

type Listener = (payload: ModelChangedPayload) => void

const listeners = new Set<Listener>()

export function emitModelChanged(payload: ModelChangedPayload): void {
  for (const fn of listeners) {
    try {
      fn(payload)
    } catch {
      // no romper el resto de suscriptores si uno falla
    }
  }
}

export function subscribeModelChanged(fn: Listener): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
