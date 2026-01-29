"use client";

import { Select, Spin } from "antd";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ubigeoApi } from "~/lib/api/ubigeo";
import { QueryKeys } from "~/app/_lib/queryKeys";

interface SelectUbigeoProps {
  value?: {
    departamento?: string;
    provincia?: string;
    distrito?: string;
  };
  onChange?: (value: {
    departamento: string;
    provincia: string;
    distrito: string;
    ubigeo_id?: number;
  }) => void;
}

export default function SelectUbigeo({ value, onChange }: SelectUbigeoProps) {
  const [selectedDepCodigo, setSelectedDepCodigo] = useState<string | undefined>();
  const [selectedProvCodigo, setSelectedProvCodigo] = useState<string | undefined>();
  const [selectedDist, setSelectedDist] = useState<number | undefined>();

  // Query departamentos
  const { data: departamentos, isLoading: loadingDep } = useQuery({
    queryKey: [QueryKeys.UBIGEO, 'departamentos'],
    queryFn: () => ubigeoApi.getDepartamentos(),
  });

  // Debug: Log cuando cambia el value prop
  useEffect(() => {
    console.log('SelectUbigeo - value cambió:', value);
    console.log('SelectUbigeo - departamentos cargados:', departamentos?.length);
  }, [value, departamentos]);

  // Query provincias
  const { data: provincias, isLoading: loadingProv } = useQuery({
    queryKey: [QueryKeys.UBIGEO, 'provincias', selectedDepCodigo],
    queryFn: () => ubigeoApi.getProvincias(selectedDepCodigo!),
    enabled: !!selectedDepCodigo,
  });

  // Query distritos
  const { data: distritos, isLoading: loadingDist } = useQuery({
    queryKey: [QueryKeys.UBIGEO, 'distritos', selectedDepCodigo, selectedProvCodigo],
    queryFn: () => ubigeoApi.getDistritos(selectedDepCodigo!, selectedProvCodigo!),
    enabled: !!selectedDepCodigo && !!selectedProvCodigo,
  });

  // Actualizar cuando cambia el value externo o cuando se cargan los departamentos
  useEffect(() => {
    console.log('=== useEffect DEPARTAMENTO ejecutándose ===');
    console.log('value?.departamento:', value?.departamento);
    console.log('departamentos existe:', !!departamentos);
    console.log('departamentos.length:', departamentos?.length);
    console.log('selectedDepCodigo actual:', selectedDepCodigo);

    if (value?.departamento && departamentos && departamentos.length > 0) {
      console.log('Buscando departamento:', value.departamento);
      console.log('Departamentos disponibles:', departamentos.map(d => d.nombre));

      const dep = departamentos.find(d =>
        d.nombre.toUpperCase().trim() === value.departamento?.toUpperCase().trim()
      );

      console.log('Departamento encontrado:', dep);

      if (dep && dep.departamento !== selectedDepCodigo) {
        console.log('✅ Actualizando selectedDepCodigo a:', dep.departamento);
        setSelectedDepCodigo(dep.departamento);
      } else if (!dep) {
        console.log('❌ No se encontró departamento que coincida');
      } else if (dep.departamento === selectedDepCodigo) {
        console.log('⏭️ Departamento ya está seleccionado, saltando');
      }
    }
  }, [value?.departamento, departamentos, selectedDepCodigo]);

  // Actualizar selectedProvCodigo cuando se cargan las provincias
  useEffect(() => {
    if (value?.provincia && provincias && provincias.length > 0) {
      console.log('Buscando provincia:', value.provincia);
      console.log('Provincias disponibles:', provincias.map(p => p.nombre));

      const prov = provincias.find(p =>
        p.nombre.toUpperCase().trim() === value.provincia?.toUpperCase().trim()
      );

      console.log('Provincia encontrada:', prov);

      if (prov && prov.provincia !== selectedProvCodigo) {
        console.log('Actualizando selectedProvCodigo a:', prov.provincia);
        setSelectedProvCodigo(prov.provincia);
      }
    }
  }, [value?.provincia, provincias, selectedProvCodigo]);

  // Actualizar selectedDist cuando se cargan los distritos
  useEffect(() => {
    if (value?.distrito && distritos && distritos.length > 0) {
      console.log('Buscando distrito:', value.distrito);
      console.log('Distritos disponibles:', distritos.map(d => d.nombre));

      const distrito = distritos.find(d =>
        d.nombre.toUpperCase().trim() === value.distrito?.toUpperCase().trim()
      );

      console.log('Distrito encontrado:', distrito);

      if (distrito && distrito.id_ubigeo !== selectedDist) {
        console.log('Actualizando selectedDist a:', distrito.id_ubigeo);
        setSelectedDist(distrito.id_ubigeo);
      }
    }
  }, [value?.distrito, distritos, selectedDist]);

  const handleDepChange = (codigo: string, option: any) => {
    setSelectedDepCodigo(codigo);
    setSelectedProvCodigo(undefined);
    setSelectedDist(undefined);
    onChange?.({
      departamento: option.label,
      provincia: '',
      distrito: '',
    });
  };

  const handleProvChange = (codigo: string, option: any) => {
    setSelectedProvCodigo(codigo);
    setSelectedDist(undefined);
    onChange?.({
      departamento: departamentos?.find(d => d.departamento === selectedDepCodigo)?.nombre || '',
      provincia: option.label,
      distrito: '',
    });
  };

  const handleDistChange = (id_ubigeo: number, option: any) => {
    setSelectedDist(id_ubigeo);
    onChange?.({
      departamento: departamentos?.find(d => d.departamento === selectedDepCodigo)?.nombre || '',
      provincia: provincias?.find(p => p.provincia === selectedProvCodigo)?.nombre || '',
      distrito: option.label,
      ubigeo_id: id_ubigeo,
    });
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Departamento */}
      <Select
        showSearch
        placeholder="Departamento"
        value={selectedDepCodigo}
        onChange={handleDepChange}
        loading={loadingDep}
        notFoundContent={loadingDep ? <Spin size="small" /> : null}
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        options={departamentos?.map(d => ({
          value: d.departamento,
          label: d.nombre,
        }))}
        className="w-full"
        variant="filled"
      />

      {/* Provincia */}
      <Select
        showSearch
        placeholder="Provincia"
        value={selectedProvCodigo}
        onChange={handleProvChange}
        loading={loadingProv}
        disabled={!selectedDepCodigo}
        notFoundContent={loadingProv ? <Spin size="small" /> : null}
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        options={provincias?.map(p => ({
          value: p.provincia,
          label: p.nombre,
        }))}
        className="w-full"
        variant="filled"
      />

      {/* Distrito */}
      <Select
        showSearch
        placeholder="Distrito"
        value={selectedDist}
        onChange={handleDistChange}
        loading={loadingDist}
        disabled={!selectedProvCodigo}
        notFoundContent={loadingDist ? <Spin size="small" /> : null}
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        options={distritos?.map(d => ({
          value: d.id_ubigeo,
          label: d.nombre,
        }))}
        className="w-full"
        variant="filled"
      />
    </div>
  );
}
