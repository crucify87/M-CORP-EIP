import { useEffect, useState, type FormEvent } from 'react';
import { Building2, CalendarDays, ClipboardCheck, Clock3, Landmark, LogOut, Package, TrendingUp } from 'lucide-react';
import { addDoc, collection, doc, onSnapshot, query, runTransaction, serverTimestamp, where,
  type Firestore, type Timestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { localDate, manages, moduleKeys, modules, type Employee, type ModuleKey, type RecordFields } from '../records';

interface Row extends RecordFields {
  id: string;
  owner: string;
  ownerName: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

const icons = { approvals: ClipboardCheck, attendance: Clock3, leave: CalendarDays,
  accounting: Landmark, sales: TrendingUp, inventory: Package };
const numberFormat = new Intl.NumberFormat('ko-KR');
const timeFormat = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', dateStyle: 'short', timeStyle: 'short',
});
const restricted = (module: ModuleKey) => module === 'sales' || module === 'inventory';

export function Workspace({ user, employee, db, onLogout }: {
  user: User; employee: Employee; db: Firestore; onLogout: () => Promise<void>;
}) {
  const [selected, setSelected] = useState<ModuleKey>('approvals');
  const [logoutError, setLogoutError] = useState(false);
  const visibleModules = moduleKeys.filter(module => !restricted(module) || manages(employee.role, module));
  const module = visibleModules.includes(selected) ? selected : 'approvals';

  return <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[232px_1fr]">
    <aside className="border-b border-slate-200 bg-white lg:min-h-screen lg:border-r lg:border-b-0">
      <div className="flex h-16 items-center gap-3 px-5 font-bold text-slate-900">
        <Building2 className="size-8 rounded-lg bg-blue-800 p-1.5 text-white" aria-hidden /> M CORP EIP
      </div>
      <nav aria-label="업무 메뉴" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col">
        {visibleModules.map(key => {
          const Icon = icons[key];
          return <button key={key} type="button" aria-current={module === key ? 'page' : undefined}
            onClick={() => setSelected(key)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ${module === key ? 'bg-blue-50 text-blue-900' : 'text-slate-600 hover:bg-slate-100'}`}>
            <Icon className="size-4" aria-hidden /> {modules[key].label}
          </button>;
        })}
      </nav>
    </aside>
    <div className="min-w-0">
      <header className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 sm:px-8">
        <span className="truncate text-sm font-semibold">{employee.name} · {user.email}</span>
        <button className="secondary flex shrink-0 items-center gap-2" onClick={() => {
          void onLogout().catch(() => setLogoutError(true));
        }}><LogOut className="size-4" aria-hidden /> 로그아웃</button>
      </header>
      {logoutError && <p role="alert" className="px-5 pt-3 text-red-700">로그아웃에 실패했습니다.</p>}
      <Records key={`${module}:${employee.role}`} module={module} uid={user.uid} name={employee.name} db={db}
        canManage={manages(employee.role, module)} />
    </div>
  </div>;
}

function Records({ module, uid, name, db, canManage }: {
  module: ModuleKey; uid: string; name: string; db: Firestore; canManage: boolean;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [readError, setReadError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const definition = modules[module];
  const today = localDate();

  useEffect(() => {
    const records = collection(db, module);
    return onSnapshot(canManage ? records : query(records, where('owner', '==', uid)), snapshot => {
      setRows(snapshot.docs.map(item => ({ ...item.data(), id: item.id }) as Row)
        .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0)));
      setReadError(false);
      setLoading(false);
    }, () => {
      setRows([]);
      setReadError(true);
      setLoading(false);
    });
  }, [db, module, uid, canManage]);

  async function save(write: () => Promise<unknown>, success: string) {
    setBusy(true);
    setNotice('');
    try {
      await write();
      setNotice(success);
      return true;
    } catch {
      setNotice('저장하지 못했습니다. 연결, 접근 권한 또는 다른 사용자의 변경 사항을 확인해 주세요.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  function create(fields: RecordFields, id?: string) {
    const row = { ...fields, owner: uid, ownerName: name, updatedBy: uid,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    if (!id) return addDoc(collection(db, module), row);
    const ref = doc(db, module, id);
    return runTransaction(db, async transaction => {
      if ((await transaction.get(ref)).exists()) throw new Error('Record already exists');
      transaction.set(ref, row);
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const rawTitle = String(data.get('title')).trim();
    const title = module === 'inventory' ? rawTitle.toUpperCase() : rawTitle;
    const date = String(data.get('date'));
    const endDate = String(data.get('endDate') ?? '');
    if (!title || (module === 'inventory' && !/^[A-Z0-9_-]{1,64}$/.test(title)) || (endDate && endDate < date)) {
      setNotice('제목·품목 코드 또는 날짜 범위를 확인해 주세요.');
      return;
    }
    const saved = await save(() => create({
      title, date, endDate, details: String(data.get('details')).trim(),
      value: Number(data.get('value') ?? 0), status: definition.states[0],
    }, module === 'inventory' ? title : undefined), '등록했습니다.');
    if (saved) form.reset();
  }

  function update(row: Row, changes: Partial<Pick<Row, 'status' | 'value'>>) {
    const ref = doc(db, module, row.id);
    return runTransaction(db, async transaction => {
      const current = await transaction.get(ref);
      const version = current.data()?.updatedAt as Timestamp | undefined;
      if (!version || !row.updatedAt || !version.isEqual(row.updatedAt)) throw new Error('Record changed');
      transaction.update(ref, { ...changes, updatedAt: serverTimestamp(), updatedBy: uid });
    });
  }

  const attendance = rows.find(row => row.owner === uid && row.date === today);
  const unavailable = busy || loading || readError;
  return <main className="mx-auto max-w-6xl px-5 py-7 sm:px-8">
    <h1 className="text-2xl font-bold tracking-tight">{definition.label}</h1>
    {readError && <p role="alert" className="mt-4 text-sm text-red-700">기록을 불러오지 못했습니다. 연결과 접근 권한을 확인해 주세요.</p>}
    {notice && <p role="status" className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-950">{notice}</p>}
    <section className="panel mt-6">
      <h2 className="mb-4 font-bold">{module === 'attendance' ? '오늘의 출퇴근' : '새 기록 등록'}</h2>
      {module === 'attendance' ? <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-slate-600">{today} · {attendance?.status ?? '출근 기록 없음'}</span>
        <button className="primary" disabled={unavailable || !!attendance} onClick={() => {
          void save(() => create({ title: '출근', details: '', date: today, endDate: '', value: 0, status: '근무 중' }, `${uid}_${today}`), '출근을 기록했습니다.');
        }}>출근</button>
        <button className="secondary" disabled={unavailable || attendance?.status !== '근무 중'} onClick={() => {
          if (attendance) void save(() => update(attendance, { status: '퇴근' }), '퇴근을 기록했습니다.');
        }}>퇴근</button>
      </div> : <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label>{definition.title}<input className="field" name="title" required maxLength={module === 'inventory' ? 64 : 120} /></label>
        {definition.value && <label>{definition.value}<input className="field" type="number" name="value" min={module === 'accounting' ? 1 : 0} max="1000000000000" required /></label>}
        <label>{module === 'leave' ? '휴가 시작일' : '기준일'}<input className="field" type="date" name="date" defaultValue={today} required /></label>
        {module === 'leave' && <label>휴가 종료일<input className="field" type="date" name="endDate" defaultValue={today} required /></label>}
        <label className="sm:col-span-2">{definition.details}<textarea className="field" name="details" rows={3} maxLength={4000} required /></label>
        <div><button className="primary" disabled={unavailable}>{busy ? '저장 중…' : '등록'}</button></div>
      </form>}
    </section>
    <section className="panel mt-5">
      <h2 className="font-bold">기록 {rows.length}건</h2>
      {loading && <p className="mt-3 text-sm text-slate-600">불러오는 중…</p>}
      {!loading && !readError && rows.length === 0 && <p className="mt-3 text-sm text-slate-600">등록된 기록이 없습니다.</p>}
      <ul className="divide-y divide-slate-200">
        {rows.map(row => {
          const statuses: readonly string[] = definition.states;
          const allowed = module === 'sales' ? (row.status === '종료' ? [] : [...new Set([statuses[statuses.indexOf(row.status) + 1], '종료'])])
            : (canManage && row.owner !== uid && row.status === statuses[0] && module !== 'attendance' ? statuses.slice(1) : []);
          return <li key={row.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
            <div className="min-w-0 break-words">
              <p className="font-semibold">{row.title} <span className="ml-2 rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">{row.status}</span></p>
              <p className="mt-1 text-sm text-slate-600">{row.ownerName} · {row.date}{row.endDate && ` ~ ${row.endDate}`}{definition.value && ` · ${numberFormat.format(row.value)}${module === 'inventory' ? '개' : '원'}`}</p>
              {row.details && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{row.details}</p>}
              {row.createdAt && <p className="mt-1 text-xs text-slate-500">등록 {timeFormat.format(row.createdAt.toDate())}{row.updatedAt && !row.createdAt.isEqual(row.updatedAt) && ` · 변경 ${timeFormat.format(row.updatedAt.toDate())}`}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {allowed.map(status => <button key={status} className="secondary" disabled={unavailable} onClick={() => {
                void save(() => update(row, { status }), `${status} 상태로 변경했습니다.`);
              }}>{status}</button>)}
              {module === 'inventory' && (editing === row.id
                ? <form className="flex flex-wrap items-center gap-2" onSubmit={async event => {
                    event.preventDefault();
                    const value = Number(new FormData(event.currentTarget).get('quantity'));
                    if (await save(() => update(row, { value }), '재고 수량을 반영했습니다.')) setEditing(null);
                  }}>
                    <input aria-label="변경 수량" className="field max-w-28" type="number" name="quantity" defaultValue={row.value} min="0" max="1000000000000" required />
                    <button className="primary" disabled={unavailable}>저장</button>
                    <button className="secondary" type="button" onClick={() => setEditing(null)}>취소</button>
                  </form>
                : <button className="secondary" disabled={unavailable} onClick={() => setEditing(row.id)}>수량 변경</button>)}
            </div>
          </li>;
        })}
      </ul>
    </section>
  </main>;
}
