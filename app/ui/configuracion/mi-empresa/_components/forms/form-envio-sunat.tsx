"use client";

import { useState } from "react";
import {
    Card,
    Switch,
    Button,
    Typography,
    Space,
    App,
    Spin,
    Alert,
    InputNumber,
} from "antd";
import {
    SaveOutlined,
    InfoCircleOutlined,
    WarningOutlined,
    HistoryOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { configuracionApi, type AutoSendConfig } from "../../../../../../lib/api/configuracion";
import { QueryKeys } from "../../../../../_lib/queryKeys";
import { type ApiResponse } from "../../../../../../lib/api";

const { Text, Paragraph } = Typography;

export default function FormEnvioSunat() {
    const { message } = App.useApp();
    const queryClient = useQueryClient();

    // Estados locales para Factura y Boleta
    const [facturaConfig, setFacturaConfig] = useState<AutoSendConfig>({ enabled: false, after_days: 3 });
    const [boletaConfig, setBoletaConfig] = useState<AutoSendConfig>({ enabled: false, after_days: 0 });

    // Cargar configuración desde la API
    const { isLoading } = useQuery({
        queryKey: [QueryKeys.CONFIGURACION, "auto-send-status"],
        queryFn: async () => {
            const response = await configuracionApi.getAutoSendStatus();
            if (response.data) {
                setFacturaConfig(response.data.factura);
                setBoletaConfig(response.data.boleta);
            }
            return response;
        },
        staleTime: 0,
    });

    // Mutación para guardar cambios
    const updateMutation = useMutation({
        mutationFn: (data: { type: 'factura' | 'boleta', config: AutoSendConfig }) =>
            configuracionApi.updateAutoSendStatus({
                type: data.type as any, // casting simple para compatibilidad de tipos en la llamada
                config: data.config
            }),
        onSuccess: (response: ApiResponse<{ message: string }>) => {
            if (response.data) {
                message.success("Configuración actualizada correctamente");
                queryClient.invalidateQueries({ queryKey: [QueryKeys.CONFIGURACION] });
            } else {
                message.error(response.error?.message || "Error al actualizar la configuración");
            }
        },
        onError: () => {
            message.error("Error de red al actualizar la configuración");
        },
    });

    const handleSave = (type: 'factura' | 'boleta') => {
        const config = type === 'factura' ? facturaConfig : boletaConfig;
        updateMutation.mutate({ type, config });
    };

    if (isLoading) {
        return (
            <Card style={{ textAlign: "center", padding: "50px" }}>
                <Spin size="large" tip="Cargando configuración..." />
            </Card>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* FACTURAS */}
                <Card
                    title="Facturas (Doc. 01)"
                    extra={
                        <Switch
                            checked={facturaConfig.enabled}
                            onChange={(val) => setFacturaConfig((prev: AutoSendConfig) => ({ ...prev, enabled: val }))}
                            checkedChildren="ACTIVO"
                            unCheckedChildren="INACTIVO"
                        />
                    }
                    className="shadow-sm border-l-4 border-l-blue-500"
                >
                    <div className="space-y-4">
                        <Alert
                            message={<Text strong>Plazo SUNAT Máximo: 3 días calendario</Text>}
                            description="Las facturas fuera de este plazo serán rechazadas por SUNAT. El sistema solo enviará automáticamente facturas dentro del plazo legal."
                            type="error"
                            showIcon
                            icon={<WarningOutlined />}
                        />

                        <div className={`p-4 bg-gray-50 rounded-lg transition-opacity ${!facturaConfig.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
                            <Text strong className="block mb-2">Enviar después de (días):</Text>
                            <InputNumber
                                min={0}
                                max={3}
                                value={facturaConfig.after_days}
                                onChange={(val) => setFacturaConfig((prev: AutoSendConfig) => ({ ...prev, after_days: val || 0 }))}
                                className="w-full"
                                addonAfter="días"
                            />
                            <Text type="secondary" className="text-xs mt-2 block">
                                Rango permitido: 0 a 3 días.
                            </Text>
                        </div>

                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            block
                            onClick={() => handleSave('factura')}
                            loading={updateMutation.isPending && updateMutation.variables?.type === 'factura'}
                        >
                            Guardar Facturas
                        </Button>
                    </div>
                </Card>

                {/* BOLETAS */}
                <Card
                    title="Boletas (Doc. 03)"
                    extra={
                        <Switch
                            checked={boletaConfig.enabled}
                            onChange={(val) => setBoletaConfig((prev: AutoSendConfig) => ({ ...prev, enabled: val }))}
                            checkedChildren="ACTIVO"
                            unCheckedChildren="INACTIVO"
                        />
                    }
                    className="shadow-sm border-l-4 border-l-orange-500"
                >
                    <div className="space-y-4">
                        <Alert
                            message={<Text strong>Plazo SUNAT Máximo: 7 días calendario</Text>}
                            description="Las boletas tienen un plazo más amplio. El envío automático omitirá boletas que superen los 7 días para evitar rechazos."
                            type="warning"
                            showIcon
                            icon={<InfoCircleOutlined />}
                        />

                        <div className={`p-4 bg-gray-50 rounded-lg transition-opacity ${!boletaConfig.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
                            <Text strong className="block mb-2">Enviar después de (días):</Text>
                            <InputNumber
                                min={0}
                                max={7}
                                value={boletaConfig.after_days}
                                onChange={(val) => setBoletaConfig((prev: AutoSendConfig) => ({ ...prev, after_days: val || 0 }))}
                                className="w-full"
                                addonAfter="días"
                            />
                            <Text type="secondary" className="text-xs mt-2 block">
                                Rango permitido: 0 a 7 días.
                            </Text>
                        </div>

                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            block
                            onClick={() => handleSave('boleta')}
                            loading={updateMutation.isPending && updateMutation.variables?.type === 'boleta'}
                        >
                            Guardar Boletas
                        </Button>
                    </div>
                </Card>

            </div>
        </div>
    );
}
