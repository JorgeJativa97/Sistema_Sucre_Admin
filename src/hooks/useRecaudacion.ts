// Hook para generar el reporte de recaudación de forma asíncrona (job Celery).
//
// Flujo:
//   1. generateReport(fechaInicio, fechaFin) → inicia el job en el backend
//   2. Polling cada 2 segundos a /api/status/<taskId>/
//   3. Al recibir SUCCESS → obtiene los datos desde /api/recaudacion/datos/
//   4. Al recibir FAILURE → expone el error al componente

import { useState, useCallback, useEffect, useRef } from 'react';
import { startRecaudacion, getRecaudacionStatus, getRecaudacionDatos } from '../components/actions/get-reporte-recaudacion';
import { AsyncJobStatusResponse, RecaudacionResponse, RecaudacionRubroResponse, RecaudacionRubroAnioEmiResponse } from '../interfaces/reporte.response';

export type RecaudacionUnionResponse = RecaudacionResponse | RecaudacionRubroResponse | RecaudacionRubroAnioEmiResponse;

export interface UseRecaudacionReturn {
  isGenerating: boolean;
  progress: number;
  status: string;
  error: string | null;
  data: RecaudacionUnionResponse[];
  generateReport: (fechaInicio: string, fechaFin: string, startEndpoint?: string, datosEndpoint?: string, anio?: string) => Promise<void>;
  cancelGeneration: () => void;
}

export function useRecaudacion(): UseRecaudacionReturn {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RecaudacionUnionResponse[]>([]);

  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCompletedRef = useRef<boolean>(false);
  const fechaInicioRef = useRef<string>('');
  const fechaFinRef = useRef<string>('');
  const datosEndpointRef = useRef<string>('/api/recaudacion/datos/');
  const anioRef = useRef<string | undefined>(undefined);

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

  const pollStatus = useCallback(async (taskId: string) => {
    if (hasCompletedRef.current) return;

    try {
      const statusResponse: AsyncJobStatusResponse = await getRecaudacionStatus(
        taskId,
        fechaInicioRef.current,
        fechaFinRef.current,
        anioRef.current
      );

      setStatus(statusResponse.status);
      setProgress(statusResponse.progress || 0);

      if (statusResponse.status === 'SUCCESS') {
        hasCompletedRef.current = true;
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }

        const reportData = await getRecaudacionDatos(fechaInicioRef.current, fechaFinRef.current, datosEndpointRef.current, anioRef.current);
        setData(reportData);
        setIsGenerating(false);

      } else if (statusResponse.status === 'FAILURE') {
        hasCompletedRef.current = true;
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }
        setError(statusResponse.error || 'Error al generar el reporte de recaudación');
        setIsGenerating(false);
      }
    } catch (err) {
      console.error('Error polling recaudacion status:', err);
      hasCompletedRef.current = true;
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      setError('Error al consultar el estado del reporte');
      setIsGenerating(false);
    }
  }, []);

  const generateReport = useCallback(async (
    fechaInicio: string,
    fechaFin: string,
    startEndpoint: string = '/api/recaudacion/',
    datosEndpoint: string = '/api/recaudacion/datos/',
    anio?: string
  ) => {
    try {
      hasCompletedRef.current = false;
      fechaInicioRef.current = fechaInicio;
      fechaFinRef.current = fechaFin;
      datosEndpointRef.current = datosEndpoint;
      anioRef.current = anio;

      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }

      setIsGenerating(true);
      setError(null);
      setProgress(0);
      setData([]);
      setStatus('PENDING');

      const jobResponse = await startRecaudacion(fechaInicio, fechaFin, startEndpoint, anio);
      setStatus(jobResponse.status);

      // Polling cada 2 segundos
      const id = setInterval(() => {
        pollStatus(jobResponse.task_id);
      }, 2000);

      intervalIdRef.current = id;

      // Primera consulta a los 500ms
      setTimeout(() => pollStatus(jobResponse.task_id), 500);

    } catch (err: unknown) {
      console.error('Error generating recaudacion report:', err);
      setError(err instanceof Error ? err.message : 'Error al iniciar la generación del reporte');
      setIsGenerating(false);
      hasCompletedRef.current = true;
    }
  }, [pollStatus]);

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
