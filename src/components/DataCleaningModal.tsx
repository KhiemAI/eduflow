import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  RotateCcw, 
  Download, 
  Trash2, 
  Check, 
  AlertCircle, 
  Info,
  Calendar,
  Layers,
  FileCheck2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SchoolClass, Teacher, TimetableEntry, SubjectConfig } from '../types/index.ts';
import { 
  scanDataHealth, 
  executeDataCleaning, 
  DataHealthReport, 
  CleaningOptions, 
  CleaningSummary 
} from '../utils/dataCleaner.ts';

interface DataCleaningModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: SchoolClass[];
  teachers: Teacher[];
  subjectsConfig: Record<string, SubjectConfig>;
  allTimetables: Record<string, TimetableEntry[]>;
  onApplyCleaning: (
    cleanedData: {
      classes: SchoolClass[];
      teachers: Teacher[];
      subjectsConfig: Record<string, SubjectConfig>;
      allTimetables: Record<string, TimetableEntry[]>;
    },
    summary: CleaningSummary
  ) => void;
  hasUndoSnapshot: boolean;
  onUndoCleaning: () => void;
  onExportBackupJSON: () => void;
}

export const DataCleaningModal: React.FC<DataCleaningModalProps> = ({
  isOpen,
  onClose,
  classes,
  teachers,
  subjectsConfig,
  allTimetables,
  onApplyCleaning,
  hasUndoSnapshot,
  onUndoCleaning,
  onExportBackupJSON,
}) => {
  const [report, setReport] = useState<DataHealthReport | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [lastSummary, setLastSummary] = useState<CleaningSummary | null>(null);

  // Options state
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [syncSHL, setSyncSHL] = useState(true);
  const [standardizeSpecial, setStandardizeSpecial] = useState(true);
  const [removeInvalidSlots, setRemoveInvalidSlots] = useState(true);
  const [resolveConflicts, setResolveConflicts] = useState<'unassign' | 'delete' | 'none'>('unassign');
  const [resolveHomeroomConflicts, setResolveHomeroomConflicts] = useState(true);
  const [clearAllTimetables, setClearAllTimetables] = useState(false);
  const [resetHomeroomAssignments, setResetHomeroomAssignments] = useState(false);

  // Scan whenever opened or data changes
  const runScan = () => {
    const res = scanDataHealth(classes, teachers, subjectsConfig, allTimetables);
    setReport(res);
  };

  useEffect(() => {
    if (isOpen) {
      runScan();
      setLastSummary(null);
    }
  }, [isOpen, classes, teachers, subjectsConfig, allTimetables]);

  if (!isOpen) return null;

  const handleClean = () => {
    const options: CleaningOptions = {
      trimWhitespace,
      syncSHL,
      standardizeSpecialSlots: standardizeSpecial,
      removeInvalidSlots,
      resolveTeacherConflicts: resolveConflicts,
      resolveHomeroomConflicts,
      clearAllTimetables,
      resetHomeroomAssignments,
    };

    const result = executeDataCleaning(options, {
      classes,
      teachers,
      subjectsConfig,
      allTimetables,
    });

    setLastSummary(result.summary);
    onApplyCleaning(
      {
        classes: result.classes,
        teachers: result.teachers,
        subjectsConfig: result.subjectsConfig,
        allTimetables: result.allTimetables,
      },
      result.summary
    );

    // Re-run scan with updated data
    setTimeout(() => {
      const newReport = scanDataHealth(
        result.classes,
        result.teachers,
        result.subjectsConfig,
        result.allTimetables
      );
      setReport(newReport);
    }, 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex justify-between items-center shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-white shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                Trung Tâm Làm Sạch & Chuẩn Hóa Dữ Liệu
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Quét chẩn đoán, chuẩn hóa văn bản, giải quyết trùng lịch và tối ưu hóa thời khóa biểu.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostic Banner */}
        {report && (
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`px-3 py-2 rounded-xl border text-center font-black ${getScoreColor(report.score)}`}>
                <div className="text-2xl leading-none">{report.score}%</div>
                <div className="text-[9px] uppercase tracking-wider font-bold mt-1">Sức khỏe TKB</div>
              </div>

              <div>
                <div className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                  {report.score >= 95 ? (
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Dữ liệu đạt chuẩn chất lượng cao!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-amber-700">
                      <AlertTriangle className="w-4 h-4 text-amber-600" /> Phát hiện {report.totalIssuesCount} vấn đề cần làm sạch
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 mt-1">
                  <span>Trùng lịch: <strong className={report.conflicts.length > 0 ? 'text-red-600' : 'text-slate-700'}>{report.conflicts.length}</strong></span>
                  <span>•</span>
                  <span>Lệch SHL: <strong className={report.shlMismatches.length > 0 ? 'text-amber-600' : 'text-slate-700'}>{report.shlMismatches.length}</strong></span>
                  <span>•</span>
                  <span>Trùng GVCN: <strong className={report.homeroomConflicts.length > 0 ? 'text-red-600' : 'text-slate-700'}>{report.homeroomConflicts.length}</strong></span>
                  <span>•</span>
                  <span>Tiết trống/rác: <strong className={report.emptyOrInvalidSlots.length > 0 ? 'text-amber-600' : 'text-slate-700'}>{report.emptyOrInvalidSlots.length}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={runScan}
                className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                title="Quét lại toàn bộ dữ liệu"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Quét lại</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="px-2.5 py-1.5 text-blue-600 hover:text-blue-800 text-xs font-semibold flex items-center gap-1"
              >
                <span>{showDetails ? 'Thu gọn' : 'Xem chi tiết'}</span>
                {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Detailed Issues List Accordion */}
        {showDetails && report && report.totalIssuesCount > 0 && (
          <div className="p-4 bg-amber-50/50 border-b border-amber-200 max-h-48 overflow-y-auto text-xs space-y-2">
            <div className="font-bold text-slate-800 text-xs mb-1">Chi tiết các lỗi được phát hiện:</div>
            
            {report.conflicts.map((c, i) => (
              <div key={i} className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Trùng lịch:</strong> Giáo viên <span className="font-bold underline">{c.teacher}</span> bị trùng ca tại lớp <strong>{c.classId}</strong> và <strong>{c.conflictingClass}</strong> vào Thứ {c.day} - {c.session === 1 ? 'Sáng' : 'Chiều'} (Tiết {c.period}).
                </div>
              </div>
            ))}

            {report.shlMismatches.map((m, i) => (
              <div key={i} className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Lệch tiết SHL:</strong> Lớp <strong>{m.className}</strong> có GVCN là <strong>{m.expectedTeacher}</strong>, nhưng tiết SHL đang do <strong>{m.currentTeacher}</strong> đứng lớp.
                </div>
              </div>
            ))}

            {report.homeroomConflicts.map((h, i) => (
              <div key={i} className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Trùng GVCN:</strong> Giáo viên <span className="font-bold">{h.teacherName}</span> đang chủ nhiệm {h.assignedClasses.length} lớp: {h.assignedClasses.join(', ')}.
                </div>
              </div>
            ))}

            {report.emptyOrInvalidSlots.map((s, i) => (
              <div key={i} className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <strong>Tiết trống/không hợp lệ:</strong> Lớp <strong>{s.classId}</strong> có ô Thứ {s.day} (Tiết {s.period}) thiếu tên môn học.
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cleaning Success Summary Message */}
        {lastSummary && (
          <div className="p-3.5 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong className="block font-bold">Làm sạch dữ liệu thành công!</strong>
                <span className="text-[11px] text-emerald-800">
                  {lastSummary.trimmedCount > 0 && `Đã chuẩn hóa ${lastSummary.trimmedCount} mục văn bản. `}
                  {lastSummary.syncedSHLCount > 0 && `Đã đồng bộ ${lastSummary.syncedSHLCount} tiết SHL. `}
                  {lastSummary.resolvedConflictsCount > 0 && `Đã xử lý ${lastSummary.resolvedConflictsCount} tiết trùng lịch. `}
                  {lastSummary.resolvedHomeroomConflictsCount > 0 && `Đã khắc phục ${lastSummary.resolvedHomeroomConflictsCount} trùng lặp GVCN. `}
                  {lastSummary.removedInvalidSlotsCount > 0 && `Đã xóa ${lastSummary.removedInvalidSlotsCount} tiết không hợp lệ. `}
                  {lastSummary.clearedTimetablesCount > 0 && `Đã xóa trắng ${lastSummary.clearedTimetablesCount} tiết TKB. `}
                </span>
              </div>
            </div>
            {hasUndoSnapshot && (
              <button
                type="button"
                onClick={onUndoCleaning}
                className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Hoàn tác</span>
              </button>
            )}
          </div>
        )}

        {/* Scrollable Configuration Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Group 1: Safe Auto-cleaning */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                1
              </span>
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                Chuẩn Hóa & Làm Sạch An Toàn (Khuyên dùng - Không mất lịch)
              </h4>
            </div>

            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={trimWhitespace}
                  onChange={(e) => setTrimWhitespace(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Chuẩn hóa văn bản & Xóa khoảng trắng thừa</span>
                  <span className="text-[11px] text-slate-500">
                    Tự động loại bỏ dấu cách thừa đầu/cuối của tên môn học, tên giáo viên, số phòng và tên lớp.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-slate-200/60">
                <input
                  type="checkbox"
                  checked={syncSHL}
                  onChange={(e) => setSyncSHL(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Đồng bộ tiết Sinh hoạt lớp (SHL) theo đúng GVCN</span>
                  <span className="text-[11px] text-slate-500">
                    Cập nhật giáo viên trong các tiết SHL của từng lớp khớp chính xác với Giáo viên Chủ nhiệm được phân công.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-slate-200/60">
                <input
                  type="checkbox"
                  checked={standardizeSpecial}
                  onChange={(e) => setStandardizeSpecial(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Chuẩn hóa tiết Chào cờ (Sáng Thứ 2 - Tiết 1) & SHL (Sáng Thứ 6 - Tiết 4)</span>
                  <span className="text-[11px] text-slate-500">
                    Đảm bảo tất cả các lớp được cố định tiết Chào cờ vào Sáng Thứ 2 Tiết 1 (BGH & Đoàn trường) và tiết Sinh hoạt lớp (SHL) vào Sáng Thứ 6 Tiết 4 (theo đúng GVCN).
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-slate-200/60">
                <input
                  type="checkbox"
                  checked={removeInvalidSlots}
                  onChange={(e) => setRemoveInvalidSlots(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Dọn dẹp các ô TKB rỗng / không hợp lệ</span>
                  <span className="text-[11px] text-slate-500">
                    Xóa bỏ các tiết học bị lỗi thiếu tên môn học hoặc không xác định.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Group 2: Conflict Resolutions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                2
              </span>
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                Xử Lý Xung Đột & Trùng Lịch
              </h4>
            </div>

            <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-800 block mb-1.5">
                  Xử lý trùng lịch giáo viên dạy 2 lớp cùng giờ:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start gap-2 ${
                    resolveConflicts === 'unassign' ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="resolveConflictOption"
                      checked={resolveConflicts === 'unassign'}
                      onChange={() => setResolveConflicts('unassign')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="block text-[11px]">Gỡ GV ở lớp trùng</span>
                      <span className="text-[10px] text-slate-500 font-normal">Chuyển thành &quot;Chưa phân công&quot;, giữ nguyên môn</span>
                    </div>
                  </label>

                  <label className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start gap-2 ${
                    resolveConflicts === 'delete' ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="resolveConflictOption"
                      checked={resolveConflicts === 'delete'}
                      onChange={() => setResolveConflicts('delete')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="block text-[11px]">Xóa hẳn tiết trùng</span>
                      <span className="text-[10px] text-slate-500 font-normal">Xóa tiết trùng ở lớp thứ hai để ô trống</span>
                    </div>
                  </label>

                  <label className={`p-2.5 rounded-xl border cursor-pointer transition flex items-start gap-2 ${
                    resolveConflicts === 'none' ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="resolveConflictOption"
                      checked={resolveConflicts === 'none'}
                      onChange={() => setResolveConflicts('none')}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="block text-[11px]">Giữ nguyên trùng lịch</span>
                      <span className="text-[10px] text-slate-500 font-normal">Không can thiệp các tiết trùng</span>
                    </div>
                  </label>
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-slate-200/60">
                <input
                  type="checkbox"
                  checked={resolveHomeroomConflicts}
                  onChange={(e) => setResolveHomeroomConflicts(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Khắc phục trùng lặp Giáo viên Chủ nhiệm</span>
                  <span className="text-[11px] text-slate-500">
                    Nếu 1 giáo viên được gán chủ nhiệm cho nhiều hơn 1 lớp, giữ lại lớp đầu tiên và đặt các lớp còn lại về &quot;Chưa phân công&quot;.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Group 3: Advanced Cleansing (Dangerous actions) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                3
              </span>
              <h4 className="font-extrabold text-red-800 text-xs uppercase tracking-wider">
                Tác Vụ Tẩy Trắng & Xếp Lại TKB (Cẩn thận khi chọn)
              </h4>
            </div>

            <div className="space-y-2 bg-red-50/50 p-3.5 rounded-xl border border-red-200 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearAllTimetables}
                  onChange={(e) => setClearAllTimetables(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-red-900 block">
                    Xóa trắng Thời khóa biểu toàn trường (Để xếp lại từ đầu)
                  </span>
                  <span className="text-[11px] text-red-700">
                    Xóa toàn bộ các tiết học đã xếp của tất cả {classes.length} lớp học. <strong>Vẫn giữ nguyên</strong> danh sách Giáo viên và Lớp học.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-red-200">
                <input
                  type="checkbox"
                  checked={resetHomeroomAssignments}
                  onChange={(e) => setResetHomeroomAssignments(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-red-900 block">
                    Xóa toàn bộ phân công Giáo viên Chủ nhiệm
                  </span>
                  <span className="text-[11px] text-red-700">
                    Đặt lại tất cả các lớp về trạng thái &quot;Chưa phân công&quot; GVCN để tiến hành xếp lại.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Safety Backup Note */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Bảo vệ an toàn dữ liệu:</strong> Trước khi thực hiện làm sạch, hệ thống tự động lưu bản chụp Snapshot. Bạn có thể nhấp <strong>Hoàn tác</strong> để quay lại nguyên trạng bất cứ lúc nào.
              </div>
            </div>
            <button
              type="button"
              onClick={onExportBackupJSON}
              className="px-2.5 py-1 bg-white border border-blue-300 hover:bg-blue-100 text-blue-800 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-2xs shrink-0"
              title="Tải tệp JSON lưu trữ trước khi làm sạch"
            >
              <Download className="w-3 h-3" />
              <span>Tải file dự phòng</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div>
            {hasUndoSnapshot && (
              <button
                type="button"
                onClick={onUndoCleaning}
                className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                <span>Hoàn tác lần làm sạch trước</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={handleClean}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-sm cursor-pointer ${
                clearAllTimetables
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/25'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25'
              }`}
            >
              {clearAllTimetables ? (
                <>
                  <Trash2 className="w-4 h-4 text-white" />
                  <span>Xác nhận xóa trắng TKB & Làm sạch</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Bắt đầu làm sạch dữ liệu</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
