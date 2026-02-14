"use client";

import { App } from "antd";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { movimientoInternoApi } from "~/lib/api/movimiento-interno";
import TableBase from "~/components/tables/table-base";
import { AgGridReact } from "ag-grid-react";
import { useColumnsDepositosSeguridad, type DepositoSeguridad } from "./columns-depositos-seguridad";
import { QueryKeys } from "~/app/_lib/queryKeys";
import FiltersDepositosSeguridad from "./filters-depositos-seguridad";

export default function HistorialDepositosSeguridad() {
    const { message } = App.useApp();
    const gridRef = useRef<AgGridReact<DepositoSeguridad>>(null);
    const [filters, setFilters] = useState<any>({});

    const { data: depositos = [], isLoading: loading } = useQuery({
        queryKey: [QueryKeys.MOVIMIENTOS_INTERNOS, 'depositos-seguridad', filters],
        queryFn: async () => {
            try {
                const response = await movimientoInternoApi.listarDepositosSeguridad();
                
                if (response.error) {
                    message.error(response.error.message || "Error al cargar depósitos de seguridad");
                    return [];
                }
                
                // apiRequest devuelve {data: backendResponse}
                // El backend responde {success: true, data: [...]}
                // Entonces response.data = {success: true, data: [...]}
                const backendData = response.data as any;
                
                if (backendData && typeof backendData === 'object' && 'data' in backendData) {
                    return backendData.data || [];
                }
                
                // Si por alguna razón response.data ya es el array directamente
                if (Array.isArray(backendData)) {
                    return backendData;
                }
                
                return [];
            } catch (error) {
                console.error('Error al cargar depósitos:', error);
                message.error("Error al cargar depósitos de seguridad");
                return [];
            }
        },
        refetchOnMount: 'always',
        staleTime: 0,
    });

    const columns = useColumnsDepositosSeguridad();

    const handleFilter = (newFilters: any) => {
        setFilters(newFilters);
    };

    return (
        <div className='w-full'>
            <FiltersDepositosSeguridad onFilter={handleFilter} />

            <div className='flex justify-between items-center mb-4'>
                <div>
                    <div className='text-lg font-semibold text-slate-700'>
                        Depósitos de Seguridad
                    </div>
                </div>
            </div>

            <div className='h-[500px] w-full'>
                <TableBase<DepositoSeguridad>
                    ref={gridRef}
                    rowData={depositos}
                    columnDefs={columns}
                    loading={loading}
                    rowSelection={false}
                    withNumberColumn={true}
                    headerColor='var(--color-amber-600)'
                />
            </div>
        </div>
    );
}
