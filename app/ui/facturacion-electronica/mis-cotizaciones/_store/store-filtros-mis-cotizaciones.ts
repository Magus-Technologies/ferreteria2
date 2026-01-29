import { create } from "zustand";

// TODO: Reemplazar con Prisma.CotizacionWhereInput cuando se cree el modelo
type CotizacionWhereInput = {
  almacen_id?: number;
  cliente_id?: number;
  fecha?: {
    gte?: Date;
    lte?: Date;
  };
  numero?: string;
  [key: string]: unknown;
};

type UseStoreFiltrosMisCotizaciones = {
  filtros: CotizacionWhereInput;
  setFiltros: (filtros: CotizacionWhereInput) => void;
};

export const useStoreFiltrosMisCotizaciones =
  create<UseStoreFiltrosMisCotizaciones>((set) => ({
    filtros: {},
    setFiltros: (filtros) => set({ filtros }),
  }));
