'use client';

import { Modal, Button, Divider } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

interface DecisionModalProps {
  visible: boolean;
  itemLabel: string;
  rolNombre: string;
  isLoading: boolean;
  onMostrar: () => void;
  onOcultar: () => void;
  onCancel: () => void;
}

export default function DecisionModal({
  visible,
  itemLabel,
  rolNombre,
  isLoading,
  onMostrar,
  onOcultar,
  onCancel,
}: DecisionModalProps) {
  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={500}
      centered
    >
      <div className="text-center py-6">
        <h3 className="text-xl font-bold mb-4">¿Mostrar u Ocultar?</h3>
        <p className="text-gray-600 mb-2">
          Elemento: <strong>{itemLabel}</strong>
        </p>
        <p className="text-gray-600 mb-6">
          Para el rol: <strong>{rolNombre}</strong>
        </p>

        <Divider />

        <div className="flex gap-4 justify-center">
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={onMostrar}
            loading={isLoading}
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-600"
          >
            Mostrar
          </Button>
          <Button
            danger
            size="large"
            icon={<CloseCircleOutlined />}
            onClick={onOcultar}
            loading={isLoading}
            disabled={isLoading}
          >
            Ocultar
          </Button>
        </div>
      </div>
    </Modal>
  );
}