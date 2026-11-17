export const moduleKeys = ['approvals', 'attendance', 'leave', 'accounting', 'sales', 'inventory'] as const;
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
  return role === 'admin' || role === modules[module].access;
}

export function localDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}
