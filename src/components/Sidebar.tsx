import React, { useState } from 'react';
import { 
  CalendarDays, 
  Users, 
  GraduationCap, 
  UserCheck,
  BookOpen,
  FileSpreadsheet, 
  Settings, 
  GripVertical,
  Plus,
  Search,
  Sparkles,
  Trash2
} from 'lucide-react';
import { TabType, SubjectConfig, Teacher } from '../types/index.ts';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  subjectsConfig: Record<string, SubjectConfig>;
  teachers: Teacher[];
  totalConflicts: number;
  onDragStartSubjectPalette: (subName: string, teacherName: string) => void;
  onOpenDataCleaning?: () => void;
  onOpenClearTimetable?: () => void;
  healthIssuesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  subjectsConfig,
  teachers,
  totalConflicts,
  onDragStartSubjectPalette,
  onOpenDataCleaning,
  onOpenClearTimetable,
  healthIssuesCount = 0,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');

  const navItems = [
    { id: 'timetable' as TabType, label: 'Xếp TKB', icon: CalendarDays, badge: totalConflicts > 0 ? `${totalConflicts} lỗi` : null },
    { id: 'homeroom' as TabType, label: 'Phân công GVCN', icon: UserCheck },
    { id: 'teaching_assignment' as TabType, label: 'Phân công Giảng dạy', icon: BookOpen },
    { id: 'teachers' as TabType, label: 'Quản lý Giáo viên', icon: Users },
    { id: 'classes' as TabType, label: 'Quản lý Lớp học', icon: GraduationCap },
    { id: 'data' as TabType, label: 'Nhập/Xuất Dữ liệu', icon: FileSpreadsheet },
  ];

  const subjectsList = Object.values(subjectsConfig).filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          sub.dept.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDeptFilter === 'ALL' || sub.dept === selectedDeptFilter;
    return matchesSearch && matchesDept;
  });

  const uniqueDepts = Array.from(new Set(Object.values(subjectsConfig).map(s => s.dept)));

  return (
    <aside className="w-68 bg-white border-r border-slate-200 shadow-sm z-20 hidden md:flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-tr from-blue-700 to-indigo-500 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20">
          EF
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="font-extrabold text-base text-slate-800 tracking-tight">EduFlow</h1>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">PRO</span>
          </div>
          <p className="text-xs text-slate-400 font-medium truncate">THPT Linh Trung</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <hr className="mx-3 my-1 border-slate-100" />

      {/* Subject Palette / Kho Môn Học */}
      <div className="flex-1 flex flex-col min-h-0 px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Kho Môn Học
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">Kéo thả vào ô TKB</span>
        </div>

        {/* Quick Search & Department selector */}
        <div className="space-y-1.5 mb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm môn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:bg-white transition"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1 text-[10px] no-scrollbar">
            <button
              onClick={() => setSelectedDeptFilter('ALL')}
              className={`px-2 py-0.5 rounded-md whitespace-nowrap transition ${
                selectedDeptFilter === 'ALL'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            {uniqueDepts.slice(0, 4).map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDeptFilter(dept)}
                className={`px-2 py-0.5 rounded-md whitespace-nowrap transition ${
                  selectedDeptFilter === dept
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* Palette Draggable Cards */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
          {subjectsList.map((sub) => {
            const defaultTeacher = sub.defaultTeacher || 'Chưa phân công';
            return (
              <div
                key={sub.name}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify({ isNew: true, sub: sub.name, teacher: defaultTeacher }));
                  e.dataTransfer.effectAllowed = 'copy';
                  onDragStartSubjectPalette(sub.name, defaultTeacher);
                }}
                className={`group p-2 rounded-xl border ${sub.color} shadow-2xs hover:shadow-sm cursor-grab active:cursor-grabbing transition-all flex items-center justify-between`}
              >
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <GripVertical className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-xs truncate leading-tight">{sub.name}</div>
                    <div className="text-[10px] opacity-75 truncate">{defaultTeacher}</div>
                  </div>
                </div>

                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${sub.badgeColor} shrink-0`}>
                  {sub.dept}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer / Data Cleaner & Settings */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60 space-y-2">
        {onOpenClearTimetable && (
          <button
            onClick={onOpenClearTimetable}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition shadow-2xs cursor-pointer"
            title="Xóa thời khóa biểu theo lớp hoặc toàn trường"
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Xóa thời khóa biểu</span>
            </div>
            <span className="text-[10px] text-rose-500 font-semibold">Tùy chọn</span>
          </button>
        )}

        {onOpenDataCleaning && (
          <button
            onClick={onOpenDataCleaning}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-50 to-indigo-50 hover:from-amber-100 hover:to-indigo-100 text-indigo-800 border border-indigo-200/70 transition shadow-2xs cursor-pointer"
            title="Quét chẩn đoán, chuẩn hóa và làm sạch thời khóa biểu"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Làm sạch dữ liệu</span>
            </div>
            {healthIssuesCount > 0 && (
              <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-full font-black">
                {healthIssuesCount}
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => onSelectTab('settings')}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition ${
            currentTab === 'settings'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-500" /> Cài đặt & Tiết học
        </button>
      </div>
    </aside>
  );
};
