import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Building2, CalendarDays, House, LogOut, Plus, Search } from 'lucide-react';
import { addDoc, collection, doc, onSnapshot, runTransaction, serverTimestamp,
  type Firestore, type Timestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { approvalActions, getModuleMetrics, isApprovalModule, isFinalReview, localDate, manages, moduleIcons, moduleKeys, moduleRecords, modules,
  type Employee, type ModuleKey, type RecordFields, type Role } from '../records';
import { Dashboard } from './Dashboard';
import { LeaveCalendar } from './LeaveCalendar';

interface Row extends RecordFields {
  id: string;
  owner: string;
  ownerName: string;
  updatedBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

const numberFormat = new Intl.NumberFormat('ko-KR');
const timeFormat = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', dateStyle: 'short', timeStyle: 'short',
});
const clockFormat = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
const restricted = (module: ModuleKey) => module === 'sales' || module === 'inventory';
const navLabels = { approvals: '결재', attendance: '인사', leave: '휴가', accounting: '회계', sales: '영업', inventory: '더보기' };
const titles = { approvals: '결재 진행함', attendance: '인사·근태', leave: '근태·휴가 관리',
  accounting: '회계·비용 관리', sales: '영업 실적 및 수주 파이프라인', inventory: '재고·물류/창고관제' };
const formLabels = { approvals: '결재 요청', attendance: '오늘의 출퇴근', leave: '휴가 신청',
  accounting: '경비 등록', sales: '영업 건 등록', inventory: '품목 등록' };

export function Workspace({ user, employee, db, onLogout }: {
  user: User; employee: Employee; db: Firestore; onLogout: () => Promise<void>;
}) {
  const [selected, setSelected] = useState<ModuleKey | 'home'>('home');
  const [logoutError, setLogoutError] = useState(false);
  const visibleModules = moduleKeys.filter(module => !restricted(module) || manages(employee.role, module));
  const module = selected !== 'home' && visibleModules.includes(selected) ? selected : 'home';

  const tab = module === 'leave' ? 'attendance' : module;
  function navigate(key: ModuleKey | 'home') {
    setSelected(key);
    window.scrollTo(0, 0);
  }
  return <div className="portal">
      <header className="portal-header">
        <div className="flex min-w-0 items-center gap-2">
          {module === 'leave' && <button type="button" aria-label="인사·근태로 돌아가기" className="icon-button" onClick={() => navigate('attendance')}><ArrowLeft size={18} /></button>}
          <Building2 size={21} aria-hidden />
          <span className="font-bold tracking-tight">EIP Portal</span>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate rounded-full bg-[#e7ebfa] px-3 py-1 text-xs font-semibold text-[#102a7f]">{employee.name}</span>
          <button type="button" aria-label="로그아웃" className="icon-button" onClick={() => {
            void onLogout().catch(() => setLogoutError(true));
          }}><LogOut size={18} /></button>
        </div>
      </header>
      <nav aria-label="업무 메뉴" className="portal-nav">
        <button type="button" aria-current={tab === 'home' ? 'page' : undefined} onClick={() => navigate('home')}>
          <House className="size-5" aria-hidden /> 홈
        </button>
        {visibleModules.filter(key => key !== 'leave').map(key => {
          const Icon = moduleIcons[key];
          return <button key={key} type="button" aria-current={tab === key ? 'page' : undefined}
            onClick={() => navigate(key)}>
            <Icon className="size-5" aria-hidden /> {navLabels[key]}
          </button>;
        })}
      </nav>
      {logoutError && <p role="alert" className="px-5 pt-3 text-red-700">로그아웃에 실패했습니다.</p>}
      {module === 'home'
        ? <Dashboard key={employee.role} db={db} uid={user.uid} role={employee.role} categories={visibleModules} navigate={navigate} />
        : <Records key={`${module}:${employee.role}`} module={module} uid={user.uid} name={employee.name} db={db}
            role={employee.role} navigate={navigate} />}
  </div>;
}

function Records({ module, uid, name, db, role, navigate }: {
  module: ModuleKey; uid: string; name: string; db: Firestore; role: Role;
  navigate: (module: ModuleKey) => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [readError, setReadError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [leaveDates, setLeaveDates] = useState({ start: localDate(), end: localDate(), pickingEnd: false });
  const definition = modules[module];
  const approvalModule = isApprovalModule(module);
  const filters = approvalModule ? ['', ...definition.states.slice(0, 1), 'final-review', ...definition.states.slice(1)] : ['', ...definition.states];
  const canManage = manages(role, module);
  const today = localDate();

  useEffect(() => {
    if (module !== 'attendance') return;
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [module]);

  useEffect(() => {
    return onSnapshot(moduleRecords(db, module, uid, canManage), snapshot => {
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
    if (saved) {
      form.reset();
      setLeaveDates({ start: today, end: today, pickingEnd: false });
      setShowForm(false);
    }
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
  const minutes = attendance?.createdAt ? Math.max(0, Math.floor(
    ((attendance.status === '퇴근' ? attendance.updatedAt?.toMillis() ?? now : now) - attendance.createdAt.toMillis()) / 60_000,
  )) : 0;
  const unavailable = busy || loading || readError;
  const matching = rows.filter(row => (!filter || (filter === 'final-review' ? isFinalReview(row.status) : row.status === filter)) &&
    `${row.title} ${row.details} ${row.ownerName}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const pending = rows.filter(row => row.status === definition.states[0]);
  const metrics = getModuleMetrics(module, rows, today);
  return <main className="portal-content">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-bold tracking-tight">{module === 'approvals' ? '전자결재' : titles[module]}</h1>
      {module === 'attendance' && <button type="button" className="secondary inline-flex items-center gap-2" onClick={() => navigate('leave')}><CalendarDays size={16} /> 휴가 관리</button>}
      {module !== 'leave' && module !== 'attendance' && <button type="button" className="secondary inline-flex items-center gap-1.5"
        aria-expanded={showForm} onClick={() => setShowForm(!showForm)}><Plus size={16} /> {formLabels[module]}</button>}
    </div>
    {readError && <p role="alert" className="mt-4 text-sm text-red-700">기록을 불러오지 못했습니다. 연결과 접근 권한을 확인해 주세요.</p>}
    {notice && <p role="status" className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-950">{notice}</p>}
    {(module === 'sales' || module === 'inventory') && <label className="search-field mb-4">
      <Search size={17} aria-hidden /><input type="search" aria-label="기록 검색" value={search}
        onChange={event => setSearch(event.target.value)}
        placeholder={module === 'sales' ? '고객사명, 프로젝트명 검색' : '품목명 또는 SKU 코드 검색'} />
    </label>}
    {module === 'approvals' && !loading && !readError && pending.length > 0 && <section className="panel mb-4 flex items-center justify-between gap-3 border-l-4 border-l-[#173895]">
      <div><p className="text-xs font-semibold text-[#173895]">전자결재</p><h2 className="mt-1 font-bold">승인 대기 {pending.length}건</h2></div>
      <button type="button" className="primary" onClick={() => {
        setFilter(definition.states[0]);
        document.getElementById('record-list')?.scrollIntoView({ block: 'start' });
      }}>대기 문서 보기</button>
    </section>}
    {module !== 'attendance' && <div className="metric-grid mb-4">
      {metrics.map(([label, value]) => <div key={label} className="panel">
        <p className="text-xs text-slate-600">{label}</p>
        <p className="mt-2 break-words text-xl font-bold tabular-nums text-[#102a7f]">{unavailable && !busy ? '—' : value}</p>
      </div>)}
    </div>}
    {module === 'leave' && <LeaveCalendar today={today} start={leaveDates.start} end={leaveDates.end} onSelect={day => {
      setLeaveDates(previous => previous.pickingEnd
        ? { start: day < previous.start ? day : previous.start, end: day < previous.start ? previous.start : day, pickingEnd: false }
        : { start: day, end: day, pickingEnd: true });
    }} />}
    {(module === 'attendance' || module === 'leave' || showForm) && <section className="panel mb-4">
      <h2 className="mb-4 font-bold">{formLabels[module]}</h2>
      {module === 'attendance' ? <div className="grid gap-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-900">{attendance?.status ?? '출근 기록 없음'}</span>
            <p className="mt-2 text-sm text-slate-600">{today}</p>
          </div>
          <div className="text-right"><p className="text-2xl font-bold tabular-nums">{clockFormat.format(now)}</p>
            {attendance?.createdAt && <p className="text-sm text-[#173895]">출근 기록 {clockFormat.format(attendance.createdAt.toDate())}</p>}
          </div>
        </div>
        {attendance?.createdAt && <p className="border-t border-slate-200 pt-3 text-sm">오늘 경과 시간 <strong className="float-right text-[#173895]">{Math.floor(minutes / 60)}시간 {minutes % 60}분</strong></p>}
        <div className="grid grid-cols-2 gap-2">
        <button className="primary" disabled={unavailable || !!attendance} onClick={() => {
          void save(() => create({ title: '출근', details: '', date: today, endDate: '', value: 0, status: '근무 중' }, `${uid}_${today}`), '출근을 기록했습니다.');
        }}>출근</button>
        <button className="secondary" disabled={unavailable || attendance?.status !== '근무 중'} onClick={() => {
          if (attendance) void save(() => update(attendance, { status: '퇴근' }), '퇴근을 기록했습니다.');
        }}>퇴근하기</button>
        </div>
      </div> : <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label>{definition.title}<input className="field" name="title" required maxLength={module === 'inventory' ? 64 : 120} /></label>
        {definition.value && <label>{definition.value}<input className="field" type="number" name="value" min={module === 'accounting' ? 1 : 0} max="1000000000000" required /></label>}
        {module === 'leave' ? <>
          <label>휴가 시작일<input className="field" type="date" name="date" value={leaveDates.start}
            onChange={event => { const start = event.target.value; setLeaveDates(current => ({ ...current, start })); }} required /></label>
          <label>휴가 종료일<input className="field" type="date" name="endDate" min={leaveDates.start} value={leaveDates.end}
            onChange={event => { const end = event.target.value; setLeaveDates(current => ({ ...current, end })); }} required /></label>
        </> : <label>기준일<input className="field" type="date" name="date" defaultValue={today} required /></label>}
        <label className="sm:col-span-2">{definition.details}<textarea className="field" name="details" rows={3} maxLength={4000} required /></label>
        <button className="primary sm:col-span-2" disabled={unavailable}>{busy ? '저장 중…' : module === 'leave' ? '휴가 전자결재 신청서 제출' : '등록'}</button>
      </form>}
    </section>}
    {module === 'attendance' && <div className="metric-grid mb-4">
      {metrics.map(([label, value]) => <div key={label} className="panel"><p className="text-xs text-slate-600">{label}</p><p className="mt-2 text-xl font-bold text-[#102a7f]">{loading || readError ? '—' : value}</p></div>)}
    </div>}
    <section id="record-list" className="mt-5 scroll-mt-20">
      <h2 className="mb-3 font-bold">{{
        approvals: '결재 진행함', attendance: '근태 현황', leave: '휴가 신청 및 결재 이력',
        accounting: '최근 경비 내역', sales: '최근 주요 수주 및 견적 현황', inventory: '품목별 재고',
      }[module]} <span className="ml-1 text-xs font-medium text-slate-600">총 {matching.length}건</span></h2>
      {definition.states.length > 1 && <div className="status-tabs mb-3" aria-label="상태 필터">
        {filters.map(status => <button type="button" key={status} aria-pressed={filter === status}
          onClick={() => setFilter(status)}>{status === 'final-review' ? '최종 검토 대기' : status === '대기' ? '승인 대기' : status || '전체'}{module === 'sales' && status && ` ${rows.filter(row => row.status === status).length}`}</button>)}
      </div>}
      {loading && <p className="mt-3 text-sm text-slate-600">불러오는 중…</p>}
      {!loading && !readError && matching.length === 0 && <p className="panel text-sm text-slate-600">{filter || search ? '조건에 맞는 기록이 없습니다.' : '등록된 기록이 없습니다.'}</p>}
      <ul className="grid gap-3">
        {matching.map(row => {
          const statuses: readonly string[] = definition.states;
          const nextSalesStatus = statuses[statuses.indexOf(row.status) + 1];
          const actions = module === 'sales'
            ? (nextSalesStatus ? Array.from(new Set([nextSalesStatus, '종료']), status => ({ label: status, status })) : [])
            : approvalActions(module, role, row.status, row.owner === uid, row.updatedBy === uid);
          const awaitingFinal = isFinalReview(row.status);
          const awaitingReview = approvalModule && (row.status === statuses[0] || awaitingFinal);
          const approvalHint = row.owner === uid ? '본인이 올린 신청은 다른 책임자가 처리합니다.'
            : awaitingFinal && row.updatedBy === uid ? '다른 최종관리자의 검토를 기다리고 있습니다.'
            : awaitingFinal ? '최종관리자의 검토를 기다리고 있습니다.' : '팀장 또는 최종관리자의 검토를 기다리고 있습니다.';
          return <li key={row.id} className="panel grid gap-3">
            <div className="min-w-0 break-words">
              <p className="mb-2"><span className="rounded bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-900">{awaitingFinal ? `최종 검토 대기 · ${row.status}` : row.status === '대기' ? '승인 대기' : row.status}</span></p>
              <p className="font-bold">{row.title}</p>
              <p className="mt-1 text-sm text-slate-600">{row.ownerName} · {row.date}{row.endDate && ` ~ ${row.endDate}`}{definition.value && ` · ${numberFormat.format(row.value)}${module === 'inventory' ? '개' : '원'}`}</p>
              {row.details && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{row.details}</p>}
              {row.createdAt && <p className="mt-1 text-xs text-slate-500">등록 {timeFormat.format(row.createdAt.toDate())}{row.updatedAt && !row.createdAt.isEqual(row.updatedAt) && ` · 변경 ${timeFormat.format(row.updatedAt.toDate())}`}</p>}
            </div>
            {awaitingReview && actions.length === 0 && <p className="border-t border-slate-100 pt-3 text-sm text-slate-600">{approvalHint}</p>}
            {(actions.length > 0 || module === 'inventory') && <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              {actions.map(({ label, status }) => <button type="button" key={status} className={`flex-1 ${label.endsWith('반려') ? 'secondary' : 'primary'}`} disabled={unavailable} onClick={() => {
                void save(() => update(row, { status }), isFinalReview(status) ? '1차 결재를 저장하고 최종 검토로 넘겼습니다.' : `${status} 상태로 변경했습니다.`);
              }}>{label}</button>)}
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
            </div>}
          </li>;
        })}
      </ul>
    </section>
  </main>;
}
