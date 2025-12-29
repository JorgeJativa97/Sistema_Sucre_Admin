import axios from 'axios';
import { ReporteResponse, CarteraVencidaImpuestoResponse, ReporteUnionResponse } from '../../interfaces/reporte.response';

type FetchParams = {
    q?: string;
    year?: string | number;
    from?: string; // fecha inicio (ISO) opcional
    to?: string; // fecha fin (ISO) opcional
    page?: number;
    pageSize?: number;
    // Optional override to call a different endpoint (e.g. '/api/ct_vencida_impuesto')
    endpoint?: string;
    // If true, the year will be appended as a path segment: /api/endpoint/<year>/
    useYearPath?: boolean;
    // Códigos de títulos seleccionados (para carteraVencidaTitulo)
    titulos?: number[];
};

/**
 * getReporteCV
 * Fetch reporte 'ct_vencida' from backend.
 * - Sends the API key in the header 'x-api-key' (recommended by your backend).
 * - Uses VITE_API_BASE_URL if present, otherwise falls back to localhost.
 * - Accepts optional pagination params (page, pageSize) but exact param names depend on your backend pagination settings.
 */
export const getReporteCV = async ({ q, year, from, to, page, pageSize, endpoint, useYearPath, titulos }: FetchParams = {}): Promise<ReporteUnionResponse[]> => {
    try {
        const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const defaultEndpoint = '/api/ct_vencida';
        const endpointPath = endpoint || defaultEndpoint;
        // build url; if useYearPath is true and year is provided, append year as path segment
        const baseNoSlash = base.replace(/\/$/, '');
        const epWithSlash = endpointPath.startsWith('/') ? endpointPath : `/${endpointPath}`;
        const yearSegment = useYearPath && year ? `/${String(year)}` : '';
        const url = `${baseNoSlash}${epWithSlash}${yearSegment}`;

        const params: Record<string, string | number> = {};
        // include all plausible filter params so backend receives what it expects
        if (q) params.q = q;
    if (year !== undefined && year !== '' && !useYearPath) params.year = year as string | number;
        if (from) params.from = from;
        if (to) params.to = to;
        // Common DRF pagination params: page, page_size (but your backend may differ)
        if (page !== undefined) params.page = page;
        if (pageSize !== undefined) params.page_size = pageSize;
        // Enviar códigos de títulos como lista separada por comas (parámetro: codigos)
        if (titulos && titulos.length > 0) params.codigos = titulos.join(',');

        // Determinar el tipo de respuesta basado en el endpoint
        const isCarteraVencidaImpuesto = endpointPath.includes('ct_vencida_impuesto');
        
        if (isCarteraVencidaImpuesto) {
            const response = await axios.get<CarteraVencidaImpuestoResponse[]>(url, {
                params,
                headers: {
                    'x-api-key': import.meta.env.VITE_API_KEY || import.meta.env.VITE_API_TOKEN,
                },
            });
            return response.data;
        } else {
            const response = await axios.get<ReporteResponse[]>(url, {
                params,
                headers: {
                    'x-api-key': import.meta.env.VITE_API_KEY || import.meta.env.VITE_API_TOKEN,
                },
            });
            return response.data;
        }
    } catch (error) {
        console.error('Error fetching reporte CV:', error);
        throw error;
    }
};

export default getReporteCV;