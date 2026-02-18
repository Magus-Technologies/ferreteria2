"use client";

function CardVertical({
    title,
    value,
    colorClass = "text-emerald-600",
    borderColor = "border-gray-200"
}: {
    title: string;
    value: number;
    colorClass?: string;
    borderColor?: string;
}) {
    return (
        <div className={`flex flex-col items-center justify-center p-4 bg-white border ${borderColor} rounded-2xl shadow-sm flex-1 transition-all hover:shadow-md border-gray-100`}>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 text-center leading-none mb-2">
                {title}
            </span>
            <span className={`text-base md:text-lg lg:text-xl font-black ${colorClass} text-center whitespace-nowrap`}>
                S/. {value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
        </div>
    );
}

import { useCuadresContext } from "../../_contexts/cuadres-context";

export default function CardsInfoCuadres() {
    const { totals } = useCuadresContext();

    return (
        <div className="flex flex-col gap-4 w-full h-full">
            <CardVertical
                title="Ingresos [Und]"
                value={totals.ingresosUnd}
                colorClass="text-emerald-500"
            />
            <CardVertical
                title="Ingresos S/."
                value={totals.ingresosSol}
                colorClass="text-emerald-600"
            />
            <CardVertical
                title="Salidas [Und]"
                value={totals.salidasUnd}
                colorClass="text-rose-500"
            />
            <CardVertical
                title="Salidas S/."
                value={totals.salidasSol}
                colorClass="text-rose-600"
            />
            <CardVertical
                title="Total S/."
                value={totals.totalSol}
                colorClass="text-emerald-700"
                borderColor="border-emerald-200 bg-emerald-50/10"
            />
        </div>
    );
}
