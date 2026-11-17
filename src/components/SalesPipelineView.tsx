import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  TrendingUp,
  Filter,
  Wallet,
  Flag,
  FileText,
  CheckCircle2,
  Truck,
  UserPlus,
  FilePlus2,
  BarChart3,
  ArrowRight,
  BellRing,
  History,
  X,
} from 'lucide-react';
import { PipelineStage, SalesDeal, SalesRepPerformance } from '../types/erp';
import { formatKRW } from '../utils/format';

interface SalesPipelineViewProps {
  deals: SalesDeal[];
  reps: SalesRepPerformance[];
  onCreateDeal: (deal: Omit<SalesDeal, 'id' | 'history'>) => void;
  onResendQuote: (dealId: string) => void;
  onUrgeApproval: (dealId: string) => void;
  onNavigateAccounting: () => void;
}

export const SalesPipelineView: React.FC<SalesPipelineViewProps> = ({
  deals,
  reps,
  onCreateDeal,
  onResendQuote,
  onUrgeApproval,
  onNavigateAccounting,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | PipelineStage>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'amount'>('latest');
  const [activeModal, setActiveModal] = useState<
    'new_client' | 'new_quote' | 'ar_report' | null
  >(null);
  const [detailDeal, setDetailDeal] = useState<SalesDeal | null>(null);
  const [historyDeal, setHistoryDeal] = useState<SalesDeal | null>(null);

  // New Quote form state
  const [clientName, setClientName] = useState('');
  const [dealTitle, setDealTitle] = useState('');
  const [dealAmount, setDealAmount] = useState('45000000');

  // New Client form state
  const [newClientName, setNewClientName] = useState('');
  const [newClientBizNo, setNewClientBizNo] = useState('');

  const leadCount = 14 + deals.filter((d) => d.stage === 'lead').length - 1;
  const quoteCount = 8 + deals.filter((d) => d.stage === 'quote').length - 1;
  const confirmedCount = 5 + deals.filter((d) => d.stage === 'confirmed').length - 1;
  const shippedCount = 3 + deals.filter((d) => d.stage === 'shipped').length - 1;

  const totalOrderAmount =
    482000000 +
    deals
      .filter((d) => !['deal-01', 'deal-02', 'deal-03', 'deal-04'].includes(d.id))
      .reduce((acc, cur) => acc + cur.amount, 0);

  const filteredDeals = deals
    .filter((d) => {
      if (stageFilter !== 'all' && d.stage !== stageFilter) return false;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        d.clientName.toLowerCase().includes(q) ||
        d.title.toLowerCase().includes(q) ||
        d.docNumber.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => (sortBy === 'amount' ? b.amount - a.amount : 0));

  const handleSubmitQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !dealTitle.trim()) return;
    onCreateDeal({
      clientName: clientName.trim(),
      docNumber: `QT-202506-${Math.floor(200 + Math.random() * 700)}`,
      title: dealTitle.trim(),
      stage: 'quote',
      statusLabel: '견적 제출',
      amount: Math.max(100000, Number(dealAmount) || 0),
      dateInfoLabel: '견적 유효기간',
      dateInfoValue: 'D-14 (2025.07.02)',
      approvalNote: '결재 현황: 영업팀장 검토 중',
      ownerName: '김수현 수석',
      ownerTeam: '기획전략팀',
    });
    setClientName('');
    setDealTitle('');
    setActiveModal(null);
  };

  const handleSubmitClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    onCreateDeal({
      clientName: newClientName.trim(),
      docNumber: `LD-202506-${Math.floor(300 + Math.random() * 600)}`,
      title: `${newClientName.trim()} 신규 거래처 온보딩 제안`,
      stage: 'lead',
      statusLabel: '신규 리드',
      amount: 30000000,
      dateInfoLabel: '등록일',
      dateInfoValue: '2025.06.18',
      ownerName: '최성훈 팀장',
      ownerTeam: '영업1팀',
    });
    setNewClientName('');
    setNewClientBizNo('');
    setActiveModal(null);
  };

  return (
    <div className="space-y-5">
      {/* Header + Search */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">영업 실적 및 수주 파이프라인</h2>
          <p className="text-xs text-slate-500 mt-1">
            2025년 2분기 주요 거래처 파이프라인 집계 현황
          </p>
        </div>
        <button
          type="button"
          onClick={() => setStageFilter('all')}
          className="h-9 px-3 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 hover:bg-slate-50"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{stageFilter === 'all' ? '조건설정' : '전체 보기'}</span>
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="고객사명, 프로젝트명 또는 견적서 번호 검색..."
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-slate-200/90 text-sm focus:outline-none focus:border-[#1A3D9E]"
        />
      </div>

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>2025년 2분기 누적 수주액</span>
            <TrendingUp className="w-4 h-4 text-[#1A3D9E]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {formatKRW(totalOrderAmount)}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md tabular-nums">
              ↑ 104% 달성
            </span>
            <span className="text-slate-500 tabular-nums">목표 ₩4.6억 대비</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>이번 달 파이프라인 규모</span>
            <Filter className="w-4 h-4 text-[#1A3D9E]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">₩185,000,000</div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="font-semibold text-[#1A3D9E] bg-[#E8EEF9] px-2 py-0.5 rounded-md tabular-nums">
              8건 협상 진행 중
            </span>
            <span className="text-slate-500 tabular-nums">수주확률 72%</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>당월 미수금 / 매출채권 잔액</span>
            <Wallet className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">₩45,200,000</div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              정상 회수 진행
            </span>
            <span className="text-slate-500 tabular-nums">연체율 0%</span>
          </div>
        </div>
      </div>

      {/* Pipeline Stage Overview + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">파이프라인 단계별 현황</h3>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md tabular-nums">
                총 {leadCount + quoteCount + confirmedCount + shippedCount}건 진행
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStageFilter('all')}
              className="text-xs font-semibold text-[#1A3D9E] hover:underline inline-flex items-center gap-1"
            >
              <span>전체보기</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'lead', label: '리드 (Lead)', count: leadCount, icon: Flag, bar: 'bg-slate-600' },
              {
                id: 'quote',
                label: '견적제출',
                count: quoteCount,
                icon: FileText,
                bar: 'bg-[#1A3D9E]',
              },
              {
                id: 'confirmed',
                label: '수주확정',
                count: confirmedCount,
                icon: CheckCircle2,
                bar: 'bg-indigo-700',
              },
              {
                id: 'shipped',
                label: '납품/출하',
                count: shippedCount,
                icon: Truck,
                bar: 'bg-emerald-700',
              },
            ].map((stage) => {
              const Icon = stage.icon;
              const isActive = stageFilter === stage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() =>
                    setStageFilter(isActive ? 'all' : (stage.id as PipelineStage))
                  }
                  className={`rounded-xl border p-3 text-left transition-all ${
                    isActive
                      ? 'border-[#1A3D9E] bg-[#F4F7FF]'
                      : 'border-slate-200/80 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-medium truncate">{stage.label}</span>
                    <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                  <div className="mt-2 text-lg font-bold text-slate-900 tabular-nums">
                    {stage.count} <span className="text-xs font-normal text-slate-500">건</span>
                  </div>
                  <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${stage.bar} w-2/3 rounded-full`} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-900 mb-3">자주 쓰는 영업 업무</h3>
          <div className="grid grid-cols-3 gap-2.5 flex-1">
            <button
              type="button"
              onClick={() => setActiveModal('new_client')}
              className="rounded-xl border border-slate-200 hover:bg-slate-50 p-3 flex flex-col items-center justify-center gap-2 text-center transition-colors"
            >
              <UserPlus className="w-5 h-5 text-[#1A3D9E]" />
              <span className="text-xs font-semibold text-slate-800">신규 고객 등록</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('new_quote')}
              className="rounded-xl bg-[#1A3D9E] hover:bg-[#143080] text-white p-3 flex flex-col items-center justify-center gap-2 text-center transition-colors"
            >
              <FilePlus2 className="w-5 h-5" />
              <span className="text-xs font-semibold">견적서 작성</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('ar_report')}
              className="rounded-xl border border-slate-200 hover:bg-slate-50 p-3 flex flex-col items-center justify-center gap-2 text-center transition-colors"
            >
              <BarChart3 className="w-5 h-5 text-emerald-700" />
              <span className="text-xs font-semibold text-slate-800">매출채권 리포트</span>
            </button>
          </div>
        </section>
      </div>

      {/* Deals List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">최근 주요 수주 및 견적 현황</h3>
          <div className="inline-flex bg-slate-200/70 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setSortBy('latest')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                sortBy === 'latest' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              최신순
            </button>
            <button
              type="button"
              onClick={() => setSortBy('amount')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                sortBy === 'amount' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              금액순
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {filteredDeals.map((deal) => (
            <article
              key={deal.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs text-slate-500 font-mono-num">
                    <span className="font-semibold text-slate-700 font-sans">{deal.clientName}</span> ·{' '}
                    {deal.docNumber}
                  </div>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md shrink-0 ${
                      deal.stage === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : deal.stage === 'quote'
                        ? 'bg-amber-50 text-amber-800'
                        : deal.stage === 'shipped'
                        ? 'bg-[#E8EEF9] text-[#1A3D9E]'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {deal.statusLabel}
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900 mt-1.5">{deal.title}</h4>

                <div className="mt-3 bg-[#F4F6FB] rounded-xl p-3.5 grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[11px] text-slate-500">
                      {deal.stage === 'quote'
                        ? '견적금액'
                        : deal.stage === 'shipped'
                        ? '공급 확정가액'
                        : '수주금액'}
                    </div>
                    <div className="text-base font-bold text-slate-900 tabular-nums mt-0.5">
                      {formatKRW(deal.amount)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-slate-500">{deal.dateInfoLabel}</div>
                    <div
                      className={`text-xs font-semibold tabular-nums mt-0.5 ${
                        deal.isUrgentDate ? 'text-red-700' : 'text-slate-800'
                      }`}
                    >
                      {deal.dateInfoValue}
                    </div>
                  </div>
                </div>

                {deal.progressPercent !== undefined && (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{deal.progressText}</span>
                      <span className="font-bold text-[#1A3D9E] tabular-nums">
                        {deal.progressPercent}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1A3D9E] rounded-full"
                        style={{ width: `${deal.progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {deal.approvalNote && (
                  <div className="mt-3 bg-red-50/80 border border-red-200/70 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-red-800">{deal.approvalNote}</span>
                    <span className="text-slate-500">기안자: {deal.ownerName}</span>
                  </div>
                )}

                {deal.erpSynced && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ERP 물류 및 회계 자동 분개 연동됨</span>
                  </div>
                )}
              </div>

              {deal.stage === 'quote' ? (
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onResendQuote(deal.id)}
                      className="h-9 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
                    >
                      견적서 재전송
                    </button>
                    <button
                      type="button"
                      onClick={() => onUrgeApproval(deal.id)}
                      className="h-9 px-3 rounded-xl bg-[#1A3D9E] hover:bg-[#143080] text-white text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>결재 재촉</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHistoryDeal(deal)}
                    className="text-xs font-semibold text-[#1A3D9E] hover:underline inline-flex items-center gap-1"
                  >
                    <span>협상이력</span>
                    <History className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    {deal.ownerName} <span className="text-slate-400">({deal.ownerTeam})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      deal.stage === 'shipped' ? onNavigateAccounting() : setDetailDeal(deal)
                    }
                    className="font-semibold text-[#1A3D9E] hover:underline inline-flex items-center gap-1"
                  >
                    <span>{deal.stage === 'shipped' ? '전표조회' : '상세보기'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* Sales Rep Share */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">본부 영업 인력별 실적 점유율</h3>
          <span className="text-xs text-slate-400">당월 실시간 기준</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reps.map((rep) => (
            <div key={rep.id} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#E8EEF9] text-[#1A3D9E] font-bold text-xs flex items-center justify-center">
                    {rep.initial}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {rep.name} <span className="text-xs font-normal text-slate-500">({rep.team})</span>
                    </div>
                    <div className="text-xs text-slate-500 tabular-nums">수주 {rep.activeDeals}건 진행 중</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900 tabular-nums">
                    {formatKRW(rep.amount)}
                  </div>
                  <div
                    className={`text-xs font-semibold tabular-nums ${
                      rep.achievementRate >= 100 ? 'text-emerald-700' : 'text-[#1A3D9E]'
                    }`}
                  >
                    달성률 {rep.achievementRate}%
                  </div>
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1A3D9E] rounded-full"
                  style={{ width: `${Math.min(100, rep.achievementRate)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modals */}
      {activeModal === 'new_quote' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitQuote}
            className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">신규 견적서 작성</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">고객사명</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="예: (주)현대오토에버"
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">프로젝트 / 품목명</label>
              <input
                type="text"
                value={dealTitle}
                onChange={(e) => setDealTitle(e.target.value)}
                placeholder="예: 스마트팩토리 관제 모듈 200식"
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">견적 금액 (원)</label>
              <input
                type="number"
                value={dealAmount}
                onChange={(e) => setDealAmount(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm tabular-nums"
              />
            </div>
            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-[#1A3D9E] text-white text-sm font-semibold"
            >
              견적서 등록 및 파이프라인 반영
            </button>
          </form>
        </div>
      )}

      {activeModal === 'new_client' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitClient}
            className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">신규 고객사 등록</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">법인 / 상호명</label>
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="예: (주)유진로보틱스"
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">사업자등록번호</label>
              <input
                type="text"
                value={newClientBizNo}
                onChange={(e) => setNewClientBizNo(e.target.value)}
                placeholder="예: 120-81-49201"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-mono-num"
              />
            </div>
            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-[#1A3D9E] text-white text-sm font-semibold"
            >
              고객사 등록 완료
            </button>
          </form>
        </div>
      )}

      {activeModal === 'ar_report' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">당월 매출채권 회수 리포트</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-[#F4F6FB] rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">총 매출채권 잔액</span>
                <span className="font-bold text-slate-900 tabular-nums">₩45,200,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">정상 만기 도래 예정 (30일 이내)</span>
                <span className="font-semibold text-emerald-700 tabular-nums">₩45,200,000 (100%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">장기 연체 채권</span>
                <span className="font-semibold text-slate-900 tabular-nums">₩0</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full h-10 rounded-xl bg-slate-900 text-white text-xs font-semibold"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {(detailDeal || historyDeal) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {historyDeal ? '협상 진행 이력' : '수주 상세 정보'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setDetailDeal(null);
                  setHistoryDeal(null);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {(() => {
              const target = (historyDeal || detailDeal)!;
              return (
                <>
                  <div className="text-sm font-bold text-slate-900">
                    {target.clientName} · {target.title}
                  </div>
                  <div className="space-y-2.5 border-t border-slate-100 pt-3">
                    {target.history.map((h, i) => (
                      <div key={i} className="text-xs flex items-start gap-2.5">
                        <span className="font-mono-num text-[#1A3D9E] font-semibold shrink-0">
                          {h.date}
                        </span>
                        <span className="text-slate-700">{h.note}</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
            <button
              type="button"
              onClick={() => {
                setDetailDeal(null);
                setHistoryDeal(null);
              }}
              className="w-full h-10 rounded-xl bg-slate-900 text-white text-xs font-semibold"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
