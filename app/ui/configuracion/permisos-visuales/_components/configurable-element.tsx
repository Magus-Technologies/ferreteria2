"use client";

import { ReactNode, useState } from "react";
import { FaCheck, FaLock, FaTimes } from "react-icons/fa";
import { useConfigMode } from "./config-mode-context";
import { usePermission } from "~/hooks/use-permission";
import ComponenteAccesoGuard from "~/app/ui/_components/componente-acceso-guard";

type EstadoConfig = "visible" | "autorizacion" | "oculto";

const ESTILO_ESTADO: Record<
  EstadoConfig,
  { badge: string; borde: string; icon: ReactNode; label: string; tint: string }
> = {
  visible: {
    badge: "bg-green-500",
    borde: "border-green-400/70",
    icon: <FaCheck />,
    label: "✅ VISIBLE",
    tint: "",
  },
  autorizacion: {
    badge: "bg-orange-500",
    borde: "border-orange-400/80",
    icon: <FaLock />,
    label: "🔒 REQUIERE AUTORIZACIÓN",
    tint: "",
  },
  oculto: {
    badge: "bg-red-500",
    borde: "border-red-400/70",
    icon: <FaTimes />,
    label: "❌ OCULTO",
    tint: "opacity-40 grayscale",
  },
};

interface ConfigurableElementProps {
  componentId: string; // ID del permiso/restricción (ej: "producto.create")
  label: string; // Label legible (ej: "Botón Crear Producto")
  children: ReactNode;
  className?: string;
  /** Si true, el wrapper no fuerza width:100% (útil para sidebars que deben mantener su ancho) */
  noFullWidth?: boolean;
}

/**
 * Wrapper que hace que un elemento sea configurable en modo configuración.
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
  noFullWidth = false,
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

  return (
    <div
      className={`configurable-wrapper ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
      }}
    >
      {/* Contenido original - sin forzar anchos */}
      <div
        className={`${estilo.tint} pointer-events-none select-none`}
        style={{ userSelect: "none" }}
      >
        {children}
      </div>

      {/* Overlay clickeable */}
      <div
        className="absolute inset-0 cursor-pointer z-[9999]"
        onClick={handleClick}
        onMouseDown={(e) => e.stopPropagation()}
        title={`Click para configurar: ${label}`}
      />

      {/* Borde de estado SIEMPRE visible (marcado sin necesidad de hover) */}
      <div
        className={`absolute inset-0 pointer-events-none rounded border-2 ${estilo.borde} z-[9997] transition-all`}
      />

      {/* Resalte + label SOLO al pasar el mouse (detalle) */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none border-2 border-blue-500 rounded bg-blue-500/10 z-[9998]">
          <div className="absolute -top-6 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg z-[10000]">
            {label} {estilo.label}
          </div>
        </div>
      )}

      {/* Badge de estado SIEMPRE visible (verde ✓ / naranja 🔒 / rojo ✗), con animación */}
      <div
        className={`absolute -top-2 -right-2 w-5 h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center z-[9998] ${estilo.badge} ${estado === "autorizacion" ? "animate-pulse" : ""}`}
        title={estilo.label}
      >
        <span className="text-white text-[9px] font-bold flex items-center justify-center">
          {estilo.icon}
        </span>
      </div>
    </div>
  );
}
