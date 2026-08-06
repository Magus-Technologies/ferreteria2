"use client";

import { App } from "antd";
import { DollarOutlined } from "@ant-design/icons";
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { movimientoInternoApi } from "~/lib/api/movimiento-interno";
import { transaccionesCajaApi } from "~/lib/api/transacciones-caja";
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

    const { data: depositos = [], isLoading: loading, refetch } = useQuery({
        queryKey: [QueryKeys.MOVIMIENTOS_INTERNOS, 'depositos-seguridad', filters],
        queryFn: async () => {
            try {
                const response = await movimientoInternoApi.listarDepositosSeguridad();

                if (response.error) {
                    message.error(response.error.message || "Error al cargar movimientos entre cajas");
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
                message.error("Error al cargar movimientos entre cajas");
                return [];
            }
        },
        refetchOnMount: 'always',
        staleTime: 0,
    });

    const handleAnular = async (id: string) => {
        try {
            const response = await transaccionesCajaApi.anularMovimientoInterno(id);
            if (response.error) {
                message.error(response.error.message || "Error al anular el movimiento");
                return;
            }
            message.success("Movimiento anulado");
            refetch();
        } catch (error: any) {
            message.error(error?.message || "Error al anular el movimiento");
        }
    };

    const columns = useColumnsDepositosSeguridad({ onAnular: handleAnular });

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

    const totalMonto = depositosFiltrados
        .filter((d: DepositoSeguridad) => d.estado !== 'anulado')
        .reduce((sum: number, d: DepositoSeguridad) => sum + Number(d.monto), 0);

    return (
        <div className='w-full flex flex-col gap-3'>
            <div className='flex justify-between items-end'>
                <FiltersDepositosSeguridad onFilter={handleFilter} />

                <div className='p-2 px-4 bg-amber-50 border border-amber-200 rounded-lg inline-block text-right mb-4'>
                    <div className='flex items-center gap-4 justify-end'>
                        <span className='text-xs text-slate-500 font-medium uppercase tracking-wider'>
                            Total:
                        </span>
                        <span className='text-lg font-bold text-amber-600'>
                            <DollarOutlined className='mr-1' />
                            S/ {totalMonto.toFixed(2)}
                        </span>
                    </div>
                    <p className='text-[10px] text-slate-400 leading-none mt-1'>
                        {depositosFiltrados.length} movimiento{depositosFiltrados.length !== 1 ? 's' : ''} filtrado{depositosFiltrados.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            <div className='h-[500px] w-full'>
                <TableWithTitle<DepositoSeguridad>
                    id='historial-depositos-seguridad'
                    title='Movimiento entre Cajas'
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
