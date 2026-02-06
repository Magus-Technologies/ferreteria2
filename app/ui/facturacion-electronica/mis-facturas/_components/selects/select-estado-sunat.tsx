"use client";

import { Select } from "antd";
import { FormItemProps } from "antd/lib/form";
import FormBase from "~/components/form/form-base";

interface SelectEstadoSunatProps {
  propsForm?: FormItemProps;
  className?: string;
  formWithMessage?: boolean;
  allowClear?: boolean;
  placeholder?: string;
  onChange?: (value: string) => void;
}

const estadosSunat = [
  { value: "Pendiente", label: "Pendiente" },
  { value: "Aceptado", label: "Aceptado" },
  { value: "Rechazado", label: "Rechazado" },
  { value: "Observado", label: "Observado" },
];

export default function SelectEstadoSunat({
  propsForm,
  className,
  formWithMessage = true,
  allowClear = false,
  placeholder = "Seleccionar estado",
  onChange,
}: SelectEstadoSunatProps) {
  return (
    <FormBase.Item {...propsForm} className={className}>
      <Select
        placeholder={placeholder}
        allowClear={allowClear}
        onChange={onChange}
        options={estadosSunat}
        className="w-full"
      />
    </FormBase.Item>
  );
}
