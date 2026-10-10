import { TimetableEntry, SchoolClass, Teacher, SubjectConfig, SessionType } from '../types/index.ts';
import { checkTeacherConflict } from './conflictChecker.ts';

export interface DataHealthReport {
  score: number; // 0 to 100
  totalIssuesCount: number;
  conflicts: Array<{
    classId: string;
    conflictingClass: string;
    teacher: string;
    subject: string;
    day: number;
    session: SessionType;
    period: number;
  }>;
  shlMismatches: Array<{
    classId: string;
    className: string;
    expectedTeacher: string;
    currentTeacher: string;
  }>;
  homeroomConflicts: Array<{
    teacherName: string;
    assignedClasses: string[];
  }>;
  emptyOrInvalidSlots: Array<{
    classId: string;
    day: number;
    session: SessionType;
    period: number;
    sub: string;
    teacher: string;
  }>;
  unlistedTeachers: Array<{
    teacherName: string;
    occurrences: number;
  }>;
  whitespaceIssuesCount: number;
}

export interface CleaningOptions {
  trimWhitespace: boolean;
  syncSHL: boolean;
  standardizeSpecialSlots: boolean;
  removeInvalidSlots: boolean;
  resolveTeacherConflicts: 'unassign' | 'delete' | 'none';
  resolveHomeroomConflicts: boolean;
  clearAllTimetables?: boolean;
  resetHomeroomAssignments?: boolean;
}

export interface CleaningSummary {
  trimmedCount: number;
  syncedSHLCount: number;
  standardizedSpecialCount: number;
  removedInvalidSlotsCount: number;
  resolvedConflictsCount: number;
  resolvedHomeroomConflictsCount: number;
  clearedTimetablesCount: number;
  resetHomeroomCount: number;
}

/**
 * Scans the database and returns a comprehensive health diagnostic report
 */
export function scanDataHealth(
  classes: SchoolClass[],
  teachers: Teacher[],
  subjectsConfig: Record<string, SubjectConfig>,
  allTimetables: Record<string, TimetableEntry[]>
): DataHealthReport {
  const teacherNamesSet = new Set(teachers.map(t => t.name));
  teacherNamesSet.add('BGH & Đoàn trường');
  teacherNamesSet.add('GVCN');
  teacherNamesSet.add('Chưa phân công');

  // 1. Check teacher conflicts
  const conflicts: DataHealthReport['conflicts'] = [];
  const checkedSlots = new Set<string>();

  for (const [classId, timetable] of Object.entries(allTimetables)) {
    for (const slot of timetable) {
      if (
        slot.teacher &&
        slot.teacher !== 'Chưa phân công' &&
        slot.teacher !== 'BGH & Đoàn trường' &&
        slot.teacher !== 'GVCN'
      ) {
        const slotKey = `${slot.teacher}-${slot.day}-${slot.session}-${slot.period}`;
        if (!checkedSlots.has(slotKey)) {
          const res = checkTeacherConflict(
            slot.teacher,
            classId,
            slot.day,
            slot.session,
            slot.period,
            allTimetables
          );
          if (res.hasConflict && res.conflictingClass) {
            conflicts.push({
              classId,
              conflictingClass: res.conflictingClass,
              teacher: slot.teacher,
              subject: slot.sub,
              day: slot.day,
              session: slot.session,
              period: slot.period,
            });
            checkedSlots.add(slotKey);
          }
        }
      }
    }
  }

  // 2. Check SHL synchronization mismatches
  const shlMismatches: DataHealthReport['shlMismatches'] = [];
  classes.forEach(c => {
    const classTimetable = allTimetables[c.id] || [];
    const shlSlot = classTimetable.find(s => s.sub === 'SHL' || s.sub.toLowerCase().includes('sinh hoạt'));
    if (shlSlot && c.homeroomTeacher && c.homeroomTeacher !== 'Chưa phân công') {
      if (shlSlot.teacher !== c.homeroomTeacher) {
        shlMismatches.push({
          classId: c.id,
          className: c.name,
          expectedTeacher: c.homeroomTeacher,
          currentTeacher: shlSlot.teacher || 'Chưa phân công',
        });
      }
    }
  });

  // 3. Check homeroom assignment conflicts (1 teacher assigned to > 1 class)
  const teacherHomeroomMap: Record<string, string[]> = {};
  classes.forEach(c => {
    if (c.homeroomTeacher && c.homeroomTeacher !== 'Chưa phân công') {
      if (!teacherHomeroomMap[c.homeroomTeacher]) {
        teacherHomeroomMap[c.homeroomTeacher] = [];
      }
      teacherHomeroomMap[c.homeroomTeacher].push(c.id);
    }
  });

  const homeroomConflicts: DataHealthReport['homeroomConflicts'] = [];
  for (const [teacherName, classList] of Object.entries(teacherHomeroomMap)) {
    if (classList.length > 1) {
      homeroomConflicts.push({
        teacherName,
        assignedClasses: classList,
      });
    }
  }

  // 4. Empty or invalid slots (empty subject name or completely blank)
  const emptyOrInvalidSlots: DataHealthReport['emptyOrInvalidSlots'] = [];
  for (const [classId, timetable] of Object.entries(allTimetables)) {
    for (const slot of timetable) {
      if (!slot.sub || !slot.sub.trim() || slot.sub.toLowerCase() === 'undefined' || slot.sub.toLowerCase() === 'null') {
        emptyOrInvalidSlots.push({
          classId,
          day: slot.day,
          session: slot.session,
          period: slot.period,
          sub: slot.sub || '',
          teacher: slot.teacher || '',
        });
      }
    }
  }

  // 5. Unlisted teachers
  const unlistedTeachersMap: Record<string, number> = {};
  for (const timetable of Object.values(allTimetables)) {
    for (const slot of timetable) {
      if (slot.teacher && slot.teacher.trim() && !teacherNamesSet.has(slot.teacher.trim())) {
        unlistedTeachersMap[slot.teacher.trim()] = (unlistedTeachersMap[slot.teacher.trim()] || 0) + 1;
      }
    }
  }
  const unlistedTeachers: DataHealthReport['unlistedTeachers'] = Object.entries(unlistedTeachersMap).map(
    ([teacherName, occurrences]) => ({ teacherName, occurrences })
  );

  // 6. Whitespace formatting issues
  let whitespaceIssuesCount = 0;
  for (const timetable of Object.values(allTimetables)) {
    for (const slot of timetable) {
      if (slot.sub !== slot.sub.trim() || (slot.teacher && slot.teacher !== slot.teacher.trim())) {
        whitespaceIssuesCount++;
      }
    }
  }
  classes.forEach(c => {
    if (c.name !== c.name.trim() || c.homeroomTeacher !== c.homeroomTeacher.trim() || c.room !== c.room.trim()) {
      whitespaceIssuesCount++;
    }
  });

  // Calculate score (100 is pristine)
  const totalIssuesCount =
    conflicts.length +
    shlMismatches.length +
    homeroomConflicts.length +
    emptyOrInvalidSlots.length +
    unlistedTeachers.length +
    (whitespaceIssuesCount > 0 ? 1 : 0);

  let penalty = 0;
  penalty += conflicts.length * 15;
  penalty += homeroomConflicts.length * 15;
  penalty += shlMismatches.length * 5;
  penalty += emptyOrInvalidSlots.length * 5;
  penalty += unlistedTeachers.length * 5;
  if (whitespaceIssuesCount > 0) penalty += 5;

  const score = Math.max(0, 100 - penalty);

  return {
    score,
    totalIssuesCount,
    conflicts,
    shlMismatches,
    homeroomConflicts,
    emptyOrInvalidSlots,
    unlistedTeachers,
    whitespaceIssuesCount,
  };
}

/**
 * Cleans and sanitizes application data according to selected options
 */
export function executeDataCleaning(
  options: CleaningOptions,
  data: {
    classes: SchoolClass[];
    teachers: Teacher[];
    subjectsConfig: Record<string, SubjectConfig>;
    allTimetables: Record<string, TimetableEntry[]>;
  }
): {
  classes: SchoolClass[];
  teachers: Teacher[];
  subjectsConfig: Record<string, SubjectConfig>;
  allTimetables: Record<string, TimetableEntry[]>;
  summary: CleaningSummary;
} {
  let newClasses = JSON.parse(JSON.stringify(data.classes)) as SchoolClass[];
  let newTeachers = JSON.parse(JSON.stringify(data.teachers)) as Teacher[];
  let newSubjectsConfig = JSON.parse(JSON.stringify(data.subjectsConfig)) as Record<string, SubjectConfig>;
  let newAllTimetables = JSON.parse(JSON.stringify(data.allTimetables)) as Record<string, TimetableEntry[]>;

  const summary: CleaningSummary = {
    trimmedCount: 0,
    syncedSHLCount: 0,
    standardizedSpecialCount: 0,
    removedInvalidSlotsCount: 0,
    resolvedConflictsCount: 0,
    resolvedHomeroomConflictsCount: 0,
    clearedTimetablesCount: 0,
    resetHomeroomCount: 0,
  };

  // 1. Clear all timetables if requested (Hard reset timetables)
  if (options.clearAllTimetables) {
    let count = 0;
    for (const [classId, list] of Object.entries(newAllTimetables)) {
      count += list.length;
      newAllTimetables[classId] = [];
    }
    summary.clearedTimetablesCount = count;
  }

  // 2. Reset homeroom assignments if requested
  if (options.resetHomeroomAssignments) {
    let count = 0;
    newClasses = newClasses.map(c => {
      if (c.homeroomTeacher && c.homeroomTeacher !== 'Chưa phân công') {
        count++;
        return { ...c, homeroomTeacher: 'Chưa phân công' };
      }
      return c;
    });
    summary.resetHomeroomCount = count;
  }

  // 3. Trim whitespace
  if (options.trimWhitespace) {
    newClasses = newClasses.map(c => {
      const trimmedName = c.name.trim();
      const trimmedHR = c.homeroomTeacher ? c.homeroomTeacher.trim() : 'Chưa phân công';
      const trimmedRoom = c.room.trim();
      if (trimmedName !== c.name || trimmedHR !== c.homeroomTeacher || trimmedRoom !== c.room) {
        summary.trimmedCount++;
      }
      return {
        ...c,
        name: trimmedName,
        homeroomTeacher: trimmedHR,
        room: trimmedRoom,
      };
    });

    newTeachers = newTeachers.map(t => {
      const trimmedName = t.name.trim();
      const trimmedDept = t.dept.trim();
      const trimmedEmail = t.email.trim();
      const trimmedPhone = t.phone ? t.phone.trim() : '';
      if (trimmedName !== t.name || trimmedDept !== t.dept) {
        summary.trimmedCount++;
      }
      return {
        ...t,
        name: trimmedName,
        dept: trimmedDept,
        email: trimmedEmail,
        phone: trimmedPhone,
      };
    });

    for (const [classId, list] of Object.entries(newAllTimetables)) {
      newAllTimetables[classId] = list.map(slot => {
        const trimmedSub = slot.sub.trim();
        const trimmedTeacher = slot.teacher ? slot.teacher.trim() : '';
        if (trimmedSub !== slot.sub || trimmedTeacher !== slot.teacher) {
          summary.trimmedCount++;
        }
        return {
          ...slot,
          sub: trimmedSub,
          teacher: trimmedTeacher,
        };
      });
    }
  }

  // 4. Remove empty / invalid slots
  if (options.removeInvalidSlots) {
    for (const [classId, list] of Object.entries(newAllTimetables)) {
      const initialLen = list.length;
      newAllTimetables[classId] = list.filter(slot => {
        const validSub = slot.sub && slot.sub.trim() && slot.sub !== 'undefined' && slot.sub !== 'null';
        return validSub;
      });
      summary.removedInvalidSlotsCount += initialLen - newAllTimetables[classId].length;
    }
  }

  // 5. Homeroom conflict resolution (Keep first class, unassign duplicates)
  if (options.resolveHomeroomConflicts) {
    const seenTeachers = new Set<string>();
    newClasses = newClasses.map(c => {
      if (c.homeroomTeacher && c.homeroomTeacher !== 'Chưa phân công') {
        if (seenTeachers.has(c.homeroomTeacher)) {
          summary.resolvedHomeroomConflictsCount++;
          return { ...c, homeroomTeacher: 'Chưa phân công' };
        }
        seenTeachers.add(c.homeroomTeacher);
      }
      return c;
    });
  }

  // 6. Sync SHL with homeroom teacher
  if (options.syncSHL) {
    newClasses.forEach(c => {
      if (newAllTimetables[c.id] && c.homeroomTeacher && c.homeroomTeacher !== 'Chưa phân công') {
        newAllTimetables[c.id] = newAllTimetables[c.id].map(slot => {
          if (slot.sub === 'SHL' || slot.sub.toLowerCase().includes('sinh hoạt')) {
            if (slot.teacher !== c.homeroomTeacher) {
              summary.syncedSHLCount++;
              return { ...slot, teacher: c.homeroomTeacher };
            }
          }
          return slot;
        });
      }
    });
  }

  // 7. Standardize special slots:
  // - Chào cờ cố định vào Sáng Thứ 2 Tiết 1 (BGH & Đoàn trường)
  // - SHL cố định vào Sáng Thứ 6 Tiết 4 (theo đúng GVCN)
  if (options.standardizeSpecialSlots) {
    for (const [classId, list] of Object.entries(newAllTimetables)) {
      const classObj = newClasses.find((c: SchoolClass) => c.id === classId);
      const homeroomTeacher = (classObj && classObj.homeroomTeacher && classObj.homeroomTeacher !== 'Chưa phân công') 
        ? classObj.homeroomTeacher 
        : 'GVCN';

      let currentList = [...list];

      // 7.1 Chuẩn hóa tiết Chào cờ: Sáng Thứ 2 (day 2, session 1, period 1)
      const chaoCoIndex = currentList.findIndex(s => s.sub === 'Chào cờ' || s.sub.toLowerCase().includes('chào cờ') || s.sub.toLowerCase() === 'cc');
      const mondayP1Index = currentList.findIndex(s => s.day === 2 && s.session === 1 && s.period === 1);

      if (chaoCoIndex !== -1 && chaoCoIndex !== mondayP1Index) {
        // Có tiết Chào cờ nhưng không ở Sáng Thứ 2 Tiết 1 -> hoán đổi hoặc di chuyển
        if (mondayP1Index !== -1) {
          const prevMondayP1 = currentList[mondayP1Index];
          const prevChaoCo = currentList[chaoCoIndex];
          currentList[mondayP1Index] = { ...prevChaoCo, day: 2, session: 1, period: 1, teacher: 'BGH & Đoàn trường', sub: 'Chào cờ' };
          currentList[chaoCoIndex] = { ...prevMondayP1, day: prevChaoCo.day, session: prevChaoCo.session, period: prevChaoCo.period };
        } else {
          currentList[chaoCoIndex] = { ...currentList[chaoCoIndex], day: 2, session: 1, period: 1, teacher: 'BGH & Đoàn trường', sub: 'Chào cờ' };
        }
        summary.standardizedSpecialCount++;
      } else if (mondayP1Index !== -1) {
        if (currentList[mondayP1Index].sub === 'Chào cờ' || currentList[mondayP1Index].sub.toLowerCase().includes('chào cờ')) {
          if (currentList[mondayP1Index].teacher !== 'BGH & Đoàn trường' || currentList[mondayP1Index].sub !== 'Chào cờ') {
            currentList[mondayP1Index] = { ...currentList[mondayP1Index], teacher: 'BGH & Đoàn trường', sub: 'Chào cờ' };
            summary.standardizedSpecialCount++;
          }
        }
      }

      // 7.2 Chuẩn hóa tiết SHL: Sáng Thứ 6 (day 6, session 1, period 4)
      const shlIndex = currentList.findIndex(s => s.sub === 'SHL' || s.sub.toLowerCase().includes('sinh hoạt'));
      const friP4Index = currentList.findIndex(s => s.day === 6 && s.session === 1 && s.period === 4);

      if (shlIndex !== -1 && shlIndex !== friP4Index) {
        // Có tiết SHL nhưng không ở Sáng Thứ 6 Tiết 4 -> hoán đổi hoặc di chuyển
        if (friP4Index !== -1) {
          const prevFriP4 = currentList[friP4Index];
          const prevSHL = currentList[shlIndex];
          currentList[friP4Index] = { ...prevSHL, day: 6, session: 1, period: 4, teacher: homeroomTeacher, sub: 'SHL' };
          currentList[shlIndex] = { ...prevFriP4, day: prevSHL.day, session: prevSHL.session, period: prevSHL.period };
        } else {
          currentList[shlIndex] = { ...currentList[shlIndex], day: 6, session: 1, period: 4, teacher: homeroomTeacher, sub: 'SHL' };
        }
        summary.standardizedSpecialCount++;
      } else if (friP4Index !== -1) {
        if (currentList[friP4Index].sub === 'SHL' || currentList[friP4Index].sub.toLowerCase().includes('sinh hoạt')) {
          if (currentList[friP4Index].teacher !== homeroomTeacher || currentList[friP4Index].sub !== 'SHL') {
            currentList[friP4Index] = { ...currentList[friP4Index], teacher: homeroomTeacher, sub: 'SHL' };
            summary.standardizedSpecialCount++;
          }
        }
      }

      newAllTimetables[classId] = currentList;
    }
  }

  // 8. Resolve teacher conflicts
  if (options.resolveTeacherConflicts !== 'none') {
    const scheduledSlotTeachers = new Set<string>();

    for (const [classId, list] of Object.entries(newAllTimetables)) {
      const updatedList: TimetableEntry[] = [];

      for (const slot of list) {
        if (
          slot.teacher &&
          slot.teacher !== 'Chưa phân công' &&
          slot.teacher !== 'BGH & Đoàn trường' &&
          slot.teacher !== 'GVCN'
        ) {
          const key = `${slot.teacher}-${slot.day}-${slot.session}-${slot.period}`;
          if (scheduledSlotTeachers.has(key)) {
            // Conflict found!
            summary.resolvedConflictsCount++;
            if (options.resolveTeacherConflicts === 'unassign') {
              updatedList.push({
                ...slot,
                teacher: 'Chưa phân công',
              });
            }
            // If delete, we simply don't push into updatedList
          } else {
            scheduledSlotTeachers.add(key);
            updatedList.push(slot);
          }
        } else {
          updatedList.push(slot);
        }
      }

      newAllTimetables[classId] = updatedList;
    }
  }

  return {
    classes: newClasses,
    teachers: newTeachers,
    subjectsConfig: newSubjectsConfig,
    allTimetables: newAllTimetables,
    summary,
  };
}
