import { useState, useEffect, useMemo } from 'react';
import { MultiSelect as PrimeMultiSelect } from 'primereact/multiselect';
import { ImpuestoOption } from '../../interfaces/reporte.response';
import getImpuesto from '../actions/get-impuesto';

interface MultiSelectImpuestoProps {
  value: ImpuestoOption[];
  onChange: (selected: ImpuestoOption[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxSelection?: number;
}

export default function MultiSelectImpuesto({
  value,
  onChange,
  placeholder = 'Seleccione Impuesto...',
  disabled = false,
  maxSelection = 4,
}: MultiSelectImpuestoProps) {
  const isMaxReached = value?.length >= maxSelection;
  const [Impuesto, setImpuesto] = useState<ImpuestoOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImpuesto = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getImpuesto();
        setImpuesto(data);
      } catch (err) {
        console.error('Error cargando Impuesto:', err);
        setError('Error al cargar los Impuesto');
        setImpuesto([]);
      } finally {
        setLoading(false);
      }
    };
    fetchImpuesto();
  }, []);

  // PrimeReact necesita una propiedad string plana para filtrar y mostrar label.
  const options = useMemo(
    () => Impuesto.map((r) => ({ ...r, label: r.EMI03DES })),
    [Impuesto]
  );

  const itemTemplate = (option: ImpuestoOption & { label: string }) => (
    <div className="flex items-center gap-2">
      <span className="text-gray-900">{option.label}</span>
    </div>
  );

  const selectedItemTemplate = (option: (ImpuestoOption & { label: string }) | null) => {
    if (option) {
      return (
        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-sm mr-1">
          {option.EMI03DES}
        </span>
      );
    }
    return null;
  };

  const panelHeaderTemplate = () => {
    const count = value?.length || 0;
    return (
      <div className="p-3 border-b bg-gray-50">
        <span className="font-semibold text-gray-700">
          {count > 0 ? `${count} de ${maxSelection} impuesto(s) seleccionado(s)` : 'Seleccione Impuesto'}
        </span>
        {isMaxReached && (
          <span className="ml-2 text-orange-600 text-sm">(Máximo alcanzado)</span>
        )}
      </div>
    );
  };

  const handleChange = (selected: ImpuestoOption[]) => {
    if (selected.length <= maxSelection) {
      onChange(selected);
    }
  };

  if (error) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-gray-200 bg-white py-1.5 px-2 text-sm text-gray-700">
      <PrimeMultiSelect
        value={value}
        options={options}
        onChange={(e) => handleChange(e.value)}
        optionLabel="label"
        dataKey="EMI03CODI"
        placeholder={loading ? 'Cargando Impuesto...' : placeholder}
        disabled={disabled || loading}
        filter
        filterBy="label"
        filterPlaceholder="Buscar impuesto..."
        showClear
        display="chip"
        maxSelectedLabels={3}
        selectionLimit={maxSelection}
        selectedItemsLabel="{0} Impuesto seleccionados"
        emptyFilterMessage="No se encontraron Impuesto"
        emptyMessage="No hay Impuesto disponibles"
        itemTemplate={itemTemplate}
        selectedItemTemplate={selectedItemTemplate}
        panelHeaderTemplate={panelHeaderTemplate}
        className="w-full"
        panelClassName="shadow-lg"
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
