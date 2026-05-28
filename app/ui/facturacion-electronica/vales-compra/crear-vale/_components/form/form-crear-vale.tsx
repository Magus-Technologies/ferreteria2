"use client";

import { FormInstance, Form, Input, InputNumber, Select, DatePicker, Switch, Radio } from "antd";
import { useEffect, useState } from "react";
import type { FormCreateVale } from "../others/body-crear-vale";
import {
  FaGift,
  FaCalendar,
  FaHashtag,
  FaPercentage,
  FaDollarSign,
  FaUsers,
  FaClock,
  FaFilter,
  FaTrophy,
} from "react-icons/fa";
import dayjs from "dayjs";
import SelectProductos from "~/app/_components/form/selects/select-productos";
import SelectCategorias from "~/app/_components/form/selects/select-categorias";
import {
  MOMENTO_APLICACION_OPTIONS,
  TIPO_BENEFICIO_OPTIONS,
  MODALIDAD_FORM_OPTIONS,
  DESCUENTO_TIPO_OPTIONS,
  derivarTipoPromocion,
  beneficiosValidosParaMomento,
  type TipoBeneficio,
  type MomentoAplicacion,
} from "../../../_constants/form-vale-options";

const { TextArea } = Input;

// ============= COMPONENTS =============

interface SeccionBasicaProps {
  form: FormInstance<FormCreateVale>;
}

function SeccionBasica({ form }: SeccionBasicaProps) {
  return (
    <div className="border-l-4 border-amber-500 pl-3 space-y-4">
      <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
        <FaGift className="text-amber-600" />
        Información Básica
      </h3>

      <Form.Item
        name="nombre"
        label="Nombre de la Promoción"
        rules={[{ required: true, message: "El nombre es requerido" }]}
      >
        <Input
          placeholder="Ej: Descuento 10% por compras mayores a S/ 500"
          prefix={<FaGift className="text-amber-600 mr-1" />}
        />
      </Form.Item>

      {/* Campo oculto: tipo_promocion derivado (se envía al backend) */}
      <Form.Item name="tipo_promocion" hidden rules={[{ required: true }]}>
        <Input type="hidden" />
      </Form.Item>

      {/* PASO 1 — ¿CUÁNDO SE APLICA? */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-amber-600 text-white text-xs font-bold rounded-full px-2 py-0.5">PASO 1</span>
          <span className="text-sm font-semibold text-gray-800 flex items-center gap-1">
            <FaClock className="text-amber-600" /> ¿Cuándo se aplica el beneficio?
          </span>
        </div>
        <Form.Item
          name="momento_aplicacion"
          rules={[{ required: true, message: "Seleccione cuándo se aplica" }]}
          className="!mb-0"
        >
          <Radio.Group className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {MOMENTO_APLICACION_OPTIONS.map((opt) => (
                <Radio.Button key={opt.value} value={opt.value} className="!h-auto !whitespace-normal !text-left !py-2">
                  <div>
                    <div className="font-semibold">{opt.label}</div>
                    <div className="text-xs text-gray-500">{opt.description}</div>
                  </div>
                </Radio.Button>
              ))}
            </div>
          </Radio.Group>
        </Form.Item>
      </div>

      <Form.Item name="descripcion" label="Descripción (opcional)">
        <TextArea rows={3} placeholder="Describe los detalles de la promoción..." maxLength={500} showCount />
      </Form.Item>
    </div>
  );
}

type TipoUmbral = 'MONTO' | 'CANTIDAD';

interface SeccionUmbralProps {
  form: FormInstance<FormCreateVale>;
  momento: string;
  tipoUmbral: TipoUmbral | null;
  setTipoUmbral: (t: TipoUmbral | null) => void;
}

function SeccionUmbral({ form, momento, tipoUmbral, setTipoUmbral, esDosPorUno }: SeccionUmbralProps & { esDosPorUno?: boolean }) {

  const esMonto = tipoUmbral === 'MONTO';
  const esCantidad = tipoUmbral === 'CANTIDAD';

  // Para 2x1 solo tiene sentido el umbral por cantidad (unidades)
  const mostrarSoloCantidad = esDosPorUno;

  return (
    <div className="border-l-4 border-blue-500 pl-3">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-blue-600 text-white text-xs font-bold rounded-full px-2 py-0.5">PASO 2</span>
          <span className="text-sm font-semibold text-gray-800 flex items-center gap-1">
            <FaHashtag className="text-blue-600" /> ¿Cuál es el umbral de activación?
          </span>
        </div>
        <div className="text-xs text-gray-600 mb-3">
          Define la compra mínima que el cliente debe alcanzar para activar la promoción.
          {esDosPorUno && <strong> Para 2x1, ingresa las unidades que debe comprar.</strong>}
        </div>

        {mostrarSoloCantidad ? (
          <Form.Item
            name="cantidad_minima"
            label="Unidades que debe comprar"
            rules={[
              { required: true, message: "La cantidad es requerida" },
              { type: "number", min: 1, message: "Debe ser al menos 1" },
            ]}
          >
            <InputNumber
              className="w-full"
              placeholder="Ej: 2"
              min={1}
              step={1}
              precision={0}
              prefix={<FaHashtag className="text-blue-600" />}
            />
          </Form.Item>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div
                onClick={() => setTipoUmbral('MONTO')}
                className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                  esMonto ? 'border-blue-500 bg-blue-100' : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FaDollarSign className={`text-xl ${esMonto ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <div className="font-semibold">Monto Mínimo (S/)</div>
                    <div className="text-xs text-gray-500">La venta debe superar un monto en soles</div>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setTipoUmbral('CANTIDAD')}
                className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                  esCantidad ? 'border-blue-500 bg-blue-100' : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FaHashtag className={`text-xl ${esCantidad ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <div className="font-semibold">Cantidad Mínima (und.)</div>
                    <div className="text-xs text-gray-500">La venta debe incluir una cantidad de productos</div>
                  </div>
                </div>
              </div>
            </div>

            {esMonto && (
              <Form.Item
                name="cantidad_minima"
                label="Monto Mínimo (S/)"
                rules={[
                  { required: true, message: "El monto mínimo es requerido" },
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
            )}

            {esCantidad && !mostrarSoloCantidad && (
              <Form.Item
                name="cantidad_minima"
                label="Cantidad Mínima (und.)"
                rules={[
                  { required: true, message: "La cantidad mínima es requerida" },
                  { type: "number", min: 1, message: "Debe ser al menos 1" },
                ]}
              >
                <InputNumber
                  className="w-full"
                  placeholder="Ej: 10"
                  min={1}
                  step={1}
                  precision={0}
                  prefix={<FaHashtag className="text-blue-600" />}
                />
              </Form.Item>
            )}

            {!tipoUmbral && !mostrarSoloCantidad && (
              <p className="text-xs text-amber-600">Selecciona una opción para definir el valor</p>
            )}
          </>
        )}

        {momento === "PROXIMA_COMPRA" && (
          <div className="text-xs text-blue-700 mt-2">
            ℹ️ Se generará un código que el cliente canjeará en una venta posterior.
          </div>
        )}
      </div>
    </div>
  );
}

interface SeccionModalidadProps {
  form: FormInstance<FormCreateVale>;
  modalidad: string;
  tipoUmbral: TipoUmbral | null;
}

function SeccionModalidad({ form, modalidad, tipoUmbral }: SeccionModalidadProps) {
  return (
    <div className="border-l-4 border-purple-500 pl-3">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-purple-600 text-white text-xs font-bold rounded-full px-2 py-0.5">PASO 3</span>
          <span className="text-sm font-semibold text-gray-800 flex items-center gap-1">
            <FaFilter className="text-purple-600" /> ¿Sobre qué productos aplica?
          </span>
        </div>
        <Form.Item name="modalidad" label="Modalidad" rules={[{ required: true, message: "Seleccione la modalidad" }]} className="!mb-0">
          <Select options={MODALIDAD_FORM_OPTIONS} placeholder="Seleccione..." />
        </Form.Item>
        {(modalidad === "POR_CATEGORIA" || modalidad === "MIXTO") && (
          <Form.Item name="categoria_ids" label="Categorías Aplicables" rules={[{ required: true, message: "Seleccione al menos una categoría" }]} className="mt-3 !mb-0">
            <SelectCategorias mode="multiple" placeholder="Seleccione las categorías..." showButtonCreate />
          </Form.Item>
        )}
        {(modalidad === "POR_PRODUCTOS" || modalidad === "MIXTO") && (
          <Form.Item name="producto_ids" label="Productos Aplicables" rules={[{ required: true, message: "Seleccione al menos un producto" }]} className="mt-3 !mb-0">
            <SelectProductos mode="multiple" placeholder="Busque y seleccione productos..." className="w-full" withSearch withTipoBusqueda />
          </Form.Item>
        )}
      </div>
    </div>
  );
}

interface SeccionBeneficioProps {
  form: FormInstance<FormCreateVale>;
  tipoPromocion: string;
  descuentoTipo: string;
  momento: MomentoAplicacion;
  esDosPorUno?: boolean;
}

function SeccionBeneficio({ form, tipoPromocion, descuentoTipo, momento, esDosPorUno }: SeccionBeneficioProps) {
  const beneficio = Form.useWatch("tipo_beneficio", form) as TipoBeneficio | undefined;

  useEffect(() => {
    if (!beneficio) return;
    const tipoDerivado = derivarTipoPromocion(momento, beneficio);
    if (form.getFieldValue("tipo_promocion") !== tipoDerivado) {
      form.setFieldValue("tipo_promocion", tipoDerivado);
    }
  }, [momento, beneficio, form]);

  const beneficiosPermitidos = beneficiosValidosParaMomento(momento);
  const opcionesBeneficio = TIPO_BENEFICIO_OPTIONS.map((opt) => ({
    ...opt,
    disabled: !beneficiosPermitidos.includes(opt.value),
  }));

  const isDescuento = tipoPromocion === "DESCUENTO_MISMA_COMPRA" || tipoPromocion === "DESCUENTO_PROXIMA_COMPRA";
  const isProductoGratis = tipoPromocion === "PRODUCTO_GRATIS";
  const isDosPorUno = tipoPromocion === "DOS_POR_UNO";
  const isSorteo = tipoPromocion === "SORTEO";
  const incluyeProductoSorteo = Form.useWatch("sorteo_incluye_producto", form) || false;

  return (
    <div className="border-l-4 border-green-500 pl-3">
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-green-600 text-white text-xs font-bold rounded-full px-2 py-0.5">PASO 4</span>
          <span className="text-sm font-semibold text-gray-800 flex items-center gap-1">
            <FaGift className="text-green-600" /> ¿Qué obtiene el cliente?
          </span>
        </div>
        <Form.Item
          name="tipo_beneficio"
          rules={[{ required: true, message: "Seleccione el beneficio" }]}
          className="!mb-0"
        >
          <Radio.Group className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {opcionesBeneficio.map((opt) => (
                <Radio.Button
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className="!h-auto !whitespace-normal !text-left !py-2"
                >
                  <div>
                    <div className="font-semibold">{opt.label}</div>
                    <div className="text-xs text-gray-500">{opt.description}</div>
                  </div>
                </Radio.Button>
              ))}
            </div>
          </Radio.Group>
        </Form.Item>
      </div>

      {/* Detalles según beneficio */}
      <div className="mt-3 pl-3 border-l-2 border-green-300 space-y-4">
        {/* DESCUENTO (% o S/) */}
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
                { required: true, message: "El valor de descuento es requerido" },
                { type: "number", min: 0, message: "Debe ser mayor o igual a 0" },
                {
                  validator: (_, value) => {
                    if (value == null) return Promise.resolve();
                    if (descuentoTipo === "PORCENTAJE" && value > 100) {
                      return Promise.reject(new Error("El porcentaje no puede ser mayor a 100%"));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                className="w-full"
                placeholder={descuentoTipo === "PORCENTAJE" ? "Ej: 10" : "Ej: 50.00"}
                min={0}
                max={descuentoTipo === "PORCENTAJE" ? 100 : undefined}
                step={descuentoTipo === "PORCENTAJE" ? 1 : 0.01}
                prefix={descuentoTipo === "PORCENTAJE" ? <FaPercentage className="text-green-600" /> : <FaDollarSign className="text-green-600" />}
              />
            </Form.Item>
          </div>
        )}

        {/* PRODUCTO GRATIS */}
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

        {/* 2x1 */}
        {isDosPorUno && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <p className="text-sm text-indigo-700 mb-3">
              <strong>2x1 / 3x1 / 5x1:</strong> Define cuántas unidades debe comprar y cuántas extra recibe gratis.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="cantidad_minima"
                label="Unidades que debe comprar"
                tooltip="Cantidad de unidades que el cliente debe comprar"
                rules={[{ required: true, message: "Requerido" }]}
              >
                <InputNumber
                  className="w-full"
                  placeholder="Ej: 2"
                  min={1}
                  step={1}
                  precision={0}
                  prefix={<FaHashtag className="text-indigo-600" />}
                />
              </Form.Item>
              <Form.Item
                name="cantidad_producto_gratis"
                label="Unidades extra gratis"
                tooltip="Cantidad de unidades extra que recibe gratis"
                rules={[{ required: true, message: "Requerido" }]}
              >
                <InputNumber
                  className="w-full"
                  placeholder="Ej: 1"
                  min={1}
                  step={1}
                  precision={0}
                  prefix={<FaHashtag className="text-indigo-600" />}
                />
              </Form.Item>
            </div>
            <p className="text-xs text-indigo-600 mt-2">
              <strong>Ejemplos:</strong> Comprar 1 + 1 gratis = 2x1. Comprar 2 + 1 gratis = 3x1. Comprar 2 + 3 gratis = 5x1.
            </p>
          </div>
        )}

        {/* SORTEO */}
        {isSorteo && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <FaTrophy className="text-amber-500 text-lg" />
              <p className="text-sm text-amber-700">
                Los clientes que cumplan las condiciones participan automáticamente en el sorteo.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">¿Incluir producto como premio?</label>
              <Form.Item name="sorteo_incluye_producto" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
            </div>

            {incluyeProductoSorteo && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Form.Item
                  name="producto_gratis_id"
                  label="Producto del Sorteo"
                  rules={[{ required: true, message: "Seleccione el producto" }]}
                >
                  <SelectProductos placeholder="Busque el producto del sorteo..." className="w-full" withSearch withTipoBusqueda />
                </Form.Item>

                <Form.Item
                  name="cantidad_producto_gratis"
                  label="Cantidad a Regalar (si gana)"
                >
                  <InputNumber className="w-full" placeholder="1" min={0.001} step={1} defaultValue={1} />
                </Form.Item>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface SeccionVigenciaProps {
  form: FormInstance<FormCreateVale>;
}

function SeccionVigencia({ form }: SeccionVigenciaProps) {
  const momento = Form.useWatch("momento_aplicacion", form) as string | undefined;
  const esFuturo = momento === "PROXIMA_COMPRA";
  return (
    <div className="border-l-4 border-purple-500 pl-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="bg-purple-600 text-white text-xs font-bold rounded-full px-2 py-0.5">PASO 5</span>
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <FaCalendar className="text-purple-600" /> Vigencia
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Form.Item
          name="fecha_inicio"
          label="Fecha de Inicio"
          rules={[{ required: true, message: "La fecha de inicio es requerida" }]}
        >
          <DatePicker className="w-full" format="DD/MM/YYYY" disabledDate={(current) => current && current < dayjs().startOf("day")} />
        </Form.Item>

        <Form.Item
          name="fecha_fin"
          label={esFuturo ? "Fecha de Fin (también caduca el código)" : "Fecha de Fin (opcional)"}
          tooltip={esFuturo
            ? "Define hasta cuándo el cliente puede canjear el código generado en la próxima compra."
            : undefined}
          rules={esFuturo ? [{ required: true, message: "Para vales de próxima compra la fecha de fin define la caducidad del código" }] : undefined}
        >
          <DatePicker
            className="w-full"
            format="DD/MM/YYYY"
            placeholder={esFuturo ? "Caducidad del código" : "Sin fecha de fin"}
            disabledDate={(current) => {
              const fechaInicio = form.getFieldValue("fecha_inicio");
              if (!fechaInicio) return false;
              return current && current.isBefore(dayjs(fechaInicio).startOf("day"));
            }}
          />
        </Form.Item>
      </div>
      {esFuturo && (
        <div className="text-xs text-purple-700 mt-2">
          ℹ️ La fecha de fin se usa también como la caducidad del código que se entrega al cliente.
        </div>
      )}
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
      <div className="flex items-center gap-2 mb-3">
        <span className="bg-orange-600 text-white text-xs font-bold rounded-full px-2 py-0.5">PASO 6</span>
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <FaUsers className="text-orange-600" /> Restricciones (opcional)
        </h3>
      </div>

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
      <div className="flex items-center gap-2 mb-3">
        <span className="bg-indigo-600 text-white text-xs font-bold rounded-full px-2 py-0.5">PASO 7</span>
        <h3 className="text-base font-semibold text-gray-800">Aplicable a Precios</h3>
      </div>
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
  const momento = (Form.useWatch("momento_aplicacion", form) as MomentoAplicacion | undefined) ?? "MISMA_COMPRA";
  const tipoBeneficio = Form.useWatch("tipo_beneficio", form) as string | undefined;
  const tipoPromocion = Form.useWatch("tipo_promocion", form) || "DESCUENTO_MISMA_COMPRA";
  const modalidad = Form.useWatch("modalidad", form) || "CANTIDAD_MINIMA";
  const descuentoTipo = Form.useWatch("descuento_tipo", form) || "PORCENTAJE";
  const usaLimiteCliente = Form.useWatch("usa_limite_por_cliente", form) || false;
  const usaLimiteStock = Form.useWatch("usa_limite_stock", form) || false;
  const [tipoUmbral, setTipoUmbral] = useState<TipoUmbral | null>(null);

  // Para 2x1 se oculta el PASO 2 y toda la config está en PASO 4
  const esDosPorUno = tipoPromocion === "DOS_POR_UNO";

  return (
    <div className="space-y-4">
      <SeccionBasica form={form} />
      {!esDosPorUno && <SeccionUmbral form={form} momento={momento} tipoUmbral={tipoUmbral} setTipoUmbral={setTipoUmbral} esDosPorUno={esDosPorUno} />}
      <SeccionModalidad form={form} modalidad={modalidad} tipoUmbral={tipoUmbral} />
      <SeccionBeneficio form={form} tipoPromocion={tipoPromocion} descuentoTipo={descuentoTipo} momento={momento} esDosPorUno={esDosPorUno} />
      <SeccionVigencia form={form} />
      <SeccionRestricciones usaLimiteCliente={usaLimiteCliente} usaLimiteStock={usaLimiteStock} />
      <SeccionPrecios />
    </div>
  );
}