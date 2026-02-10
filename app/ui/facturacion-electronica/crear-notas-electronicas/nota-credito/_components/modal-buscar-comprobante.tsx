"use client";

import { Modal } from "antd";
import InputBase from "~/app/_components/form/inputs/input-base";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import SelectBase from "~/app/_components/form/selects/select-base";
import TableComprobanteSearch, {
  RefTableComprobanteSearchProps,
} from "~/app/_components/tables/table-comprobante-search";
import TableDetalleComprobante from "~/app/_components/tables/table-detalle-comprobante";
import type { ComprobanteElectronico } from "~/lib/api/facturacion-electronica";
import { useQuery } from "@tanstack/react-query";
import { facturacionElectronicaApi } from "~/lib/api/facturacion-electronica";

interface ModalBuscarComprobanteProps {
  open: boolean;
  onClose: () => void;
  onSelect: (comprobanteId: number) => void;
  tipoDocumento?: "01" | "03";
  searchQueryProp?: string;
}

export default function ModalBuscarComprobante({
  open,
  onClose,
  onSelect,
  tipoDocumento: tipoDocumentoInicial,
  searchQueryProp = "",
}: ModalBuscarComprobanteProps) {
  const [text, setText] = useState(searchQueryProp);
  const [tipoDocumento, setTipoDocumento] = useState<"01" | "03" | undefined>(tipoDocumentoInicial);
  const [value] = useDebounce(text, 1000);
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState<ComprobanteElectronico | null>(null);

  // Sincronizar con el prop cuando cambie
  useEffect(() => {
    if (searchQueryProp) {
      setText(searchQueryProp);
    }
  }, [searchQueryProp]);

  // Limpiar al cerrar
  useEffect(() => {
    if (!open) {
      setText("");
      setComprobanteSeleccionado(null);
    }
  }, [open]);

  const tableRef = useRef<RefTableComprobanteSearchProps | null>(null);

  // Cargar detalles del comprobante seleccionado
  const { data: comprobanteCompleto, isLoading: loadingDetalles } = useQuery({
    queryKey: ["comprobante-detalle", comprobanteSeleccionado?.id],
    queryFn: async () => {
      if (!comprobanteSeleccionado?.id) return null;
      
      const response = await facturacionElectronicaApi.getComprobanteById(comprobanteSeleccionado.id);
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      // response.data tiene estructura: { data: { ...comprobante, detalles: [...] } }
      return response.data?.data || null;
    },
    enabled: !!comprobanteSeleccionado?.id && open,
  });

  const handleRowClicked = ({ data }: { data: ComprobanteElectronico | undefined }) => {
    if (data) {
      setComprobanteSeleccionado(data);
    }
  };

  const handleRowDoubleClicked = ({ data }: { data: ComprobanteElectronico | undefined }) => {
    if (data?.id) {
      onSelect(data.id);
      onClose();
    }
  };

  return (
    <Modal
      centered
      width={1400}
      open={open}
      afterClose={() => {
        setText("");
        setComprobanteSeleccionado(null);
      }}
      title="Buscar Comprobante"
      footer={null}
      onCancel={onClose}
      maskClosable={false}
      keyboard={false}
      styles={{
        body: {
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto",
        },
      }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <SelectBase
          className="w-full sm:!min-w-[180px] sm:!w-[180px] sm:!max-w-[180px]"
          onChange={setTipoDocumento}
          value={tipoDocumento}
          placeholder="Todos los tipos"
          allowClear
          options={[
            { value: "01", label: "Factura" },
            { value: "03", label: "Boleta" },
          ]}
        />
        <InputBase
          placeholder="Buscar por serie-número o cliente..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full sm:max-w-[500px]"
          onPressEnter={() => tableRef.current?.handleRefetch()}
          uppercase={false}
        />
      </div>
      
      <div className="flex flex-col gap-4 mt-4">
        {/* Tabla de comprobantes */}
        <div className="h-[400px] w-full">
          <TableComprobanteSearch
            ref={tableRef}
            value={value}
            onRowClicked={handleRowClicked}
            onRowDoubleClicked={handleRowDoubleClicked}
            tipoDocumento={tipoDocumento}
            isVisible={open}
          />
        </div>

        {/* Tabla de detalles del comprobante seleccionado */}
        {comprobanteSeleccionado && (
          <div className="w-full border-t pt-4">
            <div className="h-[300px] w-full">
              <TableDetalleComprobante
                detalles={comprobanteCompleto?.detalles || []}
                loading={loadingDetalles}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
