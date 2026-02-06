import { create } from "zustand";

interface FiltrosMisNotasCredito {
  desde?: string;
  hasta?: string;
  estado_sunat?: string;
  serie?: string;
  numero?: number;
}

interface StoreFiltrosMisNotasCredito {
  filtros: FiltrosMisNotasCredito;
  setFiltros: (filtros: FiltrosMisNotasCredito) => void;
}

export const useStoreFiltrosMisNotasCredito = create<StoreFiltrosMisNotasCredito>(
  (set) => ({
    filtros: {},
    setFiltros: (filtros) => set({ filtros }),
  })
);
