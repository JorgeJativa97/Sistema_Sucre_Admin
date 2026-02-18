import { useState, useMemo} from "react";
// Componentes UI
import Filtros from "../../components/common/Filtros";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import SelectorReporte from "../../components/common/SelectorReporte";
import YearSelect from "../../components/common/YearSelect";
import SelectAdmin from "../../components/common/SelectAdmin";
import SelectRango from "../../components/common/SelectRango";
import MultiSelectTitulos from "../../components/common/MultiSelectTitulos";

// 🔥 NUEVO: Importar el hook de reportes asíncronos
import { useAsyncReporte } from "../../hooks/useAsyncReporte";
// 🔥 NUEVO: Importar el componente de progreso
import ReportProgress from "../../components/common/ReportProgress";

// Componentes Lógicos y Tipos
import { TablaServerSide } from '../../components/common/TablaAdmin';
import { ReporteUnionResponse, CarteraVencidaTitulo } from "../../interfaces/reporte.response";

// Hooks personalizados
import { useReporte } from "../../hooks/useReporte";
import { useExcelExport } from "../../hooks/useExcelExport";

// Utilidades para columnas
import { getColumnsForReporte } from "../../utils/reporteColumns";

export default function MyReporte() {
  // Estados de Filtros
  const [selectedReporte, setSelectedReporte] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedTipo, setSelectedTipo] = useState<string>("");
  const [selectedTitulos, setSelectedTitulos] = useState<CarteraVencidaTitulo[]>([]);

   // 🔥 NUEVO: Estado para controlar si el reporte ya fue descargado
  const [reporteDescargado, setReporteDescargado] = useState<boolean>(false);

  // Hook para manejar la lógica de datos de reportes
  const {
    data,
    loading,
    consulted,
    totalRecords,
    refreshKey,
    fetchReportData,
  //  handleConsultar,
    resetConsulted,
    getAllData,
  } = useReporte({
    selectedReporte,
    selectedTipo,
    selectedYear,
    selectedTitulos,
  }); 

   // 🔥 NUEVO: Hook para reportes asíncronos
  const {
    isGenerating,
    progress,
    status: asyncStatus,
    error: asyncError,
    data: asyncData,
    generateReport,
    cancelGeneration,
  } = useAsyncReporte();

  // Hook para manejar la exportación a Excel
  const { exporting, exportWithFetch } = useExcelExport<ReporteUnionResponse>();

  // Definición de Columnas dinámicas basadas en el tipo de reporte
  const columns = getColumnsForReporte(selectedReporte, data);

   // 🔥 NUEVO: Memorizar la condición del botón de descarga para evitar parpadeos
  const debeaMostrarBotonDescarga = useMemo(() => {
    return asyncStatus === 'SUCCESS' && 
           asyncData.length > 0 && 
           !reporteDescargado;
  }, [asyncStatus, asyncData.length, reporteDescargado]);

  // Manejador para cambio de reporte (resetea el estado consultado)
  const handleReporteChange = (v: string) => {
    setSelectedReporte(v);
    setSelectedTipo(""); // Resetear tipo de filtro (Año/Rango)
    setSelectedYear(""); // Resetear año seleccionado
    setSelectedTitulos([]); // Resetear títulos seleccionados
    resetConsulted(); // Ocultar tabla al cambiar reporte
    cancelGeneration(); // 🔥 NUEVO: Cancelar generación si había una en curso
    setReporteDescargado(false); // 🔥 NUEVO: Resetear estado de descarga
  };


  // 🔥 NUEVO: Manejador para generar reporte asíncrono
  const handleGenerateAsyncReport = async () => {
    if (!selectedYear) {
      console.warn('No se puede generar sin seleccionar un año');
      return;
    }

    let endpoint = '';
    let useYearPath = false;

    if (selectedReporte === 'carteraVencida') {
      endpoint = '/api/ct_vencida';
      useYearPath = true;
    } else if (selectedReporte === 'carteraVencidaImpuesto') {
      endpoint = '/api/ct_vencida_impuesto';
      useYearPath = true;
    } else if (selectedReporte === 'carteraVencidaDetalle') {
      endpoint = '/api/ct_vencida_titulo_detalle';
      useYearPath = true;
    }

    await generateReport(endpoint, selectedYear, useYearPath);
  };

  // Manejador para exportar Excel
  const handleExcelExport = () => {
    // Validar que haya año seleccionado antes de exportar
    if (!selectedYear) {
      console.warn('No se puede exportar sin seleccionar un año');
      return;
    }

    const reporteName = selectedReporte === 'carteraVencida' ? 'cartera_vencida' :
                       selectedReporte === 'carteraVencidaImpuesto' ? 'cartera_vencida_impuesto' :
                       selectedReporte === 'carteraVencidaDetalle' ? 'cartera_vencida_detalle' :
                       selectedReporte === 'carteraVencidaTitulo' ? 'cartera_vencida_por_titulo' :
                       selectedReporte;
    
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${reporteName}_${selectedYear}_${dateStr}.xlsx`;

     try {
      // 🔥 NUEVO: Usar asyncData si está disponible, sino getAllData
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

      // 🔥 NUEVO: Marcar como descargado después de la exportación exitosa
      setReporteDescargado(true);
      
    } catch (error) {
      console.error('Error al exportar:', error);
      // No marcar como descargado si hay error
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

          

          {/* MultiSelect de Títulos - Solo para carteraVencidaTitulo (se muestra primero) */}
          {selectedReporte === 'carteraVencidaTitulo' && (
            <div className="w-80">
              <MultiSelectTitulos
                value={selectedTitulos}
                 onChange={(selected) => {
                  setSelectedTitulos(selected);
                  setReporteDescargado(false); // 🔥 NUEVO: Resetear al cambiar títulos
                }}
                placeholder="Seleccione títulos..."
                maxSelection={4}
              />
            </div>
          )}

          {(selectedReporte === 'carteraVencida' || selectedReporte === 'carteraVencidaImpuesto' || selectedReporte === 'carteraVencidaTitulo' || selectedReporte === 'carteraVencidaDetalle') && (
            <div>
              <SelectAdmin
                nombre={["Año", "Rango"]}
                onChange={(v) => {
                  setSelectedTipo(v);
                  setReporteDescargado(false); // 🔥 NUEVO: Resetear al cambiar tipo
                }}
                value={selectedTipo}
              />
            </div>
          )}

          {(selectedTipo === 'Año') && (
            <div className="w-48">
              <YearSelect
                value={selectedYear}
                onChange={(y) => {
                  setSelectedYear(y);
                  setReporteDescargado(false); // 🔥 NUEVO: Resetear al cambiar año
                }}
                startYear={2000}
                endYear={new Date().getFullYear()}
              />
            </div>
          )}

          {(selectedTipo === 'Rango') && (
             <div className="w-72">
               <SelectRango />
             </div>
          )}

           {/* 🔥🔥🔥 AQUÍ VA EL NUEVO BOTÓN 🔥🔥🔥 */}
          {/* Botón para generar reporte asíncrono */}
          {(selectedReporte === 'carteraVencida' || 
            selectedReporte === 'carteraVencidaImpuesto' || 
            selectedReporte === 'carteraVencidaDetalle') && selectedYear && (
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

      {/* Mostrar progreso si está generando */}
      {isGenerating && (
        <div className="mb-6">
          <ReportProgress
            status={asyncStatus}
            progress={progress}
            onCancel={cancelGeneration}
          />
          </div>
      )}
      {/* Mostrar error si hay */}
      {asyncError && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <strong>Error:</strong> {asyncError}
        </div>
      )}

      {/* 🔥 MODIFICADO: Mostrar botón de descarga cuando termine (usando useMemo) */}
      {debeaMostrarBotonDescarga && (
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-300 rounded-md fade-in">
          <p className="mb-2 font-medium">
            ✅ Reporte generado exitosamente! {asyncData.length.toLocaleString()} registros
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
              '📥 Descargar Excel'
            )}
          </button>
        </div>
      )}

      {/* 🔥 NUEVO: Mostrar mensaje de éxito después de descargar */}
      {reporteDescargado && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 rounded-md fade-in">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-medium">
                ✅ Archivo descargado exitosamente
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

      {/* 🔥 NUEVO: Mostrar mensaje de éxito después de descargar */}
      {reporteDescargado && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 rounded-md fade-in">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-medium">
                ✅ Archivo descargado exitosamente
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

      {/* Mostrar la tabla Server-Side - Solo para reportes que no sean cartera vencida ni cartera vencida impuesto */}
      {consulted && selectedReporte !== 'carteraVencida' && selectedReporte !== 'carteraVencidaImpuesto' && (
        <div className="mt-6 fade-in">
          {/* Header con título y botón de exportar */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedReporte === 'carteraVencidaTitulo' ? 'Cartera Vencida Título' : 'Reporte'}
              <span className="ml-2 text-sm font-normal text-gray-500">
                (Mostrando máximo 100 registros)
              </span>
            </h3>
            
            <button
              type="button"
              onClick={handleExcelExport}
              disabled={exporting || loading || !selectedYear}
              className={`inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors
                ${exporting || loading || !selectedYear
                  ? 'bg-gray-400 cursor-not-allowed text-gray-700' 
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-md'}`}
              title={!selectedYear ? 'Debe seleccionar un año para descargar' : 'Descargar Excel completo'}
            >
              {exporting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Exportando...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Descargar Excel (Todos)
                </>
              )}
            </button>
          </div>

          <TablaServerSide<ReporteUnionResponse>
            datos={data}
            columnas={columns}
            loading={loading}
            totalRegistros={totalRecords}
            onParamsChange={fetchReportData}
            resetKey={refreshKey}
            titulo=""
          />
        </div>
      )}

      {/* Sección especial para Cartera Vencida Impuesto - Solo descarga Excel (se muestra al seleccionar año) */}
      {selectedReporte === 'carteraVencidaImpuesto' && selectedTipo === 'Año' && selectedYear && (
        <div className="mt-6 fade-in">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
            <div className="text-center">
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Reporte de Cartera Vencida Impuesto
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Debido al gran volumen de datos financieros en este reporte, la información está disponible únicamente para descarga directa en Excel.
              </p>
              
              <button
                type="button"
                onClick={handleExcelExport}
                disabled={exporting || loading || !selectedYear}
                className={`inline-flex items-center gap-3 rounded-lg px-8 py-4 text-base font-medium transition-all transform hover:scale-105
                  ${exporting || loading || !selectedYear
                    ? 'bg-gray-400 cursor-not-allowed text-gray-700 scale-100' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'}`}
                title={!selectedYear ? 'Debe seleccionar un año para descargar el reporte' : 'Descargar reporte completo de impuestos'}
              >
                {exporting ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Generando Excel...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Descargar Reporte Excel
                  </>
                )}
              </button>
              
              {totalRecords > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                  Total de registros: {totalRecords.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

       {/* Sección especial para Cartera Vencida de ciu por detalle- Solo descarga Excel (se muestra al seleccionar año) */}
      {selectedReporte === 'carteraVencidaDetalle' && selectedTipo === 'Año' && selectedYear  && (
        <div className="mt-6 fade-in">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
            <div className="text-center">
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Reporte de Cartera Vencida ciu Detallado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Debido al gran volumen de datos en este reporte, la información está disponible únicamente para descarga directa en Excel.
              </p>
              
              <button
                type="button"
                onClick={handleExcelExport}
                disabled={exporting || loading || !selectedYear}
                className={`inline-flex items-center gap-3 rounded-lg px-8 py-4 text-base font-medium transition-all transform hover:scale-105
                  ${exporting || loading || !selectedYear
                    ? 'bg-gray-400 cursor-not-allowed text-gray-700 scale-100' 
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'}`}
                title={!selectedYear ? 'Debe seleccionar un año para descargar el reporte' : 'Descargar reporte completo'}
              >
                {exporting ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Generando Excel...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Descargar Reporte Excel
                  </>
                )}
              </button>
              
              {totalRecords > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                  Total de registros: {totalRecords.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}


       {/* Sección especial para Cartera Vencida por titulo seleccionado- Solo descarga Excel (se muestra al seleccionar año y títulos) */}
        {selectedReporte === 'carteraVencidaTitulo' && selectedTitulos.length > 0 && selectedTipo === 'Año' && selectedYear && (
        <div className="mt-6 fade-in">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
            <div className="text-center">
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Reporte de Cartera Vencida por Título
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
                Títulos seleccionados: <span className="font-semibold text-purple-600">{selectedTitulos.length}</span>
              </p>
              <div className="mb-6 flex flex-wrap justify-center gap-2">
                {selectedTitulos.map((titulo) => (
                  <span key={titulo.CODIGO} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                    {titulo.DESCRIPCION}
                  </span>
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                Debido al gran volumen de datos en este reporte, la información está disponible únicamente para descarga directa en Excel.
              </p>
              
              <button
                type="button"
                onClick={handleExcelExport}
                disabled={exporting || loading || !selectedYear || selectedTitulos.length === 0}
                className={`inline-flex items-center gap-3 rounded-lg px-8 py-4 text-base font-medium transition-all transform hover:scale-105
                  ${exporting || loading || !selectedYear || selectedTitulos.length === 0
                    ? 'bg-gray-400 cursor-not-allowed text-gray-700 scale-100' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl'}`}
                title={!selectedYear ? 'Debe seleccionar un año para descargar el reporte' : 'Descargar reporte por títulos seleccionados'}
              >
                {exporting ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Generando Excel...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Descargar Reporte Excel
                  </>
                )}
              </button>
              
              {totalRecords > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                  Total de registros: {totalRecords.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}