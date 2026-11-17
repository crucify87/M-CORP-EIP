import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import type { RecordFields } from '../records';

type LeaveEntry = Pick<RecordFields, 'date' | 'endDate' | 'title' | 'status'> & {
  id: string;
  ownerName: string;
};

export function LeaveCalendar({ today, start, end, entries, onSelect }: {
  today: string; start: string; end: string; onSelect: (day: string) => void;
  entries: LeaveEntry[];
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
    <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-600">
      <span><span aria-hidden className="mr-1 inline-block size-2 rounded-full bg-teal-600" />승인 완료</span>
      <span><span aria-hidden className="mr-1 inline-block size-2 rounded-full bg-amber-500" />승인 대기</span>
    </div>
    <div className="overflow-x-auto pb-1" role="region" aria-label="휴가 일정 달력" tabIndex={0}>
      <div className="grid min-w-[46rem] grid-cols-7 gap-1.5 text-sm">
        {['일', '월', '화', '수', '목', '금', '토'].map(day => <span key={day} className="border-b border-slate-200 pb-2 text-slate-500">{day}</span>)}
        {Array.from({ length: offset }, (_, i) => <span key={i} />)}
        {Array.from({ length: days }, (_, i) => {
          const day = month + '-' + String(i + 1).padStart(2, '0');
          const selected = day >= start && day <= end;
          const requests = entries.filter(entry => entry.status !== '반려' && entry.date <= day && (entry.endDate || entry.date) >= day);
          return <button key={day} type="button" aria-pressed={selected}
            className={`flex min-h-24 min-w-0 flex-col gap-1 rounded-md border p-2 text-left font-medium ${selected ? 'border-blue-600 bg-blue-50 text-blue-950' : 'border-slate-200 hover:bg-slate-50'}`}
            onClick={() => onSelect(day)}>
            <span><span className="sr-only">{month}월 </span>{i + 1}<span className="sr-only">일 </span></span>
            {requests.map(entry => <span key={entry.id}
              className={`w-full break-words rounded px-1.5 py-1 text-xs leading-snug ${entry.status === '승인' ? 'bg-teal-50 text-teal-900' : 'bg-amber-50 text-amber-950'}`}>
              {entry.ownerName} · {entry.title}
              <span className="sr-only"> {entry.status === '승인' ? '승인 완료' : '승인 대기'}</span>
            </span>)}
          </button>;
        })}
      </div>
    </div>
  </section>;
}
