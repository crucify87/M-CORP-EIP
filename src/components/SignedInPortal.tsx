import { useEffect, useState } from 'react';
import { signOut, type Auth, type User } from 'firebase/auth';
import { doc, getFirestore, onSnapshot } from 'firebase/firestore';
import { Workspace } from './Workspace';
import type { Employee } from '../records';

export default function SignedInPortal({ auth, user }: { auth: Auth; user: User }) {
  const db = getFirestore(auth.app);
  const [employee, setEmployee] = useState<Employee | null>();
  const [error, setError] = useState('');

  useEffect(() => onSnapshot(doc(db, 'employees', user.uid), snapshot => {
    const profile = snapshot.exists() ? snapshot.data() as Employee : null;
    setEmployee(profile?.active === true ? profile : null);
    setError('');
  }, () => setError('직원 접근 권한을 확인하지 못했습니다.')), [db, user.uid]);

  if (employee && !error) {
    return <Workspace user={user} employee={employee} db={db} onLogout={() => signOut(auth)} />;
  }

  return <main className="grid min-h-screen place-items-center p-5">
    <section className="panel w-full max-w-md">
      <h1 className="text-xl font-bold">M CORP EIP</h1>
      <p role="status" className="mt-3 text-sm text-slate-600">
        {error || (employee === null ? '업무 포털을 이용하려면 아래 계정 ID를 사내 관리자에게 전달해 주세요.' : '계정 확인 중…')}
      </p>
      {employee === null && !error && <p className="mt-3 break-all rounded-lg bg-slate-100 p-3 font-mono text-xs">{user.uid}</p>}
      <button type="button" className="secondary mt-5" onClick={() => {
        void signOut(auth).catch(() => setError('로그아웃에 실패했습니다.'));
      }}>로그아웃</button>
    </section>
  </main>;
}
