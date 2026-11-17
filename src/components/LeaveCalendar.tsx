import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

export function LeaveCalendar({ today, start, end, onSelect }: {
  today: string; start: string; end: string; onSelect: (day: string) => void;
}) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const [year, number] = month.split('-').map(Number);
  const offset = new Date(Date.UTC(year, number - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, number, 0)).getUTCDate();
  function move(delta: number) {
    setMonth(new Date(Date.UTC(year, number - 1 + delta, 1)).toISOString().slice(0, 7));
  }
  return <section className="panel mb-4">
    <div className="mb-4 flex items-center gap-3">
      <button type="button" aria-label="이전 달" className="icon-button" onClick={() => move(-1)}><ChevronLeft size={18} /></button>
      <h2 className="font-bold">{year}년 {number}월</h2>
      <button type="button" aria-label="다음 달" className="icon-button" onClick={() => move(1)}><ChevronRight size={18} /></button>
      <button type="button" className="secondary ml-auto inline-flex items-center gap-1" onClick={() => setMonth(today.slice(0, 7))}><CalendarDays size={15} /> 오늘</button>
    </div>
    <div className="grid grid-cols-7 gap-1 text-center text-sm">
      {['일', '월', '화', '수', '목', '금', '토'].map(day => <span key={day} className="border-b border-slate-200 pb-2 text-slate-500">{day}</span>)}
      {Array.from({ length: offset }, (_, i) => <span key={i} />)}
      {Array.from({ length: days }, (_, i) => {
        const day = month + '-' + String(i + 1).padStart(2, '0');
        const selected = day >= start && day <= end;
        return <button key={day} type="button" aria-label={day} aria-pressed={selected}
          className={`min-h-9 rounded-md font-medium ${selected ? 'bg-[#173895] text-white' : 'hover:bg-blue-50'}`}
          onClick={() => onSelect(day)}>{i + 1}</button>;
      })}
    </div>
  </section>;
}
