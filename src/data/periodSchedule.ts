import { SessionType } from '../types/index.ts';

export interface PeriodTimeInfo {
  period: number;
  timeRange: string;
  start: string;
  end: string;
}

export const MORNING_PERIODS: Record<number, PeriodTimeInfo> = {
  1: { period: 1, timeRange: '7h00 - 7h45', start: '07:00', end: '07:45' },
  2: { period: 2, timeRange: '7h50 - 8h35', start: '07:50', end: '08:35' },
  3: { period: 3, timeRange: '9h05 - 9h50', start: '09:05', end: '09:50' },
  4: { period: 4, timeRange: '9h55 - 10h40', start: '09:55', end: '10:40' },
  5: { period: 5, timeRange: '10h45 - 11h30', start: '10:45', end: '11:30' },
};

export const AFTERNOON_PERIODS: Record<number, PeriodTimeInfo> = {
  1: { period: 1, timeRange: '13h00 - 13h45', start: '13:00', end: '13:45' },
  2: { period: 2, timeRange: '13h50 - 14h35', start: '13:50', end: '14:35' },
  3: { period: 3, timeRange: '14h50 - 15h35', start: '14:50', end: '15:35' },
  4: { period: 4, timeRange: '15h40 - 16h25', start: '15:40', end: '16:25' },
  5: { period: 5, timeRange: '16h30 - 17h15', start: '16:30', end: '17:15' },
};

export const SESSION_TIME_SUMMARY = {
  1: {
    name: 'Sáng',
    overallRange: '7h00 - 10h40',
    breakTime: '8h35 - 9h05 (Ra chơi 30 phút)',
  },
  2: {
    name: 'Chiều',
    overallRange: '13h00 - 16h25',
    breakTime: '14h35 - 14h50 (Ra chơi 15 phút)',
  },
};

export function getPeriodTimeString(session: SessionType, period: number): string {
  if (session === 1) {
    return MORNING_PERIODS[period]?.timeRange || '';
  } else {
    return AFTERNOON_PERIODS[period]?.timeRange || '';
  }
}
