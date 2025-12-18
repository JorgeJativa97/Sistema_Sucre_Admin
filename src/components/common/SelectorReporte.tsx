import type { FC } from 'react';

interface SelectorReporteProps {
  // Lista de opciones para poblar el select
  reporte: string[];
  // Opcional: callback cuando cambia la selección
  onChange?: (value: string) => void;
  // Valor seleccionado controlado opcional
  value?: string;
}

const SelectorReporte: FC<SelectorReporteProps> = ({ reporte, onChange, value }) => {
  return (
    <div>
      <select
        id="selector-reporte"
        name="selector-reporte"
        value={value ?? ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="rounded-md border border-gray-200 bg-white py-1.5 px-2 text-sm text-gray-700"
      >
        <option value="">-- Seleccione --</option>
        {reporte.map((r, idx) => (
          <option key={idx} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectorReporte;
