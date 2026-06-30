"use client";

import { getTopNavItems, getModuleNav } from "~/lib/navigation";
import usePermissionHook from "~/hooks/use-permission";
import { MdSpaceDashboard } from "react-icons/md";
import { FaClipboardList } from "react-icons/fa";
import { FaCartShopping, FaGift, FaMoneyBillTrendUp } from "react-icons/fa6";
import DropdownBase from "~/components/dropdown/dropdown-base";
import { IoMdContact } from "react-icons/io";
import BaseNav from "~/app/_components/nav/base-nav";
import ButtonNav from "~/app/_components/nav/button-nav";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ModalAperturarCaja from "../modals/modal-aperturar-caja";
import ModalMoverDineroSubCajas from "../../gestion-cajas/_components/modal-mover-dinero-subcajas";
import ModalSolicitarEfectivo from "../../gestion-cajas/_components/modal-solicitar-efectivo";
import ModalTrasladoBoveda from "../../mis-aperturas-cierres/_components/modals/modal-traslado-boveda";
import ModalEfectivoApertura from "../../gestion-cajas/_components/modal-efectivo-apertura";
import { QueryKeys } from "~/app/_lib/queryKeys";
import { useRouter } from "next/navigation";
import { fetchCajaActivaOrNull } from "~/lib/api/caja";

// Mapa de iconos
const iconMap: Record<string, any> = {
  MdSpaceDashboard,
  FaCartShopping,
  FaGift,
  IoMdContact,
  FaMoneyBillTrendUp,
  FaClipboardList,
};

export default function TopNav({ className }: { className?: string }) {
  const router = useRouter();
  const { can } = usePermissionHook();
  const [openAperturaCaja, setOpenAperturaCaja] = useState(false);
  const [openMoverDinero, setOpenMoverDinero] = useState(false);
  const [openPedirPrestamo, setOpenPedirPrestamo] = useState(false);
  const [openTrasladoBoveda, setOpenTrasladoBoveda] = useState(false);
  const [openEfectivoApertura, setOpenEfectivoApertura] = useState(false);

  // Obtener caja activa
  const { data: cajaActiva } = useQuery({
    queryKey: [QueryKeys.CAJA_ACTIVA],
    queryFn: () => fetchCajaActivaOrNull(),
    staleTime: 30000,
    gcTime: 60000,
    retry: 1,
  })

  const moduleId = "facturacion-electronica";
  const nav = getModuleNav(moduleId);
  const items = getTopNavItems(moduleId, can);

  if (!nav) return null;

  // Mapa de acciones
  const actionHandlers: Record<string, () => void> = {
    openAperturaCaja: () => setOpenAperturaCaja(true),
    openMoverDinero: () => setOpenMoverDinero(true),
    openPedirPrestamo: () => setOpenPedirPrestamo(true),
    openTrasladoBoveda: () => setOpenTrasladoBoveda(true),
    openEfectivoApertura: () => setOpenEfectivoApertura(true),
  };

  // Hooks personalizados para items de dropdowns (ya no se usan, ahora viene del JSON)
  // const { itemsFinanzas } = useItemsFinanzas({...});
  // const { itemsVentas } = useItemsVentas();

  return (
    <BaseNav className={className} bgColorClass={nav.topNav.bgColor}>
      {items.map((item) => {
        const Icon = iconMap[item.icon];

        if (item.type === "dropdown" && item.items) {
          const menuItems = item.items.map((sub) => {
            // Manejar divider
            if (sub.key === 'divider' || (sub as any).type === 'divider') {
              return { type: 'divider' as const };
            }

            return {
              key: sub.key,
              label: sub.label,
              onClick: sub.route
                ? () => router.push(sub.route as string)
                : sub.action && actionHandlers[sub.action]
                  ? actionHandlers[sub.action]
                  : undefined,
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

      {/* Modales */}
      <ModalAperturarCaja
        open={openAperturaCaja}
        setOpen={setOpenAperturaCaja}
      />
      <ModalMoverDineroSubCajas
        open={openMoverDinero}
        setOpen={setOpenMoverDinero}
      />
      <ModalSolicitarEfectivo
        open={openPedirPrestamo}
        setOpen={setOpenPedirPrestamo}
        aperturaId={cajaActiva?.id || ''}
      />
      <ModalEfectivoApertura
        open={openEfectivoApertura}
        setOpen={setOpenEfectivoApertura}
        aperturaId={cajaActiva?.id || ''}
      />
      <ModalTrasladoBoveda
        open={openTrasladoBoveda}
        onCancel={() => setOpenTrasladoBoveda(false)}
        onSuccess={() => setOpenTrasladoBoveda(false)}
        aperturaCierreId={cajaActiva?.id || ''}
        vendedorId={cajaActiva?.user?.id || cajaActiva?.user_id || (() => { try { return JSON.parse(localStorage.getItem('user') || '{}')?.id || '' } catch { return '' } })()}
      />
    </BaseNav>
  );
}
