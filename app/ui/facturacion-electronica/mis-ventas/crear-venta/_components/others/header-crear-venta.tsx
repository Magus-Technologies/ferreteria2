"use client";

import { Modal, message } from "antd";
import { useState } from "react";
import { MdOutlineSell, MdSell } from "react-icons/md";
import { getVentaResponseProps } from "~/app/_actions/venta";
import SelectAlmacen from "~/app/_components/form/selects/select-almacen";
import SelectProductos from "~/app/_components/form/selects/select-productos";
import SelectPaquetes from "~/app/_components/form/selects/select-paquetes";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import usePermission from "~/hooks/use-permission";
import { permissions } from "~/lib/permissions";
import CardAgregarProductoVenta from "../cards/card-agregar-producto-venta";
import { useStoreProductoSeleccionadoSearch } from "~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search";
import { useStoreProductoAgregadoVenta } from "../../_store/store-producto-agregado-venta";
import ModalBuscarPaquete from "~/app/_components/modals/modal-buscar-paquete";
import { useStorePaqueteSeleccionado } from "../../../store/store-paquete-seleccionado";

export type VentaConUnidadDerivadaNormal = Omit<
  getVentaResponseProps,
  "productos_por_almacen"
> & {
  productos_por_almacen: (Omit<
    NonNullable<getVentaResponseProps["productos_por_almacen"]>[number],
    "unidades_derivadas"
  > & {
    unidades_derivadas: (NonNullable<getVentaResponseProps["productos_por_almacen"]>[number]["unidades_derivadas"][number] & {
      unidad_derivada_normal: NonNullable<getVentaResponseProps["productos_por_almacen"]>[number]["unidades_derivadas"][number]["unidad_derivada_inmutable"];
    })[];
  })[];
};

export default function HeaderCrearVenta({
  venta,
}: {
  venta?: VentaConUnidadDerivadaNormal;
}) {
  const can = usePermission();

  const [openModalAgregarProducto, setOpenModalAgregarProducto] = useState(false);
  const [openModalBuscarPaquete, setOpenModalBuscarPaquete] = useState(false);
  const [textDefaultPaquete, setTextDefaultPaquete] = useState("");

  const setProductoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    (store) => store.setProducto
  );
  const productoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    (store) => store.producto
  );

  // Store para agregar productos a la venta
  const setProductoAgregado = useStoreProductoAgregadoVenta(
    (store) => store.setProductoAgregado
  );

  // Store para paquete seleccionado
  const paqueteSeleccionadoStore = useStorePaqueteSeleccionado(
    (store) => store.paquete
  );

  /**
   * Agregar todos los productos de un paquete a la venta
   */
  const handleAgregarPaquete = async () => {
    const paquete = paqueteSeleccionadoStore;
    
    if (!paquete) {
      message.warning('Selecciona un paquete');
      return;
    }

    if (!paquete.productos || paquete.productos.length === 0) {
      message.warning('Este paquete no tiene productos');
      return;
    }

    let productosAgregados = 0;

    // Agregar cada producto con delay de 100ms
    for (const paqueteProducto of paquete.productos) {
      if (paqueteProducto.producto && paqueteProducto.unidad_derivada) {
        setProductoAgregado({
          producto_id: paqueteProducto.producto_id,
          producto_name: paqueteProducto.producto.name,
          producto_codigo: paqueteProducto.producto.cod_producto,
          marca_name: paqueteProducto.producto.marca?.name || '',
          unidad_derivada_id: paqueteProducto.unidad_derivada_id,
          unidad_derivada_name: paqueteProducto.unidad_derivada.name,
          unidad_derivada_factor: 1,
          cantidad: paqueteProducto.cantidad,
          precio_venta: paqueteProducto.precio_sugerido || 0,
          recargo: 0,
          subtotal: 0,
        });

        productosAgregados++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    message.success(
      `Paquete "${paquete.nombre}" agregado con ${productosAgregados} producto${
        productosAgregados !== 1 ? 's' : ''
      }`
    );
  };

  return (
    <TituloModulos
      title={`${venta ? "Editar" : "Crear"} Venta`}
      icon={
        venta ? (
          <MdOutlineSell className="text-orange-600" />
        ) : (
          <MdSell className="text-cyan-600" />
        )
      }
      extra={
        <div className="pl-0 lg:pl-8 flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-4 w-full lg:w-auto">
          <SelectProductos
            autoFocus
            allowClear
            size="large"
            className="w-full lg:!min-w-[400px] lg:!w-[400px] lg:!max-w-[400px] font-normal!"
            classNameIcon="text-cyan-600 mx-1"
            classIconSearch="!mb-0"
            classIconPlus="mb-0!"
            showButtonCreate={can(permissions.PRODUCTO_CREATE)}
            withSearch
            withTipoBusqueda
            showCardAgregarProductoVenta
            showUltimasCompras={false}
            handleOnlyOneResult={(producto) => {
              setProductoSeleccionadoSearchStore(producto);
              if (producto) setOpenModalAgregarProducto(true);
            }}
            onChange={(_, producto) => {
              setProductoSeleccionadoSearchStore(producto);
              if (producto) setOpenModalAgregarProducto(true);
            }}
          />
          
          <SelectPaquetes
            placeholder="Buscar Paquete..."
            className="w-full lg:!min-w-[300px] lg:!w-[300px] lg:!max-w-[300px]"
            classNameIcon="text-cyan-600"
            onSelect={(paquete) => {
              // Guardar en store y abrir modal
              setTextDefaultPaquete(paquete.nombre);
              setOpenModalBuscarPaquete(true);
            }}
            onOpenModal={() => setOpenModalBuscarPaquete(true)}
          />
        </div>
      }
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        <SelectAlmacen className="w-full" disabled={!!venta} />

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
          width={
            typeof window !== "undefined" && window.innerWidth >= 640
              ? 300
              : "95vw"
          }
          classNames={{ content: "min-w-fit" }}
          destroyOnHidden
          maskClosable={false}
          keyboard={false}
        >
          <CardAgregarProductoVenta setOpen={setOpenModalAgregarProducto} />
        </Modal>

        <ModalBuscarPaquete
          open={openModalBuscarPaquete}
          setOpen={setOpenModalBuscarPaquete}
          onOk={async () => {
            await handleAgregarPaquete();
            setOpenModalBuscarPaquete(false);
          }}
          textDefault={textDefaultPaquete}
          onRowDoubleClicked={async ({ data }) => {
            if (data) {
              await handleAgregarPaquete();
              setOpenModalBuscarPaquete(false);
            }
          }}
        />
      </div>
    </TituloModulos>
  );
}
