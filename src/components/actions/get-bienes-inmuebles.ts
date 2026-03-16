// Función para obtener todos los registros de bienes inmuebles desde el backend.
// El endpoint no acepta filtros; devuelve el conjunto completo de datos.

import axios from 'axios';
import { BienesInmueblesResponse } from '../../interfaces/reporte.response';

export const getBienesInmuebles = async (): Promise<BienesInmueblesResponse[]> => {
    try {
        const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const url = `${base.replace(/\/$/, '')}/api/bienes_inmuebles/`;

        const response = await axios.get<BienesInmueblesResponse[]>(url, {
            headers: {
                'x-api-key': import.meta.env.VITE_API_KEY || import.meta.env.VITE_API_TOKEN,
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching bienes inmuebles:', error);
        throw error;
    }
};

export default getBienesInmuebles;
