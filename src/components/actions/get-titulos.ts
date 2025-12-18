import axios from 'axios';
import { CarteraVencidaTitulo } from '../../interfaces/reporte.response';

/**
 * Obtiene la lista de títulos para cartera vencida título
 * Endpoint: /api/ct_vencida_titulo
 */
export const getTitulos = async (): Promise<CarteraVencidaTitulo[]> => {
    try {
        const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const endpoint = import.meta.env.VITE_API_CT_VENCIDA_TITULO || '/api/ct_vencida_titulo';
        
        const baseNoSlash = base.replace(/\/$/, '');
        const epWithSlash = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `${baseNoSlash}${epWithSlash}`;

        const response = await axios.get<CarteraVencidaTitulo[]>(url, {
            headers: {
                'x-api-key': import.meta.env.VITE_API_KEY || import.meta.env.VITE_API_TOKEN,
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching títulos:', error);
        throw error;
    }
};

export default getTitulos;
