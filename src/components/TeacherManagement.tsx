import React, { useState, useRef } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Calendar, 
  Phone, 
  Mail, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Clock,
  Download,
  Upload,
  FileSpreadsheet,
  GraduationCap,
  UserCheck,
  UserX,
  BookOpen,
  Filter,
  BarChart3,
  Layers,
  ArrowRight,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Teacher, TimetableEntry, SessionType, SchoolClass } from '../types/index.ts';
import { getPeriodTimeString } from '../data/periodSchedule.ts';

interface TeacherSlot {
  classId: string;
  day: number;
  session: SessionType;
  period: number;
  sub: string;
}

export interface TeacherWithStats extends Teacher {
  currentLoad: number;
  schedule: TeacherSlot[];
  hasClash: boolean;
  isTeaching: boolean;
  assignedClasses: string[];
  assignedSubjects: string[];
  homeroomClass?: string;
}

interface TeacherManagementProps {
  teachers: Teacher[];
  allTimetables: Record<string, TimetableEntry[]>;
  classes: SchoolClass[];
  onAddTeacher: (teacher: Teacher) => void;
  onNavigateToTeachingAssignment?: () => void;
}

export const TeacherManagement: React.FC<TeacherManagementProps> = ({
  teachers,
  allTimetables,
  classes,
  onAddTeacher,
  onNavigateToTeachingAssignment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [teachingStatusFilter, setTeachingStatusFilter] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED' | 'CLASH'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'dept_stats'>('table');
  const [inspectTeacher, setInspectTeacher] = useState<TeacherWithStats | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pageSize, setPageSize] = useState<number>(30); // 30, 60, or 100
  const [currentPage, setCurrentPage] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New teacher form state
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherDept, setNewTeacherDept] = useState('Toán');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherPhone, setNewTeacherPhone] = useState('');
  const [newTeacherMaxLoad, setNewTeacherMaxLoad] = useState(18);

  const departments = Array.from(new Set(teachers.map(t => t.dept))).filter(Boolean);

  // Calculate stats for each teacher
  const teachersWithStats: TeacherWithStats[] = teachers.map(teacher => {
    let load = 0;
    const schedule: TeacherSlot[] = [];

    for (const [classId, list] of Object.entries(allTimetables)) {
      for (const item of list) {
        if (item.teacher === teacher.name) {
          load++;
          schedule.push({
            classId,
            day: item.day,
            session: item.session,
            period: item.period,
            sub: item.sub,
          });
        }
      }
    }

    // Check conflict
    let hasClash = false;
    const slotSet = new Set<string>();
    for (const s of schedule) {
      const key = `${s.day}-${s.session}-${s.period}`;
      if (slotSet.has(key) && teacher.name !== 'BGH & Đoàn trường' && teacher.name !== 'GVCN') {
        hasClash = true;
        break;
      }
      slotSet.add(key);
    }

    const homeroomClass = classes.find(c => c.homeroomTeacher === teacher.name);
    const assignedClasses = Array.from(new Set(schedule.map(s => s.classId)));
    const assignedSubjects = Array.from(new Set(schedule.map(s => s.sub)));

    return {
      ...teacher,
      currentLoad: load,
      schedule,
      hasClash,
      isTeaching: load > 0,
      assignedClasses,
      assignedSubjects,
      homeroomClass: homeroomClass ? homeroomClass.name : undefined,
    };
  });

  // Overall Statistics
  const totalTeachersCount = teachersWithStats.length;
  const assignedTeachersCount = teachersWithStats.filter(t => t.isTeaching).length;
  const unassignedTeachersCount = totalTeachersCount - assignedTeachersCount;
  const clashTeachersCount = teachersWithStats.filter(t => t.hasClash).length;
  const assignedPercentage = totalTeachersCount > 0 ? Math.round((assignedTeachersCount / totalTeachersCount) * 100) : 0;
  const totalWeeklyTeachingPeriods = teachersWithStats.reduce((sum, t) => sum + t.currentLoad, 0);

  // Department statistics breakdown
  const deptStats = departments.map(dept => {
    const dTeachers = teachersWithStats.filter(t => t.dept === dept);
    const dAssigned = dTeachers.filter(t => t.isTeaching);
    const dUnassigned = dTeachers.filter(t => !t.isTeaching);
    const dLoad = dTeachers.reduce((acc, t) => acc + t.currentLoad, 0);
    const dCapacity = dTeachers.reduce((acc, t) => acc + t.maxLoad, 0);
    return {
      dept,
      total: dTeachers.length,
      assigned: dAssigned.length,
      unassigned: dUnassigned.length,
      percent: dTeachers.length > 0 ? Math.round((dAssigned.length / dTeachers.length) * 100) : 0,
      totalLoad: dLoad,
      totalCapacity: dCapacity,
    };
  });

  // Filtered teachers list
  const filteredTeachers = teachersWithStats.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        t.dept.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        t.assignedClasses.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchDept = selectedDept === 'ALL' || t.dept === selectedDept;

    let matchStatus = true;
    if (teachingStatusFilter === 'ASSIGNED') matchStatus = t.isTeaching;
    else if (teachingStatusFilter === 'UNASSIGNED') matchStatus = !t.isTeaching;
    else if (teachingStatusFilter === 'CLASH') matchStatus = t.hasClash;

    return matchSearch && matchDept && matchStatus;
  });

  // Export to Excel with full breakdown
  const handleExportExcel = () => {
    const exportData = filteredTeachers.map((t, index) => {
      const loadPercent = Math.min(100, Math.round(((t.currentLoad || 0) / t.maxLoad) * 100));
      return {
        'STT': index + 1,
        'Mã GV': t.id,
        'Họ và Tên': t.name,
        'Tổ Chuyên Môn': t.dept,
        'Trạng Thái Đứng Lớp': t.isTeaching ? 'Đã phân công đứng lớp' : 'Chưa đứng lớp',
        'Các Lớp Đang Dạy': t.assignedClasses.join(', ') || 'Chưa dạy lớp nào',
        'Môn Giảng Dạy': t.assignedSubjects.join(', ') || 'Chưa xếp',
        'Số Tiết Đang Dạy/Tuần': t.currentLoad,
        'Định Mức Tối Đa': t.maxLoad,
        'Tỷ Lệ Giảng Dạy': `${loadPercent}%`,
        'Chủ Nhiệm Lớp': t.homeroomClass || 'Chưa',
        'Tình Trạng Lịch': t.hasClash ? 'Trùng lịch dạy!' : 'Hợp lệ',
        'Email': t.email,
        'Số Điện Thoại': t.phone || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 10 },
      { wch: 22 },
      { wch: 18 },
      { wch: 24 },
      { wch: 22 },
      { wch: 18 },
      { wch: 20 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 30 },
      { wch: 15 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Thong_Ke_Giao_Vien');
    XLSX.writeFile(workbook, `Thong_Ke_Giao_Vien_Dung_Lop_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Import from Excel
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        let addedCount = 0;
        rawJson.forEach((row, idx) => {
          const name = row['Họ và Tên'] || row['Họ tên'] || row['name'] || row['Tên GV'];
          if (name && typeof name === 'string' && name.trim()) {
            const dept = row['Tổ Chuyên Môn'] || row['Tổ'] || row['dept'] || 'Toán';
            const email = row['Email'] || `${name.toLowerCase().replace(/\s+/g, '')}@thptlinhtrung.edu.vn`;
            const phone = row['Số Điện Thoại'] || row['SĐT'] || '0900 000 000';
            const maxLoad = Number(row['Định Mức Tiết Tối Đa'] || row['Định mức'] || 18);

            const newTeacher: Teacher = {
              id: `T_IMP_${Date.now()}_${idx}`,
              name: name.trim(),
              dept: String(dept).trim(),
              email: String(email).trim(),
              phone: String(phone).trim(),
              maxLoad: isNaN(maxLoad) ? 18 : maxLoad,
            };
            onAddTeacher(newTeacher);
            addedCount++;
          }
        });

        alert(`Đã nhập thành công ${addedCount} giáo viên từ file Excel!`);
      } catch {
        alert('Lỗi đọc file Excel. Vui lòng kiểm tra định dạng file .xlsx');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherName.trim()) return;

    const newT: Teacher = {
      id: `T_${Date.now()}`,
      name: newTeacherName.trim(),
      dept: newTeacherDept,
      email: newTeacherEmail.trim() || `${newTeacherName.toLowerCase().replace(/\s+/g, '')}@thptlinhtrung.edu.vn`,
      phone: newTeacherPhone.trim() || '0900 000 000',
      maxLoad: Number(newTeacherMaxLoad) || 18,
    };

    onAddTeacher(newT);
    setIsAddModalOpen(false);
    setNewTeacherName('');
    setNewTeacherEmail('');
    setNewTeacherPhone('');
  };

  // Pagination
  const totalPages = Math.ceil(filteredTeachers.length / pageSize);
  const displayedTeachers = pageSize >= filteredTeachers.length 
    ? filteredTeachers 
    : filteredTeachers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-50">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportExcel}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                Quản Lý & Thống Kê Phân Công Giáo Viên
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {totalTeachersCount} Giáo viên
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thống kê cụ thể giáo viên đã phân công đứng lớp và chưa đứng lớp, theo dõi định mức tiết dạy, phát hiện trùng lịch và xuất báo cáo.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {onNavigateToTeachingAssignment && (
            <button
              onClick={onNavigateToTeachingAssignment}
              className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-2 border border-indigo-200 hover:border-transparent cursor-pointer shadow-2xs"
            >
              <BookOpen className="w-4 h-4" />
              <span>Phân công chuyên môn</span>
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-emerald-600/20 cursor-pointer"
            title="Tải toàn bộ danh sách thống kê ra file Excel"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel Thống kê</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <Upload className="w-4 h-4 text-amber-600" />
            <span>Nhập Excel</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm GV mới</span>
          </button>
        </div>
      </div>

      {/* 4 HIGHLIGHT STATS CARDS: ĐÃ ĐỨNG LỚP VS CHƯA ĐỨNG LỚP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Tổng số GV */}
        <div 
          onClick={() => {
            setTeachingStatusFilter('ALL');
            setCurrentPage(1);
          }}
          className={`bg-white p-4 rounded-2xl border transition shadow-2xs cursor-pointer ${
            teachingStatusFilter === 'ALL' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Tổng số giáo viên</span>
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800">{totalTeachersCount}</span>
            <span className="text-xs text-slate-400 font-medium">giáo viên toàn trường</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Tổng định mức: <strong>{totalWeeklyTeachingPeriods}</strong> tiết đang dạy
          </div>
        </div>

        {/* Card 2: ĐÃ ĐỨNG LỚP */}
        <div 
          onClick={() => {
            setTeachingStatusFilter('ASSIGNED');
            setCurrentPage(1);
          }}
          className={`bg-white p-4 rounded-2xl border transition shadow-2xs cursor-pointer ${
            teachingStatusFilter === 'ASSIGNED' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              Đã phân công đứng lớp
            </span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{assignedTeachersCount}</span>
            <span className="text-xs text-emerald-600 font-bold">
              ({assignedPercentage}%)
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Trung bình:</span>
            <strong className="text-slate-800">
              {assignedTeachersCount > 0 ? (totalWeeklyTeachingPeriods / assignedTeachersCount).toFixed(1) : 0} tiết/GV
            </strong>
          </div>
        </div>

        {/* Card 3: CHƯA ĐỨNG LỚP */}
        <div 
          onClick={() => {
            setTeachingStatusFilter('UNASSIGNED');
            setCurrentPage(1);
          }}
          className={`bg-white p-4 rounded-2xl border transition shadow-2xs cursor-pointer ${
            teachingStatusFilter === 'UNASSIGNED' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-700 font-bold flex items-center gap-1.5">
              <UserX className="w-3.5 h-3.5 text-amber-600" />
              Chưa phân công đứng lớp
            </span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700">{unassignedTeachersCount}</span>
            <span className="text-xs text-amber-600 font-bold">
              ({totalTeachersCount > 0 ? 100 - assignedPercentage : 0}%)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-medium">
            {unassignedTeachersCount > 0 ? 'Cần bố trí lớp hoặc phân công chuyên môn' : '100% giáo viên đã có tiết dạy'}
          </div>
        </div>

        {/* Card 4: CẢNH BÁO TRÙNG LỊCH */}
        <div 
          onClick={() => {
            setTeachingStatusFilter('CLASH');
            setCurrentPage(1);
          }}
          className={`bg-white p-4 rounded-2xl border transition shadow-2xs cursor-pointer ${
            teachingStatusFilter === 'CLASH' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Cảnh báo trùng lịch dạy</span>
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
              clashTeachersCount > 0 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${clashTeachersCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>
              {clashTeachersCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {clashTeachersCount === 0 ? 'Lịch trình hoàn hảo' : 'giáo viên bị trùng ca'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {clashTeachersCount > 0 ? 'Nhấp để xem danh sách xử lý' : 'Không có tiết trùng lịch nào'}
          </div>
        </div>
      </div>

      {/* Control Toolbar: Status tabs, Search, Department, View toggle */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs mb-6 flex flex-col lg:flex-row gap-3 items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full lg:w-auto overflow-x-auto">
          <button
            onClick={() => {
              setTeachingStatusFilter('ALL');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              teachingStatusFilter === 'ALL' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({totalTeachersCount})
          </button>
          <button
            onClick={() => {
              setTeachingStatusFilter('ASSIGNED');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              teachingStatusFilter === 'ASSIGNED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Đã đứng lớp ({assignedTeachersCount})</span>
          </button>
          <button
            onClick={() => {
              setTeachingStatusFilter('UNASSIGNED');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              teachingStatusFilter === 'UNASSIGNED' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Chưa đứng lớp ({unassignedTeachersCount})</span>
          </button>
          {clashTeachersCount > 0 && (
            <button
              onClick={() => {
                setTeachingStatusFilter('CLASH');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 whitespace-nowrap ${
                teachingStatusFilter === 'CLASH' ? 'bg-red-600 text-white shadow-xs' : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Trùng lịch ({clashTeachersCount})</span>
            </button>
          )}
        </div>

        {/* Search & Department Selector */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên GV, tổ, lớp dạy..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:bg-white transition"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-2.5 py-1.5 outline-none focus:border-blue-400"
          >
            <option value="ALL">Tất cả tổ chuyên môn</option>
            {departments.map(d => (
              <option key={d} value={d}>Tổ {d}</option>
            ))}
          </select>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                viewMode === 'table' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
              title="Bảng danh sách cụ thể"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bảng chi tiết</span>
            </button>

            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                viewMode === 'cards' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
              title="Xem dạng thẻ"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dạng thẻ</span>
            </button>

            <button
              onClick={() => setViewMode('dept_stats')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                viewMode === 'dept_stats' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
              title="Thống kê theo từng Tổ"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Theo Tổ</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: DETAILED TABLE VIEW (DANH SÁCH CỤ THỂ) */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
                  <th className="px-3.5 py-3.5 w-12 text-center">STT</th>
                  <th className="px-3.5 py-3.5">Giáo viên & Tổ</th>
                  <th className="px-3.5 py-3.5 text-center">Trạng thái đứng lớp</th>
                  <th className="px-3.5 py-3.5">Các lớp & Môn đang dạy</th>
                  <th className="px-3.5 py-3.5 text-center">Định mức tiết</th>
                  <th className="px-3.5 py-3.5">Chủ nhiệm</th>
                  <th className="px-3.5 py-3.5">Liên hệ</th>
                  <th className="px-3.5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      Không tìm thấy giáo viên nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  displayedTeachers.map((teacher, index) => {
                    const rowNumber = (currentPage - 1) * pageSize + index + 1;
                    const loadPercent = Math.min(100, Math.round(((teacher.currentLoad || 0) / teacher.maxLoad) * 100));
                    const isOverloaded = (teacher.currentLoad || 0) > teacher.maxLoad;

                    return (
                      <tr key={teacher.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3.5 py-3 text-center text-slate-400 font-bold">
                          {rowNumber}
                        </td>

                        {/* Teacher Name & Dept */}
                        <td className="px-3.5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              teacher.isTeaching ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {teacher.name.charAt(teacher.name.lastIndexOf(' ') + 1) || 'GV'}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                                <span>{teacher.name}</span>
                                {teacher.hasClash && (
                                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" title="Trùng lịch dạy" />
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Tổ {teacher.dept} • Mã: {teacher.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Teaching Status Badge */}
                        <td className="px-3.5 py-3 text-center">
                          {teacher.isTeaching ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Đã đứng lớp ({teacher.currentLoad} tiết)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-200">
                              <UserX className="w-3 h-3 text-amber-600" />
                              <span>Chưa đứng lớp</span>
                            </span>
                          )}
                        </td>

                        {/* Assigned Classes & Subjects */}
                        <td className="px-3.5 py-3">
                          {teacher.assignedClasses.length > 0 ? (
                            <div>
                              <div className="flex flex-wrap gap-1">
                                {teacher.assignedClasses.map(cId => (
                                  <span key={cId} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                                    {cId}
                                  </span>
                                ))}
                              </div>
                              {teacher.assignedSubjects.length > 0 && (
                                <div className="text-[10px] text-slate-500 mt-1">
                                  Môn: <strong className="text-slate-700">{teacher.assignedSubjects.join(', ')}</strong>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">
                              Chưa có lịch dạy trong TKB
                            </span>
                          )}
                        </td>

                        {/* Workload Progress */}
                        <td className="px-3.5 py-3 text-center">
                          <div className="inline-block text-left w-24">
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <span className="font-bold text-slate-800">{teacher.currentLoad}/{teacher.maxLoad}</span>
                              <span className="text-slate-400">{loadPercent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isOverloaded ? 'bg-red-500' : teacher.isTeaching ? 'bg-emerald-500' : 'bg-slate-300'
                                }`}
                                style={{ width: `${loadPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Homeroom */}
                        <td className="px-3.5 py-3">
                          {teacher.homeroomClass ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200">
                              <GraduationCap className="w-3 h-3" /> CN {teacher.homeroomClass}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>

                        {/* Contact */}
                        <td className="px-3.5 py-3 text-[11px] text-slate-500">
                          {teacher.phone && (
                            <div className="flex items-center gap-1 text-slate-700 font-medium">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{teacher.phone}</span>
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                            {teacher.email}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-3.5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setInspectTeacher(teacher)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                              title="Xem thời khóa biểu cá nhân"
                            >
                              <Calendar className="w-3 h-3 text-blue-600" />
                              <span>TKB</span>
                            </button>

                            {!teacher.isTeaching && onNavigateToTeachingAssignment && (
                              <button
                                type="button"
                                onClick={onNavigateToTeachingAssignment}
                                className="px-2 py-1.5 bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white rounded-lg text-[11px] font-bold transition"
                                title="Phân công lớp giảng dạy ngay"
                              >
                                Phân công
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
      )}

      {/* VIEW 2: CARDS GRID VIEW */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedTeachers.map(teacher => {
            const loadPercent = Math.min(100, Math.round(((teacher.currentLoad || 0) / teacher.maxLoad) * 100));

            return (
              <div
                key={teacher.id}
                className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${
                  teacher.hasClash 
                    ? 'border-red-300 ring-1 ring-red-300' 
                    : teacher.isTeaching 
                    ? 'border-slate-200' 
                    : 'border-amber-200 bg-amber-50/20'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm border shadow-2xs ${
                        teacher.isTeaching 
                          ? 'bg-blue-50 border-blue-200 text-blue-700' 
                          : 'bg-amber-50 border-amber-200 text-amber-700'
                      }`}>
                        {teacher.name.charAt(teacher.name.lastIndexOf(' ') + 1) || 'GV'}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">{teacher.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            Tổ {teacher.dept}
                          </span>
                          {teacher.homeroomClass && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                              CN {teacher.homeroomClass}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {teacher.isTeaching ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        Đã đứng lớp
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                        Chưa đứng lớp
                      </span>
                    )}
                  </div>

                  {/* Assigned Classes */}
                  <div className="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="text-[10px] text-slate-400 font-semibold mb-1">Các lớp đang dạy:</div>
                    {teacher.assignedClasses.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {teacher.assignedClasses.map(cId => (
                          <span key={cId} className="px-1.5 py-0.5 rounded bg-white text-blue-700 font-bold text-[10px] border border-slate-200">
                            {cId}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-amber-700 font-medium text-[11px]">Chưa được phân công lớp nào</span>
                    )}
                  </div>

                  {/* Workload Progress */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">Định mức giảng dạy:</span>
                      <span className="font-bold text-slate-800">{teacher.currentLoad} / {teacher.maxLoad} tiết ({loadPercent}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          teacher.currentLoad > teacher.maxLoad ? 'bg-red-500' : teacher.isTeaching ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                        style={{ width: `${loadPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectTeacher(teacher)}
                  className="mt-4 w-full py-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold border border-slate-200 transition flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600" /> Xem TKB cá nhân
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: DEPARTMENT BREAKDOWN TABLE */}
      {viewMode === 'dept_stats' && (
        <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden p-5">
          <div className="mb-4">
            <h3 className="text-base font-extrabold text-slate-800">
              Thống kê Phân công Đứng lớp theo Tổ Chuyên Môn
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tỷ lệ hoàn thành phân công đứng lớp của từng tổ bộ môn trong nhà trường.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
                  <th className="px-4 py-3">Tổ Chuyên Môn</th>
                  <th className="px-4 py-3 text-center">Tổng số GV</th>
                  <th className="px-4 py-3 text-center">Đã đứng lớp</th>
                  <th className="px-4 py-3 text-center">Chưa đứng lớp</th>
                  <th className="px-4 py-3 text-center">Tỷ lệ hoàn thành</th>
                  <th className="px-4 py-3 text-right">Tổng tiết đang dạy</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deptStats.map(stat => (
                  <tr key={stat.dept} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-extrabold text-slate-900">
                      Tổ {stat.dept}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">
                      {stat.total} GV
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {stat.assigned} GV
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        stat.unassigned > 0 ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {stat.unassigned} GV
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-block w-28">
                        <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                          <span>{stat.percent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${stat.percent >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                            style={{ width: `${stat.percent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">
                      {stat.totalLoad} tiết
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDept(stat.dept);
                          setViewMode('table');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                      >
                        Xem danh sách
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination controls */}
      {viewMode !== 'dept_stats' && totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500">
            Hiển thị trang <strong className="text-slate-800">{currentPage}</strong> / <strong>{totalPages}</strong> ({filteredTeachers.length} giáo viên phù hợp)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Trước
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                  currentPage === page ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Inspect Individual Timetable Modal */}
      {inspectTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    Lịch dạy tuần: {inspectTeacher.name}
                    {inspectTeacher.isTeaching ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Đã đứng lớp
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        Chưa đứng lớp
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tổ {inspectTeacher.dept} • Tổng {inspectTeacher.currentLoad} tiết/tuần • {inspectTeacher.assignedClasses.length > 0 ? `Dạy các lớp: ${inspectTeacher.assignedClasses.join(', ')}` : 'Chưa xếp lớp dạy'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectTeacher(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-auto flex-1">
              <table className="w-full text-xs text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold text-center">
                    <th className="p-2 border border-slate-200 w-16">Buổi</th>
                    <th className="p-2 border border-slate-200 w-14">Tiết</th>
                    <th className="p-2 border border-slate-200">Thứ 2</th>
                    <th className="p-2 border border-slate-200">Thứ 3</th>
                    <th className="p-2 border border-slate-200">Thứ 4</th>
                    <th className="p-2 border border-slate-200">Thứ 5</th>
                    <th className="p-2 border border-slate-200">Thứ 6</th>
                    <th className="p-2 border border-slate-200">Thứ 7</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2].map(session => (
                    [1, 2, 3, 4].map((period, pIndex) => (
                      <tr key={`${session}-${period}`} className="hover:bg-slate-50">
                        {pIndex === 0 && (
                          <td rowSpan={4} className="p-2 border border-slate-200 text-center font-bold bg-slate-50">
                            {session === 1 ? 'Sáng' : 'Chiều'}
                          </td>
                        )}
                        <td className="p-2 border border-slate-200 text-center font-semibold text-slate-700 bg-slate-50/50">
                          <div className="font-bold text-xs">Tiết {period}</div>
                          <div className="text-[9px] text-slate-500 font-normal whitespace-nowrap">
                            {getPeriodTimeString(session as SessionType, period)}
                          </div>
                        </td>
                        {[2, 3, 4, 5, 6, 7].map(day => {
                          const assignedSlots = inspectTeacher.schedule?.filter(
                            s => s.day === day && s.session === session && s.period === period
                          ) || [];

                          const hasConflict = assignedSlots.length > 1;

                          return (
                            <td
                              key={day}
                              className={`p-1.5 border border-slate-200 align-top h-14 ${
                                hasConflict ? 'bg-red-50 border-red-300' : assignedSlots.length > 0 ? 'bg-blue-50/60' : ''
                              }`}
                            >
                              {assignedSlots.map((slot, idx) => (
                                <div
                                  key={idx}
                                  className={`p-1 rounded text-[11px] mb-1 font-bold ${
                                    hasConflict
                                      ? 'bg-red-100 text-red-900 border border-red-300'
                                      : 'bg-white text-blue-900 border border-blue-200 shadow-2xs'
                                  }`}
                                >
                                  <div>Lớp {slot.classId}</div>
                                  <div className="text-[9px] font-normal opacity-80">{slot.sub}</div>
                                </div>
                              ))}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setInspectTeacher(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={handleCreateTeacher}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
          >
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base">Thêm Giáo viên mới</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Họ và Tên giáo viên *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thầy Hoàng Minh"
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tổ chuyên môn *</label>
                  <select
                    value={newTeacherDept}
                    onChange={(e) => setNewTeacherDept(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-xs"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Định mức tiết/tuần</label>
                  <input
                    type="number"
                    min="1"
                    max="35"
                    value={newTeacherMaxLoad}
                    onChange={(e) => setNewTeacherMaxLoad(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email liên hệ</label>
                <input
                  type="email"
                  placeholder="minh.toan@thptdemo.edu.vn"
                  value={newTeacherEmail}
                  onChange={(e) => setNewTeacherEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Số điện thoại</label>
                <input
                  type="text"
                  placeholder="0918..."
                  value={newTeacherPhone}
                  onChange={(e) => setNewTeacherPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-xs"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-100 text-xs"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs text-xs"
              >
                Lưu giáo viên
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
