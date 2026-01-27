"use client";

import { getTopNavItems, getModuleNav } from "~/lib/navigation";
import usePermissionHook from "~/hooks/use-permission";
import { MdSpaceDashboard } from "react-icons/md";
import { FaClipboardList } from "react-icons/fa";
import { FaCartShopping, FaMoneyBillTrendUp } from "react-icons/fa6";
import DropdownBase from "~/components/dropdown/dropdown-base";
import { IoMdContact } from "react-icons/io";
import BaseNav from "~/app/_components/nav/base-nav";
import ButtonNav from "~/app/_components/nav/button-nav";
import { useState } from "react";
import ModalAperturarCaja from "../modals/modal-aperturar-caja";
import ModalCrearIngreso from "../modals/modal-crear-ingreso";
import ModalCrearGasto from "../modals/modal-crear-gasto";
import { NotificacionPrestamosPendientes } from "../../gestion-cajas/_components/notificacion-prestamos-pendientes";
import { useRouter } from "next/navigation";

// Mapa de iconos
const iconMap: Record<string, any> = {
  MdSpaceDashboard,
  FaCartShopping,
  IoMdContact,
  FaMoneyBillTrendUp,
  FaClipboardList,
};

export default function TopNav({ className }: { className?: string }) {
  const router = useRouter();
  const { can } = usePermissionHook();
  const [openAperturaCaja, setOpenAperturaCaja] = useState(false);
  const [openCrearIngreso, setOpenCrearIngreso] = useState(false);
  const [openCrearGasto, setOpenCrearGasto] = useState(false);

  const moduleId = "facturacion-electronica";
  const nav = getModuleNav(moduleId);
  const items = getTopNavItems(moduleId, can);

  if (!nav) return null;

  // Mapa de acciones
  const actionHandlers: Record<string, () => void> = {
    openAperturaCaja: () => setOpenAperturaCaja(true),
    openCrearIngreso: () => setOpenCrearIngreso(true),
    openCrearGasto: () => setOpenCrearGasto(true),
  };

  return (
    <BaseNav className={className} bgColorClass={nav.topNav.bgColor}>
      {items.map((item) => {
        const Icon = iconMap[item.icon];

        if (item.type === "dropdown" && item.items) {
          const menuItems = item.items.map((sub) => ({
            key: sub.key,
            label: sub.label,
            onClick: sub.route
              ? () => router.push(sub.route as string)
              : sub.action && actionHandlers[sub.action]
              ? actionHandlers[sub.action]
              : undefined,
          }));

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

      {/* Notificaciones de préstamos pendientes */}
      <div className="ml-auto">
        <NotificacionPrestamosPendientes />
      </div>

      {/* Modales */}
      <ModalAperturarCaja
        open={openAperturaCaja}
        setOpen={setOpenAperturaCaja}
      />
      <ModalCrearIngreso open={openCrearIngreso} setOpen={setOpenCrearIngreso} />
      <ModalCrearGasto open={openCrearGasto} setOpen={setOpenCrearGasto} />
    </BaseNav>
  );
}
