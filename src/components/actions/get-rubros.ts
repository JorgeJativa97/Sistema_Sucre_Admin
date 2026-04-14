import axios from 'axios';
import { RubroOption } from '../../interfaces/reporte.response';

/**
 * Obtiene la lista de rubros (catálogo para el MultiSelect de recaudación por rubro con IDs).
 * Endpoint: GET /api/rubros/
 * Cada rubro trae emi04codi (ID), emi04desd (nombre del rubro) y emmi03des (nombre del impuesto padre).
 */
export const getRubros = async (): Promise<RubroOption[]> => {
  try {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const endpoint = import.meta.env.VITE_API_RUBROS || '/api/rubros/';

    const baseNoSlash = base.replace(/\/$/, '');
    const epWithSlash = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseNoSlash}${epWithSlash}`;

    const response = await axios.get<RubroOption[]>(url, {
      headers: {
        'x-api-key': import.meta.env.VITE_API_KEY || import.meta.env.VITE_API_TOKEN,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching rubros:', error);
    throw error;
  }
};

export default getRubros;
