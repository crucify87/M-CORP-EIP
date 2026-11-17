import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Info,
  ShieldCheck,
  Umbrella,
  Sun,
  History,
  X,
} from 'lucide-react';
import { LeaveHistoryItem, TeamMemberAttendance, UserProfile } from '../types/erp';

interface LeaveManagementViewProps {
  user: UserProfile;
  leaveHistory: LeaveHistoryItem[];
  teamMembers: TeamMemberAttendance[];
  onBackToHr: () => void;
  onSubmitLeave: (payload: {
    typeLabel: string;
    days: number;
    dateRange: string;
    reason: string;
    substitute: string;
  }) => void;
}

const JUNE_2025_CELLS = [
  // Week 1: Sun Jun 1 .. Sat Jun 7
  { day: 1, label: '1', status: 'weekend' },
  { day: 2, label: '2', status: 'normal' },
  { day: 3, label: '3', status: 'normal' },
  { day: 4, label: '4', status: 'normal' },
  { day: 5, label: '5', status: 'normal' },
  { day: 6, label: '6', status: 'holiday', tag: '현충일' },
  { day: 7, label: '7', status: 'weekend' },
  // Week 2: Jun 8 .. 14
  { day: 8, label: '8', status: 'weekend' },
  { day: 9, label: '9', status: 'normal' },
  { day: 10, label: '10', status: 'leave', tag: '연차' },
  { day: 11, label: '11', status: 'normal' },
  { day: 12, label: '12', status: 'normal' },
  { day: 13, label: '13', status: 'half', tag: '반차' },
  { day: 14, label: '14', status: 'weekend' },
  // Week 3: Jun 15 .. 21
  { day: 15, label: '15', status: 'weekend' },
  { day: 16, label: '16', status: 'normal' },
  { day: 17, label: '17', status: 'normal' },
  { day: 18, label: '18', status: 'normal' },
  { day: 19, label: '19', status: 'normal' },
  { day: 20, label: '20', status: 'leave', tag: '연차' },
  { day: 21, label: '21', status: 'leave_soft', tag: '연차' },
  // Week 4: Jun 22 .. 28
  { day: 22, label: '22', status: 'weekend' },
  { day: 23, label: '23', status: 'normal' },
  { day: 24, label: '24', status: 'selectable' },
  { day: 25, label: '25', status: 'selectable' },
  { day: 26, label: '26', status: 'normal' },
  { day: 27, label: '27', status: 'normal' },
  { day: 28, label: '28', status: 'weekend' },
  // Week 5: Jun 29 .. Jul 5
  { day: 29, label: '29', status: 'weekend' },
  { day: 30, label: '30', status: 'normal' },
  { day: 31, label: '7/1', status: 'other' },
  { day: 32, label: '2', status: 'other' },
  { day: 33, label: '3', status: 'other' },
  { day: 34, label: '4', status: 'other' },
  { day: 35, label: '5', status: 'other' },
];

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const LeaveManagementView: React.FC<LeaveManagementViewProps> = ({
  user,
  leaveHistory,
  teamMembers,
  onBackToHr,
  onSubmitLeave,
}) => {
  const [selectedDays, setSelectedDays] = useState<number[]>([24, 25]);
  const [leaveType, setLeaveType] = useState<'full' | 'am' | 'pm' | 'monthly' | 'special'>('full');
  const [reason, setReason] = useState('개인 사정 및 리프레시');
  const [substitute, setSubstitute] = useState('이지은 선임매니저 (기획전략팀)');
  const [showSubModal, setShowSubModal] = useState(false);

  const sortedDays = [...selectedDays].sort((a, b) => a - b);
  const startDay = sortedDays[0] || 24;
  const endDay = sortedDays[sortedDays.length - 1] || startDay;

  const dayCount =
    leaveType === 'am' || leaveType === 'pm'
      ? 0.5
      : Math.max(1, sortedDays.length);

  const typeLabel =
    leaveType === 'full'
      ? '전일 연차'
      : leaveType === 'am'
      ? '오전 반차(0.5)'
      : leaveType === 'pm'
      ? '오후 반차(0.5)'
      : leaveType === 'monthly'
      ? '당월 월차 (1일)'
      : '경조·특별휴가';

  const getWeekdayLabel = (d: number) => {
    // June 1, 2025 is Sunday (index 0)
    return WEEKDAYS[(d - 1) % 7];
  };

  const formattedRange =
    sortedDays.length <= 1 || leaveType === 'am' || leaveType === 'pm'
      ? `2025.06.${String(startDay).padStart(2, '0')} (${getWeekdayLabel(startDay)})`
      : `2025.06.${String(startDay).padStart(2, '0')} (${getWeekdayLabel(startDay)}) ~ 06.${String(
          endDay
        ).padStart(2, '0')} (${getWeekdayLabel(endDay)})`;

  const remainingAfter = Math.max(0, Number((user.remainingLeave - dayCount).toFixed(1)));
  const usedPct = Math.round((user.usedLeave / user.totalLeave) * 1000) / 10;

  const toggleDay = (day: number, status: string) => {
    if (status === 'other' || status === 'holiday') return;
    if (leaveType === 'am' || leaveType === 'pm') {
      setSelectedDays([day]);
      return;
    }
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== day);
      }
      return [...prev, day];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitLeave({
      typeLabel,
      days: dayCount,
      dateRange: formattedRange,
      reason,
      substitute,
    });
  };

  return (
    <div className="space-y-5">
      {/* Sub-header with Back Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToHr}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-[#1A3D9E] transition-colors min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>인사·근태로 돌아가기</span>
        </button>
        <span className="text-xs font-medium text-slate-500">근태·휴가 관리</span>
      </div>

      {/* Top Profile & Balance Overview */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E8EEF9] text-[#1A3D9E] font-bold text-sm flex items-center justify-center">
              {user.name.slice(0, 1)}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900">
                {user.name} {user.rank}
              </span>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {user.department}
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1A3D9E] bg-[#E8EEF9] px-2.5 py-1 rounded-md">
            <ShieldCheck className="w-3.5 h-3.5" />
            연차 회계기준
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-[#F4F6FB] rounded-xl p-3.5 border border-slate-200/60">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>잔여 연차</span>
              <Calendar className="w-4 h-4 text-[#1A3D9E]" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#1A3D9E] tabular-nums">
                {user.remainingLeave}
              </span>
              <span className="text-xs text-slate-500 tabular-nums">/ {user.totalLeave}일</span>
            </div>
          </div>

          <div className="bg-[#F4F6FB] rounded-xl p-3.5 border border-slate-200/60">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>당월 가용 월차</span>
              <Clock className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {user.monthlyAvailableLeave}
              </span>
              <span className="text-xs text-slate-500">일 유효</span>
            </div>
          </div>

          <div className="bg-[#F4F6FB] rounded-xl p-3.5 border border-slate-200/60">
            <div className="text-xs text-slate-500">사용 완료 연차</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-900 tabular-nums">
                {user.usedLeave}
              </span>
              <span className="text-xs text-slate-500 tabular-nums">일 ({usedPct}%)</span>
            </div>
          </div>

          <div className="bg-[#F4F6FB] rounded-xl p-3.5 border border-slate-200/60">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>결재 진행 중</span>
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                검토중
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-xl font-bold text-[#1A3D9E] tabular-nums">
                {leaveHistory.filter((l) => l.status === '결재 진행중').length || 1}건
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500">2025 누적 소진율</span>
            <span className="font-semibold text-[#1A3D9E] tabular-nums">{usedPct}% 소진</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
            <div className="h-full bg-[#1A3D9E]" style={{ width: `${usedPct}%` }} />
            <div className="h-full bg-emerald-600" style={{ width: '6.7%' }} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 tabular-nums">
            <span>사용 {user.usedLeave}일</span>
            <span>신청중 1.0일</span>
            <span>잔여 {(user.remainingLeave - 1).toFixed(1)}일 (실가용)</span>
          </div>
        </div>
      </section>

      {/* Main Split: Calendar + Leave Application Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Calendar Card */}
        <section className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/90 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="이전 달"
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-base font-bold text-slate-900 tabular-nums">2025년 6월</h3>
              <button
                type="button"
                aria-label="다음 달"
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDays([24, 25])}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-[#1A3D9E] hover:bg-slate-50"
            >
              오늘
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold mb-2">
            {WEEKDAYS.map((w, idx) => (
              <div
                key={w}
                className={`py-1 ${
                  idx === 0 ? 'text-red-600' : idx === 6 ? 'text-[#1A3D9E]' : 'text-slate-500'
                }`}
              >
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {JUNE_2025_CELLS.map((cell) => {
              const isSelected = cell.status !== 'other' && selectedDays.includes(cell.day);
              const isHoliday = cell.status === 'holiday';
              const isLeave = cell.status === 'leave';
              const isHalf = cell.status === 'half';
              const isLeaveSoft = cell.status === 'leave_soft';
              const isWeekend = cell.status === 'weekend';
              const isOther = cell.status === 'other';

              return (
                <button
                  key={`${cell.day}-${cell.label}`}
                  type="button"
                  disabled={isOther || isHoliday}
                  onClick={() => toggleDay(cell.day, cell.status)}
                  className={`min-h-[50px] rounded-xl flex flex-col items-center justify-center text-xs transition-all tabular-nums ${
                    isSelected
                      ? 'bg-[#1A3D9E] text-white font-bold shadow-xs'
                      : isHoliday
                      ? 'bg-red-50 text-red-700 font-semibold'
                      : isLeave
                      ? 'border border-[#1A3D9E]/40 bg-white text-[#1A3D9E] font-semibold'
                      : isHalf
                      ? 'border border-sky-400 bg-sky-50 text-sky-800 font-semibold'
                      : isLeaveSoft
                      ? 'bg-[#E8EEF9] text-[#1A3D9E] font-semibold'
                      : isOther
                      ? 'text-slate-300 cursor-default'
                      : isWeekend
                      ? cell.day % 7 === 1
                        ? 'text-red-500 hover:bg-slate-50'
                        : 'text-[#1A3D9E] hover:bg-slate-50'
                      : 'text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <span>{cell.label}</span>
                  {isSelected ? (
                    <span className="text-[10px] font-medium mt-0.5">선택</span>
                  ) : cell.tag ? (
                    <span className="text-[10px] mt-0.5">{cell.tag}</span>
                  ) : cell.status === 'normal' ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 mt-1" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-700" /> 정상근무
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-xs bg-[#1A3D9E]" /> 연차/월차
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-xs bg-sky-500" /> 반차/외출
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600" /> 공휴일
            </span>
          </div>
        </section>

        {/* Right Column: Leave Application Form + History */}
        <div className="lg:col-span-6 space-y-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">캘린더 날짜 선택 휴가 신청</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  달력에서 날짜를 터치하여 기간을 지정하세요
                </p>
              </div>
              <span className="text-xs font-semibold text-[#1A3D9E] bg-[#E8EEF9] px-2 py-0.5 rounded-md">
                작성 중
              </span>
            </div>

            <div className="bg-[#F4F6FB] rounded-xl p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#1A3D9E] text-white flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">선택된 신청 기간</div>
                  <div className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">
                    {formattedRange}
                  </div>
                </div>
              </div>
              <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-[#1A3D9E] tabular-nums shrink-0">
                총 {dayCount}일간
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                휴가 종류 선택 <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'full', label: '전일 연차' },
                  { id: 'am', label: '오전 반차(0.5)' },
                  { id: 'pm', label: '오후 반차(0.5)' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setLeaveType(opt.id as typeof leaveType)}
                    className={`min-h-[40px] rounded-xl border text-xs font-semibold transition-colors ${
                      leaveType === opt.id
                        ? 'border-[#1A3D9E] bg-[#E8EEF9]/50 text-[#1A3D9E]'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setLeaveType('monthly')}
                  className={`min-h-[40px] rounded-xl border text-xs font-semibold transition-colors ${
                    leaveType === 'monthly'
                      ? 'border-[#1A3D9E] bg-[#E8EEF9]/50 text-[#1A3D9E]'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  당월 월차 (1일)
                </button>
                <button
                  type="button"
                  onClick={() => setLeaveType('special')}
                  className={`min-h-[40px] rounded-xl border text-xs font-semibold transition-colors ${
                    leaveType === 'special'
                      ? 'border-[#1A3D9E] bg-[#E8EEF9]/50 text-[#1A3D9E]'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  경조·특별휴가
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                신청 사유 <span className="text-red-600">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-[#1A3D9E]"
              >
                <option value="개인 사정 및 리프레시">개인 사정 및 리프레시</option>
                <option value="정기 하계휴가">정기 하계휴가</option>
                <option value="병원 정기검진">병원 정기검진</option>
                <option value="가족 행사 및 경조사">가족 행사 및 경조사</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                업무 대직자 지정 <span className="text-red-600">*</span>
              </label>
              <div className="border border-slate-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center">
                    {substitute.slice(0, 1)}
                  </div>
                  <span className="text-sm font-medium text-slate-800">{substitute}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSubModal(true)}
                  className="text-xs font-semibold text-[#1A3D9E] hover:underline shrink-0"
                >
                  변경
                </button>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
              <Info className="w-4 h-4 text-[#1A3D9E] shrink-0 mt-0.5" />
              <div>
                잔여 연차 <strong className="text-slate-900 tabular-nums">{user.remainingLeave}일</strong> 중{' '}
                <strong className="text-[#1A3D9E] tabular-nums">{dayCount.toFixed(1)}일 차감</strong>{' '}
                예정입니다.
                <div className="text-slate-500 mt-0.5 tabular-nums">
                  (신청 승인 후 잔여 연차: {remainingAfter}일)
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-[#1A3D9E] hover:bg-[#143080] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>휴가 전자결재 신청서 제출 ({dayCount}일)</span>
            </button>
          </form>

          {/* Leave History */}
          <section className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#1A3D9E]" />
                <h3 className="text-sm font-bold text-slate-900">최근 휴가 신청 및 결재 이력</h3>
              </div>
              <span className="text-xs text-slate-400 tabular-nums">총 {leaveHistory.length}건</span>
            </div>

            <div className="space-y-2.5">
              {leaveHistory.map((item) => (
                <div
                  key={item.id}
                  className="border border-slate-200/80 rounded-xl p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      {item.days >= 1 ? (
                        <Umbrella className="w-4 h-4" />
                      ) : (
                        <Sun className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {item.type} · {item.title}
                      </div>
                      <div className="text-xs text-slate-500 tabular-nums mt-0.5">
                        {item.dateRange}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md shrink-0 ${
                      item.status === '결재 완료'
                        ? 'bg-emerald-50 text-emerald-700'
                        : item.status === '결재 진행중'
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Substitute Selector Modal */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">업무 대직자 선택</h3>
              <button
                type="button"
                onClick={() => setShowSubModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {teamMembers
                .filter((m) => m.name !== user.name)
                .map((m) => {
                  const label = `${m.name} ${m.role} (${m.department})`;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSubstitute(label);
                        setShowSubModal(false);
                      }}
                      className="w-full py-3 px-2 text-left hover:bg-slate-50 flex items-center justify-between text-sm"
                    >
                      <span className="font-medium text-slate-800">{label}</span>
                      <span className="text-xs text-slate-500">{m.status}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
