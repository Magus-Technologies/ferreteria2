"use client";

import { MdOutlineReceiptLong } from "react-icons/md";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import { FaSearch } from "react-icons/fa";
import { Input, Select } from "antd";
import { FormInstance } from "antd";
import { FormCreateNotaDebito } from "./body-crear-nota-debito";
import useBuscarComprobante from "../_hooks/use-buscar-comprobante";
import ModalBuscarComprobante from "./modal-buscar-comprobante";

interface HeaderCrearNotaDebitoProps {
  form: FormInstance<FormCreateNotaDebito>;
}

export default function HeaderCrearNotaDebito({ form }: HeaderCrearNotaDebitoProps) {
  const {
    searchQuery,
    setSearchQuery,
    tipoDocumento,
    setTipoDocumento,
    modalOpen,
    setModalOpen,
    cargarComprobante,
  } = useBuscarComprobante(form);

  return (
    <>
      <TituloModulos
        title="Crear Nota de Débito"
        icon={<MdOutlineReceiptLong className="text-orange-600" />}
        extra={
          <div className="pl-0 lg:pl-8 flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-4 w-full lg:w-auto">
            {/* Buscar documento que modifica */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onPressEnter={() => setModalOpen(true)}
                placeholder="Buscar por serie-número (B001-15) o cliente..."
                className="w-full lg:!min-w-[400px] lg:!w-[400px] lg:!max-w-[400px]"
                size="large"
                prefix={<FaSearch className="text-orange-600 mx-1" />}
              />
            </div>

            {/* Selector de tipo de comprobante */}
            <Select
              value={tipoDocumento}
              onChange={setTipoDocumento}
              placeholder="Tipo Documento"
              className="w-full lg:!min-w-[180px] lg:!w-[180px] lg:!max-w-[180px]"
              size="large"
              allowClear
              options={[
                { value: "01", label: "Factura" },
                { value: "03", label: "Boleta" },
              ]}
            />
          </div>
        }
      />

      {/* Modal de búsqueda */}
      <ModalBuscarComprobante
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={cargarComprobante}
        tipoDocumento={tipoDocumento}
        searchQueryProp={searchQuery}
      />
    </>
  );
}
