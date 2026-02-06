"use client";

import { FaFileInvoice } from "react-icons/fa6";
import FiltersMisFacturas from "./_components/filters/filters-mis-facturas";
import CardsInfoFacturas from "./_components/others/cards-info-facturas";
import TableMisFacturas from "./_components/tables/table-mis-facturas";

export default function MisFacturasPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <FiltersMisFacturas />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardsInfoFacturas />
      </div>

      <TableMisFacturas />
    </div>
  );
}
