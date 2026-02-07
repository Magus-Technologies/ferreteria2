"use client";

import ContenedorGeneral from "~/app/_components/containers/contenedor-general";
import NoAutorizado from "~/components/others/no-autorizado";
import { permissions } from "~/lib/permissions";
import { usePermission } from "~/hooks/use-permission";
import { Suspense, lazy } from "react";
import { Spin } from "antd";
import HeaderCrearNotaCredito from "./_components/header-crear-nota-credito";

const BodyCrearNotaCredito = lazy(() => import("./_components/body-crear-nota-credito"));

const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
);

export default function CrearNotaCreditoPage() {
  const canAccess = usePermission(permissions.FACTURACION_ELECTRONICA_INDEX);

  if (!canAccess) return <NoAutorizado />;

  return (
    <ContenedorGeneral className="h-full">
      <HeaderCrearNotaCredito />
      <Suspense fallback={<ComponentLoading />}>
        <BodyCrearNotaCredito />
      </Suspense>
    </ContenedorGeneral>
  );
}
