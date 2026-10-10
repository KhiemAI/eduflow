import React, { useState } from 'react';
import { 
  AlertTriangle, 
  UserCheck, 
  Trash2, 
  Plus, 
  HelpCircle,
  Move,
  User,
  Maximize2,
  Minimize2,
  CalendarX2,
  Info
} from 'lucide-react';
import { TimetableEntry, SubjectConfig, SessionType } from '../types/index.ts';
import { checkTeacherConflict, TeacherConflictResult } from '../utils/conflictChecker.ts';
import { getPeriodTimeString, SESSION_TIME_SUMMARY } from '../data/periodSchedule.ts';
import { SlotDetailModal } from './SlotDetailModal.tsx';

interface TimetableGridProps {
  currentClassId: string;
  timetable: TimetableEntry[];
  allTimetables: Record<string, TimetableEntry[]>;
  subjectsConfig: Record<string, SubjectConfig>;
  periodsPerSession: number; // 4 or 5
  onMoveOrSwap: (
    source: { isNew?: boolean; sub?: string; teacher?: string; day?: number; session?: SessionType; period?: number },
    target: { day: number; session: SessionType; period: number }
  ) => void;
  onDeleteSlot: (day: number, session: SessionType, period: number) => void;
  onOpenSubstituteModal: (sub: string, teacher: string, day: number, session: SessionType, period: number) => void;
  onQuickAddSubject: (day: number, session: SessionType, period: number) => void;
  onShowConflictDetails: (
    teacher: string,
    day: number,
    session: SessionType,
    period: number,
    conflict: TeacherConflictResult
  ) => void;
  onOpenClearTimetableModal?: () => void;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  currentClassId,
  timetable,
  allTimetables,
  subjectsConfig,
  periodsPerSession = 4,
  onMoveOrSwap,
  onDeleteSlot,
  onOpenSubstituteModal,
  onQuickAddSubject,
  onShowConflictDetails,
  onOpenClearTimetableModal,
}) => {
  const days = [2, 3, 4, 5, 6, 7];
  const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const sessions: Array<{ id: SessionType; name: string }> = [
    { id: 1, name: 'Sáng' },
    { id: 2, name: 'Chiều' },
  ];
  const periods = Array.from({ length: periodsPerSession }, (_, i) => i + 1);

  const [dragOverCell, setDragOverCell] = useState<string | null>(null);
  const [isLargeView, setIsLargeView] = useState<boolean>(true);
  const [selectedSlotForDetail, setSelectedSlotForDetail] = useState<{
    day: number;
    session: SessionType;
    period: number;
    sub: string;
    teacher: string;
    conflictResult: TeacherConflictResult;
  } | null>(null);

  const getCellData = (day: number, session: SessionType, period: number) => {
    return timetable.find(
      (item) => item.day === day && item.session === session && item.period === period
    );
  };

  const handleDragOver = (e: React.DragEvent, cellKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCell !== cellKey) {
      setDragOverCell(cellKey);
    }
  };

  const handleDragLeave = (_e: React.DragEvent, cellKey: string) => {
    if (dragOverCell === cellKey) {
      setDragOverCell(null);
    }
  };

  const handleDrop = (
    e: React.DragEvent,
    targetDay: number,
    targetSession: SessionType,
    targetPeriod: number
  ) => {
    e.preventDefault();
    setDragOverCell(null);

    const rawData = e.dataTransfer.getData('text/plain');
    if (!rawData) return;

    try {
      const sourceInfo = JSON.parse(rawData);
      onMoveOrSwap(sourceInfo, { day: targetDay, session: targetSession, period: targetPeriod });
    } catch {
      // Fallback
    }
  };

  return (
    <div className="flex-1 overflow-auto p-3 sm:p-5">
      {/* Top Utility Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 px-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Chế độ hiển thị:</span>
          <span className="text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Ô TKB mở rộng • Tên GV đầy đủ
          </span>
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
            Đã xếp: <strong className="text-slate-900">{timetable.length}</strong> tiết
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenClearTimetableModal && (
            <button
              type="button"
              onClick={onOpenClearTimetableModal}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer group"
              title="Xóa thời khóa biểu của lớp này hoặc toàn bộ trường"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600 group-hover:scale-110 transition" />
              <span>Xóa thời khóa biểu...</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsLargeView(!isLargeView)}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Bật/Tắt thu phóng kích thước ô"
          >
            {isLargeView ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Thu gọn ô</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Phóng to ô</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Timetable Card Container */}
      <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${isLargeView ? 'min-w-[1150px]' : 'min-w-[850px]'}`}>
        <table className="w-full text-xs text-left border-collapse table-fixed">
          {/* Header Row */}
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
              <th className="px-3 py-3.5 w-22 text-center border-r border-slate-200 bg-slate-100/70">Buổi</th>
              <th className="px-3 py-3.5 w-28 text-center border-r border-slate-200 bg-slate-100/70">Tiết</th>
              {dayLabels.map((label, index) => (
                <th key={label} className="px-3 py-3.5 text-center border-r border-slate-200 last:border-r-0 font-extrabold text-slate-800 w-[14%]">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>{label}</span>
                    {index === 0 && (
                      <span className="text-[9px] font-normal normal-case px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Đầu tuần</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200">
            {sessions.map((session) => {
              return periods.map((period, pIndex) => {
                return (
                  <tr key={`${session.id}-${period}`} className="hover:bg-slate-50/50 transition-colors">
                    {/* Buổi (Rowspan) */}
                    {pIndex === 0 && (
                      <td
                        rowSpan={periods.length}
                        className="px-2 py-3 text-center border-r border-slate-200 font-extrabold bg-slate-50/90 text-slate-800 align-middle w-22"
                      >
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black uppercase shadow-2xs ${
                            session.id === 1 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                          }`}>
                            {session.name}
                          </span>
                          <span className="text-[10px] text-slate-600 font-bold block whitespace-nowrap">
                            {SESSION_TIME_SUMMARY[session.id].overallRange}
                          </span>
                          <span className="text-[9px] text-slate-400 font-normal px-1 py-0.5 rounded bg-white border border-slate-200/60 block">
                            {session.id === 1 ? 'Ra chơi: 30p' : 'Ra chơi: 15p'}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Tiết */}
                    <td className="px-2 py-2 text-center border-r border-slate-200 font-bold text-slate-700 bg-slate-50/50 w-28">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-black text-slate-800">Tiết {period}</span>
                        <span className="text-[10px] text-blue-700 font-bold mt-0.5 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60 whitespace-nowrap">
                          {getPeriodTimeString(session.id, period)}
                        </span>
                        {period === 2 && (
                          <span className="text-[9px] text-amber-800 font-semibold mt-1 px-1 py-0.5 rounded bg-amber-100/70 border border-amber-200 block whitespace-nowrap">
                            {session.id === 1 ? 'Ra chơi: 8h35-9h05' : 'Ra chơi: 14h35-14h50'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Columns for Days: Thứ 2 -> Thứ 7 */}
                    {days.map((day) => {
                      const cellKey = `${day}-${session.id}-${period}`;
                      const cellData = getCellData(day, session.id, period);
                      const isDragOver = dragOverCell === cellKey;

                      let conflictResult: TeacherConflictResult = { hasConflict: false };
                      if (cellData) {
                        conflictResult = checkTeacherConflict(
                          cellData.teacher,
                          currentClassId,
                          day,
                          session.id,
                          period,
                          allTimetables
                        );
                      }

                      const subConfig = cellData ? subjectsConfig[cellData.sub] : null;

                      return (
                        <td
                          key={cellKey}
                          onDragOver={(e) => handleDragOver(e, cellKey)}
                          onDragLeave={(e) => handleDragLeave(e, cellKey)}
                          onDrop={(e) => handleDrop(e, day, session.id, period)}
                          className={`p-2 border-r border-slate-200 last:border-r-0 align-top relative transition-all ${
                            isLargeView ? 'min-h-[128px] h-32' : 'min-h-[96px] h-24'
                          } ${
                            isDragOver ? 'bg-blue-100/70 border-2 border-dashed border-blue-500 scale-[0.98]' : ''
                          }`}
                        >
                          {cellData ? (
                            /* Occupied Card */
                            <div
                              draggable
                              onClick={() => {
                                setSelectedSlotForDetail({
                                  day,
                                  session: session.id,
                                  period,
                                  sub: cellData.sub,
                                  teacher: cellData.teacher,
                                  conflictResult,
                                });
                              }}
                              onDragStart={(e) => {
                                const payload = {
                                  isNew: false,
                                  day,
                                  session: session.id,
                                  period,
                                  sub: cellData.sub,
                                  teacher: cellData.teacher,
                                };
                                e.dataTransfer.setData('text/plain', JSON.stringify(payload));
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              className={`group p-2.5 rounded-xl border flex flex-col justify-between h-full select-none cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-blue-400/50 transition-all shadow-2xs hover:shadow-md relative overflow-hidden ${
                                conflictResult.hasConflict
                                  ? 'bg-red-50 border-red-300 text-red-950 ring-1 ring-red-400'
                                  : subConfig?.color || 'bg-slate-50 border-slate-200 text-slate-800'
                              }`}
                            >
                              {/* Subject header & Action buttons */}
                              <div className="flex items-start justify-between gap-1 pb-1 border-b border-black/5">
                                <div className="font-black text-sm tracking-tight flex items-center gap-1.5 truncate text-slate-900">
                                  {conflictResult.hasConflict && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onShowConflictDetails(cellData.teacher, day, session.id, period, conflictResult);
                                      }}
                                      className="text-red-600 hover:text-red-800 shrink-0"
                                      title={`Trùng lịch với lớp ${conflictResult.conflictingClass}! Nhấp để xem`}
                                    >
                                      <AlertTriangle className="w-4 h-4 animate-pulse text-red-600 shrink-0 inline" />
                                    </button>
                                  )}
                                  <span className="truncate">{cellData.sub}</span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  {/* Find substitute button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenSubstituteModal(cellData.sub, cellData.teacher, day, session.id, period);
                                    }}
                                    className="w-6 h-6 bg-white/95 hover:bg-blue-600 hover:text-white text-blue-700 border border-slate-200 hover:border-blue-600 rounded-md flex items-center justify-center shadow-2xs transition cursor-pointer"
                                    title="Đổi giáo viên dạy thay"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete slot button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteSlot(day, session.id, period);
                                    }}
                                    className="w-6 h-6 bg-white/95 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 hover:border-red-600 rounded-md flex items-center justify-center shadow-2xs hover:scale-105 active:scale-95 transition cursor-pointer"
                                    title="Xóa tiết học này"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Teacher info: FULL NAME DISPLAY, NO TRUNCATE */}
                              <div className="my-auto py-1.5 px-2 bg-white/90 rounded-lg border border-black/5 shadow-2xs flex items-center gap-2">
                                <div className="w-5.5 h-5.5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-700 shrink-0 shadow-2xs">
                                  <User className="w-3 h-3 text-slate-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className={`font-bold text-xs leading-snug break-words whitespace-normal ${
                                    conflictResult.hasConflict ? 'text-red-700 font-extrabold' : 'text-slate-900'
                                  }`}>
                                    {cellData.teacher}
                                  </div>
                                  {subConfig?.dept && (
                                    <div className="text-[10px] text-slate-400 font-medium leading-none mt-0.5 truncate">
                                      Tổ {subConfig.dept}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Footer: Conflict notice or subtle status */}
                              {conflictResult.hasConflict ? (
                                <div 
                                  onClick={() => onShowConflictDetails(cellData.teacher, day, session.id, period, conflictResult)}
                                  className="mt-auto text-[9.5px] bg-red-100 text-red-900 px-1.5 py-0.5 rounded font-bold cursor-pointer hover:bg-red-200 border border-red-200 flex items-center justify-between"
                                >
                                  <span>Trùng lịch ở lớp {conflictResult.conflictingClass}!</span>
                                  <span className="underline">Xem</span>
                                </div>
                              ) : (
                                <div className="mt-auto flex items-center justify-between text-[9.5px] text-slate-400">
                                  <span className={cellData.sub === 'Chào cờ' ? 'text-red-700 font-bold' : cellData.sub === 'SHL' ? 'text-pink-700 font-bold' : ''}>
                                    {cellData.sub === 'Chào cờ' ? 'Mặc định: Chào cờ' : cellData.sub === 'SHL' ? 'Mặc định: SHL' : 'Tiết chuẩn'}
                                  </span>
                                  <Move className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-70 transition" />
                                </div>
                              )}
                            </div>
                          ) : (
                            /* Empty Cell */
                            (() => {
                              const isDefChaoCo = day === 2 && session.id === 1 && period === 1;
                              const isDefSHL = day === 6 && session.id === 1 && period === 4;
                              return (
                                <button
                                  type="button"
                                  onClick={() => onQuickAddSubject(day, session.id, period)}
                                  className={`w-full h-full border border-dashed rounded-xl flex flex-col items-center justify-center transition-all group/btn ${
                                    isDefChaoCo
                                      ? 'border-red-300 bg-red-50/40 hover:border-red-500 hover:bg-red-50 text-red-600'
                                      : isDefSHL
                                      ? 'border-pink-300 bg-pink-50/40 hover:border-pink-500 hover:bg-pink-50 text-pink-600'
                                      : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 text-slate-400 hover:text-blue-600'
                                  }`}
                                  title={
                                    isDefChaoCo
                                      ? 'Tiết mặc định toàn trường: Chào cờ đầu tuần (Nhấp để xếp nhanh)'
                                      : isDefSHL
                                      ? 'Tiết mặc định toàn trường: Sinh hoạt lớp (SHL) (Nhấp để xếp nhanh)'
                                      : 'Nhấp để xếp môn học'
                                  }
                                >
                                  <Plus className={`w-5 h-5 transition group-hover/btn:scale-110 ${
                                    isDefChaoCo ? 'text-red-500 opacity-80' : isDefSHL ? 'text-pink-500 opacity-80' : 'opacity-30 group-hover/btn:opacity-100'
                                  }`} />
                                  <span className={`text-[10px] font-bold transition mt-0.5 ${
                                    isDefChaoCo ? 'opacity-90 text-red-600' : isDefSHL ? 'opacity-90 text-pink-600' : 'text-[11px] opacity-0 group-hover/btn:opacity-100'
                                  }`}>
                                    {isDefChaoCo ? '+ Chào cờ' : isDefSHL ? '+ SHL' : '+ Xếp môn'}
                                  </span>
                                </button>
                              );
                            })()
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>

      {/* Legend & Instructions */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" /> Hướng dẫn:
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-blue-100 border border-blue-300"></span> Bình thường (Nhấp vào ô để xem / xóa / đổi GV)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-red-100 border border-red-400"></span> Trùng lịch GV (Nhấp xem chi tiết)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md border border-dashed border-slate-300"></span> Tiết trống (Kéo môn vào hoặc nhấp +)
          </span>
        </div>

        <div className="text-[11px] text-slate-400">
          * Kéo thả môn học giữa các ô để hoán đổi vị trí (Swap) • Bấm icon thùng rác hoặc nhấp vào ô để xóa tiết
        </div>
      </div>

      {/* Slot Detail Modal */}
      {selectedSlotForDetail && (
        <SlotDetailModal
          isOpen={true}
          onClose={() => setSelectedSlotForDetail(null)}
          classId={currentClassId}
          day={selectedSlotForDetail.day}
          session={selectedSlotForDetail.session}
          period={selectedSlotForDetail.period}
          subject={selectedSlotForDetail.sub}
          teacher={selectedSlotForDetail.teacher}
          subConfig={subjectsConfig[selectedSlotForDetail.sub]}
          conflictResult={selectedSlotForDetail.conflictResult}
          onDeleteSlot={(d, s, p) => {
            onDeleteSlot(d, s, p);
            setSelectedSlotForDetail(null);
          }}
          onOpenSubstitute={(sub, t, d, s, p) => {
            setSelectedSlotForDetail(null);
            onOpenSubstituteModal(sub, t, d, s, p);
          }}
        />
      )}
    </div>
  );
};
