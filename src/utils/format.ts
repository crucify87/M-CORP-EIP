export function formatKRW(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`;
}

export function formatTimeMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}시간 ${m}분`;
}
