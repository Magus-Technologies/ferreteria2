"use client";

import { MdSpaceDashboard } from "react-icons/md";
import { FaCog, FaUsers, FaShieldAlt, FaBuilding } from "react-icons/fa";
import BaseNav from "~/app/_components/nav/base-nav";
import ButtonNav from "~/app/_components/nav/button-nav";

export default function TopNav({ className }: { className?: string }) {
  return (
    <BaseNav className={className} bgColorClass="bg-blue-600">
      <ButtonNav
        path="/ui"
        colorActive="text-blue-600"
      >
        <MdSpaceDashboard />
        Inicio
      </ButtonNav>

      <ButtonNav
        path="/ui/configuracion/usuarios"
        colorActive="text-blue-600"
      >
        <FaUsers />
        Usuarios
      </ButtonNav>

      <ButtonNav
        colorActive="text-blue-600"
      >
        <FaShieldAlt />
        Permisos
      </ButtonNav>

      <ButtonNav
        path="/ui/configuracion/mi-empresa"
        colorActive="text-blue-600"
      >
        <FaBuilding />
        Mi Empresa
      </ButtonNav>

      <ButtonNav
        colorActive="text-blue-600"
      >
        <FaCog />
        Parámetros
      </ButtonNav>
    </BaseNav>
  );
}
