"use client";

import { FaArrowDown, FaArrowUp, FaDollarSign, FaWallet, FaCoins } from "react-icons/fa6";

function CardVertical({
    title,
    value,
    icon,
    bgColor = "bg-emerald-500",
    textColor = "text-emerald-700",
    borderColor = "border-gray-200"
}: {
    title: string;
    value: number;
    icon?: React.ReactNode;
    bgColor?: string;
    textColor?: string;
    borderColor?: string;
}) {
    return (
        <div className={`flex flex-col items-center justify-center p-4 bg-white border ${borderColor} rounded-2xl shadow-sm flex-1 transition-all hover:shadow-md border-gray-100`}>
            <div className={`mb-3 p-3 rounded-xl ${bgColor} text-white shadow-sm`}>
                {icon}
            </div>
            <span className={`text-[10px] uppercase tracking-widest font-black ${textColor.replace('700', '400').replace('600', '400')} text-center leading-none mb-2 opacity-80`}>
                {title}
            </span>
            <span className={`text-base md:text-lg lg:text-xl font-black ${textColor} text-center whitespace-nowrap`}>
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
                icon={<FaArrowDown size={18} />}
                bgColor="bg-emerald-500"
                textColor="text-emerald-600"
            />
            <CardVertical
                title="Ingresos S/."
                value={totals.ingresosSol}
                icon={<FaCoins size={18} />}
                bgColor="bg-teal-500"
                textColor="text-teal-600"
            />
            <CardVertical
                title="Salidas [Und]"
                value={totals.salidasUnd}
                icon={<FaArrowUp size={18} />}
                bgColor="bg-rose-500"
                textColor="text-rose-600"
            />
            <CardVertical
                title="Salidas S/."
                value={totals.salidasSol}
                icon={<FaDollarSign size={18} />}
                bgColor="bg-orange-500"
                textColor="text-orange-600"
            />
            <CardVertical
                title="Total S/."
                value={totals.totalSol}
                icon={<FaWallet size={18} />}
                bgColor="bg-indigo-500"
                textColor="text-indigo-600"
                borderColor="border-indigo-100"
            />
        </div>
    );
}
