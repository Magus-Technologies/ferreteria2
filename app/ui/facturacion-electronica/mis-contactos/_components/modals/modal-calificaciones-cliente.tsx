"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { Modal, Button, Tooltip, message, Spin, Form, Select, Input } from "antd";
import { FaPlus, FaEdit, FaTrash, FaStar, FaHistory } from "react-icons/fa";
import TableBase from "~/components/tables/table-base";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import { useRef, useState } from "react";
import dayjs from "dayjs";
import { clienteCalificacionApi, type ClienteCalificacion, type EstadoOption } from "~/lib/api/cliente-calificacion";
import { QueryKeys } from "~/app/_lib/queryKeys";

interface ModalCalificacionesClienteProps {
  open: boolean;
  onClose: () => void;
  clienteId: number;
  clienteNombre: string;
}

export default function ModalCalificacionesCliente({
  open,
  onClose,
  clienteId,
  clienteNombre,
}: ModalCalificacionesClienteProps) {
  const gridRef = useRef<AgGridReact<ClienteCalificacion>>(null);
  const [form] = Form.useForm();
  const [modalFormVisible, setModalFormVisible] = useState(false);
  const [editingCalificacion, setEditingCalificacion] = useState<ClienteCalificacion | null>(null);

  // Queries
  const { data: calificacionesResponse, isLoading: loadingCalificaciones, refetch } = useQuery({
    queryKey: [QueryKeys.CLIENTES, clienteId, "calificaciones"],
    queryFn: () => clienteCalificacionApi.getByCliente(clienteId),
    enabled: open,
  });

  const calificaciones = calificacionesResponse?.data?.data || [];

  const { data: estadosResponse, isLoading: loadingEstados } = useQuery({
    queryKey: ["calificaciones-estados"],
    queryFn: () => clienteCalificacionApi.getEstados(),
    enabled: open,
  });

  const estadosData = estadosResponse?.data?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => clienteCalificacionApi.create(clienteId, data),
    onSuccess: () => {
      message.success("Calificación creada exitosamente");
      form.resetFields();
      setModalFormVisible(false);
      refetch();
    },
    onError: (error: any) => {
      message.error(error.message || "Error al crear calificación");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => clienteCalificacionApi.update(editingCalificacion!.id, data),
    onSuccess: () => {
      message.success("Calificación actualizada exitosamente");
      form.resetFields();
      setModalFormVisible(false);
      setEditingCalificacion(null);
      refetch();
    },
    onError: (error: any) => {
      message.error(error.message || "Error al actualizar calificación");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => clienteCalificacionApi.delete(id),
    onSuccess: () => {
      message.success("Calificación eliminada exitosamente");
      refetch();
    },
    onError: (error: any) => {
      message.error(error.message || "Error al eliminar calificación");
    },
  });

  const handleAgregar = () => {
    setEditingCalificacion(null);
    form.resetFields();
    setModalFormVisible(true);
  };

  const handleEditar = (calificacion: ClienteCalificacion) => {
    setEditingCalificacion(calificacion);
    form.setFieldsValue({
      estado: calificacion.estado,
      razon: calificacion.razon,
      observacion: calificacion.observacion,
    });
    setModalFormVisible(true);
  };

  const handleEliminar = (calificacion: ClienteCalificacion) => {
    Modal.confirm({
      title: "¿Eliminar calificación?",
      content: `Se eliminará la calificación "${calificacion.estado}".`,
      okText: "Eliminar",
      okType: "danger",
      cancelText: "Cancelar",
      onOk: () => deleteMutation.mutate(calificacion.id),
    });
  };

  const handleSubmit = async (values: any) => {
    if (editingCalificacion) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const columns: ColDef<ClienteCalificacion>[] = [
    {
      headerName: "Estado",
      field: "estado",
      width: 140,
      cellRenderer: (params: any) => {
        const estadoObj = estadosData.find((e: EstadoOption) => e.value === params.value);
        const colorMap: Record<string, string> = {
          green: "bg-green-100 text-green-700",
          blue: "bg-blue-100 text-blue-700",
          orange: "bg-orange-100 text-orange-700",
          red: "bg-red-100 text-red-700",
        };
        const colorClass = colorMap[estadoObj?.color || "gray"] || "bg-gray-100 text-gray-700";
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${colorClass}`}>
            {estadoObj?.label || params.value}
          </span>
        );
      },
    },
    {
      headerName: "Razón",
      field: "razon",
      flex: 1,
      minWidth: 200,
      cellRenderer: (params: any) => (
        <span className="text-slate-600 text-sm">{params.value || "-"}</span>
      ),
    },
    {
      headerName: "Observación",
      field: "observacion",
      flex: 1,
      minWidth: 250,
      cellRenderer: (params: any) => (
        <span className="text-slate-500 italic text-xs">{params.value || "-"}</span>
      ),
    },
    {
      headerName: "Registrado Por",
      field: "createdBy.name",
      width: 150,
      cellRenderer: (params: any) => (
        <span className="text-slate-600 text-xs font-medium">{params.value || "-"}</span>
      ),
    },
    {
      headerName: "Fecha",
      field: "created_at",
      width: 160,
      cellRenderer: (params: any) => (
        <span className="text-slate-500 text-xs">
          {dayjs(params.value).format("DD/MM/YYYY HH:mm")}
        </span>
      ),
    },
    {
      headerName: "Acciones",
      field: "id",
      width: 120,
      pinned: "right",
      cellRenderer: (params: any) => (
        <div className="flex gap-1 items-center justify-center">
          <Tooltip title="Editar">
            <Button
              type="link"
              size="small"
              onClick={() => handleEditar(params.data)}
              className="flex items-center"
            >
              <FaEdit className="text-amber-600 text-base" />
            </Button>
          </Tooltip>
          <Tooltip title="Eliminar">
            <Button
              type="link"
              size="small"
              onClick={() => handleEliminar(params.data)}
              className="flex items-center"
              danger
            >
              <FaTrash className="text-red-600 text-base" />
            </Button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FaStar className="text-amber-500" />
            <span>Calificaciones de {clienteNombre}</span>
          </div>
        }
        open={open}
        onCancel={onClose}
        width={1200}
        footer={[
          <Button key="close" onClick={onClose}>
            Cerrar
          </Button>,
          <Button
            key="agregar"
            type="primary"
            icon={<FaPlus />}
            onClick={handleAgregar}
          >
            Agregar Calificación
          </Button>,
        ]}
      >
        {loadingCalificaciones ? (
          <div className="flex justify-center items-center h-[400px]">
            <Spin size="large" tip="Cargando calificaciones..." />
          </div>
        ) : (
          <div className="space-y-4">
            {calificaciones.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FaHistory className="text-4xl mx-auto mb-3 opacity-30" />
                <p>No hay calificaciones registradas</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="h-[400px] w-full">
                  <TableBase<ClienteCalificacion>
                    ref={gridRef}
                    rowData={calificaciones}
                    columnDefs={columns}
                    rowSelection={false}
                    withNumberColumn={true}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal de Formulario */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            {editingCalificacion ? (
              <>
                <FaEdit className="text-amber-600" />
                <span>Editar Calificación</span>
              </>
            ) : (
              <>
                <FaPlus className="text-emerald-600" />
                <span>Nueva Calificación</span>
              </>
            )}
          </div>
        }
        open={modalFormVisible}
        onCancel={() => {
          setModalFormVisible(false);
          setEditingCalificacion(null);
          form.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => setModalFormVisible(false)}>
            Cancelar
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={createMutation.isPending || updateMutation.isPending}
            onClick={() => form.submit()}
          >
            {editingCalificacion ? "Actualizar" : "Crear"}
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          <Form.Item
            name="estado"
            label="Estado"
            rules={[{ required: true, message: "Selecciona un estado" }]}
          >
            <Select
              placeholder="Selecciona el estado del cliente"
              loading={loadingEstados}
              options={estadosData.map((e: EstadoOption) => ({
                label: e.label,
                value: e.value,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="razon"
            label="Razón (opcional)"
            rules={[{ max: 255, message: "Máximo 255 caracteres" }]}
          >
            <Input
              placeholder="Ej: Pago lento, Devoluciones frecuentes"
              maxLength={255}
            />
          </Form.Item>

          <Form.Item
            name="observacion"
            label="Observación (opcional)"
            rules={[{ max: 1000, message: "Máximo 1000 caracteres" }]}
          >
            <Input.TextArea
              placeholder="Ej: Cliente pide que le lleve su pedido al segundo piso"
              rows={4}
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
