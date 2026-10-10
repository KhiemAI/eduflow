import React, { useState } from 'react';
import { 
  Printer, 
  X, 
  Layers, 
  FileText, 
  Grid, 
  Check, 
  HelpCircle, 
  Download,
  Filter,
  GraduationCap
} from 'lucide-react';
import { TimetableEntry, SchoolClass } from '../types/index.ts';
import { getPeriodTimeString } from '../data/periodSchedule.ts';

export type PrintMode = 'all_classes' | 'single' | 'master_grid';

interface PrintTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClass: SchoolClass | undefined;
  classes: SchoolClass[];
  allTimetables: Record<string, TimetableEntry[]>;
  timetable: TimetableEntry[];
  schoolName: string;
  departmentName?: string;
  academicYear: string;
  periodsPerSession: number;
  initialMode?: PrintMode;
}

export const PrintTimetableModal: React.FC<PrintTimetableModalProps> = ({
  isOpen,
  onClose,
  currentClass,
  classes,
  allTimetables,
  timetable,
  schoolName,
  departmentName = 'SỞ GIÁO DỤC VÀ ĐÀO TẠO TP.HCM',
  academicYear,
  periodsPerSession = 4,
  initialMode = 'all_classes',
}) => {
  const [printMode, setPrintMode] = useState<PrintMode>(initialMode);
  const [selectedGrade, setSelectedGrade] = useState<number | 'ALL'>('ALL');
  const [showSignatures, setShowSignatures] = useState<boolean>(true);
  const [showPeriodTimes, setShowPeriodTimes] = useState<boolean>(true);
  const [paperOrientation, setPaperOrientation] = useState<'portrait' | 'landscape'>('portrait');

  if (!isOpen) return null;

  const days = [2, 3, 4, 5, 6, 7];
  const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const sessions = [
    { id: 1 as const, name: 'Sáng' },
    { id: 2 as const, name: 'Chiều' },
  ];
  const periods = Array.from({ length: periodsPerSession }, (_, i) => i + 1);

  // Filter classes according to grade filter
  const targetClasses = classes.filter(c => {
    if (selectedGrade === 'ALL') return true;
    return c.grade === selectedGrade;
  });

  const handlePrintTrigger = () => {
    window.print();
  };

  const getSlotForClass = (classId: string, day: number, session: 1 | 2, period: number) => {
    const classTkb = allTimetables[classId] || [];
    return classTkb.find(i => i.day === day && i.session === session && i.period === period);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-xs overflow-y-auto print-modal-overlay">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl mx-auto my-0 sm:my-4 border border-slate-300 flex flex-col print-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Action Toolbar (Hidden in Print) */}
        <div className="sticky top-0 z-30 p-4 bg-slate-900 text-white border-b border-slate-800 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-3 no-print">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2">
                  Xuất PDF / In Thời Khóa Biểu Toàn Trường
                  <span className="text-[10px] bg-blue-500/30 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full font-bold">
                    Chuẩn A4
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Trực tiếp in ra máy in hoặc chọn &quot;Lưu dưới dạng PDF&quot; (Save as PDF) từ trình duyệt.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={handlePrintTrigger}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm shadow-blue-500/30 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In ấn / Xuất file PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Options & Configuration Bar (Hidden in Print) */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 no-print flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between text-xs">
          {/* Mode Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-300 shadow-2xs">
            <button
              type="button"
              onClick={() => setPrintMode('all_classes')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                printMode === 'all_classes'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Toàn trường (Mỗi lớp 1 trang A4)</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintMode('single')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                printMode === 'single'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Chỉ lớp hiện tại ({currentClass?.name || '10A1'})</span>
            </button>

            <button
              type="button"
              onClick={() => setPrintMode('master_grid')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                printMode === 'master_grid'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Bảng Tổng hợp toàn trường</span>
            </button>
          </div>

          {/* Grade filter & options */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {printMode !== 'single' && (
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300">
                <span className="text-[10px] text-slate-400 font-semibold px-2">Khối:</span>
                <button
                  type="button"
                  onClick={() => setSelectedGrade('ALL')}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                    selectedGrade === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Tất cả ({classes.length})
                </button>
                {[10, 11, 12].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGrade(g)}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                      selectedGrade === g ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Khối {g}
                  </button>
                ))}
              </div>
            )}

            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={showSignatures}
                onChange={(e) => setShowSignatures(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>Khung chữ ký</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={showPeriodTimes}
                onChange={(e) => setShowPeriodTimes(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>Giờ tiết học</span>
            </label>
          </div>
        </div>

        {/* Browser Print Hint (Hidden in Print) */}
        <div className="p-3 bg-blue-50 border-b border-blue-200 text-xs text-blue-900 flex items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Mẹo lưu file PDF:</strong> Sau khi nhấp <strong>&quot;In ấn / Xuất file PDF&quot;</strong>, tại mục <em>Máy in đích (Destination)</em> trong hộp thoại trình duyệt, chọn <strong>&quot;Lưu dưới dạng PDF&quot; (Save as PDF)</strong>, chọn Bố cục dọc và nhấn Lưu.
            </span>
          </div>
          <span className="text-[11px] font-bold text-blue-700 shrink-0">
            Tổng cộng: {printMode === 'single' ? '1 trang' : printMode === 'all_classes' ? `${targetClasses.length} trang A4` : '1 bảng tổng hợp'}
          </span>
        </div>

        {/* Printable Paper Document Container */}
        <div className="p-4 sm:p-8 bg-slate-200 overflow-y-auto space-y-6 print:p-0 print:m-0 print:space-y-0 print:bg-white">
          {/* MODE 1: ALL CLASSES (EACH CLASS 1 SEPARATE A4 PAGE) */}
          {printMode === 'all_classes' && (
            targetClasses.map((item, index) => {
              const classTimetable = allTimetables[item.id] || [];

              return (
                <div 
                  key={item.id}
                  className="print-page bg-white p-8 sm:p-12 shadow-sm mx-auto max-w-4xl text-slate-900 font-sans border border-slate-300 print:border-none print:shadow-none print:max-w-none"
                >
                  {/* Page index watermark on screen preview */}
                  <div className="text-right text-[10px] text-slate-400 no-print mb-2">
                    Trang {index + 1} / {targetClasses.length} • Lớp {item.name}
                  </div>

                  {/* Official Header */}
                  <div className="flex justify-between items-start text-xs border-b border-slate-800 pb-3 mb-5">
                    <div className="text-center font-semibold">
                      <p className="uppercase text-[11px] text-slate-600 font-bold tracking-tight">{departmentName}</p>
                      <p className="uppercase font-black text-slate-900 text-sm tracking-tight">{schoolName}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Phòng Giáo vụ</p>
                    </div>
                    <div className="text-center font-semibold">
                      <p className="uppercase font-bold text-slate-900 tracking-tight">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                      <p className="text-[11px] italic font-medium">Độc lập - Tự do - Hạnh phúc</p>
                      <div className="w-24 h-0.5 bg-slate-800 mx-auto mt-1"></div>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="text-center mb-5">
                    <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                      THỜI KHÓA BIỂU {item.name}
                    </h1>
                    <p className="text-xs text-slate-700 mt-1 font-medium">
                      {academicYear} • GVCN: <strong className="text-slate-900 font-black">{item.homeroomTeacher || 'Chưa phân công'}</strong> • Phòng học: <strong>{item.room}</strong> • Buổi học: <strong>{item.session === 'full_day' ? 'Học cả ngày' : item.session === 1 ? 'Ca Sáng' : 'Ca Chiều'}</strong>
                    </p>
                  </div>

                  {/* Class Timetable Grid */}
                  <table className="w-full text-xs border-collapse border-2 border-slate-800">
                    <thead>
                      <tr className="bg-slate-100 border-b-2 border-slate-800 text-center font-bold">
                        <th className="border border-slate-800 p-2 w-14">Buổi</th>
                        <th className="border border-slate-800 p-2 w-16">Tiết</th>
                        {dayLabels.map(day => (
                          <th key={day} className="border border-slate-800 p-2 font-bold">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map(session => (
                        periods.map((period, pIndex) => (
                          <tr key={`${session.id}-${period}`} className="text-center">
                            {pIndex === 0 && (
                              <td rowSpan={periods.length} className="border border-slate-800 font-bold bg-slate-50 p-2 align-middle text-xs">
                                {session.name}
                              </td>
                            )}
                            <td className="border border-slate-800 font-bold p-1 bg-slate-50 text-center">
                              <div>Tiết {period}</div>
                              {showPeriodTimes && (
                                <div className="text-[8px] text-slate-500 font-normal whitespace-nowrap">
                                  {getPeriodTimeString(session.id, period)}
                                </div>
                              )}
                            </td>
                            {days.map(day => {
                              const slot = classTimetable.find(i => i.day === day && i.session === session.id && i.period === period);
                              return (
                                <td key={day} className="border border-slate-800 p-1.5 align-middle h-13">
                                  {slot ? (
                                    <div>
                                      <div className="font-bold text-slate-900 leading-tight">{slot.sub}</div>
                                      <div className="text-[10px] text-slate-600 font-normal mt-0.5">({slot.teacher})</div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 text-[10px]">—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      ))}
                    </tbody>
                  </table>

                  {/* Footer Signature Box */}
                  {showSignatures && (
                    <div className="mt-8 grid grid-cols-2 text-center text-xs pt-3 print-avoid-break">
                      <div>
                        <p className="font-bold uppercase text-slate-800">GIÁO VIÊN CHỦ NHIỆM</p>
                        <p className="text-[10px] text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
                        <div className="h-16"></div>
                        <p className="font-bold text-slate-900">{item.homeroomTeacher || 'Chưa phân công'}</p>
                      </div>
                      <div>
                        <p className="italic text-slate-500 mb-0.5">TP. Hồ Chí Minh, ngày ..... tháng ..... năm 202...</p>
                        <p className="font-bold uppercase text-slate-800">HIỆU TRƯỞNG DUYỆT</p>
                        <p className="text-[10px] text-slate-400 italic">(Ký tên và đóng dấu)</p>
                        <div className="h-16"></div>
                        <p className="font-bold text-slate-900">Ban Giám Hiệu</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* MODE 2: SINGLE CLASS */}
          {printMode === 'single' && currentClass && (
            <div className="print-page bg-white p-8 sm:p-12 shadow-sm mx-auto max-w-4xl text-slate-900 font-sans border border-slate-300 print:border-none print:shadow-none print:max-w-none">
              {/* Official Header */}
              <div className="flex justify-between items-start text-xs border-b border-slate-800 pb-3 mb-5">
                <div className="text-center font-semibold">
                  <p className="uppercase text-[11px] text-slate-600 font-bold tracking-tight">{departmentName}</p>
                  <p className="uppercase font-black text-slate-900 text-sm tracking-tight">{schoolName}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Phòng Giáo vụ</p>
                </div>
                <div className="text-center font-semibold">
                  <p className="uppercase font-bold text-slate-900 tracking-tight">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                  <p className="text-[11px] italic font-medium">Độc lập - Tự do - Hạnh phúc</p>
                  <div className="w-24 h-0.5 bg-slate-800 mx-auto mt-1"></div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center mb-5">
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                  THỜI KHÓA BIỂU {currentClass.name}
                </h1>
                <p className="text-xs text-slate-700 mt-1 font-medium">
                  {academicYear} • GVCN: <strong className="text-slate-900 font-black">{currentClass.homeroomTeacher || 'Chưa phân công'}</strong> • Phòng học: <strong>{currentClass.room}</strong> • Buổi học: <strong>{currentClass.session === 'full_day' ? 'Học cả ngày' : currentClass.session === 1 ? 'Ca Sáng' : 'Ca Chiều'}</strong>
                </p>
              </div>

              {/* Grid */}
              <table className="w-full text-xs border-collapse border-2 border-slate-800">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-800 text-center font-bold">
                    <th className="border border-slate-800 p-2 w-14">Buổi</th>
                    <th className="border border-slate-800 p-2 w-16">Tiết</th>
                    {dayLabels.map(day => (
                      <th key={day} className="border border-slate-800 p-2 font-bold">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(session => (
                    periods.map((period, pIndex) => (
                      <tr key={`${session.id}-${period}`} className="text-center">
                        {pIndex === 0 && (
                          <td rowSpan={periods.length} className="border border-slate-800 font-bold bg-slate-50 p-2 align-middle text-xs">
                            {session.name}
                          </td>
                        )}
                        <td className="border border-slate-800 font-bold p-1 bg-slate-50 text-center">
                          <div>Tiết {period}</div>
                          {showPeriodTimes && (
                            <div className="text-[8px] text-slate-500 font-normal whitespace-nowrap">
                              {getPeriodTimeString(session.id, period)}
                            </div>
                          )}
                        </td>
                        {days.map(day => {
                          const slot = timetable.find(i => i.day === day && i.session === session.id && i.period === period);
                          return (
                            <td key={day} className="border border-slate-800 p-1.5 align-middle h-13">
                              {slot ? (
                                <div>
                                  <div className="font-bold text-slate-900 leading-tight">{slot.sub}</div>
                                  <div className="text-[10px] text-slate-600 font-normal mt-0.5">({slot.teacher})</div>
                                </div>
                              ) : (
                                <span className="text-slate-300 text-[10px]">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>

              {/* Footer Signature Box */}
              {showSignatures && (
                <div className="mt-8 grid grid-cols-2 text-center text-xs pt-3 print-avoid-break">
                  <div>
                    <p className="font-bold uppercase text-slate-800">GIÁO VIÊN CHỦ NHIỆM</p>
                    <p className="text-[10px] text-slate-400 italic">(Ký và ghi rõ họ tên)</p>
                    <div className="h-16"></div>
                    <p className="font-bold text-slate-900">{currentClass.homeroomTeacher || 'Chưa phân công'}</p>
                  </div>
                  <div>
                    <p className="italic text-slate-500 mb-0.5">TP. Hồ Chí Minh, ngày ..... tháng ..... năm 202...</p>
                    <p className="font-bold uppercase text-slate-800">HIỆU TRƯỞNG DUYỆT</p>
                    <p className="text-[10px] text-slate-400 italic">(Ký tên và đóng dấu)</p>
                    <div className="h-16"></div>
                    <p className="font-bold text-slate-900">Ban Giám Hiệu</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 3: MASTER GRID (TOÀN TRƯỜNG DẠNG MA TRẬN TỔNG HỢP) */}
          {printMode === 'master_grid' && (
            <div className="print-page bg-white p-6 sm:p-8 shadow-sm mx-auto text-slate-900 font-sans border border-slate-300 print:border-none print:shadow-none">
              {/* Master Header */}
              <div className="flex justify-between items-start text-xs border-b border-slate-800 pb-3 mb-4">
                <div className="font-semibold">
                  <p className="uppercase text-[10px] text-slate-600 font-bold">{departmentName}</p>
                  <p className="uppercase font-black text-slate-900 text-xs">{schoolName}</p>
                </div>
                <div className="text-center font-bold text-sm uppercase text-slate-900">
                  BẢNG TỔNG HỢP THỜI KHÓA BIỂU TOÀN TRƯỜNG
                  <p className="text-[10px] font-normal normal-case text-slate-600 mt-0.5">{academicYear}</p>
                </div>
                <div className="text-right text-[10px] text-slate-500">
                  {targetClasses.length} lớp • {periodsPerSession * 2} tiết/ngày
                </div>
              </div>

              {/* Master Matrix Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] border-collapse border-2 border-slate-800">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-800 text-center font-bold">
                      <th className="border border-slate-800 p-1 w-12 sticky left-0 bg-slate-100">Lớp</th>
                      <th className="border border-slate-800 p-1 w-20">GVCN</th>
                      {days.map(d => (
                        <th key={d} colSpan={periodsPerSession * 2} className="border border-slate-800 p-1 font-bold">
                          Thứ {d}
                        </th>
                      ))}
                    </tr>
                    <tr className="bg-slate-50 border-b border-slate-800 text-[9px] text-center font-semibold text-slate-600">
                      <th className="border border-slate-800 p-0.5 sticky left-0 bg-slate-50"></th>
                      <th className="border border-slate-800 p-0.5"></th>
                      {days.map(d => (
                        <React.Fragment key={d}>
                          {sessions.map(s => (
                            periods.map(p => (
                              <th key={`${d}-${s.id}-${p}`} className="border border-slate-800 p-0.5 w-7">
                                {s.id === 1 ? `S${p}` : `C${p}`}
                              </th>
                            ))
                          ))}
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {targetClasses.map(c => {
                      const cTkb = allTimetables[c.id] || [];

                      return (
                        <tr key={c.id} className="hover:bg-slate-50 text-center">
                          <td className="border border-slate-800 font-bold p-1 bg-slate-50 sticky left-0 text-slate-900">
                            {c.id}
                          </td>
                          <td className="border border-slate-800 p-1 text-slate-700 truncate max-w-[80px] text-[9px]">
                            {c.homeroomTeacher || '—'}
                          </td>
                          {days.map(d => (
                            <React.Fragment key={d}>
                              {sessions.map(s => (
                                periods.map(p => {
                                  const slot = cTkb.find(i => i.day === d && i.session === s.id && i.period === p);
                                  return (
                                    <td 
                                      key={`${d}-${s.id}-${p}`}
                                      className="border border-slate-800 p-0.5 text-[8px] leading-tight"
                                      title={slot ? `${slot.sub} (${slot.teacher})` : 'Trống'}
                                    >
                                      {slot ? (
                                        <div>
                                          <span className="font-bold block truncate">{slot.sub}</span>
                                          <span className="text-[7px] text-slate-500 block truncate">{slot.teacher}</span>
                                        </div>
                                      ) : (
                                        <span className="text-slate-200">·</span>
                                      )}
                                    </td>
                                  );
                                })
                              ))}
                            </React.Fragment>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
