"use client";

import ContenedorGeneral from "~/app/_components/containers/contenedor-general";
import { Suspense, lazy } from "react";
import { Spin } from "antd";
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
                    <Suspense fallback={<ComponentLoading />}>
                        <FiltersCuadres />
                    </Suspense>

                    <div className="w-full">
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-stretch transition-all duration-300">

                            {/*
                              Columna Principal: Tablas.

                              Antes tenían alto FIJO (300px + 350px + gap = 674px).
                              Sumado al título y los filtros, el contenido pasaba
                              el alto de la pantalla y la página entera scrolleaba.

                              Ahora las dos se reparten lo que queda de viewport:
                              cada tabla scrollea internamente, que es lo suyo,
                              y la página no crece. El min-h evita que en
                              pantallas bajas se aplasten por debajo de lo que
                              miden las tarjetas de al lado.

                              Los 255px que se restan son el alto de todo lo que
                              va ARRIBA de las tablas (header de la app, título,
                              filtros y separaciones). Es el unico numero a tocar
                              si aparece scroll (subirlo) o queda espacio muerto
                              abajo (bajarlo).
                            */}
                            <div className="flex flex-col gap-3 min-w-0 h-[calc(100vh-255px)] min-h-[440px]">
                                {/* min-h-0 en cada una: sin esto un hijo flex no
                                    se encoge por debajo de su contenido y el
                                    reparto de altura no se respeta. */}
                                <div className="flex-1 min-h-0">
                                    <Suspense fallback={<ComponentLoading />}>
                                        <TableIngresosCuadres />
                                    </Suspense>
                                </div>

                                <div className="flex-1 min-h-0">
                                    <Suspense fallback={<ComponentLoading />}>
                                        <TableSalidasCuadres />
                                    </Suspense>
                                </div>
                            </div>

                            {/* Columna Lateral: Sidebar con Cards distribuyendo el espacio */}
                            <ConfigurableElement componentId="cuadres.cards-info" label="Tarjetas de Totales (Cuadres)" noFullWidth>
                            <div className="hidden lg:flex flex-col min-w-[210px] h-full">
                                {/* Espaciador para alinear con el inicio de la primera tabla (debajo de sus botones) */}
                                <div className="h-[42px] flex-shrink-0" />

                                {/* min-h-0: sin esto un contenedor flex no puede
                                    encogerse por debajo de su contenido y la
                                    columna estiraba la fila del grid, que era
                                    lo que generaba el scroll de la página. */}
                                <div className="flex-1 min-h-0">
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
                                <CardsInfoCuadres className="grid grid-cols-2 sm:grid-cols-3 gap-2" />
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
