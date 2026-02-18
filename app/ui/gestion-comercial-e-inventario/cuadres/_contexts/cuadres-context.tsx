"use client";

import { createContext, useContext, ReactNode } from "react";
import { useCuadres, MovimientoCuadre } from "../_hooks/use-cuadres";

interface CuadresContextType {
    ingresos: MovimientoCuadre[];
    salidas: MovimientoCuadre[];
    totals: {
        ingresosUnd: number;
        ingresosSol: number;
        salidasUnd: number;
        salidasSol: number;
        totalSol: number;
    };
    loading: boolean;
    refetch: () => void;
    handleSearch: (newFilters: any) => void;
}

const CuadresContext = createContext<CuadresContextType | undefined>(undefined);

export function CuadresProvider({ children }: { children: ReactNode }) {
    const cuadres = useCuadres();

    return (
        <CuadresContext.Provider value={cuadres}>
            {children}
        </CuadresContext.Provider>
    );
}

export function useCuadresContext() {
    const context = useContext(CuadresContext);
    if (context === undefined) {
        throw new Error("useCuadresContext must be used within a CuadresProvider");
    }
    return context;
}
