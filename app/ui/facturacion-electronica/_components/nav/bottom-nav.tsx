import { FaCartShopping } from "react-icons/fa6";
import { MdPointOfSale } from "react-icons/md";
import BaseNav from "~/app/_components/nav/base-nav";
import ButtonNav from "~/app/_components/nav/button-nav";
import { IoDocumentAttach, IoDocuments } from "react-icons/io5";
import { GiReceiveMoney } from "react-icons/gi";
import { IoMdContact } from "react-icons/io";

export default function BottomNav({ className }: { className?: string }) {
  return (
    <BaseNav
      className={className}
      withDropdownUser={false}
      bgColorClass="bg-amber-600"
    >
      <ButtonNav
        colorActive="text-amber-600"
        path="/ui/facturacion-electronica/mis-ventas"
      >
        <FaCartShopping />
        Mis Ventas
      </ButtonNav>
      <ButtonNav colorActive="text-amber-600">
        <MdPointOfSale />
        Mis Cotizaciones
      </ButtonNav>
      <ButtonNav colorActive="text-amber-600">
        <IoDocumentAttach />
        Mis Guias
      </ButtonNav>
      <ButtonNav colorActive="text-amber-600">
        <GiReceiveMoney />
        Mis Préstamos
      </ButtonNav>
      <ButtonNav colorActive="text-amber-600">
        <IoDocuments />
        Mis Notas
      </ButtonNav>
      <ButtonNav colorActive="text-amber-600">
        <IoMdContact />
        Mis Contactos
      </ButtonNav>
    </BaseNav>
  );
}
