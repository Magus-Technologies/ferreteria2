"use client";

import { Select } from "antd";
import { FormItemProps } from "antd/lib/form";
import FormBase from "~/components/form/form-base";
import { useServerQuery } from "~/hooks/use-server-query";
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
  const { data: motivos, isLoading } = useServerQuery({
    queryKey: ["motivos-nota", tipo],
    queryFn: async () => {
      const response = await facturacionElectronicaApi.getMotivosNota(tipo);
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data || [];
    },
  });

  const options = (motivos || []).map((motivo: any) => ({
    value: motivo.id,
    label: `${motivo.codigo} - ${motivo.descripcion}`,
  }));

  return (
    <FormBase.Item {...propsForm} className={className}>
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
    </FormBase.Item>
  );
}
