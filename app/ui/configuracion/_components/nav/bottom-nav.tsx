import { FaUsers, FaShieldAlt, FaBuilding, FaCog, FaKey, FaDatabase } from "react-icons/fa";
import BaseNav from "~/app/_components/nav/base-nav";
import ButtonNav from "~/app/_components/nav/button-nav";

export default function BottomNav({ className }: { className?: string }) {
  return (
    <BaseNav
      className={className}
      withDropdownUser={false}
      bgColorClass="bg-blue-600"
    >
      <ButtonNav
        colorActive="text-blue-600"
        path="/ui/configuracion/usuarios"
      >
        <FaUsers />
        Usuarios
      </ButtonNav>
      <ButtonNav colorActive="text-blue-600">
        <FaShieldAlt />
        Roles y Permisos
      </ButtonNav>
      <ButtonNav colorActive="text-blue-600">
        <FaBuilding />
        Mi Empresa
      </ButtonNav>
      <ButtonNav colorActive="text-blue-600">
        <FaCog />
        Parámetros
      </ButtonNav>
      <ButtonNav colorActive="text-blue-600">
        <FaKey />
        Seguridad
      </ButtonNav>
      <ButtonNav colorActive="text-blue-600">
        <FaDatabase />
        Respaldos
      </ButtonNav>
    </BaseNav>
  );
}
