"use client";

import { useState, useRef } from "react";
import React from "react";
import { Button, Tag, Tooltip, Modal } from "antd";
import { FaEye, FaEdit, FaTrash, FaStar, FaHandshake } from "react-icons/fa";
import type { ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import TableWithTitle from "~/components/tables/table-with-title";
import { Cliente, clienteApi, TipoCliente } from "~/lib/api/cliente";
import { useStoreFiltrosMisContactos } from "../../_store/store-filtros-mis-contactos";
import { useStoreClienteSeleccionado } from "../../_store/store-cliente-seleccionado";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QueryKeys } from "~/app/_lib/queryKeys";
import { App } from "antd";
import ModalCreateCliente from "../../../mis-ventas/_components/modals/modal-create-cliente";
import ModalVerDetalleCliente from "../modals/modal-ver-detalle-cliente";
import ModalCalificacionesCliente from "../modals/modal-calificaciones-cliente";
import ModalRecomendacionesCliente from "../modals/modal-recomendaciones-cliente";
import { autorizacionesApi } from "~/lib/api/autorizaciones";
import ModalSolicitarAutorizacion from "~/components/autorizaciones/modal-solicitar-autorizacion";
import { orangeColors } from "~/lib/colors";
import { clienteCalificacionApi } from "~/lib/api/cliente-calificacion";

export default function TableMisContactos() {
  const { filtros } = useStoreFiltrosMisContactos();
  const { setClienteId } = useStoreClienteSeleccionado();
  const { notification } = App.useApp();
  const queryClient = useQueryClient();
  const tableRef = useRef<AgGridReact<Cliente>>(null);
  
  const [clienteParaEditar, setClienteParaEditar] = useState<Cliente | undefined>();
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [clienteParaVer, setClienteParaVer] = useState<Cliente | null>(null);
  const [modalVerOpen, setModalVerOpen] = useState(false);
  const [clienteParaCalificar, setClienteParaCalificar] = useState<Cliente | null>(null);
  const [modalCalificacionesOpen, setModalCalificacionesOpen] = useState(false);
  const [clienteParaRecomendaciones, setClienteParaRecomendaciones] = useState<Cliente | null>(null);
  const [modalRecomendacionesOpen, setModalRecomendacionesOpen] = useState(false);
  const [modalAutorizacionOpen, setModalAutorizacionOpen] = useState(false);
  const [autorizacionAccion, setAutorizacionAccion] = useState<'editar' | 'eliminar'>('editar');
  const [autorizacionDesc, setAutorizacionDesc] = useState('');
  const [solicitandoAuth, setSolicitandoAuth] = useState(false);
  const [clienteAEliminar, setClienteAEliminar] = useState<number | null>(null);
  const [ventasPorCliente, setVentasPorCliente] = useState<Record<number, number>>({});

  // Query para obtener los contactos
  const { data: response, isFetching, refetch } = useQuery({
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

  const contactos = response?.data?.data || [];

  // Hook para obtener calificaciones de todos los clientes
  const { data: calificacionesMap } = useQuery({
    queryKey: [QueryKeys.CLIENTES, 'calificaciones', contactos.map(c => c.id).join(',')],
    queryFn: async () => {
      if (!contactos || contactos.length === 0) return {}
      
      const results = await Promise.all(
        contactos.map(async (cliente) => {
          const result = await clienteCalificacionApi.getUltima(cliente.id)
          return [cliente.id, result.data?.data || null] as const
        }),
      )

      const calificacionesData: Record<number, any> = {}
      for (const [clienteId, calificacion] of results) {
        if (calificacion) {
          calificacionesData[clienteId] = calificacion
        }
      }
      
      return calificacionesData
    },
    enabled: !!contactos && contactos.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Filtrar clientes por calificación si está seleccionada
  let clientesFiltrados = filtros.calificacion
    ? contactos.filter((cliente) => {
        const calificacion = calificacionesMap?.[cliente.id]
        return calificacion?.estado === filtros.calificacion
      })
    : contactos

  // Extraer el conteo de ventas del response si está disponible
  React.useEffect(() => {
    if (response?.data && Array.isArray(response.data)) {
      const ventasMap: Record<number, number> = {}
      response.data.forEach((cliente: any) => {
        if (cliente.ventas_count !== undefined) {
          ventasMap[cliente.id] = cliente.ventas_count
        }
      })
      setVentasPorCliente(ventasMap)
    }
  }, [response?.data])

  const handleVerDetalles = (cliente: Cliente) => {
    setClienteParaVer(cliente);
    setModalVerOpen(true);
  };

  const verificarAutorizacion = async (accion: 'editar' | 'eliminar', desc: string, ejecutar: () => void) => {
    try {
      const res = await autorizacionesApi.verificar('clientes', accion);
      const data = res.data;
      if (!data?.requiere || data?.tiene_autorizacion) {
        ejecutar();
        return;
      }
      setAutorizacionAccion(accion);
      setAutorizacionDesc(desc);
      setModalAutorizacionOpen(true);
    } catch {
      ejecutar();
    }
  };

  const handleEditar = (cliente: Cliente) => {
    const desc = `Cliente: ${cliente.razon_social || cliente.nombres || ''}`;
    verificarAutorizacion('editar', desc, () => {
      setClienteParaEditar(cliente);
      setModalEditarOpen(true);
    });
  };

  const handleCalificaciones = (cliente: Cliente) => {
    setClienteParaCalificar(cliente);
    setModalCalificacionesOpen(true);
  };

  const handleEliminar = (id: number, nombre?: string) => {
    const desc = `Cliente: ${nombre || ''}`;
    verificarAutorizacion('eliminar', desc, () => {
      setClienteAEliminar(id);
    });
  };

  const handleSolicitarAuth = async () => {
    setSolicitandoAuth(true);
    try {
      await autorizacionesApi.solicitar({
        modulo: 'clientes',
        accion: autorizacionAccion,
        descripcion: autorizacionDesc,
      });
    } finally {
      setSolicitandoAuth(false);
    }
  };

  const getCalificacionColor = (estado?: string) => {
    switch (estado) {
      case 'excelente':
        return 'green'
      case 'bueno':
        return 'blue'
      case 'regular':
        return 'orange'
      case 'problematico':
        return 'red'
      default:
        return 'default'
    }
  }

  const getCalificacionLabel = (estado?: string) => {
    switch (estado) {
      case 'excelente':
        return 'Excelente'
      case 'bueno':
        return 'Bueno'
      case 'regular':
        return 'Regular'
      case 'problematico':
        return 'Problemático'
      default:
        return 'Sin calificar'
    }
  }

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
      headerName: "Dirección Principal",
      field: "direcciones",
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        const direcciones = params.data?.direcciones;
        if (!direcciones || direcciones.length === 0) return "-";
        const principal = direcciones.find(d => d.es_principal);
        return principal?.direccion || direcciones[0]?.direccion || "-";
      },
    },
    {
      headerName: "Teléfono",
      field: "telefono",
      width: 120,
      valueGetter: (params) => params.data?.telefono || "-",
    },
    {
      headerName: "Profesión",
      field: "profesion" as any,
      width: 140,
      valueGetter: (params) => (params.data as any)?.profesion?.nombre || "-",
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
      headerName: "Calificación",
      width: 130,
      cellRenderer: (params: any) => {
        const cliente = params.data as Cliente
        const calificacion = calificacionesMap?.[cliente.id]
        
        if (!calificacion) {
          return <Tag color="default">Sin calificar</Tag>
        }

        return (
          <Tooltip title={calificacion.observacion || 'Sin observaciones'}>
            <Tag color={getCalificacionColor(calificacion.estado)}>
              <div className="flex items-center gap-1">
                <FaStar size={12} />
                {getCalificacionLabel(calificacion.estado)}
              </div>
            </Tag>
          </Tooltip>
        )
      },
    },
    {
      headerName: "Observación",
      width: 200,
      flex: 1,
      minWidth: 150,
      cellRenderer: (params: any) => {
        const cliente = params.data as Cliente
        const calificacion = calificacionesMap?.[cliente.id]
        
        if (!calificacion || !calificacion.observacion) {
          return <span className="text-gray-400">-</span>
        }

        return (
          <Tooltip title={calificacion.observacion}>
            <span className="text-gray-700 truncate block">{calificacion.observacion}</span>
          </Tooltip>
        )
      },
    },
    {
      headerName: "Recomendaciones",
      width: 130,
      cellRenderer: (params: any) => {
        const cliente = params.data as Cliente
        if (!cliente) return null
        return (
          <Button
            type="text"
            size="small"
            className="flex items-center gap-1 text-purple-600 hover:bg-purple-50"
            onClick={() => { setClienteParaRecomendaciones(cliente); setModalRecomendacionesOpen(true) }}
          >
            <FaHandshake size={13} />
            <span className="text-xs">Ver</span>
          </Button>
        )
      },
    },
    ...(filtros.ordenar_por_frecuencia ? [{
      headerName: "Compras/Mes",
      width: 100,
      cellRenderer: (params: any) => {
        const cliente = params.data as Cliente
        const compras = ventasPorCliente[cliente.id] || 0
        return (
          <div className="text-center font-semibold text-blue-600">
            {compras}
          </div>
        )
      },
    }] : []),
    {
      headerName: "Acciones",
      width: 150,
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

            {/* Botón Calificaciones */}
            <Button
              type="text"
              size="small"
              className="flex items-center justify-center hover:bg-amber-50"
              onClick={() => handleCalificaciones(cliente)}
            >
              <FaStar className="text-amber-600" size={14} />
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
            <Button
              type="text"
              size="small"
              className="flex items-center justify-center hover:bg-red-50"
              onClick={() => handleEliminar(cliente.id, cliente.razon_social || cliente.nombres)}
            >
              <FaTrash className="text-red-600" size={14} />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <TableWithTitle<Cliente>
        id="mis-contactos"
        title="CONTACTOS"
        loading={isFetching}
        columnDefs={columnDefs}
        rowData={clientesFiltrados}
        tableRef={tableRef}
        domLayout="normal"
        selectionColor={orangeColors[10]}
        onSelectionChanged={() => {}}
        onRowClicked={(event) => {
          if (event.data) {
            setClienteId(event.data.id);
          }
        }}
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

      {/* Modal para calificaciones del cliente */}
      {clienteParaCalificar && (
        <ModalCalificacionesCliente
          open={modalCalificacionesOpen}
          onClose={() => {
            setModalCalificacionesOpen(false);
            setClienteParaCalificar(null);
          }}
          clienteId={clienteParaCalificar.id}
          clienteNombre={
            clienteParaCalificar.razon_social ||
            `${clienteParaCalificar.nombres} ${clienteParaCalificar.apellidos}`
          }
        />
      )}

      <ModalSolicitarAutorizacion
        open={modalAutorizacionOpen}
        onClose={() => setModalAutorizacionOpen(false)}
        modulo="clientes"
        accion={autorizacionAccion}
        descripcion={autorizacionDesc}
        onSolicitar={handleSolicitarAuth}
        solicitando={solicitandoAuth}
      />

      <ModalRecomendacionesCliente
        open={modalRecomendacionesOpen}
        onClose={() => setModalRecomendacionesOpen(false)}
        cliente={clienteParaRecomendaciones}
      />

      {/* Modal para confirmar eliminación */}
      <Modal
        title="¿Eliminar contacto?"
        open={clienteAEliminar !== null}
        onOk={() => {
          if (clienteAEliminar) {
            deleteMutation.mutate(clienteAEliminar)
            setClienteAEliminar(null)
          }
        }}
        onCancel={() => setClienteAEliminar(null)}
        okText="Sí, eliminar"
        cancelText="Cancelar"
        okButtonProps={{ danger: true }}
      >
        <p>Esta acción no se puede deshacer. ¿Deseas continuar?</p>
      </Modal>
    </>
  );
}
