"use client";

import { FaFileInvoice } from "react-icons/fa6";
import FiltersMisNotasCredito from "./_components/filters/filters-mis-notas-credito";
import CardsInfoNotasCredito from "./_components/others/cards-info-notas-credito";
import TableMisNotasCredito from "./_components/tables/table-mis-notas-credito";

export default function MisNotasCreditoPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <FiltersMisNotasCredito />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardsInfoNotasCredito />
      </div>

      <TableMisNotasCredito />
    </div>
  );
}
