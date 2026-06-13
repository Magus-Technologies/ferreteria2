"use client";

import ContenedorGeneral from "~/app/_components/containers/contenedor-general";
import { Suspense, lazy } from "react";
import { Spin } from "antd";
import { FaCalculator } from "react-icons/fa6";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import { CuadresProvider, useCuadresContext } from "./_contexts/cuadres-context";
import ModalDocIngresoSalida from "../mi-almacen/_components/modals/modal-doc-ingreso-salida";
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";

// Lazy loading de componentes
const FiltersCuadres = lazy(() => import("./_components/filters/filters-cuadres"));
const TableIngresosCuadres = lazy(() => import("./_components/tables/table-ingresos-cuadres"));
const TableSalidasCuadres = lazy(() => import("./_components/tables/table-salidas-cuadres"));
const CardsInfoCuadres = lazy(() => import("./_components/others/cards-info-cuadres"));

function PdfModalCuadres() {
    const { pdfOpen, setPdfOpen, pdfData } = useCuadresContext();
    return (
        <ModalDocIngresoSalida
            open={pdfOpen}
            setOpen={setPdfOpen}
            data={pdfData ? (pdfData as any) : undefined}
        />
    );
}

const ComponentLoading = () => (
    <div className="flex items-center justify-center h-40">
        <Spin size="large" />
    </div>
);

export default function CuadresPage() {
    return (
        <ContenedorGeneral>
            <CuadresProvider>
                <div className="w-full flex flex-col gap-2">
                    <TituloModulos
                        title="Consultar Notas de Ingresos / Salidas (Cuadres)"
                        icon={<FaCalculator className="text-emerald-600" />}
                    />

                    <ConfigurableElement componentId="cuadres.filtros" label="Filtros de Cuadres">
                    <Suspense fallback={<ComponentLoading />}>
                        <FiltersCuadres />
                    </Suspense>
                    </ConfigurableElement>

                    <div className="w-full">
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-stretch transition-all duration-300">

                            {/* Columna Principal: Tablas */}
                            <div className="flex flex-col gap-6 min-w-0">
                                <div className="h-[300px]">
                                    <Suspense fallback={<ComponentLoading />}>
                                        <TableIngresosCuadres />
                                    </Suspense>
                                </div>

                                <div className="h-[350px]">
                                    <Suspense fallback={<ComponentLoading />}>
                                        <TableSalidasCuadres />
                                    </Suspense>
                                </div>
                            </div>

                            {/* Columna Lateral: Sidebar con Cards distribuyendo el espacio */}
                            <ConfigurableElement componentId="cuadres.cards-info" label="Tarjetas de Totales (Cuadres)" noFullWidth>
                            <div className="hidden lg:flex flex-col min-w-[200px] h-full">
                                {/* Espaciador para alinear con el inicio de la primera tabla (debajo de sus botones) */}
                                <div className="h-[42px] flex-shrink-0" />

                                <div className="flex-1">
                                    <Suspense fallback={<div className="flex justify-center py-10"><Spin /></div>}>
                                        <CardsInfoCuadres />
                                    </Suspense>
                                </div>
                            </div>
                            </ConfigurableElement>
                        </div>

                        {/* Versión móvil de contadores */}
                        <div className="lg:hidden mt-6 border-t pt-4">
                            <Suspense fallback={<Spin />}>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    <CardsInfoCuadres />
                                </div>
                            </Suspense>
                        </div>
                    </div>
                </div>

                {/* Modal PDF compartido para Ingresos y Salidas */}
                <PdfModalCuadres />
            </CuadresProvider>
        </ContenedorGeneral>
    );
}
