"use client";

import { useMemo, useState } from "react";
import { useServerQuery } from "~/hooks/use-server-query";
import { QueryKeys } from "~/app/_lib/queryKeys";
import { GetIngresosSalidasParams, ingresosSalidasApi } from "~/lib/api/ingreso-salida";
import dayjs from "dayjs";

export interface MovimientoCuadre {
    id: string; // row unique id (headerId-detailId)
    fecha: string;
    numero: string;
    descripcion: string;
    marca: string;
    cantidad: number;
    unidad_medida: string;
    precio: number;
    proveedor: string;
    observacion: string;
    usuario: string;
    anulado: boolean;
    tipo_ingreso: string;
    total: number;
}

export function useCuadres() {
    const [filters, setFilters] = useState<GetIngresosSalidasParams>({
        desde: dayjs().startOf('month').format('YYYY-MM-DD'),
        hasta: dayjs().format('YYYY-MM-DD'),
        listar_no_anuladas: true,
        tipo: 'TODOS',
        per_page: 500 // Traemos bastantes para el reporte
    });

    const { response, loading, refetch } = useServerQuery({
        action: ingresosSalidasApi.getAll,
        params: filters,
        propsQuery: {
            queryKey: [QueryKeys.INGRESOS_SALIDAS, JSON.stringify(filters)],
            enabled: !!filters,
        }
    });

    // Transformar y aplanar la data para las tablas
    const { ingresos, salidas, totals } = useMemo(() => {
        const rawData = response?.data || [];

        const transformed: MovimientoCuadre[] = [];

        rawData.forEach((header: any) => {
            const headerId = header.id;
            const fecha = dayjs(header.fecha).format('DD/MM/YYYY');
            const numero = `${header.serie}-${String(header.numero).padStart(8, '0')}`;
            const proveedor = header.proveedor?.razon_social || header.proveedor_nombre || '---';
            const observacion = header.descripcion || header.observacion || '---';
            const usuario = header.user?.name || header.usuario_nombre || '---';
            const anulado = !header.estado;
            const tipo_ingreso = header.tipo_ingreso?.name || header.tipo_ingreso_nombre || '---';

            header.productos_por_almacen?.forEach((detail: any) => {
                const prodName = detail.producto_almacen?.producto?.name || '---';
                const marca = detail.producto_almacen?.producto?.marca?.name || '---';
                const costo = Number(detail.costo || 0);

                detail.unidades_derivadas?.forEach((ud: any) => {
                    const cantidad = Number(ud.cantidad || 0);
                    const uMedida = ud.unidad_derivada_inmutable?.name || '---';
                    const total = costo * cantidad;

                    transformed.push({
                        id: `${headerId}-${detail.id}-${ud.id}`,
                        fecha,
                        numero,
                        descripcion: prodName,
                        marca,
                        cantidad,
                        unidad_medida: uMedida,
                        precio: costo,
                        proveedor,
                        observacion,
                        usuario,
                        anulado,
                        tipo_ingreso,
                        total,
                        tipo_documento: header.tipo_documento // Agregamos temporalmente para filtrar
                    } as any);
                });
            });
        });

        const ingresosList = transformed.filter((m: any) => m.tipo_documento === 'in');
        const salidasList = transformed.filter((m: any) => m.tipo_documento === 'sa');

        const totalIngresosUnd = ingresosList.reduce((acc, curr) => acc + curr.cantidad, 0);
        const totalIngresosSol = ingresosList.reduce((acc, curr) => acc + curr.total, 0);
        const totalSalidasUnd = salidasList.reduce((acc, curr) => acc + curr.cantidad, 0);
        const totalSalidasSol = salidasList.reduce((acc, curr) => acc + curr.total, 0);

        return {
            ingresos: ingresosList,
            salidas: salidasList,
            totals: {
                ingresosUnd: totalIngresosUnd,
                ingresosSol: totalIngresosSol,
                salidasUnd: totalSalidasUnd,
                salidasSol: totalSalidasSol,
                totalSol: totalIngresosSol - totalSalidasSol
            }
        };
    }, [response]);

    const handleSearch = (newFilters: any) => {
        setFilters({
            ...filters,
            ...newFilters,
            desde: newFilters.desde ? dayjs(newFilters.desde).format('YYYY-MM-DD') : undefined,
            hasta: newFilters.hasta ? dayjs(newFilters.hasta).format('YYYY-MM-DD') : undefined,
        });
    };

    return {
        ingresos,
        salidas,
        totals,
        loading,
        refetch,
        handleSearch
    };
}
