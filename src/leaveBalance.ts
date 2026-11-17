export type LeaveQuotaType = 'annual' | 'monthly' | 'half';

export interface ApprovedLeave {
  owner: string;
  title: string;
  status: string;
  date: string;
  endDate: string;
}

const DAY = 86_400_000;

export function leaveQuotaType(title: string): LeaveQuotaType | undefined {
  const type = title.trim();
  if (type === '연차' || type.startsWith('연차 ')) return 'annual';
  if (type === '월차' || type.startsWith('월차 ')) return 'monthly';
  if (/^(?:(?:오전|오후)\s*)?반차(?:$|\s|\()/.test(type)) return 'half';
}

export function usedLeaveDays(leave: ApprovedLeave[], type: LeaveQuotaType) {
  const ranges = leave.filter(row => row.status === '승인' && leaveQuotaType(row.title) === type)
    .map(row => [Date.parse(row.date) / DAY, Date.parse(row.endDate || row.date) / DAY])
    .filter(([start, end]) => Number.isInteger(start) && Number.isInteger(end) && start <= end)
    .sort(([a], [b]) => a - b);

  let used = 0;
  let lastDay = -Infinity;
  for (const [start, end] of ranges) {
    const from = Math.max(start, lastDay + 1);
    if (from > end) continue;
    const size = end - from + 1;
    used += Math.floor(size / 7) * 5;
    for (let i = 0; i < size % 7; i++) {
      const weekday = new Date((from + i) * DAY).getUTCDay();
      if (weekday !== 0 && weekday !== 6) used++;
    }
    lastDay = end;
  }
  return type === 'half' ? used / 2 : used;
}
