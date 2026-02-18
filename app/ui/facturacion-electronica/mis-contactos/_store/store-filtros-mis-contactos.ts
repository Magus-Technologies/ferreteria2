import { create } from "zustand";
import { TipoCliente } from "~/lib/api/cliente";

interface FiltrosMisContactos {
  search?: string;
  tipo_cliente?: TipoCliente;
  estado?: boolean;
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
  estado: undefined,
  page: 1,
  per_page: 50,
};

export const useStoreFiltrosMisContactos = create<StoreFiltrosMisContactos>((set) => ({
  filtros: filtrosIniciales,
  
  setFiltros: (nuevosFiltros) =>
    set((state) => ({
      filtros: {
        ...state.filtros,
        ...nuevosFiltros,
        // Resetear página cuando se cambian otros filtros
        page: nuevosFiltros.page !== undefined ? nuevosFiltros.page : 1,
      },
    })),
    
  limpiarFiltros: () =>
    set({
      filtros: filtrosIniciales,
    }),
}));