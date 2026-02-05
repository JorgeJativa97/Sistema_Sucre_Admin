import React from 'react';

interface ReportProgressProps {
  status: string;
  progress: number;
  onCancel?: () => void;
}

const ReportProgress: React.FC<ReportProgressProps> = ({ status, progress, onCancel }) => {
  const getStatusMessage = () => {
    switch (status) {
      case 'PENDING':
        return 'Iniciando generación del reporte...';
      case 'PROCESSING':
        return 'Generando reporte...';
      case 'SUCCESS':
        return '¡Reporte generado exitosamente!';
      case 'FAILURE':
        return 'Error al generar el reporte';
      default:
        return 'Procesando...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-500';
      case 'FAILURE':
        return 'bg-red-500';
      case 'PROCESSING':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getStatusMessage()}
          </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {progress}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div
            className={`h-2.5 rounded-full transition-all duration-300 ${getStatusColor()}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {status === 'PROCESSING' && onCancel && (
        <button
          onClick={onCancel}
          className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Cancelar
        </button>
      )}

      {status === 'PROCESSING' && (
        <div className="mt-4 flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            Esto puede tardar varios minutos...
          </span>
        </div>
      )}
    </div>
  );
};

export default ReportProgress;