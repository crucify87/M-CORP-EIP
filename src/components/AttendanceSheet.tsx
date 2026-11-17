import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, doc, onSnapshot, query, runTransaction, where, type Firestore, type Timestamp } from 'firebase/firestore';
import { moduleRecords, type Employee } from '../records';
import { leaveQuotaType, usedLeaveDays, type ApprovedLeave } from '../leaveBalance';

interface AttendanceRecord {
  owner: string;
  date: string;
  status: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

interface Staff extends Pick<Employee, 'name' | 'annualDays' | 'monthlyDays'> {
  uid: string;
}

const PAGE_SIZE = 10;
const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
const time = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function AttendanceSheet({ db, uid, employee, today, canManage, rows, loading, readError }: {
  db: Firestore; uid: string; employee: Employee; today: string; canManage: boolean;
  rows: AttendanceRecord[]; loading: boolean; readError: boolean;
}) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const [page, setPage] = useState(0);
  const [roster, setRoster] = useState<Staff[] | 'error'>();
  const [leave, setLeave] = useState<ApprovedLeave[] | 'error'>();
  const [editing, setEditing] = useState<Staff>();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!canManage) return;
    return onSnapshot(query(collection(db, 'employees'), where('active', '==', true)), snapshot => {
      setRoster(snapshot.docs.map(item => ({ ...(item.data() as Employee), uid: item.id }))
        .sort((a, b) => a.name.localeCompare(b.name, 'ko') || a.uid.localeCompare(b.uid)));
    }, () => setRoster('error'));
  }, [db, canManage]);

  useEffect(() => onSnapshot(moduleRecords(db, 'leave', uid, canManage),
    snapshot => setLeave(snapshot.docs.map(item => item.data() as ApprovedLeave).filter(row => row.status === '승인')),
    () => setLeave('error'),
  ), [db, uid, canManage]);

  const leaveByPerson = useMemo(() => {
    const grouped = new Map<string, ApprovedLeave[]>();
    if (Array.isArray(leave)) {
      for (const row of leave) {
        const items = grouped.get(row.owner);
        if (items) items.push(row);
        else grouped.set(row.owner, [row]);
      }
    }
    return grouped;
  }, [leave]);

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
  const staff = canManage ? (Array.isArray(roster) ? roster : []) : [{ uid, ...employee }];
  const pageCount = Math.max(1, Math.ceil(staff.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);

  function moveMonth(delta: number) {
    setMonth(new Date(Date.UTC(year, monthNumber - 1 + delta, 1)).toISOString().slice(0, 7));
  }

  async function saveAllowance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || saving) return;
    const fields = new FormData(event.currentTarget);
    const annualDays = Number(fields.get('annualDays'));
    const monthlyDays = Number(fields.get('monthlyDays'));
    const ref = doc(db, 'employees', editing.uid);
    setSaving(true);
    setMessage('');
    try {
      await runTransaction(db, async transaction => {
        const current = (await transaction.get(ref)).data() as Employee | undefined;
        if (!current?.active || current.annualDays !== editing.annualDays || current.monthlyDays !== editing.monthlyDays) {
          throw new Error('Allowance changed');
        }
        transaction.update(ref, { annualDays, monthlyDays });
      });
      setEditing(undefined);
      setMessage('부여 일수를 저장했습니다.');
    } catch {
      setEditing(undefined);
      setMessage('저장하지 못했습니다. 최신 부여 일수를 확인하고 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
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
    <p className="mb-3 text-xs text-slate-600">잔여 일수 = 누적 부여 일수 − 승인된 연차·월차의 평일 수</p>
    {leave === 'error' && <p role="alert" className="mb-3 text-sm text-red-700">휴가 기록을 불러오지 못했습니다.</p>}
    {message && <p role="status" className="mb-3 text-sm text-slate-700">{message}</p>}
    {editing && <form key={editing.uid} className="mb-4 grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-2"
      onSubmit={saveAllowance}>
      <h3 className="font-bold sm:col-span-2">{editing.name} 부여 일수</h3>
      <label>연차<input className="field" name="annualDays" type="number" min="0" max="10000" required defaultValue={editing.annualDays ?? 0} /></label>
      <label>월차<input className="field" name="monthlyDays" type="number" min="0" max="10000" required defaultValue={editing.monthlyDays ?? 0} /></label>
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" className="primary" disabled={saving}>저장</button>
        <button type="button" className="secondary" disabled={saving} onClick={() => setEditing(undefined)}>취소</button>
      </div>
    </form>}
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
            const approvedLeave = person ? leaveByPerson.get(person.uid) ?? [] : [];
            const annualUsed = usedLeaveDays(approvedLeave, 'annual');
            const monthlyUsed = usedLeaveDays(approvedLeave, 'monthly');
            return <tr key={person?.uid ?? index}>
              <th scope="row">{person ? <>
                <span className="block">{person.name}</span>
                {Array.isArray(leave) && <span className="block text-xs font-normal text-slate-700">
                  연차 {person.annualDays === undefined ? '미설정' : (person.annualDays - annualUsed) + '일'}<br />
                  월차 {person.monthlyDays === undefined ? '미설정' : (person.monthlyDays - monthlyUsed) + '일'}
                </span>}
                {employee.role === 'admin' && <button type="button" className="mt-1 text-xs text-blue-700 underline"
                  disabled={saving} onClick={() => { setEditing(person); setMessage(''); document.getElementById('attendance-sheet-heading')?.scrollIntoView({ block: 'center' }); }}>부여 일수 설정</button>}
              </> : '—'}</th>
              {days.map(({ day, date, weekday }) => {
                const row = person && weekday ? records.get(person.uid + '/' + date) : undefined;
                const leaveTypes = weekday ? [...new Set(approvedLeave.filter(entry =>
                  entry.date <= date && (entry.endDate || entry.date) >= date).map(entry => entry.title))] : [];
                return <td key={day} data-muted={!weekday || undefined}>
                  {row ? <>
                    {row.createdAt && <span className="block whitespace-nowrap text-xs font-semibold tabular-nums text-[#2457d6]">출 {time.format(row.createdAt.toDate())}</span>}
                    <span className="block text-xs tabular-nums text-slate-600">
                      {row.status === '퇴근' && row.updatedAt ? '퇴 ' + time.format(row.updatedAt.toDate()) : row.status}
                    </span>
                  </> : leaveTypes.length === 0 && <span className="text-slate-400">—</span>}
                  {leaveTypes.map(title => <span key={title} className="block text-xs font-semibold text-teal-800">
                    ✓ {leaveQuotaType(title) === 'annual' ? '연차' : leaveQuotaType(title) === 'monthly' ? '월차' : title}
                  </span>)}
                </td>;
              })}
            </tr>;
          })}
        </tbody>
      </table>
    </div>}
    {pageCount > 1 && <div className="mt-3 flex items-center justify-center gap-3">
      <button type="button" className="secondary" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>이전 {PAGE_SIZE}명</button>
      <span className="text-sm tabular-nums" aria-live="polite">{currentPage + 1} / {pageCount}</span>
      <button type="button" className="secondary" disabled={currentPage === pageCount - 1} onClick={() => setPage(currentPage + 1)}>다음 {PAGE_SIZE}명</button>
    </div>}
  </section>;
}
