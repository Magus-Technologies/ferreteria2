"use client";

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
import useItemsFinanzas from "../../_hooks/use-items-finanzas";
import useItemsVentas from "../../_hooks/use-items-ventas";

export default function TopNav({ className }: { className?: string }) {
  const [openAperturaCaja, setOpenAperturaCaja] = useState(false);
  const [openCrearIngreso, setOpenCrearIngreso] = useState(false);
  const [openCrearGasto, setOpenCrearGasto] = useState(false);

  const { itemsFinanzas } = useItemsFinanzas({
    setOpenAperturaCaja,
    setOpenCrearIngreso,
    setOpenCrearGasto,
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
    </BaseNav>
  );
}
