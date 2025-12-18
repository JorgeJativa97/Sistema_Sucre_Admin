import { useState } from "react";
// Componentes UI
import Filtros from "../../components/common/Filtros";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import SelectorReporte from "../../components/common/SelectorReporte";
import YearSelect from "../../components/common/YearSelect";
import SelectAdmin from "../../components/common/SelectAdmin";
import SelectRango from "../../components/common/SelectRango";
import MultiSelectTitulos from "../../components/common/MultiSelectTitulos";

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
  });

  // Hook para manejar la exportación a Excel
  const { exporting, exportWithFetch } = useExcelExport<ReporteUnionResponse>();

  // Definición de Columnas dinámicas basadas en el tipo de reporte
  const columns = getColumnsForReporte(selectedReporte, data);

  // Manejador para cambio de reporte (resetea el estado consultado)
  const handleReporteChange = (v: string) => {
    setSelectedReporte(v);
    setSelectedTitulos([]); // Resetear títulos seleccionados
    resetConsulted(); // Ocultar tabla al cambiar reporte
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
                       selectedReporte ===  'carteraVencidaDetalle' ? 'cartera_vencida_detalle' :
                       selectedReporte;
    
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${reporteName}_${selectedYear}_${dateStr}.xlsx`;

    exportWithFetch(getAllData, {
      filename,
      sheetName: 'Reporte',
      includeHeaders: true
    });
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

          {(selectedReporte === 'carteraVencida' || selectedReporte === 'carteraVencidaImpuesto'  || selectedReporte === 'carteraVencidaDetalle') && (
            <div>
              <SelectAdmin
                nombre={["Año", "Rango"]}
                onChange={(v) => setSelectedTipo(v)}
                value={selectedTipo}
              />
            </div>
          )}

          {(selectedTipo === 'Año') && (
            <div className="w-48">
              <YearSelect
                value={selectedYear}
                onChange={(y) => setSelectedYear(y)}
                startYear={2000}
                endYear={new Date().getFullYear()}
              />
            </div>
          )}

          {/* MultiSelect de Títulos - Solo para carteraVencidaTitulo */}
          {selectedReporte === 'carteraVencidaTitulo' && (
            <div className="w-80">
              <MultiSelectTitulos
                value={selectedTitulos}
                onChange={(selected) => setSelectedTitulos(selected)}
                placeholder="Seleccione títulos..."
              />
            </div>
          )}

          {(selectedTipo === 'Rango') && (
             <div className="w-72">
               <SelectRango />
             </div>
          )}

          {/* Botón consultar solo para reportes que NO sean cartera vencida ni cartera vencida impuesto */}
         {/* {selectedReporte !== 'carteraVencida' && selectedReporte !== 'carteraVencidaImpuesto' && (
            <div className="md:ml-4">
              <button
                type="button"
                disabled={!selectedYear}
                className={`inline-flex items-center gap-2 rounded px-4 py-2 text-white transition-colors
                  ${!selectedYear
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}
                onClick={handleConsultar}
                title={!selectedYear ? 'Debe seleccionar un año para continuar' : 'Ejecutar consulta'}
              >
                Consultar
              </button>
            </div>
          )} */}
        </div>
      </div>

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

      {/* Sección especial para Cartera Vencida - Solo descarga Excel (se muestra al seleccionar año) */}
      {selectedReporte === 'carteraVencida' && selectedTipo === 'Año' && selectedYear  && (
        <div className="mt-6 fade-in">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
            <div className="text-center">
              <div className="mb-6">
                <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Reporte de Cartera Vencida
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
    </div>
  );
}