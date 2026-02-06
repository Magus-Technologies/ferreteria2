"use client";

import ContenedorGeneral from "~/app/_components/containers/contenedor-general";
import FiltersMisNotasCredito from "./_components/filters/filters-mis-notas-credito";
import CardsInfoNotasCredito from "./_components/others/cards-info-notas-credito";
import TableMisNotasCredito from "./_components/tables/table-mis-notas-credito";

export default function MisNotasCreditoPage() {
  return (
    <ContenedorGeneral>
      <div className="w-full">
        <FiltersMisNotasCredito />
        
        <div className="w-full mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 sm:gap-5 md:gap-6 lg:gap-8">
            <div className="flex flex-col gap-4 sm:gap-5 md:gap-6 min-w-0">
              <div className="h-[500px]">
                <TableMisNotasCredito />
              </div>
            </div>

            <div className="hidden lg:flex flex-col items-start gap-4 flex-nowrap min-w-[140px]">
              <CardsInfoNotasCredito />
            </div>
          </div>

          <div className="lg:hidden mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <CardsInfoNotasCredito />
            </div>
          </div>
        </div>
      </div>
    </ContenedorGeneral>
  );
}
