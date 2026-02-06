"use client";

import { Select, Form } from "antd";
import { FormItemProps } from "antd/lib/form";
import { useQuery } from "@tanstack/react-query";
import { facturacionElectronicaApi } from "~/lib/api/facturacion-electronica";

interface SelectMotivoNotaProps {
  tipo: "credito" | "debito";
  propsForm?: FormItemProps;
  className?: string;
  formWithMessage?: boolean;
  allowClear?: boolean;
  placeholder?: string;
  onChange?: (value: number) => void;
}

export default function SelectMotivoNota({
  tipo,
  propsForm,
  className,
  formWithMessage = true,
  allowClear = false,
  placeholder = "Seleccionar motivo",
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

  const options = (motivos || []).map((motivo: any) => ({
    value: motivo.id,
    label: `${motivo.codigo_sunat} - ${motivo.descripcion}`,
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
        showSearch
        filterOption={(input, option) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
        }
      />
    </Form.Item>
  );
}
