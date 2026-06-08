'use client';

import { useEffect, useState } from 'react';
import { Modal, Button, Divider, Radio, Select, Space } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { FaShieldAlt, FaUserShield } from 'react-icons/fa';
import SelectCargo from '~/app/_components/form/selects/select-cargo';
import type { TipoAutorizador } from '~/lib/api/autorizaciones';

export type EstadoElemento = 'visible' | 'autorizacion' | 'oculto';

export interface AceptarData {
  estado: EstadoElemento;
  tipo_autorizador: TipoAutorizador;
  autorizador_id: string | null;
  cargo_autorizador: string | null;
}

interface DecisionModalProps {
  visible: boolean;
  itemLabel: string;
  rolNombre: string;
  loading: boolean;
  /** Estado actual del elemento (para preseleccionar). */
  visibleActual: boolean;
  requiereAcceso: boolean;
  tipoAutorizador: TipoAutorizador;
  cargoAutorizador: string | null;
  autorizadorId: string | null;
  users: { id: string; name: string }[];
  /** Si false, no se ofrece la opción "con autorización". */
  permitirAcceso?: boolean;
  onAceptar: (data: AceptarData) => void;
  onCancel: () => void;
}

export default function DecisionModal({
  visible,
  itemLabel,
  rolNombre,
  loading,
  visibleActual,
  requiereAcceso,
  tipoAutorizador,
  cargoAutorizador,
  autorizadorId,
  users,
  permitirAcceso = true,
  onAceptar,
  onCancel,
}: DecisionModalProps) {
  const [estado, setEstado] = useState<EstadoElemento>('visible');
  const [tipo, setTipo] = useState<TipoAutorizador>('jerarquia');
  const [cargo, setCargo] = useState<string | null>(null);
  const [autorizador, setAutorizador] = useState<string | null>(null);

  // Preseleccionar segun el estado actual cada vez que se abre.
  useEffect(() => {
    if (!visible) return;
    setEstado(!visibleActual ? 'oculto' : requiereAcceso ? 'autorizacion' : 'visible');
    setTipo(tipoAutorizador);
    setCargo(cargoAutorizador);
    setAutorizador(autorizadorId);
  }, [visible, visibleActual, requiereAcceso, tipoAutorizador, cargoAutorizador, autorizadorId]);

  const aceptar = () => {
    onAceptar({
      estado,
      tipo_autorizador: tipo,
      autorizador_id: tipo === 'usuario' ? autorizador : null,
      cargo_autorizador: tipo === 'cargo' ? cargo : null,
    });
  };

  const opcion = (
    value: EstadoElemento,
    color: string,
    icon: React.ReactNode,
    titulo: string,
    detalle: string,
  ) => (
    <Radio
      value={value}
      className={`!flex items-start w-full m-0 p-3 rounded-lg border-2 transition-all ${
        estado === value ? color : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <span className="flex items-center gap-2 font-semibold text-gray-800">
        {icon}
        {titulo}
      </span>
      <div className="text-xs text-gray-500 mt-0.5">{detalle}</div>
    </Radio>
  );

  return (
    <Modal open={visible} onCancel={onCancel} footer={null} width={520} centered>
      <div className="py-2">
        <h3 className="text-lg font-bold mb-1">¿Cómo se comporta este elemento?</h3>
        <p className="text-gray-500 text-sm mb-4">
          <strong>{itemLabel}</strong> · para el rol <strong>{rolNombre}</strong>
        </p>

        <Radio.Group
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="w-full"
        >
          <Space direction="vertical" size={8} className="w-full">
            {opcion(
              'visible',
              'border-green-400 bg-green-50',
              <EyeOutlined className="text-green-600" />,
              'Visible',
              'Todos los del rol lo ven y lo usan normalmente.',
            )}

            {permitirAcceso &&
              opcion(
                'autorizacion',
                'border-amber-400 bg-amber-50',
                <FaShieldAlt className="text-amber-500" size={13} />,
                'Visible, pero requiere autorización',
                'Lo ven, pero deben solicitar autorización (a su superior) para poder usarlo.',
              )}

            {opcion(
              'oculto',
              'border-red-400 bg-red-50',
              <EyeInvisibleOutlined className="text-red-600" />,
              'Oculto',
              'No aparece para el rol. No lo ve ni lo puede solicitar.',
            )}
          </Space>
        </Radio.Group>

        {/* Configuración del aprobador: solo cuando requiere autorización */}
        {estado === 'autorizacion' && permitirAcceso && (
          <div className="mt-3 border border-amber-200 bg-amber-50/60 rounded-lg p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-600">¿Quién aprueba?</span>
              <Select
                size="small"
                className="w-32"
                value={tipo}
                onChange={(val) => setTipo(val as TipoAutorizador)}
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
                  value={cargo || undefined}
                  onChange={(val) => setCargo((val as string) || null)}
                />
              )}

              {tipo === 'usuario' && (
                <Select
                  size="small"
                  placeholder="Aprobador"
                  allowClear
                  className="flex-1 min-w-0"
                  value={autorizador || undefined}
                  onChange={(val) => setAutorizador((val as string) || null)}
                  options={users.map((u) => ({
                    label: u.name?.split(' ')[0] || u.name,
                    value: u.id,
                  }))}
                  optionRender={(option) => {
                    const u = users.find((x) => x.id === option.value);
                    return (
                      <div className="flex items-center gap-2">
                        <FaUserShield className="text-blue-500" size={12} />
                        <span>{u?.name}</span>
                      </div>
                    );
                  }}
                />
              )}
            </div>
          </div>
        )}

        <Divider className="!my-4" />

        <div className="flex justify-end gap-2">
          <Button onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="primary" onClick={aceptar} loading={loading}>
            Aceptar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
