"use client";

import ContenedorGeneral from "~/app/_components/containers/contenedor-general";
import NoAutorizado from "~/components/others/no-autorizado";
import { permissions } from "~/lib/permissions";
import { TipoDocumento } from "@prisma/client";
import { usePermission } from "~/hooks/use-permission";
import { useAuth } from "~/lib/auth-context";
import { Suspense, lazy } from "react";
import { Spin } from "antd";
import ProgressiveLoader from "~/app/_components/others/progressive-loader";

// Lazy loading de componentes pesados
const FiltersMiAlmacen = lazy(
  () => import("./_components/filters/filters-mi-almacen")
);
const TableProductos = lazy(
  () => import("./_components/tables/table-productos")
);
const TableDetalleDePrecios = lazy(
  () => import("./_components/tables/table-detalle-de-precios")
);
const TableUltimasComprasIngresadasMiAlmacen = lazy(
  () =>
    import("./_components/tables/table-ultimas-compras-ingresadas-mi-almacen")
);
const ButtonCreateProducto = lazy(
  () => import("./_components/buttons/button-create-producto")
);
const ButtonCreateIngresoSalida = lazy(
  () => import("./_components/buttons/button-create-ingreso-salida")
);
const CardsInfo = lazy(() => import("./_components/others/cards-info"));

// Componente de loading optimizado
const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
);

export default function MiAlmacen() {
  const { user } = useAuth();
  const canAccess = usePermission(
    permissions.GESTION_COMERCIAL_E_INVENTARIO_MI_ALMACEN_INDEX
  );
  const canCreateProducto = usePermission(permissions.PRODUCTO_CREATE);
  const canCreateIngreso = usePermission(permissions.PRODUCTO_INGRESO_CREATE);
  const canCreateSalida = usePermission(permissions.PRODUCTO_SALIDA_CREATE);

  if (!canAccess) return <NoAutorizado />;

  return (
    <ContenedorGeneral>
      <Suspense fallback={<ComponentLoading />}>
        <FiltersMiAlmacen marca_predeterminada={user?.empresa?.marca_id} />
      </Suspense>
      {/* Layout responsivo */}
      <div className="w-full mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 sm:gap-5 md:gap-6 lg:gap-8">
          {/* Columna principal - Tablas */}
          <div className="flex flex-col gap-4 sm:gap-5 md:gap-6 min-w-0">
            <div className="h-[250px]">
              <ProgressiveLoader
                identifier="mi-almacen-table-productos"
                priority="critical"
              >
                <Suspense fallback={<ComponentLoading />}>
                  <TableProductos />
                </Suspense>
              </ProgressiveLoader>
            </div>
            <div className="h-[150px]">
              <ProgressiveLoader
                identifier="mi-almacen-ultimas-compras"
                priority="medium"
                delay={800}
              >
                <Suspense fallback={<ComponentLoading />}>
                  <TableUltimasComprasIngresadasMiAlmacen />
                </Suspense>
              </ProgressiveLoader>
            </div>
            <div className="h-[150px]">
              <ProgressiveLoader
                identifier="mi-almacen-detalle-precios"
                priority="low"
                delay={1200}
              >
                <Suspense fallback={<ComponentLoading />}>
                  <TableDetalleDePrecios />
                </Suspense>
              </ProgressiveLoader>
            </div>
          </div>

          {/* Columna lateral - Botones y Cards */}
          <div className="flex flex-row lg:flex-col items-start gap-4 sm:gap-5 md:gap-6 flex-wrap lg:flex-nowrap">
            {canCreateProducto && (
              <Suspense fallback={<Spin />}>
                <ButtonCreateProducto />
              </Suspense>
            )}
            {canCreateIngreso && (
              <Suspense fallback={<Spin />}>
                <ButtonCreateIngresoSalida tipo={TipoDocumento.Ingreso} />
              </Suspense>
            )}
            {canCreateSalida && (
              <Suspense fallback={<Spin />}>
                <ButtonCreateIngresoSalida tipo={TipoDocumento.Salida} />
              </Suspense>
            )}
            <Suspense fallback={<Spin />}>
              <CardsInfo />
            </Suspense>
          </div>
        </div>
      </div>
    </ContenedorGeneral>
  );
}
