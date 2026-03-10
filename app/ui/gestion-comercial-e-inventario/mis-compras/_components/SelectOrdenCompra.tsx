'use client';

import { useEffect, useState } from 'react';
import { Select } from 'antd';
import { ordenCompraApi } from '~/lib/api/orden-compra';

interface SelectOrdenCompraProps {
  almacen_id?: number;
  onChange: (ordenId: number | null) => void;
  value?: number | null;
}

export function SelectOrdenCompra({ almacen_id, onChange, value }: SelectOrdenCompraProps) {
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!almacen_id) return;

    setLoading(true);
    ordenCompraApi
      .getAll({
        almacen_id,
        per_page: 100,
      })
      .then((res: any) => {
        // Filtrar solo órdenes en estado pendiente o en_proceso
        const ordenesValidas = (res.data?.data || []).filter((orden: any) =>
          ['pendiente', 'en_proceso'].includes(orden.estado)
        );
        setOrdenes(ordenesValidas);
      })
      .catch((err: any) => console.error('Error al cargar órdenes:', err))
      .finally(() => setLoading(false));
  }, [almacen_id]);

  return (
    <Select
      placeholder="Seleccionar Orden de Compra (opcional)"
      allowClear
      loading={loading}
      value={value || undefined}
      onChange={(val) => onChange(val || null)}
      options={ordenes.map((orden) => ({
        label: `${orden.codigo} - ${orden.proveedor?.razon_social || 'Sin proveedor'}`,
        value: orden.id,
      }))}
    />
  );
}
