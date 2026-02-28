"use client";

import { getBottomNavItems, getModuleNav } from "~/lib/navigation";
import usePermissionHook from "~/hooks/use-permission";
import { FaDollarSign, FaBoxOpen, FaUsers, FaBuilding } from "react-icons/fa";
import { FaCartShopping } from "react-icons/fa6";
import BaseNav from "~/app/_components/nav/base-nav";
import ButtonNav from "~/app/_components/nav/button-nav";

const iconMap: Record<string, any> = {
  FaDollarSign,
  FaBoxOpen,
  FaCartShopping,
  FaUsers,
  FaBuilding,
};

export default function BottomNav({ className }: { className?: string }) {
  const { can } = usePermissionHook();
  const moduleId = "reportes";
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
