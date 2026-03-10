"use client";

import { Modal, message } from "antd";
import { useState } from "react";
import { MdOutlineSell, MdSell } from "react-icons/md";
import { DescuentoTipo, type getVentaResponseProps } from "~/lib/api/venta";
import SelectAlmacen from "~/app/_components/form/selects/select-almacen";
import SelectProductos from "~/app/_components/form/selects/select-productos";
import SelectPaquetes from "~/app/_components/form/selects/select-paquetes";
import SelectServicios from "~/app/_components/form/selects/select-servicios";
import TituloModulos from "~/app/_components/others/titulo-modulos";
import usePermissionHook from "~/hooks/use-permission";
import { permissions } from "~/lib/permissions";
import CardAgregarProductoVenta from "../cards/card-agregar-producto-venta";
import { useStoreProductoSeleccionadoSearch } from "~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search";
import { useStoreProductoAgregadoVenta } from "../../_store/store-producto-agregado-venta";
import ModalBuscarPaquete from "~/app/_components/modals/modal-buscar-paquete";
import ModalBuscarServicio from "~/app/_components/modals/modal-buscar-servicio";
import { useStorePaqueteSeleccionado } from "../../../store/store-paquete-seleccionado";
import { useStoreServicioSeleccionado } from "../../../store/store-servicio-seleccionado";
import ConfigurableElement from "~/app/ui/configuracion/permisos-visuales/_components/configurable-element";

export type VentaConUnidadDerivadaNormal = Omit<
  getVentaResponseProps,
  "productos_por_almacen"
> & {
  productos_por_almacen: (Omit<
    NonNullable<getVentaResponseProps["productos_por_almacen"]>[number],
    "unidades_derivadas"
  > & {
    unidades_derivadas: (NonNullable<
      getVentaResponseProps["productos_por_almacen"]
    >[number]["unidades_derivadas"][number] & {
      unidad_derivada_normal: NonNullable<
        getVentaResponseProps["productos_por_almacen"]
      >[number]["unidades_derivadas"][number]["unidad_derivada_inmutable"];
    })[];
  })[];
};

export default function HeaderCrearVenta({
  venta,
}: {
  venta?: VentaConUnidadDerivadaNormal;
}) {
  const { can } = usePermissionHook();

  const [openModalAgregarProducto, setOpenModalAgregarProducto] =
    useState(false);
  const [openModalBuscarPaquete, setOpenModalBuscarPaquete] = useState(false);
  const [textDefaultPaquete, setTextDefaultPaquete] = useState("");
  const [openModalBuscarServicio, setOpenModalBuscarServicio] = useState(false);
  const [textDefaultServicio, setTextDefaultServicio] = useState("");

  const setProductoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    (store) => store.setProducto,
  );
  const productoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    (store) => store.producto,
  );

  // Store para agregar productos a la venta
  const setProductoAgregado = useStoreProductoAgregadoVenta(
    (store) => store.setProductoAgregado,
  );

  // Store para paquete seleccionado
  const paqueteSeleccionadoStore = useStorePaqueteSeleccionado(
    (store) => store.paquete,
  );

  // Store para servicio seleccionado
  const servicioSeleccionadoStore = useStoreServicioSeleccionado(
    (store) => store.servicio,
  );

  /**
   * Agregar todos los productos de un paquete a la venta
   */
  const handleAgregarPaquete = async () => {
    const paquete = paqueteSeleccionadoStore;

    if (!paquete) {
      message.warning("Selecciona un paquete");
      return;
    }

    if (!paquete.productos || paquete.productos.length === 0) {
      message.warning("Este paquete no tiene productos");
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
          marca_name: paqueteProducto.producto.marca?.name || "",
          unidad_derivada_id: paqueteProducto.unidad_derivada_id,
          unidad_derivada_name: paqueteProducto.unidad_derivada.name,
          unidad_derivada_factor: 1,
          cantidad: paqueteProducto.cantidad,
          precio_venta: paqueteProducto.precio_sugerido || 0,
          recargo: 0,
          descuento: Number(paqueteProducto.descuento || 0),
          descuento_tipo: DescuentoTipo.MONTO,
          subtotal: 0,
          // ✅ Agregar información del paquete
          paquete_id: paquete.id,
          paquete_nombre: paquete.nombre,
        });

        productosAgregados++;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    message.success(
      `Paquete "${paquete.nombre}" agregado con ${productosAgregados} producto${
        productosAgregados !== 1 ? "s" : ""
      }`,
    );
  };

  /**
   * Agregar un servicio a la venta
   */
  const handleAgregarServicio = (seleccion: {
    servicio: { id: number; nombre: string; precio: number; codigo_sunat: string | null };
    cantidad: number;
    precio_unitario: number;
    referencia?: string;
  }) => {
    const { servicio, cantidad, precio_unitario, referencia } = seleccion;

    setProductoAgregado({
      _tipo: 'servicio',
      producto_id: -servicio.id, // Negativo para no colisionar con producto_id
      producto_name: servicio.nombre,
      producto_codigo: servicio.codigo_sunat || 'SRV',
      marca_name: '-',
      unidad_derivada_id: 0,
      unidad_derivada_name: 'SERVICIO',
      unidad_derivada_factor: 1,
      cantidad,
      precio_venta: precio_unitario,
      recargo: 0,
      subtotal: Number((cantidad * precio_unitario).toFixed(2)),
      servicio_id: servicio.id,
      servicio_nombre: servicio.nombre,
      servicio_codigo_sunat: servicio.codigo_sunat,
      servicio_referencia: referencia,
    });

    message.success(`Servicio "${servicio.nombre}" agregado`);
  };

  /**
   * Agregar servicio seleccionado desde el modal de búsqueda (via store)
   */
  const handleAgregarServicioFromModal = () => {
    const servicio = servicioSeleccionadoStore;

    if (!servicio) {
      message.warning("Selecciona un servicio");
      return;
    }

    handleAgregarServicio({
      servicio: {
        id: servicio.id,
        nombre: servicio.nombre,
        precio: Number(servicio.precio),
        codigo_sunat: servicio.codigo_sunat,
      },
      cantidad: 1,
      precio_unitario: Number(servicio.precio),
    });
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
          <ConfigurableElement
            componentId="crear-venta.buscar-producto"
            label="Buscar Producto"
          >
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
          </ConfigurableElement>

          <ConfigurableElement
            componentId="crear-venta.buscar-paquete"
            label="Buscar Paquete"
          >
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
          </ConfigurableElement>

          <ConfigurableElement
            componentId="crear-venta.buscar-servicio"
            label="Buscar Servicio"
          >
            <SelectServicios
              placeholder="Buscar Servicio..."
              className="w-full lg:!min-w-[250px] lg:!w-[250px] lg:!max-w-[250px]"
              classNameIcon="text-violet-600"
              onSelect={(servicio) => {
                handleAgregarServicio({
                  servicio,
                  cantidad: 1,
                  precio_unitario: Number(servicio.precio),
                });
              }}
              onOpenModal={() => setOpenModalBuscarServicio(true)}
            />
          </ConfigurableElement>
        </div>
      }
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        <ConfigurableElement
          componentId="crear-venta.select-almacen"
          label="Selector de Almacén"
        >
          <SelectAlmacen className="w-full" disabled={!!venta} />
        </ConfigurableElement>

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

        <ModalBuscarServicio
          open={openModalBuscarServicio}
          setOpen={setOpenModalBuscarServicio}
          onOk={() => {
            handleAgregarServicioFromModal();
            setOpenModalBuscarServicio(false);
          }}
          textDefault={textDefaultServicio}
          onRowDoubleClicked={({ data }) => {
            if (data) {
              handleAgregarServicioFromModal();
              setOpenModalBuscarServicio(false);
            }
          }}
        />
      </div>
    </TituloModulos>
  );
}
