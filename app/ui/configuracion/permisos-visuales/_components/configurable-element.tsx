"use client";

import { ReactNode, useState } from "react";
import { useConfigMode } from "./config-mode-context";

interface ConfigurableElementProps {
  componentId: string; // ID del permiso/restricción (ej: "producto.create")
  label: string; // Label legible (ej: "Botón Crear Producto")
  children: ReactNode;
  className?: string;
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
}: ConfigurableElementProps) {
  const configMode = useConfigMode();
  const [isHovered, setIsHovered] = useState(false);

  // Si no está en modo configuración, renderizar normalmente
  if (!configMode?.enabled) {
    return <>{children}</>;
  }

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
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Contenido original */}
      <div
        className={`${isRestricted ? "opacity-40 grayscale" : ""} pointer-events-none select-none`}
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
  );
}
