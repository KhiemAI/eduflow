import React, { useState } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Calendar, 
  User, 
  DoorOpen, 
  Sun, 
  Moon,
  ArrowRight,
  X,
  Sparkles,
  Search,
  Printer,
  Trash2
} from 'lucide-react';
import { SchoolClass, Teacher, TimetableEntry } from '../types/index.ts';

interface ClassManagementProps {
  classes: SchoolClass[];
  teachers?: Teacher[];
  allTimetables: Record<string, TimetableEntry[]>;
  onSelectClassToEdit: (classId: string) => void;
  onAddClass: (newClass: SchoolClass) => void;
  onNavigateToHomeroom?: () => void;
  onUpdateHomeroomTeacher?: (classId: string, teacherName: string, syncSHL: boolean) => void;
  onPrintAllPDF?: () => void;
  onOpenClearTimetable?: (classId: string) => void;
}

export const ClassManagement: React.FC<ClassManagementProps> = ({
  classes,
  teachers = [],
  allTimetables,
  onSelectClassToEdit,
  onAddClass,
  onNavigateToHomeroom,
  onUpdateHomeroomTeacher,
  onPrintAllPDF,
  onOpenClearTimetable,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<number | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New class state
  const [newClassName, setNewClassName] = useState('');
  const [newGrade, setNewGrade] = useState(10);
  const [newHomeroomTeacher, setNewHomeroomTeacher] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [newSession, setNewSession] = useState<'full_day' | 1 | 2>('full_day');

  const filteredClasses = classes.filter(c => {
    const matchesGrade = selectedGrade === 'ALL' || c.grade === selectedGrade;
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.homeroomTeacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.room.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGrade && matchesSearch;
  });

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const id = newClassName.trim().toUpperCase();
    const createdClass: SchoolClass = {
      id,
      name: `Lớp ${id}`,
      grade: Number(newGrade),
      homeroomTeacher: newHomeroomTeacher.trim() || 'Chưa phân công',
      session: newSession,
      room: newRoom.trim() || `Phòng ${newGrade}01`,
    };

    onAddClass(createdClass);
    setIsAddModalOpen(false);
    setNewClassName('');
    setNewHomeroomTeacher('');
    setNewRoom('');
  };

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600" /> Quản lý Danh sách Lớp học
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tổng quan các lớp toàn trường theo khối 10, 11, 12, phân công giáo viên chủ nhiệm và tiến độ xếp thời khóa biểu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onPrintAllPDF && (
            <button
              onClick={onPrintAllPDF}
              className="px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              <span>Xuất PDF Toàn Trường ({classes.length} Lớp)</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Thêm Lớp học mới
          </button>
        </div>
      </div>

      {/* Grade tabs & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          <button
            onClick={() => setSelectedGrade('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedGrade === 'ALL' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tất cả ({classes.length} lớp)
          </button>
          {[10, 11, 12].map(grade => (
            <button
              key={grade}
              onClick={() => setSelectedGrade(grade)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedGrade === grade ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Khối {grade} ({classes.filter(c => c.grade === grade).length} lớp)
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm lớp (10A1, 11A15...)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Classes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.map((item) => {
          const classTimetable = allTimetables[item.id] || [];
          const periodsCount = classTimetable.length;
          // Chuẩn quy định: 40 tiết / tuần
          const targetPeriods = 40;
          const progressPercent = Math.min(100, Math.round((periodsCount / targetPeriods) * 100));

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-800">{item.name}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        Khối {item.grade}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <DoorOpen className="w-3.5 h-3.5 text-slate-400" /> {item.room}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {item.session === 'full_day' ? (
                          <span className="flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <Sun className="w-3.5 h-3.5 text-amber-500" />
                            <Moon className="w-3.5 h-3.5 text-indigo-500" />
                            Học cả ngày
                          </span>
                        ) : item.session === 1 ? (
                          <span className="flex items-center gap-1 text-amber-700 font-medium">
                            <Sun className="w-3.5 h-3.5 text-amber-500" /> Ca Sáng
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-indigo-700 font-medium">
                            <Moon className="w-3.5 h-3.5 text-indigo-500" /> Ca Chiều
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                    {item.grade}
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <User className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="min-w-0 truncate">
                      <span className="text-[10px] text-slate-400 font-medium block">Giáo viên chủ nhiệm</span>
                      <strong className="text-slate-800 truncate block">{item.homeroomTeacher || 'Chưa phân công'}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {onUpdateHomeroomTeacher && teachers.length > 0 ? (
                      <select
                        value={item.homeroomTeacher || 'Chưa phân công'}
                        onChange={(e) => onUpdateHomeroomTeacher(item.id, e.target.value, true)}
                        className="bg-white border border-slate-300 text-slate-700 rounded-lg px-2 py-1 text-[11px] font-medium outline-none focus:border-blue-500 max-w-[120px]"
                        title="Đổi nhanh GVCN"
                      >
                        <option value="Chưa phân công">-- Chọn GVCN --</option>
                        {teachers.filter(t => t.name !== 'BGH & Đoàn trường' && t.name !== 'GVCN').map(t => (
                          <option key={t.id} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                    ) : onNavigateToHomeroom && (
                      <button
                        type="button"
                        onClick={onNavigateToHomeroom}
                        className="px-2 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                      >
                        Xếp GVCN
                      </button>
                    )}
                  </div>
                </div>

                {/* Timetable fill progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500">Đã xếp lịch:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">{periodsCount} / {targetPeriods} tiết ({progressPercent}%)</span>
                      {periodsCount > 0 && onOpenClearTimetable && (
                        <button
                          type="button"
                          onClick={() => onOpenClearTimetable(item.id)}
                          className="w-5 h-5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition cursor-pointer"
                          title={`Xóa thời khóa biểu lớp ${item.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        progressPercent >= 100 ? 'bg-emerald-500' : progressPercent > 50 ? 'bg-blue-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectClassToEdit(item.id)}
                  className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-blue-200 hover:border-transparent cursor-pointer"
                >
                  <span>Mở khung xếp TKB {item.id}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                </button>

                {periodsCount > 0 && onOpenClearTimetable && (
                  <button
                    type="button"
                    onClick={() => onOpenClearTimetable(item.id)}
                    className="p-2.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-300 rounded-xl transition cursor-pointer"
                    title={`Xóa thời khóa biểu lớp ${item.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Class Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <form
            onSubmit={handleCreateClass}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
          >
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-base">Thêm Lớp học mới</h3>
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
                <label className="font-bold text-slate-700 block mb-1">Tên Lớp (Mã lớp) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 10A5 hoặc 11B2"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Khối học</label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-xs"
                  >
                    <option value={10}>Khối 10</option>
                    <option value={11}>Khối 11</option>
                    <option value={12}>Khối 12</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Buổi học chính</label>
                  <select
                    value={newSession}
                    onChange={(e) => setNewSession(e.target.value === 'full_day' ? 'full_day' : Number(e.target.value) as 1 | 2)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-xs font-semibold"
                  >
                    <option value="full_day">Học cả ngày (Sáng & Chiều)</option>
                    <option value={1}>Chỉ học Buổi Sáng</option>
                    <option value={2}>Chỉ học Buổi Chiều</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Giáo viên chủ nhiệm</label>
                {teachers.length > 0 ? (
                  <select
                    value={newHomeroomTeacher}
                    onChange={(e) => setNewHomeroomTeacher(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-xs font-semibold"
                  >
                    <option value="Chưa phân công">Chưa phân công</option>
                    {teachers
                      .filter(t => t.name !== 'BGH & Đoàn trường' && t.name !== 'GVCN')
                      .map(t => (
                        <option key={t.id} value={t.name}>
                          {t.name} (Tổ {t.dept})
                        </option>
                      ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Ví dụ: Thầy Hoàng Minh"
                    value={newHomeroomTeacher}
                    onChange={(e) => setNewHomeroomTeacher(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-xs"
                  />
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phòng học</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Phòng 205"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
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
                Thêm Lớp
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
