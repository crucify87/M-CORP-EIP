export type MainTab = 'home' | 'hr' | 'accounting' | 'sales' | 'more';

export type MoreSubView = 'inventory' | 'leave';

export interface UserProfile {
  employeeId: string;
  name: string;
  rank: string;
  division: string;
  department: string;
  email: string;
  phone: string;
  joinDate: string;
  officeLocation: string;
  remainingLeave: number;
  totalLeave: number;
  usedLeave: number;
  monthlyAvailableLeave: number;
}

export type ApprovalStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';

export interface ApprovalItem {
  id: string;
  docType: '지출결의서' | '휴가신청서' | '구매요청서' | '발주품의서';
  urgency: '긴급' | '일반' | '사전검토필';
  title: string;
  requester: string;
  requesterDept: string;
  timeAgo: string;
  amountLabel?: string;
  amount?: number;
  detailNote?: string;
  status: ApprovalStatus;
  rejectionReason?: string;
  createdAt: string;
}

export type AttendanceStatus = 'working' | 'outing' | 'clocked_out';

export interface AttendanceState {
  status: AttendanceStatus;
  clockInTime: string;
  clockOutTime: string | null;
  workedMinutes: number;
  targetMinutes: number;
  monthlyCumulativeHours: number;
  monthlyCumulativeMinutes: number;
  monthlyTargetHours: number;
  overtimeHours: number;
  logs: { time: string; action: string; note: string }[];
}

export interface TeamMemberAttendance {
  id: string;
  name: string;
  initial: string;
  role: string;
  status: '정상근무' | '연차휴가' | '외근중';
  detail: string;
  department: string;
}

export interface LeaveHistoryItem {
  id: string;
  type: string;
  days: number;
  title: string;
  dateRange: string;
  status: '결재 완료' | '결재 진행중' | '반려';
  substitute: string;
  reason: string;
}

export interface PayslipRecord {
  month: string;
  netPay: number;
  basePay: number;
  mealAndWelfare: number;
  bonus: number;
  deductions: number;
  payDate: string;
}

export type ExpenseCategory = '법인카드' | '개인경비' | '세금계산서';
export type ExpenseStatus = '정산 대기' | '전표 승인완료' | '입금 처리중' | '보완 요청';

export interface ExpenseTransaction {
  id: string;
  merchant: string;
  category: ExpenseCategory;
  status: ExpenseStatus;
  amount: number;
  supplyAmount?: number;
  vatAmount?: number;
  description: string;
  dateTime: string;
  month: string;
  paymentMethod: string;
  note: string;
  receiptCode?: string;
  slipNo?: string;
  iconType: 'coffee' | 'cloud' | 'train' | 'receipt';
}

export type PipelineStage = 'lead' | 'quote' | 'confirmed' | 'shipped';

export interface SalesDeal {
  id: string;
  clientName: string;
  docNumber: string;
  title: string;
  stage: PipelineStage;
  statusLabel: string;
  amount: number;
  dateInfoLabel: string;
  dateInfoValue: string;
  progressPercent?: number;
  progressText?: string;
  approvalNote?: string;
  ownerName: string;
  ownerTeam: string;
  isUrgentDate?: boolean;
  taxInvoiceIssued?: boolean;
  erpSynced?: boolean;
  history: { date: string; note: string }[];
}

export interface SalesRepPerformance {
  id: string;
  name: string;
  initial: string;
  team: string;
  activeDeals: number;
  amount: number;
  achievementRate: number;
}

export interface WarehouseCenter {
  id: string;
  name: string;
  location: string;
  status: '정상가동' | '점검중';
  totalSku: number;
  newSkuCount: number;
  lowStockCount: number;
  inboundExpected: number;
  outboundPending: number;
  onTimeRate: number;
}

export interface WarehouseDoc {
  id: string;
  centerId: string;
  type: 'outbound' | 'inbound';
  status: '출고 대기' | '출고 완료' | '입고 완료';
  docNumber: string;
  timeLabel: string;
  itemName: string;
  sku: string;
  lotOrMaker: string;
  quantity: number;
  destinationOrZone: string;
  inspectionStatus: string;
  trackingOrEvidence: string;
  footerNote: string;
}

export interface InventoryItem {
  id: string;
  centerId: string;
  sku: string;
  name: string;
  spec: string;
  rackLocation: string;
  availableQty: number;
  safetyQty: number;
  unitPrice: number;
  reorderRequested?: boolean;
}

export interface NotificationItem {
  id: string;
  category: '결재' | '회계' | '물류' | '인사';
  title: string;
  message: string;
  time: string;
  read: boolean;
  targetTab: MainTab;
  targetSubView?: MoreSubView;
}
