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
import SelectAlmacen from "~/app/_components/form/selects/select-almacen";
import { usePermission } from "~/hooks/use-permission";
import { Suspense, lazy } from "react";
import { Spin } from "antd";
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";

// Lazy loading de componentes pesados
const VentasPorCategoriaDeProductos = lazy(
  () => import("./_components/charts/ventas-por-categoria-de-productos"),
);
const VentasPorMetodosDePago = lazy(
  () => import("./_components/charts/ventas-por-metodos-de-pago"),
);
const ProductosMasVendidos = lazy(
  () => import("./_components/charts/productos-mas-vendidos"),
);
const IngresosPedidosPorTipoDeCanal = lazy(
  () => import("./_components/charts/ingresos-pedidos-por-tipo-de-canal"),
);
const VentasPorTiposDeDocumento = lazy(
  () => import("./_components/charts/ventas-por-tipos-de-documento"),
);
const VentasPorMarca = lazy(
  () => import("./_components/charts/ventas-por-marca"),
);

// Componente de loading optimizado
const ChartLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
);

export default function FacturacionElectronica() {
  const canAccess = usePermission(permissions.FACTURACION_ELECTRONICA_INDEX);

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
            />
          </ConfigurableElement>
          <ConfigurableElement
            componentId="dashboard.filtro-almacen"
            label="Filtro de Almacén"
          >
            <SelectAlmacen className="w-full sm:w-auto" />
          </ConfigurableElement>
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
              value={250000}
              prefix="S/. "
              suffix=" / 1000"
              icon={<FaMoneyBills size={20} />}
            />
          </ConfigurableElement>
          <ConfigurableElement
            componentId="dashboard.card-ventas-facturas"
            label="Card Ventas por Facturas"
          >
            <CardDashboard
              title="Total de Ventas por Facturas"
              value={50000}
              prefix="S/. "
              icon={<MdFactCheck size={20} />}
            />
          </ConfigurableElement>
          <ConfigurableElement
            componentId="dashboard.card-ventas-boletas"
            label="Card Ventas por Boletas"
          >
            <CardDashboard
              title="Total de Ventas por Boletas"
              value={50000}
              prefix="S/. "
              icon={<MdDocumentScanner size={20} />}
            />
          </ConfigurableElement>
          <ConfigurableElement
            componentId="dashboard.card-ventas-notas"
            label="Card Ventas por Notas"
          >
            <CardDashboard
              title="Total de Ventas por Notas de Venta"
              value={50000}
              prefix="S/. "
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
                Ventas por Categoría de Productos
              </div>
              <Suspense fallback={<ChartLoading />}>
                <VentasPorCategoriaDeProductos />
              </Suspense>
            </div>
            <div>
              <div className="text-center font-semibold mt-2 mb-2 text-[10px] xs:text-xs sm:text-sm md:text-base text-slate-700">
                Ventas por Métodos de Pago
              </div>
              <Suspense fallback={<ChartLoading />}>
                <VentasPorMetodosDePago />
              </Suspense>
            </div>
          </div>

          {/* Columna derecha - Grid 2x2 de gráficos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6 xl:gap-8">
            <div>
              <div className="text-center font-semibold mt-2 mb-2 text-[10px] xs:text-xs sm:text-sm md:text-base text-slate-700">
                Productos Mas Vendidos
              </div>
              <Suspense fallback={<ChartLoading />}>
                <ProductosMasVendidos />
              </Suspense>
            </div>
            <div>
              <div className="text-center font-semibold mt-2 mb-2 text-[10px] xs:text-xs sm:text-sm md:text-base text-slate-700">
                Ingresos / Pedidos por Tipo de Canal
              </div>
              <Suspense fallback={<ChartLoading />}>
                <IngresosPedidosPorTipoDeCanal />
              </Suspense>
            </div>
            <div>
              <div className="text-center font-semibold mt-2 mb-2 text-[10px] xs:text-xs sm:text-sm md:text-base text-slate-700">
                Ventas por Tipos de Documento
              </div>
              <Suspense fallback={<ChartLoading />}>
                <VentasPorTiposDeDocumento />
              </Suspense>
            </div>
            <div>
              <div className="text-center font-semibold mt-2 mb-2 text-[10px] xs:text-xs sm:text-sm md:text-base text-slate-700">
                Ventas por Marca
              </div>
              <Suspense fallback={<ChartLoading />}>
                <VentasPorMarca />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </ContenedorGeneral>
  );
}
