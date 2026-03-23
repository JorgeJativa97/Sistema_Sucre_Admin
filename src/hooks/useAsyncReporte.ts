// Hook para generar reportes grandes de forma asíncrona mediante jobs Celery.
//
// Flujo:
//   1. generateReport() → llama al endpoint que inicia el job en el backend
//   2. Polling cada 2 segundos a /api/ct_vencida/status/<taskId>/
//   3. Al recibir SUCCESS → obtiene los datos desde /api/ct_vencida/datos/<year>/
//   4. Al recibir FAILURE → expone el error al componente
//
// Nota: el endpoint de datos está hardcodeado para ct_vencida en getAsyncReporteData.
// Si en el futuro se necesita un endpoint de datos distinto por tipo de reporte,
// se deberá parametrizar getAsyncReporteData.

import { useState, useCallback, useEffect, useRef } from 'react';
import { startAsyncReporte, getAsyncReporteStatus, getAsyncReporteData } from '../components/actions/get-reporte-async';
import { AsyncJobStatusResponse, ReporteUnionResponse } from '../interfaces/reporte.response';

export interface UseAsyncReporteReturn {
  isGenerating: boolean;
  progress: number;
  status: string;
  error: string | null;
  data: ReporteUnionResponse[];
  generateReport: (endpoint: string, year: string | number, useYearPath?: boolean, datosEndpoint?: string, titulos?: number[]) => Promise<void>;
  cancelGeneration: () => void;
}

export function useAsyncReporte(): UseAsyncReporteReturn {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReporteUnionResponse[]>([]);

  // useRef para el intervalo del polling (evita re-renders innecesarios)
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Flag para evitar llamadas duplicadas una vez que el job completó
  const hasCompletedRef = useRef<boolean>(false);
  // Año guardado en ref para usarlo en getAsyncReporteData sin necesidad de estado
  const yearRef = useRef<string | number>('');
  // Endpoint de datos guardado en ref para usarlo en getAsyncReporteData
  const datosEndpointRef = useRef<string>('/api/ct_vencida/datos');

  // Detiene el polling y reinicia los estados al estado inicial
  const cancelGeneration = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    setIsGenerating(false);
    setProgress(0);
    setStatus('');
    hasCompletedRef.current = false;
  }, []);

  // Consulta el estado del job por su ID.
  // Si está en PENDING o PROCESSING, no hace nada (el polling continúa).
  // Sin dependencias en useCallback para evitar recreaciones que reiniciarían el intervalo.
  const pollStatus = useCallback(async (id: string) => {
    if (hasCompletedRef.current) return;

    try {
      const statusResponse: AsyncJobStatusResponse = await getAsyncReporteStatus(id);

      console.log('Polling status:', statusResponse.status, 'Progress:', statusResponse.progress);

      setStatus(statusResponse.status);
      setProgress(statusResponse.progress || 0);

      if (statusResponse.status === 'SUCCESS') {
        // Marcar como completado antes de obtener datos para bloquear llamadas duplicadas
        hasCompletedRef.current = true;

        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }

        console.log('Reporte completado, obteniendo datos...');
        const reportData = await getAsyncReporteData(yearRef.current, datosEndpointRef.current);
        console.log('Datos obtenidos:', reportData.length, 'registros');

        setData(reportData);
        setIsGenerating(false);

      } else if (statusResponse.status === 'FAILURE') {
        hasCompletedRef.current = true;

        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }

        setError(statusResponse.error || 'Error al generar el reporte');
        setIsGenerating(false);
      }
      // PENDING y PROCESSING: no hacer nada, el intervalo seguirá consultando

    } catch (err) {
      console.error('Error polling status:', err);
      hasCompletedRef.current = true;

      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }

      setError('Error al consultar el estado del reporte');
      setIsGenerating(false);
    }
  }, []); // Sin dependencias para evitar recreaciones

  // Inicia el job asíncrono en el backend y arranca el polling de estado
  const generateReport = useCallback(async (
    endpoint: string,
    year: string | number,
    useYearPath: boolean = true,
    datosEndpoint: string = '/api/ct_vencida/datos',
    titulos?: number[]
  ) => {
    try {
      // Limpiar estado de ejecución anterior
      hasCompletedRef.current = false;
      yearRef.current = year;
      datosEndpointRef.current = datosEndpoint;

      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }

      setIsGenerating(true);
      setError(null);
      setProgress(0);
      setData([]);
      setStatus('PENDING');

      console.log('Iniciando reporte:', endpoint, year);

      const jobResponse = await startAsyncReporte(endpoint, year, useYearPath, titulos);

      console.log('Job iniciado:', jobResponse.task_id, 'Status:', jobResponse.status);

      setStatus(jobResponse.status);

      // Polling cada 2 segundos
      const id = setInterval(() => {
        pollStatus(jobResponse.task_id);
      }, 2000);

      intervalIdRef.current = id;

      // Primera consulta inmediata a los 500ms (no esperar el primer intervalo de 2s)
      setTimeout(() => pollStatus(jobResponse.task_id), 500);

    } catch (err: unknown) {
      console.error('Error generating report:', err);
      setError(err instanceof Error ? err.message : 'Error al iniciar la generación del reporte');
      setIsGenerating(false);
      hasCompletedRef.current = true;
    }
  }, [pollStatus]);

  // Limpieza: cancelar el intervalo cuando el componente que usa este hook se desmonta
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