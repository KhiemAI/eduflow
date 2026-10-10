export type SessionType = 1 | 2; // 1: Sáng, 2: Chiều

export interface TimetableEntry {
  id?: string;
  day: number; // 2 -> 7 (Thứ 2 -> Thứ 7)
  session: SessionType; // 1: Sáng, 2: Chiều
  period: number; // 1 -> 5
  sub: string; // Tên môn học
  teacher: string; // Tên giáo viên
  room?: string; // Phòng học
}

export interface SubjectConfig {
  name: string;
  dept: string; // Bộ môn / Tổ chuyên môn
  color: string; // CSS styling
  badgeColor: string;
  defaultTeacher?: string;
  isSpecial?: boolean; // Chào cờ, SHL
}

export interface Teacher {
  id: string;
  name: string;
  dept: string;
  email: string;
  phone?: string;
  maxLoad: number; // Định mức tiết tối đa / tuần (e.g. 17-19)
  currentLoad?: number; // Tổng số tiết đang dạy
}

export interface SchoolClass {
  id: string; // e.g. "10A1"
  name: string;
  grade: number; // 10, 11, 12
  homeroomTeacher: string; // GV Chủ nhiệm
  session: 'full_day' | 1 | 2; // Buổi học chính: 'full_day' (Học cả ngày), 1: Sáng, 2: Chiều
  room: string;
}

export interface ConflictInfo {
  teacher: string;
  day: number;
  session: SessionType;
  period: number;
  currentClass: string;
  conflictClass: string;
  subject: string;
}

export interface ClassSubjectAssignment {
  classId: string;
  subject: string;
  teacher: string;
}

export type TabType = 'timetable' | 'teachers' | 'classes' | 'homeroom' | 'teaching_assignment' | 'data' | 'settings';
