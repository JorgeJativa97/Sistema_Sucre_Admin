// Definiciones de columnas para la tabla de reportes.
// Cada función retorna la configuración de columnas correspondiente
// al tipo de reporte seleccionado.

import { ColumnaConfig } from '../components/common/TablaAdmin';
import { ReporteResponse, CarteraVencidaImpuestoResponse, ReporteUnionResponse } from '../interfaces/reporte.response';

// Type guard: verifica si un objeto es de tipo CarteraVencidaImpuestoResponse
// inspeccionando campos únicos de esa interfaz (COD e IMPUESTO)
export const isCarteraVencidaImpuesto = (data: unknown): data is CarteraVencidaImpuestoResponse => {
  return data !== null && typeof data === 'object' && 'COD' in data && 'IMPUESTO' in data;
};

// Columnas para el reporte de Cartera Vencida general (por ciudadano)
export const getCarteraVencidaColumns = (): ColumnaConfig<ReporteResponse>[] => [
  { campo: 'cedula', header: 'Cédula' },
  { campo: 'nombre', header: 'Nombre' },
  { campo: 'ciu', header: 'CIU', ancho: '80px' },
  { campo: 'emision', header: 'Emisión' },
  { campo: 'total', header: 'Total ($)' },
];

// Columnas para el reporte de Cartera Vencida agrupada por tipo de impuesto
export const getCarteraVencidaImpuestoColumns = (): ColumnaConfig<CarteraVencidaImpuestoResponse>[] => [
  { campo: 'COD', header: 'Código', ancho: '100px' },
  { campo: 'IMPUESTO', header: 'Impuesto', ancho: '200px' },
  { campo: 'ANIO', header: 'Año', ancho: '80px' },
  { campo: 'EMISION', header: 'Emisión ($)', ancho: '120px' },
  { campo: 'INTERES', header: 'Interés ($)', ancho: '120px' },
  { campo: 'COACTIVA', header: 'Coactiva ($)', ancho: '120px' },
  { campo: 'RECARGO', header: 'Recargo ($)', ancho: '120px' },
  { campo: 'DESCUENTO', header: 'Descuento ($)', ancho: '120px' },
  { campo: 'IVA', header: 'IVA ($)', ancho: '100px' },
  { campo: 'TOTAL', header: 'Total ($)', ancho: '120px' },
];

// Retorna las columnas apropiadas según el tipo de reporte activo.
// Primero verifica por nombre del reporte, luego por inferencia de estructura de datos.
export const getColumnsForReporte = (reporteType: string, sampleData?: ReporteUnionResponse[]): ColumnaConfig<ReporteUnionResponse>[] => {
  if (reporteType === 'carteraVencidaImpuesto' || (sampleData && sampleData.length > 0 && isCarteraVencidaImpuesto(sampleData[0]))) {
    return getCarteraVencidaImpuestoColumns() as ColumnaConfig<ReporteUnionResponse>[];
  }
  return getCarteraVencidaColumns() as ColumnaConfig<ReporteUnionResponse>[];
};