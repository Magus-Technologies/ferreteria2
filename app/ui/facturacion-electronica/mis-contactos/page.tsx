"use client";

import { useEffect } from "react";
import ContenedorGeneral from "~/app/_components/containers/contenedor-general";
import NoAutorizado from "~/components/others/no-autorizado";
import { usePermission } from "~/hooks/use-permission";
import { permissions } from "~/lib/permissions";
import FiltersMisContactos from "./_components/filters/filters-mis-contactos";
import TableMisContactos from "./_components/tables/table-mis-contactos";
import TableDeudasClientes from "./_components/tables/table-deudas-clientes";
import CardsInfoContactos from "./_components/cards/cards-info-contactos";
import { useStoreClienteSeleccionado } from "./_store/store-cliente-seleccionado";

export default function MisContactosPage() {
  const canAccess = usePermission(permissions.FACTURACION_ELECTRONICA_MIS_CONTACTOS_INDEX);
  const { setClienteId } = useStoreClienteSeleccionado();

  // Limpiar cliente seleccionado al desmontar
  useEffect(() => {
    return () => {
      setClienteId(null);
    };
  }, [setClienteId]);

  if (!canAccess) return <NoAutorizado />;

  return (
    <ContenedorGeneral>
      <div className="flex flex-col gap-4 w-full h-[calc(100vh-120px)]">
        <FiltersMisContactos />
        <div className="flex gap-4 flex-1 min-h-0">
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {/* Tabla de Clientes */}
            <div className="flex-1 min-h-0">
              <TableMisContactos />
            </div>
            {/* Tabla de Deudas con scroll infinito */}
            <div className="flex-1 min-h-0">
              <TableDeudasClientes />
            </div>
          </div>
          <div className="w-64 flex-shrink-0">
            <CardsInfoContactos />
          </div>
        </div>
      </div>
    </ContenedorGeneral>
  );
}