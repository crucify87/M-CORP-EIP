import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  browserLocalPersistence, browserSessionPersistence, createUserWithEmailAndPassword,
  GoogleAuthProvider, RecaptchaVerifier, sendPasswordResetEmail, setPersistence,
  signInWithEmailAndPassword, signInWithPhoneNumber, signInWithPopup,
  type Auth, type ConfirmationResult,
} from 'firebase/auth';
import { Building2, Eye, EyeOff, LockKeyhole, ShieldCheck, Smartphone } from 'lucide-react';

type Mode = 'login' | 'signup' | 'reset' | 'phone';

function errorMessage(error: unknown, fallback: string) {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
  switch (code) {
    case 'auth/billing-not-enabled':
    case 'auth/operation-not-allowed':
      return '이 인증 방법은 현재 사용할 수 없습니다. 다른 방법으로 로그인해 주세요.';
    case 'auth/invalid-verification-code':
      return '인증번호를 확인해 주세요.';
    case 'auth/code-expired':
    case 'auth/session-expired':
      return '인증번호가 만료되었습니다. 새 인증번호를 요청해 주세요.';
    case 'auth/email-already-in-use':
    case 'auth/account-exists-with-different-credential':
      return '이미 등록된 이메일입니다. 가입할 때 사용한 방법으로 로그인해 주세요.';
    case 'auth/popup-blocked':
      return '브라우저에서 팝업을 허용한 뒤 다시 시도해 주세요.';
    case 'auth/popup-closed-by-user':
      return 'Google 로그인 창이 닫혔습니다.';
    case 'auth/too-many-requests':
      return '요청이 많습니다. 잠시 후 다시 시도해 주세요.';
    case 'auth/weak-password':
      return '비밀번호가 Firebase의 비밀번호 정책을 충족하지 않습니다.';
    default:
      return fallback;
  }
}

export function LoginView({ auth }: { auth: Auth }) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult>();
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const captcha = useRef<HTMLDivElement>(null);
  const verifier = useRef<RecaptchaVerifier | undefined>(undefined);
  const phoneLogin = mode === 'phone' || (mode === 'login' && /^[+\d()\s-]+$/.test(email.trim()));

  function clearCaptcha() {
    verifier.current?.clear();
    verifier.current = undefined;
    captcha.current?.replaceChildren();
  }

  useEffect(() => () => {
    verifier.current?.clear();
    verifier.current = undefined;
  }, []);

  function switchMode(next: Mode) {
    clearCaptcha();
    setConfirmation(undefined);
    setShowPassword(false);
    setMessage('');
    setMode(next);
  }

  async function authenticate(action: () => Promise<unknown>, fallback: string, persist = true) {
    setBusy(true);
    setMessage('');
    try {
      if (persist) await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      await action();
    } catch (error) {
      setMessage(errorMessage(error, fallback));
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const address = email.trim();
    const password = String(data.get('password') ?? '');
    if (mode === 'reset') {
      void authenticate(async () => {
        await sendPasswordResetEmail(auth, address);
        setMessage('등록된 주소라면 비밀번호 재설정 메일이 발송됩니다.');
      }, '재설정 요청을 처리하지 못했습니다.', false);
      return;
    }
    if (mode === 'signup') {
      if (password !== data.get('confirmPassword')) {
        setMessage('비밀번호가 일치하지 않습니다.');
        return;
      }
      void authenticate(() => createUserWithEmailAndPassword(auth, address, password), '계정을 만들지 못했습니다. 이메일과 비밀번호를 확인해 주세요.');
      return;
    }
    if (phoneLogin) {
      if (confirmation) {
        void authenticate(() => confirmation.confirm(String(data.get('code')).trim()), '인증번호를 확인해 주세요.', false);
        return;
      }
      const digits = (mode === 'phone' ? phone : address).trim().replace(/[\s()-]/g, '');
      const number = /^010\d{8}$/.test(digits) ? '+82' + digits.slice(1) : digits;
      if (!/^\+[1-9]\d{7,14}$/.test(number)) {
        setMessage('휴대전화 번호를 01012345678 또는 +821012345678 형식으로 입력해 주세요.');
        return;
      }
      void authenticate(async () => {
        if (!captcha.current) throw new Error('Missing CAPTCHA container');
        const container = document.createElement('div');
        captcha.current.replaceChildren(container);
        verifier.current = new RecaptchaVerifier(auth, container, { size: 'invisible' });
        try {
          setConfirmation(await signInWithPhoneNumber(auth, number, verifier.current));
          setMessage('인증번호를 보냈습니다.');
        } finally {
          clearCaptcha();
        }
      }, '인증번호를 보내지 못했습니다. 번호와 국가 코드를 확인해 주세요.');
      return;
    }
    void authenticate(() => signInWithEmailAndPassword(auth, address, password),
      '이메일과 비밀번호를 확인하고 다시 시도해 주세요.');
  }

  const title = { login: '사내 계정으로 로그인', signup: '이메일 회원가입',
    reset: '비밀번호 재설정', phone: '휴대전화로 로그인' }[mode];
  const submitLabel = phoneLogin ? (confirmation ? '인증번호 확인' : '인증번호 보내기')
    : { login: '로그인', signup: '계정 만들기', reset: '재설정 메일 보내기', phone: '인증번호 보내기' }[mode];

  return <div className="min-h-screen bg-[#f5f7f9]">
    <header className="portal-header"><span className="flex items-center gap-2 font-bold"><Building2 size={22} aria-hidden /> EIP Portal</span></header>
    <main className="mx-auto max-w-xl px-5 py-8 sm:py-12">
      <ShieldCheck className="mb-5 size-14 rounded-xl border border-[#c5cdeb] bg-[#e7ebfa] p-3 text-[#173895]" aria-hidden />
      <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{mode === 'login' ? 'M CORP EIP' : title}</h1>
      {mode === 'login' && <p className="mt-2 text-sm text-slate-600">사내 계정으로 로그인해 주세요.</p>}
      {mode === 'signup' && <p className="mt-2 text-sm text-slate-600">업무 포털을 이용하려면 가입 후 사내 관리자의 승인이 필요합니다.</p>}
      <form key={mode} onSubmit={submit} className="panel mt-6 grid gap-4">
        {mode === 'phone' ? <label>휴대전화 번호<input className="field" autoComplete="tel" type="tel" required
          readOnly={busy || !!confirmation} value={phone} onChange={event => setPhone(event.target.value)} placeholder="01012345678" /></label>
          : <label>{mode === 'login' ? '이메일 또는 휴대전화' : '이메일'}<input className="field" autoComplete="username"
            type={mode === 'login' ? 'text' : 'email'} required readOnly={busy || !!confirmation}
            value={email} onChange={event => setEmail(event.target.value)} /></label>}
        {phoneLogin && <>
          {confirmation ? <label>인증번호<input className="field" name="code" autoComplete="one-time-code"
            inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required /></label>
            : <p className="text-xs text-slate-600">인증 문자 발송을 위해 전화번호가 Google에 전송됩니다.</p>}
          <div ref={captcha} />
          {confirmation && <button type="button" className="justify-self-start text-sm text-blue-800 underline" disabled={busy}
            onClick={() => { setConfirmation(undefined); setMessage(''); }}>번호 변경 또는 다시 받기</button>}
        </>}
        {((mode === 'login' && !phoneLogin) || mode === 'signup') && <div>
          <label htmlFor="portal-password">비밀번호</label>
          <div className="relative">
            <input id="portal-password" className="field pr-12" name="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} type={showPassword ? 'text' : 'password'}
              minLength={mode === 'signup' ? 6 : undefined} required />
            <button type="button" aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'} className="icon-button absolute inset-y-0 right-1"
              onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </div>
        </div>}
        {mode === 'signup' && <label>비밀번호 확인<input className="field" name="confirmPassword"
          autoComplete="new-password" type="password" required /></label>}
        {mode !== 'reset' && !confirmation && <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" disabled={busy} checked={remember} onChange={event => setRemember(event.target.checked)} /> 로그인 유지
        </label>}
        <button className="primary flex min-h-12 items-center justify-center gap-2" disabled={busy}>{mode === 'login' && <LockKeyhole size={17} />} {busy ? '처리 중…' : submitLabel}</button>
        {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
      </form>
      {mode === 'login' ? <>
        <div className="mt-6 flex items-center gap-3 text-sm text-slate-500 before:h-px before:flex-1 before:bg-slate-200 after:h-px after:flex-1 after:bg-slate-200">간편 인증</div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className="secondary min-h-12" disabled={busy} onClick={() => {
            void authenticate(() => signInWithPopup(auth, new GoogleAuthProvider()), 'Google 로그인에 실패했습니다.');
          }}>Google로 로그인</button>
          <button type="button" className="secondary flex min-h-12 items-center justify-center gap-1" disabled={busy} onClick={() => switchMode('phone')}><Smartphone size={16} /> 휴대전화 로그인</button>
        </div>
        <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm text-blue-800">
          <button type="button" className="underline" disabled={busy} onClick={() => switchMode('reset')}>비밀번호를 잊으셨나요?</button>
          <button type="button" className="underline" disabled={busy} onClick={() => switchMode('signup')}>회원가입</button>
        </div>
      </> : <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm text-blue-800">
        <button type="button" className="underline" disabled={busy} onClick={() => switchMode('login')}>로그인으로 돌아가기</button>
      </div>}
    </main>
  </div>;
}
