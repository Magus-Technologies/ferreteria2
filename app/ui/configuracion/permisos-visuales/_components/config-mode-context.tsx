"use client";

import { createContext, useContext, ReactNode } from "react";

interface ConfigModeContextType {
  enabled: boolean;
  restriccionesActivas: Set<string>;
  onElementClick: (componentId: string, componentLabel: string) => void;
  isRestricted: (componentId: string) => boolean;
}

const ConfigModeContext = createContext<ConfigModeContextType | null>(null);

export function useConfigMode() {
  return useContext(ConfigModeContext);
}

interface ConfigModeProviderProps {
  children: ReactNode;
  enabled?: boolean;
  permisosActivos?: Set<string>; // Son restricciones en realidad
  onTogglePermiso?: (componentId: string, componentLabel: string) => void;
}

export function ConfigModeProvider({
  children,
  enabled = false,
  permisosActivos = new Set(),
  onTogglePermiso = () => {},
}: ConfigModeProviderProps) {
  const isRestricted = (componentId: string) => {
    return permisosActivos.has(componentId);
  };

  return (
    <ConfigModeContext.Provider
      value={{
        enabled,
        restriccionesActivas: permisosActivos,
        onElementClick: onTogglePermiso,
        isRestricted,
      }}
    >
      {children}
    </ConfigModeContext.Provider>
  );
}
