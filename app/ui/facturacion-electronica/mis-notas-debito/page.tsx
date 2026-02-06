"use client";

import { FaFileInvoice } from "react-icons/fa6";
import FiltersMisNotasDebito from "./_components/filters/filters-mis-notas-debito";
import CardsInfoNotasDebito from "./_components/others/cards-info-notas-debito";
import TableMisNotasDebito from "./_components/tables/table-mis-notas-debito";

export default function MisNotasDebitoPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <FiltersMisNotasDebito />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardsInfoNotasDebito />
      </div>

      <TableMisNotasDebito />
    </div>
  );
}
