import React, { useState } from 'react';
import { 
  UserCheck, 
  Search, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  GraduationCap, 
  DoorOpen, 
  Sun, 
  Moon, 
  Users, 
  X, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Download,
  Printer,
  Trash2,
  Phone,
  Mail,
  Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SchoolClass, Teacher, TimetableEntry } from '../types/index.ts';
import { calculateTeacherLoad } from '../utils/conflictChecker.ts';

interface HomeroomManagementProps {
  classes: SchoolClass[];
  teachers: Teacher[];
  allTimetables: Record<string, TimetableEntry[]>;
  onUpdateHomeroomTeacher: (classId: string, teacherName: string, syncSHL: boolean) => void;
  onBatchUpdateHomeroom: (newClasses: SchoolClass[], syncAllSHL: boolean) => void;
  onNavigateToClassTimetable: (classId: string) => void;
}

export const HomeroomManagement: React.FC<HomeroomManagementProps> = ({
  classes,
  teachers,
  allTimetables,
  onUpdateHomeroomTeacher,
  onBatchUpdateHomeroom,
  onNavigateToClassTimetable,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<number | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'UNASSIGNED' | 'CONFLICT' | 'ASSIGNED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeAssignModalClass, setActiveAssignModalClass] = useState<SchoolClass | null>(null);
  const [syncSHLCheckbox, setSyncSHLCheckbox] = useState(true);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [modalDeptFilter, setModalDeptFilter] = useState('ALL');

  // Count how many classes each teacher is assigned to
  const teacherHomeroomCount: Record<string, string[]> = {};
  classes.forEach(c => {
    if (c.homeroomTeacher && c.homeroomTeacher !== 'Chưa phân công') {
      if (!teacherHomeroomCount[c.homeroomTeacher]) {
        teacherHomeroomCount[c.homeroomTeacher] = [];
      }
      teacherHomeroomCount[c.homeroomTeacher].push(c.id);
    }
  });

  // Conflicts: teacher assigned to > 1 class
  const conflictTeachers = Object.entries(teacherHomeroomCount).filter(
    ([name, assignedClasses]) => assignedClasses.length > 1 && name !== 'GVCN'
  );

  const assignedClassesCount = classes.filter(
    c => c.homeroomTeacher && c.homeroomTeacher !== 'Chưa phân công'
  ).length;

  const totalClasses = classes.length;
  const unassignedCount = totalClasses - assignedClassesCount;

  // Filter classes
  const filteredClasses = classes.filter(c => {
    const matchesGrade = selectedGrade === 'ALL' || c.grade === selectedGrade;
    const isUnassigned = !c.homeroomTeacher || c.homeroomTeacher === 'Chưa phân công';
    const isConflict = (teacherHomeroomCount[c.homeroomTeacher]?.length || 0) > 1 && !isUnassigned;

    let matchesStatus = true;
    if (selectedStatus === 'UNASSIGNED') matchesStatus = isUnassigned;
    else if (selectedStatus === 'CONFLICT') matchesStatus = isConflict;
    else if (selectedStatus === 'ASSIGNED') matchesStatus = !isUnassigned && !isConflict;

    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.homeroomTeacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.room.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGrade && matchesStatus && matchesSearch;
  });

  // Unique departments for filter in modal
  const departments = Array.from(new Set(teachers.map(t => t.dept))).filter(Boolean);

  // Auto assign algorithm
  const handleAutoAssign = () => {
    const eligibleTeachers = teachers.filter(t => t.name !== 'BGH & Đoàn trường' && t.name !== 'GVCN');
    // Sort teachers by current workload ascending
    const sortedTeachers = [...eligibleTeachers].sort((a, b) => {
      const loadA = calculateTeacherLoad(a.name, allTimetables);
      const loadB = calculateTeacherLoad(b.name, allTimetables);
      return loadA - loadB;
    });

    const updatedClasses = [...classes];
    const usedTeachers = new Set<string>();

    // First preserve existing 1-1 assignments if valid
    updatedClasses.forEach(c => {
      if (
        c.homeroomTeacher && 
        c.homeroomTeacher !== 'Chưa phân công' && 
        !usedTeachers.has(c.homeroomTeacher) &&
        (teacherHomeroomCount[c.homeroomTeacher]?.length || 0) === 1
      ) {
        usedTeachers.add(c.homeroomTeacher);
      }
    });

    // Assign remaining classes
    let teacherIndex = 0;
    updatedClasses.forEach((c, idx) => {
      if (!c.homeroomTeacher || c.homeroomTeacher === 'Chưa phân công' || (teacherHomeroomCount[c.homeroomTeacher]?.length || 0) > 1) {
        while (teacherIndex < sortedTeachers.length && usedTeachers.has(sortedTeachers[teacherIndex].name)) {
          teacherIndex++;
        }
        if (teacherIndex < sortedTeachers.length) {
          const teacher = sortedTeachers[teacherIndex];
          updatedClasses[idx] = {
            ...c,
            homeroomTeacher: teacher.name,
          };
          usedTeachers.add(teacher.name);
          teacherIndex++;
        }
      }
    });

    onBatchUpdateHomeroom(updatedClasses, true);
  };

  const [isConfirmClearAllOpen, setIsConfirmClearAllOpen] = useState(false);

  // Sync SHL across all classes
  const handleSyncAllSHL = () => {
    onBatchUpdateHomeroom(classes, true);
  };

  // Reset / Clear all assignments
  const handleClearAllAssignments = () => {
    setIsConfirmClearAllOpen(true);
  };

  const handleConfirmClearAllAssignments = () => {
    const cleared = classes.map(c => ({
      ...c,
      homeroomTeacher: 'Chưa phân công'
    }));
    onBatchUpdateHomeroom(cleared, false);
    setIsConfirmClearAllOpen(false);
  };

  // Check if a class's SHL slot currently matches the homeroom teacher and standard slot (Sáng Thứ 6 Tiết 4)
  const checkClassSHLStatus = (c: SchoolClass) => {
    const timetable = allTimetables[c.id] || [];
    const shlSlot = timetable.find(i => i.sub === 'SHL' || i.sub.toLowerCase().includes('sinh hoạt'));
    if (!shlSlot) return { hasSHL: false, isMatched: false, teacher: '', isStandard: false, slotDesc: '' };
    const isStandard = shlSlot.day === 6 && shlSlot.session === 1 && shlSlot.period === 4;
    return {
      hasSHL: true,
      isMatched: shlSlot.teacher === c.homeroomTeacher,
      teacher: shlSlot.teacher,
      isStandard,
      slotDesc: `Thứ ${shlSlot.day} Tiết ${shlSlot.period} (${shlSlot.session === 1 ? 'Sáng' : 'Chiều'})`,
    };
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = classes.map((c, index) => {
      const tObj = teachers.find(t => t.name === c.homeroomTeacher);
      const load = tObj ? calculateTeacherLoad(tObj.name, allTimetables) : 0;
      const shl = checkClassSHLStatus(c);

      return {
        'STT': index + 1,
        'Mã Lớp': c.id,
        'Tên Lớp': c.name,
        'Khối': c.grade,
        'Phòng Học': c.room,
        'Ca Học': c.session === 'full_day' ? 'Học cả ngày' : c.session === 1 ? 'Sáng' : 'Chiều',
        'Giáo Viên Chủ Nhiệm': c.homeroomTeacher || 'Chưa phân công',
        'Tổ Chuyên Môn': tObj?.dept || '',
        'Số Tiết Đang Dạy/Tuần': load,
        'Tiết SHL Tuần': shl.hasSHL ? (shl.isMatched ? `Đã khớp GVCN (${shl.slotDesc})` : `Chưa khớp (${shl.teacher})`) : 'Chưa xếp',
        'Số Điện Thoại': tObj?.phone || '',
        'Email': tObj?.email || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const colWidths = [
      { wch: 6 },
      { wch: 10 },
      { wch: 14 },
      { wch: 8 },
      { wch: 14 },
      { wch: 16 },
      { wch: 24 },
      { wch: 20 },
      { wch: 22 },
      { wch: 20 },
      { wch: 16 },
      { wch: 30 },
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Phan_Cong_GVCN');
    XLSX.writeFile(workbook, `Danh_Sach_Phan_Cong_GVCN_THPT_Linh_Trung_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Print homeroom assignment table
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-50">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                Phân Công Giáo Viên Chủ Nhiệm (GVCN)
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Năm học 2024 - 2025
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý, phân công GVCN cho toàn bộ {totalClasses} lớp học. Kiểm tra trùng lặp 1:1, tự động cân đối số tiết và đồng bộ tiết Sinh hoạt lớp (SHL).
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Auto Assign */}
          <button
            onClick={handleAutoAssign}
            className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-blue-500/20 cursor-pointer"
            title="Tự động phân công giáo viên chưa chủ nhiệm và cân đối số tiết"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Tự động xếp GVCN</span>
          </button>

          {/* Sync SHL */}
          <button
            onClick={handleSyncAllSHL}
            className="px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer"
            title="Cập nhật tiết Sinh hoạt lớp của từng lớp theo đúng GVCN vừa phân công"
          >
            <RefreshCw className="w-4 h-4 text-blue-600" />
            <span>Đồng bộ tiết SHL toàn trường</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-emerald-600/20 cursor-pointer"
            title="Tải bảng phân công GVCN ra file Excel"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="px-3 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="In danh sách phân công GVCN"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">In danh sách</span>
          </button>

          {/* Reset / Clear */}
          <button
            onClick={handleClearAllAssignments}
            className="p-2.5 bg-white border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition"
            title="Hủy toàn bộ phân công GVCN"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Tổng số lớp</span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <GraduationCap className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{totalClasses}</span>
            <span className="text-xs text-slate-400">lớp toàn trường</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Tiến độ phân công</span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{assignedClassesCount} / {totalClasses}</span>
            <span className="text-xs text-emerald-600 font-semibold">
              ({totalClasses > 0 ? Math.round((assignedClassesCount / totalClasses) * 100) : 0}%)
            </span>
          </div>
          {unassignedCount > 0 && (
            <div className="mt-1 text-[11px] text-amber-600 font-medium">
              Còn {unassignedCount} lớp chưa có GVCN
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Cảnh báo trùng GVCN</span>
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
              conflictTeachers.length > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400'
            }`}>
              <AlertTriangle className={`w-4 h-4 ${conflictTeachers.length > 0 ? 'animate-pulse' : ''}`} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${conflictTeachers.length > 0 ? 'text-red-600' : 'text-slate-800'}`}>
              {conflictTeachers.length}
            </span>
            <span className="text-xs text-slate-400">
              {conflictTeachers.length === 0 ? 'Không có trùng' : 'giáo viên bị phân > 1 lớp'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Giáo viên sẵn sàng</span>
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">
              {teachers.filter(t => !teacherHomeroomCount[t.name] && t.name !== 'BGH & Đoàn trường' && t.name !== 'GVCN').length}
            </span>
            <span className="text-xs text-slate-400">GV chưa làm chủ nhiệm</span>
          </div>
        </div>
      </div>

      {/* Warning banner if conflicts exist */}
      {conflictTeachers.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm text-red-800">Phát hiện giáo viên bị phân công chủ nhiệm nhiều lớp:</h4>
            <div className="mt-1 space-y-1">
              {conflictTeachers.map(([teacherName, classList]) => (
                <div key={teacherName}>
                  • <strong className="text-red-950">{teacherName}</strong> hiện đang được gán chủ nhiệm cho{' '}
                  <span className="font-bold underline">{classList.join(', ')}</span>. Quy định nhà trường yêu cầu mỗi giáo viên chỉ chủ nhiệm tối đa 1 lớp.
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên lớp, tên GVCN, phòng học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:bg-white transition"
          />
        </div>

        {/* Grade & Status filter buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {/* Grade selection */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSelectedGrade('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                selectedGrade === 'ALL' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả khối
            </button>
            {[10, 11, 12].map((grade) => (
              <button
                key={grade}
                onClick={() => setSelectedGrade(grade)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedGrade === grade ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Khối {grade}
              </button>
            ))}
          </div>

          {/* Status selection */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                selectedStatus === 'ALL' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({classes.length})
            </button>
            <button
              onClick={() => setSelectedStatus('UNASSIGNED')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                selectedStatus === 'UNASSIGNED' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chưa gán ({unassignedCount})
            </button>
            {conflictTeachers.length > 0 && (
              <button
                onClick={() => setSelectedStatus('CONFLICT')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  selectedStatus === 'CONFLICT' ? 'bg-red-500 text-white shadow-xs' : 'text-red-600 hover:text-red-800'
                }`}
              >
                Trùng lặp ({conflictTeachers.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Classes Homeroom Assignment Table */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
                <th className="px-4 py-3.5">Lớp & Khối</th>
                <th className="px-4 py-3.5">Phòng / Ca học</th>
                <th className="px-4 py-3.5">Giáo viên Chủ nhiệm</th>
                <th className="px-4 py-3.5">Tổ Chuyên môn</th>
                <th className="px-4 py-3.5 text-center">Tiết SHL Tuần</th>
                <th className="px-4 py-3.5 text-center">Tình trạng</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Không tìm thấy lớp học nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredClasses.map((item) => {
                  const teacherObj = teachers.find(t => t.name === item.homeroomTeacher);
                  const isConflict = (teacherHomeroomCount[item.homeroomTeacher]?.length || 0) > 1 && item.homeroomTeacher !== 'Chưa phân công';
                  const shlStatus = checkClassSHLStatus(item);
                  const teacherWeeklyLoad = teacherObj ? calculateTeacherLoad(teacherObj.name, allTimetables) : 0;
                  const isUnassigned = !item.homeroomTeacher || item.homeroomTeacher === 'Chưa phân công';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Class */}
                      <td className="px-4 py-3.5 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 font-black flex items-center justify-center text-xs shadow-2xs">
                            {item.id}
                          </div>
                          <div>
                            <div className="text-slate-900 font-extrabold">{item.name}</div>
                            <div className="text-[10px] text-slate-400 font-normal">Khối {item.grade}</div>
                          </div>
                        </div>
                      </td>

                      {/* Room & Shift */}
                      <td className="px-4 py-3.5 text-slate-600">
                        <div className="flex items-center gap-1.5 font-medium">
                          <DoorOpen className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.room}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          {item.session === 'full_day' ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              <Sun className="w-3 h-3 text-amber-500" />
                              <Moon className="w-3 h-3 text-indigo-500" />
                              Học cả ngày
                            </span>
                          ) : item.session === 1 ? (
                            <span className="text-amber-700 flex items-center gap-1">
                              <Sun className="w-3 h-3 text-amber-500" /> Ca Sáng
                            </span>
                          ) : (
                            <span className="text-indigo-700 flex items-center gap-1">
                              <Moon className="w-3 h-3 text-indigo-500" /> Ca Chiều
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Homeroom Teacher */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isConflict 
                              ? 'bg-red-100 text-red-700 ring-2 ring-red-400' 
                              : !isUnassigned
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-400'
                          }`}>
                            {!isUnassigned
                              ? item.homeroomTeacher.charAt(item.homeroomTeacher.lastIndexOf(' ') + 1) || 'GV'
                              : '?'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 text-xs">
                              {item.homeroomTeacher || 'Chưa phân công'}
                            </div>
                            {teacherObj ? (
                              <div className="text-[10px] text-slate-400">
                                Đang dạy: <strong className="text-slate-700">{teacherWeeklyLoad}</strong> tiết/tuần
                              </div>
                            ) : (
                              <span className="text-[10px] text-amber-600 font-medium">Cần xếp GVCN</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5 text-slate-600">
                        {teacherObj ? (
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                              Tổ {teacherObj.dept}
                            </span>
                            {teacherObj.phone && (
                              <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5" /> {teacherObj.phone}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">—</span>
                        )}
                      </td>

                      {/* SHL Status */}
                      <td className="px-4 py-3.5 text-center">
                        {shlStatus.hasSHL ? (
                          shlStatus.isMatched && shlStatus.isStandard ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]" title="Đã khớp đúng GVCN và xếp chuẩn Sáng Thứ 6 Tiết 4">
                              <Check className="w-3 h-3" /> Khớp GVCN (Sáng T6-T4)
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold text-[10px] cursor-pointer transition"
                              title={`Tiết SHL hiện: ${shlStatus.slotDesc} (${shlStatus.teacher}). Nhấp để đồng bộ chuẩn Sáng Thứ 6 Tiết 4 theo GVCN ${item.homeroomTeacher}`}
                              onClick={() => onUpdateHomeroomTeacher(item.id, item.homeroomTeacher, true)}
                            >
                              <RefreshCw className="w-3 h-3" /> {!shlStatus.isMatched ? 'Đồng bộ GVCN' : 'Chuẩn hóa T6-T4'}
                            </button>
                          )
                        ) : (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-700 font-semibold text-[10px] cursor-pointer transition"
                            title="Chưa xếp tiết SHL. Nhấp để xếp tự động vào Sáng Thứ 6 Tiết 4"
                            onClick={() => onUpdateHomeroomTeacher(item.id, item.homeroomTeacher, true)}
                          >
                            <RefreshCw className="w-3 h-3" /> + Xếp SHL (T6-T4)
                          </button>
                        )}
                      </td>

                      {/* Conflict Badge */}
                      <td className="px-4 py-3.5 text-center">
                        {isConflict ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px] animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> Trùng {teacherHomeroomCount[item.homeroomTeacher]?.length} lớp
                          </span>
                        ) : !isUnassigned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[10px]">
                            <ShieldCheck className="w-3 h-3 text-blue-600" /> Chuẩn 1:1
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium text-[10px]">
                            Chưa có GVCN
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Direct quick dropdown */}
                          <select
                            value={item.homeroomTeacher || 'Chưa phân công'}
                            onChange={(e) => {
                              const val = e.target.value;
                              onUpdateHomeroomTeacher(item.id, val, syncSHLCheckbox);
                            }}
                            className="bg-slate-50 border border-slate-300 text-slate-700 rounded-lg px-2 py-1 text-[11px] font-medium outline-none focus:border-blue-500 max-w-[130px] truncate"
                          >
                            <option value="Chưa phân công">-- Chọn GVCN --</option>
                            {teachers
                              .filter(t => t.name !== 'BGH & Đoàn trường' && t.name !== 'GVCN')
                              .map(t => (
                                <option key={t.id} value={t.name}>
                                  {t.name} ({t.dept})
                                </option>
                              ))}
                          </select>

                          {/* Open modal for rich search */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveAssignModalClass(item);
                              setTeacherSearchTerm('');
                              setModalDeptFilter('ALL');
                            }}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                            title="Tìm kiếm và chọn giáo viên chi tiết"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Đổi GV</span>
                          </button>

                          {/* Navigate to timetable */}
                          <button
                            type="button"
                            onClick={() => onNavigateToClassTimetable(item.id)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                            title="Xem và chỉnh sửa TKB lớp này"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>

                          {/* Unassign button */}
                          {!isUnassigned && (
                            <button
                              type="button"
                              onClick={() => onUpdateHomeroomTeacher(item.id, 'Chưa phân công', false)}
                              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition"
                              title="Hủy gán GVCN lớp này"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Teacher Modal */}
      {activeAssignModalClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Phân công GVCN cho Lớp {activeAssignModalClass.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Phòng {activeAssignModalClass.room} • {activeAssignModalClass.session === 'full_day' ? 'Học cả ngày' : activeAssignModalClass.session === 1 ? 'Ca Sáng' : 'Ca Chiều'} • Đang gán: <strong>{activeAssignModalClass.homeroomTeacher || 'Chưa có'}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveAssignModalClass(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search, Dept Filter & Options */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm giáo viên theo họ tên..."
                    value={teacherSearchTerm}
                    onChange={(e) => setTeacherSearchTerm(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:border-blue-500 shadow-2xs"
                  />
                </div>

                <select
                  value={modalDeptFilter}
                  onChange={(e) => setModalDeptFilter(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 outline-none"
                >
                  <option value="ALL">Tất cả tổ chuyên môn</option>
                  {departments.map(d => (
                    <option key={d} value={d}>Tổ {d}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={syncSHLCheckbox}
                  onChange={(e) => setSyncSHLCheckbox(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span>Tự động cập nhật giáo viên trong tiết <strong>Sinh hoạt lớp (SHL)</strong> theo GVCN mới này</span>
              </label>
            </div>

            {/* Teachers Selection List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span>Danh sách giáo viên:</span>
                <span className="text-slate-500 font-normal">Sắp xếp theo số tiết dạy tăng dần</span>
              </div>

              {teachers
                .filter(t => t.name !== 'BGH & Đoàn trường' && t.name !== 'GVCN')
                .filter(t => modalDeptFilter === 'ALL' || t.dept === modalDeptFilter)
                .filter(t => 
                  t.name.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
                  t.dept.toLowerCase().includes(teacherSearchTerm.toLowerCase())
                )
                .sort((a, b) => {
                  const loadA = calculateTeacherLoad(a.name, allTimetables);
                  const loadB = calculateTeacherLoad(b.name, allTimetables);
                  return loadA - loadB;
                })
                .map(teacher => {
                  const currentAssignedClasses = teacherHomeroomCount[teacher.name] || [];
                  const isAssignedToThisClass = activeAssignModalClass.homeroomTeacher === teacher.name;
                  const isAssignedToOtherClass = currentAssignedClasses.length > 0 && !isAssignedToThisClass;
                  const load = calculateTeacherLoad(teacher.name, allTimetables);

                  return (
                    <div
                      key={teacher.id}
                      onClick={() => {
                        onUpdateHomeroomTeacher(activeAssignModalClass.id, teacher.name, syncSHLCheckbox);
                        setActiveAssignModalClass(null);
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isAssignedToThisClass
                          ? 'border-blue-500 bg-blue-50/70 shadow-xs'
                          : isAssignedToOtherClass
                          ? 'border-amber-200 bg-amber-50/40 hover:bg-amber-50/70'
                          : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                          isAssignedToThisClass
                            ? 'bg-blue-600 text-white'
                            : isAssignedToOtherClass
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {teacher.name.charAt(teacher.name.lastIndexOf(' ') + 1) || 'GV'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-xs">{teacher.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                              Tổ {teacher.dept}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Đang dạy: <strong className="text-slate-700">{load}</strong>/{teacher.maxLoad} tiết/tuần
                            {isAssignedToOtherClass && (
                              <span className="text-amber-700 font-semibold ml-2">
                                (Đang chủ nhiệm lớp {currentAssignedClasses.join(', ')})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                          isAssignedToThisClass
                            ? 'bg-blue-600 text-white'
                            : isAssignedToOtherClass
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white'
                        }`}
                      >
                        {isAssignedToThisClass ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Đang chọn
                          </>
                        ) : (
                          <>
                            Chọn
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={() => {
                  onUpdateHomeroomTeacher(activeAssignModalClass.id, 'Chưa phân công', false);
                  setActiveAssignModalClass(null);
                }}
                className="text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hủy GVCN lớp này
              </button>
              <button
                type="button"
                onClick={() => setActiveAssignModalClass(null)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Clear All Homeroom Modal */}
      {isConfirmClearAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-sm">Hủy Toàn Bộ Phân Công GVCN</h3>
                <p className="text-[11px] text-slate-500">Đặt lại {classes.length} lớp về Chưa phân công</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-red-50 p-3 rounded-xl border border-red-200">
              Bạn có chắc chắn muốn xóa toàn bộ phân công Giáo viên Chủ nhiệm của tất cả các lớp không? Thao tác này có thể thực hiện lại bằng nút Tự động xếp GVCN.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmClearAllOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAllAssignments}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-red-500/25"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
