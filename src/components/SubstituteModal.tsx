import React from 'react';
import { UserCheck, Clock, Check, X, ShieldAlert, BookOpen } from 'lucide-react';
import { Teacher, SubjectConfig } from '../types/index.ts';

interface SubstituteModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSlot: {
    day: number;
    session: number;
    period: number;
    sub: string;
    teacher: string;
  } | null;
  availableTeachers: Array<Teacher & { isFree: boolean; weeklyLoad: number; sameDept: boolean }>;
  subjectsConfig: Record<string, SubjectConfig>;
  onSelectTeacher: (teacherName: string) => void;
}

export const SubstituteModal: React.FC<SubstituteModalProps> = ({
  isOpen,
  onClose,
  targetSlot,
  availableTeachers,
  subjectsConfig,
  onSelectTeacher,
}) => {
  if (!isOpen || !targetSlot) return null;

  const dayName = `Thứ ${targetSlot.day}`;
  const sessionName = targetSlot.session === 1 ? 'Sáng' : 'Chiều';
  const deptName = subjectsConfig[targetSlot.sub]?.dept || 'Bộ môn';

  const sameDeptTeachers = availableTeachers.filter(t => t.sameDept);
  const otherDeptTeachers = availableTeachers.filter(t => !t.sameDept);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] border border-slate-200 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Đề xuất GV Dạy thay</h3>
              <p className="text-xs text-blue-700 font-medium">Tự động đối chiếu lịch rảnh theo thời gian thực</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 p-1.5 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slot Info Card */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 text-sm">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Khung giờ</span>
                <span className="font-bold text-slate-800">{sessionName} {dayName} - Tiết {targetSlot.period}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
              <BookOpen className="w-4 h-4 text-purple-600 shrink-0" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Môn & GV Hiện tại</span>
                <span className="font-bold text-slate-800 truncate block">{targetSlot.sub} ({targetSlot.teacher})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Teachers List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 divide-y divide-slate-100">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Giáo viên cùng bộ môn ({deptName})
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Ưu tiên phân công</span>
            </div>

            {sameDeptTeachers.length === 0 ? (
              <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl text-center text-xs text-amber-800">
                Không tìm thấy giáo viên nào khác trong tổ {deptName}.
              </div>
            ) : (
              <div className="space-y-2">
                {sameDeptTeachers.map((teacher) => {
                  const isFree = teacher.isFree;
                  return (
                    <div
                      key={teacher.id}
                      onClick={() => onSelectTeacher(teacher.name)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isFree 
                          ? 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 bg-white hover:shadow-sm' 
                          : 'border-red-200 bg-red-50/30 hover:bg-red-50/60 opacity-80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          isFree ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {teacher.name.charAt(teacher.name.lastIndexOf(' ') + 1) || 'GV'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">{teacher.name}</span>
                            {isFree ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Đang rảnh
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                <ShieldAlert className="w-3 h-3" /> Bận tiết này
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">
                            Tổ {teacher.dept} • Hiện dạy: <strong className="text-slate-700">{teacher.weeklyLoad}</strong>/{teacher.maxLoad} tiết/tuần
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                          isFree
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" /> Chọn
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Other departments collapsible if needed */}
          {otherDeptTeachers.length > 0 && (
            <div className="pt-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Giáo viên bộ môn khác đang rảnh
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {otherDeptTeachers.filter(t => t.isFree).slice(0, 4).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTeacher(t.name)}
                    className="flex items-center justify-between p-2 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition cursor-pointer text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-700">{t.name}</span>
                      <span className="text-slate-400 ml-2">({t.dept} • {t.weeklyLoad} tiết)</span>
                    </div>
                    <span className="text-blue-600 font-medium text-[11px] hover:underline">Thay thế</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
          <span>* Hệ thống ưu tiên gợi ý giáo viên có số tiết dạy trong tuần thấp hơn</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-medium transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
