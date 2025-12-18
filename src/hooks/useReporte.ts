import { useState, useCallback } from 'react';
import getReporteCV from '../components/actions/get-reporte-cv';
import { ReporteResponse, ReporteUnionResponse } from '../interfaces/reporte.response';
import { ParamsConsulta } from '../components/common/TablaAdmin';

export interface ReporteFilters {
  selectedReporte: string;
  selectedTipo: string;
  selectedYear: string;
}

export interface UseReporteReturn {
  // Estados
  data: ReporteUnionResponse[];
  loading: boolean;
  consulted: boolean;
  totalRecords: number;
  refreshKey: number;
  
  // Acciones
  fetchReportData: (params: ParamsConsulta) => Promise<void>;
  handleConsultar: () => void;
  resetConsulted: () => void;
  getAllData: () => Promise<ReporteUnionResponse[]>;
}

/**
 * Hook personalizado para manejar la lógica de carga de datos de reportes
 * Centraliza toda la lógica de endpoints, validaciones y manejo de estados
 */
export function useReporte(filters: ReporteFilters): UseReporteReturn {
  // Estados de Datos
  const [data, setData] = useState<ReporteUnionResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [consulted, setConsulted] = useState<boolean>(false);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Función principal de carga de datos
  const fetchReportData = useCallback(async (tableParams: ParamsConsulta) => {
    if (!consulted) return; // No cargar si no se ha pulsado consultar

    setLoading(true);
    try {
      let endpoint = '';
      let useYearPath = false;
      let yearParam: string | number | undefined = undefined;

      // 1. Configurar Endpoint según selección
      if (filters.selectedReporte === 'carteraVencida') {
        endpoint = '/api/ct_vencida';
        if (filters.selectedTipo === 'Año' && filters.selectedYear) {
          yearParam = filters.selectedYear;
          useYearPath = true;
        }
      } 
      else if (filters.selectedReporte === 'carteraVencidaImpuesto') {
        endpoint = '/api/ct_vencida_impuesto';
        // Validación extra por si acaso
        if (filters.selectedTipo === 'Año' && filters.selectedYear) {
          yearParam = filters.selectedYear;
          useYearPath = true;
        } else {
          console.warn('Falta configuración de año para Impuesto');
          setData([]); 
          setLoading(false); 
          return;
        }
      }
      else if (filters.selectedReporte === 'carteraVencidaTitulo') {
        // Agregar lógica para título cuando sea necesario
        endpoint = '/api/ct_vencida_titulo';
        if (filters.selectedTipo === 'Año' && filters.selectedYear) {
          yearParam = filters.selectedYear;
          useYearPath = true;
        }
      }
      //Realiza consulta a endpoint de reporte de ciu detallado
    else if (filters.selectedReporte === 'carteraVencidaDetalle') {
      endpoint = '/api/ct_vencida_titulo_detalle';
      if (filters.selectedTipo === 'Año' && filters.selectedYear) {
        yearParam = filters.selectedYear;
        useYearPath = true;
      }
    }
      else {
        console.log('Reporte no implementado:', filters.selectedReporte);
        setData([]); 
        setLoading(false); 
        return;
      }

      console.log(`Consultando ${endpoint} - Página: ${tableParams.page}`);

      // 2. Llamada a la API con paginación limitada a 100 registros máx para display
      const limitedPageSize = Math.min(tableParams.pageSize, 100);
      const resp = await getReporteCV({ 
        endpoint, 
        year: yearParam, 
        useYearPath,
        page: tableParams.page,
        pageSize: limitedPageSize,
        q: tableParams.q 
      });

      const resultados = resp as ReporteResponse[];
      setData(resultados);

      // 3. Manejo de "Total de Registros" - limitado a 100 para display
      if (resultados.length < limitedPageSize) {
        // Si vinieron menos datos que el tamaño de página, es la última página
        setTotalRecords((tableParams.page - 1) * limitedPageSize + resultados.length);
      } else {
        // Limitamos el total a 100 registros max para evitar sobrecarga
        setTotalRecords(Math.min(100, (tableParams.page + 1) * limitedPageSize)); 
      }

    } catch (err) {
      console.error('Error cargando reporte', err);
      setData([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  }, [consulted, filters.selectedReporte, filters.selectedTipo, filters.selectedYear]);

  // Manejador del botón consultar
  const handleConsultar = useCallback(() => {
    // Validación obligatoria: debe tener año seleccionado para ambos reportes
    if (!filters.selectedYear) {
      console.warn('No se puede ejecutar el reporte sin seleccionar un año');
      return;
    }

    // Validaciones adicionales para cartera vencida impuesto
    if (filters.selectedReporte === 'carteraVencidaImpuesto' && 
        filters.selectedTipo !== 'Año') {
      console.warn('Para cartera vencida impuesto debe seleccionar tipo "Año"');
      return; 
    }

    // Para cartera vencida y cartera vencida impuesto, solo marcamos como consultado sin cargar datos
    // ya que no vamos a mostrar tabla (solo descarga Excel debido al gran volumen)
    if (filters.selectedReporte === 'carteraVencida' || filters.selectedReporte === 'carteraVencidaImpuesto' || filters.selectedReporte === 'carteraVencidaDetalle') {
      setData([]);
      setTotalRecords(0);
      setConsulted(true);
      return;
    }

    // Para otros reportes, proceder normalmente
    setConsulted(true);
    // Reiniciar paginación
    setRefreshKey(prev => prev + 1);
  }, [filters.selectedReporte, filters.selectedTipo, filters.selectedYear]);

  // Función para resetear el estado consultado
  const resetConsulted = useCallback(() => {
    setConsulted(false);
    setData([]);
    setTotalRecords(0);
  }, []);

  // Función para obtener todos los datos (sin límite para exportación)
  const getAllData = useCallback(async (): Promise<ReporteUnionResponse[]> => {
    // Para cartera vencida y cartera vencida impuesto, no se requiere consulted
    // ya que se descarga directamente al seleccionar el año
    const requiresConsulted = filters.selectedReporte !== 'carteraVencida' && 
                              filters.selectedReporte !== 'carteraVencidaImpuesto' &&
                              filters.selectedReporte !== 'carteraVencidaDetalle';
    
    if (requiresConsulted && !consulted) return [];
    
    // Validar que tenga año seleccionado
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
      endpoint = '/api/ct_vencida_impuesto';
      if (filters.selectedTipo === 'Año' && filters.selectedYear) {
        yearParam = filters.selectedYear;
        useYearPath = true;
      }
    }
    else if (filters.selectedReporte === 'carteraVencidaTitulo') {
      endpoint = '/api/ct_vencida_titulo';
      if (filters.selectedTipo === 'Año' && filters.selectedYear) {
        yearParam = filters.selectedYear;
        useYearPath = true;
      }
    }
    //Realiza consulta a endpoint de reporte de ciu detallado
    else if (filters.selectedReporte === 'carteraVencidaDetalle') {
      endpoint = '/api/ct_vencida_titulo_detalle';
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

    try {
      // Solicitar TODOS los datos sin límite de paginación
      const resp = await getReporteCV({ 
        endpoint, 
        year: yearParam, 
        useYearPath,
        page: 1,
        pageSize: 10000, // Solicitar muchos registros para obtener todo
        q: '' // Sin filtro de búsqueda para obtener todos
      });

      return resp as ReporteUnionResponse[];
    } catch (err) {
      console.error('Error obteniendo todos los datos:', err);
      return [];
    }
  }, [consulted, filters.selectedReporte, filters.selectedTipo, filters.selectedYear]);

  return {
    // Estados
    data,
    loading,
    consulted,
    totalRecords,
    refreshKey,
    
    // Acciones
    fetchReportData,
    handleConsultar,
    resetConsulted,
    getAllData,
  };
}