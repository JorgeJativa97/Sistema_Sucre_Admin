// Hook para obtener datos de reportes y exportarlos a Excel.
//
// Responsabilidades:
//   - getAllData: obtiene todos los registros sin límite de paginación para exportación Excel
//   - resetConsulted: resetea el estado al cambiar de tipo de reporte
//   - loading: true mientras getAllData está en curso (para deshabilitar botones)

import { useState, useCallback } from 'react';
import getReporteCV from '../components/actions/get-reporte-cv';
import { ReporteUnionResponse, CarteraVencidaTitulo } from '../interfaces/reporte.response';

export interface ReporteFilters {
  selectedReporte: string;
  selectedTipo: string;
  selectedYear: string;
  selectedTitulos?: CarteraVencidaTitulo[];
}

export interface UseReporteReturn {
  loading: boolean;
  totalRecords: number;
  resetConsulted: () => void;
  getAllData: () => Promise<ReporteUnionResponse[]>;
}

/**
 * Hook personalizado para manejar la lógica de carga de datos de reportes
 * Centraliza toda la lógica de endpoints, validaciones y manejo de estados
 */
export function useReporte(filters: ReporteFilters): UseReporteReturn {
  const [loading, setLoading] = useState<boolean>(false);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Resetea el estado al cambiar de tipo de reporte
  const resetConsulted = useCallback(() => {
    setTotalRecords(0);
  }, []);

  // Obtiene todos los registros sin límite de paginación para exportación Excel
  const getAllData = useCallback(async (): Promise<ReporteUnionResponse[]> => {
    if (!filters.selectedYear) return [];

    let endpoint = '';
    let useYearPath = false;
    let yearParam: string | number | undefined = undefined;

    // Usar la misma lógica de endpoint que fetchReportData
    if (filters.selectedReporte === 'carteraVencida') {
      endpoint = '/api/ct_vencida';
      if (filters.selectedTipo === 'Año' && filters.selectedYear) {
        yearParam = filters.selectedYear;
        useYearPath = true;
      }
    } 
    else if (filters.selectedReporte === 'carteraVencidaImpuesto') {
      endpoint = '/api/ct_vencida_impuesto/datos';
      if (filters.selectedTipo === 'Año' && filters.selectedYear) {
        yearParam = filters.selectedYear;
        useYearPath = true;
      }
    }
    else if (filters.selectedReporte === 'carteraVencidaTitulo') {
      endpoint = '/api/ct_vencida_porimpuesto/datos';
      if (filters.selectedTipo === 'Año' && filters.selectedYear) {
        yearParam = filters.selectedYear;
        useYearPath = true;
      }
    }
    //Realiza consulta a endpoint de reporte de ciu detallado
    else if (filters.selectedReporte === 'carteraVencidaDetalle') {
      endpoint = '/api/ct_vencida_titulo_detalle/datos';
      if (filters.selectedTipo === 'Año' && filters.selectedYear) {
        yearParam = filters.selectedYear;
        useYearPath = true;
      }
    }
    else {
      console.log('Reporte no implementado:', filters.selectedReporte);
      return [];
    }

    console.log(`Obteniendo todos los datos de ${endpoint}...`);

    setLoading(true);
    try {
      const titulosCodigos = filters.selectedTitulos?.map(t => t.CODIGO) || [];

      const resp = await getReporteCV({
        endpoint,
        year: yearParam,
        useYearPath,
        page: 1,
        pageSize: 10000, // Sin límite para exportación completa
        q: '',
        titulos: titulosCodigos.length > 0 ? titulosCodigos : undefined
      });

      setTotalRecords((resp as ReporteUnionResponse[]).length);
      return resp as ReporteUnionResponse[];
    } catch (err) {
      console.error('Error obteniendo todos los datos:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [filters.selectedReporte, filters.selectedTipo, filters.selectedYear, filters.selectedTitulos]);

  return {
    loading,
    totalRecords,
    resetConsulted,
    getAllData,
  };
}