import { useState, useEffect, useMemo } from 'react';
import { MultiSelect as PrimeMultiSelect } from 'primereact/multiselect';
import { RubroOption } from '../../interfaces/reporte.response';
import getRubros from '../actions/get-rubros';

interface MultiSelectRubrosProps {
  value: RubroOption[];
  onChange: (selected: RubroOption[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxSelection?: number;
}

export default function MultiSelectRubros({
  value,
  onChange,
  placeholder = 'Seleccione rubros...',
  disabled = false,
  maxSelection = 4,
}: MultiSelectRubrosProps) {
  const isMaxReached = value?.length >= maxSelection;
  const [rubros, setRubros] = useState<RubroOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRubros = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getRubros();
        setRubros(data);
      } catch (err) {
        console.error('Error cargando rubros:', err);
        setError('Error al cargar los rubros');
        setRubros([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRubros();
  }, []);

  // PrimeReact necesita una propiedad string plana para filtrar y mostrar label.
  // Generamos "{EMI04DESD} - {EMI03DES}" en un campo derivado.
  const options = useMemo(
    () => rubros.map((r) => ({ ...r, label: `${r.EMI04DESD} - ${r.EMI03DES}` })),
    [rubros]
  );

  const itemTemplate = (option: RubroOption & { label: string }) => (
    <div className="flex items-center gap-2">
      <span className="text-gray-900">{option.label}</span>
    </div>
  );

  const selectedItemTemplate = (option: (RubroOption & { label: string }) | null) => {
    if (option) {
      return (
        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-sm mr-1">
          {option.EMI04DESD}
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
          {count > 0 ? `${count} de ${maxSelection} rubro(s) seleccionado(s)` : 'Seleccione rubros'}
        </span>
        {isMaxReached && (
          <span className="ml-2 text-orange-600 text-sm">(Máximo alcanzado)</span>
        )}
      </div>
    );
  };

  const handleChange = (selected: RubroOption[]) => {
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
        dataKey="EMI04CODI"
        placeholder={loading ? 'Cargando rubros...' : placeholder}
        disabled={disabled || loading}
        filter
        filterBy="label"
        filterPlaceholder="Buscar rubro..."
        showClear
        display="chip"
        maxSelectedLabels={3}
        selectionLimit={maxSelection}
        selectedItemsLabel="{0} rubros seleccionados"
        emptyFilterMessage="No se encontraron rubros"
        emptyMessage="No hay rubros disponibles"
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
