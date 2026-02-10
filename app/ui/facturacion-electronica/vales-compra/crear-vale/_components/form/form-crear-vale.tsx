"use client";

import { FormInstance, Form, Input, InputNumber, Select, DatePicker, Switch, Divider } from "antd";
import type { FormCreateVale } from "../others/body-crear-vale";
import { FaGift, FaCalendar, FaHashtag, FaPercentage, FaDollarSign, FaBoxOpen, FaUsers } from "react-icons/fa";
import { useState } from "react";
import dayjs from "dayjs";
import SelectProductos from "~/app/_components/form/selects/select-productos";
import { message } from "antd";

const { TextArea } = Input;

export default function FormCrearVale({
  form,
}: {
  form: FormInstance<FormCreateVale>;
}) {
  const [tipoPromocion, setTipoPromocion] = useState<string>('DESCUENTO_MISMA_COMPRA');
  const [modalidad, setModalidad] = useState<string>('CANTIDAD_MINIMA');
  const [descuentoTipo, setDescuentoTipo] = useState<string>('PORCENTAJE');
  const [usaLimiteCliente, setUsaLimiteCliente] = useState(false);
  const [usaLimiteStock, setUsaLimiteStock] = useState(false);

  return (
    <div className="space-y-4">
      {/* Información Básica */}
      <div className="border-l-4 border-amber-500 pl-3">
        <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FaGift className="text-amber-600" />
          Información Básica
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Form.Item
            name="nombre"
            label="Nombre de la Promoción"
            rules={[{ required: true, message: 'El nombre es requerido' }]}
          >
            <Input
              placeholder="Ej: Descuento 10% por 55 unidades"
              prefix={<FaGift className="text-amber-600 mr-1" />}
            />
          </Form.Item>

          <Form.Item
            name="tipo_promocion"
            label="Tipo de Promoción"
            rules={[{ required: true, message: 'Seleccione el tipo' }]}
          >
            <Select
              onChange={(value) => setTipoPromocion(value)}
              options={[
                { label: '🎁 Sorteo', value: 'SORTEO' },
                { label: '💰 Descuento en la Misma Compra', value: 'DESCUENTO_MISMA_COMPRA' },
                { label: '🎟️ Vale para Próxima Compra', value: 'DESCUENTO_PROXIMA_COMPRA' },
                { label: '🎉 Producto Gratis', value: 'PRODUCTO_GRATIS' },
              ]}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="descripcion"
          label="Descripción (opcional)"
        >
          <TextArea
            rows={3}
            placeholder="Describe los detalles de la promoción..."
            maxLength={500}
            showCount
          />
        </Form.Item>
      </div>

      {/* Modalidad y Condiciones */}
      <div className="border-l-4 border-blue-500 pl-3">
        <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FaHashtag className="text-blue-600" />
          Condiciones de Activación
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Form.Item
            name="modalidad"
            label="Modalidad"
            rules={[{ required: true, message: 'Seleccione la modalidad' }]}
          >
            <Select
              
              onChange={(value) => setModalidad(value)}
              options={[
                { label: '📊 Solamente por Cantidad Mínima', value: 'CANTIDAD_MINIMA' },
                { label: '📁 Por Tipo de Familia (Categoría)', value: 'POR_CATEGORIA' },
                { label: '🏷️ Por Productos Específicos', value: 'POR_PRODUCTOS' },
                { label: '🔀 Mixto (Familia + Productos)', value: 'MIXTO' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="cantidad_minima"
            label="Cantidad Mínima de Productos"
            rules={[
              { required: true, message: 'La cantidad mínima es requerida' },
              { type: 'number', min: 0.001, message: 'Debe ser mayor a 0' }
            ]}
          >
            <InputNumber
              
              className="w-full"
              placeholder="Ej: 55"
              min={0.001}
              step={1}
              prefix={<FaBoxOpen className="text-blue-600" />}
            />
          </Form.Item>
        </div>

        {/* Mostrar selector de categorías si aplica */}
        {(modalidad === 'POR_CATEGORIA' || modalidad === 'MIXTO') && (
          <Form.Item
            name="categoria_ids"
            label="Categorías Aplicables"
            rules={[{ required: true, message: 'Seleccione al menos una categoría' }]}
          >
            <Select
              mode="multiple"
              
              placeholder="Seleccione las categorías..."
              // Aquí se conectaría con un hook de categorías
              options={[
                { label: 'Herramientas', value: 1 },
                { label: 'Construcción', value: 2 },
                { label: 'Electricidad', value: 3 },
              ]}
            />
          </Form.Item>
        )}

        {/* Mostrar selector de productos si aplica */}
        {(modalidad === 'POR_PRODUCTOS' || modalidad === 'MIXTO') && (
          <Form.Item
            name="producto_ids"
            label="Productos Aplicables"
            rules={[{ required: true, message: 'Seleccione al menos un producto' }]}
          >
            <SelectProductos
              mode="multiple"
              
              placeholder="Busque y seleccione productos..."
              className="w-full"
            />
          </Form.Item>
        )}
      </div>

      {/* Beneficio según tipo de promoción */}
      <div className="border-l-4 border-green-500 pl-3">
        <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FaGift className="text-green-600" />
          Beneficio de la Promoción
        </h3>

        {/* Para DESCUENTO_MISMA_COMPRA o DESCUENTO_PROXIMA_COMPRA */}
        {(tipoPromocion === 'DESCUENTO_MISMA_COMPRA' || tipoPromocion === 'DESCUENTO_PROXIMA_COMPRA') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Form.Item
              name="descuento_tipo"
              label="Tipo de Descuento"
              rules={[{ required: true, message: 'Seleccione el tipo' }]}
            >
              <Select
                
                onChange={(value) => setDescuentoTipo(value)}
                options={[
                  { label: '% Porcentaje', value: 'PORCENTAJE' },
                  { label: 'S/ Monto Fijo', value: 'MONTO_FIJO' },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="descuento_valor"
              label={descuentoTipo === 'PORCENTAJE' ? 'Porcentaje (%)' : 'Monto (S/)'}
              rules={[
                { required: true, message: 'El valor es requerido' },
                { type: 'number', min: 0, message: 'Debe ser mayor o igual a 0' }
              ]}
            >
              <InputNumber
                
                className="w-full"
                placeholder={descuentoTipo === 'PORCENTAJE' ? 'Ej: 10' : 'Ej: 50.00'}
                min={0}
                step={descuentoTipo === 'PORCENTAJE' ? 1 : 0.01}
                prefix={descuentoTipo === 'PORCENTAJE' ? <FaPercentage className="text-green-600" /> : <FaDollarSign className="text-green-600" />}
              />
            </Form.Item>
          </div>
        )}

        {/* Para DESCUENTO_PROXIMA_COMPRA - Fecha de validez */}
        {tipoPromocion === 'DESCUENTO_PROXIMA_COMPRA' && (
          <Form.Item
            name="fecha_validez_vale"
            label="Válido hasta"
            rules={[{ required: true, message: 'La fecha de validez es requerida' }]}
          >
            <DatePicker
              
              className="w-full"
              placeholder="Seleccione fecha límite"
              format="DD/MM/YYYY"
              disabledDate={(current) => current && current < dayjs().endOf('day')}
              prefix={<FaCalendar className="text-green-600" />}
            />
          </Form.Item>
        )}

        {/* Para PRODUCTO_GRATIS */}
        {tipoPromocion === 'PRODUCTO_GRATIS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Form.Item
              name="producto_gratis_id"
              label="Producto a Regalar"
              rules={[{ required: true, message: 'Seleccione el producto' }]}
            >
              <SelectProductos
                
                placeholder="Busque el producto..."
                className="w-full"
              />
            </Form.Item>

            <Form.Item
              name="cantidad_producto_gratis"
              label="Cantidad a Regalar"
            >
              <InputNumber
                
                className="w-full"
                placeholder="1"
                min={0.001}
                step={1}
              />
            </Form.Item>
          </div>
        )}

        {/* Para SORTEO - solo mensaje informativo */}
        {tipoPromocion === 'SORTEO' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              ℹ️ Para sorteos, la descripción debe incluir los detalles del premio y las condiciones de participación.
            </p>
          </div>
        )}
      </div>

      {/* Vigencia */}
      <div className="border-l-4 border-purple-500 pl-3">
        <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FaCalendar className="text-purple-600" />
          Vigencia
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Form.Item
            name="fecha_inicio"
            label="Fecha de Inicio"
            rules={[{ required: true, message: 'La fecha de inicio es requerida' }]}
          >
            <DatePicker
              
              className="w-full"
              format="DD/MM/YYYY"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          <Form.Item
            name="fecha_fin"
            label="Fecha de Fin (opcional)"
          >
            <DatePicker
              
              className="w-full"
              format="DD/MM/YYYY"
              placeholder="Sin fecha de fin"
              disabledDate={(current) => {
                const fechaInicio = form.getFieldValue('fecha_inicio');
                return current && fechaInicio && current < fechaInicio;
              }}
            />
          </Form.Item>
        </div>
      </div>

      {/* Restricciones */}
      <div className="border-l-4 border-orange-500 pl-3">
        <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FaUsers className="text-orange-600" />
          Restricciones (opcional)
        </h3>

        <div className="space-y-4">
          {/* Límite por cliente */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Limitar usos por cliente
              </label>
              <Form.Item name="usa_limite_por_cliente" valuePropName="checked" noStyle>
                <Switch onChange={(checked) => setUsaLimiteCliente(checked)} />
              </Form.Item>
            </div>
            {usaLimiteCliente && (
              <Form.Item
                name="limite_usos_cliente"
                rules={[{ required: usaLimiteCliente, message: 'Ingrese el límite' }]}
                className="mb-0"
              >
                <InputNumber
                  
                  className="w-full"
                  placeholder="Máximo de usos por cliente"
                  min={1}
                />
              </Form.Item>
            )}
          </div>

          {/* Límite de stock */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Limitar stock de promociones
              </label>
              <Form.Item name="usa_limite_stock" valuePropName="checked" noStyle>
                <Switch onChange={(checked) => setUsaLimiteStock(checked)} />
              </Form.Item>
            </div>
            {usaLimiteStock && (
              <Form.Item
                name="stock_disponible"
                rules={[{ required: usaLimiteStock, message: 'Ingrese el stock' }]}
                className="mb-0"
              >
                <InputNumber
                  
                  className="w-full"
                  placeholder="Cantidad de promociones disponibles"
                  min={1}
                />
              </Form.Item>
            )}
          </div>
        </div>
      </div>

      {/* Aplicable a qué precios */}
      <div className="border-l-4 border-indigo-500 pl-3">
        <h3 className="text-base font-semibold text-gray-800 mb-3">
          Aplicable a Precios
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Form.Item name="aplica_precio_publico" valuePropName="checked" noStyle>
            <div className="flex items-center gap-2">
              <Switch />
              <span className="text-sm">Precio Público</span>
            </div>
          </Form.Item>

          <Form.Item name="aplica_precio_especial" valuePropName="checked" noStyle>
            <div className="flex items-center gap-2">
              <Switch />
              <span className="text-sm">Precio Especial</span>
            </div>
          </Form.Item>

          <Form.Item name="aplica_precio_minimo" valuePropName="checked" noStyle>
            <div className="flex items-center gap-2">
              <Switch />
              <span className="text-sm">Precio Mínimo</span>
            </div>
          </Form.Item>

          <Form.Item name="aplica_precio_ultimo" valuePropName="checked" noStyle>
            <div className="flex items-center gap-2">
              <Switch />
              <span className="text-sm">Precio Último</span>
            </div>
          </Form.Item>
        </div>
      </div>
    </div>
  );
}
