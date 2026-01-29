"use client";

import { Tabs } from "antd";
import { HistoryOutlined, CloseCircleOutlined } from "@ant-design/icons";
import ContenedorGeneral from "~/app/_components/containers/contenedor-general";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import HistorialAperturas from "./_components/historial-aperturas";
import HistorialCierres from "./_components/historial-cierres";
import NoAutorizado from "~/components/others/no-autorizado";
import { usePermission } from "~/hooks/use-permission";
import { permissions } from "~/lib/permissions";
import { useSearchParams } from "next/navigation";

export default function MisAperturasCierresPage() {
  const canAccess = usePermission(permissions.FACTURACION_ELECTRONICA_INDEX);
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "aperturas";

  if (!canAccess) return <NoAutorizado />;

  const items = [
    {
      key: "aperturas",
      label: (
        <span className="flex items-center gap-2">
          <HistoryOutlined />
          Mis Aperturas
        </span>
      ),
      children: <HistorialAperturas />,
    },
    {
      key: "cierres",
      label: (
        <span className="flex items-center gap-2">
          <CloseCircleOutlined />
          Mis Cierres
        </span>
      ),
      children: <HistorialCierres />,
    },
  ];

  return (
    <ContenedorGeneral className="items-stretch">
      <TituloModulos
        title="Mis Aperturas y Cierres de Caja"
        icon={<HistoryOutlined className="text-cyan-600" />}
      />
      <div className="w-full">
        <Tabs defaultActiveKey={defaultTab} items={items} size="large" />
      </div>
    </ContenedorGeneral>
  );
}
