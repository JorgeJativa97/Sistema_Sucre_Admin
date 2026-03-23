// Página principal de reportes del sistema Cabildo.
// Permite al usuario seleccionar el tipo de reporte, filtrar por año/rango/títulos
// y descargar los datos en Excel.
//
// Flujo general:
//   1. Seleccionar tipo de reporte
//   2. Seleccionar filtros (tipo: Año o Rango, año, títulos si aplica)
//   3. Para reportes grandes (carteraVencida, carteraVencidaImpuesto, carteraVencidaDetalle):
//      - Hacer clic en "Generar Reporte" → inicia job asíncrono con polling
//      - Al completarse, aparece el botón "Descargar Excel"
//   4. Para carteraVencidaTitulo:
//      - El botón de descarga aparece directamente al seleccionar año y títulos

import { useState, useMemo } from "react";

// Componentes de filtros y UI
import Filtros from "../../components/common/Filtros";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import SelectorReporte from "../../components/common/SelectorReporte";
import YearSelect from "../../components/common/YearSelect";
import SelectAdmin from "../../components/common/SelectAdmin";
import SelectRango from "../../components/common/SelectRango";
import MultiSelectTitulos from "../../components/common/MultiSelectTitulos";

// Hook para generación de reportes vía job asíncrono (Celery)
import { useAsyncReporte } from "../../hooks/useAsyncReporte";
// Componente de barra de progreso para jobs asíncronos
import ReportProgress from "../../components/common/ReportProgress";

import { ReporteUnionResponse, CarteraVencidaTitulo } from "../../interfaces/reporte.response";

// Hook para descarga de datos completos y estado de carga
import { useReporte } from "../../hooks/useReporte";
// Hook para exportación a Excel con SheetJS
import { useExcelExport } from "../../hooks/useExcelExport";

export default function MyReporte() {
  // --- Estados de Filtros ---
  const [selectedReporte, setSelectedReporte] = useState<string>("");   // Tipo de reporte seleccionado
  const [selectedYear, setSelectedYear] = useState<string>("");          // Año seleccionado
  const [selectedTipo, setSelectedTipo] = useState<string>("");          // Tipo de filtro: "Año" o "Rango"
  const [selectedTitulos, setSelectedTitulos] = useState<CarteraVencidaTitulo[]>([]); // Títulos seleccionados (máx 4)

  // Controla si el reporte ya fue descargado para mostrar mensaje de confirmación
  const [reporteDescargado, setReporteDescargado] = useState<boolean>(false);

  // Hook que maneja la descarga completa de datos para exportación Excel
  const {
    resetConsulted,
    getAllData,
  } = useReporte({
    selectedReporte,
    selectedTipo,
    selectedYear,
    selectedTitulos,
  });

  // Hook que maneja la generación asíncrona de reportes grandes mediante polling al backend
  const {
    isGenerating,
    progress,
    status: asyncStatus,
    error: asyncError,
    data: asyncData,
    generateReport,
    cancelGeneration,
  } = useAsyncReporte();

  // Hook para exportar datos a Excel usando SheetJS
  const { exporting, exportWithFetch } = useExcelExport<ReporteUnionResponse>();

  // Memorizado: solo muestra el botón de descarga cuando el job asíncrono terminó exitosamente
  // y aún no se ha descargado el archivo (evita parpadeos por re-renders)
  const debeaMostrarBotonDescarga = useMemo(() => {
    return asyncStatus === 'SUCCESS' &&
           asyncData.length > 0 &&
           !reporteDescargado;
  }, [asyncStatus, asyncData.length, reporteDescargado]);

  // Al cambiar el tipo de reporte, resetea todos los filtros y estados derivados
  const handleReporteChange = (v: string) => {
    setSelectedReporte(v);
    setSelectedTipo("");
    setSelectedYear("");
    setSelectedTitulos([]);
    resetConsulted();
    cancelGeneration(); // Cancela cualquier job asíncrono en curso
    setReporteDescargado(false);
  };

  // Inicia la generación asíncrona del reporte en el backend (via Celery).
  const handleGenerateAsyncReport = async () => {
    if (!selectedYear) {
      console.warn('No se puede generar sin seleccionar un año');
      return;
    }

    let endpoint = '';
    let useYearPath = false;
    let datosEndpoint = '/api/ct_vencida/datos';
    let titulos: number[] | undefined = undefined;

    if (selectedReporte === 'carteraVencida') {
      endpoint = '/api/ct_vencida';
      datosEndpoint = '/api/ct_vencida/datos';
      useYearPath = true;
    } else if (selectedReporte === 'carteraVencidaImpuesto') {
      endpoint = '/api/ct_vencida_impuesto';
      datosEndpoint = '/api/ct_vencida_impuesto/datos';
      useYearPath = true;
    } else if (selectedReporte === 'carteraVencidaTitulo') {
      endpoint = '/api/ct_vencida_porimpuesto';
      datosEndpoint = '/api/ct_vencida_porimpuesto/datos';
      useYearPath = true;
      titulos = selectedTitulos.map(t => t.CODIGO);
    } else if (selectedReporte === 'carteraVencidaDetalle') {
      endpoint = '/api/ct_vencida_titulo_detalle';
      datosEndpoint = '/api/ct_vencida_titulo_detalle/datos';
      useYearPath = true;
    }

    await generateReport(endpoint, selectedYear, useYearPath, datosEndpoint, titulos);
  };

  // Exporta los datos a un archivo Excel con nombre descriptivo.
  // Prioriza los datos del job asíncrono (asyncData) si están disponibles,
  // de lo contrario hace una llamada completa a la API (getAllData).
  const handleExcelExport = async () => {
    if (!selectedYear) {
      console.warn('No se puede exportar sin seleccionar un año');
      return;
    }

    // Mapear el identificador del reporte a un nombre de archivo legible
    const reporteName = selectedReporte === 'carteraVencida' ? 'cartera_vencida' :
                       selectedReporte === 'carteraVencidaImpuesto' ? 'cartera_vencida_impuesto' :
                       selectedReporte === 'carteraVencidaDetalle' ? 'cartera_vencida_detalle' :
                       selectedReporte === 'carteraVencidaTitulo' ? 'cartera_vencida_por_titulo' :
                       selectedReporte;

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${reporteName}_${selectedYear}_${dateStr}.xlsx`;

    try {
      // Si el job asíncrono ya generó los datos, usarlos directamente (más rápido)
      // Si no, llamar al endpoint completo sin paginación
      if (asyncData.length > 0) {
        await exportWithFetch(() => Promise.resolve(asyncData), {
          filename,
          sheetName: 'Reporte',
          includeHeaders: true
        });
      } else {
        await exportWithFetch(getAllData, {
          filename,
          sheetName: 'Reporte',
          includeHeaders: true
        });
      }

      setReporteDescargado(true);

    } catch (error) {
      console.error('Error al exportar:', error);
      // No marcar como descargado si la exportación falló
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Mis reportes" />

      {/* Sección de Filtros */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <Filtros title="Seleccione reporte" />
        <div className="flex flex-col md:flex-row items-end gap-4">
          
          <div>
            <SelectorReporte
              reporte={["carteraVencida", "carteraVencidaImpuesto", "carteraVencidaTitulo","carteraVencidaDetalle"]}
              onChange={handleReporteChange}
              value={selectedReporte}
            />
          </div>

          

          {/* Selector de títulos - solo visible para carteraVencidaTitulo */}
          {selectedReporte === 'carteraVencidaTitulo' && (
            <div className="w-80">
              <MultiSelectTitulos
                value={selectedTitulos}
                onChange={(selected) => {
                  setSelectedTitulos(selected);
                  setReporteDescargado(false);
                }}
                placeholder="Seleccione títulos..."
                maxSelection={4}
              />
            </div>
          )}

          {/* Selector de tipo de filtro (Año / Rango) para todos los reportes disponibles */}
          {(selectedReporte === 'carteraVencida' || selectedReporte === 'carteraVencidaImpuesto' || selectedReporte === 'carteraVencidaTitulo' || selectedReporte === 'carteraVencidaDetalle') && (
            <div>
              <SelectAdmin
                nombre={["Año", "Rango"]}
                onChange={(v) => {
                  setSelectedTipo(v);
                  setReporteDescargado(false);
                }}
                value={selectedTipo}
              />
            </div>
          )}

          {/* Selector de año - visible cuando el tipo de filtro es "Año" */}
          {(selectedTipo === 'Año') && (
            <div className="w-48">
              <YearSelect
                value={selectedYear}
                onChange={(y) => {
                  setSelectedYear(y);
                  setReporteDescargado(false);
                }}
                startYear={2000}
                endYear={new Date().getFullYear()}
              />
            </div>
          )}

          {/* Selector de rango de fechas - visible cuando el tipo de filtro es "Rango" */}
          {(selectedTipo === 'Rango') && (
             <div className="w-72">
               <SelectRango />
             </div>
          )}

          {/* Botón para iniciar la generación asíncrona del reporte (job Celery).
              Para carteraVencidaTitulo también requiere al menos un título seleccionado. */}
          {(selectedReporte === 'carteraVencida' ||
            selectedReporte === 'carteraVencidaImpuesto' ||
            selectedReporte === 'carteraVencidaDetalle' ||
            (selectedReporte === 'carteraVencidaTitulo' && selectedTitulos.length > 0)) && selectedYear && (
            <div className="md:ml-4">
              <button
                onClick={handleGenerateAsyncReport}
                disabled={isGenerating}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generando...' : 'Generar Reporte'}
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Barra de progreso del job asíncrono - visible mientras se está generando */}
      {isGenerating && (
        <div className="mb-6">
          <ReportProgress
            status={asyncStatus}
            progress={progress}
            onCancel={cancelGeneration}
          />
        </div>
      )}

      {/* Mensaje de error si el job asíncrono falló */}
      {asyncError && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <strong>Error:</strong> {asyncError}
        </div>
      )}

      {/* Botón de descarga Excel - aparece solo cuando el job terminó exitosamente y aún no se descargó */}
      {debeaMostrarBotonDescarga && (
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 rounded-md fade-in">
          <p className="mb-2 font-medium">
            Reporte generado exitosamente! {asyncData.length.toLocaleString()} registros
          </p>
          <button
            onClick={handleExcelExport}
            disabled={exporting}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {exporting ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Exportando...
              </span>
            ) : (
              'Descargar Excel'
            )}
          </button>
        </div>
      )}

      {/* Mensaje de confirmación tras descarga exitosa, con opción de generar otro reporte */}
      {reporteDescargado && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 rounded-md fade-in">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-medium">
                Archivo descargado exitosamente
              </p>
              <p className="text-sm mt-1">
                El reporte con {asyncData.length.toLocaleString()} registros se ha descargado en formato Excel
              </p>
              <button
                onClick={() => {
                  setReporteDescargado(false);
                }}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline"
              >
                Generar otro reporte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje informativo cuando no hay año seleccionado */}
      {!selectedYear && (
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-yellow-800 dark:text-yellow-200 font-medium">
              Debe seleccionar un año para poder ejecutar el reporte
            </p>
          </div>
        </div>
      )}

    </div>
  );
}