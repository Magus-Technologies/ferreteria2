"use client";

import { Table, Tag } from "antd";
import { useEffect, useState } from "react";
import { movimientoInternoApi, type DepositoSeguridad } from "~/lib/api/movimiento-interno";
import { message } from "antd";

const formatCurrency = (amount: number) => {
    return `S/ ${amount.toFixed(2)}`;
};

export default function HistorialDepositosSeguridad() {
    const [depositos, setDepositos] = useState<DepositoSeguridad[]>([]);
    const [loading, setLoading] = useState(false);

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

    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 100,
            render: (id: string) => id.substring(0, 8) + "...",
        },
        {
            title: "Vendedor",
            dataIndex: "vendedor",
            key: "vendedor",
        },
        {
            title: "Origen",
            dataIndex: "sub_caja_origen",
            key: "origen",
            render: (origen: string) => (
                <div>
                    <div className="font-medium">{origen}</div>
                    <div className="text-xs text-gray-500">Efectivo</div>
                </div>
            ),
        },
        {
            title: "Destino",
            key: "destino",
            render: (_: any, record: DepositoSeguridad) => (
                <div>
                    <div className="font-medium">{record.sub_caja_destino}</div>
                    <div className="text-xs text-gray-500">
                        {record.metodo_destino} - {record.banco_destino}
                    </div>
                    {record.titular && (
                        <div className="text-xs text-gray-400">
                            Titular: {record.titular}
                        </div>
                    )}
                </div>
            ),
        },
        {
            title: "Monto",
            dataIndex: "monto",
            key: "monto",
            render: (monto: number) => (
                <span className="font-semibold text-green-600">
                    {formatCurrency(monto)}
                </span>
            ),
        },
        {
            title: "Motivo",
            dataIndex: "motivo",
            key: "motivo",
            render: (motivo: string) => (
                <span className="text-sm">{motivo || "-"}</span>
            ),
        },
        {
            title: "Tipo",
            dataIndex: "tipo",
            key: "tipo",
            render: () => <Tag color="blue">DEPÓSITO SEGURIDAD</Tag>,
        },
        {
            title: "Fecha",
            dataIndex: "fecha",
            key: "fecha",
            render: (fecha: string) => new Date(fecha).toLocaleString("es-PE"),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-gray-600">
                    Historial de depósitos de efectivo a banco/billetera para seguridad
                </p>
            </div>

            <Table
                columns={columns}
                dataSource={depositos}
                loading={loading}
                rowKey="id"
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total: ${total} depósitos`,
                }}
            />
        </div>
    );
}
