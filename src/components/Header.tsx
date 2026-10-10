import React from 'react';
import { 
  RotateCcw, 
  Save, 
  Printer, 
  Menu, 
  CheckCheck,
  AlertCircle,
  CalendarDays,
  UserCheck,
  BookOpen,
  Users,
  GraduationCap,
  FileSpreadsheet,
  Settings,
  Sparkles,
  Trash2,
  UserPlus,
  LogOut,
  KeyRound
} from 'lucide-react';
import { SchoolClass, TabType } from '../types/index.ts';

interface HeaderProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  classes: SchoolClass[];
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  selectedGrade: number;
  onSelectGrade: (grade: number) => void;
  onResetDemo: () => void;
  onSaveTimetable: () => void;
  onPrint: () => void;
  isSavedJustNow: boolean;
  totalConflicts: number;
  totalPeriodsCount: number;
  onToggleMobileMenu: () => void;
  onOpenQuickAssignHomeroom?: () => void;
  onPrintAllPDF?: () => void;
  onOpenDataCleaning?: () => void;
  onOpenClearTimetable?: () => void;
  healthIssuesCount?: number;
  syncStatus: string;
  userEmail: string;
  memberRole: 'admin' | 'editor';
  onInviteMember: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  classes,
  selectedClassId,
  onSelectClass,
  selectedGrade,
  onSelectGrade,
  onResetDemo,
  onSaveTimetable,
  onPrint,
  onPrintAllPDF,
  isSavedJustNow,
  totalConflicts,
  totalPeriodsCount,
  onToggleMobileMenu,
  onOpenQuickAssignHomeroom,
  onOpenDataCleaning,
  onOpenClearTimetable,
  healthIssuesCount = 0,
  syncStatus,
  userEmail,
  memberRole,
  onInviteMember,
  onChangePassword,
  onLogout,
}) => {
  const filteredClasses = classes.filter(c => c.grade === selectedGrade);
  const currentClassObj = classes.find(c => c.id === selectedClassId);

  const assignedHomeroomCount = classes.filter(c => c.homeroomTeacher && c.homeroomTeacher !== 'Chưa phân công').length;
  const totalClassesCount = classes.length;

  const navTabs: Array<{ id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string | null; badgeColor?: string }> = [
    { 
      id: 'timetable', 
      label: 'Thời khóa biểu', 
      icon: CalendarDays, 
      badge: totalConflicts > 0 ? `${totalConflicts} lỗi` : null,
      badgeColor: 'bg-red-100 text-red-700'
    },
    { 
      id: 'homeroom', 
      label: 'Phân công GVCN', 
      icon: UserCheck,
      badge: `${assignedHomeroomCount}/${totalClassesCount}`,
      badgeColor: assignedHomeroomCount === totalClassesCount ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
    },
    { 
      id: 'teaching_assignment', 
      label: 'Phân công Giảng dạy', 
      icon: BookOpen 
    },
    { 
      id: 'teachers', 
      label: 'Giáo viên', 
      icon: Users 
    },
    { 
      id: 'classes', 
      label: 'Lớp học', 
      icon: GraduationCap 
    },
    { 
      id: 'data', 
      label: 'Nhập/Xuất', 
      icon: FileSpreadsheet 
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 z-10 shrink-0">
      {/* Top Primary Bar */}
      <div className="px-4 py-2.5 sm:px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100">
        {/* Left: Brand / Title / Mobile trigger */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden text-slate-500 hover:text-slate-800 p-2 rounded-lg bg-slate-100"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                  {currentTab === 'timetable' && 'Khung điều chỉnh Thời khóa biểu'}
                  {currentTab === 'homeroom' && 'Phân công Giáo viên Chủ nhiệm (GVCN)'}
                  {currentTab === 'teaching_assignment' && 'Phân công Chuyên môn & Giảng dạy'}
                  {currentTab === 'teachers' && 'Quản lý Đội ngũ Giáo viên'}
                  {currentTab === 'classes' && 'Quản lý Danh sách Lớp học'}
                  {currentTab === 'data' && 'Nhập & Xuất Dữ liệu'}
                  {currentTab === 'settings' && 'Cài đặt Hệ thống'}
                </h2>
                {currentTab === 'timetable' && currentClassObj && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                    <span>{currentClassObj.name} ({currentClassObj.room})</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100/90 px-1.5 py-0.2 rounded font-extrabold">
                      {currentClassObj.session === 'full_day' ? 'Học cả ngày' : currentClassObj.session === 1 ? 'Ca Sáng' : 'Ca Chiều'}
                    </span>
                  </span>
                )}
              </div>

              {currentTab === 'timetable' && (
                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
                  <span>Đã xếp: <strong className="text-slate-800 font-bold">{totalPeriodsCount} / 40</strong> tiết/tuần</span>
                  <span>•</span>
                  {totalConflicts > 0 ? (
                    <span className="text-red-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 animate-pulse" /> {totalConflicts} tiết trùng lịch GV
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCheck className="w-3.5 h-3.5" /> Không có xung đột
                    </span>
                  )}
                  {currentClassObj && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-700">
                        <span>GVCN: <strong className="text-blue-700 font-bold">{currentClassObj.homeroomTeacher || 'Chưa có'}</strong></span>
                        {onOpenQuickAssignHomeroom && (
                          <button
                            type="button"
                            onClick={onOpenQuickAssignHomeroom}
                            className="text-[10px] text-blue-600 hover:text-blue-800 underline font-semibold cursor-pointer ml-0.5"
                          >
                            [Đổi GVCN]
                          </button>
                        )}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {currentTab === 'timetable' && (
            <>
              {/* Grade Selector */}
              <select
                value={selectedGrade}
                onChange={(e) => {
                  const grade = Number(e.target.value);
                  onSelectGrade(grade);
                  const firstInGrade = classes.find(c => c.grade === grade);
                  if (firstInGrade) {
                    onSelectClass(firstInGrade.id);
                  }
                }}
                className="bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-700 rounded-xl px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white cursor-pointer"
              >
                <option value={10}>Khối 10</option>
                <option value={11}>Khối 11</option>
                <option value={12}>Khối 12</option>
              </select>

              {/* Class Selector */}
              <select
                value={selectedClassId}
                onChange={(e) => onSelectClass(e.target.value)}
                className="bg-white border border-blue-400 text-xs font-bold text-blue-700 rounded-xl px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer max-w-[180px] truncate"
              >
                {filteredClasses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.homeroomTeacher})
                  </option>
                ))}
              </select>

              {/* Print Single Class Button */}
              <button
                onClick={onPrint}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition text-xs font-semibold flex items-center gap-1.5"
                title="In thời khóa biểu lớp hiện tại"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">In TKB Lớp</span>
              </button>

              {/* Print All School PDF Button */}
              {onPrintAllPDF && (
                <button
                  onClick={onPrintAllPDF}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl transition text-xs font-bold flex items-center gap-1.5 border border-blue-200 hover:border-transparent cursor-pointer shadow-2xs"
                  title="Xuất tệp PDF thời khóa biểu toàn bộ các lớp của trường"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Xuất PDF Toàn Trường</span>
                  <span className="md:hidden">PDF Trường</span>
                </button>
              )}

              {/* Save Button */}
              <button
                onClick={onSaveTimetable}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                  isSavedJustNow
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                }`}
              >
                {isSavedJustNow ? (
                  <>
                    <CheckCheck className="w-4 h-4" /> Đã lưu
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Lưu TKB
                  </>
                )}
              </button>
            </>
          )}

          {/* Quick link to Homeroom assignment when not on it */}
          {currentTab !== 'homeroom' && (
            <button
              onClick={() => onSelectTab('homeroom')}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-blue-200 hover:border-transparent cursor-pointer"
              title="Mở phân công Giáo viên Chủ nhiệm"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Phân công GVCN</span>
            </button>
          )}

          {/* Data Cleaning Center Button */}
          {onOpenDataCleaning && (
            <button
              onClick={onOpenDataCleaning}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-50 to-indigo-50 hover:from-amber-100 hover:to-indigo-100 text-indigo-800 rounded-xl transition text-xs font-bold flex items-center gap-1.5 border border-indigo-200/80 hover:border-indigo-300 shadow-2xs cursor-pointer"
              title="Mở Trung tâm Làm sạch, Chuẩn hóa Dữ liệu & Xử lý Trùng lịch"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Làm sạch dữ liệu</span>
              <span className="sm:hidden">Làm sạch</span>
              {healthIssuesCount > 0 && (
                <span className="text-[10px] bg-amber-200/90 text-amber-900 font-extrabold px-1.5 py-0.2 rounded-full">
                  {healthIssuesCount}
                </span>
              )}
            </button>
          )}

          {/* Clear Timetable Button */}
          {onOpenClearTimetable && (
            <button
              onClick={onOpenClearTimetable}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition text-xs font-bold flex items-center gap-1.5 border border-rose-200 shadow-2xs cursor-pointer"
              title="Xóa thời khóa biểu theo lớp, theo khối hoặc toàn trường"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Xóa TKB</span>
            </button>
          )}

          {/* Reset Demo Button */}
          <button
            onClick={onResetDemo}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition text-xs font-medium flex items-center gap-1"
            title="Tải lại dữ liệu mẫu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <span className="hidden xl:inline text-[10px] font-semibold text-slate-500" title={userEmail}>{syncStatus}</span>
          {memberRole === 'admin' && (
            <button onClick={onInviteMember} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100" title="Mời thành viên đã đăng ký" aria-label="Mời thành viên">
              <UserPlus className="w-4 h-4" />
            </button>
          )}
          <button onClick={onChangePassword} className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100" title="Đổi mật khẩu" aria-label="Đổi mật khẩu">
            <KeyRound className="w-4 h-4" />
          </button>
          <button onClick={onLogout} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200" title={`Đăng xuất ${userEmail}`} aria-label="Đăng xuất">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Second Row: Navigation Tabs */}
      <div className="px-4 sm:px-6 bg-slate-50/70 overflow-x-auto flex items-center gap-1 border-t border-slate-100 no-scrollbar">
        {navTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`px-3 py-2 text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 border-b-2 -mb-px cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-700 bg-white shadow-2xs font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${tab.badgeColor || 'bg-slate-200 text-slate-700'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
