import { useState } from 'react';
import { Calendar } from 'primereact/calendar';

interface SelectRangoProps {
  value?: (Date | null)[] | null;
  onChange?: (dates: (Date | null)[] | null) => void;
}

export default function SelectRango({ value, onChange }: SelectRangoProps = {}) {
  // Estado interno solo cuando no se pasa value desde el padre (uso no controlado)
  const [internalDates, setInternalDates] = useState<(Date | null)[] | null | undefined>(null);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalDates;

  const handleChange = (dates: (Date | null)[] | null) => {
    if (!isControlled) setInternalDates(dates);
    onChange?.(dates);
  };

  return (
    <div className="rounded-md border border-gray-200 bg-white py-1.5 px-2 text-sm text-gray-700">
      <Calendar
        value={currentValue}
        onChange={(e) => handleChange(e.value as (Date | null)[] | null)}
        selectionMode="range"
        readOnlyInput
        hideOnRangeSelection
        className="w-full"
        inputClassName="py-1.46 px-2 text-sm"
        panelStyle={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 15px rgba(0,0,0,0.08)',
          zIndex: 10000,
        }}
      />
    </div>
  );
}
