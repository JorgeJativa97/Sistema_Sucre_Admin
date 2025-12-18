import type { FC } from 'react';

interface YearSelectProps {
  value?: string; // año seleccionado como string ('' para ninguno)
  onChange?: (year: string) => void;
  startYear?: number; // por defecto 2000
  endYear?: number;   // por defecto año actual
  placeholder?: string;
  className?: string;
}

const YearSelect: FC<YearSelectProps> = ({
  value = '',
  onChange,
  startYear = 2000,
  endYear = new Date().getFullYear(),
  placeholder = '-- Seleccione año --',
  className = 'rounded-md border border-gray-200 bg-white py-1.5 px-2 text-sm text-gray-700',
}) => {
  const years: number[] = [];
  for (let y = endYear; y >= startYear; y--) years.push(y);

  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className={className}
    >
      <option value="">{placeholder}</option>
      {years.map((y) => (
        <option key={y} value={String(y)}>
          {y}
        </option>
      ))}
    </select>
  );
};

export default YearSelect;