'use client';

import { Card, Alert } from 'antd';

interface ConfigVistaPlaceholderProps {
  title?: string;
}

export default function ConfigVistaPlaceholder({ title = 'Vista de Configuración' }: ConfigVistaPlaceholderProps) {
  return (
    <Card>
      <Alert
        message="Vista en Modo Configuración"
        description={`La vista "${title}" se está mostrando en modo configuración. Los elementos interactivos tienen overlays clickeables.`}
        type="info"
        showIcon
      />
      <div className="flex items-center justify-center h-64 text-gray-400">
        Haga clic en cualquier elemento para configurarlo
      </div>
    </Card>
  );
}