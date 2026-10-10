/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { 
  INITIAL_SUBJECTS, 
  INITIAL_TEACHERS, 
  INITIAL_CLASSES, 
  INITIAL_ALL_TIMETABLES, 
  DEFAULT_TIMETABLE_10A1 
} from './data/mockData.ts';
import { 
  TabType, 
  TimetableEntry, 
  SubjectConfig, 
  Teacher, 
  SchoolClass, 
  SessionType 
} from './types/index.ts';
import { 
  checkTeacherConflict, 
  findAvailableSubstitutes, 
  TeacherConflictResult 
} from './utils/conflictChecker.ts';

import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { TimetableGrid } from './components/TimetableGrid.tsx';
import { SubstituteModal } from './components/SubstituteModal.tsx';
import { ConflictModal } from './components/ConflictModal.tsx';
import { QuickAddModal } from './components/QuickAddModal.tsx';
import { TeacherManagement } from './components/TeacherManagement.tsx';
import { ClassManagement } from './components/ClassManagement.tsx';
import { HomeroomManagement } from './components/HomeroomManagement.tsx';
import { DataImportExport } from './components/DataImportExport.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { PrintTimetableModal, PrintMode } from './components/PrintTimetableModal.tsx';
import { TeachingAssignmentManagement } from './components/TeachingAssignmentManagement.tsx';
import { DataCleaningModal } from './components/DataCleaningModal.tsx';
import { ClearTimetableModal, ClearTimetableOptions } from './components/ClearTimetableModal.tsx';
import { scanDataHealth, CleaningSummary } from './utils/dataCleaner.ts';
import { UserCheck, X, Search, Check, Sparkles, RotateCcw } from 'lucide-react';
import type { WorkspaceRecord } from './types/workspace.ts';
import { supabase } from './lib/supabase.ts';

interface AppProps {
  workspaceId: string;
  userId: string;
  userEmail: string;
  memberRole: 'admin' | 'editor';
  initialWorkspace: WorkspaceRecord;
  onInviteMember: (email: string) => Promise<boolean>;
  onLogout: () => void;
}

// Helper to standardize default slots: Chào cờ (Sáng Thứ 2 Tiết 1) and SHL (Sáng Thứ 6 Tiết 4)
const standardizeDefaultSpecialSlots = (
  tables: Record<string, TimetableEntry[]>,
  classList: SchoolClass[]
): Record<string, TimetableEntry[]> => {
  const result: Record<string, TimetableEntry[]> = { ...tables };
  for (const [classId, list] of Object.entries(result)) {
    const classObj = classList.find(c => c.id === classId);
    const homeroom = (classObj && classObj.homeroomTeacher && classObj.homeroomTeacher !== 'Chưa phân công')
      ? classObj.homeroomTeacher
      : 'GVCN';
    let currentList = [...list];

    // Chào cờ: Sáng Thứ 2 Tiết 1
    const ccIndex = currentList.findIndex(s => s.sub === 'Chào cờ' || s.sub.toLowerCase().includes('chào cờ') || s.sub.toLowerCase() === 'cc');
    const monP1Index = currentList.findIndex(s => s.day === 2 && s.session === 1 && s.period === 1);
    if (ccIndex !== -1 && ccIndex !== monP1Index) {
      if (monP1Index !== -1) {
        const prevMon = currentList[monP1Index];
        const prevCC = currentList[ccIndex];
        currentList[monP1Index] = { ...prevCC, day: 2, session: 1, period: 1, sub: 'Chào cờ', teacher: 'BGH & Đoàn trường' };
        currentList[ccIndex] = { ...prevMon, day: prevCC.day, session: prevCC.session, period: prevCC.period };
      } else {
        currentList[ccIndex] = { ...currentList[ccIndex], day: 2, session: 1, period: 1, sub: 'Chào cờ', teacher: 'BGH & Đoàn trường' };
      }
    } else if (monP1Index !== -1 && (currentList[monP1Index].sub === 'Chào cờ' || currentList[monP1Index].sub.toLowerCase().includes('chào cờ'))) {
      currentList[monP1Index] = { ...currentList[monP1Index], teacher: 'BGH & Đoàn trường', sub: 'Chào cờ' };
    }

    // SHL: Sáng Thứ 6 Tiết 4
    const shlIndex = currentList.findIndex(s => s.sub === 'SHL' || s.sub.toLowerCase().includes('sinh hoạt'));
    const friP4Index = currentList.findIndex(s => s.day === 6 && s.session === 1 && s.period === 4);
    if (shlIndex !== -1 && shlIndex !== friP4Index) {
      if (friP4Index !== -1) {
        const prevFri = currentList[friP4Index];
        const prevSHL = currentList[shlIndex];
        currentList[friP4Index] = { ...prevSHL, day: 6, session: 1, period: 4, sub: 'SHL', teacher: homeroom };
        currentList[shlIndex] = { ...prevFri, day: prevSHL.day, session: prevSHL.session, period: prevSHL.period };
      } else {
        currentList[shlIndex] = { ...currentList[shlIndex], day: 6, session: 1, period: 4, sub: 'SHL', teacher: homeroom };
      }
    } else if (friP4Index !== -1 && (currentList[friP4Index].sub === 'SHL' || currentList[friP4Index].sub.toLowerCase().includes('sinh hoạt'))) {
      if (currentList[friP4Index].teacher !== homeroom) {
        currentList[friP4Index] = { ...currentList[friP4Index], teacher: homeroom, sub: 'SHL' };
      }
    }

    result[classId] = currentList;
  }
  return result;
};

export default function App(props: AppProps) {
  const { workspaceId, userId, userEmail, memberRole, initialWorkspace, onInviteMember, onLogout } = props;
  // Navigation & Class selector
  const [currentTab, setCurrentTab] = useState<TabType>('timetable');
  const [selectedGrade, setSelectedGrade] = useState<number>(10);
  const [selectedClassId, setSelectedClassId] = useState<string>('10A1');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core Data
  const [classes, setClasses] = useState<SchoolClass[]>(() => initialWorkspace.payload.classes.map(c => ({
    ...c,
    session: (c.session === 1 || c.session === 2) ? 'full_day' : (c.session || 'full_day'),
  })));
  const [teachers, setTeachers] = useState<Teacher[]>(() => initialWorkspace.payload.teachers);
  const [subjectsConfig, setSubjectsConfig] = useState<Record<string, SubjectConfig>>(() => initialWorkspace.payload.subjectsConfig);
  const [allTimetables, setAllTimetables] = useState<Record<string, TimetableEntry[]>>(() =>
    standardizeDefaultSpecialSlots(initialWorkspace.payload.allTimetables, initialWorkspace.payload.classes)
  );

  // Settings
  const [departmentName, setDepartmentName] = useState(initialWorkspace.payload.departmentName);
  const [schoolName, setSchoolName] = useState(initialWorkspace.payload.schoolName);
  const [academicYear, setAcademicYear] = useState(initialWorkspace.payload.academicYear);
  const [periodsPerSession, setPeriodsPerSession] = useState(initialWorkspace.payload.periodsPerSession);
  const [syncStatus, setSyncStatus] = useState('Đã đồng bộ');
  const [saveRevision, setSaveRevision] = useState(0);
  const versionRef = useRef(initialWorkspace.version);
  const initializedSyncRef = useRef(false);
  const saveImmediatelyRef = useRef(false);
  const skipNextSyncRef = useRef(false);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const channel = client
      .channel(`workspace:${workspaceId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'school_workspaces',
        filter: `id=eq.${workspaceId}`,
      }, ({ new: row }) => {
        const updated = row as WorkspaceRecord & { updated_by?: string };
        if (updated.version <= versionRef.current) return;
        versionRef.current = updated.version;
        if (updated.updated_by === userId) return;

        skipNextSyncRef.current = true;
        setClasses(updated.payload.classes);
        setTeachers(updated.payload.teachers);
        setSubjectsConfig(updated.payload.subjectsConfig);
        setAllTimetables(updated.payload.allTimetables);
        setDepartmentName(updated.payload.departmentName);
        setSchoolName(updated.payload.schoolName);
        setAcademicYear(updated.payload.academicYear);
        setPeriodsPerSession(updated.payload.periodsPerSession);
        setSyncStatus('Vừa nhận cập nhật mới');
      })
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [workspaceId, userId]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    if (!initializedSyncRef.current) {
      initializedSyncRef.current = true;
      return;
    }
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }

    const payload = {
      classes,
      teachers,
      subjectsConfig,
      allTimetables,
      departmentName,
      schoolName,
      academicYear,
      periodsPerSession,
    };
    const delay = saveImmediatelyRef.current ? 0 : 650;
    saveImmediatelyRef.current = false;
    setSyncStatus('Đang đồng bộ...');

    const timeout = window.setTimeout(async () => {
      const nextVersion = versionRef.current + 1;
      const { data, error } = await client
        .from('school_workspaces')
        .update({ payload, version: nextVersion, updated_by: userId, updated_at: new Date().toISOString() })
        .eq('id', workspaceId)
        .eq('version', versionRef.current)
        .select('version')
        .maybeSingle();

      if (error) {
        setSyncStatus('Lỗi đồng bộ');
        showToast(`Không thể đồng bộ dữ liệu: ${error.message}`);
        return;
      }
      if (!data) {
        const { data: latest } = await client
          .from('school_workspaces')
          .select('payload,version')
          .eq('id', workspaceId)
          .single();
        if (latest) {
          versionRef.current = latest.version;
          skipNextSyncRef.current = true;
          setClasses(latest.payload.classes);
          setTeachers(latest.payload.teachers);
          setSubjectsConfig(latest.payload.subjectsConfig);
          setAllTimetables(latest.payload.allTimetables);
          setDepartmentName(latest.payload.departmentName);
          setSchoolName(latest.payload.schoolName);
          setAcademicYear(latest.payload.academicYear);
          setPeriodsPerSession(latest.payload.periodsPerSession);
        }
        setSyncStatus('Có chỉnh sửa đồng thời; đã tải bản mới nhất');
        return;
      }

      versionRef.current = data.version;
      setSyncStatus('Đã đồng bộ');
      setIsSavedJustNow(true);
      window.setTimeout(() => setIsSavedJustNow(false), 1800);
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [
    workspaceId, userId, classes, teachers, subjectsConfig, allTimetables,
    departmentName, schoolName, academicYear, periodsPerSession, saveRevision,
  ]);

  // UX Feedback
  const [isSavedJustNow, setIsSavedJustNow] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [printModalMode, setPrintModalMode] = useState<PrintMode>('all_classes');
  const [quickAddSlot, setQuickAddSlot] = useState<{ day: number; session: SessionType; period: number } | null>(null);

  const [conflictModalData, setConflictModalData] = useState<{
    teacher: string;
    day: number;
    session: SessionType;
    period: number;
    conflictingClass: string;
    conflictingSubject: string;
    currentClass: string;
  } | null>(null);

  const [substituteModalData, setSubstituteModalData] = useState<{
    day: number;
    session: SessionType;
    period: number;
    sub: string;
    teacher: string;
  } | null>(null);

  // Quick Homeroom assignment modal state
  const [quickHomeroomClassId, setQuickHomeroomClassId] = useState<string | null>(null);
  const [quickHomeroomSyncSHL, setQuickHomeroomSyncSHL] = useState(true);
  const [quickHomeroomSearch, setQuickHomeroomSearch] = useState('');

  // Data Cleaning modal and undo snapshot state
  const [isDataCleaningOpen, setIsDataCleaningOpen] = useState(false);
  const [cleaningSnapshot, setCleaningSnapshot] = useState<{
    classes: SchoolClass[];
    teachers: Teacher[];
    subjectsConfig: Record<string, SubjectConfig>;
    allTimetables: Record<string, TimetableEntry[]>;
  } | null>(null);

  // Clear Timetable modal and backup snapshot state
  const [isClearTimetableOpen, setIsClearTimetableOpen] = useState(false);
  const [lastClearedBackup, setLastClearedBackup] = useState<Record<string, TimetableEntry[]> | null>(null);

  // Health diagnosis of the entire school database
  const healthReport = scanDataHealth(classes, teachers, subjectsConfig, allTimetables);

  // Current active class timetable
  const currentTimetable = allTimetables[selectedClassId] || [];

  // Count total conflicts in current class
  let currentClassConflictsCount = 0;
  currentTimetable.forEach(item => {
    const res = checkTeacherConflict(item.teacher, selectedClassId, item.day, item.session, item.period, allTimetables);
    if (res.hasConflict) {
      currentClassConflictsCount++;
    }
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const handleSaveTimetable = () => {
    saveImmediatelyRef.current = true;
    setSaveRevision(revision => revision + 1);
    showToast(`Đang đồng bộ thời khóa biểu lớp ${selectedClassId}...`);
  };

  const handleInviteMember = async () => {
    if (memberRole !== 'admin') return;
    const memberEmail = window.prompt('Nhập email đã đăng ký EduFlow cần mời vào trường:');
    if (!memberEmail?.trim()) return;
    if (await onInviteMember(memberEmail)) {
      showToast(`Đã mời ${memberEmail.trim()} vào workspace.`);
    }
  };

  // Reset to original demo data
  const handleResetDemo = () => {
    setAllTimetables(JSON.parse(JSON.stringify(INITIAL_ALL_TIMETABLES)));
    setClasses(INITIAL_CLASSES);
    setTeachers(INITIAL_TEACHERS);
    setSubjectsConfig(INITIAL_SUBJECTS);
    showToast('Đã tải lại toàn bộ dữ liệu mẫu ban đầu!');
  };

  // Apply data cleaning results with automatic undo snapshot
  const handleApplyCleaning = (
    cleanedData: {
      classes: SchoolClass[];
      teachers: Teacher[];
      subjectsConfig: Record<string, SubjectConfig>;
      allTimetables: Record<string, TimetableEntry[]>;
    },
    summary: CleaningSummary
  ) => {
    // Save snapshot for undo
    setCleaningSnapshot({
      classes: JSON.parse(JSON.stringify(classes)),
      teachers: JSON.parse(JSON.stringify(teachers)),
      subjectsConfig: JSON.parse(JSON.stringify(subjectsConfig)),
      allTimetables: JSON.parse(JSON.stringify(allTimetables)),
    });

    setClasses(cleanedData.classes);
    setTeachers(cleanedData.teachers);
    setSubjectsConfig(cleanedData.subjectsConfig);
    setAllTimetables(cleanedData.allTimetables);

    showToast('Đã làm sạch và chuẩn hóa dữ liệu thành công!');
  };

  // Undo last data cleaning action
  const handleUndoCleaning = () => {
    if (!cleaningSnapshot) return;

    setClasses(cleaningSnapshot.classes);
    setTeachers(cleaningSnapshot.teachers);
    setSubjectsConfig(cleaningSnapshot.subjectsConfig);
    setAllTimetables(cleaningSnapshot.allTimetables);

    setCleaningSnapshot(null);
    showToast('Đã hoàn tác dữ liệu về nguyên trạng trước khi làm sạch!');
  };

  // Download pre-clean JSON backup
  const handleExportBackupJSON = () => {
    const backupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      classes,
      teachers,
      subjectsConfig,
      allTimetables,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `EduFlow_SaoLuu_TruocLamSach_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Drag and drop or Swap logic
  const handleMoveOrSwap = (
    source: { isNew?: boolean; sub?: string; teacher?: string; day?: number; session?: SessionType; period?: number },
    target: { day: number; session: SessionType; period: number }
  ) => {
    const list = [...(allTimetables[selectedClassId] || [])];
    const targetIndex = list.findIndex(
      (i) => i.day === target.day && i.session === target.session && i.period === target.period
    );

    let placedTeacher = '';
    let placedSubject = '';

    if (source.isNew) {
      // New subject dropped from Palette
      placedTeacher = source.teacher || '';
      placedSubject = source.sub || '';

      const newItem: TimetableEntry = {
        day: target.day,
        session: target.session,
        period: target.period,
        sub: placedSubject,
        teacher: placedTeacher,
      };

      if (targetIndex >= 0) {
        list[targetIndex] = newItem;
      } else {
        list.push(newItem);
      }
    } else if (source.day !== undefined && source.session !== undefined && source.period !== undefined) {
      // Existing item inside timetable being dragged
      const sourceIndex = list.findIndex(
        (i) => i.day === source.day && i.session === source.session && i.period === source.period
      );

      if (sourceIndex < 0) return;

      const sourceItem = { ...list[sourceIndex] };
      placedTeacher = sourceItem.teacher;
      placedSubject = sourceItem.sub;

      if (targetIndex >= 0) {
        // Swap slots
        const targetItem = { ...list[targetIndex] };
        sourceItem.day = target.day;
        sourceItem.session = target.session;
        sourceItem.period = target.period;

        targetItem.day = source.day;
        targetItem.session = source.session;
        targetItem.period = source.period;

        list[sourceIndex] = targetItem;
        list[targetIndex] = sourceItem;
      } else {
        // Move to empty slot
        sourceItem.day = target.day;
        sourceItem.session = target.session;
        sourceItem.period = target.period;
        list[sourceIndex] = sourceItem;
      }
    }

    const updatedAll = {
      ...allTimetables,
      [selectedClassId]: list,
    };
    setAllTimetables(updatedAll);

    // Check conflict immediately for the newly placed teacher
    if (placedTeacher) {
      const conflictRes = checkTeacherConflict(
        placedTeacher,
        selectedClassId,
        target.day,
        target.session,
        target.period,
        updatedAll
      );

      if (conflictRes.hasConflict) {
        setConflictModalData({
          teacher: placedTeacher,
          day: target.day,
          session: target.session,
          period: target.period,
          conflictingClass: conflictRes.conflictingClass || '',
          conflictingSubject: conflictRes.conflictingSubject || placedSubject,
          currentClass: selectedClassId,
        });
      }
    }
  };

  // Delete a subject slot with undo backup
  const handleDeleteSlot = (day: number, session: SessionType, period: number) => {
    const currentList = allTimetables[selectedClassId] || [];
    const itemToDelete = currentList.find(
      (item) => item.day === day && item.session === session && item.period === period
    );
    if (!itemToDelete) return;

    // Save snapshot for undo
    setLastClearedBackup(JSON.parse(JSON.stringify(allTimetables)));

    const list = currentList.filter(
      (item) => !(item.day === day && item.session === session && item.period === period)
    );
    const updatedAll = {
      ...allTimetables,
      [selectedClassId]: list,
    };
    setAllTimetables(updatedAll);
    showToast(`Đã xóa môn ${itemToDelete.sub} (Thứ ${day}, Tiết ${period})!`);
  };

  // Clear timetable according to scope and options
  const handleClearTimetable = (options: ClearTimetableOptions) => {
    // Save snapshot for undo
    setLastClearedBackup(JSON.parse(JSON.stringify(allTimetables)));

    const isSpecialSlot = (slot: TimetableEntry) => {
      const isChaoCo = (slot.day === 2 && slot.session === 1 && slot.period === 1) || 
                       slot.sub.toLowerCase().includes('chào cờ') || 
                       slot.sub.toLowerCase() === 'cc';
      const isSHL = slot.sub.toLowerCase().includes('sinh hoạt') || 
                    slot.sub.toUpperCase() === 'SHL';
      return isChaoCo || isSHL;
    };

    const newAll: Record<string, TimetableEntry[]> = { ...allTimetables };
    let clearedCount = 0;

    let targetClassIds: string[] = [];
    if (options.scope === 'current_class') {
      targetClassIds = [options.targetClassId || selectedClassId];
    } else if (options.scope === 'all_school') {
      targetClassIds = classes.map((c) => c.id);
    } else if (options.scope === 'grade') {
      targetClassIds = classes.filter((c) => c.grade === options.targetGrade).map((c) => c.id);
    } else if (options.scope === 'session') {
      targetClassIds = classes.map((c) => c.id);
    }

    targetClassIds.forEach((cId) => {
      const list = newAll[cId] || [];
      const remaining: TimetableEntry[] = [];
      list.forEach((slot) => {
        if (options.scope === 'session' && slot.session !== options.targetSession) {
          remaining.push(slot);
          return;
        }
        if (options.keepSpecialSlots && isSpecialSlot(slot)) {
          remaining.push(slot);
        } else {
          clearedCount++;
        }
      });
      newAll[cId] = remaining;
    });

    setAllTimetables(newAll);
    showToast(`Đã xóa thành công ${clearedCount} tiết thời khóa biểu!`);
  };

  // Undo last clear
  const handleUndoClearTimetable = () => {
    if (!lastClearedBackup) return;
    setAllTimetables(lastClearedBackup);
    setLastClearedBackup(null);
    showToast('Đã khôi phục lại thời khóa biểu vừa xóa thành công!');
  };

  // Open substitute modal
  const handleOpenSubstituteModal = (
    sub: string,
    teacher: string,
    day: number,
    session: SessionType,
    period: number
  ) => {
    setSubstituteModalData({
      day,
      session,
      period,
      sub,
      teacher,
    });
  };

  // Assign substitute teacher
  const handleAssignSubstitute = (newTeacherName: string) => {
    if (!substituteModalData) return;

    const list = [...(allTimetables[selectedClassId] || [])];
    const index = list.findIndex(
      (i) =>
        i.day === substituteModalData.day &&
        i.session === substituteModalData.session &&
        i.period === substituteModalData.period
    );

    if (index >= 0) {
      list[index] = {
        ...list[index],
        teacher: newTeacherName,
      };
      setAllTimetables({
        ...allTimetables,
        [selectedClassId]: list,
      });
      showToast(`Đã đổi sang giáo viên: ${newTeacherName}`);
    }

    setSubstituteModalData(null);
  };

  // Update Homeroom Teacher for a class
  const handleUpdateHomeroomTeacher = (classId: string, teacherName: string, syncSHL: boolean) => {
    const updatedClasses = classes.map(c => c.id === classId ? { ...c, homeroomTeacher: teacherName } : c);
    setClasses(updatedClasses);

    if (syncSHL && allTimetables[classId]) {
      let updatedClassTimetable = [...allTimetables[classId]];
      const shlIndex = updatedClassTimetable.findIndex(s => s.sub === 'SHL' || s.sub.toLowerCase().includes('sinh hoạt'));
      const friP4Index = updatedClassTimetable.findIndex(s => s.day === 6 && s.session === 1 && s.period === 4);

      if (shlIndex !== -1) {
        if (shlIndex !== friP4Index) {
          if (friP4Index !== -1) {
            const prevFri = updatedClassTimetable[friP4Index];
            const prevSHL = updatedClassTimetable[shlIndex];
            updatedClassTimetable[friP4Index] = { ...prevSHL, day: 6, session: 1, period: 4, teacher: teacherName, sub: 'SHL' };
            updatedClassTimetable[shlIndex] = { ...prevFri, day: prevSHL.day, session: prevSHL.session, period: prevSHL.period };
          } else {
            updatedClassTimetable[shlIndex] = { ...updatedClassTimetable[shlIndex], day: 6, session: 1, period: 4, teacher: teacherName, sub: 'SHL' };
          }
        } else {
          updatedClassTimetable[shlIndex] = { ...updatedClassTimetable[shlIndex], teacher: teacherName, sub: 'SHL' };
        }
      } else {
        if (friP4Index !== -1) {
          updatedClassTimetable[friP4Index] = { ...updatedClassTimetable[friP4Index], sub: 'SHL', teacher: teacherName };
        } else {
          updatedClassTimetable.push({ day: 6, session: 1, period: 4, sub: 'SHL', teacher: teacherName });
        }
      }

      const updatedAll = { ...allTimetables, [classId]: updatedClassTimetable };
      setAllTimetables(updatedAll);
    }

    showToast(`Đã phân công ${teacherName} làm GVCN lớp ${classId}${syncSHL ? ' (SHL cố định Sáng Thứ 6 Tiết 4)' : ''}!`);
  };

  const handleBatchUpdateHomeroom = (newClasses: SchoolClass[], syncAllSHL: boolean) => {
    setClasses(newClasses);

    if (syncAllSHL) {
      const updatedAll = { ...allTimetables };
      newClasses.forEach(c => {
        if (updatedAll[c.id] && c.homeroomTeacher && c.homeroomTeacher !== 'Chưa phân công') {
          let updatedList = [...updatedAll[c.id]];
          const shlIndex = updatedList.findIndex(s => s.sub === 'SHL' || s.sub.toLowerCase().includes('sinh hoạt'));
          const friP4Index = updatedList.findIndex(s => s.day === 6 && s.session === 1 && s.period === 4);

          if (shlIndex !== -1) {
            if (shlIndex !== friP4Index) {
              if (friP4Index !== -1) {
                const prevFri = updatedList[friP4Index];
                const prevSHL = updatedList[shlIndex];
                updatedList[friP4Index] = { ...prevSHL, day: 6, session: 1, period: 4, teacher: c.homeroomTeacher, sub: 'SHL' };
                updatedList[shlIndex] = { ...prevFri, day: prevSHL.day, session: prevSHL.session, period: prevSHL.period };
              } else {
                updatedList[shlIndex] = { ...updatedList[shlIndex], day: 6, session: 1, period: 4, teacher: c.homeroomTeacher, sub: 'SHL' };
              }
            } else {
              updatedList[shlIndex] = { ...updatedList[shlIndex], teacher: c.homeroomTeacher, sub: 'SHL' };
            }
          } else {
            if (friP4Index !== -1) {
              updatedList[friP4Index] = { ...updatedList[friP4Index], sub: 'SHL', teacher: c.homeroomTeacher };
            } else {
              updatedList.push({ day: 6, session: 1, period: 4, sub: 'SHL', teacher: c.homeroomTeacher });
            }
          }
          updatedAll[c.id] = updatedList;
        }
      });
      setAllTimetables(updatedAll);
    }

    showToast('Đã tự động xếp GVCN và đồng bộ tiết SHL (Sáng Thứ 6 Tiết 4) toàn trường!');
  };

  // Update subject teacher for class (Teaching Assignment)
  const handleUpdateSubjectTeacherForClass = (
    classId: string,
    subjectName: string,
    teacherName: string,
    syncTimetable: boolean
  ) => {
    if (syncTimetable && allTimetables[classId]) {
      const updatedClassTimetable = allTimetables[classId].map(slot => {
        if (slot.sub === subjectName) {
          return { ...slot, teacher: teacherName };
        }
        return slot;
      });
      const updatedAll = { ...allTimetables, [classId]: updatedClassTimetable };
      setAllTimetables(updatedAll);
    }
    showToast(`Đã phân công ${teacherName} dạy môn ${subjectName} lớp ${classId}!`);
  };

  const handleBatchUpdateTeachingAssignments = (
    assignments: Record<string, Record<string, string>>,
    syncAllTimetables: boolean
  ) => {
    if (syncAllTimetables) {
      const updatedAll = { ...allTimetables };
      for (const [classId, classAssignments] of Object.entries(assignments)) {
        if (updatedAll[classId]) {
          updatedAll[classId] = updatedAll[classId].map(slot => {
            if (classAssignments[slot.sub]) {
              return { ...slot, teacher: classAssignments[slot.sub] };
            }
            return slot;
          });
        }
      }
      setAllTimetables(updatedAll);
    }
    showToast('Đã tự động phân công chuyên môn và cập nhật thời khóa biểu!');
  };

  // Quick add from empty slot click
  const handleConfirmQuickAdd = (sub: string, teacher: string) => {
    if (!quickAddSlot) return;
    handleMoveOrSwap(
      { isNew: true, sub, teacher },
      { day: quickAddSlot.day, session: quickAddSlot.session, period: quickAddSlot.period }
    );
    setQuickAddSlot(null);
  };

  const handleShowConflictDetails = (
    teacher: string,
    day: number,
    session: SessionType,
    period: number,
    conflict: TeacherConflictResult
  ) => {
    const currentItem = currentTimetable.find(i => i.day === day && i.session === session && i.period === period);
    setConflictModalData({
      teacher,
      day,
      session,
      period,
      conflictingClass: conflict.conflictingClass || '',
      conflictingSubject: conflict.conflictingSubject || currentItem?.sub || 'Môn học',
      currentClass: selectedClassId,
    });
  };

  // Calculate available substitutes for the active substitute modal
  const availableSubstitutes = substituteModalData
    ? findAvailableSubstitutes(
        substituteModalData.sub,
        substituteModalData.teacher,
        substituteModalData.day,
        substituteModalData.session,
        substituteModalData.period,
        allTimetables,
        teachers,
        subjectsConfig
      )
    : [];

  const currentClassObj = classes.find(c => c.id === selectedClassId);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 antialiased font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-60 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-slide-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{toastMessage}</span>
          {lastClearedBackup && (
            <button
              onClick={handleUndoClearTimetable}
              className="ml-1.5 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Hoàn tác</span>
            </button>
          )}
        </div>
      )}

      {/* Sidebar for Desktop */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setIsMobileMenuOpen(false);
        }}
        subjectsConfig={subjectsConfig}
        teachers={teachers}
        totalConflicts={currentClassConflictsCount}
        onDragStartSubjectPalette={() => {}}
        onOpenDataCleaning={() => setIsDataCleaningOpen(true)}
        onOpenClearTimetable={() => setIsClearTimetableOpen(true)}
        healthIssuesCount={healthReport.totalIssuesCount}
      />

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-72 bg-white h-full z-10 flex flex-col shadow-2xl">
            <Sidebar
              currentTab={currentTab}
              onSelectTab={(tab) => {
                setCurrentTab(tab);
                setIsMobileMenuOpen(false);
              }}
              subjectsConfig={subjectsConfig}
              teachers={teachers}
              totalConflicts={currentClassConflictsCount}
              onDragStartSubjectPalette={() => {}}
              onOpenDataCleaning={() => {
                setIsDataCleaningOpen(true);
                setIsMobileMenuOpen(false);
              }}
              onOpenClearTimetable={() => {
                setIsClearTimetableOpen(true);
                setIsMobileMenuOpen(false);
              }}
              healthIssuesCount={healthReport.totalIssuesCount}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Top Header */}
        <Header
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          classes={classes}
          selectedClassId={selectedClassId}
          onSelectClass={setSelectedClassId}
          selectedGrade={selectedGrade}
          onSelectGrade={setSelectedGrade}
          onResetDemo={handleResetDemo}
          onSaveTimetable={handleSaveTimetable}
          syncStatus={syncStatus}
          userEmail={userEmail}
          memberRole={memberRole}
          onInviteMember={() => void handleInviteMember()}
          onLogout={onLogout}
          onPrint={() => {
            setPrintModalMode('single');
            setIsPrintOpen(true);
          }}
          onPrintAllPDF={() => {
            setPrintModalMode('all_classes');
            setIsPrintOpen(true);
          }}
          onOpenDataCleaning={() => setIsDataCleaningOpen(true)}
          onOpenClearTimetable={() => setIsClearTimetableOpen(true)}
          healthIssuesCount={healthReport.totalIssuesCount}
          isSavedJustNow={isSavedJustNow}
          totalConflicts={currentClassConflictsCount}
          totalPeriodsCount={currentTimetable.length}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onOpenQuickAssignHomeroom={() => setQuickHomeroomClassId(selectedClassId)}
        />

        {/* Tab 1: Timetable Editor */}
        {currentTab === 'timetable' && (
          <TimetableGrid
            currentClassId={selectedClassId}
            timetable={currentTimetable}
            allTimetables={allTimetables}
            subjectsConfig={subjectsConfig}
            periodsPerSession={periodsPerSession}
            onMoveOrSwap={handleMoveOrSwap}
            onDeleteSlot={handleDeleteSlot}
            onOpenSubstituteModal={handleOpenSubstituteModal}
            onQuickAddSubject={(day, session, period) => {
              setQuickAddSlot({ day, session, period });
            }}
            onShowConflictDetails={handleShowConflictDetails}
            onOpenClearTimetableModal={() => setIsClearTimetableOpen(true)}
          />
        )}

        {/* Tab 2: Teachers Management */}
        {currentTab === 'teachers' && (
          <TeacherManagement
            teachers={teachers}
            allTimetables={allTimetables}
            classes={classes}
            onAddTeacher={(newT) => {
              const updated = [...teachers, newT];
              setTeachers(updated);
              showToast(`Đã thêm giáo viên: ${newT.name}`);
            }}
            onNavigateToTeachingAssignment={() => setCurrentTab('teaching_assignment')}
          />
        )}

        {/* Tab 3: Classes Management */}
        {currentTab === 'classes' && (
          <ClassManagement
            classes={classes}
            teachers={teachers}
            allTimetables={allTimetables}
            onSelectClassToEdit={(classId) => {
              setSelectedClassId(classId);
              const target = classes.find(c => c.id === classId);
              if (target) setSelectedGrade(target.grade);
              setCurrentTab('timetable');
            }}
            onAddClass={(newC) => {
              const updated = [...classes, newC];
              setClasses(updated);
              showToast(`Đã thêm lớp ${newC.name}`);
            }}
            onNavigateToHomeroom={() => setCurrentTab('homeroom')}
            onUpdateHomeroomTeacher={handleUpdateHomeroomTeacher}
            onPrintAllPDF={() => {
              setPrintModalMode('all_classes');
              setIsPrintOpen(true);
            }}
            onOpenClearTimetable={(cId) => {
              if (cId) setSelectedClassId(cId);
              setIsClearTimetableOpen(true);
            }}
          />
        )}

        {/* Tab: Homeroom Teacher Scheduling */}
        {currentTab === 'homeroom' && (
          <HomeroomManagement
            classes={classes}
            teachers={teachers}
            allTimetables={allTimetables}
            onUpdateHomeroomTeacher={handleUpdateHomeroomTeacher}
            onBatchUpdateHomeroom={handleBatchUpdateHomeroom}
            onNavigateToClassTimetable={(classId) => {
              setSelectedClassId(classId);
              const target = classes.find(c => c.id === classId);
              if (target) setSelectedGrade(target.grade);
              setCurrentTab('timetable');
            }}
          />
        )}

        {/* Tab: Teaching Assignments (Phân công chuyên môn) */}
        {currentTab === 'teaching_assignment' && (
          <TeachingAssignmentManagement
            classes={classes}
            teachers={teachers}
            subjectsConfig={subjectsConfig}
            allTimetables={allTimetables}
            onUpdateSubjectTeacherForClass={handleUpdateSubjectTeacherForClass}
            onBatchUpdateTeachingAssignments={handleBatchUpdateTeachingAssignments}
            onNavigateToClassTimetable={(classId) => {
              setSelectedClassId(classId);
              const target = classes.find(c => c.id === classId);
              if (target) setSelectedGrade(target.grade);
              setCurrentTab('timetable');
            }}
          />
        )}

        {/* Tab 4: Import / Export */}
        {currentTab === 'data' && (
          <DataImportExport
            currentClassId={selectedClassId}
            classes={classes}
            allTimetables={allTimetables}
            teachers={teachers}
            subjectsConfig={subjectsConfig}
            onPrint={() => {
              setPrintModalMode('single');
              setIsPrintOpen(true);
            }}
            onPrintAllPDF={() => {
              setPrintModalMode('all_classes');
              setIsPrintOpen(true);
            }}
            onOpenDataCleaning={() => setIsDataCleaningOpen(true)}
            onOpenClearTimetable={() => setIsClearTimetableOpen(true)}
            onResetFactoryDemo={handleResetDemo}
            onImportBackup={(data) => {
              if (data.classes) setClasses(data.classes);
              if (data.teachers) setTeachers(data.teachers);
              if (data.subjectsConfig) setSubjectsConfig(data.subjectsConfig);
              if (data.allTimetables) setAllTimetables(data.allTimetables);
              showToast('Phục hồi dữ liệu từ bản sao lưu thành công!');
            }}
          />
        )}

        {/* Tab 5: Settings */}
        {currentTab === 'settings' && (
          <SettingsView
            schoolName={schoolName}
            setSchoolName={setSchoolName}
            departmentName={departmentName}
            setDepartmentName={setDepartmentName}
            academicYear={academicYear}
            setAcademicYear={setAcademicYear}
            periodsPerSession={periodsPerSession}
            setPeriodsPerSession={setPeriodsPerSession}
          />
        )}
      </main>

      {/* Substitute Teacher Modal */}
      <SubstituteModal
        isOpen={!!substituteModalData}
        onClose={() => setSubstituteModalData(null)}
        targetSlot={substituteModalData}
        availableTeachers={availableSubstitutes}
        subjectsConfig={subjectsConfig}
        onSelectTeacher={handleAssignSubstitute}
      />

      {/* Conflict Alert Modal */}
      <ConflictModal
        isOpen={!!conflictModalData}
        onClose={() => setConflictModalData(null)}
        conflictDetails={conflictModalData}
        onOpenSubstituteModal={() => {
          if (conflictModalData) {
            handleOpenSubstituteModal(
              conflictModalData.conflictingSubject,
              conflictModalData.teacher,
              conflictModalData.day,
              conflictModalData.session,
              conflictModalData.period
            );
          }
        }}
      />

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={!!quickAddSlot}
        onClose={() => setQuickAddSlot(null)}
        targetSlot={quickAddSlot}
        currentClass={currentClassObj}
        subjectsConfig={subjectsConfig}
        teachers={teachers}
        onAddSubject={handleConfirmQuickAdd}
      />

      {/* Print Preview Modal */}
      <PrintTimetableModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        currentClass={currentClassObj}
        classes={classes}
        allTimetables={allTimetables}
        timetable={currentTimetable}
        schoolName={schoolName}
        departmentName={departmentName}
        academicYear={academicYear}
        periodsPerSession={periodsPerSession}
        initialMode={printModalMode}
      />

      {/* Data Cleaning & Optimization Modal */}
      <DataCleaningModal
        isOpen={isDataCleaningOpen}
        onClose={() => setIsDataCleaningOpen(false)}
        classes={classes}
        teachers={teachers}
        subjectsConfig={subjectsConfig}
        allTimetables={allTimetables}
        onApplyCleaning={handleApplyCleaning}
        hasUndoSnapshot={!!cleaningSnapshot}
        onUndoCleaning={handleUndoCleaning}
        onExportBackupJSON={handleExportBackupJSON}
      />

      {/* Clear Timetable Modal */}
      <ClearTimetableModal
        isOpen={isClearTimetableOpen}
        onClose={() => setIsClearTimetableOpen(false)}
        classes={classes}
        selectedClassId={selectedClassId}
        allTimetables={allTimetables}
        onConfirmClear={handleClearTimetable}
        onUndoLastClear={handleUndoClearTimetable}
        hasUndoableBackup={lastClearedBackup !== null}
      />

      {/* Quick Homeroom Assignment Modal */}
      {quickHomeroomClassId && (() => {
        const targetClass = classes.find(c => c.id === quickHomeroomClassId);
        if (!targetClass) return null;

        const filteredTeacherList = teachers
          .filter(t => t.name !== 'BGH & Đoàn trường' && t.name !== 'GVCN')
          .filter(t => 
            t.name.toLowerCase().includes(quickHomeroomSearch.toLowerCase()) ||
            t.dept.toLowerCase().includes(quickHomeroomSearch.toLowerCase())
          );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] border border-slate-200">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Đổi GVCN: {targetClass.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Đang gán: <strong>{targetClass.homeroomTeacher || 'Chưa phân công'}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setQuickHomeroomClassId(null);
                    setQuickHomeroomSearch('');
                  }}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-slate-50/70 border-b border-slate-200 space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm giáo viên theo họ tên, tổ..."
                    value={quickHomeroomSearch}
                    onChange={(e) => setQuickHomeroomSearch(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={quickHomeroomSyncSHL}
                    onChange={(e) => setQuickHomeroomSyncSHL(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Tự động cập nhật tiết Sinh hoạt lớp (SHL) của {targetClass.name} theo GVCN này</span>
                </label>
              </div>

              <div className="p-4 overflow-y-auto flex-1 space-y-1.5">
                {filteredTeacherList.map(teacher => {
                  const isCurrent = targetClass.homeroomTeacher === teacher.name;
                  const otherClass = classes.find(c => c.homeroomTeacher === teacher.name && c.id !== targetClass.id);

                  return (
                    <div
                      key={teacher.id}
                      onClick={() => {
                        handleUpdateHomeroomTeacher(targetClass.id, teacher.name, quickHomeroomSyncSHL);
                        setQuickHomeroomClassId(null);
                        setQuickHomeroomSearch('');
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50/80 font-bold'
                          : otherClass
                          ? 'border-amber-200 bg-amber-50/40 hover:bg-amber-50'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                          <span>{teacher.name}</span>
                          <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            Tổ {teacher.dept}
                          </span>
                        </div>
                        {otherClass && (
                          <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                            * Đang chủ nhiệm lớp {otherClass.name}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                          isCurrent
                            ? 'bg-blue-600 text-white'
                            : otherClass
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white'
                        }`}
                      >
                        {isCurrent ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Đang chọn
                          </>
                        ) : (
                          'Chọn'
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateHomeroomTeacher(targetClass.id, 'Chưa phân công', false);
                    setQuickHomeroomClassId(null);
                    setQuickHomeroomSearch('');
                  }}
                  className="text-red-600 hover:text-red-800 font-semibold"
                >
                  Gỡ GVCN lớp này
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickHomeroomClassId(null);
                    setQuickHomeroomSearch('');
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
