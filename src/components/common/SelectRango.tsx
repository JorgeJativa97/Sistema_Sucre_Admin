import { useState } from 'react';
import{Calendar} from 'primereact/calendar';

export default function SelectRango() {

    const [dates, setDates] = useState<(Date | null)[] | null | undefined>(null);

  return (
    <div className="rounded-md border border-gray-200 bg-white py-1.5 px-2 text-sm text-gray-700">
      <Calendar
        value={dates}
        onChange={(e) => setDates(e.value)}
        selectionMode="range"
        readOnlyInput
        hideOnRangeSelection
        className="w-full"
        //custimizo el input del calendario
        inputClassName="py-1.46 px-2 text-sm"
        // style the overlay panel so the calendar popup has a solid background
        panelStyle={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 15px rgba(0,0,0,0.08)',
          zIndex: 10000,
        }}
      />
    </div>
  )
}
