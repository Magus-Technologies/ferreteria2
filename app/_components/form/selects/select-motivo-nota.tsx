"use client";

import { Select, Form, Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { FormItemProps } from "antd/lib/form";
import { useQuery } from "@tanstack/react-query";
import { facturacionElectronicaApi } from "~/lib/api/facturacion-electronica";

interface SelectMotivoNotaProps {
  tipo: "credito" | "debito";
  propsForm?: FormItemProps;
  className?: string;
  allowClear?: boolean;
  placeholder?: string;
  showSearch?: boolean;
  onChange?: (value: number) => void;
}

export default function SelectMotivoNota({
  tipo,
  propsForm,
  className,
  allowClear = false,
  placeholder = "Seleccionar motivo",
  showSearch = true,
  onChange,
}: SelectMotivoNotaProps) {
  const { data: motivos, isLoading } = useQuery({
    queryKey: ["motivos-nota", tipo],
    queryFn: async () => {
      const response = tipo === "credito" 
        ? await facturacionElectronicaApi.getMotivosCredito()
        : await facturacionElectronicaApi.getMotivosDebito();
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data?.data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hora
  });

  // Textos de ayuda por código SUNAT
  const motivoHelp: Record<string, string> = {
    '01': tipo === 'credito' 
      ? '⚠️ ANULACIÓN TOTAL - La operación nunca debió realizarse. Cancela TODO el comprobante.'
      : '⏰ INTERESES POR MORA - Cliente pagó fuera de plazo.',
    '02': tipo === 'credito'
      ? '⚠️ ANULACIÓN TOTAL - RUC incorrecto. Cancela TODO y emite nuevo comprobante.'
      : '💵 AUMENTO EN EL VALOR - Error en precio, monto menor al real.',
    '03': tipo === 'credito'
      ? '📝 CORRECCIÓN - Solo texto/descripción. NO afecta montos.'
      : '⚖️ PENALIDADES - Multas o recargos contractuales.',
    '04': '💰 DESCUENTO GLOBAL - Aplicado al total del comprobante.',
    '05': '💰 DESCUENTO POR ÍTEM - Aplicado a productos específicos.',
    '06': '⚠️ DEVOLUCIÓN TOTAL - Cliente devuelve TODOS los productos.',
    '07': '📦 DEVOLUCIÓN PARCIAL - Cliente devuelve ALGUNOS productos.',
    '08': '🎁 BONIFICACIÓN - Productos entregados sin costo.',
    '09': '💵 AJUSTE DE VALOR - Corrección de precios o valores.',
    '10': '📋 OTROS CONCEPTOS - Casos especiales (requiere descripción detallada mínimo 20 caracteres).',
  };

  const options = (motivos || []).map((motivo: any) => ({
    value: motivo.id,
    label: (
      <div className="flex items-center justify-between gap-2 w-full">
        <span className="flex-1">{motivo.codigo_sunat} - {motivo.descripcion}</span>
        <Tooltip 
          title={motivoHelp[motivo.codigo_sunat] || motivo.descripcion}
          placement="right"
          overlayStyle={{ maxWidth: '400px' }}
        >
          <InfoCircleOutlined className="text-blue-500 hover:text-blue-700 cursor-help flex-shrink-0" />
        </Tooltip>
      </div>
    ),
    searchValue: `${motivo.codigo_sunat} ${motivo.descripcion}`,
    codigo: motivo.codigo_sunat,
  }));

  return (
    <Form.Item {...propsForm} className={className}>
      <Select
        placeholder={placeholder}
        allowClear={allowClear}
        onChange={onChange}
        options={options}
        loading={isLoading}
        className="w-full"
        showSearch={showSearch}
        filterOption={(input, option: any) => {
          const searchValue = option?.searchValue?.toLowerCase() || '';
          return searchValue.includes(input.toLowerCase());
        }}
        optionLabelProp="searchValue"
      />
    </Form.Item>
  );
}

