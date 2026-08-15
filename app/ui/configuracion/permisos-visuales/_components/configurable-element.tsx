"use client";

import { ReactNode, useState } from "react";
import { useConfigMode } from "./config-mode-context";
import { usePermission } from "~/hooks/use-permission";
import ComponenteAccesoGuard from "~/app/ui/_components/componente-acceso-guard";

type EstadoConfig = "visible" | "autorizacion" | "oculto";

// `color` alimenta la variable CSS --cfg-color, que pinta el borde y el punto de
// estado desde globals.css (.cfg-el). Los estilos viven en CSS, no en divs, para
// no alterar el marcado de la vista previsualizada.
const ESTILO_ESTADO: Record<EstadoConfig, { color: string; label: string }> = {
  visible: { color: "#22c55e", label: "✅ VISIBLE" },
  autorizacion: { color: "#f97316", label: "🔒 REQUIERE AUTORIZACIÓN" },
  oculto: { color: "#ef4444", label: "❌ OCULTO" },
};

interface ConfigurableElementProps {
  componentId: string; // ID del permiso/restricción (ej: "producto.create")
  label: string; // Label legible (ej: "Botón Crear Producto")
  children: ReactNode;
  className?: string;
  /**
   * @deprecated Ya no hace nada. Existía para que el wrapper no forzara
   * `width: 100%` en sidebars. Ahora el wrapper usa `display: contents` y no
   * genera caja, así que nunca impone ancho. Se sigue aceptando para no tener
   * que tocar las ~40 vistas que lo pasan; se puede ir quitando sin efecto.
   */
  noFullWidth?: boolean;
}

/**
 * Wrapper que hace que un elemento sea configurable en modo configuración.
 *
 * Fuera del modo configuración no renderiza nada propio: aplica el permiso y
 * devuelve el hijo. Dentro del modo configuración tampoco altera el layout,
 * porque usa `display: contents` (ver .cfg-el en globals.css).
 *
 * USO:
 * <ConfigurableElement componentId="producto.create" label="Botón Crear">
 *   <Button>Crear Producto</Button>
 * </ConfigurableElement>
 */
export default function ConfigurableElement({
  componentId,
  label,
  children,
  className = "",
}: ConfigurableElementProps) {
  const configMode = useConfigMode();
  const [isHovered, setIsHovered] = useState(false);
  const hasAccess = usePermission(componentId);

  // Si NO está en modo configuración, verificar permisos normales
  if (!configMode?.enabled) {
    // Si está oculto (restricción/lista negra), no renderizar nada
    if (!hasAccess) {
      return null;
    }
    // Si tiene acceso: el guard decide si lo muestra normal o bloqueado por
    // "Requiere autorización" (mismo flujo que las vistas de navegación).
    return (
      <ComponenteAccesoGuard componentId={componentId}>
        {children}
      </ComponenteAccesoGuard>
    );
  }

  // Modo configuración activo: 3 estados (visible / requiere autorización / oculto)
  const isRestricted = configMode.isRestricted(componentId);
  const requiereAuth = !isRestricted && configMode.requiereAutorizacion(componentId);
  const estado: EstadoConfig = isRestricted
    ? "oculto"
    : requiereAuth
      ? "autorizacion"
      : "visible";
  const estilo = ESTILO_ESTADO[estado];

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();

    // Llamar al handler del padre con el ID y label
    configMode.onElementClick(componentId, label);
  };

  // `display: contents` (clase .cfg-el en globals.css): el wrapper NO genera caja.
  // Los hijos siguen siendo hijos directos del grid/flex de la vista, así que
  // conservan `flex-1`, `w-full`, `grid-column`, gaps y anchos, y el preview se
  // ve igual que la pantalla real. Antes este wrapper metía dos divs en medio y
  // el layout se rompía: filtros mal apilados, labels encimados, columnas sin ancho.
  //
  // Los clicks se capturan en fase de captura y se cortan ahí, así el control real
  // nunca los recibe (equivale al overlay que había antes, sin ocupar espacio).
  const bloquear = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className={[
        "cfg-el",
        `cfg-el--${estado}`,
        isHovered ? "cfg-el--hover" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          "--cfg-color": estilo.color,
          "--cfg-label": `"${label.replace(/"/g, "'")} ${estilo.label}"`,
        } as React.CSSProperties
      }
      onClickCapture={handleClick}
      onMouseDownCapture={bloquear}
      onKeyDownCapture={bloquear}
      onMouseOver={() => setIsHovered(true)}
      onMouseOut={() => setIsHovered(false)}
    >
      {children}
    </div>
  );
}
