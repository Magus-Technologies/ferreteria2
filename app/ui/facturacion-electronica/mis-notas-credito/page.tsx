"use client";

import ContenedorGeneral from "~/app/_components/containers/contenedor-general";
import dynamic from "next/dynamic";
import { Suspense, lazy } from "react";
import { Spin } from "antd";

const FiltersMisNotasCredito = lazy(() => import("./_components/filters/filters-mis-notas-credito"));
const TableMisNotasCredito = lazy(() => import("./_components/tables/table-mis-notas-credito"));
const CardsInfoNotasCredito = lazy(() => import("./_components/others/cards-info-notas-credito"));
const ModalPdfNotaCreditoWrapper = dynamic(() => import("./_components/modals/modal-pdf-nota-credito-wrapper"), { ssr: false });

const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
);

export default function MisNotasCreditoPage() {
  return (
    <>
      <ModalPdfNotaCreditoWrapper />
      <ContenedorGeneral>
        <div className="w-full">
          <Suspense fallback={<ComponentLoading />}>
            <FiltersMisNotasCredito />
          </Suspense>

          <div className="w-full mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              <div className="flex flex-col gap-4 sm:gap-5 md:gap-6 min-w-0">
                <div className="h-[500px]">
                  <Suspense fallback={<ComponentLoading />}>
                    <TableMisNotasCredito />
                  </Suspense>
                </div>
              </div>

              <div className="hidden lg:flex flex-col items-start gap-4 flex-nowrap min-w-[140px]">
                <Suspense fallback={<Spin />}>
                  <CardsInfoNotasCredito />
                </Suspense>
              </div>
            </div>

            <div className="lg:hidden mt-4">
              <Suspense fallback={<Spin />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <CardsInfoNotasCredito />
                </div>
              </Suspense>
            </div>
          </div>
        </div>
      </ContenedorGeneral>
    </>
  );
}
