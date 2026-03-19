import { useState, useRef, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { getComprobante } from "../../components/actions/get-comprobante";

type TipoPago = "total" | "abono";

export default function Comprobante() {
  const [emi01codi, setEmi01codi]   = useState<string>("");
  const [tipoPago,  setTipoPago]    = useState<TipoPago>("total");
  const [nroAbono,  setNroAbono]    = useState<string>("");
  const [pdfUrl,    setPdfUrl]      = useState<string | null>(null);
  const [loading,   setLoading]     = useState(false);
  const [error,     setError]       = useState<string | null>(null);

  // Revoca la URL del objeto anterior para evitar memory leaks
  const prevUrlRef = useRef<string | null>(null);
  useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    };
  }, []);

  const handleGenerar = async () => {
    if (!emi01codi || isNaN(Number(emi01codi))) {
      setError("Ingrese un código de emisión válido.");
      return;
    }
    if (tipoPago === "abono" && (!nroAbono || isNaN(Number(nroAbono)))) {
      setError("Ingrese un número de abono válido.");
      return;
    }

    setLoading(true);
    setError(null);

    // Libera la URL anterior antes de crear una nueva
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current);
      prevUrlRef.current = null;
      setPdfUrl(null);
    }

    try {
      const blob = await getComprobante(
        Number(emi01codi),
        tipoPago === "abono" ? Number(nroAbono) : undefined
      );
      const url = URL.createObjectURL(blob);
      prevUrlRef.current = url;
      setPdfUrl(url);
    } catch {
      setError("No se pudo generar el comprobante. Verifique el código e intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDescargar = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = tipoPago === "abono"
      ? `comprobante_${emi01codi}_abono_${nroAbono}.pdf`
      : `comprobante_${emi01codi}.pdf`;
    a.click();
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Comprobante" />

      {/* Formulario */}
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-10 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Generar Comprobante
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 items-end">

          {/* Código de emisión */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Código de Emisión (emi01codi)
            </label>
            <input
              type="number"
              min={1}
              value={emi01codi}
              onChange={(e) => setEmi01codi(e.target.value)}
              placeholder="Ej: 12345"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-brand-400"
            />
          </div>

          {/* Tipo de pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Pago
            </label>
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipoPago"
                  value="total"
                  checked={tipoPago === "total"}
                  onChange={() => { setTipoPago("total"); setNroAbono(""); }}
                  className="h-4 w-4 text-brand-500 border-gray-300 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Pago Total</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipoPago"
                  value="abono"
                  checked={tipoPago === "abono"}
                  onChange={() => setTipoPago("abono")}
                  className="h-4 w-4 text-brand-500 border-gray-300 focus:ring-brand-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Abono</span>
              </label>
            </div>
          </div>

          {/* Número de abono (solo si aplica) */}
          <div>
            <label className={`block text-sm font-medium mb-1 transition-colors ${tipoPago === "abono" ? "text-gray-700 dark:text-gray-300" : "text-gray-300 dark:text-gray-600"}`}>
              Número de Abono
            </label>
            <input
              type="number"
              min={1}
              value={nroAbono}
              onChange={(e) => setNroAbono(e.target.value)}
              placeholder="Ej: 1"
              disabled={tipoPago === "total"}
              className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors
                ${tipoPago === "total"
                  ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-600"
                  : "border-gray-300 bg-white text-gray-900 focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-brand-400"
                }`}
            />
          </div>
        </div>

        {/* Botones */}
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGenerar}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-all
              ${loading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
                : "bg-brand-500 hover:bg-brand-600 text-white shadow-sm hover:shadow-md"
              }`}
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generando...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Generar Comprobante
              </>
            )}
          </button>

          {pdfUrl && (
            <button
              type="button"
              onClick={handleDescargar}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Descargar PDF
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Visor PDF */}
      {pdfUrl && (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Vista previa — Comprobante {emi01codi}
              {tipoPago === "abono" && ` · Abono #${nroAbono}`}
            </span>
          </div>
          <iframe
            src={pdfUrl}
            title="Comprobante PDF"
            className="w-full"
            style={{ height: "75vh" }}
          />
        </div>
      )}
    </div>
  );
}
