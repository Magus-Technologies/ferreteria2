"use client";

import { useState, useRef } from "react";
import { Button, Popconfirm, Tag } from "antd";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import type { ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import TableWithTitle from "~/components/tables/table-with-title";
import { Cliente, clienteApi, TipoCliente } from "~/lib/api/cliente";
import { useStoreFiltrosMisContactos } from "../../_store/store-filtros-mis-contactos";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QueryKeys } from "~/app/_lib/queryKeys";
import { App } from "antd";
import ModalCreateCliente from "../../../mis-ventas/_components/modals/modal-create-cliente";
import ModalVerDetalleCliente from "../modals/modal-ver-detalle-cliente";

export default function TableMisContactos() {
  const { filtros } = useStoreFiltrosMisContactos();
  const { notification } = App.useApp();
  const queryClient = useQueryClient();
  const tableRef = useRef<AgGridReact<Cliente>>(null);
  
  const [clienteParaEditar, setClienteParaEditar] = useState<Cliente | undefined>();
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [clienteParaVer, setClienteParaVer] = useState<Cliente | null>(null);
  const [modalVerOpen, setModalVerOpen] = useState(false);

  // Query para obtener los contactos
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: [QueryKeys.CLIENTES, filtros],
    queryFn: () => clienteApi.getAll(filtros),
  });

  // Mutation para eliminar contacto
  const deleteMutation = useMutation({
    mutationFn: (id: number) => clienteApi.delete(id),
    onSuccess: (response) => {
      if (response.error) {
        notification.error({
          message: "Error",
          description: response.error.message,
        });
        return;
      }

      notification.success({
        message: "Contacto eliminado",
        description: "El contacto ha sido eliminado exitosamente",
      });

      queryClient.invalidateQueries({ queryKey: [QueryKeys.CLIENTES] });
      refetch();
    },
    onError: (error: Error) => {
      notification.error({
        message: "Error",
        description: error.message || "Error al eliminar el contacto",
      });
    },
  });

  const handleVerDetalles = (cliente: Cliente) => {
    setClienteParaVer(cliente);
    setModalVerOpen(true);
  };

  const handleEditar = (cliente: Cliente) => {
    setClienteParaEditar(cliente);
    setModalEditarOpen(true);
  };

  const handleEliminar = (id: number) => {
    deleteMutation.mutate(id);
  };

  const columnDefs: ColDef<Cliente>[] = [
    {
      headerName: "RUC/DNI",
      field: "numero_documento",
      width: 120,
      pinned: "left",
    },
    {
      headerName: "Razón Social / Nombres",
      field: "razon_social",
      flex: 1,
      minWidth: 200,
      valueGetter: (params) => {
        const cliente = params.data;
        if (!cliente) return "";
        
        if (cliente.razon_social) {
          return cliente.razon_social;
        }
        return `${cliente.nombres || ""} ${cliente.apellidos || ""}`.trim();
      },
    },
    {
      headerName: "Tipo",
      field: "tipo_cliente",
      width: 100,
      cellRenderer: (params: any) => {
        const tipo = params.value;
        if (tipo === TipoCliente.PERSONA) {
          return <Tag color="blue">Persona</Tag>;
        }
        if (tipo === TipoCliente.EMPRESA) {
          return <Tag color="green">Empresa</Tag>;
        }
        return <Tag>-</Tag>;
      },
    },
    {
      headerName: "Dirección",
      field: "direccion",
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.data?.direccion || "-",
    },
    {
      headerName: "Teléfono",
      field: "telefono",
      width: 120,
      valueGetter: (params) => params.data?.telefono || "-",
    },
    {
      headerName: "Email",
      field: "email",
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.data?.email || "-",
    },
    {
      headerName: "Estado",
      field: "estado",
      width: 100,
      cellRenderer: (params: any) => {
        const estado = params.value;
        return (
          <Tag color={estado ? "green" : "red"}>
            {estado ? "Activo" : "Inactivo"}
          </Tag>
        );
      },
    },
    {
      headerName: "Acciones",
      width: 120,
      pinned: "right",
      cellRenderer: (params: any) => {
        const cliente = params.data;
        if (!cliente) return null;

        return (
          <div className="flex items-center gap-1">
            {/* Botón Ver */}
            <Button
              type="text"
              size="small"
              className="flex items-center justify-center hover:bg-blue-50"
              onClick={() => handleVerDetalles(cliente)}
            >
              <FaEye className="text-blue-600" size={14} />
            </Button>

            {/* Botón Editar */}
            <Button
              type="text"
              size="small"
              className="flex items-center justify-center hover:bg-green-50"
              onClick={() => handleEditar(cliente)}
            >
              <FaEdit className="text-green-600" size={14} />
            </Button>

            {/* Botón Eliminar */}
            <Popconfirm
              title="¿Eliminar contacto?"
              description="Esta acción no se puede deshacer"
              onConfirm={() => handleEliminar(cliente.id)}
              okText="Sí, eliminar"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                size="small"
                className="flex items-center justify-center hover:bg-red-50"
              >
                <FaTrash className="text-red-600" size={14} />
              </Button>
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  const contactos = response?.data?.data || [];

  return (
    <>
      <TableWithTitle<Cliente>
        id="mis-contactos"
        title="CONTACTOS"
        loading={isLoading}
        columnDefs={columnDefs}
        rowData={contactos}
        tableRef={tableRef}
        domLayout="normal"
        selectionColor="text-cyan-600"
        onSelectionChanged={() => {}}
        onRowClicked={() => {}}
        defaultColDef={{
          sortable: true,
          filter: true,
          resizable: true,
        }}
        getRowId={(params) => params.data.id.toString()}
        className="h-full"
        exportExcel={true}
        exportPdf={true}
        selectColumns={true}
      />

      {/* Modal para ver detalles del cliente */}
      <ModalVerDetalleCliente
        open={modalVerOpen}
        setOpen={setModalVerOpen}
        cliente={clienteParaVer}
      />

      {/* Modal para editar contacto */}
      <ModalCreateCliente
        open={modalEditarOpen}
        setOpen={setModalEditarOpen}
        dataEdit={clienteParaEditar}
        onSuccess={() => {
          setModalEditarOpen(false);
          setClienteParaEditar(undefined);
          queryClient.invalidateQueries({ queryKey: [QueryKeys.CLIENTES] });
          refetch();
        }}
      />
    </>
  );
}