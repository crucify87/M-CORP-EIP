import React, { useState } from 'react';
import {
  Search,
  Warehouse,
  ArrowUpDown,
  Package,
  AlertTriangle,
  ArrowLeftRight,
  QrCode,
  Camera,
  Truck,
  CheckCircle2,
  Printer,
  ShoppingCart,
  X,
} from 'lucide-react';
import { InventoryItem, WarehouseCenter, WarehouseDoc } from '../types/erp';
import { formatKRW } from '../utils/format';

interface InventoryWarehouseViewProps {
  warehouses: WarehouseCenter[];
  docs: WarehouseDoc[];
  inventoryItems: InventoryItem[];
  initialSearchSku?: string;
  onConfirmOutbound: (docId: string) => void;
  onRequestReorder: (item: InventoryItem, orderQty: number) => void;
  onOpenBarcodeModal: () => void;
  onOpenLeaveView: () => void;
  onOpenLoginView: () => void;
}

export const InventoryWarehouseView: React.FC<InventoryWarehouseViewProps> = ({
  warehouses,
  docs,
  inventoryItems,
  initialSearchSku = '',
  onConfirmOutbound,
  onRequestReorder,
  onOpenBarcodeModal,
  onOpenLeaveView,
  onOpenLoginView,
}) => {
  const [selectedCenterId, setSelectedCenterId] = useState(warehouses[0]?.id || 'wh-1');
  const [searchQuery, setSearchQuery] = useState(initialSearchSku);
  const [activeTab, setActiveTab] = useState<'inout' | 'stock' | 'low_stock' | 'transfer'>('inout');
  const [showCenterPicker, setShowCenterPicker] = useState(false);
  const [rackLabelDoc, setRackLabelDoc] = useState<WarehouseDoc | null>(null);
  const [reorderTarget, setReorderTarget] = useState<InventoryItem | null>(null);
  const [reorderQty, setReorderQty] = useState('200');
  const [transferSku, setTransferSku] = useState('GW-8802');
  const [transferQty, setTransferQty] = useState('25');
  const [transferTo, setTransferTo] = useState('제2 물류센터 (평택 포승)');
  const [transferDone, setTransferDone] = useState(false);

  const currentCenter =
    warehouses.find((w) => w.id === selectedCenterId) || warehouses[0];

  const q = searchQuery.trim().toLowerCase();

  const centerDocs = docs.filter((d) => {
    if (d.centerId !== selectedCenterId) return false;
    if (!q) return true;
    return (
      d.itemName.toLowerCase().includes(q) ||
      d.sku.toLowerCase().includes(q) ||
      d.docNumber.toLowerCase().includes(q)
    );
  });

  const centerStock = inventoryItems.filter((item) => {
    if (item.centerId !== selectedCenterId) return false;
    if (!q) return true;
    return item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
  });

  const lowStockItems = centerStock.filter((i) => i.availableQty < i.safetyQty);

  const handleSubmitReorder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reorderTarget) return;
    onRequestReorder(reorderTarget, Math.max(10, Number(reorderQty) || 100));
    setReorderTarget(null);
  };

  return (
    <div className="space-y-5">
      {/* Quick Switch Bar for More Modules (Inventory / Leave Calendar / Security Login) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-[#1A3D9E]">재고·물류 / 창고관제</span>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={onOpenLeaveView}
            className="font-medium text-slate-600 hover:text-[#1A3D9E]"
          >
            근태·휴가 신청 캘린더
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={onOpenLoginView}
            className="font-medium text-slate-600 hover:text-[#1A3D9E]"
          >
            포털 보안 로그인 화면
          </button>
        </div>
        <span className="text-[11px] font-mono-num text-slate-400">WMS Module</span>
      </div>

      {/* Live SKU / Barcode Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="품목명, SKU 코드(예: GW-8802), 바코드 즉시 검색"
          className="w-full h-11 pl-10 pr-10 rounded-xl bg-white border border-slate-200/90 text-sm focus:outline-none focus:border-[#1A3D9E]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="검색어 지우기"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Center Summary + Scanner Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8EEF9] text-[#1A3D9E] flex items-center justify-center shrink-0">
                <Warehouse className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">{currentCenter.name}</h2>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {currentCenter.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{currentCenter.location}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCenterPicker(true)}
              className="text-xs font-semibold text-[#1A3D9E] hover:underline inline-flex items-center gap-1 shrink-0"
            >
              <span>센터 전환</span>
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F4F6FB] rounded-xl p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>총 보유 품목(SKU)</span>
                <Package className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">
                  {currentCenter.totalSku.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500">개</span>
              </div>
              <div className="text-xs font-semibold text-emerald-700 mt-1 tabular-nums">
                ↗ +{currentCenter.newSkuCount}개 신규 등록
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('low_stock')}
              className="bg-red-50/70 border border-red-200/80 rounded-xl p-3.5 text-left hover:bg-red-50 transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-red-700 font-medium">
                <span>안전재고 미달</span>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-red-700 tabular-nums">
                  {lowStockItems.length}
                </span>
                <span className="text-xs text-red-700">개 품목</span>
              </div>
              <div className="text-xs font-semibold text-red-700 mt-1">즉시 발주 권장</div>
            </button>
          </div>

          <div className="bg-[#F4F6FB] rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>금일 입출고 진행</span>
              <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-200 text-center py-1">
              <div>
                <div className="text-xs text-slate-500">입고 예정</div>
                <div className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
                  {currentCenter.inboundExpected}건
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">출고 대기</div>
                <div className="text-lg font-bold text-[#1A3D9E] tabular-nums mt-0.5">
                  {currentCenter.outboundPending}건
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs">
              <span className="text-slate-500 tabular-nums">
                정시 출고율 {currentCenter.onTimeRate}%
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('inout')}
                className="font-semibold text-[#1A3D9E] hover:underline"
              >
                상세보기 →
              </button>
            </div>
          </div>
        </section>

        {/* Mobile Barcode Scanner Banner */}
        <section className="lg:col-span-5 bg-[#1A3D9E] rounded-2xl p-6 text-white flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-snug">모바일 바코드·QR 고속 스캐너</h3>
              <p className="text-xs text-white/80 mt-1.5 leading-relaxed">
                카메라로 품목 바코드 또는 적치 랙 QR을 스캔하여 실시간 재고 수량과 입출고 검수를 즉시 처리합니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenBarcodeModal}
            className="mt-6 w-full h-12 rounded-xl bg-white text-[#1A3D9E] hover:bg-slate-100 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <span>스캔 시작</span>
            <Camera className="w-4 h-4" />
          </button>
        </section>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/90 px-3 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'inout', label: '입출고 현황' },
          { id: 'stock', label: '품목별 재고' },
          { id: 'low_stock', label: `안전재고 알림 (${lowStockItems.length})` },
          { id: 'transfer', label: '창고 이동' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? 'bg-[#E8EEF9] text-[#1A3D9E]'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'inout' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {centerDocs.map((doc) => (
              <article
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs mb-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-md ${
                          doc.status === '출고 대기'
                            ? 'bg-[#E8EEF9] text-[#1A3D9E]'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {doc.status}
                      </span>
                      <span className="font-mono-num text-slate-500">{doc.docNumber}</span>
                    </div>
                    <span
                      className={`font-semibold tabular-nums ${
                        doc.status === '출고 대기' ? 'text-red-700' : 'text-slate-500'
                      }`}
                    >
                      {doc.timeLabel}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{doc.itemName}</h4>
                      <div className="text-xs text-slate-500 mt-1 font-mono-num">
                        SKU: {doc.sku} | {doc.lotOrMaker}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] text-slate-500">
                        {doc.type === 'outbound' ? '출고요청' : '적치 수량'}
                      </div>
                      <div
                        className={`text-lg font-bold tabular-nums ${
                          doc.type === 'outbound' ? 'text-[#1A3D9E]' : 'text-emerald-700'
                        }`}
                      >
                        {doc.quantity}{' '}
                        <span className="text-xs font-medium text-slate-500">EA</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 bg-[#F4F6FB] rounded-xl p-3.5 space-y-1.5 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">
                        {doc.type === 'outbound' ? '도착 목적지' : '보관 적치구역'}
                      </span>
                      <span className="font-semibold text-slate-800 text-right">
                        {doc.destinationOrZone}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">
                        {doc.type === 'outbound' ? '출하 검수 상태' : '품질검사 증빙'}
                      </span>
                      <span className="font-semibold text-emerald-700 text-right">
                        {doc.type === 'outbound' ? doc.inspectionStatus : doc.trackingOrEvidence}
                      </span>
                    </div>
                    {doc.type === 'outbound' && (
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500">지정 배송 운송장</span>
                        <span className="font-mono-num font-semibold text-slate-900">
                          {doc.trackingOrEvidence}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span
                    className={`text-xs font-medium flex items-center gap-1.5 ${
                      doc.status === '출고 완료' || doc.status === '입고 완료'
                        ? 'text-emerald-700'
                        : 'text-slate-600'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {doc.footerNote}
                  </span>

                  {doc.type === 'outbound' && doc.status === '출고 대기' ? (
                    <button
                      type="button"
                      onClick={() => onConfirmOutbound(doc.id)}
                      className="h-10 px-4 rounded-xl bg-[#1A3D9E] hover:bg-[#143080] text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>출고 확인 (전표발행)</span>
                    </button>
                  ) : doc.type === 'inbound' ? (
                    <button
                      type="button"
                      onClick={() => setRackLabelDoc(doc)}
                      className="h-9 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 shrink-0"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>랙 바코드 인쇄</span>
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700">전표 발행 완료</span>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* Highlighted Low Stock Warning Card inside inout view (matching image) */}
          {lowStockItems.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              {lowStockItems.map((item) => {
                const deficit = item.availableQty - item.safetyQty;
                const ratio = Math.min(100, Math.round((item.availableQty / item.safetyQty) * 100));
                return (
                  <article
                    key={item.id}
                    className="bg-red-50/50 rounded-2xl border border-red-200 p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-white border border-red-200 px-2.5 py-1 rounded-md">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        안전재고 부족 경고
                      </span>
                      <span className="font-mono-num text-slate-500">SKU: {item.sku}</span>
                      <span className="font-bold text-red-700 tabular-nums">
                        임계치 {100 - ratio}% 하회
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-bold text-slate-900">{item.name}</h4>
                        <div className="text-xs text-slate-600 mt-1">
                          {item.spec} | {item.rackLocation}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[11px] text-red-700">현재 가용재고</div>
                        <div className="text-xl font-bold text-red-700 tabular-nums">
                          {item.availableQty} <span className="text-xs font-normal">EA</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-600 tabular-nums">
                          적정 안전재고: {item.safetyQty} EA
                        </span>
                        <span className="font-bold text-red-700 tabular-nums">부족: {deficit} EA</span>
                      </div>
                      <div className="h-2 bg-white rounded-full overflow-hidden border border-red-100">
                        <div className="h-full bg-red-600 rounded-full" style={{ width: `${ratio}%` }} />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={item.reorderRequested}
                      onClick={() => {
                        setReorderTarget(item);
                        setReorderQty(String(Math.max(100, item.safetyQty - item.availableQty + 50)));
                      }}
                      className="w-full h-11 rounded-xl bg-[#1A3D9E] hover:bg-[#143080] disabled:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>
                        {item.reorderRequested ? '구매팀 발주 요청 완료' : '구매팀 즉시 발주요청'}
                      </span>
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {(activeTab === 'stock' || activeTab === 'low_stock') && (
        <section className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              {activeTab === 'low_stock' ? '안전재고 미달 품목 목록' : '센터 보유 품목별 재고 현황'}
            </h3>
            <span className="text-xs text-slate-500 tabular-nums">
              {(activeTab === 'low_stock' ? lowStockItems : centerStock).length}개 품목
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {(activeTab === 'low_stock' ? lowStockItems : centerStock).map((item) => {
              const isLow = item.availableQty < item.safetyQty;
              return (
                <div
                  key={item.id}
                  className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/70"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-num text-xs font-semibold text-[#1A3D9E]">
                        {item.sku}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{item.name}</span>
                      {isLow && (
                        <span className="text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                          안전재고 미달
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {item.spec} · {item.rackLocation} · 단가 {formatKRW(item.unitPrice)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div
                        className={`text-base font-bold tabular-nums ${
                          isLow ? 'text-red-700' : 'text-slate-900'
                        }`}
                      >
                        {item.availableQty} EA
                      </div>
                      <div className="text-[11px] text-slate-400 tabular-nums">
                        안전재고 {item.safetyQty} EA
                      </div>
                    </div>
                    {isLow && (
                      <button
                        type="button"
                        disabled={item.reorderRequested}
                        onClick={() => setReorderTarget(item)}
                        className="h-9 px-3 rounded-xl bg-[#1A3D9E] disabled:bg-emerald-700 text-white text-xs font-semibold"
                      >
                        {item.reorderRequested ? '요청됨' : '발주요청'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === 'transfer' && (
        <section className="bg-white rounded-2xl border border-slate-200/90 p-5 max-w-xl space-y-4">
          <h3 className="text-base font-bold text-slate-900">창고 간 재고 이동 지시</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">대상 품목 (SKU)</label>
              <select
                value={transferSku}
                onChange={(e) => setTransferSku(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white"
              >
                {inventoryItems.map((i) => (
                  <option key={i.id} value={i.sku}>
                    [{i.sku}] {i.name} (가용 {i.availableQty} EA)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">도착 물류센터</label>
              <select
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <option value="제2 물류센터 (평택 포승)">제2 물류센터 (평택 포승)</option>
                <option value="동남권 허브 (부산 강서)">동남권 허브 (부산 강서)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">이동 수량 (EA)</label>
              <input
                type="number"
                min={1}
                value={transferQty}
                onChange={(e) => setTransferQty(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm tabular-nums"
              />
            </div>
            {transferDone && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 font-medium">
                {transferSku} ({transferQty} EA) → {transferTo} 이송 지시서가 등록되었습니다.
              </div>
            )}
            <button
              type="button"
              onClick={() => setTransferDone(true)}
              className="w-full h-11 rounded-xl bg-[#1A3D9E] text-white text-sm font-semibold"
            >
              창고 이동 지시 등록
            </button>
          </div>
        </section>
      )}

      {/* Center Picker Modal */}
      {showCenterPicker && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">물류센터 전환</h3>
              <button
                type="button"
                onClick={() => setShowCenterPicker(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {warehouses.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    setSelectedCenterId(w.id);
                    setShowCenterPicker(false);
                  }}
                  className={`w-full p-3.5 rounded-xl border text-left transition-colors ${
                    w.id === selectedCenterId
                      ? 'border-[#1A3D9E] bg-[#F4F7FF]'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-sm font-bold text-slate-900">{w.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{w.location}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reorder Request Modal */}
      {reorderTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitReorder}
            className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">구매팀 긴급 발주 요청</h3>
              <button
                type="button"
                onClick={() => setReorderTarget(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1">
              <div className="font-bold text-slate-900">
                {reorderTarget.name} ({reorderTarget.sku})
              </div>
              <div className="text-slate-500 tabular-nums">
                현재 재고 {reorderTarget.availableQty} EA / 안전재고 {reorderTarget.safetyQty} EA
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                발주 요청 수량 (EA)
              </label>
              <input
                type="number"
                min={10}
                value={reorderQty}
                onChange={(e) => setReorderQty(e.target.value)}
                required
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm tabular-nums"
              />
            </div>
            <div className="text-xs text-slate-600 flex justify-between">
              <span>예상 발주 금액</span>
              <span className="font-bold text-[#1A3D9E] tabular-nums">
                {formatKRW((Number(reorderQty) || 0) * reorderTarget.unitPrice)}
              </span>
            </div>
            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-[#1A3D9E] text-white text-sm font-semibold"
            >
              구매요청서 생성 및 전자결재 상신
            </button>
          </form>
        </div>
      )}

      {/* Rack Barcode Print Modal */}
      {rackLabelDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">적치 랙 바코드 라벨</h3>
              <button
                type="button"
                onClick={() => setRackLabelDoc(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="border-2 border-slate-900 rounded-xl p-4 text-center space-y-2">
              <div className="font-mono-num text-xs font-bold text-slate-500">
                {rackLabelDoc.destinationOrZone}
              </div>
              <div className="text-base font-bold text-slate-900">{rackLabelDoc.itemName}</div>
              <div className="font-mono-num text-lg font-bold tracking-widest py-2 border-y border-slate-200">
                |||| ||| || |||| {rackLabelDoc.sku}
              </div>
              <div className="text-xs text-slate-500 tabular-nums">
                수량: {rackLabelDoc.quantity} EA · {rackLabelDoc.docNumber}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                window.print();
                setRackLabelDoc(null);
              }}
              className="w-full h-10 rounded-xl bg-slate-900 text-white text-xs font-semibold"
            >
              라벨 인쇄
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
