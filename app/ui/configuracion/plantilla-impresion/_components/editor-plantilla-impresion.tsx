"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  App,
  Button,
  Card,
  Collapse,
  ColorPicker,
  Input,
  Select,
  Slider,
  Spin,
  Switch,
} from "antd";
import QuillEditor from "~/app/_components/form/inputs/quill-editor";
import {
  plantillaImpresionApi,
  type PlantillaImpresion,
  type PlantillaImpresionPayload,
  type EstilosPlantilla,
  type MensajesExtraPlantilla,
  type EstilosSecciones,
  type EstiloBloque,
  type BloqueKey,
  type Densidad,
  ESTILOS_DEFAULT,
  MENSAJES_EXTRA_DEFAULT,
  ESTILOS_SECCIONES_DEFAULT,
  BLOQUE_VACIO,
  FUENTES_DISPONIBLES,
  resolverEstilos,
} from "~/lib/api/plantilla-impresion";
import { fuentesApi, type FuentePersonalizada } from "~/lib/api/fuentes";
import { QueryKeys } from "~/app/_lib/queryKeys";
import PreviewPlantillaImpresion from "./preview-plantilla-impresion";
import EditorBloques from "./editor-bloques";
import GestorFuentes from "./gestor-fuentes";

const MAX_CHARS = 2000;

const BLOQUES_PDF: Array<{
  key: string;
  label: string;
  ejemplo: string;
  estilos: BloqueKey[];
}> = [
  {
    key: "empresa",
    label: "Bloque 8 - Empresa",
    ejemplo:
      "GRUPO MI REDENTOR S.A.C. / direccion / Email: grupomiredentorsac@gmail.com",
    estilos: ["empresa_razon", "empresa_direccion"],
  },
  {
    key: "documento",
    label: "Bloque 7 - Documento",
    ejemplo: "R.U.C. 20611539160 / BOLETA DE VENTA / B001-00000325",
    estilos: ["caja_ruc", "caja_tipo", "caja_numero"],
  },
  {
    key: "cliente",
    label: "Bloque 6 - Datos del cliente",
    ejemplo: "Cliente, direccion, RUC/DNI, vendedor, almacen, forma de pago",
    estilos: ["info_label", "info_valor"],
  },
  {
    key: "productos",
    label: "Bloque 5 - Productos y monto en letras",
    ejemplo: "ITEM, CODIGO, CANT., DESCRIPCION, IMPORTE / SON: VEINTE...",
    estilos: ["tabla_header", "tabla_fila", "son"],
  },
  {
    key: "observaciones",
    label: "Bloque 4 - Observaciones",
    ejemplo: "OBSERVACIONES / - NINGUNA",
    estilos: ["obs_label", "obs_valor"],
  },
  {
    key: "totales",
    label: "Bloque 3 - Totales",
    ejemplo: "SUBTOTAL 16.95 / IGV (18%) 3.05 / TOTAL 20.00",
    estilos: ["total_label", "total_valor"],
  },
  {
    key: "pie",
    label: "Bloque 2 - Pie y despedida",
    ejemplo: "Representacion impresa del comprobante electronico / Muchas gracias...",
    estilos: ["despedida_footer"],
  },
  {
    key: "consulta",
    label: "Bloque 1 - Consulta",
    ejemplo: "Consulte su documento en: / http://localhost:3000/consulta",
    estilos: ["consulta_leyenda", "consulta_url"],
  },
];

interface SeccionEstado {
  html: string;
  activo: boolean;
  chars: number;
}

interface EditorPlantillaImpresionProps {
  comprobante?: string;
  formato?: "A4" | "Ticket";
}

export default function EditorPlantillaImpresion({
  comprobante,
  formato,
}: EditorPlantillaImpresionProps) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.PLANTILLA_IMPRESION, comprobante ?? '', formato ?? ''],
    queryFn: () => plantillaImpresionApi.show({ comprobante, formato }),
  });

  const [despedida, setDespedida] = useState<SeccionEstado>({
    html: "",
    activo: false,
    chars: 0,
  });

  const [estilos, setEstilos] = useState<EstilosPlantilla>(ESTILOS_DEFAULT);
  const [mensajesExtra, setMensajesExtra] =
    useState<MensajesExtraPlantilla>(MENSAJES_EXTRA_DEFAULT);
  const [estilosSecciones, setEstilosSecciones] = useState<EstilosSecciones>(
    ESTILOS_SECCIONES_DEFAULT
  );
  const [logosNotaVenta, setLogosNotaVenta] = useState<number[]>([]);
  const [fuentesPersonalizadas, setFuentesPersonalizadas] = useState<FuentePersonalizada[]>([]);
  const [gestorFuentesOpen, setGestorFuentesOpen] = useState(false);

  useEffect(() => {
    fuentesApi.list().then((res) => {
      if (res.data?.data) setFuentesPersonalizadas(res.data.data)
    }).catch(() => {})
  }, [])

  const fuentesDisponibles = useMemo(() => [
    ...FUENTES_DISPONIBLES,
    ...fuentesPersonalizadas.map((f) => f.nombre),
  ], [fuentesPersonalizadas])

  useEffect(() => {
    const remote = data?.data?.data;
    if (!remote) return;
    setDespedida({
      html: remote.mensaje_despedida ?? "",
      activo: remote.despedida_activo,
      chars: stripHtml(remote.mensaje_despedida).length,
    });
    setLogosNotaVenta(remote.logos_nota_venta ?? []);
    setEstilos({ ...ESTILOS_DEFAULT, ...remote.estilos });
    setMensajesExtra({ ...MENSAJES_EXTRA_DEFAULT, ...remote.mensajes_extra });
    setEstilosSecciones({
      ...ESTILOS_SECCIONES_DEFAULT,
      ...(remote.estilos_secciones ?? {}),
    });
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (payload: PlantillaImpresionPayload) =>
      plantillaImpresionApi.update(payload),
    onSuccess: (response) => {
      if (response.data?.success) {
        message.success(response.data.message || "Plantilla guardada");
        queryClient.invalidateQueries({
          queryKey: [QueryKeys.PLANTILLA_IMPRESION, comprobante ?? '', formato ?? ''],
        });
      } else if (response.error) {
        message.error(response.error.message);
      }
    },
    onError: () => message.error("No se pudo guardar la plantilla"),
  });

  const handleGuardar = () => {
    updateMutation.mutate({
      mensaje_despedida: despedida.html,
      despedida_activo: despedida.activo,
      logos_nota_venta: logosNotaVenta,
      estilos,
      mensajes_extra: mensajesExtra,
      estilos_secciones: estilosSecciones,
      comprobante: comprobante ?? undefined,
      formato: formato ?? undefined,
    });
  };

  const updateBloque = (key: BloqueKey, patch: Partial<EstiloBloque>) => {
    setEstilosSecciones((s) => ({
      ...s,
      [key]: { ...s[key], ...patch },
    }));
  };

  const resetBloque = (key: BloqueKey) => {
    setEstilosSecciones((s) => ({ ...s, [key]: { ...BLOQUE_VACIO } }));
  };

  const previewPlantilla: PlantillaImpresion = {
    empresa_id: 0,
    mensaje_despedida: despedida.html,
    despedida_activo: despedida.activo,
    logos_nota_venta: logosNotaVenta,
    estilos,
    mensajes_extra: mensajesExtra,
    estilos_secciones: estilosSecciones,
  };

  const globalResuelto = resolverEstilos(estilos);

  const collapseItems = useMemo(
    () => [
      {
        key: "base",
        label: (
          <span className="font-semibold">
            Configuración global del PDF (no es un bloque numerado)
          </span>
        ),
        children: (
          <>
            <div className="flex justify-end mb-2">
              <Button size="small" type="dashed" onClick={() => setGestorFuentesOpen(true)}>
                Gestionar fuentes
              </Button>
            </div>
            <EstilosGlobalesEditor
              estilos={estilos}
              onChange={(patch) => setEstilos((s) => ({ ...s, ...patch }))}
              fuentes={fuentesDisponibles}
            />
          </>
        ),
      },
      ...BLOQUES_PDF.map((bloque) => ({
        key: bloque.key,
        label: <span className="font-semibold">{bloque.label}</span>,
        children: (
          <BloquePdfEditor
            bloque={bloque}
            comprobante={comprobante}
            despedida={despedida}
            mensajes={mensajesExtra}
            estilosSecciones={estilosSecciones}
            globalEst={globalResuelto}
            fuentes={fuentesDisponibles}
            onDespedidaChange={(patch) =>
              setDespedida((s) => ({ ...s, ...patch }))
            }
            onMensajesChange={(patch) =>
              setMensajesExtra((m) => ({ ...m, ...patch }))
            }
            onBloqueChange={updateBloque}
            onBloqueReset={resetBloque}
          />
        ),
      })),
    ],
    [despedida, estilos, mensajesExtra, estilosSecciones, globalResuelto, comprobante]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {(comprobante || formato) && (
        <div className="mb-4 rounded border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <span className="font-semibold">Comprobante:</span> {comprobante ?? "General"} ·{' '}
          <span className="font-semibold">Formato:</span> {formato ?? "A4"}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Configuración" className="shadow-sm">
          <Collapse items={collapseItems} defaultActiveKey={["base", "consulta", "pie"]} />

          <div className="flex justify-end pt-6">
            <Button
              type="primary"
              loading={updateMutation.isPending}
              onClick={handleGuardar}
              className="bg-cyan-600 hover:bg-cyan-700 px-8"
            >
              Guardar Cambios
            </Button>
          </div>
        </Card>

        <Card title="Vista previa" className="shadow-sm">
          <PreviewPlantillaImpresion
            plantilla={previewPlantilla}
            formato={formato}
            comprobante={comprobante}
            fuentesPersonalizadas={fuentesPersonalizadas}
          />
        </Card>
      </div>

      <GestorFuentes
        open={gestorFuentesOpen}
        onClose={() => setGestorFuentesOpen(false)}
        onFuentesChange={() => {
          fuentesApi.list().then((res) => {
            if (res.data?.data) setFuentesPersonalizadas(res.data.data)
          }).catch(() => {})
        }}
      />
    </div>
  );
}

interface BloquePdfEditorProps {
  bloque: (typeof BLOQUES_PDF)[number];
  comprobante?: string;
  despedida: SeccionEstado;
  mensajes: MensajesExtraPlantilla;
  estilosSecciones: EstilosSecciones;
  globalEst: ReturnType<typeof resolverEstilos>;
  fuentes: string[];
  onDespedidaChange: (patch: Partial<SeccionEstado>) => void;
  onMensajesChange: (patch: Partial<MensajesExtraPlantilla>) => void;
  onBloqueChange: (key: BloqueKey, patch: Partial<EstiloBloque>) => void;
  onBloqueReset: (key: BloqueKey) => void;
}

function BloquePdfEditor({
  bloque,
  comprobante,
  despedida,
  mensajes,
  estilosSecciones,
  globalEst,
  fuentes,
  onDespedidaChange,
  onMensajesChange,
  onBloqueChange,
  onBloqueReset,
}: BloquePdfEditorProps) {
  const esCotizacion = comprobante === "cotizacion";
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        {bloque.ejemplo}
      </div>

      {bloque.key === "observaciones" && (
        <div className="grid grid-cols-1 gap-4">
          <TextRow
            label="Titulo del bloque"
            value={mensajes.label_observaciones}
            onChange={(v) => onMensajesChange({ label_observaciones: v })}
            placeholder="OBSERVACIONES"
            maxLength={80}
          />
          <TextRow
            label="Texto cuando no hay observaciones"
            value={mensajes.observaciones_default}
            onChange={(v) => onMensajesChange({ observaciones_default: v })}
            placeholder="- NINGUNA"
            maxLength={255}
          />
        </div>
      )}

      {bloque.key === "consulta" && (
        <div className="grid grid-cols-1 gap-4">
          <TextRow
            label="Texto de consulta"
            value={mensajes.leyenda_consulta}
            onChange={(v) => onMensajesChange({ leyenda_consulta: v })}
            placeholder="Consulte su documento en:"
            maxLength={120}
          />
          <div className="text-xs text-slate-500">
            La URL de consulta está fija y se renderiza como parte del bloque.
          </div>
        </div>
      )}

      {bloque.key === "pie" && (
        <div className="grid grid-cols-1 gap-4">
          <TextRow
            label="Texto de representacion impresa"
            value={mensajes.leyenda_representacion}
            onChange={(v) => onMensajesChange({ leyenda_representacion: v })}
            placeholder="Representacion impresa del comprobante electronico"
            maxLength={200}
          />
          <SeccionEditor
            estado={despedida}
            onChange={onDespedidaChange}
            placeholder="GRACIAS POR SU PREFERENCIA!"
          />
          {esCotizacion && (
            <div className="rounded border border-amber-200 bg-amber-50 px-3 py-3 flex flex-col gap-3">
              <div className="text-xs font-semibold text-amber-700">
                Opciones específicas de cotización
              </div>
              <ToggleRow
                label='Mostrar mensaje de despedida ("Sin otro particular... GRACIAS POR SU PREFERENCIA!")'
                checked={!mensajes.ocultar_despedida}
                onChange={(v) => onMensajesChange({ ocultar_despedida: !v })}
              />
              <ToggleRow
                label='Mostrar línea "- CANJEAR POR BOLETA O FACTURA -"'
                checked={!mensajes.ocultar_canjear}
                onChange={(v) => onMensajesChange({ ocultar_canjear: !v })}
              />
              <ToggleRow
                label="Mostrar tabla de cuentas bancarias"
                checked={!mensajes.ocultar_cuentas_bancarias}
                onChange={(v) => onMensajesChange({ ocultar_cuentas_bancarias: !v })}
              />
            </div>
          )}
        </div>
      )}

      <EditorBloques
        keys={bloque.estilos}
        secciones={estilosSecciones}
        globalEst={globalEst}
        fuentes={fuentes}
        onChange={onBloqueChange}
        onReset={onBloqueReset}
      />
    </div>
  );
}

interface SeccionEditorProps {
  estado: SeccionEstado;
  onChange: (patch: Partial<SeccionEstado>) => void;
  placeholder?: string;
}

function SeccionEditor({ estado, onChange, placeholder }: SeccionEditorProps) {
  const overLimit = estado.chars > MAX_CHARS;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span
          className={`text-xs ${
            overLimit ? "text-rose-600 font-semibold" : "text-slate-500"
          }`}
        >
          {estado.chars}/{MAX_CHARS} caracteres
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">Activar sección</span>
          <Switch
            checked={estado.activo}
            onChange={(v) => onChange({ activo: v })}
            className={estado.activo ? "!bg-emerald-500" : ""}
          />
        </div>
      </div>
      <QuillEditor
        value={estado.html}
        onChange={(html, chars) => onChange({ html, chars })}
        placeholder={placeholder}
      />
    </div>
  );
}

interface EstilosGlobalesEditorProps {
  estilos: EstilosPlantilla;
  onChange: (patch: Partial<EstilosPlantilla>) => void;
  fuentes: string[];
}

function EstilosGlobalesEditor({
  estilos,
  onChange,
  fuentes,
}: EstilosGlobalesEditorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ColorRow
        label="Color del tema"
        descripcion="Fondo del header de la tabla y caja del documento."
        value={estilos.color_tema}
        onChange={(v) => onChange({ color_tema: v })}
      />
      <ColorRow
        label="Color de bordes"
        descripcion="Líneas y bordes de info-grid, tabla, totales."
        value={estilos.color_borde}
        onChange={(v) => onChange({ color_borde: v })}
      />
      <ColorRow
        label="Color de texto"
        descripcion="Color base del cuerpo del documento."
        value={estilos.color_texto}
        onChange={(v) => onChange({ color_texto: v })}
      />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600">
          Tipografía
        </label>
        <Select
          value={estilos.fuente}
          onChange={(v) => onChange({ fuente: v })}
          options={fuentes.map((f) => ({ label: f, value: f }))}
          showSearch
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600">
          Tamaño base ({estilos.tamano_base} pt)
        </label>
        <Slider
          min={6}
          max={14}
          step={1}
          value={estilos.tamano_base}
          onChange={(v) => onChange({ tamano_base: v })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600">
          Grosor de bordes ({estilos.grosor_borde} px)
        </label>
        <Slider
          min={0}
          max={5}
          step={1}
          value={estilos.grosor_borde}
          onChange={(v) => onChange({ grosor_borde: v })}
        />
      </div>

      <div className="flex flex-col gap-1 md:col-span-2">
        <label className="text-xs font-semibold text-slate-600">
          Densidad
        </label>
        <Select
          value={estilos.densidad}
          onChange={(v: Densidad) => onChange({ densidad: v })}
          options={[
            { label: "Compacta", value: "compacta" },
            { label: "Normal", value: "normal" },
            { label: "Espaciada", value: "espaciada" },
          ]}
        />
      </div>
    </div>
  );
}

function ColorRow({
  label,
  descripcion,
  value,
  onChange,
}: {
  label: string;
  descripcion?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      <div className="flex items-center gap-2">
        <ColorPicker
          value={value}
          onChange={(c) => onChange(c.toHexString())}
          showText
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
      </div>
      {descripcion && (
        <span className="text-[10px] text-slate-400">{descripcion}</span>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-700 flex-1">{label}</span>
      <Switch
        checked={checked}
        onChange={onChange}
        className={checked ? "!bg-emerald-500" : ""}
      />
    </div>
  );
}

function TextRow({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        showCount={!!maxLength}
      />
    </div>
  );
}

function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  if (typeof window === "undefined") {
    return html.replace(/<[^>]*>/g, "");
  }
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").replace(/\n+$/, "");
}
