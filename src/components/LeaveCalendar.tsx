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
  const [viewedDay, setViewedDay] = useState(today);
  const [year, number] = month.split('-').map(Number);
  const offset = new Date(Date.UTC(year, number - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const activeDay = viewedDay.startsWith(month + '-') ? viewedDay : month + '-01';
  const requestsForDay = (day: string) => entries.filter(entry =>
    entry.status !== '반려' && entry.date <= day && (entry.endDate || entry.date) >= day);
  const dailyRequests = requestsForDay(activeDay);
  function move(delta: number) {
    setMonth(new Date(Date.UTC(year, number - 1 + delta, 1)).toISOString().slice(0, 7));
  }
  return <section className="panel mb-4">
    <div className="mb-4 flex flex-wrap items-center gap-1 sm:gap-3">
      <button type="button" aria-label="이전 달" className="icon-button" onClick={() => move(-1)}><ChevronLeft size={18} /></button>
      <h2 className="whitespace-nowrap font-bold">{year}년 {number}월</h2>
      <button type="button" aria-label="다음 달" className="icon-button" onClick={() => move(1)}><ChevronRight size={18} /></button>
      <button type="button" className="secondary ml-auto inline-flex items-center gap-1" onClick={() => {
        setMonth(today.slice(0, 7));
        setViewedDay(today);
      }}><CalendarDays size={15} /> 오늘</button>
    </div>
    <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-600">
      <span><span aria-hidden className="mr-1 inline-block size-2 rounded-full bg-teal-600" />승인 완료</span>
      <span><span aria-hidden className="mr-1 inline-block size-2 rounded-full bg-amber-500" />승인 대기</span>
    </div>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_15rem]">
      <div className="grid grid-cols-7 gap-1 text-sm sm:gap-1.5" role="group" aria-label="휴가 일정 달력">
        {['일', '월', '화', '수', '목', '금', '토'].map(day => <span key={day} className="border-b border-slate-200 pb-2 text-slate-500">{day}</span>)}
        {Array.from({ length: offset }, (_, i) => <span key={i} />)}
        {Array.from({ length: days }, (_, i) => {
          const day = month + '-' + String(i + 1).padStart(2, '0');
          const selected = day >= start && day <= end;
          const requests = requestsForDay(day);
          return <button key={day} type="button" aria-pressed={selected}
            aria-current={day === today ? 'date' : undefined}
            className={`flex min-h-12 min-w-0 flex-col items-center gap-1 rounded-lg border py-1.5 font-medium sm:min-h-20 sm:items-start sm:px-2 ${selected ? 'border-blue-600 bg-blue-50 text-blue-950' : 'border-slate-200 hover:bg-slate-50'}`}
            onClick={() => { setViewedDay(day); onSelect(day); }}>
            <span><span className="sr-only">{month}월 </span>{i + 1}<span className="sr-only">일 </span></span>
            {requests.length > 0 && <span className="max-w-full truncate rounded-full bg-slate-100 px-0.5 text-[10px] text-slate-700 sm:hidden">{requests.length}건</span>}
            {requests.map(entry => <span key={entry.id}
              className={`hidden w-full break-words rounded px-1.5 py-1 text-xs leading-snug sm:block ${entry.status === '승인' ? 'bg-teal-50 text-teal-900' : 'bg-amber-50 text-amber-950'}`}>
              {entry.ownerName} · {entry.title}
            </span>)}
          </button>;
        })}
      </div>
      <aside className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4" aria-labelledby="leave-day-heading">
        <h3 id="leave-day-heading" className="font-bold">{number}월 {Number(activeDay.slice(-2))}일 휴가 일정</h3>
        {dailyRequests.length === 0
          ? <p className="mt-2 text-sm text-slate-600">등록된 일정이 없습니다.</p>
          : <ul className="mt-2 divide-y divide-slate-200">
            {dailyRequests.map(entry => <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <span className="min-w-0 break-words">{entry.ownerName} · {entry.title}</span>
              <span className="status-chip" data-tone={entry.status === '승인' ? 'approved' : 'pending'}>{entry.status === '승인' ? '승인 완료' : '승인 대기'}</span>
            </li>)}
          </ul>}
      </aside>
    </div>
  </section>;
}
