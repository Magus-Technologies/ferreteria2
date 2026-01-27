"use client";

import { getBottomNavItems, getModuleNav } from "~/lib/navigation";
import usePermissionHook from "~/hooks/use-permission";
import { FaUsers, FaShieldAlt, FaBuilding, FaKey, FaWarehouse, FaCashRegister, FaFileInvoice, FaPrint } from "react-icons/fa";
import BaseNav from "~/app/_components/nav/base-nav";
import ButtonNav from "~/app/_components/nav/button-nav";

// Mapa de iconos
const iconMap: Record<string, any> = {
  FaUsers,
  FaShieldAlt,
  FaKey,
  FaBuilding,
  FaWarehouse,
  FaCashRegister,
  FaFileInvoice,
  FaPrint,
};

export default function BottomNav({ className }: { className?: string }) {
  const { can } = usePermissionHook();
  const moduleId = "configuracion";
  const nav = getModuleNav(moduleId);
  const items = getBottomNavItems(moduleId, can);

  if (!nav) return null;

  return (
    <BaseNav
      className={className}
      withDropdownUser={false}
      bgColorClass={nav.bottomNav.bgColor}
    >
      {items.map((item) => {
        const Icon = iconMap[item.icon];

        return (
          <ButtonNav
            key={item.id}
            colorActive={nav.bottomNav.activeColor}
            path={item.route || undefined}
          >
            {Icon && <Icon />}
            {item.label}
          </ButtonNav>
        );
      })}
    </BaseNav>
  );
}
