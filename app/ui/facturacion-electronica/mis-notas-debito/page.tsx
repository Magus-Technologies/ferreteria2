"use client";

import ContenedorGeneral from "~/app/_components/containers/contenedor-general";
import FiltersMisNotasDebito from "./_components/filters/filters-mis-notas-debito";
import CardsInfoNotasDebito from "./_components/others/cards-info-notas-debito";
import TableMisNotasDebito from "./_components/tables/table-mis-notas-debito";
import ModalPdfNotaDebitoWrapper from "./_components/modals/modal-pdf-nota-debito-wrapper";

export default function MisNotasDebitoPage() {
  return (
    <ContenedorGeneral>
      <div className="w-full">
        <FiltersMisNotasDebito />

        <div className="w-full mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 sm:gap-5 md:gap-6 lg:gap-8">
            <div className="flex flex-col gap-4 sm:gap-5 md:gap-6 min-w-0">
              <div className="h-[500px]">
                <TableMisNotasDebito />
              </div>
            </div>

            <div className="hidden lg:flex flex-col items-start gap-4 flex-nowrap min-w-[140px]">
              <CardsInfoNotasDebito />
            </div>
          </div>

          <div className="lg:hidden mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <CardsInfoNotasDebito />
            </div>
          </div>
        </div>
      </div>
      <ModalPdfNotaDebitoWrapper />
    </ContenedorGeneral>
  );
}
