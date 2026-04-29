import type { FinanceItem, ReportType } from '../shared/types';
import { todayDate, weekRange } from '../shared/utils';

export function formatMonthTitle(month: string) {
  const [year, mon] = month.split('-');
  return year + '年' + Number(mon || 1) + '月';
}

function formatDateCN(date: string) {
  const [, month, day] = date.split('-');
  return `${Number(month)}月${Number(day)}日`;
}

export function formatReportTitle(type: ReportType, week: string, month: string, year: string, start: string, end: string) {
  if (type === 'weekly') {
    const range = weekRange(week);
    return range ? `${formatDateCN(range.start)}-${formatDateCN(range.end)}` : '周账单';
  }
  if (type === 'yearly') return `${year}年`;
  if (type === 'custom') return `${formatDateCN(start)}-${formatDateCN(end)}`;
  return formatMonthTitle(month);
}

export function buildMonthCalendar(month: string, finances: FinanceItem[], activeTab: 'expense' | 'income') {
  const [year, monthRaw] = month.split('-').map(Number);
  const first = new Date(year, monthRaw - 1, 1);
  const daysInMonth = new Date(year, monthRaw, 0).getDate();
  const mondayFirst = (first.getDay() + 6) % 7;
  const prevDays = new Date(year, monthRaw - 1, 0).getDate();
  const totals = new Map<string, number>();
  finances.filter((item) => item.transaction_type === activeTab).forEach((item) => {
    const key = item.transaction_date;
    totals.set(key, (totals.get(key) || 0) + Number(item.amount || 0));
  });
  const cells: any[] = [];
  for (let index = mondayFirst - 1; index >= 0; index -= 1) {
    const day = prevDays - index;
    cells.push({ key: 'p' + day, day, currentMonth: false, total: 0 });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = month + '-' + String(day).padStart(2, '0');
    cells.push({ key, day, currentMonth: true, selected: key === todayDate(), total: totals.get(key) || 0 });
  }
  let next = 1;
  while (cells.length < 35) {
    cells.push({ key: 'n' + next, day: next, currentMonth: false, total: 0 });
    next += 1;
  }
  const maxDayTotal = Math.max(1, ...cells.map((cell) => cell.total));
  const activeDays = cells.filter((cell) => cell.currentMonth && cell.total > 0).length;
  return { cells, maxDayTotal, activeDays };
}
