"use client";

import React from "react";
import ContenedorGeneral from "~/app/_components/containers/contenedor-general";
import TabsEmpresa from "./_components/tabs-empresa";
import { useAuth } from "~/lib/auth-context";
import { Spin } from "antd";

export default function MiEmpresaPage() {
  const { user } = useAuth();
  const empresaId = user?.empresa?.id;

  if (!empresaId) {
    return (
      <ContenedorGeneral>
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </ContenedorGeneral>
    );
  }

  return (
    <ContenedorGeneral>
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-6">Mi Empresa</h1>
        <TabsEmpresa empresaId={empresaId} />
      </div>
    </ContenedorGeneral>
  );
}
