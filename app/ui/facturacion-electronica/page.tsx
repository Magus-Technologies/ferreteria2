"use client";

import { FaMoneyBills } from "react-icons/fa6";
import {
  MdDocumentScanner,
  MdFactCheck,
  MdSpaceDashboard,
} from "react-icons/md";
import CardDashboard from "~/app/_components/cards/card-dashboard";
import NoAutorizado from "~/components/others/no-autorizado";
import { permissions } from "~/lib/permissions";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import ContenedorGeneral from "~/app/_components/containers/contenedor-general";
import { IoDocumentText } from "react-icons/io5";
import RangePickerBase from "~/app/_components/form/fechas/range-picker-base";
// import SelectAlmacen from "~/app/_components/form/selects/select-almacen";
import { usePermission } from "~/hooks/use-permission";
import { Spin } from "antd";
import dynamic from "next/dynamic";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";
import { dashboardFacturacionApi, dashboardFacturacionKeys } from "~/lib/api/dashboard-facturacion";
import { useStoreDashboardFiltros, useFiltrosDashboard } from "./_store/store-dashboard-filtros";

// Componente de loading optimizado
const ChartLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
);

// Dynamic imports con SSR deshabilitado (charts son client-only)
const VentasPorCategoriaDeProductos = dynamic(
  () => import("./_components/charts/ventas-por-categoria-de-productos"),
  { ssr: false, loading: ChartLoading },
);
const VentasPorMetodosDePago = dynamic(
  () => import("./_components/charts/ventas-por-metodos-de-pago"),
  { ssr: false, loading: ChartLoading },
);
const ProductosMasVendidos = dynamic(
  () => import("./_components/charts/productos-mas-vendidos"),
  { ssr: false, loading: ChartLoading },
);
const IngresosPedidosPorTipoDeCanal = dynamic(
  () => import("./_components/charts/ingresos-pedidos-por-tipo-de-canal"),
  { ssr: false, loading: ChartLoading },
);
const VentasPorTiposDeDocumento = dynamic(
  () => import("./_components/charts/ventas-por-tipos-de-documento"),
  { ssr: false, loading: ChartLoading },
);
const VentasPorMarca = dynamic(
  () => import("./_components/charts/ventas-por-marca"),
  { ssr: false, loading: ChartLoading },
);

export default function FacturacionElectronica() {
  const canAccess = usePermission(permissions.FACTURACION_ELECTRONICA_DASHBOARD_INDEX);

  const filtros = useFiltrosDashboard();
  const desde = useStoreDashboardFiltros((s) => s.desde);
  const hasta = useStoreDashboardFiltros((s) => s.hasta);
  const setRango = useStoreDashboardFiltros((s) => s.setRango);

  const { data: resumen } = useQuery({
    queryKey: dashboardFacturacionKeys.resumen(filtros),
    queryFn: async () => {
      const res = await dashboardFacturacionApi.resumen(filtros);
      if (res.error) throw new Error(res.error.message);
      return res.data?.data ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!canAccess) return <NoAutorizado />;

  return (
    <ContenedorGeneral>
      <TituloModulos
        title="Dashboard"
        icon={<MdSpaceDashboard className="text-cyan-600" />}
      >
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 md:gap-6 lg:gap-8 items-stretch sm:items-center w-full sm:w-auto">
          <ConfigurableElement
            componentId="dashboard.filtro-fecha"
            label="Filtro de Fechas"
          >
            <RangePickerBase
              variant="filled"
              size="large"
              className="w-full sm:w-auto"
              allowClear={false}
              value={[dayjs(desde), dayjs(hasta)]}
              onChange={(rango) => {
                if (rango && rango[0] && rango[1]) {
                  setRango(
                    rango[0].format("YYYY-MM-DD"),
                    rango[1].format("YYYY-MM-DD"),
                  );
                }
              }}
            />
          </ConfigurableElement>
          {/* SelectAlmacen ahora se configura desde el dropdown global de Sucursales */}
          {/* <ConfigurableElement
            componentId="dashboard.filtro-almacen"
            label="Filtro de Almacén"
          >
            <SelectAlmacen className="w-full sm:w-auto" />
          </ConfigurableElement> */}
        </div>
      </TituloModulos>

      {/* Grid responsivo para Dashboard */}
      <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 lg:gap-3 w-full">
        {/* Cards superiores - Responsivos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-12">
          <ConfigurableElement
            componentId="dashboard.card-total-ventas"
            label="Card Total de Ventas"
          >
            <CardDashboard
              title="Total de Ventas / N° de Ventas"
              value={resumen?.total_ventas ?? 0}
              prefix="S/. "
              suffix={` / ${resumen?.num_ventas ?? 0}`}
              icon={<FaMoneyBills size={20} />}
            />
          </ConfigurableElement>
          <ConfigurableElement
            componentId="dashboard.card-ventas-facturas"
            label="Card Ventas por Facturas"
          >
            <CardDashboard
              title="Total de Ventas por Facturas"
              value={resumen?.total_facturas ?? 0}
              prefix="S/. "
              suffix={` / ${resumen?.num_facturas ?? 0}`}
              icon={<MdFactCheck size={20} />}
            />
          </ConfigurableElement>
          <ConfigurableElement
            componentId="dashboard.card-ventas-boletas"
            label="Card Ventas por Boletas"
          >
            <CardDashboard
              title="Total de Ventas por Boletas"
              value={resumen?.total_boletas ?? 0}
              prefix="S/. "
              suffix={` / ${resumen?.num_boletas ?? 0}`}
              icon={<MdDocumentScanner size={20} />}
            />
          </ConfigurableElement>
          <ConfigurableElement
            componentId="dashboard.card-ventas-notas"
            label="Card Ventas por Notas"
          >
            <CardDashboard
              title="Total de Ventas por Notas de Venta"
              value={resumen?.total_notas ?? 0}
              prefix="S/. "
              suffix={` / ${resumen?.num_notas ?? 0}`}
              icon={<IoDocumentText size={20} />}
            />
          </ConfigurableElement>
        </div>

        {/* Gráficos - Layout responsivo */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8">
          {/* Columna izquierda - Gráficos circulares */}
          <div className="flex flex-col gap-3 sm:gap-4 md:gap-5">
            <div>
              <div className="text-center font-semibold mt-2 mb-2 text-xs sm:text-sm md:text-base text-slate-700">
                Ventas por Marca
              </div>
                <VentasPorMarca />
            </div>
            <div>
              <div className="text-center font-semibold mt-2 mb-2 text-[10px] xs:text-xs sm:text-sm md:text-base text-slate-700">
                Ventas por Categoría de Productos
              </div>
                <VentasPorCategoriaDeProductos />
            </div>
          </div>

          {/* Columna derecha - Grid 2x2 de gráficos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8">
            <div>
              <div className="text-center font-semibold mt-2 mb-2 text-[10px] xs:text-xs sm:text-sm md:text-base text-slate-700">
                Productos Mas Vendidos
              </div>
                <ProductosMasVendidos />
            </div>
            <div>
              <div className="text-center font-semibold mt-2 mb-2 text-[10px] xs:text-xs sm:text-sm md:text-base text-slate-700">
                Ingresos / Pedidos por Tipo de Canal
              </div>
                <IngresosPedidosPorTipoDeCanal />
            </div>
            <div>
              <div className="text-center font-semibold mt-2 mb-2 text-[10px] xs:text-xs sm:text-sm md:text-base text-slate-700">
                Ventas por Tipos de Documento
              </div>
                <VentasPorTiposDeDocumento />
            </div>
            <div>
              <div className="text-center font-semibold mt-2 mb-2 text-[10px] xs:text-xs sm:text-sm md:text-base text-slate-700">
                Ventas por Métodos de Pago
              </div>
                <VentasPorMetodosDePago />
            </div>
          </div>
        </div>
      </div>
    </ContenedorGeneral>
  );
}
