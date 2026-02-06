import { useState, useCallback, useEffect } from 'react';
import { startAsyncReporte, getAsyncReporteStatus, getAsyncReporteData } from '../components/actions/get-reporte-async';
import { AsyncJobStatusResponse } from '../interfaces/reporte.response';
import { ReporteUnionResponse } from '../interfaces/reporte.response';

export interface UseAsyncReporteReturn {
  // Estados
  isGenerating: boolean;
  progress: number;
  status: string;
  error: string | null;
  data: ReporteUnionResponse[];
  
  // Acciones
  generateReport: (endpoint: string, year: string | number, useYearPath?: boolean) => Promise<void>;
  cancelGeneration: () => void;
}

export function useAsyncReporte(): UseAsyncReporteReturn {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReporteUnionResponse[]>([]);
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);

  // Función para limpiar el polling
  const cancelGeneration = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsGenerating(false);
    setProgress(0);
    setStatus('');
  }, [intervalId]);

  // Función para consultar el estado del reporte
  const pollStatus = useCallback(async (id: string) => {
    try {
      const statusResponse: AsyncJobStatusResponse = await getAsyncReporteStatus(id);
      
      setStatus(statusResponse.status);
      setProgress(statusResponse.progress || 0);

      if (statusResponse.status === 'SUCCESS') {
        // Obtener los datos del reporte
        const reportData = await getAsyncReporteData(id);
        setData(reportData);
        setIsGenerating(false);
        cancelGeneration();
      } else if (statusResponse.status === 'FAILURE') {
        setError(statusResponse.error || 'Error al generar el reporte');
        setIsGenerating(false);
        cancelGeneration();
      }
    } catch (err) {
      console.error('Error polling status:', err);
      setError('Error al consultar el estado del reporte');
      cancelGeneration();
    }
  }, [cancelGeneration]);

  // Función principal para generar el reporte
  const generateReport = useCallback(async (
    endpoint: string,
    year: string | number,
    useYearPath: boolean = true
  ) => {
    try {
      setIsGenerating(true);
      setError(null);
      setProgress(0);
      setData([]);
      setStatus('PENDING');

      // Iniciar el job asíncrono
      const jobResponse = await startAsyncReporte(endpoint, year, useYearPath);
      
      setStatus(jobResponse.status);

      // Iniciar polling cada 2 segundos
      const id = setInterval(() => {
        pollStatus(jobResponse.task_id);
      }, 2000);
      
      setIntervalId(id);

    } catch (err: unknown) {
      console.error('Error generating report:', err);
      setError(err instanceof Error ? err.message : 'Error al iniciar la generación del reporte');
      setIsGenerating(false);
    }
  }, [pollStatus]);

  // Limpiar el intervalo cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return {
    isGenerating,
    progress,
    status,
    error,
    data,
    generateReport,
    cancelGeneration,
  };
}