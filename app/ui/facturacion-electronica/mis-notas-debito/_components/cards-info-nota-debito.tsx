'use client';

import { Form, FormInstance } from 'antd';
import { useMemo } from 'react';

interface Props {
  form: FormInstance;
  loading: boolean;
}

export default function CardsInfoNotaDebito({ form, loading }: Props) {
  const items = Form.useWatch('items', form) || [];
  const tipo_moneda = Form.useWatch('tipo_moneda', form) || 'PEN';

  // Calcular totales
  const { subtotal, igv, total } = useMemo(() => {
    const subtotal = items.reduce((acc: number, item: any) => {
      const cantidad = Number(item?.cantidad || 0);
      const valorUnitario = Number(item?.valor_unitario || 0);
      return acc + (cantidad * valorUnitario);
    }, 0);

    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    return { subtotal, igv, total };
  }, [items]);

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: tipo_moneda === 'USD' ? 'USD' : 'PEN',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Card Subtotal */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <p className="text-sm text-gray-600">Subtotal</p>
        <p className="text-2xl font-bold">{formatMoney(subtotal)}</p>
      </div>

      {/* Card IGV */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <p className="text-sm text-gray-600">IGV (18%)</p>
        <p className="text-2xl font-bold">{formatMoney(igv)}</p>
      </div>

      {/* Card Total */}
      <div className="bg-white p-4 rounded-lg shadow border-2 border-rose-500">
        <p className="text-sm text-gray-600">Total</p>
        <p className="text-2xl font-bold text-rose-600">{formatMoney(total)}</p>
      </div>
    </div>
  );
}

