'use client';

import { Select, Divider } from 'antd';
import type { Role } from '../_types';
import { AREAS_DISPONIBLES } from '../_constants';

interface SelectorBarProps {
  roles: Role[];
  loading: boolean;
  rolId: number | null;
  area: string;
  onRolChange: (value: number | null) => void;
  onAreaChange: (value: string) => void;
  rolNombre?: string;
}

export default function SelectorBar({
  roles,
  loading,
  rolId,
  area,
  onRolChange,
  onAreaChange,
  rolNombre,
}: SelectorBarProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <label className="font-medium whitespace-nowrap">Rol:</label>
        <Select
          style={{ width: 200 }}
          placeholder="Selecciona rol"
          loading={loading}
          value={rolId}
          onChange={onRolChange}
          options={
            Array.isArray(roles)
              ? roles.map((r) => ({
                  label: r.name,
                  value: r.id,
                }))
              : []
          }
        />
      </div>

      <Divider type="vertical" className="h-8" />

      <div className="flex items-center gap-2">
        <label className="font-medium whitespace-nowrap">Área:</label>
        <Select
          style={{ width: 250 }}
          value={area}
          onChange={onAreaChange}
          options={AREAS_DISPONIBLES}
        />
      </div>

      {rolId && (
        <>
          <Divider type="vertical" className="h-8" />
          <div className="text-sm">
            Configurando:{' '}
            <strong className="text-blue-600">{rolNombre}</strong>
          </div>
        </>
      )}
    </div>
  );
}