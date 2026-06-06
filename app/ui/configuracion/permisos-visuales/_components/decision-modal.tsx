'use client';

import { Modal, Button, Divider, Switch, Select } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { FaShieldAlt, FaUserShield } from 'react-icons/fa';
import SelectCargo from '~/app/_components/form/selects/select-cargo';
import type { TipoAutorizador } from '~/lib/api/autorizaciones';

interface AccesoData {
  requiere_autorizacion: boolean;
  tipo_autorizador: TipoAutorizador;
  autorizador_id: string | null;
  cargo_autorizador: string | null;
}

interface DecisionModalProps {
  visible: boolean;
  itemLabel: string;
  rolNombre: string;
  isLoading: boolean;
  onMostrar: () => void;
  onOcultar: () => void;
  onCancel: () => void;
  // === Autorización de acceso a la vista (aditivo, solo vistas de navegación) ===
  permitirAcceso?: boolean;
  requiereAcceso?: boolean;
  tipoAutorizador?: TipoAutorizador;
  cargoAutorizador?: string | null;
  autorizadorId?: string | null;
  users?: { id: string; name: string }[];
  savingAcceso?: boolean;
  onGuardarAcceso?: (data: AccesoData) => void;
}

export default function DecisionModal({
  visible,
  itemLabel,
  rolNombre,
  isLoading,
  onMostrar,
  onOcultar,
  onCancel,
  permitirAcceso = false,
  requiereAcceso = false,
  tipoAutorizador = 'jerarquia',
  cargoAutorizador = null,
  autorizadorId = null,
  users = [],
  savingAcceso = false,
  onGuardarAcceso,
}: DecisionModalProps) {
  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={520}
      centered
    >
      <div className="text-center py-6">
        <h3 className="text-xl font-bold mb-4">¿Mostrar u Ocultar?</h3>
        <p className="text-gray-600 mb-2">
          Elemento: <strong>{itemLabel}</strong>
        </p>
        <p className="text-gray-600 mb-6">
          Para el rol: <strong>{rolNombre}</strong>
        </p>

        <Divider />

        <div className="flex gap-4 justify-center">
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={onMostrar}
            loading={isLoading}
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-600"
          >
            Mostrar
          </Button>
          <Button
            danger
            size="large"
            icon={<CloseCircleOutlined />}
            onClick={onOcultar}
            loading={isLoading}
            disabled={isLoading}
          >
            Ocultar
          </Button>
        </div>

        {/* === Autorización de acceso (solo vistas de navegación) === */}
        {permitirAcceso && onGuardarAcceso && (
          <>
            <Divider className="!my-5">
              <span className="text-xs text-gray-400 font-normal">o requerir autorización</span>
            </Divider>

            <div className="text-left border border-amber-200 bg-amber-50/60 rounded-lg p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FaShieldAlt className="text-amber-500" size={14} />
                  Requiere autorización para entrar
                </span>
                <Switch
                  checked={requiereAcceso}
                  loading={savingAcceso}
                  onChange={(checked) =>
                    onGuardarAcceso({
                      requiere_autorizacion: checked,
                      tipo_autorizador: tipoAutorizador,
                      autorizador_id: tipoAutorizador === 'usuario' ? autorizadorId : null,
                      cargo_autorizador: tipoAutorizador === 'cargo' ? cargoAutorizador : null,
                    })
                  }
                />
              </div>

              {requiereAcceso && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500">Aprueba:</span>
                  <Select
                    size="small"
                    className="w-32"
                    value={tipoAutorizador}
                    onChange={(val) =>
                      onGuardarAcceso({
                        requiere_autorizacion: true,
                        tipo_autorizador: val as TipoAutorizador,
                        autorizador_id: val === 'usuario' ? autorizadorId : null,
                        cargo_autorizador: val === 'cargo' ? cargoAutorizador : null,
                      })
                    }
                    options={[
                      { label: 'Jerarquía', value: 'jerarquia' },
                      { label: 'Cargo', value: 'cargo' },
                      { label: 'Usuario', value: 'usuario' },
                    ]}
                  />

                  {tipoAutorizador === 'jerarquia' && (
                    <span className="text-[10px] text-gray-500 italic">
                      Sube al cargo superior del organigrama
                    </span>
                  )}

                  {tipoAutorizador === 'cargo' && (
                    <SelectCargo
                      size="small"
                      allowClear
                      className="flex-1 min-w-0"
                      placeholder="Cargo aprobador"
                      value={cargoAutorizador || undefined}
                      onChange={(val) =>
                        onGuardarAcceso({
                          requiere_autorizacion: true,
                          tipo_autorizador: 'cargo',
                          autorizador_id: null,
                          cargo_autorizador: (val as string) || null,
                        })
                      }
                    />
                  )}

                  {tipoAutorizador === 'usuario' && (
                    <Select
                      size="small"
                      placeholder="Aprobador"
                      allowClear
                      className="flex-1 min-w-0"
                      value={autorizadorId || undefined}
                      onChange={(val) =>
                        onGuardarAcceso({
                          requiere_autorizacion: true,
                          tipo_autorizador: 'usuario',
                          autorizador_id: (val as string) || null,
                          cargo_autorizador: null,
                        })
                      }
                      options={users.map((u) => ({
                        label: u.name?.split(' ')[0] || u.name,
                        value: u.id,
                      }))}
                      optionRender={(option) => {
                        const user = users.find((u) => u.id === option.value);
                        return (
                          <div className="flex items-center gap-2">
                            <FaUserShield className="text-blue-500" size={12} />
                            <span>{user?.name}</span>
                          </div>
                        );
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
