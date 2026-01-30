"use client";

import { ReactNode, useState } from "react";
import { useConfigMode } from "./config-mode-context";
import { usePermission } from "~/hooks/use-permission";

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
    // Si no tiene acceso, no renderizar nada
    if (!hasAccess) {
      return null;
    }
    // Si tiene acceso, renderizar normalmente
    return <>{children}</>;
  }

  // Modo configuración activo
  const isRestricted = configMode.isRestricted(componentId);

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
        display: 'contents' // Hace que el wrapper sea transparente para el layout
      }}
    >
      {/* Wrapper interno: no forzar width en sidebars para no romper el layout */}
      <div
        style={{
          position: 'relative',
          width: noFullWidth ? undefined : '100%',
          minWidth: noFullWidth ? undefined : 0,
        }}
        className={noFullWidth ? 'shrink-0' : ''}
      >
        {/* Contenido original */}
        <div
          className={`${isRestricted ? "opacity-40 grayscale" : ""} pointer-events-none select-none`}
          style={{ userSelect: "none", width: noFullWidth ? undefined : '100%' }}
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

        {/* Borde hover */}
        {isHovered && (
          <div className="absolute inset-0 pointer-events-none border-2 border-blue-500 rounded bg-blue-500/10 z-[9998]">
            <div className="absolute -top-6 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
              {label} {isRestricted ? "❌ OCULTO" : "✅ VISIBLE"}
            </div>
          </div>
        )}

        {/* Badge de estado */}
        <div
          className={`absolute -top-2 -right-2 w-5 h-5 rounded-full border-2 border-white shadow-md flex items-center justify-center z-[9998] ${
            isRestricted ? "bg-red-500" : "bg-green-500"
          }`}
        >
          <span className="text-white text-[10px] font-bold">
            {isRestricted ? "✗" : "✓"}
          </span>
        </div>
      </div>
    </div>
  );
}
