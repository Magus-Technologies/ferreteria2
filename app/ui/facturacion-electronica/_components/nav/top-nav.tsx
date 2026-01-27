"use client";

import { MdSpaceDashboard } from "react-icons/md";
import { FaClipboardList } from "react-icons/fa";
import { FaCartShopping, FaMoneyBillTrendUp } from "react-icons/fa6";
import DropdownBase from "~/components/dropdown/dropdown-base";
import { IoMdContact } from "react-icons/io";
import BaseNav from "~/app/_components/nav/base-nav";
import ButtonNav from "~/app/_components/nav/button-nav";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ModalAperturarCaja from "../modals/modal-aperturar-caja";
import ModalCrearIngreso from "../modals/modal-crear-ingreso";
import ModalCrearGasto from "../modals/modal-crear-gasto";
import ModalMoverDineroSubCajas from "../../gestion-cajas/_components/modal-mover-dinero-subcajas";
import ModalSolicitarEfectivo from "../../gestion-cajas/_components/modal-solicitar-efectivo";
import useItemsFinanzas from "../../_hooks/use-items-finanzas";
import useItemsVentas from "../../_hooks/use-items-ventas";
import { NotificacionPrestamosPendientes } from "../../gestion-cajas/_components/notificacion-prestamos-pendientes";
import { QueryKeys } from "~/app/_lib/queryKeys";

export default function TopNav({ className }: { className?: string }) {
  const [openAperturaCaja, setOpenAperturaCaja] = useState(false);
  const [openCrearIngreso, setOpenCrearIngreso] = useState(false);
  const [openCrearGasto, setOpenCrearGasto] = useState(false);
  const [openMoverDinero, setOpenMoverDinero] = useState(false);
  const [openPedirPrestamo, setOpenPedirPrestamo] = useState(false);

  // Obtener caja activa (incluye apertura)
  const { data: cajaActiva } = useQuery({
    queryKey: [QueryKeys.CAJA_ACTIVA],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cajas/activa`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })
      const data = await response.json()
      return data.data
    },
  })

  const { itemsFinanzas } = useItemsFinanzas({
    setOpenAperturaCaja,
    setOpenCrearIngreso,
    setOpenCrearGasto,
    setOpenMoverDinero,
    setOpenPedirPrestamo,
  });
  const { itemsVentas } = useItemsVentas();

  return (
    <BaseNav className={className} bgColorClass="bg-amber-600">
      <ButtonNav
        path="/ui/facturacion-electronica"
        colorActive="text-amber-600"
      >
        <MdSpaceDashboard />
        Dashboard
      </ButtonNav>

      <DropdownBase menu={{ items: itemsVentas }}>
        <ButtonNav withIcon={false} colorActive="text-amber-600">
          <FaCartShopping />
          Ventas
        </ButtonNav>
      </DropdownBase>
      <ButtonNav colorActive="text-amber-600">
        <IoMdContact />
        Crear Contacto
      </ButtonNav>
      <ModalAperturarCaja
        open={openAperturaCaja}
        setOpen={setOpenAperturaCaja}
      />
      <ModalCrearIngreso
        open={openCrearIngreso}
        setOpen={setOpenCrearIngreso}
      />
      <ModalCrearGasto
        open={openCrearGasto}
        setOpen={setOpenCrearGasto}
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
      <DropdownBase menu={{ items: itemsFinanzas }}>
        <ButtonNav withIcon={false} colorActive="text-amber-600">
          <FaMoneyBillTrendUp />
          Finanzas
        </ButtonNav>
      </DropdownBase>
      <ButtonNav
        path="/ui/gestion-comercial-e-inventario/mi-almacen"
        colorActive="text-emerald-600"
      >
        <FaClipboardList />
        Kardex
      </ButtonNav>

      {/* Notificaciones de préstamos pendientes */}
      <div className="ml-auto">
        <NotificacionPrestamosPendientes />
      </div>
    </BaseNav>
  );
}
