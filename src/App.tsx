import { lazy, Suspense, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { LoginView } from './components/LoginView';
import { auth } from './firebase';

const SignedInPortal = lazy(() => import('./components/SignedInPortal'));

export default function App() {
  const [user, setUser] = useState<User | null>();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, account => {
      setError('');
      setUser(account);
    }, () => setError('로그인 상태를 확인하지 못했습니다.'));
  }, []);

  if (auth && user === null) return <LoginView auth={auth} />;
  if (auth && user) {
    return <Suspense fallback={<PortalStatus message="업무 포털을 불러오는 중…" />}>
      <SignedInPortal key={user.uid} auth={auth} user={user} />
    </Suspense>;
  }

  return <PortalStatus message={auth ? error || '계정 확인 중…' : 'Firebase 웹 앱 설정이 필요합니다.'} />;
}

function PortalStatus({ message }: { message: string }) {
  return <main className="grid min-h-screen place-items-center p-5">
    <section className="panel w-full max-w-md">
      <h1 className="text-xl font-bold">M CORP EIP</h1>
      <p role="status" className="mt-3 text-sm text-slate-600">{message}</p>
    </section>
  </main>;
}
