import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { Building2 } from 'lucide-react';
import { LoginView } from './components/LoginView';
import { Workspace } from './components/Workspace';
import { firebase } from './firebase';
import type { Employee } from './records';

export default function App() {
  const connection = firebase;
  const [user, setUser] = useState<User | null>();
  const [profile, setProfile] = useState<{ uid: string; employee: Employee | null }>();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!connection) return;
    return onAuthStateChanged(connection.auth, account => {
      setProfile(undefined);
      setError('');
      setUser(account);
    }, () => setError('로그인 상태를 확인하지 못했습니다.'));
  }, [connection]);

  useEffect(() => {
    if (!firebase || !user) return;
    return onSnapshot(doc(firebase.db, 'employees', user.uid), snap => {
      const employee = snap.exists() ? snap.data() as Employee : null;
      setProfile({ uid: user.uid, employee: employee?.active === true ? employee : null });
      setError('');
    }, () => setError('직원 접근 권한을 확인하지 못했습니다.'));
  }, [user]);

  if (connection && user === null) return <LoginView auth={connection.auth} />;
  if (connection && user && profile?.uid === user.uid && profile.employee && !error) {
    return <Workspace key={user.uid} user={user} employee={profile.employee} db={connection.db}
      onLogout={() => signOut(connection.auth)} />;
  }

  const needsAccess = user && profile?.uid === user.uid && !profile.employee && !error;
  const message = !firebase ? 'Firebase 웹 앱 설정이 필요합니다.'
    : error || (needsAccess ? '업무 포털을 이용하려면 아래 계정 ID를 사내 관리자에게 전달해 주세요.' : '계정 확인 중…');
  return <main className="grid min-h-screen place-items-center p-5">
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8">
      <Building2 className="mb-4 size-8 text-blue-800" aria-hidden />
      <h1 className="text-xl font-bold">M CORP EIP</h1>
      <p role="status" className="mt-3 text-sm text-slate-600">{message}</p>
      {needsAccess && <p className="mt-3 break-all rounded-lg bg-slate-100 p-3 font-mono text-xs">{user.uid}</p>}
      {connection && user && <button className="secondary mt-5" onClick={() => {
        void signOut(connection.auth).catch(() => setError('로그아웃에 실패했습니다.'));
      }}>로그아웃</button>}
    </section>
  </main>;
}
