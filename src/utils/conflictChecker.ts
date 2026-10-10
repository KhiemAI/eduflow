import { TimetableEntry, Teacher, SubjectConfig, SessionType } from '../types/index.ts';

export interface TeacherConflictResult {
  hasConflict: boolean;
  conflictingClass?: string;
  conflictingSubject?: string;
}

/**
 * Checks if a teacher is already scheduled in another class at the given time slot
 */
export function checkTeacherConflict(
  teacherName: string,
  targetClassId: string,
  day: number,
  session: SessionType,
  period: number,
  allTimetables: Record<string, TimetableEntry[]>
): TeacherConflictResult {
  if (!teacherName || teacherName === 'BGH & Đoàn trường' || teacherName === 'GVCN') {
    return { hasConflict: false };
  }

  for (const [classId, timetable] of Object.entries(allTimetables)) {
    if (classId === targetClassId) continue;

    const clash = timetable.find(
      item => item.day === day && item.session === session && item.period === period && item.teacher === teacherName
    );

    if (clash) {
      return {
        hasConflict: true,
        conflictingClass: classId,
        conflictingSubject: clash.sub,
      };
    }
  }

  return { hasConflict: false };
}

/**
 * Calculates current total teaching periods per week for a teacher across all classes
 */
export function calculateTeacherLoad(
  teacherName: string,
  allTimetables: Record<string, TimetableEntry[]>
): number {
  let count = 0;
  for (const timetable of Object.values(allTimetables)) {
    for (const item of timetable) {
      if (item.teacher === teacherName) {
        count++;
      }
    }
  }
  return count;
}

/**
 * Find available substitute teachers for a subject slot
 */
export function findAvailableSubstitutes(
  subjectName: string,
  currentTeacherName: string,
  day: number,
  session: SessionType,
  period: number,
  allTimetables: Record<string, TimetableEntry[]>,
  teachers: Teacher[],
  subjectsConfig: Record<string, SubjectConfig>
): Array<Teacher & { isFree: boolean; weeklyLoad: number; sameDept: boolean }> {
  const currentDept = subjectsConfig[subjectName]?.dept;

  return teachers
    .filter(t => t.name !== currentTeacherName && t.name !== 'BGH & Đoàn trường')
    .map(t => {
      // Check if this teacher is free at this slot across ALL classes
      let isBusy = false;
      for (const timetable of Object.values(allTimetables)) {
        if (timetable.some(item => item.day === day && item.session === session && item.period === period && item.teacher === t.name)) {
          isBusy = true;
          break;
        }
      }

      const weeklyLoad = calculateTeacherLoad(t.name, allTimetables);
      const sameDept = currentDept ? t.dept.toLowerCase().includes(currentDept.toLowerCase()) || currentDept.toLowerCase().includes(t.dept.toLowerCase()) : false;

      return {
        ...t,
        isFree: !isBusy,
        weeklyLoad,
        sameDept,
      };
    })
    .sort((a, b) => {
      // Prioritize same department first, then free status, then lowest weekly load
      if (a.sameDept !== b.sameDept) return a.sameDept ? -1 : 1;
      if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;
      return a.weeklyLoad - b.weeklyLoad;
    });
}
