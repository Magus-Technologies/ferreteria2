"use client";

import { Modal, Spin, Empty } from "antd";
import { useQuery } from "@tanstack/react-query";
import { FaBoxOpen } from "react-icons/fa";
import { getStockProductos } from "~/lib/api/vales-compra";
import { productosApiV2 } from "~/lib/api/producto";
import { GetStock } from "~/app/_utils/get-stock";

interface ModalStockProductosValeProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** IDs de los productos involucrados en la promoción (regalo / descuento / modalidad). */
  productoIds: number[];
}

interface FilaStock {
  id: number;
  cod_producto: string;
  name: string;
  stock: number;
  unidades_contenidas: number;
}

export default function ModalStockProductosVale({
  open,
  setOpen,
  productoIds,
}: ModalStockProductosValeProps) {
  const { data: filas, isLoading } = useQuery<FilaStock[]>({
    // El key incluye los ids ordenados para refrescar al cambiar la selección.
    queryKey: ["vale-stock-productos-modal", [...productoIds].sort((a, b) => a - b)],
    queryFn: async () => {
      if (productoIds.length === 0) return [];
      const stockRes = await getStockProductos(productoIds);
      const stockMap = stockRes.data?.data ?? {};
      const prodResults = await Promise.all(
        productoIds.map((id) => productosApiV2.getById(id)),
      );
      return productoIds.map((id, i) => {
        const p = prodResults[i]?.data;
        return {
          id,
          cod_producto: p?.cod_producto ?? "",
          name: p?.name ?? `Producto ${id}`,
          stock: stockMap[id] ?? 0,
          unidades_contenidas: Number(p?.unidades_contenidas) || 1,
        };
      });
    },
    enabled: open && productoIds.length > 0,
  });

  return (
    <Modal
      title={
        <span className="flex items-center gap-2">
          <FaBoxOpen className="text-blue-500" />
          Stock de los productos de la promoción
        </span>
      }
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={520}
    >
      <p className="text-xs text-gray-500 mb-3">
        Stock total (todos los almacenes) de los productos involucrados. Solo
        informativo, para ayudarte a definir el “Stock de la promoción”.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      ) : !filas || filas.length === 0 ? (
        <Empty description="No hay productos seleccionados" />
      ) : (
        <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
          {filas.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between gap-3 px-3 py-2 odd:bg-gray-50"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">
                  {f.name}
                </div>
                {f.cod_producto && (
                  <div className="text-xs text-gray-400">
                    Cód: {f.cod_producto}
                  </div>
                )}
              </div>
              <span className="text-sm font-semibold text-blue-600 whitespace-nowrap">
                <GetStock
                  stock_fraccion={f.stock}
                  unidades_contenidas={f.unidades_contenidas}
                />
              </span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
