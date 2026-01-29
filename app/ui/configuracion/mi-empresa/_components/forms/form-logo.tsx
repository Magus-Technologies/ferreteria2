"use client";

import { Form, App, Button } from "antd";
import { useEffect, useState } from "react";
import { FaUpload } from "react-icons/fa";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import LabelBase from "~/components/form/label-base";
import { empresaApi } from "~/lib/api/empresa";
import { QueryKeys } from "~/app/_lib/queryKeys";
import type { UploadFile } from 'antd/es/upload/interface';
import Upload from "antd/es/upload";

interface FormLogoProps {
  empresaId: number;
}

export default function FormLogo({ empresaId }: FormLogoProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const { message } = App.useApp();

  // Query para obtener datos de la empresa
  const { data: empresaData, isLoading } = useQuery({
    queryKey: [QueryKeys.EMPRESAS, empresaId],
    queryFn: () => empresaApi.getById(empresaId),
    enabled: !!empresaId,
  });

  // Mutación para actualizar
  const updateMutation = useMutation({
    mutationFn: (formData: FormData) => empresaApi.uploadLogo(empresaId, formData),
    onSuccess: (response) => {
      console.log('✅ Logo Response completa:', response);
      console.log('✅ response.data:', response.data);
      console.log('✅ response.data?.message:', response.data?.message);
      
      if (response.data?.data) {
        const mensaje = response.data?.message || "Logo actualizado exitosamente";
        console.log('📢 Mostrando mensaje:', mensaje);
        message.success(mensaje);
        queryClient.invalidateQueries({ queryKey: [QueryKeys.EMPRESAS] });
        setFileList([]);
      } else if (response.error) {
        console.log('❌ Error en response:', response.error);
        message.error(response.error.message);
      } else {
        console.log('⚠️ Respuesta inesperada:', response);
      }
    },
    onError: (error) => {
      console.error('❌ Error al actualizar logo:', error);
      message.error("Error al actualizar logo");
    },
  });

  // Cargar datos al montar
  useEffect(() => {
    console.log('🔄 useEffect - empresaData:', empresaData);
    if (empresaData?.data?.data) {
      const empresa = empresaData.data.data;
      console.log('📊 Datos de empresa:', empresa);
      console.log('🖼️ Logo actual:', empresa.logo);
      console.log('🌐 Logo URL:', empresa.logo_url);
      if (empresa.logo_url) {
        setLogoUrl(empresa.logo_url);
        // Agregar el logo existente al fileList para que no muestre el botón de subir
        setFileList([
          {
            uid: '-1',
            name: 'logo.png',
            status: 'done',
            url: empresa.logo_url,
          },
        ]);
      }
    }
  }, [empresaData, form]);

  // Manejar cambio de archivo
  const handleChange = (info: any) => {
    console.log('📸 handleChange ejecutado:', info);
    let newFileList = [...info.fileList];

    // Limitar a solo 1 archivo
    newFileList = newFileList.slice(-1);

    setFileList(newFileList);

    // Mostrar preview
    if (info.file.originFileObj) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoUrl(e.target?.result as string);
      };
      reader.readAsDataURL(info.file.originFileObj);
    }
  };

  const handleSubmit = async () => {
    console.log('📤 Enviando logo...', { fileList });
    if (fileList.length === 0) {
      message.warning('Por favor, selecciona un logo');
      return;
    }

    const formData = new FormData();
    formData.append('logo', fileList[0].originFileObj as File);

    console.log('🚀 Ejecutando mutación con FormData');
    updateMutation.mutate(formData);
  };

  // Validar el tipo y tamaño del archivo
  const beforeUpload = (file: File) => {
    console.log('🔍 beforeUpload - Validando archivo:', file.name, file.type, file.size);
    
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Solo puedes subir archivos de imagen');
      return Upload.LIST_IGNORE;
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('La imagen debe ser menor a 2MB');
      return Upload.LIST_IGNORE;
    }

    console.log('✅ Archivo válido, procesando...');
    return false; // No subir automáticamente, solo procesamos local
  };

  const loading = updateMutation.isPending || isLoading;

  return (
    <Form
      form={form}
      onFinish={handleSubmit}
      layout="vertical"
      autoComplete="off"
      className="space-y-6"
    >
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Logo de la Empresa</h3>

        <div className="flex flex-col items-center gap-6">
          {/* Upload */}
          <div className="w-full max-w-md">
            <LabelBase label="Subir Logo:" orientation="column">
              <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={handleChange}
                beforeUpload={beforeUpload}
                maxCount={1}
                accept="image/*"
                onRemove={() => {
                  setFileList([]);
                  setLogoUrl(null);
                }}
              >
                {fileList.length === 0 && (
                  <div className="flex flex-col items-center">
                    <FaUpload size={24} className="text-blue-600 mb-2" />
                    <div className="text-sm text-gray-600">Subir Imagen</div>
                    <div className="text-xs text-gray-400 mt-1">PNG, JPG (máx. 2MB)</div>
                  </div>
                )}
              </Upload>
            </LabelBase>
          </div>
        </div>
      </div>

      {/* Botón Guardar */}
      <div className="flex justify-start pt-4">
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          disabled={loading}
          className="bg-cyan-500 hover:bg-cyan-600 px-8"
        >
          Guardar
        </Button>
      </div>
    </Form>
  );
}
