"use client";

import SelectAlmacen from "~/app/_components/form/selects/select-almacen";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import { TbShoppingCartCog, TbShoppingCartPlus } from "react-icons/tb";
import SelectProductos from "~/app/_components/form/selects/select-productos";
import { permissions } from "~/lib/permissions";
import { Modal } from "antd";
import CardAgregarProductoCompra from "../cards/card-agregar-producto-compra";
import { useState } from "react";
import usePermissionHook from "~/hooks/use-permission";
import { useStoreProductoSeleccionadoSearch } from "~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search";
import {
  type Compra,
  type ProductoAlmacenCompra,
  type UnidadDerivadaInmutableCompra,
} from "~/lib/api/compra";

export type CompraConUnidadDerivadaNormal = Omit<
  Compra,
  "productos_por_almacen"
> & {
  productos_por_almacen: (Omit<ProductoAlmacenCompra, "unidades_derivadas"> & {
    unidades_derivadas: (UnidadDerivadaInmutableCompra & {
      unidad_derivada_normal: NonNullable<
        UnidadDerivadaInmutableCompra["unidad_derivada_inmutable"]
      >;
    })[];
  })[];
  recepciones_almacen_count?: number;
  pagos_de_compras_count?: number;
};

export default function HeaderCrearCompra({
  compra,
}: { compra?: CompraConUnidadDerivadaNormal } = {}) {
  const { can } = usePermissionHook();

  const [openModalAgregarProducto, setOpenModalAgregarProducto] =
    useState(false);

  const setProductoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    (store) => store.setProducto
  );
  const productoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    (store) => store.producto
  );

  return (
    <TituloModulos
      title={`${compra ? "Editar" : "Crear"} Compra`}
      icon={
        compra ? (
          <TbShoppingCartCog className="text-orange-600" />
        ) : (
          <TbShoppingCartPlus className="text-cyan-600" />
        )
      }
      extra={
        (compra?.recepciones_almacen_count ?? 0) > 0 ||
        (compra?.pagos_de_compras_count ?? 0) > 0 ? null : (
          <div className="pl-8 flex items-center gap-4">
            <SelectProductos
            autoFocus
              allowClear
              size="large"
              className="!min-w-[400px] !w-[400px] !max-w-[400px] font-normal!"
              classNameIcon="text-cyan-600 mx-1"
              classIconSearch="!mb-0"
              classIconPlus="mb-0!"
              showButtonCreate={can(permissions.PRODUCTO_CREATE)}
              withSearch
              withTipoBusqueda
              showCardAgregarProducto
              handleOnlyOneResult={(producto) => {
                setProductoSeleccionadoSearchStore(producto);
                if (producto) setOpenModalAgregarProducto(true);
              }}
              onChange={(_, producto) => {
                setProductoSeleccionadoSearchStore(producto);
                if (producto) setOpenModalAgregarProducto(true);
              }}
            />
          </div>
        )
      }
    >
      <div className="flex items-center gap-4">
        <SelectAlmacen className="w-full" disabled={!!compra} />

        <Modal
          open={openModalAgregarProducto}
          onCancel={() => setOpenModalAgregarProducto(false)}
          footer={null}
          title={
            <div className="text-xl font-bold text-left text-balance mb-3">
              <span className="text-slate-400 block">AGREGAR:</span>{" "}
              {productoSeleccionadoSearchStore?.name}
            </div>
          }
          width={300}
          classNames={{ content: "min-w-fit" }}
          destroyOnHidden
          maskClosable={false}
          keyboard={false}
        >
          <CardAgregarProductoCompra setOpen={setOpenModalAgregarProducto} />
        </Modal>
      </div>
    </TituloModulos>
  );
}
