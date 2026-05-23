"use client";

import { FormInstance, Form, Input, InputNumber, Select, DatePicker, Switch } from "antd";
import type { FormCreateVale } from "../others/body-crear-vale";
import {
  FaGift,
  FaCalendar,
  FaHashtag,
  FaPercentage,
  FaDollarSign,
  FaBoxOpen,
  FaUsers,
} from "react-icons/fa";
import dayjs from "dayjs";
import SelectProductos from "~/app/_components/form/selects/select-productos";
import SelectCategorias from "~/app/_components/form/selects/select-categorias";
import {
  TIPO_PROMOCION_FORM_OPTIONS,
  MODALIDAD_FORM_OPTIONS,
  DESCUENTO_TIPO_OPTIONS,
} from "../../../_constants/form-vale-options";

const { TextArea } = Input;

// ============= COMPONENTS =============

interface SeccionBasicaProps {
  form: FormInstance<FormCreateVale>;
}

function SeccionBasica({ form }: SeccionBasicaProps) {
  return (
    <div className="border-l-4 border-amber-500 pl-3">
      <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <FaGift className="text-amber-600" />
        Información Básica
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Form.Item
          name="nombre"
          label="Nombre de la Promoción"
          rules={[{ required: true, message: "El nombre es requerido" }]}
        >
          <Input
            placeholder="Ej: Descuento 10% por 55 unidades"
            prefix={<FaGift className="text-amber-600 mr-1" />}
          />
        </Form.Item>

        <Form.Item
          name="tipo_promocion"
          label="Tipo de Promoción"
          rules={[{ required: true, message: "Seleccione el tipo" }]}
        >
          <Select options={TIPO_PROMOCION_FORM_OPTIONS} />
        </Form.Item>
      </div>

      <Form.Item name="descripcion" label="Descripción (opcional)">
        <TextArea rows={3} placeholder="Describe los detalles de la promoción..." maxLength={500} showCount />
      </Form.Item>
    </div>
  );
}

interface SeccionCondicionesProps {
  form: FormInstance<FormCreateVale>;
  modalidad: string;
}

function SeccionCondiciones({ form, modalidad }: SeccionCondicionesProps) {
  return (
    <div className="border-l-4 border-blue-500 pl-3">
      <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <FaHashtag className="text-blue-600" />
        Condiciones de Activación
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Form.Item
          name="modalidad"
          label="Modalidad"
          rules={[{ required: true, message: "Seleccione la modalidad" }]}
        >
          <Select options={MODALIDAD_FORM_OPTIONS} />
        </Form.Item>

        <Form.Item
          name="cantidad_minima"
          label="Precio Mínimo (S/)"
          rules={[
            { required: true, message: "El precio mínimo es requerido" },
            { type: "number", min: 0.01, message: "Debe ser mayor a 0" },
          ]}
        >
          <InputNumber
            className="w-full"
            placeholder="Ej: 100.00"
            min={0.01}
            step={0.01}
            precision={2}
            prefix={<FaDollarSign className="text-blue-600" />}
          />
        </Form.Item>
      </div>

      {(modalidad === "POR_CATEGORIA" || modalidad === "MIXTO") && (
        <Form.Item
          name="categoria_ids"
          label="Categorías Aplicables"
          rules={[{ required: true, message: "Seleccione al menos una categoría" }]}
        >
          <SelectCategorias mode="multiple" placeholder="Seleccione las categorías..." showButtonCreate />
        </Form.Item>
      )}

      {(modalidad === "POR_PRODUCTOS" || modalidad === "MIXTO") && (
        <Form.Item
          name="producto_ids"
          label="Productos Aplicables"
          rules={[{ required: true, message: "Seleccione al menos un producto" }]}
        >
          <SelectProductos mode="multiple" placeholder="Busque y seleccione productos..." className="w-full" withSearch withTipoBusqueda />
        </Form.Item>
      )}
    </div>
  );
}

interface SeccionBeneficioProps {
  form: FormInstance<FormCreateVale>;
  tipoPromocion: string;
  descuentoTipo: string;
}

function SeccionBeneficio({ form, tipoPromocion, descuentoTipo }: SeccionBeneficioProps) {
  const isDescuento = tipoPromocion === "DESCUENTO_MISMA_COMPRA" || tipoPromocion === "DESCUENTO_PROXIMA_COMPRA";
  const isProductoGratis = tipoPromocion === "PRODUCTO_GRATIS";
  const isDosPorUno = tipoPromocion === "DOS_POR_UNO";
  const isSorteo = tipoPromocion === "SORTEO";

  return (
    <div className="border-l-4 border-green-500 pl-3">
      <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <FaGift className="text-green-600" />
        Beneficio de la Promoción
      </h3>

      {/* DESCUENTO_MISMA_COMPRA | DESCUENTO_PROXIMA_COMPRA */}
      {isDescuento && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Form.Item
            name="descuento_tipo"
            label="Tipo de Descuento"
            rules={[{ required: true, message: "Seleccione el tipo" }]}
          >
            <Select options={DESCUENTO_TIPO_OPTIONS} />
          </Form.Item>

          <Form.Item
            name="descuento_valor"
            label={descuentoTipo === "PORCENTAJE" ? "Porcentaje (%)" : "Monto (S/)"}
            rules={[
              { required: true, message: "El valor es requerido" },
              { type: "number", min: 0, message: "Debe ser mayor o igual a 0" },
            ]}
          >
            <InputNumber
              className="w-full"
              placeholder={descuentoTipo === "PORCENTAJE" ? "Ej: 10" : "Ej: 50.00"}
              min={0}
              step={descuentoTipo === "PORCENTAJE" ? 1 : 0.01}
              prefix={descuentoTipo === "PORCENTAJE" ? <FaPercentage className="text-green-600" /> : <FaDollarSign className="text-green-600" />}
            />
          </Form.Item>
        </div>
      )}

      {/* DESCUENTO_PROXIMA_COMPRA — fecha validez */}
      {tipoPromocion === "DESCUENTO_PROXIMA_COMPRA" && (
        <Form.Item
          name="fecha_validez_vale"
          label="Válido hasta"
          rules={[{ required: true, message: "La fecha de validez es requerida" }]}
        >
          <DatePicker
            className="w-full"
            placeholder="Seleccione fecha límite"
            format="DD/MM/YYYY"
            disabledDate={(current) => current && current < dayjs().endOf("day")}
            prefix={<FaCalendar className="text-green-600" />}
          />
        </Form.Item>
      )}

      {/* PRODUCTO_GRATIS */}
      {isProductoGratis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Form.Item
            name="producto_gratis_id"
            label="Producto a Regalar"
            rules={[{ required: true, message: "Seleccione el producto" }]}
          >
            <SelectProductos placeholder="Busque el producto a regalar..." className="w-full" withSearch withTipoBusqueda />
          </Form.Item>

          <Form.Item
            name="cantidad_producto_gratis"
            label="Cantidad a Regalar"
          >
            <InputNumber className="w-full" placeholder="1" min={0.001} step={1} />
          </Form.Item>
        </div>
      )}

      {/* DOS_POR_UNO */}
      {isDosPorUno && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">
            <strong>2x1:</strong> El cliente compra 1 unidad del producto y se lleva 2 (paga 1, lleva 2).
            Define la modalidad y productos/categorías en la sección de condiciones.
          </p>
          <div className="mt-3">
            <Form.Item
              name="cantidad_producto_gratis"
              label="Cantidad extra gratis"
              tooltip="1 = compra 1 lleva 2, 2 = compra 1 lleva 3"
            >
              <InputNumber className="w-full" placeholder="1" min={1} step={1} defaultValue={1} />
            </Form.Item>
          </div>
        </div>
      )}

      {/* SORTEO */}
      {isSorteo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            Para sorteos, la descripción debe incluir los detalles del premio y las condiciones de participación.
          </p>
        </div>
      )}
    </div>
  );
}

interface SeccionVigenciaProps {
  form: FormInstance<FormCreateVale>;
}

function SeccionVigencia({ form }: SeccionVigenciaProps) {
  return (
    <div className="border-l-4 border-purple-500 pl-3">
      <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <FaCalendar className="text-purple-600" />
        Vigencia
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Form.Item
          name="fecha_inicio"
          label="Fecha de Inicio"
          rules={[{ required: true, message: "La fecha de inicio es requerida" }]}
        >
          <DatePicker className="w-full" format="DD/MM/YYYY" disabledDate={(current) => current && current < dayjs().startOf("day")} />
        </Form.Item>

        <Form.Item name="fecha_fin" label="Fecha de Fin (opcional)">
          <DatePicker
            className="w-full"
            format="DD/MM/YYYY"
            placeholder="Sin fecha de fin"
            disabledDate={(current) => {
              const fechaInicio = form.getFieldValue("fecha_inicio");
              return current && fechaInicio && current < fechaInicio;
            }}
          />
        </Form.Item>
      </div>
    </div>
  );
}

interface SeccionRestriccionesProps {
  usaLimiteCliente: boolean;
  usaLimiteStock: boolean;
}

function SeccionRestricciones({ usaLimiteCliente, usaLimiteStock }: SeccionRestriccionesProps) {
  return (
    <div className="border-l-4 border-orange-500 pl-3">
      <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <FaUsers className="text-orange-600" />
        Restricciones (opcional)
      </h3>

      <div className="space-y-4">
        {/* Límite por cliente */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Limitar usos por cliente</label>
            <Form.Item name="usa_limite_por_cliente" valuePropName="checked" noStyle>
              <Switch />
            </Form.Item>
          </div>
          {usaLimiteCliente && (
            <Form.Item name="limite_usos_cliente" rules={[{ required: true, message: "Ingrese el límite" }]} className="mb-0">
              <InputNumber className="w-full" placeholder="Máximo de usos por cliente" min={1} />
            </Form.Item>
          )}
        </div>

        {/* Límite de stock */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Limitar stock de promociones</label>
            <Form.Item name="usa_limite_stock" valuePropName="checked" noStyle>
              <Switch />
            </Form.Item>
          </div>
          {usaLimiteStock && (
            <Form.Item name="stock_disponible" rules={[{ required: true, message: "Ingrese el stock" }]} className="mb-0">
              <InputNumber className="w-full" placeholder="Cantidad de promociones disponibles" min={1} />
            </Form.Item>
          )}
        </div>
      </div>
    </div>
  );
}

function SeccionPrecios() {
  return (
    <div className="border-l-4 border-indigo-500 pl-3">
      <h3 className="text-base font-semibold text-gray-800 mb-3">Aplicable a Precios</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { name: "aplica_precio_publico", label: "Precio Público" },
          { name: "aplica_precio_especial", label: "Precio Especial" },
          { name: "aplica_precio_minimo", label: "Precio Mínimo" },
          { name: "aplica_precio_ultimo", label: "Precio Final" },
        ].map(({ name, label }) => (
          <div key={name} className="flex items-center gap-2">
            <Form.Item name={name as keyof FormCreateVale} valuePropName="checked" noStyle>
              <Switch />
            </Form.Item>
            <span className="text-sm">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============= MAIN COMPONENT =============

export default function FormCrearVale({ form }: { form: FormInstance<FormCreateVale> }) {
  const tipoPromocion = Form.useWatch("tipo_promocion", form) || "DESCUENTO_MISMA_COMPRA";
  const modalidad = Form.useWatch("modalidad", form) || "CANTIDAD_MINIMA";
  const descuentoTipo = Form.useWatch("descuento_tipo", form) || "PORCENTAJE";
  const usaLimiteCliente = Form.useWatch("usa_limite_por_cliente", form) || false;
  const usaLimiteStock = Form.useWatch("usa_limite_stock", form) || false;

  return (
    <div className="space-y-4">
      <SeccionBasica form={form} />
      <SeccionCondiciones form={form} modalidad={modalidad} />
      <SeccionBeneficio form={form} tipoPromocion={tipoPromocion} descuentoTipo={descuentoTipo} />
      <SeccionVigencia form={form} />
      <SeccionRestricciones usaLimiteCliente={usaLimiteCliente} usaLimiteStock={usaLimiteStock} />
      <SeccionPrecios />
    </div>
  );
}