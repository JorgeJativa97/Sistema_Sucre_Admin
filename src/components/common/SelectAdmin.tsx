import { FC } from "react";


interface SelectorPromps {
    // Define any props needed for SelectorReporte here
    nombre: string[]
    // Opcional: callback cuando cambia la selección
    onChange?: (value: string) => void;
  // Valor seleccionado controlado opcional
    value?: string;
}

 const SelectAdmin: FC<SelectorPromps> = ({nombre, onChange, value}) => {
  return (
    <div>
      <select 
        id="selector"
        name="selector"
        value={value ?? ''}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="rounded-md border border-gray-200 bg-white py-1.5 px-2 text-sm text-gray-700">
        <option value="">-- Seleccione --</option>
        {nombre.map((r, idx) => (
          <option key={idx} value={r}>{r}</option>
        ))}
      </select>
    </div>
  )
}

export default SelectAdmin;
