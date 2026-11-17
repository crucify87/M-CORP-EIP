import React, { useState } from 'react';
import {
  Building2,
  Shield,
  BadgeCheck,
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  Smartphone,
  ChevronRight,
  Globe,
  Headphones,
  CheckCircle2,
  X,
  Info,
  KeyRound,
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (employeeId: string, rememberMe: boolean) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [employeeId, setEmployeeId] = useState('20240102');
  const [password, setPassword] = useState('Shinhan!2025');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [error, setError] = useState('');
  const [activeAuthModal, setActiveAuthModal] = useState<'sso' | 'bio' | 'otp' | 'reset' | 'help' | null>(null);
  const [otpCode, setOtpCode] = useState('482910');
  const [lang, setLang] = useState<'KO' | 'EN'>('KO');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim()) {
      setError('사번 또는 사내 이메일을 입력해 주세요.');
      return;
    }
    if (password.length < 4) {
      setError('비밀번호를 8자리 이상 입력해 주세요.');
      return;
    }
    setError('');
    onLoginSuccess(employeeId.trim(), rememberMe);
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200/80 px-4 sm:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1A3D9E] text-white flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#1A3D9E] whitespace-nowrap">
            ERP Portal
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
            보안망 정상
          </span>
          <button
            type="button"
            onClick={() => setLang((prev) => (prev === 'KO' ? 'EN' : 'KO'))}
            className="min-h-[40px] min-w-[40px] px-2.5 rounded-lg text-slate-600 hover:bg-slate-100 flex items-center gap-1 text-xs font-medium transition-colors"
            title="언어 전환"
          >
            <Globe className="w-4 h-4" />
            <span>{lang}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[440px]">
          <div className="mb-6">
            <div className="w-11 h-11 rounded-xl bg-[#E8EEF9] text-[#1A3D9E] flex items-center justify-center mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {lang === 'KO' ? '사내 업무 포털 시스템' : 'Enterprise ERP Portal'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {lang === 'KO'
                ? '임직원 사번 또는 사내 계정으로 로그인해 주세요'
                : 'Sign in with your employee ID or corporate account'}
            </p>
          </div>

          {/* Main Login Card */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4"
          >
            <div>
              <label htmlFor="emp-id" className="block text-xs font-semibold text-slate-700 mb-1.5">
                사번 / 사내 이메일
              </label>
              <div className="relative">
                <BadgeCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="emp-id"
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="사번 또는 이메일 (예: 20240102)"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1A3D9E] focus:ring-2 focus:ring-[#1A3D9E]/15 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="emp-pw" className="text-xs font-semibold text-slate-700">
                  비밀번호
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetSent(false);
                    setActiveAuthModal('reset');
                  }}
                  className="text-xs font-medium text-[#1A3D9E] hover:underline"
                >
                  비밀번호 찾기 / 초기화
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="emp-pw"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8자리 이상 영문·숫자·특수문자"
                  className="w-full h-11 pl-10 pr-11 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1A3D9E] focus:ring-2 focus:ring-[#1A3D9E]/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label="비밀번호 표시 전환"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="pt-1 space-y-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer select-none min-h-[36px]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 accent-[#1A3D9E]"
                  />
                  <span className="text-sm font-medium text-slate-700">자동 로그인 유지</span>
                </label>
                <span className="text-xs text-slate-400 tabular-nums">최대 30일</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Fingerprint className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">생체 인증 (Face ID / 지문) 사용</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={biometricEnabled}
                  onClick={() => setBiometricEnabled((b) => !b)}
                  className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                    biometricEnabled ? 'bg-[#1A3D9E] justify-end' : 'bg-slate-200 justify-start'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white shadow-xs block" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-[#1A3D9E] hover:bg-[#143080] active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <Lock className="w-4 h-4" />
              <span>로그인</span>
            </button>
          </form>

          {/* Easy Auth Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs font-medium text-slate-400">사내 간편 인증</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => setActiveAuthModal('sso')}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 flex items-center justify-between transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#E8EEF9] text-[#1A3D9E] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">사내 SSO (통합 계정) 간편 로그인</div>
                  <div className="text-xs text-slate-500">Okta / Azure AD 연동 인트라넷</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setActiveAuthModal('bio')}
                className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex items-center gap-2.5 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate">생체 빠른인증</div>
                  <div className="text-[11px] text-slate-500 truncate">지문 / Face ID</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveAuthModal('otp')}
                className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex items-center gap-2.5 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-[#E8EEF9] text-[#1A3D9E] flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 truncate">모바일 OTP</div>
                  <div className="text-[11px] text-slate-500 truncate">사내 보안인증서</div>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-4 bg-slate-100/90 border border-slate-200/70 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              ※ 사외망 접속 시 보안 정책에 따라 <strong className="font-semibold text-slate-800">2차 모바일 OTP 인증</strong>이 필수 적용됩니다.
            </p>
          </div>

          <div className="mt-5 flex items-center justify-center gap-4 text-xs text-slate-500">
            <button
              type="button"
              onClick={() => setActiveAuthModal('help')}
              className="hover:text-slate-800 transition-colors"
            >
              사원번호 분실 문의
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => setActiveAuthModal('help')}
              className="hover:text-slate-800 flex items-center gap-1 transition-colors"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>IT 헬프데스크 (내선 1588)</span>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/70 text-center space-y-1">
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <Shield className="w-3 h-3" />
                ISMS-P 정보보호 관리체계 인증 획득
              </span>
              <span className="text-slate-300">|</span>
              <span>버전 v4.2.0</span>
            </div>
            <p className="text-[11px] text-slate-400">
              © 2025 ERP Portal. All Rights Reserved. Confidential Enterprise System.
            </p>
          </div>
        </div>
      </main>

      {/* Interactive Auth Modals */}
      {activeAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {activeAuthModal === 'sso' && '사내 SSO 통합 인증'}
                {activeAuthModal === 'bio' && '생체 빠른 인증'}
                {activeAuthModal === 'otp' && '모바일 OTP 2차 인증'}
                {activeAuthModal === 'reset' && '비밀번호 초기화'}
                {activeAuthModal === 'help' && 'IT 헬프데스크 안내'}
              </h2>
              <button
                type="button"
                onClick={() => setActiveAuthModal(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeAuthModal === 'sso' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Okta / Azure AD 사내 인트라넷 계정(<span className="font-semibold text-slate-900">suhyun.kim@shinhanglobal.co.kr</span>)으로 자동 인증합니다.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveAuthModal(null);
                    onLoginSuccess('20240102', true);
                  }}
                  className="w-full h-11 rounded-xl bg-[#1A3D9E] text-white text-sm font-semibold hover:bg-[#143080]"
                >
                  김수현 수석 (20240102) SSO 접속
                </button>
              </div>
            )}

            {activeAuthModal === 'bio' && (
              <div className="space-y-4 text-center py-2">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
                  <Fingerprint className="w-8 h-8" />
                </div>
                <p className="text-sm text-slate-600">
                  등록된 사내 단말기 생체 인증서(Face ID / 지문)가 확인되었습니다.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveAuthModal(null);
                    onLoginSuccess('20240102', true);
                  }}
                  className="w-full h-11 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800"
                >
                  생체 인증 완료 및 로그인
                </button>
              </div>
            )}

            {activeAuthModal === 'otp' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  사내 보안앱(Mobile OTP)에 표시된 6자리 인증번호를 입력하세요.
                </p>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full h-12 text-center font-mono-num text-xl tracking-[0.4em] font-bold rounded-xl border border-slate-200 focus:outline-none focus:border-[#1A3D9E]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (otpCode.trim().length === 6) {
                      setActiveAuthModal(null);
                      onLoginSuccess('20240102', true);
                    }
                  }}
                  className="w-full h-11 rounded-xl bg-[#1A3D9E] text-white text-sm font-semibold hover:bg-[#143080]"
                >
                  OTP 확인 및 로그인
                </button>
              </div>
            )}

            {activeAuthModal === 'reset' && (
              <div className="space-y-4">
                {resetSent ? (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
                    사내 메일로 임시 비밀번호 재설정 링크가 발송되었습니다.
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-slate-500">
                      사번 또는 사내 이메일을 입력하시면 본인 확인 후 초기화 안내를 발송합니다.
                    </p>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="예: 20240102 또는 이메일"
                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setResetSent(true)}
                      className="w-full h-11 rounded-xl bg-[#1A3D9E] text-white text-sm font-semibold"
                    >
                      초기화 링크 발송
                    </button>
                  </>
                )}
              </div>
            )}

            {activeAuthModal === 'help' && (
              <div className="space-y-3 text-sm text-slate-600">
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1">
                  <div className="font-semibold text-slate-900">IT 인프라운영팀 헬프데스크</div>
                  <div className="tabular-nums">내선번호: 1588 (직통 02-6000-1588)</div>
                  <div>운영시간: 평일 08:30 ~ 18:30</div>
                  <div>이메일: helpdesk@shinhanglobal.co.kr</div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveAuthModal(null)}
                  className="w-full h-10 rounded-xl bg-slate-900 text-white text-sm font-medium"
                >
                  확인
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
