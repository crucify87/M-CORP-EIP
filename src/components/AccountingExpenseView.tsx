import React, { useState } from 'react';
import {
  CreditCard,
  Camera,
  Wallet,
  Calendar,
  SlidersHorizontal,
  CheckCheck,
  Coffee,
  Cloud,
  TrainFront,
  Receipt,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Printer,
  ArrowRight,
  X,
} from 'lucide-react';
import { ExpenseCategory, ExpenseTransaction } from '../types/erp';
import { formatKRW } from '../utils/format';

interface AccountingExpenseViewProps {
  expenses: ExpenseTransaction[];
  onOpenOcrModal: () => void;
  onCompleteExpenseSlip: (id: string) => void;
  onUpdateExpense: (id: string, description: string, amount: number) => void;
  onBatchSubmitExpenses: () => void;
}

export const AccountingExpenseView: React.FC<AccountingExpenseViewProps> = ({
  expenses,
  onOpenOcrModal,
  onCompleteExpenseSlip,
  onUpdateExpense,
  onBatchSubmitExpenses,
}) => {
  const [filterTab, setFilterTab] = useState<'전체' | ExpenseCategory | '예산조회'>('전체');
  const [selectedMonth, setSelectedMonth] = useState('2025.06');
  const [onlyPending, setOnlyPending] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState<ExpenseTransaction | null>(null);
  const [editTarget, setEditTarget] = useState<ExpenseTransaction | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [printTarget, setPrintTarget] = useState<ExpenseTransaction | null>(null);

  const cardLimit = 3000000;
  const corpCardUsed = 1890000 + expenses
    .filter((e) => e.category === '법인카드' && !['exp-01', 'exp-04', 'exp-05'].includes(e.id))
    .reduce((acc, cur) => acc + cur.amount, 0);
  const cardPct = Math.min(100, Math.round((corpCardUsed / cardLimit) * 100));
  const cardRemaining = Math.max(0, cardLimit - corpCardUsed);

  const unsettledItems = expenses.filter(
    (e) => e.status === '정산 대기' || e.status === '보완 요청'
  );
  const unsettledTotal = unsettledItems.reduce((acc, cur) => acc + cur.amount, 0);

  const corpCount = expenses.filter((e) => e.category === '법인카드').length;

  const filteredExpenses = expenses.filter((e) => {
    if (e.month !== selectedMonth) return false;
    if (onlyPending && e.status !== '정산 대기' && e.status !== '보완 요청') return false;
    if (filterTab === '전체' || filterTab === '예산조회') return true;
    return e.category === filterTab;
  });

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    onUpdateExpense(editTarget.id, editDesc.trim(), Math.max(0, Number(editAmount) || 0));
    setEditTarget(null);
  };

  const renderIcon = (type: ExpenseTransaction['iconType']) => {
    switch (type) {
      case 'coffee':
        return <Coffee className="w-4 h-4 text-amber-700" />;
      case 'cloud':
        return <Cloud className="w-4 h-4 text-emerald-700" />;
      case 'train':
        return <TrainFront className="w-4 h-4 text-[#1A3D9E]" />;
      default:
        return <Receipt className="w-4 h-4 text-slate-700" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Summary Bar */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">회계·비용 관리</h2>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            2025년 6월 3차 경비 마감 기한 D-3 (마감일: 2025.06.20 18:00)
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          실시간 ERP 동기화
        </span>
      </div>

      {/* Top 2-Column Overview: Corporate Card Limit + Q2 Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Corporate Card Limit Card */}
        <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#1A3D9E]" />
              <h3 className="text-base font-bold text-slate-900">2025년 6월 법인카드 한도 현황</h3>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              한도 리셋: 매월 1일 |{' '}
              <span className="text-[#1A3D9E] font-semibold">신한법인 (4821-****)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Used */}
            <div className="border border-slate-200/80 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-500">사용 금액</span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  한도 내 정상
                </span>
              </div>
              <div className="text-xl font-bold text-slate-900 tabular-nums">
                {formatKRW(corpCardUsed)}
              </div>
              <div className="text-xs text-slate-500 mt-1 tabular-nums">
                한도 ₩3,000,000 중 <strong className="text-[#1A3D9E]">{cardPct}%</strong> 소진
              </div>
              <div className="mt-2.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#1A3D9E] rounded-full" style={{ width: `${cardPct}%` }} />
              </div>
            </div>

            {/* Unsettled */}
            <div className="border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-500">미정산 전표</span>
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                    처리 필요
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-[#1A3D9E] tabular-nums">
                    {unsettledItems.length}건
                  </span>
                  <span className="text-xs text-slate-600 tabular-nums">
                    합계 {formatKRW(unsettledTotal)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  전표 미작성 {unsettledItems.filter((i) => i.status === '정산 대기').length}건 / 보완요청{' '}
                  {unsettledItems.filter((i) => i.status === '보완 요청').length}건
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFilterTab('전체');
                  setOnlyPending(true);
                }}
                className="mt-2.5 text-xs font-semibold text-[#1A3D9E] hover:underline inline-flex items-center gap-1"
              >
                <span>즉시 확인</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Remaining */}
            <div className="border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-500">잔여 가용 한도</span>
                  <span className="text-xs font-medium text-slate-500 tabular-nums">
                    잔여 {100 - cardPct}%
                  </span>
                </div>
                <div className="text-xl font-bold text-slate-900 tabular-nums">
                  {formatKRW(cardRemaining)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  전월 대비 소비율 <strong className="text-emerald-700">-4.2%</strong> 개선
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-400 tabular-nums">
                ※ 일일 승인 가능 한도: ₩1,000,000
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenOcrModal}
            className="w-full h-12 rounded-xl bg-[#1A3D9E] hover:bg-[#143080] text-white text-sm font-semibold flex items-center justify-center gap-2.5 transition-colors"
          >
            <Camera className="w-4 h-4" />
            <span>영수증 촬영으로 즉시 전표 생성</span>
            <span className="text-[11px] font-mono-num bg-white/20 px-2 py-0.5 rounded">
              OCR Auto
            </span>
          </button>
        </section>

        {/* Q2 Budget Execution Card */}
        <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-700" />
                <h3 className="text-base font-bold text-slate-900">2025 Q2 사업예산 집행률</h3>
              </div>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                정상 통제구역
              </span>
            </div>

            <div className="text-xs text-slate-500 tabular-nums">
              총 배정 예산: <strong className="text-slate-700 font-mono-num">₩50,000,000</strong>
            </div>

            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="text-xs text-slate-500">현재 집행액: </span>
                <span className="text-xl font-bold text-slate-900 tabular-nums">₩39,200,000</span>
              </div>
              <div className="text-xs tabular-nums">
                <strong className="text-base font-bold text-[#1A3D9E]">78.4%</strong>{' '}
                <span className="text-slate-400">/ 분기 목표 82.0%</span>
              </div>
            </div>

            <div className="mt-3 h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-[#1A3D9E]" style={{ width: '74%' }} />
              <div className="h-full bg-emerald-600" style={{ width: '4.4%' }} />
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-slate-500">기집행</div>
              <div className="font-semibold text-slate-800 tabular-nums mt-0.5">₩39,200,000</div>
            </div>
            <div>
              <div className="text-slate-500">품의 결재중</div>
              <div className="font-semibold text-slate-800 tabular-nums mt-0.5">₩1,800,000</div>
            </div>
            <div className="text-right">
              <div className="text-slate-500">잔여 예산</div>
              <div className="font-bold text-slate-900 tabular-nums mt-0.5">₩10,800,000</div>
            </div>
          </div>
        </section>
      </div>

      {/* Filter & Controls Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(['전체', '법인카드', '개인경비', '세금계산서', '예산조회'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setFilterTab(tab);
                setOnlyPending(false);
              }}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                filterTab === tab && !onlyPending
                  ? 'bg-[#1A3D9E] text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab}</span>
              {tab === '법인카드' && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[11px] tabular-nums ${
                    filterTab === tab && !onlyPending
                      ? 'bg-white/20 text-white'
                      : 'bg-[#E8EEF9] text-[#1A3D9E]'
                  }`}
                >
                  {corpCount + 9}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            aria-label="조회 월 선택"
            className="h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white tabular-nums"
          >
            <option value="2025.06">2025.06</option>
            <option value="2025.05">2025.05</option>
          </select>

          <button
            type="button"
            onClick={() => setOnlyPending((p) => !p)}
            className={`h-9 px-3 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
              onlyPending
                ? 'border-[#1A3D9E] bg-[#E8EEF9] text-[#1A3D9E]'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{onlyPending ? '미정산만 보기' : '필터'}</span>
          </button>
        </div>
      </div>

      {/* Transaction List Header */}
      {filterTab === '예산조회' ? (
        <section className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4">
          <h3 className="text-base font-bold text-slate-900">부서별 2025 Q2 예산 배정 및 집행 현황</h3>
          <div className="divide-y divide-slate-100 text-sm">
            {[
              { dept: '기획전략본부 공통', budget: 25000000, used: 19400000 },
              { dept: '디지털마케팅 경비', budget: 15000000, used: 12800000 },
              { dept: 'IT 인프라 및 클라우드', budget: 10000000, used: 7000000 },
            ].map((row) => {
              const pct = Math.round((row.used / row.budget) * 100);
              return (
                <div key={row.dept} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{row.dept}</span>
                    <span className="text-xs tabular-nums text-slate-600">
                      <strong className="text-[#1A3D9E]">{formatKRW(row.used)}</strong> /{' '}
                      {formatKRW(row.budget)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1A3D9E] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 tabular-nums">
              최근 거래 내역 (총 {filteredExpenses.length}건)
            </span>
            <button
              type="button"
              onClick={onBatchSubmitExpenses}
              disabled={unsettledItems.length === 0}
              className="text-xs font-semibold text-[#1A3D9E] hover:underline disabled:text-slate-400 inline-flex items-center gap-1"
            >
              <span>일괄 결재상신</span>
              <CheckCheck className="w-3.5 h-3.5" />
            </button>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-800">해당 조건의 거래 내역이 없습니다</div>
              <p className="text-xs text-slate-500 mt-1">
                필터를 초기화하거나 영수증 OCR 촬영으로 신규 전표를 생성하세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              {filteredExpenses.map((tx) => (
                <article
                  key={tx.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          tx.status === '정산 대기'
                            ? 'bg-amber-50'
                            : tx.status === '전표 승인완료'
                            ? 'bg-emerald-50'
                            : tx.status === '보완 요청'
                            ? 'bg-red-50'
                            : 'bg-[#E8EEF9]'
                        }`}
                      >
                        {renderIcon(tx.iconType)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <h4 className="text-sm font-bold text-slate-900">{tx.merchant}</h4>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                              tx.status === '정산 대기'
                                ? 'bg-amber-50 text-amber-800'
                                : tx.status === '전표 승인완료'
                                ? 'bg-emerald-50 text-emerald-700'
                                : tx.status === '보완 요청'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-[#E8EEF9] text-[#1A3D9E]'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{tx.description}</p>
                        <div className="text-[11px] text-slate-400 mt-1.5 tabular-nums">
                          {tx.dateTime} · {tx.paymentMethod}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-bold text-slate-900 tabular-nums">
                        {formatKRW(tx.amount)}
                      </div>
                      {tx.status === '정산 대기' && tx.receiptCode ? (
                        <button
                          type="button"
                          onClick={() => setPreviewReceipt(tx)}
                          className="mt-1.5 px-2.5 py-1 rounded-lg bg-[#E8EEF9] text-[#1A3D9E] text-[11px] font-semibold hover:bg-[#dce5f7]"
                        >
                          영수증 미리보기
                        </button>
                      ) : tx.supplyAmount && tx.status === '전표 승인완료' ? (
                        <div className="text-[11px] text-slate-400 tabular-nums mt-0.5">
                          공급가액 {formatKRW(tx.supplyAmount)}
                        </div>
                      ) : tx.status === '입금 처리중' ? (
                        <div className="text-[11px] font-semibold text-[#1A3D9E] mt-0.5">
                          익월 10일 정산예정
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div
                      className={`flex items-center gap-1.5 min-w-0 ${
                        tx.status === '정산 대기'
                          ? 'text-amber-800'
                          : tx.status === '전표 승인완료'
                          ? 'text-emerald-700'
                          : tx.status === '보완 요청'
                          ? 'text-red-700'
                          : 'text-[#1A3D9E]'
                      }`}
                    >
                      {tx.status === '전표 승인완료' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      ) : tx.status === '입금 처리중' ? (
                        <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span className="truncate">{tx.note}</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {(tx.status === '정산 대기' || tx.status === '보완 요청') && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditTarget(tx);
                              setEditDesc(tx.description);
                              setEditAmount(String(tx.amount));
                            }}
                            className="text-slate-500 hover:text-slate-900 font-medium"
                          >
                            항목 수정
                          </button>
                          <button
                            type="button"
                            onClick={() => onCompleteExpenseSlip(tx.id)}
                            className="text-[#1A3D9E] font-bold hover:underline"
                          >
                            전표 작성 완료
                          </button>
                        </>
                      )}
                      {tx.status === '전표 승인완료' && (
                        <button
                          type="button"
                          onClick={() => setPrintTarget(tx)}
                          className="text-slate-600 hover:text-[#1A3D9E] font-semibold inline-flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>전표인쇄</span>
                        </button>
                      )}
                      {tx.status === '입금 처리중' && tx.slipNo && (
                        <span className="text-slate-400 tabular-nums">지출품의 {tx.slipNo}</span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Corporate Expense Compliance Guidelines */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-5">
        <div className="flex items-center gap-2 mb-2.5">
          <AlertCircle className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-900">법인카드 지출 및 경비 정산 내규 안내</h3>
        </div>
        <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
          <li>
            심야 교통비(23:00 이후) 및 접대비(건당 ₩30,000 초과)는 결재 시 참석자 명단 첨부가 필수입니다.
          </li>
          <li>
            모바일 간편 영수증 OCR 촬영 등록 시 공급가액과 부가세가 자동 분리 기표됩니다.
          </li>
          <li>
            정산 반려 시 귀책 사유 보완 후 영업일 기준 2일 이내 재상신하셔야 당월 급여에 반영됩니다.
          </li>
        </ul>
      </section>

      {/* Receipt Preview Modal */}
      {previewReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">전자 영수증 미리보기</h3>
              <button
                type="button"
                onClick={() => setPreviewReceipt(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 space-y-2 text-xs font-mono-num">
              <div className="text-center font-bold text-sm text-slate-900 pb-2 border-b border-dashed border-slate-300">
                {previewReceipt.merchant}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">승인일시</span>
                <span>{previewReceipt.dateTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">결제수단</span>
                <span>{previewReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">공급가액</span>
                <span>{formatKRW(previewReceipt.supplyAmount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">부가세(10%)</span>
                <span>{formatKRW(previewReceipt.vatAmount || 0)}</span>
              </div>
              <div className="pt-2 border-t border-dashed border-slate-300 flex justify-between font-bold text-sm text-slate-900">
                <span>합계금액</span>
                <span>{formatKRW(previewReceipt.amount)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPreviewReceipt(null)}
              className="w-full h-10 rounded-xl bg-slate-900 text-white text-xs font-semibold"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">전표 항목 수정</h3>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">사용 내역</label>
              <input
                type="text"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">금액 (원)</label>
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm tabular-nums"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="h-10 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                취소
              </button>
              <button
                type="submit"
                className="h-10 rounded-xl bg-[#1A3D9E] text-white text-xs font-semibold"
              >
                저장
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Print Slip Modal */}
      {printTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">회계 전표 출력</h3>
              <button
                type="button"
                onClick={() => setPrintTarget(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-xs space-y-2 border border-slate-200">
              <div className="font-bold text-sm text-slate-900">{printTarget.merchant}</div>
              <div>{printTarget.description}</div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                <span>전표 합계</span>
                <span className="tabular-nums">{formatKRW(printTarget.amount)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                window.print();
                setPrintTarget(null);
              }}
              className="w-full h-10 rounded-xl bg-[#1A3D9E] text-white text-xs font-semibold"
            >
              인쇄 대화상자 열기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
