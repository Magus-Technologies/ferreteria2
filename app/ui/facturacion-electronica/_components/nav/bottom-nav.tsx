"use client";

import { getBottomNavItems, getModuleNav } from "~/lib/navigation";
import usePermissionHook from "~/hooks/use-permission";
import { FaCartShopping } from "react-icons/fa6";
import { MdPointOfSale } from "react-icons/md";
import BaseNav from "~/app/_components/nav/base-nav";
import ButtonNav from "~/app/_components/nav/button-nav";
import { IoDocumentAttach, IoDocuments } from "react-icons/io5";
import { GiReceiveMoney } from "react-icons/gi";
import { IoMdContact } from "react-icons/io";
import { HistoryOutlined, SwapOutlined } from "@ant-design/icons";

// Mapa de iconos
const iconMap: Record<string, any> = {
  FaCartShopping,
  MdPointOfSale,
  IoDocumentAttach,
  GiReceiveMoney,
  IoDocuments,
  IoMdContact,
  HistoryOutlined,
  SwapOutlined,
};

export default function BottomNav({ className }: { className?: string }) {
  const { can } = usePermissionHook();
  const moduleId = "facturacion-electronica";
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
            {Icon && <Icon className={item.icon.includes("Outlined") ? "text-lg" : ""} />}
            {item.label}
          </ButtonNav>
        );
      })}
    </BaseNav>
  );
}
