import { useState, type FormEvent } from 'react';
import { browserLocalPersistence, browserSessionPersistence, sendPasswordResetEmail,
  setPersistence, signInWithEmailAndPassword, type Auth } from 'firebase/auth';
import { Building2 } from 'lucide-react';

export function LoginView({ auth }: { auth: Auth }) {
  const [email, setEmail] = useState('');
  const [remember, setRemember] = useState(false);
  const [reset, setReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get('password') ?? '');
    setBusy(true);
    setMessage('');
    try {
      if (reset) {
        await sendPasswordResetEmail(auth, email.trim());
        setMessage('등록된 주소라면 비밀번호 재설정 메일이 발송됩니다.');
      } else {
        await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch {
      setMessage(reset ? '재설정 요청을 처리하지 못했습니다.' : '이메일과 비밀번호를 확인하고 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="grid min-h-screen place-items-center bg-slate-100 p-5">
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <Building2 className="mb-5 size-10 rounded-xl bg-blue-800 p-2 text-white" aria-hidden />
      <h1 className="text-2xl font-bold text-slate-900">M CORP EIP</h1>
      <p className="mt-2 text-sm text-slate-600">{reset ? '비밀번호 재설정' : '사내 계정으로 로그인'}</p>
      <form onSubmit={submit} className="mt-6 grid gap-4">
        <label>사내 이메일<input className="field" autoComplete="username" type="email" required value={email} onChange={event => setEmail(event.target.value)} /></label>
        {!reset && <>
          <label>비밀번호<input className="field" name="password" autoComplete="current-password" type="password" required /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} /> 로그인 유지</label>
        </>}
        <button className="primary" disabled={busy}>{busy ? '처리 중…' : reset ? '재설정 메일 보내기' : '로그인'}</button>
        {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
      </form>
      <button type="button" className="mt-5 text-sm text-blue-800 underline" disabled={busy} onClick={() => { setReset(!reset); setMessage(''); }}>
        {reset ? '로그인으로 돌아가기' : '비밀번호를 잊으셨나요?'}
      </button>
    </section>
  </main>;
}
