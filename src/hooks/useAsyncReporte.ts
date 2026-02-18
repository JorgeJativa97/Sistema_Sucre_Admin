import { useState, useCallback, useEffect, useRef } from 'react';
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
  
  // 🔥 NUEVO: Usar useRef en lugar de state para el intervalId
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // 🔥 NUEVO: Flag para evitar múltiples llamadas
  const hasCompletedRef = useRef<boolean>(false);

  // Función para limpiar el polling
  const cancelGeneration = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    setIsGenerating(false);
    setProgress(0);
    setStatus('');
    hasCompletedRef.current = false; // 🔥 NUEVO
  }, []);

  // Función para consultar el estado del reporte
  const pollStatus = useCallback(async (id: string) => {
    // 🔥 NUEVO: Si ya completó, no hacer nada
    if (hasCompletedRef.current) {
      return;
    }

    try {
      const statusResponse: AsyncJobStatusResponse = await getAsyncReporteStatus(id);
      
      console.log('📊 Polling status:', statusResponse.status, 'Progress:', statusResponse.progress);
      
      setStatus(statusResponse.status);
      setProgress(statusResponse.progress || 0);

      if (statusResponse.status === 'SUCCESS') {
        // 🔥 NUEVO: Marcar como completado ANTES de obtener datos
        hasCompletedRef.current = true;
        
        // 🔥 NUEVO: Detener el polling INMEDIATAMENTE
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }

        console.log('✅ Reporte completado, obteniendo datos...');
        
        // Obtener los datos del reporte
        const reportData = await getAsyncReporteData(id);
        
        console.log('✅ Datos obtenidos:', reportData.length, 'registros');
        
        setData(reportData);
        setIsGenerating(false);
        
      } else if (statusResponse.status === 'FAILURE') {
        hasCompletedRef.current = true; // 🔥 NUEVO
        
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }
        
        setError(statusResponse.error || 'Error al generar el reporte');
        setIsGenerating(false);
      }
      // 🔥 NUEVO: Si está PENDING o PROCESSING, continuar polling (no hacer nada aquí)
      
    } catch (err) {
      console.error('❌ Error polling status:', err);
      hasCompletedRef.current = true; // 🔥 NUEVO
      
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      
      setError('Error al consultar el estado del reporte');
      setIsGenerating(false);
    }
  }, []); // 🔥 MODIFICADO: Sin dependencias para evitar recreaciones

  // Función principal para generar el reporte
  const generateReport = useCallback(async (
    endpoint: string,
    year: string | number,
    useYearPath: boolean = true
  ) => {
    try {
      // 🔥 NUEVO: Limpiar estados previos
      hasCompletedRef.current = false;
      
      // Limpiar intervalo anterior si existe
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }

      setIsGenerating(true);
      setError(null);
      setProgress(0);
      setData([]);
      setStatus('PENDING');

      console.log('🚀 Iniciando reporte:', endpoint, year);

      // Iniciar el job asíncrono
      const jobResponse = await startAsyncReporte(endpoint, year, useYearPath);
      
      console.log('📝 Job iniciado:', jobResponse.task_id, 'Status:', jobResponse.status);
      
      setStatus(jobResponse.status);

      // 🔥 MODIFICADO: Iniciar polling cada 2 segundos
      const id = setInterval(() => {
        pollStatus(jobResponse.task_id);
      }, 2000);
      
      intervalIdRef.current = id;

      // 🔥 NUEVO: Primera consulta inmediata
      setTimeout(() => pollStatus(jobResponse.task_id), 500);

    } catch (err: unknown) {
      console.error('❌ Error generating report:', err);
      setError(err instanceof Error ? err.message : 'Error al iniciar la generación del reporte');
      setIsGenerating(false);
      hasCompletedRef.current = true; // 🔥 NUEVO
    }
  }, [pollStatus]);

  // Limpiar el intervalo cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, []);

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