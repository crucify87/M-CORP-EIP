import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Building2, CalendarDays, Ellipsis, House, LogOut, Plus, Search } from 'lucide-react';
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
  return <div className="portal workspace-shell">
      <header className="portal-header">
        <div className="flex min-w-0 items-center gap-2">
          {module === 'leave' && <button type="button" aria-label="인사·근태로 돌아가기" className="icon-button" onClick={() => navigate('attendance')}><ArrowLeft size={18} /></button>}
          <span className="workspace-brand"><Building2 size={19} aria-hidden /></span>
          <span className="font-bold tracking-tight">M CORP EIP</span>
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
        {visibleModules.map(key => {
          const Icon = moduleIcons[key];
          return <button key={key} type="button" className={key === 'leave' ? 'desktop-nav-item' : undefined}
            aria-current={(module === 'leave' ? key === 'leave' : tab === key) ? 'page' : undefined}
            data-mobile-current={tab === key || undefined}
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
  const [filter, setFilter] = useState(module === 'approvals' ? modules.approvals.states[0] : '');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [leaveDates, setLeaveDates] = useState({ start: localDate(), end: localDate(), pickingEnd: false });
  const definition = modules[module];
  const approvalModule = isApprovalModule(module);
  const operationsList = module === 'accounting' || module === 'sales' || module === 'inventory';
  const filters = ['', ...definition.states];
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

  function deleteRequest(row: Row) {
    if (!window.confirm(`“${row.title}” 신청 기록을 삭제하시겠습니까? 삭제한 기록은 복구할 수 없습니다.`)) return;

    const ref = doc(db, module, row.id);
    void save(() => runTransaction(db, async transaction => {
      const current = await transaction.get(ref);
      const version = current.data()?.updatedAt as Timestamp | undefined;
      if (!version || !row.updatedAt || !version.isEqual(row.updatedAt)) throw new Error('Record changed');
      transaction.delete(ref);
    }), '신청 기록을 삭제했습니다.');
  }

  const attendance = rows.find(row => row.owner === uid && row.date === today);
  const minutes = attendance?.createdAt ? Math.max(0, Math.floor(
    ((attendance.status === '퇴근' ? attendance.updatedAt?.toMillis() ?? now : now) - attendance.createdAt.toMillis()) / 60_000,
  )) : 0;
  const unavailable = busy || loading || readError;
  const matching = rows.filter(row => (!filter || row.status === filter
    || (approvalModule && filter === definition.states[0] && isFinalReview(row.status))) &&
    `${row.title} ${row.details} ${row.ownerName}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const metrics = getModuleMetrics(module, rows, today);
  return <main className={`portal-content ${module === 'leave' ? 'max-w-6xl' : ''}`}>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-3xl font-bold tracking-tight">{module === 'approvals' ? '전자결재' : titles[module]}</h1>
      {module === 'attendance' && <button type="button" className="secondary inline-flex items-center gap-2" onClick={() => navigate('leave')}><CalendarDays size={16} /> 휴가 관리</button>}
      {module !== 'leave' && module !== 'attendance' && <button type="button" className={`inline-flex items-center gap-1.5 ${showForm ? 'secondary' : 'primary'}`}
        aria-expanded={showForm} aria-controls={showForm ? 'request-form' : undefined}
        onClick={() => setShowForm(!showForm)}>{showForm ? '작성 닫기' : <><Plus size={16} aria-hidden /> {formLabels[module]}</>}</button>}
    </div>
    {readError && <p role="alert" className="mt-4 text-sm text-red-700">기록을 불러오지 못했습니다. 연결과 접근 권한을 확인해 주세요.</p>}
    {notice && <p role="status" className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-950">{notice}</p>}
    {(module === 'approvals' || operationsList) && <label className="search-field mb-4">
      <Search size={17} aria-hidden /><input type="search" aria-label="기록 검색" value={search}
        onChange={event => setSearch(event.target.value)}
        placeholder={module === 'inventory' ? '품목명 또는 SKU 코드 검색' : module === 'sales' ? '고객사명 또는 프로젝트명 검색' : '제목 또는 신청자 이름 검색'} />
    </label>}
    {module !== 'attendance' && module !== 'approvals' && <div className="metric-grid mb-4">
      {metrics.map(([label, value]) => <div key={label} className="panel">
        <p className="text-xs text-slate-600">{label}</p>
        <p className="mt-2 break-words text-xl font-bold tabular-nums text-[#102a7f]">{unavailable && !busy ? '—' : value}</p>
      </div>)}
    </div>}
    {module === 'leave' && <LeaveCalendar today={today} start={leaveDates.start} end={leaveDates.end} entries={rows} onSelect={day => {
      setLeaveDates(previous => previous.pickingEnd
        ? { start: day < previous.start ? day : previous.start, end: day < previous.start ? previous.start : day, pickingEnd: false }
        : { start: day, end: day, pickingEnd: true });
    }} />}
    {(module === 'attendance' || module === 'leave' || showForm) && <section id="request-form" className="panel mb-4">
      <h2 className="mb-4 font-bold">{formLabels[module]}</h2>
      {module === 'attendance' ? <div className="grid gap-4">
        <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 p-4">
          <div>
            <span className="status-chip" data-tone={attendance?.status === '근무 중' ? 'approved' : 'neutral'}>{attendance?.status ?? '출근 기록 없음'}</span>
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
        <label>{definition.title}<input className="field" name="title" list={module === 'leave' ? 'leave-types' : undefined}
          required maxLength={module === 'inventory' ? 64 : 120} /></label>
        {module === 'leave' && <datalist id="leave-types">
          <option value="월차" /><option value="연차" /><option value="조퇴" />
        </datalist>}
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
    <section className={module === 'approvals' || operationsList ? 'panel approval-list' : 'mt-5'}>
      <h2 className="mb-3 font-bold">{{
        approvals: '결재 진행함', attendance: '근태 현황', leave: '휴가 신청 및 결재 이력',
        accounting: '최근 경비 내역', sales: '최근 주요 수주 및 견적 현황', inventory: '품목별 재고',
      }[module]} <span className="ml-1 text-xs font-medium text-slate-600">총 {matching.length}건</span></h2>
      {definition.states.length > 1 && <div className="status-tabs mb-3" aria-label="상태 필터">
        {(module === 'approvals' ? [...definition.states, ''] : filters).map(status => <button type="button" key={status} aria-pressed={filter === status}
          onClick={() => setFilter(status)}>{status === '대기' ? '승인 대기' : status || '전체'}{module === 'sales' && status && ` ${rows.filter(row => row.status === status).length}`}</button>)}
      </div>}
      {loading && <p className="mt-3 text-sm text-slate-600">불러오는 중…</p>}
      {!loading && !readError && matching.length === 0 && <p className="panel text-sm text-slate-600">{filter || search ? '조건에 맞는 기록이 없습니다.' : '등록된 기록이 없습니다.'}</p>}
      {operationsList && matching.length > 0 && <div aria-hidden className="operation-columns hidden rounded-lg bg-slate-50 py-2 text-xs font-semibold text-slate-600 md:grid">
        <span>항목</span><span className="text-right">{definition.value}</span><span className="text-right">작업</span>
      </div>}
      <ul className={module === 'approvals' || operationsList ? 'divide-y divide-slate-200' : 'grid gap-3'}>
        {matching.map(row => {
          const statuses: readonly string[] = definition.states;
          const nextSalesStatus = statuses[statuses.indexOf(row.status) + 1];
          const actions = module === 'sales'
            ? (nextSalesStatus ? Array.from(new Set([nextSalesStatus, '종료']), status => ({ label: status, status })) : [])
            : approvalActions(module, role, row.status, row.owner === uid);
          const awaitingFinal = isFinalReview(row.status);
          const canDelete = approvalModule && role === 'admin' && (row.status === statuses[1] || row.status === '반려');
          const awaitingReview = approvalModule && (row.status === statuses[0] || awaitingFinal);
          const statusTone = awaitingReview ? 'pending' : row.status === '반려' ? 'rejected'
            : approvalModule && row.status === statuses[1] ? 'approved' : 'neutral';
          const approvalHint = row.owner === uid ? '본인이 올린 신청은 다른 책임자가 처리합니다.'
            : awaitingFinal ? '최종관리자의 검토를 기다리고 있습니다.' : '팀장 또는 최종관리자의 검토를 기다리고 있습니다.';
          return <li key={row.id} className={operationsList ? 'operation-row' : module === 'approvals' ? 'approval-row' : 'panel grid gap-3'}>
            <div className="min-w-0 break-words">
              <p className="mb-2"><span className="status-chip" data-tone={statusTone}>{awaitingFinal ? `승인 대기 · ${row.status.replace('팀장', '1차')}` : row.status === '대기' ? '승인 대기' : row.status}</span></p>
              <p className="font-bold">{row.title}</p>
              <p className="mt-1 text-sm text-slate-600">{row.ownerName} · {row.date}{row.endDate && ` ~ ${row.endDate}`}</p>
              {row.details && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{row.details}</p>}
              {row.createdAt && <p className="mt-1 text-xs text-slate-500">등록 {timeFormat.format(row.createdAt.toDate())}{row.updatedAt && !row.createdAt.isEqual(row.updatedAt) && ` · 변경 ${timeFormat.format(row.updatedAt.toDate())}`}</p>}
            </div>
            {operationsList && <p className="operation-value"><span className="sr-only">{definition.value} </span>{numberFormat.format(row.value)}{module === 'inventory' ? '개' : '원'}</p>}
            {awaitingReview && actions.length === 0 && <p className="text-sm text-slate-600">{approvalHint}</p>}
            {(actions.length > 0 || module === 'inventory' || canDelete) && <div className={module === 'approvals' || operationsList ? 'approval-actions' : 'flex flex-wrap gap-2 border-t border-slate-100 pt-3'}>
              {actions.map(({ label, status }) => <button type="button" key={status} className={`flex-1 ${label.endsWith('반려') ? 'secondary' : 'primary'}`} disabled={unavailable} onClick={() => {
                const firstReview = isFinalReview(status);
                const decision = firstReview ? `1차 ${label}` : `최종 ${label}`;
                if (approvalModule && !window.confirm(`“${row.title}” 신청을 ${decision}하시겠습니까?`)) return;
                void save(() => update(row, { status }), approvalModule ? `${decision} 처리했습니다.` : `${status} 상태로 변경했습니다.`);
              }}>{label}</button>)}
              {canDelete && <details className="record-menu">
                <summary className="icon-button" aria-label={`${row.title} 옵션`}><Ellipsis size={20} aria-hidden /></summary>
                <button type="button" className="secondary text-red-700 hover:bg-red-50"
                  disabled={unavailable} onClick={event => {
                    event.currentTarget.closest('details')?.removeAttribute('open');
                    deleteRequest(row);
                  }}>삭제</button>
              </details>}
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
