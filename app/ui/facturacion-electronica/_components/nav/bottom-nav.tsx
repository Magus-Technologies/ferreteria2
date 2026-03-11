"use client";

import { getBottomNavItems, getModuleNav } from "~/lib/navigation";
import usePermissionHook from "~/hooks/use-permission";
import { FaCartShopping, FaGift, FaTruck } from "react-icons/fa6";
import { FaFileInvoice, FaHistory } from "react-icons/fa";
import { MdPointOfSale } from "react-icons/md";
import ButtonNav from "~/app/_components/nav/button-nav";
import { IoDocumentAttach } from "react-icons/io5";
import { GiReceiveMoney } from "react-icons/gi";
import { IoMdContact } from "react-icons/io";
import { HistoryOutlined, SwapOutlined } from "@ant-design/icons";
import { useState, useRef, useEffect, useCallback, createElement } from "react";
import { Drawer, Dropdown } from "antd";
import { HiMenuAlt3 } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import { HiDotsHorizontal } from "react-icons/hi";
import { useRouter, usePathname } from "next/navigation";

// Mapa de iconos
const iconMap: Record<string, any> = {
  FaCartShopping,
  FaTruck,
  MdPointOfSale,
  IoDocumentAttach,
  GiReceiveMoney,
  IoMdContact,
  HistoryOutlined,
  SwapOutlined,
  FaHistory,
  FaFileInvoice,
  FaGift,
};

export default function BottomNav({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { can } = usePermissionHook();
  const moduleId = "facturacion-electronica";
  const nav = getModuleNav(moduleId);
  const items = getBottomNavItems(moduleId, can);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(items.length);
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  // Calcular cuántos items caben en el contenedor
  const calculate = useCallback(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const containerWidth = container.getBoundingClientRect().width;
    const children = Array.from(measure.children) as HTMLElement[];
    const gap = 28;
    const moreButtonWidth = 120;

    let totalWidth = 0;
    let count = 0;

    for (let i = 0; i < children.length; i++) {
      const childWidth = children[i].getBoundingClientRect().width;
      const addedWidth = (count > 0 ? gap : 0) + childWidth;

      // Si es el último item, verificar si TODOS caben sin botón "Más"
      if (i === children.length - 1) {
        if (totalWidth + addedWidth <= containerWidth) {
          count = children.length;
          break;
        }
      }

      // Si no es el último, verificar si cabe con espacio para "Más"
      if (totalWidth + addedWidth + gap + moreButtonWidth > containerWidth) {
        break;
      }

      totalWidth += addedWidth;
      count++;
    }

    setVisibleCount(Math.max(count, 1));
  }, [items.length]);

  useEffect(() => {
    // Pequeño delay para asegurar que el DOM está listo
    const timer = setTimeout(calculate, 50);
    const observer = new ResizeObserver(calculate);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [calculate]);

  if (!nav) return null;

  const visibleItems = items.slice(0, visibleCount);
  const overflowItems = items.slice(visibleCount);

  // Items del dropdown "Más" con indicador de activo
  const overflowMenuItems = overflowItems.map((item) => {
    const Icon = iconMap[item.icon];
    const isActive = pathname === item.route;
    return {
      key: item.id,
      label: (
        <span className={isActive ? 'font-bold text-amber-600' : ''}>
          {item.label}
        </span>
      ),
      icon: Icon ? createElement(Icon, { className: isActive ? 'text-amber-600' : '' } as any) : null,
      onClick: item.route ? () => router.push(item.route!) : undefined,
    };
  });

  // Verificar si algún item del overflow está activo
  const hasActiveOverflow = overflowItems.some((item) => pathname === item.route);

  return (
    <div className={`px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-3 lg:px-6 lg:py-2 xl:px-8 xl:py-2 w-full ${className || ''}`}>
      <div
        className={`flex items-center justify-between ${nav.bottomNav.bgColor}
                    rounded-2xl lg:rounded-full
                    px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-2 lg:px-10 lg:py-3 xl:px-16 xl:py-3
                    text-white shadow-lg shadow-black/20`}
      >
        {/* Botón Menú Hamburguesa - Solo móvil/tablet */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="lg:hidden flex items-center justify-center p-2 hover:bg-white/20 rounded-lg transition-all active:scale-95"
          aria-label="Abrir menú"
        >
          <HiMenuAlt3 className="text-2xl sm:text-3xl" />
        </button>

        {/* Desktop: items visibles + dropdown "Más" */}
        <div ref={containerRef} className="hidden lg:flex items-center justify-evenly w-full">
          {visibleItems.map((item) => {
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

          {/* Botón "Más" con dropdown de items que no caben */}
          {overflowItems.length > 0 && (
            <Dropdown
              menu={{ items: overflowMenuItems }}
              placement="top"
              trigger={['click']}
            >
              <div
                className={`cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded-full transition-all text-sm text-nowrap shrink-0
                  ${hasActiveOverflow
                    ? `bg-white ${nav.bottomNav.activeColor}`
                    : 'text-white hover:bg-white/10'
                  }`}
              >
                <HiDotsHorizontal className="text-lg" />
                Más ({overflowItems.length})
              </div>
            </Dropdown>
          )}
        </div>

        {/* Capa oculta para medir el ancho de cada item */}
        <div
          ref={measureRef}
          className="flex gap-4 pointer-events-none"
          aria-hidden="true"
          style={{ position: 'fixed', top: -9999, left: -9999, visibility: 'hidden' }}
        >
          {items.map((item) => {
            const Icon = iconMap[item.icon];
            return (
              <div
                key={`m-${item.id}`}
                className="flex items-center gap-2 text-sm text-nowrap px-3 lg:px-3 xl:px-6 py-0.5 xl:py-1"
              >
                {Icon && <Icon />}
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drawer para móvil/tablet - muestra TODOS los items */}
      <Drawer
        title={
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">Menú</span>
            <button
              onClick={() => setDrawerOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-all"
            >
              <IoClose className="text-2xl" />
            </button>
          </div>
        }
        placement="left"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={280}
        closeIcon={null}
        className="lg:hidden"
        styles={{ body: { padding: '12px' } }}
      >
        <div className="flex flex-col gap-3">
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
        </div>
      </Drawer>
    </div>
  );
}
