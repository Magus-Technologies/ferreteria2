import { create } from 'zustand'

type UseStoreModalEntregaAbiertoProps = {
  /**
   * True mientras el modal de Configurar Entrega (o su paso 2, Programar)
   * esta abierto. La lista de mis-ventas usa este flag para CONGELAR su
   * refetch: con un filtro activo (ej. Entrega: PENDIENTE), confirmar una
   * entrega invalidaria la query y la venta desapareceria de la tabla,
   * robando la seleccion y haciendo saltar el modal a otra venta. Al cerrar
   * el modal, la query (ya stale) refetchea sola y recien ahi se re-filtra.
   */
  abierto: boolean
  setAbierto: (value: boolean) => void
}

export const useStoreModalEntregaAbierto =
  create<UseStoreModalEntregaAbiertoProps>(set => {
    return {
      abierto: false,
      setAbierto: value => set({ abierto: value }),
    }
  })
