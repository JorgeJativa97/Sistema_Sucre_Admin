// Obtiene el PDF de un comprobante desde el backend como blob.
// Endpoints:
//   Pago total: GET /api/comprobante/<emi01codi>/
//   Abono:      GET /api/comprobante/<emi01codi>/<nro_abono>/

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_KEY  = import.meta.env.VITE_API_KEY || import.meta.env.VITE_API_TOKEN;

export const getComprobante = async (
  emi01codi: number,
  nroAbono?: number
): Promise<Blob> => {
  const base = BASE_URL.replace(/\/$/, '');
  const url  = nroAbono !== undefined
    ? `${base}/api/comprobante/${emi01codi}/${nroAbono}/`
    : `${base}/api/comprobante/${emi01codi}/`;

  const response = await axios.get<Blob>(url, {
    responseType: 'blob',
    headers: {
      'x-api-key': API_KEY,
    },
  });

  return response.data;
};
