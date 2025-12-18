import { useState, useEffect } from 'react';
import { MultiSelect as PrimeMultiSelect } from 'primereact/multiselect';
import { CarteraVencidaTitulo } from '../../interfaces/reporte.response';
import getTitulos from '../actions/get-titulos';

interface MultiSelectTitulosProps {
  value: CarteraVencidaTitulo[];
  onChange: (selected: CarteraVencidaTitulo[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function MultiSelectTitulos({
  value,
  onChange,
  placeholder = "Seleccione títulos...",
  disabled = false
}: MultiSelectTitulosProps) {
  const [titulos, setTitulos] = useState<CarteraVencidaTitulo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar títulos al montar el componente
  useEffect(() => {
    const fetchTitulos = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getTitulos();
        setTitulos(data);
      } catch (err) {
        console.error('Error cargando títulos:', err);
        setError('Error al cargar los títulos');
        setTitulos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTitulos();
  }, []);

  // Template para mostrar cada opción
  const itemTemplate = (option: CarteraVencidaTitulo) => {
    return (
      <div className="flex items-center gap-2">
      {/*<span className="font-medium text-gray-700">{option.CODIGO}</span>*/}  
       {/*<span className="text-gray-500">-</span>*/}
        <span className="text-gray-900">{option.DESCRIPCION}</span>
      </div>
    );
  };

  // Template para mostrar los items seleccionados
  const selectedItemTemplate = (option: CarteraVencidaTitulo | null) => {
    if (option) {
      return (
        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-sm mr-1">
          {option.DESCRIPCION}
        </span>
      );
    }
    return null;
  };

  // Template para el panel header (muestra cuántos seleccionados)
  const panelHeaderTemplate = () => {
    const count = value?.length || 0;
    return (
      <div className="p-3 border-b bg-gray-50">
        <span className="font-semibold text-gray-700">
          {count > 0 ? `${count} título(s) seleccionado(s)` : 'Seleccione títulos'}
        </span>
      </div>
    );
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
        options={titulos}
        onChange={(e) => onChange(e.value)}
        optionLabel="DESCRIPCION"
        placeholder={loading ? "Cargando títulos..." : placeholder}
        disabled={disabled || loading}
        filter
        filterPlaceholder="Buscar título..."
        showClear
        display="chip"
        maxSelectedLabels={3}
        selectedItemsLabel="{0} títulos seleccionados"
        emptyFilterMessage="No se encontraron títulos"
        emptyMessage="No hay títulos disponibles"
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
      {loading && (
        <div className="absolute right-10 top-9">
          <svg className="animate-spin h-4 w-4 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
        </div>
      )}
    </div>
  );
}
