'use client';

import { useState } from 'react';
import { Button, Tag } from 'antd';
import { EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import TableBase from '~/components/tables/table-base';
import type { ColDef } from 'ag-grid-community';

interface NotaDebito {
  id: number;
  serie: string;
  numero: number;
  fecha: string;
  cliente_razon_social: string;
  cliente_num_doc: string;
  tipo_moneda: string;
  total: number;
  estado: string;
  modo_simulacion: boolean;
}

export default function TableNotasDebito() {
  const [rowData] = useState<NotaDebito[]>([
    // Datos de ejemplo - en producción vendrían del backend
  ]);

  const columnDefs: ColDef<NotaDebito>[] = [
    {
      headerName: 'Serie-Número',
      field: 'serie',
      width: 150,
      valueGetter: (params) => `${params.data?.serie}-${params.data?.numero}`,
      pinned: 'left',
    },
    {
      headerName: 'Fecha',
      field: 'fecha',
      width: 120,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString('es-PE');
      },
    },
    {
      headerName: 'Cliente',
      field: 'cliente_razon_social',
      width: 250,
      flex: 1,
    },
    {
      headerName: 'RUC/DNI',
      field: 'cliente_num_doc',
      width: 130,
    },
    {
      headerName: 'Moneda',
      field: 'tipo_moneda',
      width: 100,
      cellRenderer: (params: any) => {
        const moneda = params.value;
        return (
          <Tag color={moneda === 'PEN' ? 'blue' : 'green'}>
            {moneda === 'PEN' ? 'Soles' : 'Dólares'}
          </Tag>
        );
      },
    },
    {
      headerName: 'Total',
      field: 'total',
      width: 120,
      valueFormatter: (params) => {
        if (!params.value) return '';
        const moneda = params.data?.tipo_moneda === 'USD' ? '$' : 'S/';
        return `${moneda} ${Number(params.value).toFixed(2)}`;
      },
      cellStyle: { fontWeight: 'bold' },
    },
    {
      headerName: 'Estado',
      field: 'estado',
      width: 130,
      cellRenderer: (params: any) => {
        const estado = params.value;
        const modoSimulacion = params.data?.modo_simulacion;
        
        if (modoSimulacion) {
          return <Tag color="orange">SIMULADO</Tag>;
        }
        
        const colorMap: Record<string, string> = {
          aceptado: 'success',
          rechazado: 'error',
          pendiente: 'warning',
        };
        
        return (
          <Tag color={colorMap[estado] || 'default'}>
            {estado?.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 150,
      pinned: 'right',
      cellRenderer: (params: any) => {
        const serie = params.data?.serie;
        const numero = params.data?.numero;
        
        return (
          <div className="flex gap-2">
            <Button
              type="link"
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => {
                const xmlUrl = `${process.env.NEXT_PUBLIC_API_URL}/notas-debito/${serie}/${numero}/xml`;
                window.open(xmlUrl, '_blank');
              }}
            >
              Ver XML
            </Button>
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                // TODO: Implementar vista de detalle
                console.log('Ver detalle', params.data);
              }}
            >
              Detalle
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <TableBase
      rowData={rowData}
      columnDefs={columnDefs}
      domLayout="autoHeight"
      pagination={true}
      paginationPageSize={20}
      noRowsOverlayComponent={() => (
        <div className="flex flex-col items-center justify-center h-40">
          <FileTextOutlined style={{ fontSize: 48, color: '#ccc' }} />
          <p className="text-gray-500 mt-4">No hay notas de débito registradas</p>
          <p className="text-gray-400 text-sm">Crea tu primera nota de débito usando el botón superior</p>
        </div>
      )}
    />
  );
}
