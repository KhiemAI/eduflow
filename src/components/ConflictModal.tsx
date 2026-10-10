import React from 'react';
import { AlertTriangle, UserCheck, X } from 'lucide-react';

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflictDetails: {
    teacher: string;
    day: number;
    session: number;
    period: number;
    conflictingClass: string;
    conflictingSubject: string;
    currentClass: string;
  } | null;
  onOpenSubstituteModal?: () => void;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  isOpen,
  onClose,
  conflictDetails,
  onOpenSubstituteModal,
}) => {
  if (!isOpen || !conflictDetails) return null;

  const dayName = `Thứ ${conflictDetails.day}`;
  const sessionName = conflictDetails.session === 1 ? 'Sáng' : 'Chiều';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in">
      <div 
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border border-red-200 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shrink-0 shadow-inner">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-red-700">Cảnh báo trùng lịch dạy!</h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Giáo viên <strong className="text-slate-900 font-semibold">{conflictDetails.teacher}</strong> hiện đã có lịch dạy môn <strong className="text-slate-900">{conflictDetails.conflictingSubject}</strong> tại lớp <span className="inline-block px-2 py-0.5 bg-red-100 text-red-800 rounded font-bold">{conflictDetails.conflictingClass}</span> vào:
            </p>
            
            <div className="mt-3 p-3 bg-red-50/70 border border-red-200 rounded-xl text-xs text-red-900 font-medium">
              📅 {sessionName} {dayName} • Tiết {conflictDetails.period} (Lớp {conflictDetails.currentClass})
            </div>

            <p className="text-xs text-slate-500 mt-3 italic">
              Vui lòng hoán đổi tiết học khác hoặc chọn giáo viên cùng bộ môn dạy thay để tránh trùng lịch.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition"
          >
            Tôi đã hiểu
          </button>
          {onOpenSubstituteModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSubstituteModal();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" /> Tìm GV dạy thay ngay
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
