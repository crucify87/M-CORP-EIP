import { useEffect, useState, type FormEvent } from 'react';
import { ChevronDown, Megaphone, Plus } from 'lucide-react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp,
  type Firestore, type Timestamp } from 'firebase/firestore';

interface Notice {
  id: string;
  title: string;
  body: string;
  createdAt: Timestamp | null;
}

const dateFormat = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeZone: 'Asia/Seoul' });

export function CompanyNotices({ db, uid, canManage }: { db: Firestore; uid: string; canManage: boolean }) {
  const [notices, setNotices] = useState<Notice[] | 'error'>();
  const [composing, setComposing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => onSnapshot(query(collection(db, 'notices'), orderBy('createdAt', 'desc')),
    snapshot => setNotices(snapshot.docs.map(item => ({ ...item.data(), id: item.id }) as Notice)),
    () => setNotices('error'),
  ), [db]);

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get('title')).trim();
    const body = String(data.get('body')).trim();
    if (!title || !body) {
      setMessage('제목과 내용을 입력해 주세요.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await addDoc(collection(db, 'notices'), { title, body, createdBy: uid, createdAt: serverTimestamp() });
      setComposing(false);
      setMessage('공지를 등록했습니다.');
    } catch {
      setMessage('공지를 등록하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(notice: Notice) {
    if (!window.confirm(`“${notice.title}” 공지를 삭제하시겠습니까?`)) return;
    setBusy(true);
    setMessage('');
    try {
      await deleteDoc(doc(db, 'notices', notice.id));
      setMessage('공지를 삭제했습니다.');
    } catch {
      setMessage('공지를 삭제하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  return <section className="panel mt-6" aria-labelledby="company-notices-heading">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="company-notices-heading" className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
        <span className="dashboard-icon"><Megaphone size={18} aria-hidden /></span>회사 공지사항
      </h2>
      {canManage && <button type="button" className="secondary inline-flex items-center gap-1.5"
        aria-expanded={composing} disabled={busy} onClick={() => { setComposing(!composing); setMessage(''); }}>
        {composing ? '작성 취소' : <><Plus size={16} aria-hidden /> 공지 등록</>}
      </button>}
    </div>
    {canManage && composing && <form className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4" onSubmit={publish}>
      <label>제목<input className="field" name="title" maxLength={120} required disabled={busy} /></label>
      <label>내용<textarea className="field" name="body" rows={4} maxLength={4000} required disabled={busy} /></label>
      <button type="submit" className="primary justify-self-start" disabled={busy}>{busy ? '등록 중…' : '등록'}</button>
    </form>}
    {message && <p role="status" className="mt-3 text-sm text-slate-700">{message}</p>}
    {Array.isArray(notices) ? <>
      {notices.length === 0 && <p className="mt-4 text-sm text-slate-600">등록된 공지가 없습니다.</p>}
      <div className="mt-3 divide-y divide-slate-200">
        {notices.map(notice => <details key={notice.id}>
          <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 rounded py-3 text-sm [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 flex-1 break-words font-semibold">{notice.title}</span>
            {notice.createdAt && <time dateTime={notice.createdAt.toDate().toISOString()} className="text-xs text-slate-600">
              {dateFormat.format(notice.createdAt.toDate())}
            </time>}
            <ChevronDown size={16} aria-hidden className="shrink-0 text-slate-600" />
          </summary>
          <p className="whitespace-pre-wrap break-words pb-3 text-sm leading-6">{notice.body}</p>
          {canManage && <button type="button" className="secondary mb-3 text-red-700" disabled={busy}
            onClick={() => void remove(notice)}>삭제</button>}
        </details>)}
      </div>
    </> : <p role="status" className="mt-4 text-sm text-slate-600">
      {notices === 'error' ? '공지를 불러오지 못했습니다.' : '공지를 불러오는 중…'}
    </p>}
  </section>;
}
