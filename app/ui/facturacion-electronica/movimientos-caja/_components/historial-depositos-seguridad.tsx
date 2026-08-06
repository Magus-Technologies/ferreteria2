"use client";

import { App } from "antd";
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { movimientoInternoApi } from "~/lib/api/movimiento-interno";
import TableWithTitle from "~/components/tables/table-with-title";
import { AgGridReact } from "ag-grid-react";
import { useColumnsDepositosSeguridad, type DepositoSeguridad } from "./columns-depositos-seguridad";
import { QueryKeys } from "~/app/_lib/queryKeys";
import FiltersDepositosSeguridad from "./filters-depositos-seguridad";

export default function HistorialDepositosSeguridad() {
    const { message } = App.useApp();
    const gridRef = useRef<AgGridReact<DepositoSeguridad>>(null);
    const [filters, setFilters] = useState<any>({
        desde: dayjs().format('YYYY-MM-DD'),
        hasta: dayjs().format('YYYY-MM-DD'),
    });

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

    // El endpoint no acepta desde/hasta — se filtra en cliente, igual que el resto
    // de tabs de esta página (Préstamos entre Vendedores, Traslados, etc.).
    const depositosFiltrados = useMemo(() => {
        return depositos.filter((d: DepositoSeguridad) => {
            if (filters.desde) {
                if (dayjs(d.fecha).isBefore(dayjs(filters.desde), 'day')) return false;
            }
            if (filters.hasta) {
                if (dayjs(d.fecha).isAfter(dayjs(filters.hasta), 'day')) return false;
            }
            if (filters.vendedor_id && d.vendedor_id !== filters.vendedor_id) return false;
            return true;
        });
    }, [depositos, filters]);

    return (
        <div className='w-full'>
            <FiltersDepositosSeguridad onFilter={handleFilter} />

            <div className='h-[500px] w-full'>
                <TableWithTitle<DepositoSeguridad>
                    id='historial-depositos-seguridad'
                    title='Depósitos de Seguridad'
                    tableRef={gridRef}
                    rowData={depositosFiltrados}
                    columnDefs={columns}
                    loading={loading}
                    rowSelection={false}
                    withNumberColumn={true}
                />
            </div>
        </div>
    );
}
