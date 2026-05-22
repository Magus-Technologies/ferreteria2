"use client";

import { createContext, useContext, ReactNode, useState } from "react";
import { useCuadres, MovimientoCuadre } from "../_hooks/use-cuadres";

export interface CuadresPdfData {
    id: number;
    tipo_documento: 'Ingreso' | 'Salida';
    serie: number;
    numero: number;
}

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
    anular: (headerId: number) => Promise<void>;
    // Modal PDF
    pdfOpen: boolean;
    setPdfOpen: (open: boolean) => void;
    pdfData: CuadresPdfData | null;
    openPdf: (row: MovimientoCuadre) => void;
}

const CuadresContext = createContext<CuadresContextType | undefined>(undefined);

export function CuadresProvider({ children }: { children: ReactNode }) {
    const cuadres = useCuadres();
    const [pdfOpen, setPdfOpen] = useState(false);
    const [pdfData, setPdfData] = useState<CuadresPdfData | null>(null);

    const openPdf = (row: MovimientoCuadre) => {
        setPdfData({
            id: row.headerId,
            tipo_documento: row.tipo_documento === 'in' ? 'Ingreso' : 'Salida',
            serie: row.serie,
            numero: row.numeroRaw,
        });
        setPdfOpen(true);
    };

    return (
        <CuadresContext.Provider value={{ ...cuadres, pdfOpen, setPdfOpen, pdfData, openPdf }}>
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
