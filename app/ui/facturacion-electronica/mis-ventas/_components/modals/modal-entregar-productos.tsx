"use client";

import { Form, message, Modal } from "antd";
import { useState, useEffect } from "react";
import TitleForm from "~/components/form/title-form";
import { getVentaResponseProps } from "~/app/_actions/venta";
import SelectAlmacen from "~/app/_components/form/selects/select-almacen";
import TableWithTitle from "~/components/tables/table-with-title";
import { ColDef } from "ag-grid-community";
import useCreateEntrega from "../../_hooks/use-create-entrega";
import dayjs from "dayjs";
import { useStoreAlmacen } from "~/store/store-almacen";
import { useAuth } from "~/lib/auth-context";
import ModalCreateCliente from "./modal-create-cliente";
import PopoverOpcionesEntrega from "../popovers/popover-opciones-entrega";
import ButtonBase from "~/components/buttons/button-base";
import type { Cliente } from "~/lib/api/cliente";

interface ModalEntregarProductosProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  venta?: getVentaResponseProps;
}

interface FormValues {
  almacen_salida_id: number;
  tipo_despacho: "EnTienda" | "Domicilio";
  chofer_id?: string;
  fecha_programada?: Date;
  hora_inicio?: string;
  hora_fin?: string;
  direccion_entrega?: string;
  observaciones?: string;
}

type ProductoEntrega = {
  id: number;
  producto: string;
  ubicacion: string;
  total: number;
  entregado: number;
  pendiente: number;
  entregar: number;
  unidad_derivada_venta_id: number;
};

export default function ModalEntregarProductos({
  open,
  setOpen,
  venta,
}: ModalEntregarProductosProps) {
  const [form] = Form.useForm<FormValues>();
  const almacen_id = useStoreAlmacen((state) => state.almacen_id);
  const { user } = useAuth();

  const [productosEntrega, setProductosEntrega] = useState<ProductoEntrega[]>(
    []
  );
  const [tipoDespacho, setTipoDespacho] = useState<"EnTienda" | "Domicilio">(
    "EnTienda"
  );
  const [modalEditarClienteOpen, setModalEditarClienteOpen] = useState(false);

  const { crearEntrega, loading } = useCreateEntrega({
    onSuccess: () => {
      setOpen(false);
      form.resetFields();
      setProductosEntrega([]);
      setTipoDespacho("EnTienda");
    },
  });

  useEffect(() => {
    if (open && venta) {
      console.log('Venta recibida:', venta);
      console.log('Productos por almacen:', venta.productos_por_almacen);
      const productos: ProductoEntrega[] = [];
      
      if (venta.productos_por_almacen && Array.isArray(venta.productos_por_almacen)) {
        venta.productos_por_almacen.forEach((productoAlmacen) => {
          console.log('Producto almacen:', productoAlmacen);
          if (productoAlmacen.unidades_derivadas && Array.isArray(productoAlmacen.unidades_derivadas)) {
            productoAlmacen.unidades_derivadas.forEach((unidad) => {
              console.log('Unidad derivada:', unidad);
              const total = Number(unidad.cantidad);
              // Si cantidad_pendiente es 0, null o undefined, usar la cantidad total
              // Esto maneja ventas antiguas donde cantidad_pendiente no se inicializó correctamente
              const cantidadPendienteRaw = Number(unidad.cantidad_pendiente);
              const pendiente = cantidadPendienteRaw > 0 ? cantidadPendienteRaw : total;
              const entregado = total - pendiente;

              console.log(`Producto: ${productoAlmacen.producto_almacen?.producto?.name}, Total: ${total}, Pendiente: ${pendiente}`);

              if (pendiente > 0) {
                productos.push({
                  id: productos.length + 1,
                  producto: productoAlmacen.producto_almacen?.producto?.name || 'Sin nombre',
                  ubicacion: "",
                  total,
                  entregado,
                  pendiente,
                  entregar: pendiente,
                  unidad_derivada_venta_id: unidad.id,
                });
              }
            });
          }
        });
      }
      
      console.log('Productos finales:', productos);
      setProductosEntrega(productos);
      form.setFieldsValue({
        almacen_salida_id: almacen_id,
        tipo_despacho: "EnTienda",
        direccion_entrega: venta.cliente?.direccion || "",
      });
    } else if (!open) {
      setProductosEntrega([]);
      form.resetFields();
      setTipoDespacho("EnTienda");
    }
  }, [open, venta, almacen_id, form]);

  const columnDefs: ColDef<ProductoEntrega>[] = [
    {
      headerName: "Producto",
      field: "producto",
      flex: 1,
    },
    {
      headerName: "Ubicación",
      field: "ubicacion",
      width: 120,
    },
    {
      headerName: "Total",
      field: "total",
      width: 100,
      valueFormatter: (params) => Number(params.value).toFixed(2),
    },
    {
      headerName: "Entregado",
      field: "entregado",
      width: 120,
      valueFormatter: (params) => Number(params.value).toFixed(2),
    },
    {
      headerName: "Pendiente",
      field: "pendiente",
      width: 120,
      valueFormatter: (params) => Number(params.value).toFixed(2),
      cellStyle: { color: "#f59e0b", fontWeight: "bold" },
    },
    {
      headerName: "Entregar",
      field: "entregar",
      width: 120,
      editable: true,
      singleClickEdit: true,
      cellEditor: "agNumberCellEditor",
      cellEditorParams: {
        min: 0,
        max: (params: { data: ProductoEntrega }) => params.data.pendiente,
        precision: 2,
      },
      valueFormatter: (params) => Number(params.value).toFixed(2),
      cellStyle: {
        backgroundColor: "#f0fdf4",
        color: "#000000",
        fontWeight: "500",
      },
      cellClass: "ag-cell-editable",
    },
    {
      headerName: "Eliminar",
      width: 80,
      cellRenderer: () => "❌",
      onCellClicked: (params) => {
        if (params.data) {
          setProductosEntrega((prev) =>
            prev.filter((p) => p.id !== params.data!.id)
          );
        }
      },
      cellStyle: {
        cursor: "pointer",
        textAlign: "center",
        color: "#ef4444",
      },
    },
  ];

  const handleConfirmarEntrega = () => {
    const values = form.getFieldsValue();

    if (productosEntrega.length === 0) {
      message.error("Debe haber al menos un producto para entregar");
      return;
    }

    if (!venta || !user?.id) return;

    const productosConCantidad = productosEntrega.filter((p) => p.entregar > 0);

    if (productosConCantidad.length === 0) {
      message.error("Debe especificar cantidades a entregar");
      return;
    }

    if (tipoDespacho === "Domicilio") {
      if (!values.chofer_id) {
        message.error("Debe seleccionar un chofer");
        return;
      }
      if (!values.fecha_programada) {
        message.error("Debe seleccionar una fecha");
        return;
      }
      if (!values.direccion_entrega) {
        message.error("Debe ingresar una dirección");
        return;
      }
    }

    crearEntrega({
      venta: {
        connect: { id: venta.id },
      },
      tipo_entrega: tipoDespacho === "EnTienda" ? "Inmediata" : "Programada",
      tipo_despacho: tipoDespacho,
      estado_entrega: tipoDespacho === "EnTienda" ? "Entregado" : "Pendiente",
      fecha_entrega: dayjs().toDate(),
      fecha_programada: values.fecha_programada,
      hora_inicio: values.hora_inicio,
      hora_fin: values.hora_fin,
      direccion_entrega: values.direccion_entrega,
      observaciones: values.observaciones,
      almacen_salida: {
        connect: { id: values.almacen_salida_id },
      },
      chofer:
        tipoDespacho === "Domicilio" && values.chofer_id
          ? {
              connect: { id: values.chofer_id },
            }
          : undefined,
      user: {
        connect: { id: user.id },
      },
      productos_entregados: {
        create: productosConCantidad.map((p) => ({
          unidad_derivada_venta: {
            connect: { id: p.unidad_derivada_venta_id },
          },
          cantidad_entregada: p.entregar,
          ubicacion: p.ubicacion || null,
        })),
      },
    });
  };

  return (
    <>
      <Modal
        title={
          <TitleForm className="!pb-0">
            ENTREGAR PRODUCTOS
            {venta && (
              <div className="text-sm font-normal text-gray-600 mt-1">
                FACTURA DE CLIENTE N° {venta.serie}-{venta.numero}
              </div>
            )}
          </TitleForm>
        }
        open={open}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
          setProductosEntrega([]);
          setTipoDespacho("EnTienda");
        }}
        width={900}
        centered
        footer={
          <div className="flex justify-end gap-2">
            <ButtonBase
              color="default"
              size="md"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </ButtonBase>
            <PopoverOpcionesEntrega
              form={form}
              tipoDespacho={tipoDespacho}
              setTipoDespacho={setTipoDespacho}
              onConfirmar={handleConfirmarEntrega}
              onEditarCliente={() => setModalEditarClienteOpen(true)}
              direccion={form.getFieldValue("direccion_entrega")}
              clienteNombre={
                venta?.cliente?.razon_social ||
                `${venta?.cliente?.nombres || ""} ${venta?.cliente?.apellidos || ""}`.trim()
              }
              loading={loading}
            >
              <ButtonBase color="success" size="md" disabled={loading}>
                {loading ? "Procesando..." : "Entregar"}
              </ButtonBase>
            </PopoverOpcionesEntrega>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Locación de salida:
              </label>
              <SelectAlmacen
                propsForm={{
                  name: "almacen_salida_id",
                  rules: [
                    {
                      required: true,
                      message: "Seleccione un almacén",
                    },
                  ],
                }}
                className="w-full"
                form={form}
              />
            </div>

            <div className="text-sm text-gray-600">
              {productosEntrega.length} producto(s) seleccionado(s)
            </div>

            <div style={{ height: "350px" }}>
              <TableWithTitle<ProductoEntrega>
                id="productos-entrega"
                title="Lista de productos"
                columnDefs={columnDefs}
                rowData={productosEntrega}
                onCellValueChanged={(params) => {
                  setProductosEntrega((prev) =>
                    prev.map((p) =>
                      p.id === params.data.id
                        ? { ...p, entregar: params.newValue }
                        : p
                    )
                  );
                }}
              />
            </div>
          </div>
        </Form>
      </Modal>

      <ModalCreateCliente
        open={modalEditarClienteOpen}
        setOpen={setModalEditarClienteOpen}
        dataEdit={venta?.cliente as Cliente | undefined}
        onSuccess={(cliente) => {
          if (cliente.direccion) {
            form.setFieldValue("direccion_entrega", cliente.direccion);
          }
          setModalEditarClienteOpen(false);
        }}
      />
    </>
  );
}
