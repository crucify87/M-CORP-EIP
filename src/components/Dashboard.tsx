import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
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

  return <main className="portal-content">
    <div className="mb-5 flex items-baseline justify-between gap-3">
      <h1 className="text-xl font-bold tracking-tight">업무 대시보드</h1>
      <time dateTime={today} className="text-sm tabular-nums text-slate-600">{today}</time>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      {categories.map(module => <CategoryCard key={module} db={db} uid={uid} module={module}
        canManage={manages(role, module)} today={today} open={() => navigate(module)} />)}
    </div>
  </main>;
}

function CategoryCard({ db, uid, module, canManage, today, open }: {
  db: Firestore; uid: string; module: ModuleKey; canManage: boolean; today: string; open: () => void;
}) {
  const [records, setRecords] = useState<RecordFields[] | 'error'>();
  const Icon = moduleIcons[module];

  useEffect(() => onSnapshot(moduleRecords(db, module, uid, canManage),
    snapshot => setRecords(snapshot.docs.map(document => document.data() as RecordFields)),
    () => setRecords('error'),
  ), [db, module, uid, canManage]);

  return <section className="panel min-w-0">
    <h2>
      <button type="button" onClick={open} className="flex w-full items-center gap-2 rounded-md text-left font-bold text-[#102a7f] hover:underline">
        <span className="rounded-lg bg-blue-50 p-2"><Icon size={18} aria-hidden /></span>
        {modules[module].label}
        <ChevronRight size={17} className="ml-auto" aria-hidden />
      </button>
    </h2>
    {Array.isArray(records)
      ? <dl className="mt-3 divide-y divide-slate-100">
          {getModuleMetrics(module, records, today).map(([label, value]) =>
            <div key={label} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-2">
              <dt className="text-sm text-slate-600">{label}</dt>
              <dd className="break-all font-bold tabular-nums text-[#102a7f]">{value}</dd>
            </div>)}
        </dl>
      : <p className="mt-4 text-sm text-slate-600" role="status">
          {records === 'error' ? '현황을 불러오지 못했습니다.' : '현황을 불러오는 중…'}
        </p>}
  </section>;
}
