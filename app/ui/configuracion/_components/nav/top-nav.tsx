"use client";

import { getTopNavItems, getModuleNav } from "~/lib/navigation";
import usePermissionHook from "~/hooks/use-permission";
import { MdSpaceDashboard } from "react-icons/md";
import { FaCog, FaUsers, FaShieldAlt, FaBuilding, FaKey } from "react-icons/fa";
import BaseNav from "~/app/_components/nav/base-nav";
import ButtonNav from "~/app/_components/nav/button-nav";
import { useModalConfiguraciones } from "~/app/_stores/store-modal-configuraciones";

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
  const { openModal: openConfiguraciones } = useModalConfiguraciones();
  const moduleId = "configuracion";
  const nav = getModuleNav(moduleId);
  const items = getTopNavItems(moduleId, can);

  if (!nav) return null;

  const actionHandlers: Record<string, () => void> = {
    openConfiguraciones,
  };

  return (
    <BaseNav className={className} bgColorClass={nav.topNav.bgColor}>
      {items.map((item) => {
        const Icon = iconMap[item.icon];

        return (
          <ButtonNav
            key={item.id}
            path={item.route || undefined}
            colorActive={nav.topNav.activeColor}
            onClick={
              item.action && actionHandlers[item.action]
                ? actionHandlers[item.action]
                : undefined
            }
          >
            {Icon && <Icon />}
            {item.label}
          </ButtonNav>
        );
      })}
    </BaseNav>
  );
}
