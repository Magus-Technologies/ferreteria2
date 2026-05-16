import { create } from "zustand";

export type CotizacionWhereInput = {
  almacen_id?: number;
  cliente_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  numero?: string;
  estado_cotizacion?: 'pe' | 'co' | 've' | 'ca' | 'el';
  reservar_stock?: boolean;
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
