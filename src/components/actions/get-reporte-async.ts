// Funciones de acceso a la API para reportes asíncronos generados por Celery.
//
// Flujo del backend:
//   1. startAsyncReporte    → POST/GET al endpoint del reporte → backend encola el job en Celery
//   2. getAsyncReporteStatus → GET /api/status/<taskId>/        → devuelve estado y progreso
//   3. getAsyncReporteData   → GET /api/ct_vencida/datos/<year>/ → devuelve JSON guardado en disco

import axios from 'axios';
import { AsyncJobResponse, AsyncJobStatusResponse, ReporteUnionResponse } from '../../interfaces/reporte.response';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_KEY = import.meta.env.VITE_API_KEY || import.meta.env.VITE_API_TOKEN;

/**
 * Inicia la generación asíncrona de un reporte en el backend.
 * El backend responde inmediatamente con un task_id para hacer seguimiento.
 */
export const startAsyncReporte = async (
  endpoint: string,
  year: string | number,
  useYearPath: boolean = true,
  titulos?: number[]
): Promise<AsyncJobResponse> => {
  try {
    const baseNoSlash = BASE_URL.replace(/\/$/, '');
    const epWithSlash = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const yearSegment = useYearPath && year ? `/${String(year)}` : '';
    const url = `${baseNoSlash}${epWithSlash}${yearSegment}`;

    const params: Record<string, string | number> = useYearPath ? {} : { year };
    if (titulos && titulos.length > 0) params.codigos = titulos.join(',');

    const response = await axios.get<AsyncJobResponse>(url, {
      headers: {
        'x-api-key': API_KEY,
      },
      params,
    });

    return response.data;
  } catch (error) {
    console.error('Error starting async report:', error);
    throw error;
  }
};

/**
 * Consulta el estado de un reporte asíncrono
 */
export const getAsyncReporteStatus = async (
  taskId: string
): Promise<AsyncJobStatusResponse> => {
  try {
    const url = `${BASE_URL}/api/status/${taskId}/`;

    const response = await axios.get<AsyncJobStatusResponse>(url, {
      headers: {
        'x-api-key': API_KEY,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error checking async report status:', error);
    throw error;
  }
};

/**
 * Obtiene los datos del reporte desde el archivo JSON generado por Celery.
 * Llama al endpoint de datos correspondiente al tipo de reporte.
 * Por defecto usa /api/ct_vencida/datos/<year>/.
 */
export const getAsyncReporteData = async (
  year: string | number,
  datosEndpoint: string = '/api/ct_vencida/datos',
  titulos?: number[]
): Promise<ReporteUnionResponse[]> => {
  try {
    const baseNoSlash = BASE_URL.replace(/\/$/, '');
    const epWithSlash = datosEndpoint.startsWith('/') ? datosEndpoint : `/${datosEndpoint}`;
    const url = `${baseNoSlash}${epWithSlash}/${year}/`;

    const params: Record<string, string> = {};
    if (titulos && titulos.length > 0) params.codigos = titulos.join(',');

    const response = await axios.get<ReporteUnionResponse[]>(url, {
      headers: {
        'x-api-key': API_KEY,
      },
      params,
    });

    return response.data;
  } catch (error) {
    console.error('Error getting async report data:', error);
    throw error;
  }
};