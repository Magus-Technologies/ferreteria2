"use client";

import { MdOutlineReceiptLong } from "react-icons/md";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import InputBase from "~/app/_components/form/inputs/input-base";
import { FaSearch } from "react-icons/fa";
import SelectBase from "~/app/_components/form/selects/select-base";
import useMotivosCredito from "../_hooks/use-motivos-credito";

export default function HeaderCrearNotaCredito() {
  const { data: motivos, isLoading } = useMotivosCredito();

  const motivosOptions = motivos?.map((motivo) => ({
    value: motivo.id,
    label: `${motivo.codigo_sunat} - ${motivo.descripcion}`,
  })) || [];

  return (
    <TituloModulos
      title="Crear Nota de Crédito"
      icon={<MdOutlineReceiptLong className="text-rose-600" />}
      extra={
        <div className="pl-0 lg:pl-8 flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-4 w-full lg:w-auto">
          {/* Buscar documento que modifica */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <InputBase
              placeholder="Buscar documento por serie-número o cliente..."
              className="w-full lg:!min-w-[400px] lg:!w-[400px] lg:!max-w-[400px]"
              prefix={<FaSearch className="text-rose-600 mx-1" />}
              size="large"
              uppercase={false}
            />
          </div>

          {/* Selector de tipo de comprobante */}
          <SelectBase
            placeholder="Tipo Documento"
            className="w-full lg:!min-w-[180px] lg:!w-[180px] lg:!max-w-[180px]"
            size="large"
            options={[
              { value: "01", label: "Factura" },
              { value: "03", label: "Boleta" },
            ]}
          />
        </div>
      }
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        {/* Selector de motivo de nota */}
        <SelectBase
          placeholder="Seleccione motivo de nota de crédito"
          className="w-full sm:!min-w-[350px] sm:!w-[350px] sm:!max-w-[350px]"
          options={motivosOptions}
          loading={isLoading}
          showSearch
          filterOption={(input, option) =>
            (option?.label?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
      </div>
    </TituloModulos>
  );
}
