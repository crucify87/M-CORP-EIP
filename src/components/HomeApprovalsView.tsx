import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCheck,
  Clock,
  Receipt,
  Calendar,
  Megaphone,
  Fingerprint,
  Camera,
  FileText,
  QrCode,
  ArrowRight,
  X,
  ChevronRight,
} from 'lucide-react';
import { ApprovalItem, ApprovalStatus, MainTab, MoreSubView, UserProfile } from '../types/erp';
import { formatKRW } from '../utils/format';

interface HomeApprovalsViewProps {
  user: UserProfile;
  approvals: ApprovalItem[];
  monthlyExpenseTotal: number;
  corpExpenseCount: number;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onBatchApprove: () => void;
  onNavigate: (tab: MainTab, subView?: MoreSubView) => void;
  onOpenOcrModal: () => void;
  onOpenBarcodeModal: () => void;
}

export const HomeApprovalsView: React.FC<HomeApprovalsViewProps> = ({
  user,
  approvals,
  monthlyExpenseTotal,
  corpExpenseCount,
  onApprove,
  onReject,
  onBatchApprove,
  onNavigate,
  onOpenOcrModal,
  onOpenBarcodeModal,
}) => {
  const [filterTab, setFilterTab] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [rejectTarget, setRejectTarget] = useState<ApprovalItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [detailItem, setDetailItem] = useState<ApprovalItem | null>(null);
  const [showNoticeModal, setShowNoticeModal] = useState(false);

  const pendingItems = approvals.filter((a) => a.status === 'pending');
  const inProgressItems = approvals.filter((a) => a.status === 'in_progress');
  const completedItems = approvals.filter((a) => a.status === 'completed' || a.status === 'rejected');
  const urgentPendingCount = pendingItems.filter((a) => a.urgency === '긴급').length;

  const visibleList =
    filterTab === 'pending'
      ? pendingItems
      : filterTab === 'in_progress'
      ? inProgressItems
      : completedItems;

  const leaveProgressPct = Math.min(100, Math.round((user.remainingLeave / user.totalLeave) * 100));

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;
    onReject(rejectTarget.id, rejectReason.trim() || '검토 후 보완 요청');
    setRejectTarget(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-5">
      {/* Department & Date Subheader */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2 font-medium text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-600" aria-hidden="true" />
          <span>
            {user.division} · {user.department}
          </span>
        </div>
        <span className="tabular-nums text-slate-500">2025.06.18 (수)</span>
      </div>

      {/* Top Grid: Urgent Banner + 4 KPI Cards on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Urgent Approval Banner */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 font-semibold text-red-700 bg-red-50 border border-red-200/70 px-2 py-0.5 rounded-md">
                  <AlertCircle className="w-3.5 h-3.5" />
                  긴급처리
                </span>
                <span className="text-slate-500">대기열 우선배정</span>
              </div>
              <span className="text-xs font-bold text-red-700 tabular-nums">D-DAY</span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              오늘 처리할 결재{' '}
              <span className="text-[#1A3D9E] tabular-nums">{pendingItems.length}건</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              정기 이사회 및 월말 예산 집행 결재 포함
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 tabular-nums">
              긴급 {urgentPendingCount}건 우선 대기
            </span>
            <button
              type="button"
              disabled={pendingItems.length === 0}
              onClick={onBatchApprove}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#1A3D9E] hover:bg-[#143080] disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <CheckCheck className="w-4 h-4" />
              <span>일괄 승인</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-sm font-bold text-slate-900">주요 업무 현황</h3>
            <span className="text-xs text-slate-400">실시간 동기화</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFilterTab('pending')}
              className="bg-white hover:border-[#1A3D9E]/40 rounded-2xl border border-slate-200/90 p-4 text-left transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>금월 승인 대기</span>
                <Clock className="w-4 h-4 text-[#1A3D9E]" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">
                  {pendingItems.length}
                </span>
                <span className="text-xs text-slate-500">건</span>
              </div>
              <div className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
                <span className="text-red-700 font-semibold tabular-nums">
                  긴급 {urgentPendingCount}건
                </span>
                <span aria-hidden="true">·</span>
                <span>미결 포함</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('accounting')}
              className="bg-white hover:border-[#1A3D9E]/40 rounded-2xl border border-slate-200/90 p-4 text-left transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>이번달 비용 청구</span>
                <Receipt className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 tabular-nums truncate">
                {formatKRW(monthlyExpenseTotal)}
              </div>
              <div className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
                <span className="text-[#1A3D9E] font-semibold">처리중</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">법인 {corpExpenseCount}건</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('more', 'leave')}
              className="bg-white hover:border-[#1A3D9E]/40 rounded-2xl border border-slate-200/90 p-4 text-left transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>잔여 연차</span>
                <Calendar className="w-4 h-4 text-[#1A3D9E]" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">
                  {user.remainingLeave}
                </span>
                <span className="text-xs text-slate-500 tabular-nums">/ {user.totalLeave}일</span>
              </div>
              <div className="mt-2.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1A3D9E] rounded-full transition-all"
                  style={{ width: `${leaveProgressPct}%` }}
                />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowNoticeModal(true)}
              className="bg-white hover:border-[#1A3D9E]/40 rounded-2xl border border-slate-200/90 p-4 text-left transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>전사 주요 공지</span>
                <Megaphone className="w-4 h-4 text-[#1A3D9E]" />
              </div>
              <div className="mt-2 text-base font-bold text-slate-900">2025 상반기 결산</div>
              <div className="mt-1.5 text-xs text-slate-500 flex items-center justify-between">
                <span>일정 안내 배포</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions Strip */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4">
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => onNavigate('hr')}
            className="flex flex-col items-center justify-center gap-2 py-2 rounded-xl hover:bg-slate-50 transition-colors min-h-[72px]"
          >
            <div className="w-11 h-11 rounded-xl bg-[#E8EEF9] text-[#1A3D9E] flex items-center justify-center">
              <Fingerprint className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-700 whitespace-nowrap">근태 체크</span>
          </button>

          <button
            type="button"
            onClick={onOpenOcrModal}
            className="flex flex-col items-center justify-center gap-2 py-2 rounded-xl hover:bg-slate-50 transition-colors min-h-[72px]"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-700 whitespace-nowrap">영수증 촬영</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('sales')}
            className="flex flex-col items-center justify-center gap-2 py-2 rounded-xl hover:bg-slate-50 transition-colors min-h-[72px]"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-700 whitespace-nowrap">견적서 조회</span>
          </button>

          <button
            type="button"
            onClick={onOpenBarcodeModal}
            className="flex flex-col items-center justify-center gap-2 py-2 rounded-xl hover:bg-slate-50 transition-colors min-h-[72px]"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-700 whitespace-nowrap">바코드 스캔</span>
          </button>
        </div>
      </div>

      {/* Approval Inbox */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">결재 진행함</h3>
            <span className="text-xs font-medium text-slate-500 tabular-nums">
              총 {approvals.length}건
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFilterTab('pending')}
            className="text-xs font-semibold text-[#1A3D9E] hover:underline inline-flex items-center gap-1"
          >
            <span>전체보기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Segmented Filter Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/70 rounded-xl max-w-md">
          <button
            type="button"
            onClick={() => setFilterTab('pending')}
            className={`min-h-[38px] rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              filterTab === 'pending'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>대기</span>
            <span className="px-1.5 py-0.5 rounded-md bg-[#1A3D9E] text-white text-[11px] tabular-nums">
              {pendingItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('in_progress')}
            className={`min-h-[38px] rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              filterTab === 'in_progress'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>진행</span>
            <span className="tabular-nums text-slate-500">{inProgressItems.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('completed')}
            className={`min-h-[38px] rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
              filterTab === 'completed'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>완료</span>
            <span className="tabular-nums text-slate-500">{completedItems.length}</span>
          </button>
        </div>

        {/* Approval List */}
        {visibleList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center">
            <CheckCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-900">해당 상태의 결재 문서가 없습니다</div>
            <p className="text-xs text-slate-500 mt-1">모든 대기 결재가 정상 처리되었습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {visibleList.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs mb-2.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-md ${
                          item.docType === '지출결의서'
                            ? 'bg-[#E8EEF9] text-[#1A3D9E]'
                            : item.docType === '휴가신청서'
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {item.docType}
                      </span>
                      <span
                        className={`font-semibold ${
                          item.urgency === '긴급' ? 'text-red-700' : 'text-slate-500'
                        }`}
                      >
                        · {item.urgency}
                      </span>
                    </div>
                    <span className="text-slate-400 tabular-nums shrink-0">{item.timeAgo}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDetailItem(item)}
                    className="text-left w-full group"
                  >
                    <h4 className="text-base font-bold text-slate-900 group-hover:text-[#1A3D9E] transition-colors leading-snug">
                      {item.title}
                    </h4>
                  </button>

                  {item.detailNote && item.docType === '휴가신청서' && (
                    <p className="text-xs text-slate-600 mt-1.5">{item.detailNote}</p>
                  )}

                  <p className="text-xs text-slate-500 mt-1.5">
                    요청자: {item.requester} ({item.requesterDept})
                  </p>

                  {item.amount !== undefined && (
                    <div className="mt-3 bg-slate-50 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2 border border-slate-100">
                      <span className="text-xs text-slate-500">{item.amountLabel || '금액'}</span>
                      <span className="text-base font-bold text-slate-900 tabular-nums">
                        {formatKRW(item.amount)}
                      </span>
                    </div>
                  )}

                  {item.status === 'rejected' && item.rejectionReason && (
                    <div className="mt-3 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2">
                      반려 사유: {item.rejectionReason}
                    </div>
                  )}
                </div>

                {item.status === 'pending' ? (
                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectTarget(item);
                        setRejectReason('');
                      }}
                      className="min-h-[42px] rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>반려</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onApprove(item.id)}
                      className="min-h-[42px] rounded-xl bg-[#1A3D9E] hover:bg-[#143080] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>승인</span>
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span
                      className={`font-semibold ${
                        item.status === 'completed'
                          ? 'text-emerald-700'
                          : item.status === 'rejected'
                          ? 'text-red-700'
                          : 'text-[#1A3D9E]'
                      }`}
                    >
                      {item.status === 'completed'
                        ? '최종 승인 완료'
                        : item.status === 'rejected'
                        ? '반려 처리됨'
                        : '차상위 결재 진행 중'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDetailItem(item)}
                      className="text-slate-500 hover:text-slate-900 font-medium"
                    >
                      문서 상세
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Reject Reason Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmReject}
            className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">결재 반려 사유 입력</h3>
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3">
              대상 문서: <strong className="text-slate-900">{rejectTarget.title}</strong>
            </div>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="반려 또는 보완 요청 사유를 입력해 주세요."
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A3D9E]"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="h-10 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700"
              >
                취소
              </button>
              <button
                type="submit"
                className="h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                반려 확정
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1A3D9E] bg-[#E8EEF9] px-2.5 py-1 rounded-md">
                {detailItem.docType}
              </span>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{detailItem.title}</h3>
              <p className="text-xs text-slate-500 mt-1">
                기안자: {detailItem.requester} ({detailItem.requesterDept}) · {detailItem.createdAt}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-4 space-y-2 text-xs text-slate-700">
              {detailItem.detailNote && <p className="leading-relaxed">{detailItem.detailNote}</p>}
              {detailItem.amount !== undefined && (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-slate-900">
                  <span>{detailItem.amountLabel || '요청 금액'}</span>
                  <span className="text-sm tabular-nums">{formatKRW(detailItem.amount)}</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setDetailItem(null)}
              className="w-full h-10 rounded-xl bg-slate-900 text-white text-xs font-semibold"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Notice Modal */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#1A3D9E]" />
                <h3 className="text-base font-bold text-slate-900">전사 공지사항</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNoticeModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="font-bold text-sm text-slate-900">
                [재무회계본부] 2025년 상반기 결산 및 경비 마감 일정 안내
              </div>
              <p>
                2025년 6월 3차 경비 마감 기한은 <strong>2025년 6월 20일(금) 18:00</strong>입니다.
                모든 법인카드 미정산 전표 및 세금계산서는 기한 내 결재 상신 완료해 주시기 바랍니다.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                <li>법인카드 전표 작성 마감: 06.20 (금) 18:00</li>
                <li>재무회계팀 최종 검토 및 이체 배치: 06.24 (화)</li>
                <li>하계 휴가 집중 기간 사전 대직자 지정 필수</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setShowNoticeModal(false)}
              className="w-full h-10 rounded-xl bg-[#1A3D9E] text-white text-xs font-semibold"
            >
              확인 완료
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
