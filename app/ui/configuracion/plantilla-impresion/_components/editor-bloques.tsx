"use client";

import { Button, ColorPicker, Collapse, Input, Select, Slider, Switch } from "antd";
import {
  BLOQUES_CATALOGO,
  FUENTES_DISPONIBLES,
  type BloqueKey,
  type EstiloBloque,
  type EstiloBloqueResuelto,
  type EstilosResueltos,
  type EstilosSecciones,
  defaultsBloque,
} from "~/lib/api/plantilla-impresion";

interface Props {
  secciones: EstilosSecciones;
  globalEst: EstilosResueltos;
  keys?: BloqueKey[];
  onChange: (key: BloqueKey, patch: Partial<EstiloBloque>) => void;
  onReset: (key: BloqueKey) => void;
}

export default function EditorBloques({
  secciones,
  globalEst,
  keys,
  onChange,
  onReset,
}: Props) {
  const bloques = keys
    ? BLOQUES_CATALOGO.filter((b) => keys.includes(b.key))
    : BLOQUES_CATALOGO;

  return (
    <Collapse
      accordion
      size="small"
      items={bloques.map((b) => ({
        key: b.key,
        label: (
          <div className="flex items-center justify-between w-full pr-3">
            <span className="text-sm">{b.label}</span>
            {tieneOverride(secciones[b.key]) && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 font-semibold">
                personalizado
              </span>
            )}
          </div>
        ),
        children: (
          <BloqueEditor
            keyBloque={b.key}
            override={secciones[b.key]}
            defaults={defaultsBloque(b.key, globalEst)}
            onChange={(patch) => onChange(b.key, patch)}
            onReset={() => onReset(b.key)}
          />
        ),
      }))}
    />
  );
}

function tieneOverride(o: EstiloBloque | undefined): boolean {
  if (!o) return false;
  return !!(
    o.color ||
    o.tamano ||
    o.peso ||
    o.alineacion ||
    o.cursiva ||
    o.subrayado ||
    o.fuente
  );
}

interface BloqueEditorProps {
  keyBloque: BloqueKey;
  override: EstiloBloque | undefined;
  defaults: EstiloBloqueResuelto;
  onChange: (patch: Partial<EstiloBloque>) => void;
  onReset: () => void;
}

function BloqueEditor({
  override,
  defaults,
  onChange,
  onReset,
}: BloqueEditorProps) {
  const valor: EstiloBloqueResuelto = {
    color: override?.color || defaults.color,
    tamano: override?.tamano || defaults.tamano,
    peso: override?.peso || defaults.peso,
    alineacion: override?.alineacion || defaults.alineacion,
    cursiva: override?.cursiva ?? defaults.cursiva,
    subrayado: override?.subrayado ?? defaults.subrayado,
    fuente: override?.fuente || defaults.fuente,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600">Color</label>
        <div className="flex items-center gap-2">
          <ColorPicker
            value={valor.color}
            onChange={(c) => onChange({ color: c.toHexString() })}
            showText
          />
          <Input
            value={override?.color ?? ""}
            placeholder={defaults.color}
            onChange={(e) => onChange({ color: e.target.value || null })}
            className="flex-1"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600">
          Tamaño ({valor.tamano} pt)
        </label>
        <Slider
          min={5}
          max={24}
          step={1}
          value={valor.tamano}
          onChange={(v) => onChange({ tamano: v })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600">Peso</label>
        <Select
          value={valor.peso}
          onChange={(v) => onChange({ peso: v })}
          options={[
            { label: "Normal", value: "normal" },
            { label: "Negrita", value: "bold" },
          ]}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600">
          Alineación
        </label>
        <Select
          value={valor.alineacion}
          onChange={(v) => onChange({ alineacion: v })}
          options={[
            { label: "Izquierda", value: "left" },
            { label: "Centrado", value: "center" },
            { label: "Derecha", value: "right" },
          ]}
        />
      </div>

        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs font-semibold text-slate-600">
            Tipografía
          </label>
          <Select
            value={valor.fuente}
            onChange={(v) => onChange({ fuente: v })}
            options={FUENTES_DISPONIBLES.map((f) => ({ label: f, value: f }))}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600">Cursiva</label>
        <Switch
          checked={valor.cursiva}
          onChange={(checked) => onChange({ cursiva: checked })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-600">Subrayado</label>
        <Switch
          checked={valor.subrayado}
          onChange={(checked) => onChange({ subrayado: checked })}
        />
      </div>

      <div className="md:col-span-2 flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
        <span className="text-[11px] text-slate-500">
          Defaults: {defaults.color} · {defaults.tamano}pt · {defaults.peso} ·{" "}
          {defaults.alineacion} · {defaults.fuente}
        </span>
        <Button
          size="small"
          onClick={onReset}
          disabled={!tieneOverride(override)}
        >
          Restablecer a global
        </Button>
      </div>
    </div>
  );
}
