"use client";

import { useState, useEffect } from "react";
import {
    Card,
    Switch,
    Button,
    Typography,
    App,
    Spin,
    Alert,
    InputNumber,
    Input,
    Divider,
} from "antd";
import {
    SaveOutlined,
    InfoCircleOutlined,
    WarningOutlined,
    KeyOutlined,
    UserOutlined,
    LockOutlined,
    CloudOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { configuracionApi, type AutoSendConfig } from "~/lib/api/configuracion";
import { empresaApi, type UpdateEmpresaRequest } from "~/lib/api/empresa";
import { QueryKeys } from "~/app/_lib/queryKeys";
import { type ApiResponse } from "~/lib/api";
import LabelBase from "~/components/form/label-base";
import InputBase from "~/app/_components/form/inputs/input-base";

const { Text, Paragraph } = Typography;

interface FormEnvioSunatProps {
    empresaId: number;
}

export default function FormEnvioSunat({ empresaId }: FormEnvioSunatProps) {
    const { message } = App.useApp();
    const queryClient = useQueryClient();

    const [facturaConfig, setFacturaConfig] = useState<AutoSendConfig>({ enabled: false, after_days: 3 });
    const [boletaConfig, setBoletaConfig] = useState<AutoSendConfig>({ enabled: false, after_days: 0 });

    const [solUser, setSolUser] = useState("");
    const [solPass, setSolPass] = useState("");
    const [sunatClientId, setSunatClientId] = useState("");
    const [sunatSecretClient, setSunatSecretClient] = useState("");
    const [sunatModo, setSunatModo] = useState("beta");

    const { isLoading: loadingEmpresa, data: empresaData } = useQuery({
        queryKey: [QueryKeys.EMPRESAS, empresaId],
        queryFn: () => empresaApi.getById(empresaId),
        enabled: !!empresaId,
    });

    const { isLoading: loadingConfig } = useQuery({
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

    useEffect(() => {
        if (empresaData?.data?.data) {
            const e = empresaData.data.data;
            setSolUser(e.sol_user || "");
            setSolPass(e.sol_pass || "");
            setSunatClientId(e.sunat_client_id || "");
            setSunatSecretClient(e.sunat_secret_client || "");
            setSunatModo(e.sunat_modo || "beta");
        }
    }, [empresaData]);

    const updateMutation = useMutation({
        mutationFn: (data: { type: 'factura' | 'boleta', config: AutoSendConfig }) =>
            configuracionApi.updateAutoSendStatus({
                type: data.type as any,
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

    const credencialesMutation = useMutation({
        mutationFn: (data: UpdateEmpresaRequest) => empresaApi.update(empresaId, data),
        onSuccess: (response) => {
            if (response.data?.data) {
                message.success("Credenciales SUNAT guardadas");
                queryClient.invalidateQueries({ queryKey: [QueryKeys.EMPRESAS] });
            } else if (response.error) {
                message.error(response.error.message);
            }
        },
        onError: () => {
            message.error("Error al guardar credenciales");
        },
    });

    const handleSave = (type: 'factura' | 'boleta') => {
        const config = type === 'factura' ? facturaConfig : boletaConfig;
        updateMutation.mutate({ type, config });
    };

    const handleSaveCredenciales = () => {
        credencialesMutation.mutate({
            sol_user: solUser || undefined,
            sol_pass: solPass || undefined,
            sunat_client_id: sunatClientId || undefined,
            sunat_secret_client: sunatSecretClient || undefined,
            sunat_modo: sunatModo as 'beta' | 'produccion',
        });
    };

    const isLoading = loadingEmpresa || loadingConfig;

    if (isLoading) {
        return (
            <Card style={{ textAlign: "center", padding: "50px" }}>
                <Spin size="large" tip="Cargando configuración..." />
            </Card>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Credenciales SUNAT */}
            <Card
                title={
                    <span><KeyOutlined className="mr-2" />Credenciales SUNAT</span>
                }
                className="shadow-sm border-l-4 border-l-green-500"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <LabelBase label="Usuario SOL:" orientation="column">
                            <Input
                                value={solUser}
                                onChange={(e) => setSolUser(e.target.value)}
                                placeholder="MODDATOS"
                                prefix={<UserOutlined />}
                            />
                        </LabelBase>
                    </div>
                    <div>
                        <LabelBase label="Clave SOL:" orientation="column">
                            <Input.Password
                                value={solPass}
                                onChange={(e) => setSolPass(e.target.value)}
                                placeholder="moddatos"
                                prefix={<LockOutlined />}
                            />
                        </LabelBase>
                    </div>
                    <div>
                        <LabelBase label="Client ID (OAuth2 GRE):" orientation="column">
                            <Input
                                value={sunatClientId}
                                onChange={(e) => setSunatClientId(e.target.value)}
                                placeholder="test-85e5b0ae-255c-4891-a595-0b98c65c9854"
                            />
                        </LabelBase>
                    </div>
                    <div>
                        <LabelBase label="Secret Client (OAuth2 GRE):" orientation="column">
                            <Input.Password
                                value={sunatSecretClient}
                                onChange={(e) => setSunatSecretClient(e.target.value)}
                                placeholder="test-Hty/M6QshYvPgItX2P0+Kw=="
                                prefix={<LockOutlined />}
                            />
                        </LabelBase>
                    </div>
                    <div>
                        <LabelBase label="Modo SUNAT:" orientation="column">
                            <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                <Switch
                                    checked={sunatModo === "produccion"}
                                    onChange={(val) => setSunatModo(val ? "produccion" : "beta")}
                                    checkedChildren="PRODUCCIÓN"
                                    unCheckedChildren="BETA"
                                    className={sunatModo === "produccion" ? "bg-green-600" : "bg-orange-400"}
                                />
                                <span className="text-sm text-gray-500">
                                    {sunatModo === "beta"
                                        ? "Usa RUC 20000000001 y credenciales de prueba"
                                        : "Usa RUC y credenciales reales de la empresa"}
                                </span>
                            </div>
                        </LabelBase>
                    </div>
                </div>
                <div className="mt-4">
                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleSaveCredenciales}
                        loading={credencialesMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        Guardar Credenciales
                    </Button>
                </div>
            </Card>

            <Divider />

            {/* Auto-Envio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            description="Las facturas fuera de este plazo serán rechazadas por SUNAT."
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
                            description="Las boletas tienen un plazo más amplio."
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
