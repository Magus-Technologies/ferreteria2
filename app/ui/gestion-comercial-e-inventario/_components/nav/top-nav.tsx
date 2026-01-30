"use client";

import { getTopNavItems, getModuleNav } from "~/lib/navigation";
import usePermissionHook from "~/hooks/use-permission";
import { MdSpaceDashboard } from "react-icons/md";
import { FaBoxOpen, FaClipboardList } from "react-icons/fa";
import { FaCartShopping } from "react-icons/fa6";
import { IoMdContact } from "react-icons/io";
import DropdownBase from "~/components/dropdown/dropdown-base";
import BaseNav from "~/app/_components/nav/base-nav";
import ButtonNav from "~/app/_components/nav/button-nav";
import { useRouter } from "next/navigation";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MdSpaceDashboard,
  FaBoxOpen,
  FaCartShopping,
  FaClipboardList,
  IoMdContact,
};

export default function TopNav({ className }: { className?: string }) {
  const router = useRouter();
  const { can } = usePermissionHook();
  const moduleId = "gestion-comercial-e-inventario";
  const nav = getModuleNav(moduleId);
  const items = getTopNavItems(moduleId, can);

  if (!nav) return null;

  return (
    <BaseNav className={className} bgColorClass={nav.topNav.bgColor}>
      {items.map((item) => {
        const Icon = iconMap[item.icon];

        if (item.type === "dropdown" && item.items && item.items.length > 0) {
          const menuItems = item.items.map((sub) => {
            if (sub.key === "divider" || (sub as { type?: string }).type === "divider") {
              return { type: "divider" as const };
            }
            return {
              key: sub.key,
              label: sub.label,
              onClick: sub.route ? () => router.push(sub.route as string) : undefined,
            };
          });

          return (
            <DropdownBase key={item.id} menu={{ items: menuItems }}>
              <ButtonNav withIcon={false} colorActive={nav.topNav.activeColor}>
                {Icon && <Icon />}
                {item.label}
              </ButtonNav>
            </DropdownBase>
          );
        }

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
