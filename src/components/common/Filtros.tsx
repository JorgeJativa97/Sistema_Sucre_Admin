interface FiltrosProps {
    title: string;
}


export default function Filtros({title}: FiltrosProps) {
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h1>
    </div>
  )
}
