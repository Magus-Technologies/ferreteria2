import { create } from "zustand";
import { TipoCliente } from "~/lib/api/cliente";
import dayjs from "dayjs";

interface FiltrosMisContactos {
  search?: string;
  tipo_cliente?: TipoCliente;
  fecha_desde?: string;
  fecha_hasta?: string;
  con_recomendaciones?: boolean;
  page?: number;
  per_page?: number;
}

interface StoreFiltrosMisContactos {
  filtros: FiltrosMisContactos;
  setFiltros: (nuevosFiltros: Partial<FiltrosMisContactos>) => void;
  limpiarFiltros: () => void;
}

const hoy = dayjs().format("YYYY-MM-DD");

const filtrosIniciales: FiltrosMisContactos = {
  search: "",
  tipo_cliente: undefined,
  fecha_desde: hoy,
  fecha_hasta: hoy,
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
        page: nuevosFiltros.page !== undefined ? nuevosFiltros.page : 1,
      },
    })),
  limpiarFiltros: () => set({ filtros: filtrosIniciales }),
}));
