"use client";

import { Form, Tag, App } from "antd";
import { ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import dayjs, { Dayjs } from "dayjs";
import { FaPaperPlane } from "react-icons/fa";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import ButtonBase from "~/components/buttons/button-base";
import FormBase from "~/components/form/form-base";
import TableWithTitle from "~/components/tables/table-with-title";
import InputBase from "~/app/_components/form/inputs/input-base";
import FilterDateRangeFields from "~/app/_components/filters/filter-date-range-fields";
import { facturacionElectronicaApi, DetalleComunicacionBaja, PendienteBaja } from "~/lib/api/facturacion-electronica";
import {  orangeColors } from "~/lib/colors";
import { FaBan } from "react-icons/fa6";

interface ValuesFiltros {
  desde?: Dayjs;
  hasta?: Dayjs;
}

export default function ComunicacionBajaPage() {
  const { message, modal } = App.useApp();
  const searchParams = useSearchParams();
  const ventaIdParaSeleccionar = searchParams.get("venta_id");

  const [form] = Form.useForm<ValuesFiltros>();
  const [rango, setRango] = useState<{ desde?: Dayjs; hasta?: Dayjs }>({
    desde: dayjs().startOf("day"),
    hasta: dayjs().endOf("day"),
  });
  const MOTIVO_DEFAULT = "Venta anulada";
  const [seleccionado, setSeleccionado] = useState<PendienteBaja | null>(null);
  const [motivo, setMotivo] = useState(MOTIVO_DEFAULT);
  const [enviando, setEnviando] = useState(false);
  const tableRef = useRef<AgGridReact<PendienteBaja>>(null);

  // Carga automática al entrar — antes esta pantalla arrancaba en blanco y
  // había que tipear "." y apretar "Buscar Pendientes" para ver algo.
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["comunicacion-baja", "pendientes"],
    queryFn: async () => {
      const response = await facturacionElectronicaApi.getPendientesBaja();
      if (response.error) throw new Error(response.error.message);
      return response.data?.data || [];
    },
  });

  const filas = useMemo(() => {
    const lista = data || [];
    if (!rango.desde && !rango.hasta) return lista;
    return lista.filter((f) => {
      const fecha = dayjs(f.fecha_emision);
      if (rango.desde && fecha.isBefore(rango.desde, "day")) return false;
      if (rango.hasta && fecha.isAfter(rango.hasta, "day")) return false;
      return true;
    });
  }, [data, rango]);

  // Si venimos desde "Mis Ventas" con ?venta_id=..., preseleccionar esa fila
  // apenas cargan los datos, en vez de obligar a buscarla a mano.
  useEffect(() => {
    if (!ventaIdParaSeleccionar || !data) return;
    const fila = data.find((f) => f.venta_id === ventaIdParaSeleccionar);
    if (fila) setSeleccionado(fila);
  }, [ventaIdParaSeleccionar, data]);

  const columns: ColDef<PendienteBaja>[] = [
    { headerName: "Tipo", field: "tipo_comprobante_nombre", width: 100 },
    { headerName: "Serie-Número", field: "serie_numero", width: 140 },
    {
      headerName: "Fecha Emisión",
      field: "fecha_emision",
      width: 140,
      valueFormatter: (p) => dayjs(p.value).format("DD/MM/YYYY"),
    },
    { headerName: "Cliente", field: "cliente_razon_social", flex: 1 },
    {
      headerName: "Total",
      field: "importe_total",
      width: 110,
      valueFormatter: (p) => `S/. ${Number(p.value ?? 0).toFixed(2)}`,
    },
    {
      headerName: "Estado Venta",
      field: "estado_venta_nombre",
      width: 130,
      cellRenderer: (p: { data: PendienteBaja }) => (
        <Tag color={p.data.estado_venta === "an" ? "red" : "default"}>
          {p.data.estado_venta_nombre ?? "—"}
        </Tag>
      ),
    },
    { headerName: "Estado SUNAT", field: "estado_sunat", width: 150 },
    {
      headerName: "Plazo Baja",
      field: "dentro_de_plazo_baja",
      width: 190,
      cellRenderer: (p: { data: PendienteBaja }) => {
        const d = p.data;
        return d.dentro_de_plazo_baja ? (
          <Tag color="green">
            Dentro de plazo ({d.dias_desde_emision}/{d.plazo_maximo_dias} días)
          </Tag>
        ) : (
          <Tag color="red">Vencido — usar Nota de Crédito</Tag>
        );
      },
    },
  ];

  const handleEnviarBaja = () => {
    if (!seleccionado) {
      message.warning("Selecciona un comprobante");
      return;
    }
    if (!seleccionado.dentro_de_plazo_baja) {
      message.error("Este comprobante ya venció su plazo de baja — corresponde Nota de Crédito.");
      return;
    }
    if (!motivo.trim()) {
      message.warning("Ingresa un motivo para la comunicación de baja");
      return;
    }

    const detalle: DetalleComunicacionBaja = {
      tipo_doc: seleccionado.tipo_comprobante,
      serie: seleccionado.serie,
      correlativo: String(seleccionado.correlativo),
      motivo,
    };

    modal.confirm({
      title: "Enviar Comunicación de Baja",
      content: `¿Confirmás dar de baja ${seleccionado.serie_numero}? Esta acción no se puede deshacer.`,
      okText: "Sí, enviar",
      cancelText: "Cancelar",
      okButtonProps: { danger: true },
      onOk: async () => {
        setEnviando(true);
        try {
          const result = await facturacionElectronicaApi.enviarBajaSunat([detalle]);
          if (result.error) {
            message.error(result.error.message || "Error al enviar comunicación de baja");
            return;
          }
          if (result.data?.success) {
            message.success(`Comunicación de baja enviada. Código: ${result.data.codigo_sunat || "0"}`);
            setSeleccionado(null);
            setMotivo(MOTIVO_DEFAULT);
            refetch();
          } else {
            message.error(result.data?.message || "Error al enviar comunicación de baja");
          }
        } catch (error: any) {
          message.error("Error: " + error?.message);
        } finally {
          setEnviando(false);
        }
      },
    });
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <FormBase
        form={form}
        name="filtros-comunicacion-baja"
        initialValues={{ desde: rango.desde, hasta: rango.hasta }}
        onValuesChange={(_, values) => setRango({ desde: values.desde, hasta: values.hasta })}
      >
        <TituloModulos title="Comunicación de Baja" icon={<FaBan className="text-red-600" />}>
          <div className="flex items-center gap-3 flex-wrap">
            <FilterDateRangeFields fromName="desde" toName="hasta" fromLabel="Desde:" />
          </div>
        </TituloModulos>
      </FormBase>

      <div className="h-[420px]">
        <TableWithTitle<PendienteBaja>
          id="comunicacion-baja-pendientes"
          title="VENTAS ANULADAS PENDIENTES DE BAJA (SUNAT sigue con el comprobante vigente)"
          loading={isLoading}
          columnDefs={columns}
          rowData={filas}
          tableRef={tableRef}
          selectionColor={orangeColors[0]}
          onRowClicked={(event) => event.node.setSelected(true)}
          onSelectionChanged={({ selectedNodes }) => {
            setSeleccionado((selectedNodes?.[0]?.data as PendienteBaja) ?? null);
          }}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 border-t border-gray-100 pt-4">
        <div className="flex-1 w-full">
          <label className="text-sm font-semibold text-gray-700 block mb-1">
            Motivo de la comunicación de baja
            {seleccionado && (
              <span className="ml-2 font-normal text-gray-500">— {seleccionado.serie_numero}</span>
            )}
          </label>
          <InputBase
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Venta anulada por devolución del cliente"
            uppercase={false}
          />
        </div>
        <ButtonBase
          color="danger"
          size="md"
          onClick={handleEnviarBaja}
          disabled={!seleccionado}
          loading={enviando}
          className="flex items-center gap-2 whitespace-nowrap"
        >
          <FaPaperPlane />
          Enviar a SUNAT
        </ButtonBase>
      </div>
    </div>
  );
}
