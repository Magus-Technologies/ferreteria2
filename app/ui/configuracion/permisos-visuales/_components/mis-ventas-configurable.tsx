"use client";

import { Suspense, lazy } from "react";
import { Spin } from "antd";
import ContenedorGeneral from "~/app/_components/containers/contenedor-general";
import { ConfigModeProvider } from "./config-mode-context";
import GlobalConfigOverlay from "./global-config-overlay";

// Importar los mismos componentes lazy que usa Mis Ventas
const FiltersMisVentas = lazy(
  () =>
    import("~/app/ui/facturacion-electronica/mis-ventas/_components/filters/filters-mis-ventas"),
);
const TableMisVentas = lazy(
  () =>
    import("~/app/ui/facturacion-electronica/mis-ventas/_components/tables/table-mis-ventas"),
);
const TableDetalleVenta = lazy(
  () =>
    import("~/app/ui/facturacion-electronica/mis-ventas/_components/tables/table-detalle-venta"),
);
const CardsInfoVentas = lazy(
  () =>
    import("~/app/ui/facturacion-electronica/mis-ventas/_components/others/cards-info-ventas"),
);

const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
);

interface MisVentasConfigurableProps {
  permisosActivos: Set<string>;
  onTogglePermiso: (componentId: string, componentLabel: string) => void;
}

/**
 * Versión configurable del componente Mis Ventas.
 * Carga el componente real pero en modo configuración.
 */
export default function MisVentasConfigurable({
  permisosActivos,
  onTogglePermiso,
}: MisVentasConfigurableProps) {
  return (
    <>
      {/* Overlay global que bloquea TODAS las interacciones */}
      <GlobalConfigOverlay enabled={false} />

      <ConfigModeProvider
        enabled={true}
        permisosActivos={permisosActivos}
        onTogglePermiso={onTogglePermiso}
      >
        {/* Banner informativo */}
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">⚙️</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-blue-900 mb-1">
                Modo Configuración Visual Activo
              </h3>
              <p className="text-sm text-blue-800 leading-relaxed">
                Esta es la <strong>vista real de Mis Ventas</strong> cargada en
                modo configuración. Los datos mostrados son reales pero{" "}
                <strong>todas las acciones están deshabilitadas</strong>. Puedes
                hacer clic sobre elementos para activar/desactivar permisos. Los
                elementos con{" "}
                <span className="inline-flex items-center justify-center w-5 h-5 bg-green-500 text-white text-xs rounded-full mx-1">
                  ✓
                </span>{" "}
                están activos, los que tienen{" "}
                <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs rounded-full mx-1">
                  ✗
                </span>{" "}
                están inactivos.
              </p>
            </div>
          </div>
        </div>

        <ContenedorGeneral>
          <div className="w-full">
            <Suspense fallback={<ComponentLoading />}>
              <FiltersMisVentas />
            </Suspense>

            {/* Layout responsivo similar a Mi Almacén */}
            <div className="w-full mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                {/* Columna principal - Tablas */}
                <div className="flex flex-col gap-4 sm:gap-5 md:gap-6 min-w-0">
                  <div className="h-[300px]">
                    <Suspense fallback={<ComponentLoading />}>
                      <TableMisVentas />
                    </Suspense>
                  </div>
                  <div>
                    <Suspense fallback={<ComponentLoading />}>
                      <TableDetalleVenta />
                    </Suspense>
                  </div>
                </div>

                {/* Columna lateral - Cards (Solo Desktop) */}
                <div className="hidden lg:flex flex-col items-start gap-4 flex-nowrap min-w-[140px]">
                  <Suspense fallback={<Spin />}>
                    <CardsInfoVentas />
                  </Suspense>
                </div>
              </div>

              {/* Cards de información - Móvil/Tablet: Abajo en grid */}
              <div className="lg:hidden mt-4">
                <Suspense fallback={<Spin />}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <CardsInfoVentas />
                  </div>
                </Suspense>
              </div>
            </div>
          </div>
        </ContenedorGeneral>
      </ConfigModeProvider>
    </>
  );
}
