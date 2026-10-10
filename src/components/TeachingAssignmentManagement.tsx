import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  GraduationCap, 
  Users, 
  Download, 
  Filter, 
  ChevronRight, 
  Layers, 
  Check, 
  X,
  AlertTriangle,
  UserCheck,
  Calendar
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SchoolClass, Teacher, TimetableEntry, SubjectConfig } from '../types/index.ts';
import { calculateTeacherLoad } from '../utils/conflictChecker.ts';

interface TeachingAssignmentManagementProps {
  classes: SchoolClass[];
  teachers: Teacher[];
  subjectsConfig: Record<string, SubjectConfig>;
  allTimetables: Record<string, TimetableEntry[]>;
  onUpdateSubjectTeacherForClass: (classId: string, subjectName: string, teacherName: string, syncTimetable: boolean) => void;
  onBatchUpdateTeachingAssignments: (
    assignments: Record<string, Record<string, string>>,
    syncAllTimetables: boolean
  ) => void;
  onNavigateToClassTimetable: (classId: string) => void;
}

export const TeachingAssignmentManagement: React.FC<TeachingAssignmentManagementProps> = ({
  classes,
  teachers,
  subjectsConfig,
  allTimetables,
  onUpdateSubjectTeacherForClass,
  onBatchUpdateTeachingAssignments,
  onNavigateToClassTimetable,
}) => {
  const [viewMode, setViewMode] = useState<'matrix' | 'class' | 'teacher'>('matrix');
  const [selectedGrade, setSelectedGrade] = useState<number | 'ALL'>('ALL');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '10A1');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');

  // Modal edit slot state
  const [editSlot, setEditSlot] = useState<{
    classId: string;
    subjectName: string;
    currentTeacher: string;
  } | null>(null);
  const [syncTimetableCheckbox, setSyncTimetableCheckbox] = useState(true);

  // List of standard subjects (exclude Chào cờ, SHL from teaching matrix)
  const academicSubjects = Object.values(subjectsConfig).filter(s => !s.isSpecial);
  const uniqueDepts = Array.from(new Set(academicSubjects.map(s => s.dept)));

  // Derive teaching assignments from existing timetables and subjectConfig defaults
  // Map: [classId][subjectName] -> teacherName
  const getSubjectTeacherForClass = (classId: string, subjectName: string): string => {
    const classTimetable = allTimetables[classId] || [];
    const foundSlot = classTimetable.find(item => item.sub === subjectName && item.teacher && item.teacher !== 'Chưa phân công');
    if (foundSlot) return foundSlot.teacher;
    return subjectsConfig[subjectName]?.defaultTeacher || 'Chưa phân công';
  };

  // Filtered classes
  const filteredClasses = classes.filter(c => {
    const matchesGrade = selectedGrade === 'ALL' || c.grade === selectedGrade;
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGrade && matchesSearch;
  });

  // Filtered subjects
  const filteredSubjects = academicSubjects.filter(s => {
    const matchesDept = selectedDeptFilter === 'ALL' || s.dept === selectedDeptFilter;
    return matchesDept;
  });

  // Eligible teachers for a subject
  const getEligibleTeachersForSubject = (subjectName: string) => {
    const subObj = subjectsConfig[subjectName];
    if (!subObj) return teachers;
    // Match by department or subject name
    const deptTeachers = teachers.filter(t => 
      t.name !== 'BGH & Đoàn trường' && 
      t.name !== 'GVCN' &&
      (t.dept === subObj.dept || subObj.dept.includes(t.dept) || t.dept.includes(subObj.dept))
    );
    if (deptTeachers.length > 0) return deptTeachers;
    return teachers.filter(t => t.name !== 'BGH & Đoàn trường' && t.name !== 'GVCN');
  };

  // Auto assign balanced teaching assignments
  const handleAutoAssignTeaching = () => {
    const newAssignments: Record<string, Record<string, string>> = {};

    // For each academic subject, balance across eligible teachers
    academicSubjects.forEach(subject => {
      const eligible = getEligibleTeachersForSubject(subject.name);
      if (eligible.length === 0) return;

      // Sort by workload ascending
      const sorted = [...eligible].sort((a, b) => {
        const loadA = calculateTeacherLoad(a.name, allTimetables);
        const loadB = calculateTeacherLoad(b.name, allTimetables);
        return loadA - loadB;
      });

      let teacherIdx = 0;
      classes.forEach(c => {
        if (!newAssignments[c.id]) newAssignments[c.id] = {};
        const chosenTeacher = sorted[teacherIdx % sorted.length];
        newAssignments[c.id][subject.name] = chosenTeacher.name;
        teacherIdx++;
      });
    });

    onBatchUpdateTeachingAssignments(newAssignments, true);
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportRows: any[] = [];

    classes.forEach(c => {
      academicSubjects.forEach(s => {
        const teacher = getSubjectTeacherForClass(c.id, s.name);
        exportRows.push({
          'Khối': c.grade,
          'Mã Lớp': c.id,
          'Tên Lớp': c.name,
          'GVCN': c.homeroomTeacher,
          'Môn Học': s.name,
          'Tổ Chuyên Môn': s.dept,
          'Giáo Viên Giảng Dạy': teacher,
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    worksheet['!cols'] = [
      { wch: 8 },
      { wch: 10 },
      { wch: 12 },
      { wch: 22 },
      { wch: 18 },
      { wch: 20 },
      { wch: 24 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Phan_Cong_Chuyen_Mon');
    XLSX.writeFile(workbook, `Phan_Cong_Chuyen_Mon_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Count teachers teaching status
  const teachingTeachersSet = new Set<string>();
  Object.values(allTimetables).forEach(list => {
    list.forEach(slot => {
      if (slot.teacher && slot.teacher !== 'Chưa phân công' && slot.teacher !== 'BGH & Đoàn trường' && slot.teacher !== 'GVCN') {
        teachingTeachersSet.add(slot.teacher);
      }
    });
  });
  const eligibleTeachers = teachers.filter(t => t.name !== 'BGH & Đoàn trường' && t.name !== 'GVCN');
  const assignedTeachingCount = eligibleTeachers.filter(t => teachingTeachersSet.has(t.name)).length;
  const unassignedTeachingCount = eligibleTeachers.length - assignedTeachingCount;

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-50">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                Phân Công Chuyên Môn & Giảng Dạy
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  {assignedTeachingCount}/{eligibleTeachers.length} GV đã đứng lớp
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thiết lập giáo viên phụ trách từng môn học cho từng lớp ({classes.length} lớp x {academicSubjects.length} bộ môn). Tự động cập nhật thời khóa biểu.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={handleAutoAssignTeaching}
            className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-indigo-500/20 cursor-pointer"
            title="Tự động phân công giáo viên theo tổ bộ môn và cân bằng định mức tiết dạy"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Tự động phân công chuyên môn</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-emerald-600/20 cursor-pointer"
            title="Xuất bảng ma trận phân công ra file Excel"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Mini KPI stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-500 font-semibold">Tổng giáo viên chuyên môn</span>
            <div className="text-xl font-black text-slate-800">{eligibleTeachers.length} GV</div>
          </div>
          <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-emerald-700 font-semibold">Đã phân công đứng lớp</span>
            <div className="text-xl font-black text-emerald-700">
              {assignedTeachingCount} GV ({eligibleTeachers.length > 0 ? Math.round((assignedTeachingCount / eligibleTeachers.length) * 100) : 0}%)
            </div>
          </div>
          <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-amber-700 font-semibold">Chưa đứng lớp</span>
            <div className="text-xl font-black text-amber-700">
              {unassignedTeachingCount} GV ({eligibleTeachers.length > 0 ? Math.round((unassignedTeachingCount / eligibleTeachers.length) * 100) : 0}%)
            </div>
          </div>
          <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* View Mode Toggle & Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'matrix' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Ma trận Lớp × Môn</span>
          </button>
          <button
            onClick={() => setViewMode('class')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'class' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Theo từng Lớp</span>
          </button>
          <button
            onClick={() => setViewMode('teacher')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'teacher' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Theo từng Giáo viên</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {viewMode === 'matrix' && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setSelectedGrade('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedGrade === 'ALL' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Tất cả khối
              </button>
              {[10, 11, 12].map(g => (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    selectedGrade === g ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Khối {g}
                </button>
              ))}
            </div>
          )}

          {viewMode === 'matrix' && (
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-xs font-medium text-slate-700 rounded-xl px-2.5 py-1.5 outline-none"
            >
              <option value="ALL">Tất cả tổ bộ môn</option>
              {uniqueDepts.map(d => (
                <option key={d} value={d}>Tổ {d}</option>
              ))}
            </select>
          )}

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm lớp hoặc GV..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:bg-white focus:border-indigo-500 w-40 sm:w-52"
            />
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: MATRIX LỚP x MÔN */}
      {viewMode === 'matrix' && (
        <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100 shadow-2xs">
                <tr className="border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  <th className="px-3 py-3 w-28 bg-slate-100 sticky left-0 z-20 border-r border-slate-200">
                    Lớp & Khối
                  </th>
                  <th className="px-3 py-3 w-36 bg-slate-100 sticky left-28 z-20 border-r border-slate-200">
                    GVCN
                  </th>
                  {filteredSubjects.map(sub => (
                    <th key={sub.name} className="px-3 py-3 text-center border-r border-slate-200 min-w-[130px]">
                      <div>{sub.name}</div>
                      <div className="text-[9px] font-normal normal-case text-slate-400">{sub.dept}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClasses.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Class Name */}
                    <td className="px-3 py-2.5 font-bold text-slate-900 bg-white sticky left-0 z-10 border-r border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-black flex items-center justify-center text-xs">
                          {c.id}
                        </span>
                        <div>
                          <div className="font-extrabold text-xs">{c.name}</div>
                          <div className="text-[10px] text-slate-400">{c.room}</div>
                        </div>
                      </div>
                    </td>

                    {/* Homeroom teacher */}
                    <td className="px-3 py-2.5 text-slate-700 bg-white sticky left-28 z-10 border-r border-slate-200 text-xs font-semibold">
                      <div className="flex items-center gap-1 text-slate-800">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{c.homeroomTeacher || 'Chưa gán'}</span>
                      </div>
                    </td>

                    {/* Academic subjects cells */}
                    {filteredSubjects.map(sub => {
                      const teacherName = getSubjectTeacherForClass(c.id, sub.name);
                      const isAssigned = teacherName && teacherName !== 'Chưa phân công';

                      return (
                        <td
                          key={sub.name}
                          className="px-2 py-2 border-r border-slate-200 text-center cursor-pointer hover:bg-indigo-50/60 transition group"
                          onClick={() => {
                            setEditSlot({
                              classId: c.id,
                              subjectName: sub.name,
                              currentTeacher: teacherName,
                            });
                          }}
                        >
                          <div className={`p-1.5 rounded-lg border text-[11px] font-medium transition ${
                            isAssigned 
                              ? 'bg-slate-50 border-slate-200 text-slate-800 group-hover:border-indigo-400 group-hover:bg-white shadow-2xs' 
                              : 'bg-amber-50/70 border-amber-200 text-amber-700 font-normal italic'
                          }`}>
                            <div className="font-bold truncate text-[11px]">
                              {teacherName}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: THEO TỪNG LỚP */}
      {viewMode === 'class' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Class list sidebar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs max-h-[75vh] overflow-y-auto space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Chọn Lớp học ({classes.length} lớp)
            </div>
            {classes.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClassId(c.id)}
                className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between text-xs ${
                  selectedClassId === c.id
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50 font-medium'
                }`}
              >
                <div>
                  <div className="font-bold">{c.name}</div>
                  <div className={`text-[10px] ${selectedClassId === c.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                    GVCN: {c.homeroomTeacher}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-60" />
              </button>
            ))}
          </div>

          {/* Detailed subjects for selected class */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            {(() => {
              const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];
              if (!currentClass) return null;

              return (
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                    <div>
                      <h3 className="text-lg font-black text-slate-800">
                        Bảng phân công chuyên môn: {currentClass.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Phòng {currentClass.room} • GVCN: <strong>{currentClass.homeroomTeacher}</strong> • Khối {currentClass.grade}
                      </p>
                    </div>

                    <button
                      onClick={() => onNavigateToClassTimetable(currentClass.id)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Xem TKB lớp
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {academicSubjects.map(sub => {
                      const teacherName = getSubjectTeacherForClass(currentClass.id, sub.name);
                      const tObj = teachers.find(t => t.name === teacherName);
                      const load = tObj ? calculateTeacherLoad(tObj.name, allTimetables) : 0;
                      const eligible = getEligibleTeachersForSubject(sub.name);

                      return (
                        <div
                          key={sub.name}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition flex flex-col justify-between"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-800 text-xs">{sub.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                  Tổ {sub.dept}
                                </span>
                              </div>
                              <div className="text-xs font-bold text-indigo-700 mt-2 flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>{teacherName}</span>
                              </div>
                              {tObj && (
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Đang dạy: {load}/{tObj.maxLoad} tiết/tuần
                                </div>
                              )}
                            </div>

                            {/* Dropdown to change immediately */}
                            <select
                              value={teacherName}
                              onChange={(e) => {
                                onUpdateSubjectTeacherForClass(currentClass.id, sub.name, e.target.value, true);
                              }}
                              className="bg-white border border-slate-300 text-xs rounded-lg px-2 py-1 font-semibold text-slate-700 outline-none focus:border-indigo-500 max-w-[150px]"
                            >
                              <option value="Chưa phân công">-- Chọn GV --</option>
                              {eligible.map(t => (
                                <option key={t.id} value={t.name}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: THEO TỪNG GIÁO VIÊN */}
      {viewMode === 'teacher' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Teacher list sidebar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs max-h-[75vh] overflow-y-auto space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              Giáo viên ({teachers.filter(t => t.name !== 'BGH & Đoàn trường').length} GV)
            </div>
            {teachers
              .filter(t => t.name !== 'BGH & Đoàn trường' && t.name !== 'GVCN')
              .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.dept.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(t => {
                const load = calculateTeacherLoad(t.name, allTimetables);
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTeacherId(t.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between text-xs ${
                      selectedTeacherId === t.id
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{t.name}</div>
                      <div className={`text-[10px] ${selectedTeacherId === t.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                        Tổ {t.dept} • {load}/{t.maxLoad} tiết
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-60" />
                  </button>
                );
              })}
          </div>

          {/* Assigned classes list for selected teacher */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            {(() => {
              const currentTeacher = teachers.find(t => t.id === selectedTeacherId) || teachers[0];
              if (!currentTeacher) return null;

              // Find which classes & subjects this teacher is assigned to
              const assignedList: Array<{ classId: string; className: string; subject: string; periodsCount: number }> = [];

              classes.forEach(c => {
                academicSubjects.forEach(s => {
                  const teacherAssigned = getSubjectTeacherForClass(c.id, s.name);
                  if (teacherAssigned === currentTeacher.name) {
                    const cTimetable = allTimetables[c.id] || [];
                    const periodsCount = cTimetable.filter(slot => slot.sub === s.name && slot.teacher === currentTeacher.name).length;
                    assignedList.push({
                      classId: c.id,
                      className: c.name,
                      subject: s.name,
                      periodsCount,
                    });
                  }
                });
              });

              const totalWeeklyLoad = calculateTeacherLoad(currentTeacher.name, allTimetables);

              return (
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                    <div>
                      <h3 className="text-lg font-black text-slate-800">
                        Danh sách các lớp giảng dạy: {currentTeacher.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tổ {currentTeacher.dept} • Định mức: <strong>{totalWeeklyLoad} / {currentTeacher.maxLoad}</strong> tiết/tuần
                      </p>
                    </div>

                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl">
                      Phụ trách {assignedList.length} lớp học
                    </span>
                  </div>

                  {assignedList.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      Giáo viên này chưa được phân công giảng dạy lớp nào.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {assignedList.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs">{item.className}</div>
                            <div className="text-[11px] text-indigo-700 font-semibold mt-0.5">Môn {item.subject}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{item.periodsCount} tiết thực tế/tuần</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onNavigateToClassTimetable(item.classId)}
                            className="p-1.5 bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg border border-slate-200 shadow-2xs transition"
                            title="Xem TKB lớp này"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Edit Slot Modal */}
      {editSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Phân công môn {editSlot.subjectName} - Lớp {editSlot.classId}
                </h3>
                <p className="text-xs text-slate-500">
                  Đang phân công: <strong>{editSlot.currentTeacher}</strong>
                </p>
              </div>
              <button
                onClick={() => setEditSlot(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={syncTimetableCheckbox}
                  onChange={(e) => setSyncTimetableCheckbox(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span>Đồng bộ tất cả các tiết của môn này trong thời khóa biểu sang giáo viên mới</span>
              </label>

              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Giáo viên tổ {subjectsConfig[editSlot.subjectName]?.dept || 'chuyên môn'}:
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {getEligibleTeachersForSubject(editSlot.subjectName).map(teacher => {
                  const isCurrent = editSlot.currentTeacher === teacher.name;
                  const load = calculateTeacherLoad(teacher.name, allTimetables);

                  return (
                    <div
                      key={teacher.id}
                      onClick={() => {
                        onUpdateSubjectTeacherForClass(editSlot.classId, editSlot.subjectName, teacher.name, syncTimetableCheckbox);
                        setEditSlot(null);
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-900'
                          : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">{teacher.name}</div>
                        <div className="text-[10px] text-slate-400">
                          Tổ {teacher.dept} • Đang dạy: {load}/{teacher.maxLoad} tiết
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Đang dạy
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 text-xs font-semibold"
                        >
                          Chọn
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setEditSlot(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
