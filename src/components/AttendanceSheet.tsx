import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, onSnapshot, query, where, type Firestore, type Timestamp } from 'firebase/firestore';
import type { Employee } from '../records';

interface AttendanceRecord {
  owner: string;
  date: string;
  status: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

interface Staff {
  uid: string;
  name: string;
}

const PAGE_SIZE = 20;
const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
const time = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function AttendanceSheet({ db, uid, name, today, canManage, rows, loading, readError }: {
  db: Firestore; uid: string; name: string; today: string; canManage: boolean;
  rows: AttendanceRecord[]; loading: boolean; readError: boolean;
}) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const [page, setPage] = useState(0);
  const [roster, setRoster] = useState<Staff[] | 'error'>();

  useEffect(() => {
    if (!canManage) return;
    return onSnapshot(query(collection(db, 'employees'), where('active', '==', true)), snapshot => {
      setRoster(snapshot.docs.map(item => ({ uid: item.id, name: (item.data() as Employee).name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'ko') || a.uid.localeCompare(b.uid)));
    }, () => setRoster('error'));
  }, [db, canManage]);

  const records = useMemo(() => {
    const byPersonAndDate = new Map<string, AttendanceRecord>();
    for (const row of rows) byPersonAndDate.set(row.owner + '/' + row.date, row);
    return byPersonAndDate;
  }, [rows]);

  const [year, monthNumber] = month.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const days = Array.from({ length: 31 }, (_, index) => {
    const day = index + 1;
    return { day, date: month + '-' + String(day).padStart(2, '0'),
      weekday: day <= daysInMonth ? weekdays[new Date(Date.UTC(year, monthNumber - 1, day)).getUTCDay()] : '' };
  });
  const staff = canManage ? (Array.isArray(roster) ? roster : []) : [{ uid, name }];
  const pageCount = Math.max(1, Math.ceil(staff.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);

  function moveMonth(delta: number) {
    setMonth(new Date(Date.UTC(year, monthNumber - 1 + delta, 1)).toISOString().slice(0, 7));
  }

  return <section className="panel mb-5" aria-labelledby="attendance-sheet-heading">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 id="attendance-sheet-heading" className="text-lg font-bold">월별 출퇴근표</h2>
      <div className="flex flex-wrap items-center gap-1">
        <button type="button" className="icon-button" aria-label="이전 달" onClick={() => moveMonth(-1)}><ChevronLeft size={18} /></button>
        <span className="min-w-24 text-center text-sm font-semibold" aria-live="polite">{year}년 {monthNumber}월</span>
        <button type="button" className="icon-button" aria-label="다음 달" onClick={() => moveMonth(1)}><ChevronRight size={18} /></button>
        <button type="button" className="secondary" onClick={() => setMonth(today.slice(0, 7))}>이번 달</button>
      </div>
    </div>
    <p className="my-3 text-sm text-slate-600">좌우로 스크롤하면 31일까지 볼 수 있습니다.</p>
    {(readError || roster === 'error') && <p role="alert" className="mb-3 text-sm text-red-700">출퇴근표를 불러오지 못했습니다.</p>}
    {(loading || (canManage && roster === undefined)) && <p role="status" className="mb-3 text-sm text-slate-600">출퇴근표를 불러오는 중…</p>}
    {!readError && roster !== 'error' && <div className="overflow-x-auto rounded-xl border border-slate-200" tabIndex={0}
      role="region" aria-label="월별 출퇴근표 스크롤 영역">
      <table className="attendance-sheet text-sm">
        <caption className="sr-only">{year}년 {monthNumber}월 직원 출퇴근 기록</caption>
        <thead>
          <tr>
            <th scope="col">성명</th>
            {days.map(({ day, date, weekday }) => <th key={day} scope="col" data-today={date === today || undefined}
              data-muted={!weekday || undefined}>
              {day}일<span className="block text-xs font-normal">{weekday || '—'}</span>
            </th>)}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: PAGE_SIZE }, (_, index) => {
            const person = staff[currentPage * PAGE_SIZE + index];
            return <tr key={person?.uid ?? index}>
              <th scope="row">{person?.name ?? '—'}</th>
              {days.map(({ day, date, weekday }) => {
                const row = person && weekday ? records.get(person.uid + '/' + date) : undefined;
                return <td key={day} data-muted={!weekday || undefined}>
                  {row ? <>
                    {row.createdAt && <span className="block whitespace-nowrap text-xs font-semibold tabular-nums text-[#2457d6]">출 {time.format(row.createdAt.toDate())}</span>}
                    <span className="block text-xs tabular-nums text-slate-600">
                      {row.status === '퇴근' && row.updatedAt ? '퇴 ' + time.format(row.updatedAt.toDate()) : row.status}
                    </span>
                  </> : <span className="text-slate-400">—</span>}
                </td>;
              })}
            </tr>;
          })}
        </tbody>
      </table>
    </div>}
    {pageCount > 1 && <div className="mt-3 flex items-center justify-center gap-3">
      <button type="button" className="secondary" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>이전 20명</button>
      <span className="text-sm tabular-nums" aria-live="polite">{currentPage + 1} / {pageCount}</span>
      <button type="button" className="secondary" disabled={currentPage === pageCount - 1} onClick={() => setPage(currentPage + 1)}>다음 20명</button>
    </div>}
  </section>;
}
