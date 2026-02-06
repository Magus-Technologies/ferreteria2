import { create } from "zustand";

interface FiltrosMisFacturas {
  cliente_id?: number;
  desde?: string;
  hasta?: string;
  estado_sunat?: string;
  serie?: string;
  numero?: number;
}

interface StoreFiltrosMisFacturas {
  filtros: FiltrosMisFacturas;
  setFiltros: (filtros: FiltrosMisFacturas) => void;
}

export const useStoreFiltrosMisFacturas = create<StoreFiltrosMisFacturas>(
  (set) => ({
    filtros: {},
    setFiltros: (filtros) => set({ filtros }),
  })
);
