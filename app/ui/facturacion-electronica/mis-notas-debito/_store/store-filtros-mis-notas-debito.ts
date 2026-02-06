import { create } from "zustand";

interface FiltrosMisNotasDebito {
  desde?: string;
  hasta?: string;
  estado_sunat?: string;
  serie?: string;
  numero?: number;
}

interface StoreFiltrosMisNotasDebito {
  filtros: FiltrosMisNotasDebito;
  setFiltros: (filtros: FiltrosMisNotasDebito) => void;
}

export const useStoreFiltrosMisNotasDebito = create<StoreFiltrosMisNotasDebito>(
  (set) => ({
    filtros: {},
    setFiltros: (filtros) => set({ filtros }),
  })
);
