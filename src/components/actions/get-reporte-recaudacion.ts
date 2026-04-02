// Funciones de acceso a la API para el reporte de recaudación (asíncrono via Celery).
//
// Flujo:
//   1. startRecaudacion  → GET /api/recaudacion/?fecha_inicio=...&fecha_fin=... → devuelve task_id (202)
//   2. getAsyncReporteStatus → GET /api/ct_vencida/status/<taskId>/ → reutiliza endpoint existente
//   3. getRecaudacionDatos   → GET /api/recaudacion/datos/?fecha_inicio=...&fecha_fin=... → datos finales

import axios from 'axios';
import { AsyncJobResponse, AsyncJobStatusResponse } from '../../interfaces/reporte.response';
import { RecaudacionResponse } from '../../interfaces/reporte.response';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_KEY = import.meta.env.VITE_API_KEY || import.meta.env.VITE_API_TOKEN;

/**
 * Inicia la generación asíncrona del reporte de recaudación.
 * El backend responde con 202 y un task_id para hacer seguimiento.
 */
export const startRecaudacion = async (
  fechaInicio: string,
  fechaFin: string
): Promise<AsyncJobResponse> => {
  const url = `${BASE_URL}/api/recaudacion/`;

  const response = await axios.get<AsyncJobResponse>(url, {
    headers: { 'x-api-key': API_KEY },
    params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
  });

  return response.data;
};

/**
 * Consulta el estado de un job asíncrono de recaudación.
 * Reutiliza el endpoint de status de cartera vencida.
 */
export const getRecaudacionStatus = async (taskId: string): Promise<AsyncJobStatusResponse> => {
  const url = `${BASE_URL}/api/ct_vencida/status/${taskId}/`;

  const response = await axios.get<AsyncJobStatusResponse>(url, {
    headers: { 'x-api-key': API_KEY },
  });

  return response.data;
};

/**
 * Obtiene los datos del reporte de recaudación una vez que el job está en SUCCESS.
 */
export const getRecaudacionDatos = async (
  fechaInicio: string,
  fechaFin: string
): Promise<RecaudacionResponse[]> => {
  const url = `${BASE_URL}/api/recaudacion/datos/`;

  const response = await axios.get<RecaudacionResponse[]>(url, {
    headers: { 'x-api-key': API_KEY },
    params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
  });

  return response.data;
};
