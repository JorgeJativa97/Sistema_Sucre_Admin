import { useState, useEffect } from 'react';
import { DataTable, DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';

// Tipos para configuración
export interface ColumnaConfig<T> {
  campo: keyof T;
  header: string;
  ancho?: string;
}

export interface ParamsConsulta {
  page: number;
  pageSize: number;
  q: string;
}

interface TablaServerSideProps<T> {
  datos: T[];
  columnas: ColumnaConfig<T>[];
  loading: boolean;
  totalRegistros: number;
  onParamsChange: (params: ParamsConsulta) => void;
  titulo?: string;
  resetKey?: number | string; // Propiedad nueva para forzar reseteo externo
}

export const TablaServerSide = <T extends object>({ 
  datos, 
  columnas, 
  loading,
  totalRegistros,
  onParamsChange,
  titulo = "Resultados",
  resetKey
}: TablaServerSideProps<T>) => {
  
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [busqueda, setBusqueda] = useState('');

  // Efecto para resetear la tabla si el usuario cambia el reporte (botón Consultar)
  useEffect(() => {
    if (resetKey !== undefined) {
      setFirst(0);
      setBusqueda('');
      // Esto disparará la carga inicial de la página 1
    }
  }, [resetKey]);

  // Efecto Debounce para búsqueda y paginación
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const paginaActual = (first / rows) + 1;
      onParamsChange({
        page: paginaActual,
        pageSize: rows,
        q: busqueda
      });
    }, 500); // 500ms de espera

    return () => clearTimeout(timeoutId);
  }, [busqueda, first, rows, resetKey, onParamsChange]); 

  const onPage = (event: DataTablePageEvent) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  const header = (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-2">
      <span className="text-xl font-bold text-gray-700">{titulo}</span>
      <span className="p-input-icon-left w-full md:w-auto">
        <i className="pi pi-search" />
        <InputText 
          value={busqueda} 
          onChange={(e) => {
             setBusqueda(e.target.value);
             setFirst(0); 
          }} 
          placeholder="Buscar..." 
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" 
        />
      </span>
    </div>
  );

  return (
    <div className="card bg-white shadow-md rounded-lg p-4">
      <DataTable 
        value={datos}
        lazy
        paginator 
        first={first}
        rows={rows}
        totalRecords={totalRegistros}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPage={onPage}
        loading={loading}
        header={header}
        emptyMessage="No se encontraron registros."
        className="p-datatable-sm"
        stripedRows
      >
        {columnas.map((col, index) => (
          <Column 
            key={`${String(col.campo)}-${index}`}
            field={String(col.campo)}
            header={col.header}
            style={{ width: col.ancho }}
          />
        ))}
      </DataTable>
    </div>
  );
};