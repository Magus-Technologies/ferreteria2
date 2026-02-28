"use client";

import { getTopNavItems, getModuleNav } from "~/lib/navigation";
import usePermissionHook from "~/hooks/use-permission";
import { MdSpaceDashboard } from "react-icons/md";
import { FaDollarSign, FaBoxOpen, FaUsers, FaBuilding } from "react-icons/fa";
import { FaCartShopping } from "react-icons/fa6";
import BaseNav from "~/app/_components/nav/base-nav";
import ButtonNav from "~/app/_components/nav/button-nav";

const iconMap: Record<string, any> = {
  MdSpaceDashboard,
  FaDollarSign,
  FaBoxOpen,
  FaCartShopping,
  FaUsers,
  FaBuilding,
};

export default function TopNav({ className }: { className?: string }) {
  const { can } = usePermissionHook();
  const moduleId = "reportes";
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
