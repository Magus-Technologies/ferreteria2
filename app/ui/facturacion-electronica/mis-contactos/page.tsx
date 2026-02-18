"use client";

import ContenedorGeneral from "~/app/_components/containers/contenedor-general";
import NoAutorizado from "~/components/others/no-autorizado";
import { usePermission } from "~/hooks/use-permission";
import { permissions } from "~/lib/permissions";
import FiltersMisContactos from "./_components/filters/filters-mis-contactos";
import TableMisContactos from "./_components/tables/table-mis-contactos";
import CardsInfoContactos from "./_components/cards/cards-info-contactos";

export default function MisContactosPage() {
  const canAccess = usePermission(permissions.FACTURACION_ELECTRONICA_MIS_CONTACTOS_INDEX);

  if (!canAccess) return <NoAutorizado />;

  return (
    <ContenedorGeneral>
      <div className="flex flex-col gap-4 w-full h-[calc(100vh-120px)]">
        <FiltersMisContactos />
        <div className="flex gap-4 flex-1 min-h-0">
          <div className="flex-1 min-w-0">
            <TableMisContactos />
          </div>
          <div className="w-64 flex-shrink-0">
            <CardsInfoContactos />
          </div>
        </div>
      </div>
    </ContenedorGeneral>
  );
}