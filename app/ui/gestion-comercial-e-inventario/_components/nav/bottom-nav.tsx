"use client";

import { getBottomNavItems, getModuleNav } from "~/lib/navigation";
import usePermissionHook from "~/hooks/use-permission";
import { FaWarehouse, FaCartShopping, FaCalculator } from "react-icons/fa6";
import { BiTransferAlt } from "react-icons/bi";
import { MdOutlinePendingActions } from "react-icons/md";
import { FaTruck, FaTruckLoading } from "react-icons/fa";
import BaseNav from "~/app/_components/nav/base-nav";
import ButtonNav from "~/app/_components/nav/button-nav";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FaWarehouse,
  BiTransferAlt,
  FaCalculator,
  FaCartShopping,
  MdOutlinePendingActions,
  FaTruck,
  FaTruckLoading,
};

export default function BottomNav({ className }: { className?: string }) {
  const { can } = usePermissionHook();
  const moduleId = "gestion-comercial-e-inventario";
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
