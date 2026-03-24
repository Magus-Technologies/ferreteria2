import { create } from 'zustand'

type FiltrosArqueos = {
  fecha_inicio?: string
  fecha_fin?: string
  user_id?: string
}

type UseStoreFiltrosArqueos = {
  filtros: FiltrosArqueos
  setFiltros: (filtros: FiltrosArqueos) => void
}

export const useStoreFiltrosArqueos = create<UseStoreFiltrosArqueos>(set => ({
  filtros: {},
  setFiltros: filtros => set({ filtros }),
}))
