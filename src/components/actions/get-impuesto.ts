import axios from 'axios';
import { ImpuestoOption } from '../../interfaces/reporte.response';

/**
 * Obtiene la lista de impuestos (catálogo para el MultiSelect de recaudación por impuesto con IDs).
 * Endpoint: GET /api/impuesto/
 * Cada impuesto trae EMI03CODI (ID) y EMI03DES (nombre del impuesto).
 */
export const getImpuesto = async (): Promise<ImpuestoOption[]> => {
  try {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const endpoint = import.meta.env.VITE_API_IMPUESTOS || '/api/impuesto/';

    const baseNoSlash = base.replace(/\/$/, '');
    const epWithSlash = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseNoSlash}${epWithSlash}`;

    const response = await axios.get<ImpuestoOption[]>(url, {
      headers: {
        'x-api-key': import.meta.env.VITE_API_KEY || import.meta.env.VITE_API_TOKEN,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching impuesto:', error);
    throw error;
  }
};

export default getImpuesto;
