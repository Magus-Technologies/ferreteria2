import { create } from "zustand";

// TODO: Reemplazar con Prisma.CotizacionWhereInput cuando se cree el modelo
type PrestamoWhereInput = {
  almacen_id?: number;
  cliente_id?: number;
  fecha?: {
    gte?: Date;
    lte?: Date;
  };
  numero?: string;
  [key: string]: unknown;
};

type UseStoreFiltrosMisPrestamos = {
  filtros: PrestamoWhereInput;
  setFiltros: (filtros: PrestamoWhereInput) => void;
};

export const useStoreFiltrosMisCotizaciones =
  create<UseStoreFiltrosMisPrestamos>((set) => ({
    filtros: {},
    setFiltros: (filtros) => set({ filtros }),
  }));
