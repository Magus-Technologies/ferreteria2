"use client";

import { FaArrowDown, FaArrowUp, FaDollarSign, FaWallet, FaCoins } from "react-icons/fa6";
import { useCuadresContext } from "../../_contexts/cuadres-context";

/**
 * Tarjeta de total, en formato compacto (icono a la izquierda, texto a la
 * derecha).
 *
 * Antes era vertical —icono arriba en su propio bloque, luego titulo, luego
 * valor— y cada tarjeta medía unos 130px. Cinco apiladas superaban la altura
 * de las tablas de al lado (674px), y como un flex item no se encoge por
 * debajo de su contenido, la columna desbordaba y aparecía scroll.
 *
 * En horizontal el icono deja de sumar altura propia: cada tarjeta ronda los
 * 50px y las cinco entran de sobra en el espacio disponible.
 */
function CardTotal({
    title,
    value,
    icon,
    bgColor = "bg-emerald-500",
    textColor = "text-emerald-700",
    esMoneda = true,
}: {
    title: string;
    value: number;
    icon?: React.ReactNode;
    bgColor?: string;
    textColor?: string;
    esMoneda?: boolean;
}) {
    return (
        <div className="flex items-center gap-3 px-3.5 py-3.5 bg-white border border-gray-100 rounded-xl shadow-sm transition-all hover:shadow-md">
            <div className={`flex-shrink-0 p-3 rounded-xl ${bgColor} text-white shadow-sm`}>
                {icon}
            </div>

            {/* min-w-0: deja que el texto se recorte dentro de la tarjeta en vez
                de estirarla cuando el monto es largo. */}
            <div className="flex flex-col min-w-0">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 leading-tight mb-0.5">
                    {title}
                </span>
                <span className={`text-xl font-black leading-tight whitespace-nowrap ${textColor}`}>
                    {esMoneda
                        ? `S/. ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
            </div>
        </div>
    );
}

export default function CardsInfoCuadres({
    // El contenedor lo decide quien la usa: en el sidebar va en columna y en
    // móvil en grilla. Antes el componente imponía siempre `flex-col`, así que
    // la grilla que envolvía la versión móvil no tenía efecto y las tarjetas
    // salían igual una debajo de otra.
    className = "flex flex-col gap-2.5",
}: {
    className?: string;
}) {
    const { totals } = useCuadresContext();

    return (
        <div className={`w-full ${className}`}>
            <CardTotal
                title="Ingresos [Und]"
                value={totals.ingresosUnd}
                icon={<FaArrowDown size={18} />}
                bgColor="bg-emerald-500"
                textColor="text-emerald-600"
                esMoneda={false}
            />
            <CardTotal
                title="Ingresos S/."
                value={totals.ingresosSol}
                icon={<FaCoins size={18} />}
                bgColor="bg-teal-500"
                textColor="text-teal-600"
            />
            <CardTotal
                title="Salidas [Und]"
                value={totals.salidasUnd}
                icon={<FaArrowUp size={18} />}
                bgColor="bg-rose-500"
                textColor="text-rose-600"
                esMoneda={false}
            />
            <CardTotal
                title="Salidas S/."
                value={totals.salidasSol}
                icon={<FaDollarSign size={18} />}
                bgColor="bg-orange-500"
                textColor="text-orange-600"
            />
            <CardTotal
                title="Total S/."
                value={totals.totalSol}
                icon={<FaWallet size={18} />}
                bgColor="bg-indigo-500"
                textColor="text-indigo-600"
            />
        </div>
    );
}
