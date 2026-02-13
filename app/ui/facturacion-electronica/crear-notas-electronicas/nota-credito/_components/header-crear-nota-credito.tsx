"use client";

import { MdOutlineReceiptLong } from "react-icons/md";
import TituloModulos from "~/app/_components/others/titulo-modulos";

export default function HeaderCrearNotaCredito() {
  return (
    <TituloModulos
      title="Crear Nota de Crédito"
      icon={<MdOutlineReceiptLong className="text-rose-600" />}
    />
  );
}
