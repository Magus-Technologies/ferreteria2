"use client";

import { getTopNavItems, getModuleNav } from "~/lib/navigation";
import usePermissionHook from "~/hooks/use-permission";
import { MdSpaceDashboard } from "react-icons/md";
import { FaCog, FaUsers, FaShieldAlt, FaBuilding, FaKey } from "react-icons/fa";
import BaseNav from "~/app/_components/nav/base-nav";
import ButtonNav from "~/app/_components/nav/button-nav";

// Mapa de iconos
const iconMap: Record<string, any> = {
  MdSpaceDashboard,
  FaUsers,
  FaShieldAlt,
  FaKey,
  FaBuilding,
  FaCog,
};

export default function TopNav({ className }: { className?: string }) {
  const { can } = usePermissionHook();
  const moduleId = "configuracion";
  const nav = getModuleNav(moduleId);
  const items = getTopNavItems(moduleId, can);

  if (!nav) return null;

  return (
    <BaseNav className={className} bgColorClass={nav.topNav.bgColor}>
      {items.map((item) => {
        const Icon = iconMap[item.icon];

        return (
          <ButtonNav
            key={item.id}
            path={item.route || undefined}
            colorActive={nav.topNav.activeColor}
          >
            {Icon && <Icon />}
            {item.label}
          </ButtonNav>
        );
      })}
    </BaseNav>
  );
}
