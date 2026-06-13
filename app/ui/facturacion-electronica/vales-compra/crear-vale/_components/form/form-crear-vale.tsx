"use client";

import { FormInstance, Form, Input, InputNumber, Select, DatePicker, Switch, Radio } from "antd";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStockProductos } from "~/lib/api/vales-compra";
import { productosApiV2 } from "~/lib/api/producto";
import { GetStock } from "~/app/_utils/get-stock";
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
  FaBoxOpen,
} from "react-icons/fa";
import dayjs from "dayjs";
import SelectProductos from "~/app/_components/form/selects/select-productos";
import SelectCategorias from "~/app/_components/form/selects/select-categorias";
import SelectMarcas from "~/app/_components/form/selects/select-marcas";
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

type TipoUmbral = 'MONTO' | 'CANTIDAD' | 'NINGUNO';

interface SeccionUmbralProps {
  form: FormInstance<FormCreateVale>;
  momento: string;
  tipoUmbral: TipoUmbral | null;
  setTipoUmbral: (t: TipoUmbral | null) => void;
}

function SeccionUmbral({ form, momento, tipoUmbral, setTipoUmbral, esDosPorUno }: SeccionUmbralProps & { esDosPorUno?: boolean }) {

  const esMonto = tipoUmbral === 'MONTO';
  const esCantidad = tipoUmbral === 'CANTIDAD';
  const esNinguno = tipoUmbral === 'NINGUNO';

  // En 2x1 (misma compra) se deja "Ninguno" como valor por DEFECTO, solo si aún no se
  // eligió nada. No se fuerza ni se bloquea: las 3 tarjetas siguen normales y clicables.
  useEffect(() => {
    if (esDosPorUno && !tipoUmbral) {
      setTipoUmbral('NINGUNO');
    }
  }, [esDosPorUno, tipoUmbral, setTipoUmbral]);

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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
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

          <div
            onClick={() => setTipoUmbral('NINGUNO')}
            className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
              esNinguno ? 'border-blue-500 bg-blue-100' : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FaFilter className={`text-xl ${esNinguno ? 'text-blue-600' : 'text-gray-400'}`} />
              <div>
                <div className="font-semibold">Ninguno</div>
                <div className="text-xs text-gray-500">Sin compra mínima: se activa siempre</div>
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

        {esCantidad && (
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

        {esNinguno && (
          <p className="text-xs text-gray-600">
            Sin compra mínima: la promoción se activa siempre que se cumpla la condición del Paso 3.
          </p>
        )}

        {!tipoUmbral && (
          <p className="text-xs text-amber-600">Selecciona una opción para definir el valor</p>
        )}

        {momento === "PROXIMA_COMPRA" && (
          <div className="text-xs text-blue-700 mt-2">
            ℹ️ Al cumplirse estas condiciones se generará un código para canjear en una compra posterior (la duración se define en el PASO 5 · Vigencia).
          </div>
        )}
      </div>
    </div>
  );
}

// Opción precargada {value,label} para que los SelectProductos (que solo cargan
// opciones al buscar) muestren NOMBRES en vez de ids al editar un vale.
type OpcionProducto = { value: number; label: string };

interface SeccionModalidadProps {
  form: FormInstance<FormCreateVale>;
  modalidad: string;
  tipoUmbral: TipoUmbral | null;
  productosDefault?: OpcionProducto[];
}

function SeccionModalidad({ form, modalidad, tipoUmbral, productosDefault }: SeccionModalidadProps) {
  const categoriaIdsWatch = Form.useWatch("categoria_ids", form) as number[] | undefined;
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
          <Radio.Group className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {MODALIDAD_FORM_OPTIONS.map((opt) => (
                <Radio.Button key={opt.value} value={opt.value} className="!h-auto !whitespace-normal !text-left !py-2">
                  <div>
                    <div className="font-semibold">{opt.label}</div>
                    {opt.description && <div className="text-xs text-gray-500">{opt.description}</div>}
                  </div>
                </Radio.Button>
              ))}
            </div>
          </Radio.Group>
        </Form.Item>
        {(modalidad === "POR_CATEGORIA" || modalidad === "MIXTO") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <Form.Item name="categoria_ids" label="Categorías Aplicables" rules={[{ required: true, message: "Seleccione al menos una categoría" }]} className="!mb-0">
              <SelectCategorias mode="multiple" placeholder="Seleccione las categorías..." showButtonCreate />
            </Form.Item>
            <Form.Item name="marca_ids" label="Marcas (opcional)" tooltip="Limita la promoción a estas marcas dentro de la(s) categoría(s). Vacío = todas las marcas." className="!mb-0">
              <SelectMarcas mode="multiple" placeholder="Todas las marcas..." categoriaIds={categoriaIdsWatch} />
            </Form.Item>
          </div>
        )}
        {(modalidad === "POR_PRODUCTOS" || modalidad === "MIXTO") && (
          <Form.Item name="producto_ids" label="Productos Aplicables" rules={[{ required: true, message: "Seleccione al menos un producto" }]} className="mt-3 !mb-0">
            <SelectProductos mode="multiple" placeholder="Escriba y presione Enter o 🔍 para buscar productos..." className="w-full" withSearch optionsDefault={productosDefault} styles={{ popup: { root: { display: "none" } } }} />
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
  descuentoProductosDefault?: OpcionProducto[];
  productoGratisDefault?: OpcionProducto[];
}

function SeccionBeneficio({ form, tipoPromocion, descuentoTipo, momento, esDosPorUno, descuentoProductosDefault, productoGratisDefault }: SeccionBeneficioProps) {
  const beneficio = Form.useWatch("tipo_beneficio", form) as TipoBeneficio | undefined;
  const descuentoAlcance = Form.useWatch("descuento_alcance", form) as string | undefined;
  const descuentoCategoriaIdsWatch = Form.useWatch("descuento_categoria_ids", form) as number[] | undefined;

  const beneficiosPermitidos = beneficiosValidosParaMomento(momento);

  useEffect(() => {
    if (!beneficio) return;
    // Si el beneficio actual ya no es válido para el momento (ej. SORTEO al pasar a
    // PROXIMA_COMPRA), limpiarlo para que el usuario elija uno permitido.
    if (!beneficiosPermitidos.includes(beneficio)) {
      form.setFieldValue("tipo_beneficio", undefined);
      form.setFieldValue("tipo_promocion", undefined);
      return;
    }
    const tipoDerivado = derivarTipoPromocion(momento, beneficio);
    if (form.getFieldValue("tipo_promocion") !== tipoDerivado) {
      form.setFieldValue("tipo_promocion", tipoDerivado);
    }
  }, [momento, beneficio, form, beneficiosPermitidos]);

  // Para PROXIMA_COMPRA se OCULTA SORTEO (no solo se deshabilita).
  const opcionesBeneficio = TIPO_BENEFICIO_OPTIONS.filter((opt) =>
    beneficiosPermitidos.includes(opt.value),
  );

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
          <>
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

          {/* DESTINO del descuento (a qué cae el % o S/), independiente de la condición del PASO 3 */}
          <Form.Item
            name="descuento_alcance"
            label="¿A qué se le aplica el descuento?"
            rules={[{ required: true, message: "Elige a qué aplica el descuento" }]}
            className="!mb-2"
          >
            <Radio.Group className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Radio.Button value="VENTA" className="!h-auto !whitespace-normal !text-left !py-2">
                  <div className="font-semibold">🛒 Toda la venta</div>
                  <div className="text-xs text-gray-500">Reduce el total completo</div>
                </Radio.Button>
                <Radio.Button value="PRODUCTOS" className="!h-auto !whitespace-normal !text-left !py-2">
                  <div className="font-semibold">🏷️ Productos</div>
                  <div className="text-xs text-gray-500">Solo ciertos productos</div>
                </Radio.Button>
                <Radio.Button value="CATEGORIAS" className="!h-auto !whitespace-normal !text-left !py-2">
                  <div className="font-semibold">📁 Categoría</div>
                  <div className="text-xs text-gray-500">Solo ciertas categorías</div>
                </Radio.Button>
              </div>
            </Radio.Group>
          </Form.Item>

          {descuentoAlcance === "PRODUCTOS" && (
            <Form.Item
              name="descuento_producto_ids"
              label="Productos a los que cae el descuento"
              rules={[{ required: true, message: "Selecciona al menos un producto" }]}
              className="!mb-0"
            >
              <SelectProductos mode="multiple" placeholder="Busca y selecciona productos..." className="w-full" withSearch optionsDefault={descuentoProductosDefault} />
            </Form.Item>
          )}

          {descuentoAlcance === "CATEGORIAS" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Form.Item
                name="descuento_categoria_ids"
                label="Categorías a las que cae el descuento"
                rules={[{ required: true, message: "Selecciona al menos una categoría" }]}
                className="!mb-0"
              >
                <SelectCategorias mode="multiple" placeholder="Selecciona las categorías..." />
              </Form.Item>
              <Form.Item
                name="descuento_marca_ids"
                label="Marcas (opcional)"
                tooltip="Limita el descuento a estas marcas dentro de la(s) categoría(s). Vacío = todas las marcas."
                className="!mb-0"
              >
                <SelectMarcas mode="multiple" placeholder="Todas las marcas..." categoriaIds={descuentoCategoriaIdsWatch} />
              </Form.Item>
            </div>
          )}
          </>
        )}

        {/* PRODUCTO GRATIS */}
        {isProductoGratis && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Form.Item
              name="producto_gratis_id"
              label="Producto a Regalar"
              rules={[{ required: true, message: "Seleccione el producto" }]}
            >
              <SelectProductos placeholder="Busque el producto a regalar..." className="w-full" withSearch searchOnEnterOnly optionsDefault={productoGratisDefault} />
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
              <strong>2x1 / 3x1:</strong> Define cuántas unidades debe comprar y cuántas de esas salen gratis (se descuenta la más barata). El cliente paga la diferencia.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                // En próxima compra el 2x1 es la RECOMPENSA, así que sus unidades van en
                // un campo aparte; cantidad_minima queda para la condición del PASO 2.
                name={momento === "PROXIMA_COMPRA" ? "dos_por_uno_cantidad_compra" : "cantidad_minima"}
                label="Unidades que debe comprar"
                tooltip="Cantidad de unidades que el cliente debe comprar para el 2x1"
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
                label="Unidades gratis (de las compradas)"
                tooltip="De las unidades compradas, cuántas salen gratis (se descuentan)"
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
            <div className="mt-4">
              <Form.Item
                name="producto_gratis_id"
                label={
                  momento === "PROXIMA_COMPRA"
                    ? "Producto para el 2x1 (en la próxima compra)"
                    : "Producto al que aplica el 2x1"
                }
                rules={[{ required: true, message: "Seleccione el producto al que aplicará el 2x1" }]}
              >
                <SelectProductos placeholder="Busque el producto para el 2x1..." className="w-full" withSearch searchOnEnterOnly optionsDefault={productoGratisDefault} />
              </Form.Item>
            </div>
            <p className="text-xs text-indigo-600 mt-2">
              <strong>Ejemplos:</strong> Compra 2, 1 gratis → paga 1 (2x1). Compra 4, 1 gratis → paga 3. Compra 3, 2 gratis → paga 1 (3x1).
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
                  <SelectProductos placeholder="Busque el producto del sorteo..." className="w-full" withSearch searchOnEnterOnly optionsDefault={productoGratisDefault} />
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

      {esFuturo && (
        <div className="text-xs text-purple-800 mb-3 bg-purple-50 border border-purple-200 rounded-lg p-2 leading-relaxed">
          Para vales de próxima compra hay <b>dos tiempos distintos</b>:
          <br />① <b>Vigencia de la promoción</b>: período en que las compras generan códigos.
          <br />② <b>Fecha límite del código</b>: hasta qué fecha el cliente puede canjear el código que se ganó.
        </div>
      )}

      {/* ① Vigencia de la promoción (cuándo el vale genera/aplica) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Form.Item
          name="fecha_inicio"
          label={esFuturo ? "① Vigencia — desde" : "Fecha de Inicio"}
          rules={[{ required: true, message: "La fecha de inicio es requerida" }]}
        >
          <DatePicker className="w-full" format="DD/MM/YYYY" disabledDate={(current) => current && current < dayjs().startOf("day")} />
        </Form.Item>

        <Form.Item
          name="fecha_fin"
          label={esFuturo ? "① Vigencia — hasta (opcional)" : "Fecha de Fin (opcional)"}
          tooltip={esFuturo
            ? "Hasta cuándo la promoción sigue generando códigos. Vacío = sin límite."
            : undefined}
        >
          <DatePicker
            className="w-full"
            format="DD/MM/YYYY"
            placeholder="Sin fecha de fin"
            disabledDate={(current) => {
              const fechaInicio = form.getFieldValue("fecha_inicio");
              if (!fechaInicio) return false;
              return current && current.isBefore(dayjs(fechaInicio).startOf("day"));
            }}
          />
        </Form.Item>
      </div>

      {/* ② Fecha límite del código entregado al cliente (solo próxima compra) */}
      {esFuturo && (
        <Form.Item
          name="fecha_validez_vale"
          label="② Fecha límite del código entregado al cliente"
          tooltip="Hasta qué fecha el cliente puede canjear el código. Debe ser posterior a la vigencia de la promoción (①)."
          rules={[
            { required: true, message: "Indica la fecha límite del código" },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const limite = form.getFieldValue("fecha_fin") || form.getFieldValue("fecha_inicio");
                if (limite && !dayjs(value).isAfter(dayjs(limite).startOf("day"))) {
                  return Promise.reject(new Error("Debe ser posterior a la Vigencia — hasta (①)"));
                }
                return Promise.resolve();
              },
            },
          ]}
          className="mt-3 !mb-0"
        >
          <DatePicker
            className="w-full"
            format="DD/MM/YYYY"
            placeholder="Fecha de caducidad del código"
            disabledDate={(current) => {
              // Solo se puede escoger DESPUÉS de la vigencia (① hasta, o inicio si no hay fin).
              const limite = form.getFieldValue("fecha_fin") || form.getFieldValue("fecha_inicio");
              if (!limite) return false;
              return current && !current.isAfter(dayjs(limite).startOf("day"));
            }}
          />
        </Form.Item>
      )}
    </div>
  );
}

interface SeccionRestriccionesProps {
  usaLimiteCliente: boolean;
  usaLimiteStock: boolean;
  usaLimiteVenta: boolean;
  esDescuento: boolean;
  stockProductoGratis: { stock: number; unidades_contenidas: number } | null;
}

function SeccionRestricciones({ usaLimiteCliente, usaLimiteStock, usaLimiteVenta, esDescuento, stockProductoGratis }: SeccionRestriccionesProps) {
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
            <div>
              <label className="text-sm font-medium text-gray-700 block">Limitar usos por cliente</label>
              <p className="text-xs text-gray-500 mt-0.5">Cada cliente solo puede beneficiarse de esta promoción un máximo de N veces en total (sumando todas sus compras).</p>
            </div>
            <Form.Item name="usa_limite_por_cliente" valuePropName="checked" noStyle>
              <Switch />
            </Form.Item>
          </div>
          {usaLimiteCliente && (
            <Form.Item
              name="limite_usos_cliente"
              label="Máximo de usos por cliente"
              tooltip="Cada cliente puede beneficiarse de esta promoción un máximo de N veces en total, sumando todas sus compras. Ej: 2 = el cliente puede usarla en 2 ventas distintas, a la 3ra ya no aplica."
              rules={[{ required: true, message: "Ingrese el límite" }]}
              className="mb-0"
            >
              <InputNumber className="w-full" placeholder="Ej: 2 (cada cliente puede usarla 2 veces en total)" min={1} />
            </Form.Item>
          )}
        </div>

        {/* Límite de vales distintos por venta */}
        <div className={`bg-gray-50 rounded-lg p-4 ${esDescuento ? "opacity-60" : ""}`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-sm font-medium text-gray-700 block">Limitar vales por venta</label>
              <p className="text-xs text-gray-500 mt-0.5">Máximo de promociones distintas que pueden aplicarse en una misma venta. Si califica para más, solo se aplican las primeras N.</p>
              {esDescuento && (
                <p className="text-xs text-orange-600 mt-1">No aplica para promociones de Descuento.</p>
              )}
            </div>
            <Form.Item name="usa_limite_por_venta" valuePropName="checked" noStyle>
              <Switch disabled={esDescuento} />
            </Form.Item>
          </div>
          {usaLimiteVenta && !esDescuento && (
            <Form.Item
              name="max_vales_por_venta"
              label="Máximo de promociones por venta"
              tooltip="Limita cuántas promociones distintas puede acumular una sola venta. Ej: 1 = solo 1 promoción aplica por venta aunque califiquen varias."
              rules={[{ required: true, message: "Ingrese el límite" }]}
              className="mb-0"
            >
              <InputNumber className="w-full" placeholder="Ej: 1 (máximo 1 promoción por venta)" min={1} max={10} precision={0} />
            </Form.Item>
          )}
        </div>

        {/* Límite por stock */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-sm font-medium text-gray-700 block">Limitar por stock</label>
              <p className="text-xs text-gray-500 mt-0.5">Cantidad total de veces que puede aplicarse entre todos los clientes. Al agotarse, la promoción se desactiva automáticamente.</p>
            </div>
            <Form.Item name="usa_limite_stock" valuePropName="checked" noStyle>
              <Switch />
            </Form.Item>
          </div>
          {stockProductoGratis !== null && (
            <p className="text-xs text-blue-600 mb-2 flex items-center gap-1">
              <FaBoxOpen className="text-blue-500" />
              Stock actual del producto a regalar:{" "}
              <strong>
                <GetStock
                  stock_fraccion={stockProductoGratis.stock}
                  unidades_contenidas={stockProductoGratis.unidades_contenidas}
                />
              </strong>
              <span className="text-gray-400">(solo informativo)</span>
            </p>
          )}
          {usaLimiteStock && (
            <Form.Item
              name="stock_disponible"
              label="Stock de la promoción"
              tooltip="Cada vez que el vale se aplica en una venta, se descuenta 1. Cuando llega a 0 la promoción se desactiva. Ej: 50 = la promoción puede usarse en 50 ventas en total."
              rules={[{ required: true, message: "Ingrese el stock" }]}
              className="mb-0"
            >
              <InputNumber className="w-full" placeholder="Ej: 50" min={1} />
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

interface FormCrearValeProps {
  form: FormInstance<FormCreateVale>;
  /**
   * Vale en edición: sus productos (con nombre) precargan las opciones de los
   * SelectProductos, que solo cargan opciones al buscar — sin esto, al editar
   * se verían los IDs en vez de los nombres.
   */
  vale?: import("~/lib/api/vales-compra").ValeCompra;
}

const productoToOption = (p: { id: number; cod_producto?: string | null; name?: string | null }) => ({
  // Number(): el value de la opción debe matchear el value del form con ===;
  // si el id llega como string el Select muestra el ID crudo en vez del nombre.
  value: Number(p.id),
  label: `${p.cod_producto ?? ""} : ${p.name ?? ""}`,
});

export default function FormCrearVale({ form, vale }: FormCrearValeProps) {
  const productosDefault = vale?.productos?.map(productoToOption);
  const descuentoProductosDefault = vale?.descuento_productos?.map(productoToOption);
  const productoGratisDefault = vale?.producto_gratis ? [productoToOption(vale.producto_gratis)] : undefined;
  const momento = (Form.useWatch("momento_aplicacion", form) as MomentoAplicacion | undefined) ?? "MISMA_COMPRA";
  const tipoBeneficio = Form.useWatch("tipo_beneficio", form) as string | undefined;
  const tipoPromocion = Form.useWatch("tipo_promocion", form) || "DESCUENTO_MISMA_COMPRA";
  const modalidad = Form.useWatch("modalidad", form) || "CANTIDAD_MINIMA";
  const descuentoTipo = Form.useWatch("descuento_tipo", form) || "PORCENTAJE";
  const usaLimiteCliente = Form.useWatch("usa_limite_por_cliente", form) || false;
  const usaLimiteStock = Form.useWatch("usa_limite_stock", form) || false;
  const usaLimiteVenta = Form.useWatch("usa_limite_por_venta", form) || false;
  // El umbral (MONTO/CANTIDAD) vive en un campo del form para que se envíe en el
  // payload y se hidrate al editar. El setter solo escribe el campo.
  const tipoUmbral = (Form.useWatch("tipo_umbral", form) as TipoUmbral | undefined) ?? null;
  const setTipoUmbral = (t: TipoUmbral | null) => form.setFieldValue("tipo_umbral", t);

  // El PASO 2 siempre se muestra. En 2x1 de MISMA compra el umbral queda fijado en
  // "Ninguno" automáticamente (las unidades van en el PASO 4), sin pedir ni validar
  // nada; en PRÓXIMA compra es la CONDICIÓN para ganar el vale y se elige libremente.
  const esDosPorUno = tipoPromocion === "DOS_POR_UNO";
  const esFuturo = momento === "PROXIMA_COMPRA";
  const esDescuento = tipoPromocion === "DESCUENTO_MISMA_COMPRA" || tipoPromocion === "DESCUENTO_PROXIMA_COMPRA";

  // El límite de vales por venta no aplica a promociones de Descuento: si el usuario
  // lo había activado y luego cambia a Descuento, lo apagamos para no enviar un valor obsoleto.
  useEffect(() => {
    if (esDescuento && usaLimiteVenta) {
      form.setFieldsValue({ usa_limite_por_venta: false, max_vales_por_venta: null });
    }
  }, [esDescuento, usaLimiteVenta, form]);

  // Stock del producto que se regalará (producto_gratis_id). Solo informativo: se
  // muestra en el PASO 6 para que el usuario sepa cuánto hay del producto premiado.
  const productoGratisId = Form.useWatch("producto_gratis_id", form) as number | undefined;
  const { data: stockProductoGratis } = useQuery({
    queryKey: ["vale-stock-producto-gratis", productoGratisId],
    queryFn: async () => {
      if (!productoGratisId) return null;
      // Stock total (todos los almacenes) + unidades_contenidas para mostrarlo
      // con el mismo formato "XFY" del modal de buscar producto.
      const [stockRes, prodRes] = await Promise.all([
        getStockProductos([productoGratisId]),
        productosApiV2.getById(productoGratisId),
      ]);
      if (stockRes.error) return null;
      const stock = stockRes.data?.data?.[productoGratisId] ?? 0;
      const unidades_contenidas = Number(prodRes.data?.unidades_contenidas) || 1;
      return { stock, unidades_contenidas };
    },
    enabled: !!productoGratisId,
  });

  return (
    <div className="space-y-4">
      <Form.Item name="tipo_umbral" hidden>
        <input type="hidden" />
      </Form.Item>
      <SeccionBasica form={form} />
      <SeccionUmbral form={form} momento={momento} tipoUmbral={tipoUmbral} setTipoUmbral={setTipoUmbral} esDosPorUno={esDosPorUno && !esFuturo} />
      <SeccionModalidad form={form} modalidad={modalidad} tipoUmbral={tipoUmbral} productosDefault={productosDefault} />
      <SeccionBeneficio form={form} tipoPromocion={tipoPromocion} descuentoTipo={descuentoTipo} momento={momento} esDosPorUno={esDosPorUno} descuentoProductosDefault={descuentoProductosDefault} productoGratisDefault={productoGratisDefault} />
      <SeccionVigencia form={form} />
      <SeccionRestricciones usaLimiteCliente={usaLimiteCliente} usaLimiteStock={usaLimiteStock} usaLimiteVenta={usaLimiteVenta} esDescuento={esDescuento} stockProductoGratis={stockProductoGratis ?? null} />
      <SeccionPrecios />
    </div>
  );
}