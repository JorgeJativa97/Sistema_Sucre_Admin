import { useState, useCallback } from 'react';

export interface ExcelExportOptions {
  filename?: string;
  sheetName?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
}

export interface UseExcelExportReturn<T> {
  exporting: boolean;
  exportToExcel: (data: T[], options?: ExcelExportOptions) => Promise<void>;
  exportWithFetch: (
    fetchFunction: () => Promise<T[]>, 
    options?: ExcelExportOptions
  ) => Promise<void>;
}

/**
 * Hook especializado para exportación a Excel
 * Maneja la descarga de datos en formato Excel con configuraciones personalizables
 */
export function useExcelExport<T>(): UseExcelExportReturn<T> {
  const [exporting, setExporting] = useState<boolean>(false);

  // Función para exportar datos ya existentes a Excel
  const exportToExcel = useCallback(async (
    data: T[], 
    options: ExcelExportOptions = {}
  ) => {
    if (!data || data.length === 0) {
      console.warn('No hay datos para exportar');
      return;
    }

    setExporting(true);
    try {
      const { utils, writeFile } = await import('xlsx');
      
      // Configuración por defecto
      const {
        filename = `export_${new Date().toISOString().split('T')[0]}.xlsx`,
        sheetName = 'Datos',
        includeHeaders = true
      } = options;

      // Crear worksheet
      const worksheet = utils.json_to_sheet(data, { 
        skipHeader: !includeHeaders 
      });
      
      // Crear workbook y añadir worksheet
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, sheetName);

      // Descargar archivo
      writeFile(workbook, filename);
      
      console.log(`Archivo ${filename} descargado exitosamente con ${data.length} registros`);

    } catch (err) {
      console.error('Error exportando a Excel:', err);
      throw err; // Re-lanzar para manejo en componente si es necesario
    } finally {
      setExporting(false);
    }
  }, []);

  // Función para obtener datos y exportar en una sola operación
  const exportWithFetch = useCallback(async (
    fetchFunction: () => Promise<T[]>,
    options: ExcelExportOptions = {}
  ) => {
    setExporting(true);
    try {
      console.log('Obteniendo datos para exportación...');
      const data = await fetchFunction();
      
      if (!data || data.length === 0) {
        console.warn('No se obtuvieron datos para exportar');
        return;
      }

      // Usar la función de export normal
      await exportToExcel(data, options);

    } catch (err) {
      console.error('Error en exportWithFetch:', err);
      throw err;
    }
    // Note: setExporting(false) se maneja en exportToExcel
  }, [exportToExcel]);

  return {
    exporting,
    exportToExcel,
    exportWithFetch,
  };
}