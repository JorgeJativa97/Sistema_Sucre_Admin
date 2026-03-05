import axios from 'axios';
import { AsyncJobResponse, AsyncJobStatusResponse } from '../../interfaces/reporte.response';
import { ReporteUnionResponse } from '../../interfaces/reporte.response';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_KEY = import.meta.env.VITE_API_KEY || import.meta.env.VITE_API_TOKEN;

/**
 * Inicia la generación asíncrona de un reporte
 */
export const startAsyncReporte = async (
  endpoint: string,
  year: string | number,
  useYearPath: boolean = true
): Promise<AsyncJobResponse> => {
  try {
    const baseNoSlash = BASE_URL.replace(/\/$/, '');
    const epWithSlash = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const yearSegment = useYearPath && year ? `/${String(year)}` : '';
    const url = `${baseNoSlash}${epWithSlash}${yearSegment}`;

    const response = await axios.get<AsyncJobResponse>(url, {
      headers: {
        'x-api-key': API_KEY,
      },
      params: useYearPath ? {} : { year },
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
    const url = `${BASE_URL}/api/ct_vencida/status/${taskId}/`;

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
 * Llama al endpoint /api/ct_vencida/datos/<year>/ que lee el archivo guardado
 * en el servidor (los datos no se almacenan en Redis para no saturarlo).
 */
export const getAsyncReporteData = async (
  year: string | number
): Promise<ReporteUnionResponse[]> => {
  try {
    const url = `${BASE_URL}/api/ct_vencida/datos/${year}/`;

    const response = await axios.get<ReporteUnionResponse[]>(url, {
      headers: {
        'x-api-key': API_KEY,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error getting async report data:', error);
    throw error;
  }
};