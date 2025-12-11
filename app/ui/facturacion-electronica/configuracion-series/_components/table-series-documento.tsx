"use client";

import { useState } from "react";
import {
  Button,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { TipoDocumento } from "@prisma/client";
import {
  createSerieDocumento,
  getSeriesDocumento,
} from "~/app/_actions/serie-documento";
import { useStoreAlmacen } from "~/store/store-almacen";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function TableSeriesDocumento() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const almacen_id = useStoreAlmacen((state) => state.almacen_id);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["series-documento", almacen_id],
    queryFn: async () => {
      const result = await getSeriesDocumento({
        where: { almacen_id },
      });
      return result.data;
    },
    enabled: !!almacen_id,
  });

  const createMutation = useMutation({
    mutationFn: async (values: {
      tipo_documento: TipoDocumento;
      serie: string;
      correlativo?: number;
      activo?: boolean;
    }) => {
      await createSerieDocumento({
        tipo_documento: values.tipo_documento,
        serie: values.serie,
        correlativo: values.correlativo || 0,
        activo: values.activo ?? true,
        almacen: {
          connect: { id: almacen_id },
        },
      });
    },
    onSuccess: () => {
      message.success("Serie creada exitosamente");
      queryClient.invalidateQueries({ queryKey: ["series-documento"] });
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: (error: Error) => {
      message.error(error.message || "Error al crear la serie");
    },
  });

  const columns = [
    {
      title: "Tipo Documento",
      dataIndex: "tipo_documento",
      key: "tipo_documento",
      render: (tipo: TipoDocumento) => {
        const colors: Partial<Record<TipoDocumento, string>> = {
          Factura: "blue",
          Boleta: "green",
          NotaDeVenta: "orange",
          Ingreso: "cyan",
          Salida: "purple",
        };
        const labels: Partial<Record<TipoDocumento, string>> = {
          Factura: "Factura",
          Boleta: "Boleta",
          NotaDeVenta: "Nota de Venta",
          Ingreso: "Ingreso",
          Salida: "Salida",
        };
        return <Tag color={colors[tipo]}>{labels[tipo]}</Tag>;
      },
    },
    {
      title: "Serie",
      dataIndex: "serie",
      key: "serie",
    },
    {
      title: "Último Correlativo",
      dataIndex: "correlativo",
      key: "correlativo",
    },
    {
      title: "Estado",
      dataIndex: "activo",
      key: "activo",
      render: (activo: boolean) => (
        <Tag color={activo ? "success" : "default"}>
          {activo ? "Activo" : "Inactivo"}
        </Tag>
      ),
    },
    {
      title: "Almacén",
      dataIndex: ["almacen", "name"],
      key: "almacen",
    },
  ];

  return (
    <>
      <div className="mb-4">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
        >
          Nueva Serie
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={isLoading}
        rowKey="id"
        pagination={false}
      />

      <Modal
        title="Crear Nueva Serie de Documento"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => createMutation.mutate(values)}
        >
          <Form.Item
            name="tipo_documento"
            label="Tipo de Documento"
            rules={[
              { required: true, message: "Seleccione el tipo de documento" },
            ]}
          >
            <Select placeholder="Seleccione">
              <Select.Option value="Factura">Factura</Select.Option>
              <Select.Option value="Boleta">Boleta</Select.Option>
              <Select.Option value="NotaDeVenta">Nota de Venta</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="serie"
            label="Serie"
            rules={[
              { required: true, message: "Ingrese la serie" },
              {
                pattern: /^[A-Z0-9]{4}$/,
                message: "La serie debe tener 4 caracteres alfanuméricos",
              },
            ]}
          >
            <Input placeholder="Ej: F001, B001, NV01" maxLength={4} />
          </Form.Item>

          <Form.Item
            name="correlativo"
            label="Correlativo Inicial"
            initialValue={0}
          >
            <Input type="number" placeholder="0" />
          </Form.Item>

          <Form.Item
            name="activo"
            label="Activo"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
