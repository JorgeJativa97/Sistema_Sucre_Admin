import { useState } from "react";

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { getBienesInmuebles } from "../../components/actions/get-bienes-inmuebles";
import {
  GAD_TIP_IDENT,
  GAD_ID_IDENT,
  GAD_COD_OP,
  buildBienesInmueblesXml,
  downloadXmlFile,
} from "../../utils/buildBienesInmueblesXml";

export default function BienesInmuebles() {
  const [loading,    setLoading]    = useState(false);
  const [descargado, setDescargado] = useState(false);
  const [registros,  setRegistros]  = useState(0);
  const [error,      setError]      = useState<string | null>(null);

  const handleDescargar = async () => {
    setLoading(true);
    setError(null);
    setDescargado(false);

    try {
      const data = await getBienesInmuebles();

      if (!data || data.length === 0) {
        setError("El servidor no devolvió registros de bienes inmuebles.");
        return;
      }

      const xml      = buildBienesInmueblesXml(data);
      const anio     = new Date().getFullYear();
      downloadXmlFile(xml, `bienes_inmuebles_${anio}.xml`);

      setRegistros(data.length);
      setDescargado(true);
    } catch {
      setError("Ocurrió un error al obtener los datos. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Bienes Inmuebles" />

      {/* Tarjeta principal */}
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="flex flex-col items-center text-center">

          {/* Ícono */}
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Reporte de Bienes Inmuebles
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-2 max-w-md">
            Genera el archivo XML con la estructura requerida por el SRI para la
            declaración de bienes inmuebles del año{" "}
            <span className="font-semibold text-orange-500">{new Date().getFullYear()}</span>.
          </p>

          {/* Info del GAD */}
          <div className="mb-8 flex flex-wrap justify-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
              RUC: <span className="font-medium text-gray-700 dark:text-gray-300">{GAD_ID_IDENT}</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
              Tipo: <span className="font-medium text-gray-700 dark:text-gray-300">{GAD_TIP_IDENT}</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800">
              Código: <span className="font-medium text-gray-700 dark:text-gray-300">{GAD_COD_OP}</span>
            </span>
          </div>

          {/* Botón de descarga */}
          <button
            type="button"
            onClick={handleDescargar}
            disabled={loading}
            className={`inline-flex items-center gap-3 rounded-lg px-8 py-4 text-base font-medium transition-all transform hover:scale-105
              ${loading
                ? "bg-gray-400 cursor-not-allowed text-gray-700 scale-100"
                : "bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl"
              }`}
          >
            {loading ? (
              <>
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generando XML...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Descargar XML
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Confirmación de descarga exitosa */}
      {descargado && !loading && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 rounded-md fade-in">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium">Archivo descargado exitosamente</p>
              <p className="text-sm mt-1">
                <span className="font-semibold">{registros.toLocaleString()} registros</span> exportados en{" "}
                <span className="font-semibold">bienes_inmuebles_{new Date().getFullYear()}.xml</span>
              </p>
              <button
                onClick={() => setDescargado(false)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline"
              >
                Descargar nuevamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
