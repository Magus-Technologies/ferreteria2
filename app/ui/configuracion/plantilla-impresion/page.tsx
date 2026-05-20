"use client";

import React from "react";
import ContenedorGeneral from "~/app/_components/containers/contenedor-general";
import EditorPlantillaImpresion from "./_components/editor-plantilla-impresion";
import { useAuth } from "~/lib/auth-context";
import { Spin } from "antd";

export default function PlantillaImpresionPage() {
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
        <h1 className="text-2xl font-bold mb-6">Plantilla de Impresión</h1>
        <EditorPlantillaImpresion />
      </div>
    </ContenedorGeneral>
  );
}
