"use client";

import { MdOutlineReceiptLong } from "react-icons/md";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import { FormInstance } from "antd";
import { FormCreateNotaDebito } from "./body-crear-nota-debito";

interface HeaderCrearNotaDebitoProps {
  form: FormInstance<FormCreateNotaDebito>;
}

export default function HeaderCrearNotaDebito({ form }: HeaderCrearNotaDebitoProps) {
  return (
    <TituloModulos
      title="Crear Nota de Débito"
      icon={<MdOutlineReceiptLong className="text-orange-600" />}
    />
  );
}
