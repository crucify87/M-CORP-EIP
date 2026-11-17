import { CalendarDays, ClipboardCheck, Clock3, Landmark, Package, TrendingUp } from 'lucide-react';
import { collection, query, where, type Firestore } from 'firebase/firestore';

export const moduleKeys = ['approvals', 'attendance', 'leave', 'accounting', 'sales', 'inventory'] as const;
export const moduleIcons = { approvals: ClipboardCheck, attendance: Clock3, leave: CalendarDays,
  accounting: Landmark, sales: TrendingUp, inventory: Package };
export type ModuleKey = typeof moduleKeys[number];
export type Role = 'admin' | 'manager' | 'finance' | 'sales' | 'warehouse' | 'employee';

export interface Employee {
  name: string;
  role: Role;
  active: boolean;
}

export interface RecordFields {
  title: string;
  details: string;
  date: string;
  endDate: string;
  value: number;
  status: string;
}

export const modules = {
  approvals: { label: '전자결재', title: '문서 제목', details: '결재 내용', value: '', access: 'manager', states: ['대기', '승인', '반려'] },
  attendance: { label: '근태', title: '', details: '', value: '', access: 'manager', states: ['근무 중', '퇴근'] },
  leave: { label: '휴가', title: '휴가 유형', details: '신청 사유', value: '', access: 'manager', states: ['대기', '승인', '반려'] },
  accounting: { label: '회계', title: '거래처 또는 경비 항목', details: '지출 내역', value: '금액 (원)', access: 'finance', states: ['정산 대기', '정산 완료', '반려'] },
  sales: { label: '영업', title: '거래처 또는 수주명', details: '영업 메모', value: '예상 금액 (원)', access: 'sales', states: ['문의', '견적', '수주', '종료'] },
  inventory: { label: '재고', title: '품목 코드 (SKU)', details: '품목명과 보관 위치', value: '현재 수량', access: 'warehouse', states: ['관리 중'] },
} as const;

export function manages(role: Role, module: ModuleKey) {
  return role === 'admin' || role === modules[module].access || (module === 'accounting' && role === 'manager');
}

export function approvalActions(module: ModuleKey, role: Role, status: string, isOwner: boolean) {
  if (module !== 'approvals' && module !== 'leave' && module !== 'accounting') return [];
  if (isOwner || (role !== 'manager' && role !== 'admin') || status !== modules[module].states[0]) return [];
  return [
    { label: '반려', status: '반려' },
    { label: '승인', status: modules[module].states[1] },
  ];
}

export function moduleRecords(db: Firestore, module: ModuleKey, uid: string, canManage: boolean) {
  const records = collection(db, module);
  return canManage ? records : query(records, where('owner', '==', uid));
}

const currency = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' });

export function getModuleMetrics(module: ModuleKey, rows: RecordFields[], today: string): [string, string | number][] {
  const count = (status: string) => rows.filter(row => row.status === status).length;
  const amount = (matches: (row: RecordFields) => boolean) =>
    currency.format(rows.filter(matches).reduce((sum, row) => sum + row.value, 0));

  switch (module) {
    case 'approvals':
      return [['승인 대기', count('대기')], ['승인 완료', count('승인')], ['반려', count('반려')]];
    case 'attendance': {
      const todayRows = rows.filter(row => row.date === today);
      return [['오늘 근태 기록', todayRows.length], ['근무 중', todayRows.filter(row => row.status === '근무 중').length]];
    }
    case 'leave':
      return [['신청 내역', rows.length], ['결재 대기', count('대기')]];
    case 'accounting':
      return [['이번 달 비용 청구', amount(row => row.date.startsWith(today.slice(0, 7)))], ['정산 대기', count('정산 대기') + '건']];
    case 'sales':
      return [['누적 수주액', amount(row => row.status === '수주')], ['진행 중인 파이프라인', amount(row => row.status === '문의' || row.status === '견적')]];
    case 'inventory':
      return [['총 보유 품목 (SKU)', rows.length], ['총 재고 수량', rows.reduce((sum, row) => sum + row.value, 0).toLocaleString('ko-KR')],
        ['재고 없음', rows.filter(row => row.value === 0).length + '품목']];
  }
}

export function localDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}
