import React, { useState } from 'react';
import {
  Clock,
  Plane,
  ChevronRight,
  FileDown,
  Users,
  LogOut,
  Footprints,
  CheckCircle2,
  X,
  Building2,
  Mail,
  Phone,
  MapPin,
  Search,
} from 'lucide-react';
import {
  AttendanceState,
  PayslipRecord,
  TeamMemberAttendance,
  UserProfile,
} from '../types/erp';
import { formatKRW, formatTimeMinutes } from '../utils/format';

interface HrAttendanceViewProps {
  user: UserProfile;
  attendance: AttendanceState;
  teamMembers: TeamMemberAttendance[];
  payslips: PayslipRecord[];
  onToggleOuting: () => void;
  onClockOut: () => void;
  onOpenLeaveView: () => void;
}

export const HrAttendanceView: React.FC<HrAttendanceViewProps> = ({
  user,
  attendance,
  teamMembers,
  payslips,
  onToggleOuting,
  onClockOut,
  onOpenLeaveView,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'payslip' | 'org' | 'info'>(
    'attendance'
  );
  const [selectedPayslipMonth, setSelectedPayslipMonth] = useState(payslips[0]?.month || '');
  const [showPayslipModal, setShowPayslipModal] = useState<PayslipRecord | null>(null);
  const [teamFilter, setTeamFilter] = useState<'전체' | '정상근무' | '연차휴가' | '외근중'>('전체');
  const [orgSearch, setOrgSearch] = useState('');

  const progressPct = Math.min(
    100,
    Math.round((attendance.workedMinutes / attendance.targetMinutes) * 100)
  );

  const normalCount = teamMembers.filter((m) => m.status === '정상근무').length;
  const leaveCount = teamMembers.filter((m) => m.status === '연차휴가').length;
  const fieldCount = teamMembers.filter((m) => m.status === '외근중').length;

  const filteredTeam =
    teamFilter === '전체'
      ? teamMembers.slice(0, 4)
      : teamMembers.filter((m) => m.status === teamFilter);

  const currentPayslip =
    payslips.find((p) => p.month === selectedPayslipMonth) || payslips[0];

  const statusBadge =
    attendance.status === 'working'
      ? { label: '정상 출근 완료', cls: 'bg-emerald-50 text-emerald-800', dot: 'bg-emerald-600' }
      : attendance.status === 'outing'
      ? { label: '외출 중', cls: 'bg-amber-50 text-amber-800', dot: 'bg-amber-600' }
      : { label: '퇴근 완료', cls: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500' };

  return (
    <div className="space-y-5">
      {/* Sub-navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/90 px-4 flex items-center gap-6 overflow-x-auto no-scrollbar">
        {[
          { id: 'attendance', label: '근태현황' },
          { id: 'payslip', label: '급여명세서' },
          { id: 'org', label: '조직도' },
          { id: 'info', label: '인사정보' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
            className={`py-3.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeSubTab === tab.id
                ? 'border-[#1A3D9E] text-[#1A3D9E]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column: Today Punch + Cumulative + Leave */}
          <div className="lg:col-span-6 space-y-4">
            {/* Today's Attendance Status Card */}
            <section className="bg-white rounded-2xl border border-slate-200/90 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md ${statusBadge.cls}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                    {statusBadge.label}
                  </span>
                  <div className="text-xs text-slate-500 mt-2">2025년 6월 18일 수요일</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
                    09:41 <span className="text-xs font-semibold text-slate-500">AM</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                    출근 기록:{' '}
                    <strong className="text-[#1A3D9E] font-semibold">{attendance.clockInTime}</strong>
                    {attendance.clockOutTime && ` · 퇴근 ${attendance.clockOutTime}`}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-600 font-medium">오늘 근무 진행률</span>
                  <span className="tabular-nums text-slate-700">
                    <strong className="text-[#1A3D9E] font-bold">
                      {formatTimeMinutes(attendance.workedMinutes)}
                    </strong>{' '}
                    / 8시간 ({progressPct}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1A3D9E] rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={attendance.status === 'clocked_out'}
                  onClick={onToggleOuting}
                  className="min-h-[44px] rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-800 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Footprints className="w-4 h-4" />
                  <span>{attendance.status === 'outing' ? '복귀하기' : '외출/복귀'}</span>
                </button>
                <button
                  type="button"
                  disabled={attendance.status === 'clocked_out'}
                  onClick={onClockOut}
                  className="min-h-[44px] rounded-xl bg-[#1A3D9E] hover:bg-[#143080] disabled:bg-slate-300 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{attendance.status === 'clocked_out' ? '퇴근 완료됨' : '퇴근하기'}</span>
                </button>
              </div>
            </section>

            {/* Monthly Cumulative & Leave Summary Cards */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>이번달 누적 근무</span>
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <div className="mt-2.5 text-2xl font-bold text-slate-900 tabular-nums">
                  {attendance.monthlyCumulativeHours}
                  <span className="text-sm font-medium text-slate-500">h</span>{' '}
                  {attendance.monthlyCumulativeMinutes}
                  <span className="text-sm font-medium text-slate-500">m</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 tabular-nums">
                    목표 {attendance.monthlyTargetHours}h
                  </span>
                  <span className="font-semibold text-emerald-700 tabular-nums">
                    연장 +{attendance.overtimeHours}h
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 p-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>연차 사용 현황</span>
                  <Plane className="w-4 h-4 text-slate-400" />
                </div>
                <div className="mt-2.5 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#1A3D9E] tabular-nums">
                    {user.remainingLeave}
                  </span>
                  <span className="text-xs text-slate-600">일 잔여</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 tabular-nums">사용 {user.usedLeave}일</span>
                  <button
                    type="button"
                    onClick={onOpenLeaveView}
                    className="font-semibold text-[#1A3D9E] hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>상세보기</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Latest Payslip Preview Card */}
            {currentPayslip && (
              <section className="bg-white rounded-2xl border border-slate-200/90 p-5">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div>
                    <span className="text-xs font-semibold text-[#1A3D9E] bg-[#E8EEF9] px-2 py-0.5 rounded-md">
                      최신 급여
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5">
                      {currentPayslip.month} 급여 상세
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPayslipModal(currentPayslip)}
                    className="min-h-[36px] px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5"
                  >
                    <FileDown className="w-3.5 h-3.5 text-[#1A3D9E]" />
                    <span>PDF 다운로드</span>
                  </button>
                </div>

                <div className="bg-[#F4F6FB] rounded-xl p-4 flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-600">실지급액</span>
                  <span className="text-2xl font-bold text-[#1A3D9E] tabular-nums">
                    {formatKRW(currentPayslip.netPay)}
                  </span>
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">기본급</span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {formatKRW(currentPayslip.basePay)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">식대 및 복지포인트</span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {formatKRW(currentPayslip.mealAndWelfare)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">상여금 (정기성과)</span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {formatKRW(currentPayslip.bonus)}
                    </span>
                  </div>
                  <div className="pt-2.5 border-t border-dashed border-slate-200 flex items-center justify-between">
                    <span className="text-red-700 font-medium text-xs sm:text-sm">
                      공제합계 <span className="text-slate-500 font-normal">(국민연금, 건강보험, 소득세 등)</span>
                    </span>
                    <span className="font-bold text-red-700 tabular-nums">
                      -{formatKRW(currentPayslip.deductions)}
                    </span>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Team Attendance Live Monitoring */}
          <div className="lg:col-span-6 space-y-4">
            <section className="bg-white rounded-2xl border border-slate-200/90 p-5">
              <div className="flex items-start justify-between gap-2 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">팀원 근태 현황</h3>
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md tabular-nums">
                      {user.department} · {teamMembers.length}명
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">실시간 출결 모니터링</p>
                </div>
                <Users className="w-5 h-5 text-slate-400" />
              </div>

              {/* Filterable Team Status Summary */}
              <div className="grid grid-cols-3 gap-2 bg-[#F4F6FB] p-1.5 rounded-xl mb-4">
                <button
                  type="button"
                  onClick={() => setTeamFilter(teamFilter === '정상근무' ? '전체' : '정상근무')}
                  className={`py-2 rounded-lg text-center transition-colors ${
                    teamFilter === '정상근무' ? 'bg-white shadow-xs' : 'hover:bg-white/60'
                  }`}
                >
                  <div className="text-[11px] text-slate-500">정상근무</div>
                  <div className="text-base font-bold text-emerald-700 tabular-nums">{normalCount}명</div>
                </button>
                <button
                  type="button"
                  onClick={() => setTeamFilter(teamFilter === '연차휴가' ? '전체' : '연차휴가')}
                  className={`py-2 rounded-lg text-center transition-colors ${
                    teamFilter === '연차휴가' ? 'bg-white shadow-xs' : 'hover:bg-white/60'
                  }`}
                >
                  <div className="text-[11px] text-slate-500">휴가</div>
                  <div className="text-base font-bold text-[#1A3D9E] tabular-nums">{leaveCount}명</div>
                </button>
                <button
                  type="button"
                  onClick={() => setTeamFilter(teamFilter === '외근중' ? '전체' : '외근중')}
                  className={`py-2 rounded-lg text-center transition-colors ${
                    teamFilter === '외근중' ? 'bg-white shadow-xs' : 'hover:bg-white/60'
                  }`}
                >
                  <div className="text-[11px] text-slate-500">외근/출장</div>
                  <div className="text-base font-bold text-amber-700 tabular-nums">{fieldCount}명</div>
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredTeam.map((member) => (
                  <div key={member.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {member.initial}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900">
                          {member.name}{' '}
                          <span className="text-xs font-normal text-slate-500">{member.role}</span>
                        </div>
                        <div className="text-xs text-slate-500 truncate mt-0.5">{member.detail}</div>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md shrink-0 ${
                        member.status === '정상근무'
                          ? 'bg-emerald-50 text-emerald-700'
                          : member.status === '연차휴가'
                          ? 'bg-[#E8EEF9] text-[#1A3D9E]'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {member.status}
                    </span>
                  </div>
                ))}
              </div>

              {teamFilter !== '전체' && (
                <button
                  type="button"
                  onClick={() => setTeamFilter('전체')}
                  className="mt-3 w-full py-2 text-xs font-semibold text-[#1A3D9E] hover:underline"
                >
                  전체 팀원 보기
                </button>
              )}
            </section>

            {/* Attendance Timeline Logs */}
            <section className="bg-white rounded-2xl border border-slate-200/90 p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3">금일 출결 타임라인</h3>
              <div className="space-y-2.5">
                {attendance.logs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-xs">
                    <span className="font-mono-num font-semibold text-[#1A3D9E] shrink-0">
                      {log.time}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-900">{log.action}</span>
                      <span className="text-slate-500 ml-2">{log.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {activeSubTab === 'payslip' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">월별 급여 명세서 조회</h3>
              <p className="text-xs text-slate-500 mt-0.5">지급 내역 및 공제 상세 확인</p>
            </div>
            <div className="flex items-center gap-2">
              {payslips.map((p) => (
                <button
                  key={p.month}
                  type="button"
                  onClick={() => setSelectedPayslipMonth(p.month)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    selectedPayslipMonth === p.month
                      ? 'bg-[#1A3D9E] text-white'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p.month}
                </button>
              ))}
            </div>
          </div>

          {currentPayslip && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#F4F6FB] rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="text-xs text-slate-500">지급일: {currentPayslip.payDate}</div>
                  <div className="text-sm font-semibold text-slate-700 mt-1">
                    {currentPayslip.month} 실지급액
                  </div>
                  <div className="text-3xl font-bold text-[#1A3D9E] tabular-nums mt-2">
                    {formatKRW(currentPayslip.netPay)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPayslipModal(currentPayslip)}
                  className="mt-4 h-10 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 inline-flex items-center justify-center gap-1.5 hover:bg-slate-50"
                >
                  <FileDown className="w-4 h-4 text-[#1A3D9E]" />
                  <span>명세서 미리보기 및 PDF 저장</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl p-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">기본급</span>
                  <span className="font-semibold tabular-nums">{formatKRW(currentPayslip.basePay)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">식대 및 복지포인트</span>
                  <span className="font-semibold tabular-nums">
                    {formatKRW(currentPayslip.mealAndWelfare)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">상여금</span>
                  <span className="font-semibold tabular-nums">{formatKRW(currentPayslip.bonus)}</span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between text-red-700">
                  <span>공제합계</span>
                  <span className="font-bold tabular-nums">-{formatKRW(currentPayslip.deductions)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'org' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {user.division} · {user.department} 조직도
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">소속 임직원 실시간 연락망 및 근무상태</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
                placeholder="이름 또는 직책 검색..."
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1A3D9E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {teamMembers
              .filter(
                (m) =>
                  m.name.includes(orgSearch.trim()) ||
                  m.role.includes(orgSearch.trim()) ||
                  m.detail.includes(orgSearch.trim())
              )
              .map((m) => (
                <div key={m.id} className="border border-slate-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-full bg-[#E8EEF9] text-[#1A3D9E] font-bold text-xs flex items-center justify-center">
                      {m.initial}
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        m.status === '정상근무'
                          ? 'bg-emerald-50 text-emerald-700'
                          : m.status === '연차휴가'
                          ? 'bg-[#E8EEF9] text-[#1A3D9E]'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {m.name} <span className="text-xs font-normal text-slate-500">{m.role}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{m.detail}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {activeSubTab === 'info' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4">
          <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-full bg-[#1A3D9E] text-white font-bold text-lg flex items-center justify-center">
              {user.name.slice(0, 1)}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {user.name} {user.rank}
              </h3>
              <p className="text-xs text-slate-500">
                {user.division} · {user.department} · 입사일 {user.joinDate}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 rounded-xl p-3.5 flex items-center gap-3">
              <Building2 className="w-4 h-4 text-[#1A3D9E]" />
              <div>
                <div className="text-xs text-slate-500">사번</div>
                <div className="font-semibold tabular-nums">{user.employeeId}</div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3.5 flex items-center gap-3">
              <Mail className="w-4 h-4 text-[#1A3D9E]" />
              <div>
                <div className="text-xs text-slate-500">사내 이메일</div>
                <div className="font-semibold">{user.email}</div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3.5 flex items-center gap-3">
              <Phone className="w-4 h-4 text-[#1A3D9E]" />
              <div>
                <div className="text-xs text-slate-500">연락처</div>
                <div className="font-semibold tabular-nums">{user.phone}</div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3.5 flex items-center gap-3">
              <MapPin className="w-4 h-4 text-[#1A3D9E]" />
              <div>
                <div className="text-xs text-slate-500">근무지</div>
                <div className="font-semibold">{user.officeLocation}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payslip PDF Preview Modal */}
      {showPayslipModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {showPayslipModal.month} 급여명세서
              </h3>
              <button
                type="button"
                onClick={() => setShowPayslipModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>성명 / 사번</span>
                <span className="font-semibold text-slate-900">
                  {user.name} {user.rank} ({user.employeeId})
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>지급일자</span>
                <span className="tabular-nums text-slate-900">{showPayslipModal.payDate}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-sm text-[#1A3D9E]">
                <span>실수령액</span>
                <span className="tabular-nums">{formatKRW(showPayslipModal.netPay)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>전자서명 및 회사 직인이 포함된 PDF 저장 준비가 완료되었습니다.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                window.print();
                setShowPayslipModal(null);
              }}
              className="w-full h-11 rounded-xl bg-[#1A3D9E] text-white text-xs font-semibold"
            >
              인쇄 / PDF 저장 실행
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
