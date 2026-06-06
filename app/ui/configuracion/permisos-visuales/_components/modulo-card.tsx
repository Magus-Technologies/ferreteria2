'use client';

import { Button } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined, DownOutlined } from '@ant-design/icons';
import { FaShieldAlt, FaUserShield } from 'react-icons/fa';
import { Switch, Select } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { autorizacionesApi, autorizacionesKeys, type TipoAutorizador } from '~/lib/api/autorizaciones';
import SelectCargo from '~/app/_components/form/selects/select-cargo';
import { ACCIONES, ACCION_COLORS, ACCION_LABELS, ICON_MAP, PERMISSION_TO_AUTH_MODULO } from '../_constants';
import { COMPONENT_MAP } from '../_constants/component-map';
import type { NavItem, Accion } from '../_types';

interface ModuloCardProps {
  item: NavItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onConfigurar: () => void;
  onVerToggle: () => void;
  visible: boolean;
  isRequiereAuth: (modulo: string, accion: Accion) => boolean;
  getAutorizadorId: (modulo: string, accion: Accion) => string | null;
  getTipoAutorizador: (modulo: string, accion: Accion) => TipoAutorizador;
  getCargoAutorizador: (modulo: string, accion: Accion) => string | null;
  rolId: number | null;
  users: { id: string; name: string }[];
  authConfigs: { modulo: string; accion: Accion; requiere_autorizacion: boolean }[];
}

export default function ModuloCard({
  item,
  isExpanded,
  onToggleExpand,
  onConfigurar,
  onVerToggle,
  visible,
  isRequiereAuth,
  getAutorizadorId,
  getTipoAutorizador,
  getCargoAutorizador,
  rolId,
  users,
  authConfigs,
}: ModuloCardProps) {
  const queryClient = useQueryClient();
  const icon = ICON_MAP[item.permission!] || '📌';
  const hasComponent = !!COMPONENT_MAP[item.permission!];
  const authModulo = PERMISSION_TO_AUTH_MODULO[item.permission!];
  const authCount = authModulo
    ? authConfigs.filter(c => c.modulo === authModulo && c.requiere_autorizacion).length
    : 0;

  const saveAuthMutation = useMutation({
    mutationFn: (data: {
      modulo: string;
      accion: Accion;
      requiere_autorizacion: boolean;
      tipo_autorizador?: TipoAutorizador;
      autorizador_id?: string | null;
      cargo_autorizador?: string | null;
    }) => autorizacionesApi.saveConfig({ ...data, role_id: rolId! }),
    onSuccess: () => {
      // Refrescar la config para que los selectores reflejen lo guardado.
      queryClient.invalidateQueries({ queryKey: autorizacionesKeys.configs(rolId ?? undefined) });
    },
    onError: () => {},
  });

  const handleAuthToggle = (modulo: string, accion: Accion, checked: boolean) => {
    saveAuthMutation.mutate({
      modulo,
      accion,
      requiere_autorizacion: checked,
      tipo_autorizador: getTipoAutorizador(modulo, accion),
      autorizador_id: getAutorizadorId(modulo, accion),
      cargo_autorizador: getCargoAutorizador(modulo, accion),
    });
  };

  const handleTipoChange = (modulo: string, accion: Accion, tipo: TipoAutorizador) => {
    saveAuthMutation.mutate({
      modulo,
      accion,
      requiere_autorizacion: true,
      tipo_autorizador: tipo,
      // El backend ignora el dato que no corresponde al modo, pero lo limpiamos igual.
      autorizador_id: tipo === 'usuario' ? getAutorizadorId(modulo, accion) : null,
      cargo_autorizador: tipo === 'cargo' ? getCargoAutorizador(modulo, accion) : null,
    });
  };

  const handleAutorizadorChange = (modulo: string, accion: Accion, autorizadorId: string | null) => {
    saveAuthMutation.mutate({
      modulo,
      accion,
      requiere_autorizacion: true,
      tipo_autorizador: 'usuario',
      autorizador_id: autorizadorId,
      cargo_autorizador: null,
    });
  };

  const handleCargoChange = (modulo: string, accion: Accion, cargo: string | null) => {
    saveAuthMutation.mutate({
      modulo,
      accion,
      requiere_autorizacion: true,
      tipo_autorizador: 'cargo',
      autorizador_id: null,
      cargo_autorizador: cargo,
    });
  };

  return (
    <div
      className={`
        rounded-lg border-2 transition-all
        ${isExpanded ? 'shadow-md' : ''}
        ${visible ? 'border-green-300 bg-green-50 hover:border-green-400' : 'border-red-300 bg-red-50 hover:border-red-400'}
      `}
    >
      <div
        className="p-3 flex items-center justify-between gap-2 cursor-pointer select-none"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {authModulo ? (
            <span className={`text-[10px] text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
              <DownOutlined />
            </span>
          ) : (
            <span className="w-[14px]" />
          )}
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-medium truncate">{item.label}</span>
          {authCount > 0 && (
            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
              {authCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasComponent && (
            <Button
              size="small"
              type="link"
              className="text-blue-500 p-0 h-auto text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onConfigurar();
              }}
            >
              Config. Vista
            </Button>
          )}
          <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onVerToggle(); }}>
            {visible ? <EyeOutlined className="text-green-600 flex-shrink-0" /> : <EyeInvisibleOutlined className="text-red-600 flex-shrink-0" />}
          </div>
        </div>
      </div>

      {isExpanded && authModulo && (
        <div className="px-3 pb-3 border-t border-gray-200 pt-2 bg-white/60 rounded-b-lg">
          <div className="flex items-center gap-1.5 mb-2">
            <FaShieldAlt className="text-amber-500" size={12} />
            <span className="text-xs font-semibold text-gray-600">Requiere autorización para:</span>
          </div>
          <div className="space-y-2">
            {ACCIONES.map((accion) => {
              const activo = isRequiereAuth(authModulo, accion);
              const autorizadorId = getAutorizadorId(authModulo, accion);
              const tipo = getTipoAutorizador(authModulo, accion);
              const cargoAutorizador = getCargoAutorizador(authModulo, accion);

              return (
                <div key={accion} className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium w-14 ${ACCION_COLORS[accion]}`}>
                    {ACCION_LABELS[accion]}
                  </span>
                  <Switch
                    size="small"
                    checked={activo}
                    onChange={(checked) => { handleAuthToggle(authModulo, accion, checked); }}
                    loading={saveAuthMutation.isPending}
                  />
                  {activo && (
                    <>
                      <Select
                        size="small"
                        className="w-28"
                        value={tipo}
                        onChange={(val) => handleTipoChange(authModulo, accion, val as TipoAutorizador)}
                        options={[
                          { label: 'Jerarquía', value: 'jerarquia' },
                          { label: 'Cargo', value: 'cargo' },
                          { label: 'Usuario', value: 'usuario' },
                        ]}
                      />

                      {tipo === 'jerarquia' && (
                        <span className="text-[10px] text-gray-500 italic">
                          Sube al cargo superior del organigrama
                        </span>
                      )}

                      {tipo === 'cargo' && (
                        <SelectCargo
                          size="small"
                          allowClear
                          className="flex-1 min-w-0"
                          placeholder="Cargo aprobador"
                          value={cargoAutorizador || undefined}
                          onChange={(val) => handleCargoChange(authModulo, accion, (val as string) || null)}
                        />
                      )}

                      {tipo === 'usuario' && (
                        <Select
                          size="small"
                          placeholder="Aprobador"
                          allowClear
                          className="flex-1 min-w-0"
                          value={autorizadorId || undefined}
                          onChange={(val) => handleAutorizadorChange(authModulo, accion, val || null)}
                          options={users.map((u) => ({
                            label: u.name?.split(' ')[0] || u.name,
                            value: u.id,
                          }))}
                          popupMatchSelectWidth={200}
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
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}