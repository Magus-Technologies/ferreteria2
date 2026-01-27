"use client";

import { App } from "antd";
import { useEffect, useState, useRef } from "react";
import { movimientoInternoApi } from "~/lib/api/movimiento-interno";
import TableBase from "~/components/tables/table-base";
import { AgGridReact } from "ag-grid-react";
import { useColumnsDepositosSeguridad, type DepositoSeguridad } from "./columns-depositos-seguridad";

export default function HistorialDepositosSeguridad() {
    const { message } = App.useApp();
    const [depositos, setDepositos] = useState<DepositoSeguridad[]>([]);
    const [loading, setLoading] = useState(false);
    const gridRef = useRef<AgGridReact<DepositoSeguridad>>(null);

    const cargarDepositos = async () => {
        setLoading(true);
        try {
            const response = await movimientoInternoApi.listarDepositosSeguridad();
            if (response.data) {
                setDepositos(response.data);
            }
        } catch (error) {
            message.error("Error al cargar depósitos de seguridad");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDepositos();
    }, []);

    const columns = useColumnsDepositosSeguridad();

    return (
        <div className='w-full'>
            <div className='flex justify-between items-center mb-4'>
                <div>
                    <div className='text-lg font-semibold text-slate-700'>
                        Depósitos de Seguridad
                    </div>
                    <p className='text-sm text-slate-600 mt-1'>
                        Historial de depósitos de efectivo a banco/billetera para seguridad
                    </p>
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
