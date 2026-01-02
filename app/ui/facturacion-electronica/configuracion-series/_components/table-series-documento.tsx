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
import { serieDocumentoApi, type CreateSerieDocumentoRequest } from "~/lib/api/serie-documento";
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
      const result = await serieDocumentoApi.list({
        almacen_id: almacen_id!,
      });
      return result.data?.data || [];
    },
    enabled: !!almacen_id,
  });

  const createMutation = useMutation({
    mutationFn: async (values: CreateSerieDocumentoRequest) => {
      if (!almacen_id) throw new Error("No hay almacén seleccionado");

      const response = await serieDocumentoApi.create({
        tipo_documento: values.tipo_documento,
        serie: values.serie.toUpperCase(),
        correlativo: values.correlativo || 0,
        activo: values.activo ?? true,
        almacen_id: almacen_id,
      });

      if (response.error) {
        throw new Error(response.error.message || "Error al crear la serie");
      }

      return response;
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
      render: (tipo: string) => {
        const colors: Record<string, string> = {
          "01": "blue",
          "03": "green",
          "nv": "orange",
          "in": "cyan",
          "sa": "purple",
          "rc": "magenta",
        };
        const labels: Record<string, string> = {
          "01": "Factura",
          "03": "Boleta",
          "nv": "Nota de Venta",
          "in": "Ingreso",
          "sa": "Salida",
          "rc": "Recibo por Honorarios",
        };
        return <Tag color={colors[tipo] || "default"}>{labels[tipo] || tipo}</Tag>;
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
              <Select.Option value="01">Factura</Select.Option>
              <Select.Option value="03">Boleta</Select.Option>
              <Select.Option value="nv">Nota de Venta</Select.Option>
              <Select.Option value="in">Ingreso</Select.Option>
              <Select.Option value="sa">Salida</Select.Option>
              <Select.Option value="rc">Recibo por Honorarios</Select.Option>
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
