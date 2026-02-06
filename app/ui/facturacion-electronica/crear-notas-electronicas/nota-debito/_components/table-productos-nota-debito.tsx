"use client";

import { Form, FormInstance, Table, Button, Input, InputNumber } from "antd";
import { FormCreateNotaDebito } from "./body-crear-nota-debito";
import { FaPlus, FaTrash } from "react-icons/fa";

interface TableProductosNotaDebitoProps {
  form: FormInstance<FormCreateNotaDebito>;
}

export default function TableProductosNotaDebito({ form }: TableProductosNotaDebitoProps) {
  const productos = Form.useWatch("productos", form) || [];

  const agregarProducto = () => {
    const nuevosProductos = [
      ...productos,
      {
        codigo: "",
        descripcion: "",
        unidad_medida: "NIU",
        cantidad: 1,
        precio_unitario: 0,
        subtotal: 0,
      },
    ];
    form.setFieldValue("productos", nuevosProductos);
  };

  const eliminarProducto = (index: number) => {
    const nuevosProductos = productos.filter((_: any, i: number) => i !== index);
    form.setFieldValue("productos", nuevosProductos);
  };

  const actualizarProducto = (index: number, field: string, value: any) => {
    const nuevosProductos = [...productos];
    nuevosProductos[index] = {
      ...nuevosProductos[index],
      [field]: value,
    };

    // Calcular subtotal
    if (field === "cantidad" || field === "precio_unitario") {
      const cantidad = field === "cantidad" ? value : nuevosProductos[index].cantidad;
      const precio = field === "precio_unitario" ? value : nuevosProductos[index].precio_unitario;
      nuevosProductos[index].subtotal = cantidad * precio;
    }

    form.setFieldValue("productos", nuevosProductos);
  };

  const columns = [
    {
      title: "#",
      dataIndex: "index",
      key: "index",
      width: 50,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: "Producto",
      dataIndex: "descripcion",
      key: "descripcion",
      width: 200,
      render: (text: string, record: any, index: number) => (
        <Input
          value={text}
          onChange={(e) => actualizarProducto(index, "descripcion", e.target.value)}
          placeholder="Descripción del producto"
        />
      ),
    },
    {
      title: "U Medida",
      dataIndex: "unidad_medida",
      key: "unidad_medida",
      width: 100,
      render: (text: string, record: any, index: number) => (
        <Input
          value={text}
          onChange={(e) => actualizarProducto(index, "unidad_medida", e.target.value)}
          placeholder="NIU"
        />
      ),
    },
    {
      title: "Cant",
      dataIndex: "cantidad",
      key: "cantidad",
      width: 80,
      render: (value: number, record: any, index: number) => (
        <InputNumber
          value={value}
          onChange={(val) => actualizarProducto(index, "cantidad", val || 0)}
          min={0}
          className="w-full"
        />
      ),
    },
    {
      title: "P.Tipo",
      dataIndex: "precio_tipo",
      key: "precio_tipo",
      width: 80,
      render: () => "P.Unit",
    },
    {
      title: "P.Unit",
      dataIndex: "precio_unitario",
      key: "precio_unitario",
      width: 100,
      render: (value: number, record: any, index: number) => (
        <InputNumber
          value={value}
          onChange={(val) => actualizarProducto(index, "precio_unitario", val || 0)}
          min={0}
          step={0.01}
          precision={2}
          className="w-full"
        />
      ),
    },
    {
      title: "Subtotal",
      dataIndex: "subtotal",
      key: "subtotal",
      width: 100,
      render: (value: number) => `S/ ${value.toFixed(2)}`,
    },
    {
      title: "Comm",
      dataIndex: "comision",
      key: "comision",
      width: 80,
      render: () => "0.00",
    },
    {
      title: "Und/Tot",
      dataIndex: "unidad_total",
      key: "unidad_total",
      width: 80,
      render: () => "-",
    },
    {
      title: "Factor",
      dataIndex: "factor",
      key: "factor",
      width: 80,
      render: () => "-",
    },
    {
      title: "",
      key: "actions",
      width: 50,
      render: (_: any, __: any, index: number) => (
        <Button
          type="text"
          danger
          icon={<FaTrash />}
          onClick={() => eliminarProducto(index)}
          size="small"
        />
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-700">Productos</h3>
        <Button
          type="primary"
          danger
          icon={<FaPlus />}
          onClick={agregarProducto}
          size="small"
        >
          Agregar Producto
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={productos}
        pagination={false}
        scroll={{ x: 1200 }}
        size="small"
        rowKey={(_, index) => index?.toString() || "0"}
        locale={{
          emptyText: "No hay productos agregados. Haga clic en 'Agregar Producto' para comenzar.",
        }}
      />
    </div>
  );
}
