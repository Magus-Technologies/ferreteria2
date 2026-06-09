"use client";

import { createContext, useContext, ReactNode } from "react";

interface ConfigModeContextType {
  enabled: boolean;
  restriccionesActivas: Set<string>;
  /** componentIds que requieren autorización de acceso para el rol. */
  autorizacionesActivas: Set<string>;
  onElementClick: (componentId: string, componentLabel: string) => void;
  isRestricted: (componentId: string) => boolean;
  requiereAutorizacion: (componentId: string) => boolean;
}

const ConfigModeContext = createContext<ConfigModeContextType | null>(null);

export function useConfigMode() {
  return useContext(ConfigModeContext);
}

interface ConfigModeProviderProps {
  children: ReactNode;
  enabled?: boolean;
  permisosActivos?: Set<string>; // Son restricciones en realidad
  autorizacionesActivas?: Set<string>; // componentIds que requieren autorización
  onTogglePermiso?: (componentId: string, componentLabel: string) => void;
}

export function ConfigModeProvider({
  children,
  enabled = false,
  permisosActivos = new Set(),
  autorizacionesActivas = new Set(),
  onTogglePermiso = () => {},
}: ConfigModeProviderProps) {
  const isRestricted = (componentId: string) => {
    return permisosActivos.has(componentId);
  };

  const requiereAutorizacion = (componentId: string) => {
    return autorizacionesActivas.has(componentId);
  };

  return (
    <ConfigModeContext.Provider
      value={{
        enabled,
        restriccionesActivas: permisosActivos,
        autorizacionesActivas,
        onElementClick: onTogglePermiso,
        isRestricted,
        requiereAutorizacion,
      }}
    >
      {children}
    </ConfigModeContext.Provider>
  );
}
