"use client";

import { Select } from "antd";

interface SelectEstadoSunatProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  allowClear?: boolean;
}

export default function SelectEstadoSunat({
  value,
  onChange,
  placeholder = "Estado SUNAT",
  allowClear = true,
}: SelectEstadoSunatProps) {
  const options = [
    { value: "PENDIENTE", label: "Pendiente" },
    { value: "ACEPTADO", label: "Aceptado" },
    { value: "ACEPTADO_CON_OBSERVACIONES", label: "Aceptado con Observaciones" },
    { value: "RECHAZADO", label: "Rechazado" },
  ];

  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      allowClear={allowClear}
      options={options}
      style={{ width: "100%" }}
    />
  );
}
