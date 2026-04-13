// Funciones de acceso a la API para el reporte de recaudación (asíncrono via Celery).
//
// Flujo:
//   1. startRecaudacion      → GET /api/recaudacion/?fecha_inicio=...&fecha_fin=... → devuelve task_id (202)
//   2. getRecaudacionStatus  → GET /api/status/<taskId>/                            → estado y progreso
//   3. getRecaudacionDatos   → GET /api/recaudacion/datos/?fecha_inicio=...&fecha_fin=... → datos finales

import axios from 'axios';
import { AsyncJobResponse, AsyncJobStatusResponse, RecaudacionResponse, RecaudacionRubroResponse, RecaudacionRubroAnioEmiResponse } from '../../interfaces/reporte.response';

export type RecaudacionUnionResponse = RecaudacionResponse | RecaudacionRubroResponse | RecaudacionRubroAnioEmiResponse;

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_KEY = import.meta.env.VITE_API_KEY || import.meta.env.VITE_API_TOKEN;

/**
 * Inicia la generación asíncrona del reporte de recaudación.
 * El backend responde con 202 y un task_id para hacer seguimiento.
 */
export const startRecaudacion = async (
  fechaInicio: string,
  fechaFin: string,
  endpoint: string = '/api/recaudacion/',
  anio?: string
): Promise<AsyncJobResponse> => {
  const ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL.replace(/\/$/, '')}${ep}`;

  const params: Record<string, string> = { fecha_inicio: fechaInicio, fecha_fin: fechaFin };
  if (anio) params.year = anio;

  const response = await axios.get<AsyncJobResponse>(url, {
    headers: { 'x-api-key': API_KEY },
    params,
  });

  return response.data;
};

/**
 * Consulta el estado de un job asíncrono de recaudación.
 */
export const getRecaudacionStatus = async (
  taskId: string,
  fechaInicio: string,
  fechaFin: string,
  anio?: string
): Promise<AsyncJobStatusResponse> => {
  const url = `${BASE_URL.replace(/\/$/, '')}/api/status/${taskId}/`;

  // El endpoint requiere year, fecha_inicio y fecha_fin
  // year se deriva del año de fecha_inicio salvo que se indique un anio explícito
  const year = anio || fechaInicio.split('-')[0];

  const response = await axios.get<AsyncJobStatusResponse>(url, {
    headers: { 'x-api-key': API_KEY },
    params: { year, fecha_inicio: fechaInicio, fecha_fin: fechaFin },
  });

  return response.data;
};

/**
 * Obtiene los datos del reporte de recaudación una vez que el job está en SUCCESS.
 */
export const getRecaudacionDatos = async (
  fechaInicio: string,
  fechaFin: string,
  endpoint: string = '/api/recaudacion/datos/',
  anio?: string
): Promise<RecaudacionUnionResponse[]> => {
  const ep = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL.replace(/\/$/, '')}${ep}`;

  const params: Record<string, string> = { fecha_inicio: fechaInicio, fecha_fin: fechaFin };
  if (anio) params.year = anio;

  const response = await axios.get<RecaudacionUnionResponse[]>(url, {
    headers: { 'x-api-key': API_KEY },
    params,
  });

  return response.data;
};
