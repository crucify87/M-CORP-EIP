import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { onSnapshot, type Firestore } from 'firebase/firestore';
import { getModuleMetrics, localDate, manages, moduleIcons, moduleRecords, modules,
  type ModuleKey, type RecordFields, type Role } from '../records';

export function Dashboard({ db, uid, role, categories, navigate }: {
  db: Firestore; uid: string; role: Role; categories: ModuleKey[]; navigate: (module: ModuleKey) => void;
}) {
  const [today, setToday] = useState(localDate);

  useEffect(() => {
    const timer = window.setInterval(() => setToday(localDate()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const priority: ModuleKey[] = categories.filter(module => module === 'approvals' || module === 'attendance' || module === 'leave');
  const operations = categories.filter(module => !priority.includes(module));
  const dateLabel = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long', timeZone: 'Asia/Seoul' })
    .format(new Date(today + 'T00:00:00+09:00'));

  return <main className="portal-content">
    <div className="mb-7">
      <time dateTime={today} className="text-sm font-medium text-slate-600">{dateLabel}</time>
      <h1 className="mt-1.5 text-3xl font-bold tracking-tight sm:text-4xl">오늘의 업무</h1>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1.22fr_1fr_1fr]">
      {priority.map(module => <CategoryCard key={module} db={db} uid={uid} module={module}
        canManage={manages(role, module)} today={today} open={() => navigate(module)} />)}
    </div>
    {operations.length > 0 && <section className="mt-9">
      <h2 className="mb-4 text-lg font-bold tracking-tight">업무 현황</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {operations.map(module => <CategoryCard key={module} db={db} uid={uid} module={module}
          canManage={manages(role, module)} today={today} open={() => navigate(module)} />)}
      </div>
    </section>}
  </main>;
}

function CategoryCard({ db, uid, module, canManage, today, open }: {
  db: Firestore; uid: string; module: ModuleKey; canManage: boolean; today: string; open: () => void;
}) {
  const [records, setRecords] = useState<RecordFields[] | 'error'>();
  const Icon = moduleIcons[module];
  const approvals = module === 'approvals';
  const metrics = Array.isArray(records) ? getModuleMetrics(module, records, today) : null;
  if (metrics && Array.isArray(records) && module === 'leave') {
    const onLeaveToday = records.filter(row => row.status === '승인' && row.date <= today && (row.endDate || row.date) >= today).length;
    metrics[0] = ['오늘 승인된 휴가', onLeaveToday + '건'];
  }

  useEffect(() => onSnapshot(moduleRecords(db, module, uid, canManage),
    snapshot => setRecords(snapshot.docs.map(document => document.data() as RecordFields)),
    () => setRecords('error'),
  ), [db, module, uid, canManage]);

  return <section className={`panel min-w-0 ${approvals ? 'dashboard-approvals' : ''}`}>
    <h2>
      <button type="button" onClick={open} className="dashboard-link">
        <span className="dashboard-icon"><Icon size={18} aria-hidden /></span>
        {approvals ? '결재 대기함' : module === 'attendance' ? '오늘의 근태' : module === 'leave' ? '휴가 현황' : modules[module].label}
        <ArrowUpRight size={17} className="ml-auto shrink-0 opacity-75" aria-hidden />
      </button>
    </h2>
    {metrics
      ? <dl className="mt-4">
          {metrics.map(([label, value], index) =>
            <div key={label} className={index === 0 ? 'dashboard-key-metric' : 'dashboard-detail'}>
              <dt>{label}</dt>
              <dd>{value}{approvals && index === 0 && <span className="ml-1 text-base font-medium">건</span>}</dd>
            </div>)}
        </dl>
      : <p className="mt-4 text-sm opacity-80" role="status">
          {records === 'error' ? '현황을 불러오지 못했습니다.' : '현황을 불러오는 중…'}
        </p>}
  </section>;
}
