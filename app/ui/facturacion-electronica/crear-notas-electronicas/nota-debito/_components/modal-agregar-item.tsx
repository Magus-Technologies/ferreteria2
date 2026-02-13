"use client";

import { Modal, Tabs, Form, Input, InputNumber, Select, Alert, App } from "antd";
import { useState } from "react";
import { FaBoxes, FaFileInvoiceDollar } from "react-icons/fa";
import TableProductoSearch from "~/app/_components/tables/table-producto-search";
import { TipoBusquedaProducto } from "~/app/_components/form/selects/select-tipo-busqueda-producto";
import { useStoreAlmacen } from "~/store/store-almacen";

interface ModalAgregarItemProps {
  open: boolean;
  onClose: () => void;
  onAdd: (item: any) => void;
  motivoCodigo?: string;
}

// Plantillas de ítems según el motivo
const PLANTILLAS_ITEMS: Record<string, { codigo: string; descripcion: string; placeholder: string }> = {
  "01": {
    codigo: "INT-MORA",
    descripcion: "Interés por mora",
    placeholder: "Ej: Interés por mora - 30 días de retraso",
  },
  "03": {
    codigo: "PENALIDAD",
    descripcion: "Penalidad",
    placeholder: "Ej: Penalidad por incumplimiento de contrato",
  },
  "10": {
    codigo: "OTROS",
    descripcion: "Otros conceptos",
    placeholder: "Ej: Cargo adicional por servicio especial",
  },
};

export default function ModalAgregarItem({
  open,
  onClose,
  onAdd,
  motivoCodigo,
}: ModalAgregarItemProps) {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>("productos");
  const [selectedProducto, setSelectedProducto] = useState<any>(null);
  const [cantidad, setCantidad] = useState<number>(1);
  const [unidadDerivadaId, setUnidadDerivadaId] = useState<number | null>(null);
  const [precioVenta, setPrecioVenta] = useState<number>(0);
  const [searchValue, setSearchValue] = useState<string>("");
  const { notification } = App.useApp();
  const almacen_id = useStoreAlmacen((store) => store.almacen_id);

  const plantilla = motivoCodigo ? PLANTILLAS_ITEMS[motivoCodigo] : null;

  const handleAgregarProducto = () => {
    if (!selectedProducto) {
      return notification.error({ message: "Seleccione un producto" });
    }
    if (!cantidad || cantidad <= 0) {
      return notification.error({ message: "Ingrese una cantidad válida" });
    }
    if (!unidadDerivadaId) {
      return notification.error({ message: "Seleccione una unidad de medida" });
    }
    if (!precioVenta || precioVenta <= 0) {
      return notification.error({ message: "Ingrese un precio válido" });
    }

    const producto_en_almacen = selectedProducto.producto_en_almacenes?.find(
      (item: any) => item.almacen_id === almacen_id
    );
    const unidad_derivada = producto_en_almacen?.unidades_derivadas?.find(
      (item: any) => item.unidad_derivada.id === unidadDerivadaId
    );

    const nuevoItem = {
      producto_id: selectedProducto.id,
      producto_name: selectedProducto.name,
      producto_codigo: selectedProducto.cod_producto,
      marca_name: selectedProducto.marca?.name || "",
      unidad_derivada_id: unidadDerivadaId,
      unidad_derivada_name: unidad_derivada?.unidad_derivada.name || "",
      unidad_derivada_factor: Number(unidad_derivada?.factor || 1),
      codigo: selectedProducto.cod_producto || "",
      descripcion: selectedProducto.name || "",
      unidad_medida: unidad_derivada?.unidad_derivada.codigo_sunat || "NIU",
      cantidad: cantidad,
      precio_unitario: precioVenta,
      precio_venta: precioVenta,
      subtotal: cantidad * precioVenta,
    };

    onAdd(nuevoItem);
    resetProductoForm();
    notification.success({ message: "Producto agregado" });
  };

  const handleAgregarConcepto = async () => {
    try {
      const values = await form.validateFields();
      
      const subtotal = values.cantidad * values.precio_unitario;
      
      const nuevoItem = {
        codigo: values.codigo,
        descripcion: values.descripcion,
        unidad_medida: values.unidad_medida || "NIU",
        cantidad: values.cantidad,
        precio_unitario: values.precio_unitario,
        precio_venta: values.precio_unitario,
        subtotal: subtotal,
      };

      onAdd(nuevoItem);
      form.resetFields();
      notification.success({ message: "Concepto agregado" });
    } catch (error) {
      console.error("Error al validar formulario:", error);
    }
  };

  const resetProductoForm = () => {
    setSelectedProducto(null);
    setCantidad(1);
    setUnidadDerivadaId(null);
    setPrecioVenta(0);
  };

  const handleCancel = () => {
    form.resetFields();
    resetProductoForm();
    setSearchValue("");
    setActiveTab("productos");
    onClose();
  };

  const handleProductoSelect = (producto: any) => {
    setSelectedProducto(producto);
    
    // Auto-seleccionar primera unidad derivada y su precio
    const producto_en_almacen = producto.producto_en_almacenes?.find(
      (item: any) => item.almacen_id === almacen_id
    );
    const primeraUnidad = producto_en_almacen?.unidades_derivadas?.[0];
    
    if (primeraUnidad) {
      setUnidadDerivadaId(primeraUnidad.unidad_derivada.id);
      setPrecioVenta(Number(primeraUnidad.precio_publico || 0));
    }
  };

  const producto_en_almacen = selectedProducto?.producto_en_almacenes?.find(
    (item: any) => item.almacen_id === almacen_id
  );
  const unidades_derivadas = producto_en_almacen?.unidades_derivadas || [];

  const items = [
    {
      key: "productos",
      label: (
        <span className="flex items-center gap-2">
          <FaBoxes /> Buscar Productos
        </span>
      ),
      children: (
        <div className="space-y-4">
          <div className="mb-3">
            <Input
              placeholder="Buscar por código o nombre..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              allowClear
            />
          </div>

          <div className="h-[300px]">
            <TableProductoSearch
              value={searchValue}
              tipoBusqueda={TipoBusquedaProducto.CODIGO_DESCRIPCION}
              onRowDoubleClicked={({ data }) => data && handleProductoSelect(data)}
              isVisible={open && activeTab === "productos"}
              selectionColor="#ea580c"
            />
          </div>

          {selectedProducto && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
              <div className="font-semibold text-gray-700">
                Producto seleccionado: {selectedProducto.name}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Cantidad:</label>
                  <InputNumber
                    className="w-full"
                    min={0.01}
                    precision={2}
                    value={cantidad}
                    onChange={(value) => setCantidad(value || 1)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Unidad:</label>
                  <Select
                    className="w-full"
                    value={unidadDerivadaId}
                    onChange={(value) => {
                      setUnidadDerivadaId(value);
                      const unidad = unidades_derivadas.find(
                        (u: any) => u.unidad_derivada.id === value
                      );
                      if (unidad) {
                        setPrecioVenta(Number(unidad.precio_publico || 0));
                      }
                    }}
                    options={unidades_derivadas.map((u: any) => ({
                      value: u.unidad_derivada.id,
                      label: u.unidad_derivada.name,
                    }))}
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">Precio Unitario (con IGV):</label>
                  <InputNumber
                    className="w-full"
                    min={0.01}
                    precision={2}
                    prefix="S/."
                    value={precioVenta}
                    onChange={(value) => setPrecioVenta(value || 0)}
                  />
                </div>
              </div>

              <Alert
                message={
                  <div className="flex justify-between items-center">
                    <span>Subtotal (con IGV):</span>
                    <span className="font-bold text-lg">
                      S/. {(cantidad * precioVenta).toFixed(2)}
                    </span>
                  </div>
                }
                type="success"
                showIcon={false}
              />

              <button
                onClick={handleAgregarProducto}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Agregar Producto
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "conceptos",
      label: (
        <span className="flex items-center gap-2">
          <FaFileInvoiceDollar /> Agregar Concepto
        </span>
      ),
      children: (
        <div className="space-y-4">
          {plantilla && (
            <Alert
              message={`Plantilla para: ${plantilla.descripcion}`}
              description="Los campos se han prellenado con valores sugeridos. Puede modificarlos según necesite."
              type="info"
              showIcon
            />
          )}

          <Form
            form={form}
            layout="vertical"
            initialValues={{
              codigo: plantilla?.codigo || "",
              descripcion: plantilla?.descripcion || "",
              unidad_medida: "NIU",
              cantidad: 1,
            }}
          >
            <Form.Item
              label="Código"
              name="codigo"
              rules={[{ required: true, message: "Ingrese el código del ítem" }]}
            >
              <Input placeholder={plantilla?.codigo || "Ej: INT-001"} maxLength={20} />
            </Form.Item>

            <Form.Item
              label="Descripción"
              name="descripcion"
              rules={[
                { required: true, message: "Ingrese la descripción del ítem" },
                { min: 10, message: "La descripción debe tener al menos 10 caracteres" },
              ]}
            >
              <Input.TextArea
                placeholder={plantilla?.placeholder || "Describa el concepto a cobrar"}
                rows={3}
                maxLength={500}
                showCount
              />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                label="Unidad de Medida"
                name="unidad_medida"
                rules={[{ required: true, message: "Seleccione la unidad" }]}
              >
                <Select
                  options={[
                    { value: "NIU", label: "NIU - Unidad (Servicios)" },
                    { value: "ZZ", label: "ZZ - Servicio" },
                    { value: "MON", label: "MON - Monto" },
                  ]}
                />
              </Form.Item>

              <Form.Item
                label="Cantidad"
                name="cantidad"
                rules={[
                  { required: true, message: "Ingrese la cantidad" },
                  { type: "number", min: 0.01, message: "Debe ser mayor a 0" },
                ]}
              >
                <InputNumber className="w-full" min={0.01} precision={2} placeholder="1" />
              </Form.Item>
            </div>

            <Form.Item
              label="Precio Unitario (con IGV)"
              name="precio_unitario"
              rules={[
                { required: true, message: "Ingrese el precio" },
                { type: "number", min: 0.01, message: "Debe ser mayor a 0" },
              ]}
            >
              <InputNumber
                className="w-full"
                min={0.01}
                precision={2}
                prefix="S/."
                placeholder="0.00"
              />
            </Form.Item>

            <Form.Item noStyle shouldUpdate>
              {() => {
                const cantidad = form.getFieldValue("cantidad") || 0;
                const precioUnitario = form.getFieldValue("precio_unitario") || 0;
                const subtotal = cantidad * precioUnitario;

                return subtotal > 0 ? (
                  <Alert
                    message={
                      <div className="flex justify-between items-center">
                        <span>Subtotal (con IGV):</span>
                        <span className="font-bold text-lg">S/. {subtotal.toFixed(2)}</span>
                      </div>
                    }
                    type="success"
                    showIcon={false}
                  />
                ) : null;
              }}
            </Form.Item>
          </Form>

          <button
            onClick={handleAgregarConcepto}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Agregar Concepto
          </button>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <span className="text-orange-600 text-xl">+</span>
          <span>Agregar Ítem a la Nota de Débito</span>
        </div>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={800}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
        className="mt-4"
      />
    </Modal>
  );
}
