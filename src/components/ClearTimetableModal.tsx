import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  X, 
  RotateCcw, 
  CheckCircle2, 
  ShieldAlert, 
  Calendar, 
  GraduationCap, 
  Sun, 
  Moon,
  Info,
  Check
} from 'lucide-react';
import { SchoolClass, TimetableEntry, SessionType } from '../types/index.ts';

export type ClearScope = 'current_class' | 'all_school' | 'grade' | 'session';

export interface ClearTimetableOptions {
  scope: ClearScope;
  targetClassId?: string;
  targetGrade?: number;
  targetSession?: SessionType;
  keepSpecialSlots: boolean; // Giữ lại Chào cờ & SHL
}

interface ClearTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: SchoolClass[];
  selectedClassId: string;
  allTimetables: Record<string, TimetableEntry[]>;
  onConfirmClear: (options: ClearTimetableOptions) => void;
  onUndoLastClear?: () => void;
  hasUndoableBackup?: boolean;
}

export const ClearTimetableModal: React.FC<ClearTimetableModalProps> = ({
  isOpen,
  onClose,
  classes,
  selectedClassId,
  allTimetables,
  onConfirmClear,
  onUndoLastClear,
  hasUndoableBackup = false,
}) => {
  const [scope, setScope] = useState<ClearScope>('current_class');
  const [targetClassId, setTargetClassId] = useState<string>(selectedClassId);
  const [targetGrade, setTargetGrade] = useState<number>(10);
  const [targetSession, setTargetSession] = useState<SessionType>(1);
  const [keepSpecialSlots, setKeepSpecialSlots] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  // Sync targetClassId when selectedClassId changes
  React.useEffect(() => {
    if (selectedClassId) {
      setTargetClassId(selectedClassId);
    }
  }, [selectedClassId]);

  // Reset confirmation state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setIsConfirming(false);
    }
  }, [isOpen]);

  // Helper check for special slots (Chào cờ, Sinh hoạt lớp)
  const isSpecialSlot = (slot: TimetableEntry) => {
    const isChaoCo = (slot.day === 2 && slot.session === 1 && slot.period === 1) || 
                     slot.sub.toLowerCase().includes('chào cờ') || 
                     slot.sub.toLowerCase() === 'cc';
    const isSHL = slot.sub.toLowerCase().includes('sinh hoạt') || 
                  slot.sub.toUpperCase() === 'SHL';
    return isChaoCo || isSHL;
  };

  // Calculate affected slots and classes
  const calculation = useMemo(() => {
    let affectedClassIds: string[] = [];

    if (scope === 'current_class') {
      affectedClassIds = [targetClassId];
    } else if (scope === 'all_school') {
      affectedClassIds = classes.map((c) => c.id);
    } else if (scope === 'grade') {
      affectedClassIds = classes.filter((c) => c.grade === targetGrade).map((c) => c.id);
    } else if (scope === 'session') {
      affectedClassIds = classes.map((c) => c.id);
    }

    let totalSlotsToDelete = 0;
    let specialSlotsPreserved = 0;

    affectedClassIds.forEach((cId) => {
      const list = allTimetables[cId] || [];
      list.forEach((slot) => {
        // If scope is session, only count matching session
        if (scope === 'session' && slot.session !== targetSession) {
          return;
        }

        if (keepSpecialSlots && isSpecialSlot(slot)) {
          specialSlotsPreserved++;
        } else {
          totalSlotsToDelete++;
        }
      });
    });

    return {
      affectedClassesCount: affectedClassIds.length,
      affectedClassIds,
      totalSlotsToDelete,
      specialSlotsPreserved,
    };
  }, [scope, targetClassId, targetGrade, targetSession, keepSpecialSlots, classes, allTimetables]);

  if (!isOpen) return null;

  const currentClassObj = classes.find((c) => c.id === targetClassId) || classes[0];

  const handleExecute = () => {
    onConfirmClear({
      scope,
      targetClassId: scope === 'current_class' ? targetClassId : undefined,
      targetGrade: scope === 'grade' ? targetGrade : undefined,
      targetSession: scope === 'session' ? targetSession : undefined,
      keepSpecialSlots,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-rose-100 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white flex justify-between items-center shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-white shadow-inner">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-black text-base tracking-tight text-white flex items-center gap-2">
                Xóa Thời Khóa Biểu
              </h2>
              <p className="text-xs text-rose-100">
                Làm sạch lịch học đã xếp theo lớp, theo khối hoặc toàn bộ trường
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Quick Undo Banner if available */}
          {hasUndoableBackup && onUndoLastClear && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2 text-amber-900">
                <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold">Bạn vừa thực hiện xóa TKB trước đó? Có thể khôi phục lại ngay:</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onUndoLastClear();
                  onClose();
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition shrink-0 cursor-pointer shadow-xs"
              >
                Hoàn tác vừa xóa
              </button>
            </div>
          )}

          {/* Section 1: Choose Scope */}
          <div>
            <label className="font-extrabold text-slate-800 text-xs block mb-2">
              1. Chọn phạm vi cần xóa thời khóa biểu:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Option 1: Current Class */}
              <button
                type="button"
                onClick={() => setScope('current_class')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  scope === 'current_class'
                    ? 'border-rose-500 bg-rose-50/70 text-rose-950 ring-2 ring-rose-400/50'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-rose-600" />
                    Lớp hiện tại
                  </span>
                  {scope === 'current_class' && <Check className="w-4 h-4 text-rose-600" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Chỉ xóa các tiết của riêng lớp {targetClassId || selectedClassId}
                </p>
              </button>

              {/* Option 2: Entire School */}
              <button
                type="button"
                onClick={() => setScope('all_school')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  scope === 'all_school'
                    ? 'border-rose-500 bg-rose-50/70 text-rose-950 ring-2 ring-rose-400/50'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    Toàn bộ trường
                  </span>
                  {scope === 'all_school' && <Check className="w-4 h-4 text-rose-600" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Xóa trắng TKB tất cả {classes.length} lớp để xếp mới từ đầu
                </p>
              </button>

              {/* Option 3: By Grade */}
              <button
                type="button"
                onClick={() => setScope('grade')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  scope === 'grade'
                    ? 'border-rose-500 bg-rose-50/70 text-rose-950 ring-2 ring-rose-400/50'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-rose-600" />
                    Theo Khối lớp
                  </span>
                  {scope === 'grade' && <Check className="w-4 h-4 text-rose-600" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Xóa tất cả các lớp thuộc Khối 10, 11 hoặc 12
                </p>
              </button>

              {/* Option 4: By Session */}
              <button
                type="button"
                onClick={() => setScope('session')}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  scope === 'session'
                    ? 'border-rose-500 bg-rose-50/70 text-rose-950 ring-2 ring-rose-400/50'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-rose-600" />
                    Theo Buổi học
                  </span>
                  {scope === 'session' && <Check className="w-4 h-4 text-rose-600" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Chỉ xóa các tiết Buổi Sáng hoặc Buổi Chiều
                </p>
              </button>
            </div>
          </div>

          {/* Section 2: Detailed Parameters based on Scope */}
          {scope === 'current_class' && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="font-bold text-slate-700 block">Chọn lớp học cần xóa:</label>
              <select
                value={targetClassId}
                onChange={(e) => setTargetClassId(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs outline-none focus:border-rose-500"
              >
                {classes.map((c) => {
                  const count = (allTimetables[c.id] || []).length;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id}) — {count} tiết đã xếp
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {scope === 'grade' && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="font-bold text-slate-700 block">Chọn khối lớp cần xóa:</label>
              <div className="grid grid-cols-3 gap-2">
                {[10, 11, 12].map((g) => {
                  const countInGrade = classes.filter((c) => c.grade === g).length;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setTargetGrade(g)}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                        targetGrade === g
                          ? 'bg-rose-50 border-rose-500 text-rose-700 ring-1 ring-rose-400'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Khối {g}
                      <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                        {countInGrade} lớp
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {scope === 'session' && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="font-bold text-slate-700 block">Chọn buổi học cần xóa:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetSession(1)}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                    targetSession === 1
                      ? 'bg-amber-50 border-amber-500 text-amber-800 ring-1 ring-amber-400'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Buổi Sáng (Tiết 1 - 4/5)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetSession(2)}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                    targetSession === 2
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-800 ring-1 ring-indigo-400'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span>Buổi Chiều (Tiết 1 - 4/5)</span>
                </button>
              </div>
            </div>
          )}

          {/* Section 3: Preservation Options */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={keepSpecialSlots}
                onChange={(e) => setKeepSpecialSlots(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <div>
                <span className="font-bold text-slate-800 text-xs block">
                  Giữ lại tiết Chào cờ & Sinh hoạt lớp (SHL)
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Không xóa tiết Chào cờ đầu tuần (Sáng Thứ 2 - Tiết 1) và tiết Sinh hoạt lớp (Sáng Thứ 6 - Tiết 4). Chỉ xóa các tiết văn hóa khác.
                </span>
              </div>
            </label>
          </div>

          {/* Section 4: Deletion Impact Summary Card */}
          <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-rose-800 font-extrabold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Xác nhận thông tin xóa:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-slate-700 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-rose-100">
                <span className="text-slate-400 block text-[10px]">Số lớp bị ảnh hưởng:</span>
                <strong className="text-sm font-black text-slate-800">
                  {calculation.affectedClassesCount} lớp
                </strong>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-rose-100">
                <span className="text-slate-400 block text-[10px]">Tổng số tiết sẽ xóa:</span>
                <strong className="text-sm font-black text-rose-600">
                  {calculation.totalSlotsToDelete} tiết
                </strong>
              </div>
            </div>

            {keepSpecialSlots && calculation.specialSlotsPreserved > 0 && (
              <p className="text-[11px] text-emerald-700 font-medium pt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Sẽ giữ lại {calculation.specialSlotsPreserved} tiết Chào cờ & Sinh hoạt lớp.
              </p>
            )}

            <div className="text-[11px] text-slate-600 pt-1 leading-relaxed border-t border-rose-100">
              <Info className="w-3.5 h-3.5 text-blue-600 inline mr-1" />
              <strong>Dữ liệu an toàn:</strong> Danh sách Giáo viên ({classes.length} GV), Danh sách Lớp học và Cấu hình Môn học vẫn được <strong>giữ nguyên 100%</strong>. Sau khi xóa bạn có thể xếp lại lịch ngay.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            Hủy bỏ
          </button>

          <div className="flex items-center gap-2">
            {!isConfirming ? (
              <button
                type="button"
                onClick={() => setIsConfirming(true)}
                disabled={calculation.totalSlotsToDelete === 0}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-xs cursor-pointer ${
                  calculation.totalSlotsToDelete === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {calculation.totalSlotsToDelete === 0
                    ? 'Không có tiết nào để xóa'
                    : `Tiếp tục xóa (${calculation.totalSlotsToDelete} tiết)`}
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfirming(false)}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold text-xs transition"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleExecute}
                  className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl font-black text-xs transition flex items-center gap-2 shadow-md shadow-red-700/30 animate-pulse cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>XÁC NHẬN XÓA NGAY</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
