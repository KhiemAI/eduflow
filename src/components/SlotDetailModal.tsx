import React from 'react';
import { 
  X, 
  Trash2, 
  UserCheck, 
  AlertTriangle, 
  Clock, 
  BookOpen, 
  User, 
  School,
  CheckCircle2
} from 'lucide-react';
import { SubjectConfig, SessionType } from '../types/index.ts';
import { TeacherConflictResult } from '../utils/conflictChecker.ts';
import { getPeriodTimeString } from '../data/periodSchedule.ts';

interface SlotDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  day: number;
  session: SessionType;
  period: number;
  subject: string;
  teacher: string;
  subConfig?: SubjectConfig | null;
  conflictResult: TeacherConflictResult;
  onDeleteSlot: (day: number, session: SessionType, period: number) => void;
  onOpenSubstitute: (sub: string, teacher: string, day: number, session: SessionType, period: number) => void;
}

export const SlotDetailModal: React.FC<SlotDetailModalProps> = ({
  isOpen,
  onClose,
  classId,
  day,
  session,
  period,
  subject,
  teacher,
  subConfig,
  conflictResult,
  onDeleteSlot,
  onOpenSubstitute,
}) => {
  if (!isOpen) return null;

  const dayName = `Thứ ${day}`;
  const sessionName = session === 1 ? 'Buổi Sáng' : 'Buổi Chiều';
  const timeStr = getPeriodTimeString(session, period);

  const handleDelete = () => {
    onDeleteSlot(day, session, period);
    onClose();
  };

  const handleSubstitute = () => {
    onClose();
    onOpenSubstitute(subject, teacher, day, session, period);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-sm">Chi Tiết Tiết Học</h3>
              <p className="text-[11px] text-slate-500">Lớp {classId} • {sessionName} {dayName} • Tiết {period}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Main Info Card */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            conflictResult.hasConflict
              ? 'bg-red-50/60 border-red-200'
              : 'bg-slate-50/70 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Môn học</span>
                <span className="text-base font-black text-slate-900">{subject}</span>
              </div>
              {subConfig?.dept && (
                <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-[11px] shadow-2xs">
                  Tổ {subConfig.dept}
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 shadow-2xs">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Giáo viên phụ trách:</span>
                  <span className="font-extrabold text-slate-900 text-xs">{teacher || 'Chưa phân công'}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium">Thời gian:</span>
                <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {timeStr}
                </span>
              </div>
            </div>

            {/* Conflict Banner */}
            {conflictResult.hasConflict ? (
              <div className="p-2.5 rounded-lg bg-red-100 text-red-900 border border-red-200 flex items-start gap-2 text-[11px]">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <strong className="block font-bold">Cảnh báo trùng lịch dạy!</strong>
                  Giáo viên {teacher} đang bị trùng tiết tại lớp <strong className="underline">{conflictResult.conflictingClass}</strong> ({conflictResult.conflictingSubject}).
                </div>
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-2 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Tiết học chuẩn, không có xung đột lịch giảng dạy.</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2.5">
          {/* Delete Slot Button - VERY PROMINENT */}
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 py-2.5 px-3 bg-rose-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 hover:border-red-600 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
            title="Xóa tiết học này khỏi thời khóa biểu"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xóa tiết này</span>
          </button>

          {/* Change Teacher Button */}
          <button
            type="button"
            onClick={handleSubstitute}
            className="flex-1 py-2.5 px-3 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Đổi giáo viên</span>
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-semibold text-xs transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
