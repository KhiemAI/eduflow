import React, { useState, useEffect } from 'react';
import { PlusCircle, X, Check, Sparkles } from 'lucide-react';
import { SubjectConfig, Teacher, SessionType, SchoolClass } from '../types/index.ts';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSlot: { day: number; session: SessionType; period: number } | null;
  currentClass?: SchoolClass;
  subjectsConfig: Record<string, SubjectConfig>;
  teachers: Teacher[];
  onAddSubject: (sub: string, teacher: string) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  targetSlot,
  currentClass,
  subjectsConfig,
  teachers,
  onAddSubject,
}) => {
  if (!isOpen || !targetSlot) return null;

  const subjectsList = Object.values(subjectsConfig);

  // Check if target slot is default Chào cờ (Sáng Thứ 2 Tiết 1) or SHL (Sáng Thứ 6 Tiết 4)
  const isDefaultChaoCoSlot = targetSlot.day === 2 && targetSlot.session === 1 && targetSlot.period === 1;
  const isDefaultSHLSlot = targetSlot.day === 6 && targetSlot.session === 1 && targetSlot.period === 4;

  const getInitialSubject = () => {
    if (isDefaultChaoCoSlot) return 'Chào cờ';
    if (isDefaultSHLSlot) return 'SHL';
    return subjectsList[0]?.name || 'Toán';
  };

  const getInitialTeacher = (subName: string) => {
    if (isDefaultChaoCoSlot) return 'BGH & Đoàn trường';
    if (isDefaultSHLSlot) {
      if (currentClass?.homeroomTeacher && currentClass.homeroomTeacher !== 'Chưa phân công') {
        return currentClass.homeroomTeacher;
      }
      return 'GVCN';
    }
    const defTeacher = subjectsConfig[subName]?.defaultTeacher;
    return defTeacher || teachers[0]?.name || '';
  };

  const [selectedSub, setSelectedSub] = useState<string>(getInitialSubject);
  const [selectedTeacher, setSelectedTeacher] = useState<string>(() => getInitialTeacher(getInitialSubject()));

  // Reset when targetSlot changes
  useEffect(() => {
    const initSub = getInitialSubject();
    setSelectedSub(initSub);
    setSelectedTeacher(getInitialTeacher(initSub));
  }, [targetSlot?.day, targetSlot?.session, targetSlot?.period, currentClass?.homeroomTeacher]);

  const handleSubChange = (subName: string) => {
    setSelectedSub(subName);
    const defTeacher = subjectsConfig[subName]?.defaultTeacher;
    if (defTeacher) {
      setSelectedTeacher(defTeacher);
    }
  };

  const handleConfirm = () => {
    onAddSubject(selectedSub, selectedTeacher);
    onClose();
  };

  const dayName = `Thứ ${targetSlot.day}`;
  const sessionName = targetSlot.session === 1 ? 'Sáng' : 'Chiều';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Xếp Môn Học Vào Tiết Trống</h3>
              <p className="text-[11px] text-slate-500">{sessionName} {dayName} • Tiết {targetSlot.period}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Smart Preset Indicators */}
          {isDefaultChaoCoSlot && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-800">
              <Sparkles className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[11px]">Tiết mặc định toàn trường: Chào cờ đầu tuần</p>
                <p className="text-[10px] text-red-600 mt-0.5">
                  Đã tự động chọn môn <strong>Chào cờ</strong> và phụ trách <strong>BGH & Đoàn trường</strong>.
                </p>
              </div>
            </div>
          )}

          {isDefaultSHLSlot && (
            <div className="p-3 bg-pink-50 border border-pink-200 rounded-xl flex items-start gap-2 text-pink-800">
              <Sparkles className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[11px]">Tiết mặc định toàn trường: Sinh hoạt lớp (SHL)</p>
                <p className="text-[10px] text-pink-600 mt-0.5">
                  Đã tự động chọn môn <strong>SHL</strong> và phân công cho GVCN {currentClass?.homeroomTeacher ? `(${currentClass.homeroomTeacher})` : ''}.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1.5">Chọn Môn học:</label>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50">
              {subjectsList.map((s) => {
                const isSelected = selectedSub === s.name;
                return (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => handleSubChange(s.name)}
                    className={`p-2 rounded-lg text-left font-bold text-xs transition border flex flex-col justify-between h-14 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-2xs ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="truncate">{s.name}</span>
                    <span className="text-[9px] font-normal opacity-70 truncate">{s.dept}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1.5">Giáo viên phụ trách:</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-xs font-medium"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name} ({t.dept})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-100 transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Check className="w-3.5 h-3.5" /> Thêm vào TKB
          </button>
        </div>
      </div>
    </div>
  );
};
