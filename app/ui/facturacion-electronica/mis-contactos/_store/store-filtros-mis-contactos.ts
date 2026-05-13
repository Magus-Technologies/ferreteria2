import { create } from "zustand";
import { TipoCliente } from "~/lib/api/cliente";

interface FiltrosMisContactos {
  search?: string;
  tipo_cliente?: TipoCliente;
  con_recomendaciones?: boolean;
  calificacion?: string;
  ordenar_por_frecuencia?: boolean;
  page?: number;
  per_page?: number;
}

interface StoreFiltrosMisContactos {
  filtros: FiltrosMisContactos;
  setFiltros: (nuevosFiltros: Partial<FiltrosMisContactos>) => void;
  limpiarFiltros: () => void;
}

const filtrosIniciales: FiltrosMisContactos = {
  search: "",
  tipo_cliente: undefined,
  con_recomendaciones: undefined,
  calificacion: undefined,
  ordenar_por_frecuencia: undefined,
  page: 1,
  per_page: 50,
};

export const useStoreFiltrosMisContactos = create<StoreFiltrosMisContactos>((set) => ({
  filtros: filtrosIniciales,
  setFiltros: (nuevosFiltros) =>
    set((state) => {
      const merged = { ...state.filtros, ...nuevosFiltros, page: nuevosFiltros.page ?? 1 }
      // Limpiar keys que llegaron como undefined
      Object.keys(nuevosFiltros).forEach((k) => {
        if ((nuevosFiltros as any)[k] === undefined) delete (merged as any)[k]
      })
      return { filtros: merged }
    }),
  limpiarFiltros: () => set({ filtros: filtrosIniciales }),
}));
