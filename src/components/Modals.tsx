import React, { useState } from 'react';
import {
  X,
  Bell,
  Check,
  Camera,
  QrCode,
  LogOut,
  User,
  Building2,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Receipt,
  CheckCircle2,
  ScanLine,
  Package,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import {
  ExpenseCategory,
  ExpenseTransaction,
  InventoryItem,
  MainTab,
  MoreSubView,
  NotificationItem,
  UserProfile,
} from '../types/erp';
import { formatKRW } from '../utils/format';

interface NotificationDrawerProps {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onSelectNotification: (item: NotificationItem) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  open,
  onClose,
  notifications,
  onMarkAllRead,
  onSelectNotification,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-md h-full flex flex-col border-l border-slate-200 shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#1A3D9E]" />
            <h2 className="text-base font-bold text-slate-900">업무 알림함</h2>
            <span className="text-xs font-semibold text-[#1A3D9E] bg-[#E8EEF9] px-2 py-0.5 rounded-md tabular-nums">
              {notifications.filter((n) => !n.read).length}건 미확인
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-xs font-medium text-slate-600 hover:text-[#1A3D9E] px-2 py-1 rounded-md hover:bg-slate-100"
            >
              모두 읽음
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {notifications.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectNotification(item);
                onClose();
              }}
              className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-start gap-3 ${
                !item.read ? 'bg-[#F8FAFF]' : 'bg-white'
              }`}
            >
              <div
                className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                  !item.read ? 'bg-[#1A3D9E]' : 'bg-slate-300'
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1">
                  <span className="font-semibold text-[#1A3D9E]">{item.category}</span>
                  <span className="tabular-nums">{item.time}</span>
                </div>
                <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: UserProfile;
  onLogout: () => void;
  onResetDemoData: () => void;
  onNavigate: (tab: MainTab, subView?: MoreSubView) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  open,
  onClose,
  user,
  onLogout,
  onResetDemoData,
  onNavigate,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">임직원 계정 정보</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-[#1A3D9E] text-white font-bold text-lg flex items-center justify-center shrink-0">
              {user.name.slice(0, 1)}
            </div>
            <div>
              <div className="text-base font-bold text-slate-900">
                {user.name} {user.rank}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {user.division} · {user.department} · 사번 {user.employeeId}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200/70 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> 사내 이메일
              </span>
              <span className="font-medium text-slate-800">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> 연락처
              </span>
              <span className="font-medium text-slate-800 tabular-nums">{user.phone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> 근무지
              </span>
              <span className="font-medium text-slate-800">{user.officeLocation}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> 잔여 연차
              </span>
              <span className="font-semibold text-[#1A3D9E] tabular-nums">
                {user.remainingLeave}일 / {user.totalLeave}일
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                onNavigate('more', 'leave');
                onClose();
              }}
              className="h-10 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              근태·휴가 관리
            </button>
            <button
              type="button"
              onClick={() => {
                onResetDemoData();
                onClose();
              }}
              className="h-10 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              초기 데이터 복원
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>로그아웃 (로그인 화면 전환)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface OcrReceiptModalProps {
  open: boolean;
  onClose: () => void;
  onCreateExpense: (tx: Omit<ExpenseTransaction, 'id'>) => void;
}

const SAMPLE_RECEIPTS = [
  {
    label: '투썸플레이스 역삼역점 (다과)',
    merchant: '투썸플레이스 역삼역점',
    amount: 31000,
    category: '법인카드' as ExpenseCategory,
    description: '신규 파트너사 미팅 다과비',
  },
  {
    label: '카카오T 택시 (야간 업무)',
    merchant: '카카오T 블랙택시',
    amount: 28400,
    category: '개인경비' as ExpenseCategory,
    description: '야근 후 귀가 심야 교통비 (23:30)',
  },
  {
    label: '오피스디포 강남점 (사무용품)',
    merchant: '오피스디포 강남점',
    amount: 76000,
    category: '법인카드' as ExpenseCategory,
    description: '기획전략팀 회의용 소모품 구매',
  },
];

export const OcrReceiptModal: React.FC<OcrReceiptModalProps> = ({
  open,
  onClose,
  onCreateExpense,
}) => {
  const [merchant, setMerchant] = useState('투썸플레이스 역삼역점');
  const [amountStr, setAmountStr] = useState('31000');
  const [category, setCategory] = useState<ExpenseCategory>('법인카드');
  const [description, setDescription] = useState('신규 파트너사 미팅 다과비');
  const [scanned, setScanned] = useState(false);

  if (!open) return null;

  const amount = Math.max(0, Number(amountStr) || 0);
  const supplyAmount = Math.round(amount / 1.1);
  const vatAmount = amount - supplyAmount;

  const handleApplyPreset = (preset: (typeof SAMPLE_RECEIPTS)[number]) => {
    setMerchant(preset.merchant);
    setAmountStr(String(preset.amount));
    setCategory(preset.category);
    setDescription(preset.description);
    setScanned(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant.trim() || amount <= 0) return;

    onCreateExpense({
      merchant: merchant.trim(),
      category,
      status: '정산 대기',
      amount,
      supplyAmount,
      vatAmount,
      description: description.trim() || '업무 관련 경비 지출',
      dateTime: '2025.06.18 15:10',
      month: '2025.06',
      paymentMethod:
        category === '법인카드'
          ? '신한법인(4821)'
          : category === '개인경비'
          ? '개인경비 환급신청 (하나은행 계좌)'
          : '전자세금계산서',
      note: `OCR 영수증 파싱 완료 (부가세 ${formatKRW(vatAmount)} 포함)`,
      receiptCode: `REC-20250618-${Math.floor(1000 + Math.random() * 9000)}`,
      iconType: 'receipt',
    });
    setScanned(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#1A3D9E]" />
            <h2 className="text-base font-bold text-slate-900">영수증 OCR 자동 전표 생성</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-[#F4F6FB] border border-dashed border-[#1A3D9E]/40 rounded-xl p-4">
            <div className="text-xs font-semibold text-slate-700 mb-2">
              샘플 영수증 스캔 테스트 (클릭 시 OCR 자동 추출)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_RECEIPTS.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => handleApplyPreset(sample)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#1A3D9E] text-slate-700 font-medium transition-colors"
                >
                  {sample.label}
                </button>
              ))}
            </div>
            {scanned && (
              <div className="mt-2.5 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                공급가액 및 부가세(10%) 자동 분리 인식 완료
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">가맹점명</label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A3D9E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">결제 금액 (원)</label>
              <input
                type="number"
                min={100}
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-[#1A3D9E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">정산 구분</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-[#1A3D9E]"
              >
                <option value="법인카드">법인카드</option>
                <option value="개인경비">개인경비</option>
                <option value="세금계산서">세금계산서</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">적요 / 사용 목적</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A3D9E]"
              />
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-500">자동 분리 내역</span>
            <span className="font-semibold text-slate-800 tabular-nums">
              공급가 {formatKRW(supplyAmount)} · 부가세 {formatKRW(vatAmount)}
            </span>
          </div>

          <button
            type="submit"
            className="w-full h-11 rounded-xl bg-[#1A3D9E] hover:bg-[#143080] text-white text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Receipt className="w-4 h-4" />
            <span>전표 생성 및 정산 대기 등록</span>
          </button>
        </form>
      </div>
    </div>
  );
};

interface BarcodeScannerModalProps {
  open: boolean;
  onClose: () => void;
  inventoryItems: InventoryItem[];
  onJumpToInventorySku: (sku: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  open,
  onClose,
  inventoryItems,
  onJumpToInventorySku,
}) => {
  const [skuInput, setSkuInput] = useState('GW-8802');
  if (!open) return null;

  const matchedItem = inventoryItems.find(
    (item) => item.sku.toLowerCase() === skuInput.trim().toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#1A3D9E]" />
            <h2 className="text-base font-bold text-slate-900">바코드·QR 고속 스캐너</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-slate-900 rounded-xl p-6 text-center relative overflow-hidden">
            <ScanLine className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs text-slate-300">
              스캐너 프레임에 품목 바코드 또는 랙 QR을 비추거나 SKU를 선택하세요
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {['GW-8802', 'BAT-4810', 'CON-12WP'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setSkuInput(code)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono-num font-semibold transition-colors ${
                    skuInput === code
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">스캔 SKU 코드</label>
            <input
              type="text"
              value={skuInput}
              onChange={(e) => setSkuInput(e.target.value)}
              placeholder="예: GW-8802"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm font-mono-num focus:outline-none focus:border-[#1A3D9E]"
            />
          </div>

          {matchedItem ? (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-mono-num font-semibold text-[#1A3D9E]">
                    SKU: {matchedItem.sku}
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{matchedItem.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {matchedItem.spec} · {matchedItem.rackLocation}
                  </div>
                </div>
                <Package className="w-5 h-5 text-slate-400 shrink-0" />
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  가용재고:{' '}
                  <strong
                    className={`tabular-nums ${
                      matchedItem.availableQty < matchedItem.safetyQty
                        ? 'text-red-600'
                        : 'text-emerald-700'
                    }`}
                  >
                    {matchedItem.availableQty} EA
                  </strong>
                </span>
                <span className="text-slate-500 tabular-nums">안전재고 {matchedItem.safetyQty} EA</span>
              </div>
              {matchedItem.availableQty < matchedItem.safetyQty && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  안전재고 미달 품목입니다. 즉시 발주 검토가 필요합니다.
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-500 text-center py-3 bg-slate-50 rounded-xl">
              일치하는 SKU 품목을 찾을 수 없습니다.
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              onJumpToInventorySku(skuInput.trim());
              onClose();
            }}
            className="w-full h-11 rounded-xl bg-[#1A3D9E] hover:bg-[#143080] text-white text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>창고관제 화면에서 품목 확인</span>
          </button>
        </div>
      </div>
    </div>
  );
};
