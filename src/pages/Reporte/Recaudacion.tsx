// Página de reporte de recaudación.
// Permite seleccionar el tipo de reporte, un rango de fechas y generar el reporte
// de forma asíncrona. Al completarse el job, permite descargar los datos en Excel.
//
// Flujo:
//   1. Seleccionar tipo de reporte (ej: Recaudación por Impuesto)
//   2. Seleccionar rango de fechas con el calendario
//   3. Clic en "Generar Reporte" → inicia job asíncrono con polling
//   4. Al completarse, aparece el botón "Descargar Excel"

import { useState, useMemo } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ReportProgress from "../../components/common/ReportProgress";
import SelectorReporte from "../../components/common/SelectorReporte";
import SelectRango from "../../components/common/SelectRango";
import { useRecaudacion } from "../../hooks/useRecaudacion";
import { useExcelExport } from "../../hooks/useExcelExport";
import { RecaudacionResponse } from "../../interfaces/reporte.response";

// Mapeo de tipo de reporte → endpoint de inicio y datos
const REPORTE_CONFIG: Record<string, { startEndpoint: string; datosEndpoint: string; label: string }> = {
  'Recaudación por Impuesto': {
    startEndpoint: '/api/recaudacion/',
    datosEndpoint: '/api/recaudacion/datos/',
    label: 'recaudacion_impuesto',
  },
  // Agregar nuevos tipos aquí cuando el backend esté listo:
  // 'Recaudación por Rubro': {
  //   startEndpoint: '/api/recaudacion_rubro/',
  //   datosEndpoint: '/api/recaudacion_rubro/datos/',
  //   label: 'recaudacion_rubro',
  // },
};

const TIPOS_REPORTE = Object.keys(REPORTE_CONFIG);

/** Convierte un Date a string "YYYY-MM-DD" para los query params del backend */
function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function Recaudacion() {
  const [selectedReporte, setSelectedReporte] = useState<string>("");
  const [fechas, setFechas] = useState<(Date | null)[] | null>(null);
  const [reporteDescargado, setReporteDescargado] = useState<boolean>(false);

  const {
    isGenerating,
    progress,
    status,
    error,
    data,
    generateReport,
    cancelGeneration,
  } = useRecaudacion();

  const { exporting, exportWithFetch } = useExcelExport<RecaudacionResponse>();

  // Extrae las dos fechas del array del Calendar (rango completo = ambas seleccionadas)
  const fechaInicio = fechas?.[0] instanceof Date ? fechas[0] : null;
  const fechaFin    = fechas?.[1] instanceof Date ? fechas[1] : null;
  const rangoValido = !!selectedReporte && !!fechaInicio && !!fechaFin;

  const mostrarBotonDescarga = useMemo(() => {
    return status === 'SUCCESS' && data.length > 0 && !reporteDescargado;
  }, [status, data.length, reporteDescargado]);

  const handleReporteChange = (v: string) => {
    setSelectedReporte(v);
    cancelGeneration();
    setReporteDescargado(false);
  };

  const handleFechasChange = (dates: (Date | null)[] | null) => {
    setFechas(dates);
    cancelGeneration();
    setReporteDescargado(false);
  };

  const handleGenerar = async () => {
    if (!rangoValido) return;
    const config = REPORTE_CONFIG[selectedReporte];
    if (!config) return;

    setReporteDescargado(false);
    await generateReport(
      toISODate(fechaInicio!),
      toISODate(fechaFin!),
      config.startEndpoint,
      config.datosEndpoint,
    );
  };

  const handleExcelExport = async () => {
    if (!fechaInicio || !fechaFin) return;
    const config = REPORTE_CONFIG[selectedReporte];
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${config?.label ?? 'recaudacion'}_${toISODate(fechaInicio)}_${toISODate(fechaFin)}_${dateStr}.xlsx`;

    try {
      await exportWithFetch(() => Promise.resolve(data), {
        filename,
        sheetName: 'Recaudacion',
        includeHeaders: true,
      });
      setReporteDescargado(true);
    } catch (err) {
      console.error('Error al exportar:', err);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Reporte de Recaudación" />

      {/* Sección de filtros */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <h3 className="mb-5 text-base font-semibold text-gray-800 dark:text-white/90">
          Seleccione reporte y rango de fechas
        </h3>

        <div className="flex flex-col md:flex-row items-end gap-4">

          {/* Selector de tipo de reporte */}
          <div>
            <SelectorReporte
              reporte={TIPOS_REPORTE}
              value={selectedReporte}
              onChange={handleReporteChange}
            />
          </div>

          {/* Selector de rango de fechas */}
          {selectedReporte && (
            <div className="w-72">
              <SelectRango
                value={fechas}
                onChange={handleFechasChange}
              />
            </div>
          )}

          {/* Botón generar */}
          {rangoValido && (
            <div className="md:ml-2">
              <button
                onClick={handleGenerar}
                disabled={isGenerating}
                className="h-9 px-6 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? 'Generando...' : 'Generar Reporte'}
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Barra de progreso */}
      {isGenerating && (
        <div className="mb-6">
          <ReportProgress
            status={status}
            progress={progress}
            onCancel={cancelGeneration}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Botón de descarga */}
      {mostrarBotonDescarga && (
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 rounded-md">
          <p className="mb-2 font-medium">
            Reporte generado exitosamente! {data.length.toLocaleString()} registros
          </p>
          <button
            onClick={handleExcelExport}
            disabled={exporting}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {exporting ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Exportando...
              </span>
            ) : (
              'Descargar Excel'
            )}
          </button>
        </div>
      )}

      {/* Confirmación de descarga */}
      {reporteDescargado && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 rounded-md">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-medium">Archivo descargado exitosamente</p>
              <p className="text-sm mt-1">
                {data.length.toLocaleString()} registros —{' '}
                {fechaInicio && toISODate(fechaInicio)} al {fechaFin && toISODate(fechaFin)}
              </p>
              <button
                onClick={() => setReporteDescargado(false)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline"
              >
                Generar otro reporte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aviso cuando faltan selecciones */}
      {!rangoValido && !isGenerating && (
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-yellow-800 dark:text-yellow-200 font-medium">
              {!selectedReporte
                ? 'Seleccione el tipo de reporte'
                : 'Seleccione el rango de fechas para continuar'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
