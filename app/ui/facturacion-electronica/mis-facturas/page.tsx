"use client";

import ContenedorGeneral from "~/app/_components/containers/contenedor-general";
import FiltersMisFacturas from "./_components/filters/filters-mis-facturas";
import CardsInfoFacturas from "./_components/others/cards-info-facturas";
import TableMisFacturas from "./_components/tables/table-mis-facturas";

export default function MisFacturasPage() {
  return (
    <ContenedorGeneral>
      <div className="w-full">
        <FiltersMisFacturas />
        
        <div className="w-full mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 sm:gap-5 md:gap-6 lg:gap-8">
            <div className="flex flex-col gap-4 sm:gap-5 md:gap-6 min-w-0">
              <div className="h-[500px]">
                <TableMisFacturas />
              </div>
            </div>

            <div className="hidden lg:flex flex-col items-start gap-4 flex-nowrap min-w-[140px]">
              <CardsInfoFacturas />
            </div>
          </div>

          <div className="lg:hidden mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <CardsInfoFacturas />
            </div>
          </div>
        </div>
      </div>
    </ContenedorGeneral>
  );
}
