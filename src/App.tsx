import React, { useEffect, useState } from 'react';
import {
  Building2,
  Bell,
  FileCheck2,
  BadgeCheck,
  Landmark,
  TrendingUp,
  LayoutGrid,
  Calendar,
  Camera,
  QrCode,
  LogOut,
  CheckCircle2,
  Umbrella,
} from 'lucide-react';
import {
  ApprovalItem,
  AttendanceState,
  ExpenseTransaction,
  InventoryItem,
  LeaveHistoryItem,
  MainTab,
  MoreSubView,
  NotificationItem,
  SalesDeal,
  UserProfile,
  WarehouseDoc,
} from './types/erp';
import {
  INITIAL_APPROVALS,
  INITIAL_ATTENDANCE,
  INITIAL_EXPENSES,
  INITIAL_INVENTORY_ITEMS,
  INITIAL_LEAVE_HISTORY,
  INITIAL_NOTIFICATIONS,
  INITIAL_PAYSLIPS,
  INITIAL_SALES_DEALS,
  INITIAL_SALES_REPS,
  INITIAL_TEAM_ATTENDANCE,
  INITIAL_USER,
  INITIAL_WAREHOUSES,
  INITIAL_WAREHOUSE_DOCS,
} from './data/mockData';
import { LoginView } from './components/LoginView';
import { HomeApprovalsView } from './components/HomeApprovalsView';
import { HrAttendanceView } from './components/HrAttendanceView';
import { LeaveManagementView } from './components/LeaveManagementView';
import { AccountingExpenseView } from './components/AccountingExpenseView';
import { SalesPipelineView } from './components/SalesPipelineView';
import { InventoryWarehouseView } from './components/InventoryWarehouseView';
import {
  BarcodeScannerModal,
  NotificationDrawer,
  OcrReceiptModal,
  ProfileModal,
} from './components/Modals';

const STORAGE_KEY = 'erp_portal_state_v1';

interface PersistedState {
  isAuthenticated: boolean;
  user: UserProfile;
  approvals: ApprovalItem[];
  attendance: AttendanceState;
  leaveHistory: LeaveHistoryItem[];
  expenses: ExpenseTransaction[];
  salesDeals: SalesDeal[];
  warehouseDocs: WarehouseDoc[];
  inventoryItems: InventoryItem[];
  notifications: NotificationItem[];
}

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as PersistedState;
    }
  } catch {
    // ignore storage errors
  }
  return {
    isAuthenticated: true,
    user: INITIAL_USER,
    approvals: INITIAL_APPROVALS,
    attendance: INITIAL_ATTENDANCE,
    leaveHistory: INITIAL_LEAVE_HISTORY,
    expenses: INITIAL_EXPENSES,
    salesDeals: INITIAL_SALES_DEALS,
    warehouseDocs: INITIAL_WAREHOUSE_DOCS,
    inventoryItems: INITIAL_INVENTORY_ITEMS,
    notifications: INITIAL_NOTIFICATIONS,
  };
}

export default function App() {
  const [initial] = useState<PersistedState>(() => loadInitialState());

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initial.isAuthenticated);
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [moreSubView, setMoreSubView] = useState<MoreSubView>('inventory');

  const [user, setUser] = useState<UserProfile>(initial.user);
  const [approvals, setApprovals] = useState<ApprovalItem[]>(initial.approvals);
  const [attendance, setAttendance] = useState<AttendanceState>(initial.attendance);
  const [leaveHistory, setLeaveHistory] = useState<LeaveHistoryItem[]>(initial.leaveHistory);
  const [expenses, setExpenses] = useState<ExpenseTransaction[]>(initial.expenses);
  const [salesDeals, setSalesDeals] = useState<SalesDeal[]>(initial.salesDeals);
  const [warehouseDocs, setWarehouseDocs] = useState<WarehouseDoc[]>(initial.warehouseDocs);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(initial.inventoryItems);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initial.notifications);

  const [showNotiDrawer, setShowNotiDrawer] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [inventorySearchSku, setInventorySearchSku] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const payload: PersistedState = {
        isAuthenticated,
        user,
        approvals,
        attendance,
        leaveHistory,
        expenses,
        salesDeals,
        warehouseDocs,
        inventoryItems,
        notifications,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage quota errors
    }
  }, [
    isAuthenticated,
    user,
    approvals,
    attendance,
    leaveHistory,
    expenses,
    salesDeals,
    warehouseDocs,
    inventoryItems,
    notifications,
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const handleNavigate = (tab: MainTab, subView?: MoreSubView) => {
    setActiveTab(tab);
    if (subView) {
      setMoreSubView(subView);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(INITIAL_USER);
    setApprovals(INITIAL_APPROVALS);
    setAttendance(INITIAL_ATTENDANCE);
    setLeaveHistory(INITIAL_LEAVE_HISTORY);
    setExpenses(INITIAL_EXPENSES);
    setSalesDeals(INITIAL_SALES_DEALS);
    setWarehouseDocs(INITIAL_WAREHOUSE_DOCS);
    setInventoryItems(INITIAL_INVENTORY_ITEMS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setActiveTab('home');
    showToast('초기 ERP 데모 데이터로 복원되었습니다.');
  };

  // Approval handlers
  const handleApprove = (id: string) => {
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'completed' } : a))
    );
    showToast('결재 문서가 최종 승인 처리되었습니다.');
  };

  const handleReject = (id: string, reason: string) => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: 'rejected', rejectionReason: reason } : a
      )
    );
    showToast('결재 문서가 반려 처리되었습니다.');
  };

  const handleBatchApprove = () => {
    const count = approvals.filter((a) => a.status === 'pending').length;
    setApprovals((prev) =>
      prev.map((a) => (a.status === 'pending' ? { ...a, status: 'completed' } : a))
    );
    showToast(`대기 중이던 결재 ${count}건을 일괄 승인했습니다.`);
  };

  // Attendance handlers
  const handleToggleOuting = () => {
    const nowTime = new Date().toTimeString().slice(0, 5);
    setAttendance((prev) => {
      const nextStatus = prev.status === 'outing' ? 'working' : 'outing';
      return {
        ...prev,
        status: nextStatus,
        logs: [
          {
            time: nowTime,
            action: nextStatus === 'outing' ? '외출 기록' : '업무 복귀',
            note: nextStatus === 'outing' ? '외부 미팅 및 외근 이동' : '사내 업무 복귀 완료',
          },
          ...prev.logs,
        ],
      };
    });
    showToast(
      attendance.status === 'outing' ? '업무 복귀가 기록되었습니다.' : '외출 상태가 기록되었습니다.'
    );
  };

  const handleClockOut = () => {
    const nowTime = new Date().toTimeString().slice(0, 5);
    setAttendance((prev) => ({
      ...prev,
      status: 'clocked_out',
      clockOutTime: nowTime,
      workedMinutes: prev.targetMinutes,
      logs: [
        {
          time: nowTime,
          action: '퇴근 완료',
          note: '일일 근무시간 정산 완료',
        },
        ...prev.logs,
      ],
    }));
    showToast('퇴근 기록이 정상 처리되었습니다.');
  };

  // Leave submission handler (updates both LeaveHistory and Home Approvals)
  const handleSubmitLeave = (payload: {
    typeLabel: string;
    days: number;
    dateRange: string;
    reason: string;
    substitute: string;
  }) => {
    const newLeave: LeaveHistoryItem = {
      id: `lv-${Date.now()}`,
      type: `${payload.typeLabel} (${payload.days}일)`,
      days: payload.days,
      title: payload.reason,
      dateRange: payload.dateRange,
      status: '결재 진행중',
      substitute: payload.substitute,
      reason: payload.reason,
    };

    const newApproval: ApprovalItem = {
      id: `apr-${Date.now()}`,
      docType: '휴가신청서',
      urgency: '일반',
      title: `${payload.typeLabel} (${payload.dateRange})`,
      requester: `${user.name} ${user.rank}`,
      requesterDept: `${user.department} · 잔여 ${user.remainingLeave}일`,
      timeAgo: '방금 전',
      detailNote: `사유: ${payload.reason} · 업무 대직자: ${payload.substitute}`,
      status: 'in_progress',
      createdAt: '2025.06.18 방금',
    };

    setLeaveHistory((prev) => [newLeave, ...prev]);
    setApprovals((prev) => [newApproval, ...prev]);
    showToast('휴가 전자결재 신청서가 상신되었습니다.');
  };

  // Accounting handlers
  const handleCreateExpense = (tx: Omit<ExpenseTransaction, 'id'>) => {
    const created: ExpenseTransaction = {
      ...tx,
      id: `exp-${Date.now()}`,
    };
    setExpenses((prev) => [created, ...prev]);
    showToast(`${tx.merchant} (${tx.amount.toLocaleString()}원) 전표가 생성되었습니다.`);
  };

  const handleCompleteExpenseSlip = (id: string) => {
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              status: '전표 승인완료',
              note: '모바일 전표 상신 및 자동 검증 완료 (2025.06.18)',
              slipNo: `SLIP-2025-${Math.floor(1000 + Math.random() * 9000)}`,
            }
          : e
      )
    );
    showToast('전표 작성이 완료되어 상신되었습니다.');
  };

  const handleUpdateExpense = (id: string, description: string, amount: number) => {
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              description,
              amount,
              supplyAmount: Math.round(amount / 1.1),
              vatAmount: amount - Math.round(amount / 1.1),
            }
          : e
      )
    );
    showToast('경비 전표 항목이 수정되었습니다.');
  };

  const handleBatchSubmitExpenses = () => {
    const count = expenses.filter(
      (e) => e.status === '정산 대기' || e.status === '보완 요청'
    ).length;
    setExpenses((prev) =>
      prev.map((e) =>
        e.status === '정산 대기' || e.status === '보완 요청'
          ? {
              ...e,
              status: '전표 승인완료',
              note: '일괄 결재상신 완료 (2025.06.18)',
            }
          : e
      )
    );
    showToast(`미정산 전표 ${count}건을 일괄 결재상신했습니다.`);
  };

  // Sales handlers
  const handleCreateDeal = (deal: Omit<SalesDeal, 'id' | 'history'>) => {
    const created: SalesDeal = {
      ...deal,
      id: `deal-${Date.now()}`,
      history: [{ date: '2025.06.18', note: 'ERP Portal에서 신규 등록됨' }],
    };
    setSalesDeals((prev) => [created, ...prev]);
    showToast(`${deal.clientName} 건이 파이프라인에 등록되었습니다.`);
  };

  const handleResendQuote = (dealId: string) => {
    setSalesDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? {
              ...d,
              history: [
                { date: '2025.06.18', note: '고객사 담당자에게 견적서 PDF 재전송 완료' },
                ...d.history,
              ],
            }
          : d
      )
    );
    showToast('견적서가 고객사 담당자 메일로 재전송되었습니다.');
  };

  const handleUrgeApproval = (dealId: string) => {
    setSalesDeals((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? {
              ...d,
              history: [
                { date: '2025.06.18', note: '결재권자에게 긴급 결재 재촉 알림 발송' },
                ...d.history,
              ],
            }
          : d
      )
    );
    showToast('임원 결재권자에게 결재 재촉 알림을 발송했습니다.');
  };

  // Warehouse handlers
  const handleConfirmOutbound = (docId: string) => {
    setWarehouseDocs((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              status: '출고 완료',
              timeLabel: '금일 출고 확정',
              footerNote: '출고 전표 발행 및 재고 차감 완료',
            }
          : d
      )
    );
    showToast('출고 확인 및 전표 발행이 완료되었습니다.');
  };

  const handleRequestReorder = (item: InventoryItem, orderQty: number) => {
    setInventoryItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, reorderRequested: true } : i))
    );
    const newApproval: ApprovalItem = {
      id: `apr-po-${Date.now()}`,
      docType: '구매요청서',
      urgency: '긴급',
      title: `[안전재고 보충] ${item.name} (${item.sku}) ${orderQty} EA 발주`,
      requester: `${user.name} ${user.rank}`,
      requesterDept: '재고·물류 관제 연동',
      timeAgo: '방금 전',
      amountLabel: '예상 발주 금액',
      amount: orderQty * item.unitPrice,
      detailNote: `현재 재고 ${item.availableQty} EA / 적정 안전재고 ${item.safetyQty} EA`,
      status: 'pending',
      createdAt: '2025.06.18 방금',
    };
    setApprovals((prev) => [newApproval, ...prev]);
    showToast(`${item.sku} ${orderQty} EA 구매요청서가 결재함에 상신되었습니다.`);
  };

  if (!isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={(empId) => {
          setIsAuthenticated(true);
          setActiveTab('home');
          showToast(`${empId} 계정으로 보안 로그인되었습니다.`);
        }}
      />
    );
  }

  const unreadNotiCount = notifications.filter((n) => !n.read).length;
  const monthlyExpenseTotal = expenses.reduce((acc, cur) => acc + cur.amount, 0);
  const corpExpenseCount = expenses.filter((e) => e.category === '법인카드').length;
  const lowStockCount = inventoryItems.filter((i) => i.availableQty < i.safetyQty).length;

  const pageTitle =
    activeTab === 'home'
      ? '홈 / 결재'
      : activeTab === 'hr'
      ? '인사·근태'
      : activeTab === 'accounting'
      ? '회계·비용'
      : activeTab === 'sales'
      ? '영업·수주'
      : moreSubView === 'leave'
      ? '근태·휴가 관리'
      : '재고·물류/창고관제';

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-slate-900 flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-slate-200/90 z-30">
        <div className="h-14 px-5 border-b border-slate-200/80 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1A3D9E] text-white flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#1A3D9E]">ERP Portal</span>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {[
            { id: 'home', label: '홈 / 전자결재', icon: FileCheck2, badge: approvals.filter((a) => a.status === 'pending').length },
            { id: 'hr', label: '인사·근태', icon: BadgeCheck },
            { id: 'leave', label: '근태·휴가 관리', icon: Umbrella },
            { id: 'accounting', label: '회계·비용 관리', icon: Landmark },
            { id: 'sales', label: '영업·수주 파이프라인', icon: TrendingUp },
            { id: 'inventory', label: '재고·물류/창고관제', icon: LayoutGrid, badge: lowStockCount, badgeRed: true },
          ].map((nav) => {
            const Icon = nav.icon;
            const isActive =
              (nav.id === 'home' && activeTab === 'home') ||
              (nav.id === 'hr' && activeTab === 'hr') ||
              (nav.id === 'accounting' && activeTab === 'accounting') ||
              (nav.id === 'sales' && activeTab === 'sales') ||
              (nav.id === 'leave' && activeTab === 'more' && moreSubView === 'leave') ||
              (nav.id === 'inventory' && activeTab === 'more' && moreSubView === 'inventory');

            return (
              <button
                key={nav.id}
                type="button"
                onClick={() => {
                  if (nav.id === 'leave') handleNavigate('more', 'leave');
                  else if (nav.id === 'inventory') handleNavigate('more', 'inventory');
                  else handleNavigate(nav.id as MainTab);
                }}
                className={`w-full min-h-[44px] px-3.5 rounded-xl flex items-center justify-between text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#E8EEF9] text-[#1A3D9E]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">{nav.label}</span>
                </span>
                {nav.badge !== undefined && nav.badge > 0 && (
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md tabular-nums ${
                      nav.badgeRed ? 'bg-red-50 text-red-700' : 'bg-[#1A3D9E] text-white'
                    }`}
                  >
                    {nav.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200/80 space-y-2">
          <button
            type="button"
            onClick={() => setIsAuthenticated(false)}
            className="w-full min-h-[40px] px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>보안 로그인 화면</span>
          </button>
        </div>
      </aside>

      {/* Main Layout Container */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Sticky Top Header (Compact <= 56px) */}
        <header className="sticky top-0 z-20 h-14 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="lg:hidden w-8 h-8 rounded-lg bg-[#1A3D9E] text-white flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="lg:hidden text-base font-bold tracking-tight text-[#1A3D9E] whitespace-nowrap">
              ERP Portal
            </span>
            <span className="hidden lg:inline text-base font-bold text-slate-900 whitespace-nowrap">
              {pageTitle}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline truncate">
              / {user.division}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {activeTab === 'accounting' && (
              <button
                type="button"
                onClick={() => setShowOcrModal(true)}
                aria-label="영수증 촬영"
                className="min-h-[40px] min-w-[40px] px-2.5 rounded-xl bg-[#E8EEF9] text-[#1A3D9E] hover:bg-[#dce5f7] flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">영수증 OCR</span>
              </button>
            )}

            {activeTab === 'more' && moreSubView === 'inventory' && (
              <button
                type="button"
                onClick={() => setShowBarcodeModal(true)}
                aria-label="바코드 스캔"
                className="min-h-[40px] min-w-[40px] px-2.5 rounded-xl bg-[#E8EEF9] text-[#1A3D9E] hover:bg-[#dce5f7] flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">바코드 스캔</span>
              </button>
            )}

            {activeTab === 'hr' && (
              <button
                type="button"
                onClick={() => handleNavigate('more', 'leave')}
                aria-label="휴가 캘린더"
                className="min-h-[40px] min-w-[40px] px-2.5 rounded-xl hover:bg-slate-100 text-slate-700 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">휴가 신청</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowNotiDrawer(true)}
              aria-label="알림함 열기"
              className="relative min-h-[40px] min-w-[40px] rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadNotiCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {unreadNotiCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="min-h-[40px] pl-1.5 pr-3 py-1 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center gap-2 transition-colors"
            >
              <span className="w-7 h-7 rounded-full bg-[#1A3D9E] text-white text-xs font-bold flex items-center justify-center">
                {user.name.slice(0, 1)}
              </span>
              <span className="text-xs font-semibold text-slate-800 whitespace-nowrap hidden sm:inline">
                {user.name} {user.rank}
              </span>
            </button>
          </div>
        </header>

        {/* Scrollable Workspace Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          {activeTab === 'home' && (
            <HomeApprovalsView
              user={user}
              approvals={approvals}
              monthlyExpenseTotal={monthlyExpenseTotal}
              corpExpenseCount={corpExpenseCount}
              onApprove={handleApprove}
              onReject={handleReject}
              onBatchApprove={handleBatchApprove}
              onNavigate={handleNavigate}
              onOpenOcrModal={() => setShowOcrModal(true)}
              onOpenBarcodeModal={() => setShowBarcodeModal(true)}
            />
          )}

          {activeTab === 'hr' && (
            <HrAttendanceView
              user={user}
              attendance={attendance}
              teamMembers={INITIAL_TEAM_ATTENDANCE}
              payslips={INITIAL_PAYSLIPS}
              onToggleOuting={handleToggleOuting}
              onClockOut={handleClockOut}
              onOpenLeaveView={() => handleNavigate('more', 'leave')}
            />
          )}

          {activeTab === 'accounting' && (
            <AccountingExpenseView
              expenses={expenses}
              onOpenOcrModal={() => setShowOcrModal(true)}
              onCompleteExpenseSlip={handleCompleteExpenseSlip}
              onUpdateExpense={handleUpdateExpense}
              onBatchSubmitExpenses={handleBatchSubmitExpenses}
            />
          )}

          {activeTab === 'sales' && (
            <SalesPipelineView
              deals={salesDeals}
              reps={INITIAL_SALES_REPS}
              onCreateDeal={handleCreateDeal}
              onResendQuote={handleResendQuote}
              onUrgeApproval={handleUrgeApproval}
              onNavigateAccounting={() => handleNavigate('accounting')}
            />
          )}

          {activeTab === 'more' && moreSubView === 'inventory' && (
            <InventoryWarehouseView
              warehouses={INITIAL_WAREHOUSES}
              docs={warehouseDocs}
              inventoryItems={inventoryItems}
              initialSearchSku={inventorySearchSku}
              onConfirmOutbound={handleConfirmOutbound}
              onRequestReorder={handleRequestReorder}
              onOpenBarcodeModal={() => setShowBarcodeModal(true)}
              onOpenLeaveView={() => setMoreSubView('leave')}
              onOpenLoginView={() => setIsAuthenticated(false)}
            />
          )}

          {activeTab === 'more' && moreSubView === 'leave' && (
            <LeaveManagementView
              user={user}
              leaveHistory={leaveHistory}
              teamMembers={INITIAL_TEAM_ATTENDANCE}
              onBackToHr={() => handleNavigate('hr')}
              onSubmitLeave={handleSubmitLeave}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom 5-Tab Thumb Navigation (hidden on lg desktop) */}
      <nav
        aria-label="하단 주 메뉴"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 h-16 px-2 grid grid-cols-5 items-center"
      >
        {[
          { id: 'home', label: '홈/결재', icon: FileCheck2 },
          { id: 'hr', label: '인사', icon: BadgeCheck },
          { id: 'accounting', label: '회계', icon: Landmark },
          { id: 'sales', label: '영업', icon: TrendingUp },
          { id: 'more', label: '더보기', icon: LayoutGrid, dot: lowStockCount > 0 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                if (tab.id === 'more') {
                  handleNavigate('more', 'inventory');
                } else {
                  handleNavigate(tab.id as MainTab);
                }
              }}
              className={`relative min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
                isActive ? 'text-[#1A3D9E]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {tab.dot && (
                  <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-red-600" />
                )}
              </div>
              <span className={`text-[11px] leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Shared Modals & Drawers */}
      <NotificationDrawer
        open={showNotiDrawer}
        onClose={() => setShowNotiDrawer(false)}
        notifications={notifications}
        onMarkAllRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
        onSelectNotification={(item) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
          );
          handleNavigate(item.targetTab, item.targetSubView);
        }}
      />

      <ProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onLogout={() => setIsAuthenticated(false)}
        onResetDemoData={handleResetDemoData}
        onNavigate={handleNavigate}
      />

      <OcrReceiptModal
        open={showOcrModal}
        onClose={() => setShowOcrModal(false)}
        onCreateExpense={handleCreateExpense}
      />

      <BarcodeScannerModal
        open={showBarcodeModal}
        onClose={() => setShowBarcodeModal(false)}
        inventoryItems={inventoryItems}
        onJumpToInventorySku={(sku) => {
          setInventorySearchSku(sku);
          handleNavigate('more', 'inventory');
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto sm:max-w-sm z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-medium"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
