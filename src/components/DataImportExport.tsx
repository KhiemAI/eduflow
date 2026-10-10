import React, { useRef } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Printer, 
  RotateCcw, 
  FileJson, 
  CheckCircle,
  FileText,
  Sparkles,
  Trash2
} from 'lucide-react';
import { TimetableEntry, SchoolClass, Teacher, SubjectConfig } from '../types/index.ts';

interface DataImportExportProps {
  currentClassId: string;
  classes: SchoolClass[];
  allTimetables: Record<string, TimetableEntry[]>;
  teachers: Teacher[];
  subjectsConfig: Record<string, SubjectConfig>;
  onImportBackup: (data: {
    classes?: SchoolClass[];
    allTimetables?: Record<string, TimetableEntry[]>;
    teachers?: Teacher[];
    subjectsConfig?: Record<string, SubjectConfig>;
  }) => void;
  onResetFactoryDemo: () => void;
  onPrint: () => void;
  onPrintAllPDF?: () => void;
  onOpenDataCleaning?: () => void;
  onOpenClearTimetable?: () => void;
}

export const DataImportExport: React.FC<DataImportExportProps> = ({
  currentClassId,
  classes,
  allTimetables,
  teachers,
  subjectsConfig,
  onImportBackup,
  onResetFactoryDemo,
  onPrint,
  onPrintAllPDF,
  onOpenDataCleaning,
  onOpenClearTimetable,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export current class to CSV
  const handleExportCSV = () => {
    const timetable = allTimetables[currentClassId] || [];
    const days = [2, 3, 4, 5, 6, 7];
    const sessions = [1, 2];
    const periods = [1, 2, 3, 4];

    let csvContent = `THỜI KHÓA BIỂU LỚP ${currentClassId}\n`;
    csvContent += `Buổi,Tiết,Thứ 2,Thứ 3,Thứ 4,Thứ 5,Thứ 6,Thứ 7\n`;

    sessions.forEach(session => {
      periods.forEach(period => {
        const row = [
          session === 1 ? 'Sáng' : 'Chiều',
          `Tiết ${period}`,
        ];

        days.forEach(day => {
          const slot = timetable.find(i => i.day === day && i.session === session && i.period === period);
          if (slot) {
            row.push(`"${slot.sub} (${slot.teacher})"`);
          } else {
            row.push('""');
          }
        });

        csvContent += row.join(',') + '\n';
      });
    });

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TKB_${currentClassId}_EduFlow.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export full JSON backup
  const handleExportJSON = () => {
    const backupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      classes,
      teachers,
      subjectsConfig,
      allTimetables,
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `EduFlow_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import JSON backup
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onImportBackup(parsed);
      } catch (err) {
        // Handle error silently or alert
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-50">
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-blue-600" /> Nhập, Xuất & Lưu trữ Dữ liệu
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Xuất dữ liệu thời khóa biểu ra bảng tính Excel/CSV, in ấn theo biểu mẫu chuẩn giáo dục hoặc sao lưu dữ liệu toàn hệ thống.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 0: Xuất PDF Toàn Trường (MỚI) */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-400/80 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Printer className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white">
                Tất cả {classes.length} Lớp
              </span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm">Xuất PDF Toàn Trường (In ấn)</h3>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Tạo tệp PDF in ấn cho toàn bộ <strong>{classes.length} lớp học</strong> của trường. Mỗi lớp trình bày chuẩn trên 1 trang A4 riêng biệt có chữ ký BGH & GVCN, hoặc in bảng ma trận tổng hợp toàn trường.
            </p>
          </div>
          <button
            onClick={onPrintAllPDF || onPrint}
            className="mt-5 w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm shadow-blue-500/25 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Xuất PDF Toàn Trường ({classes.length} Lớp)
          </button>
        </div>

        {/* Card 1: In TKB Chuẩn Lớp Hiện Tại */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-blue-600 flex items-center justify-center mb-3">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">In TKB Lớp {currentClassId}</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              In thời khóa biểu chi tiết của riêng lớp <strong className="text-slate-700">{currentClassId}</strong> ra máy in hoặc lưu dưới dạng tệp PDF theo mẫu chuẩn của Bộ Giáo dục.
            </p>
          </div>
          <button
            onClick={onPrint}
            className="mt-5 w-full py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-600" /> In Riêng Lớp {currentClassId}
          </button>
        </div>

        {/* Card 2: Xuất CSV / Excel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Xuất TKB Ra Excel / CSV</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Tải tệp bảng tính CSV tương thích 100% với Microsoft Excel, Google Sheets của lớp <strong className="text-slate-700">{currentClassId}</strong>.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="mt-5 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" /> Tải tệp CSV (Excel)
          </button>
        </div>

        {/* Card 3: Sao lưu toàn bộ JSON */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
              <FileJson className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Sao Lưu Đầy Đủ (JSON Backup)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Xuất tệp JSON chứa tất cả {classes.length} lớp học, {teachers.length} giáo viên và toàn bộ thời khóa biểu đã xếp để lưu trữ lâu dài.
            </p>
          </div>
          <button
            onClick={handleExportJSON}
            className="mt-5 w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4" /> Xuất tệp Backup (.json)
          </button>
        </div>

        {/* Card 4: Nhập dữ liệu từ bản sao lưu */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Phục Hồi Từ Tệp Sao Lưu</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Tải lên tệp sao lưu JSON đã lưu trước đó để khôi phục toàn bộ lịch biểu và phân công giáo viên vào hệ thống.
            </p>
          </div>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
            >
              <Upload className="w-4 h-4" /> Chọn tệp JSON khôi phục
            </button>
          </div>
        </div>

        {/* Card: Làm sạch & Chuẩn hóa Dữ liệu */}
        {onOpenDataCleaning && (
          <div className="bg-gradient-to-br from-amber-50/70 via-indigo-50/50 to-blue-50/70 rounded-2xl border-2 border-indigo-300 p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <Sparkles className="w-5 h-5 text-amber-200" />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  Chẩn đoán & Tối ưu
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Làm Sạch & Chuẩn Hóa Dữ Liệu</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Quét chẩn đoán sức khỏe dữ liệu, xóa khoảng trắng thừa, đồng bộ tiết SHL theo đúng GVCN, giải quyết trùng lịch ca dạy, hoặc tẩy trắng TKB khi cần xếp lại từ đầu.
              </p>
            </div>
            <button
              onClick={onOpenDataCleaning}
              className="mt-5 w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" /> Mở Trung Tâm Làm Sạch Dữ Liệu
            </button>
          </div>
        )}

        {/* Card: Xóa Trắng Thời Khóa Biểu (Reset TKB) */}
        {onOpenClearTimetable && (
          <div className="bg-gradient-to-br from-rose-50/80 via-white to-red-50/60 rounded-2xl border-2 border-rose-300 p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  Xóa & Bắt đầu mới
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Xóa Trắng Thời Khóa Biểu</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Tùy chọn xóa sạch toàn bộ thời khóa biểu đã xếp của trường, theo từng khối hoặc của một lớp cụ thể để xếp lại từ đầu. Bảo toàn 100% giáo viên, môn học và lớp.
              </p>
            </div>
            <button
              onClick={onOpenClearTimetable}
              className="mt-5 w-full py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Mở Tùy Chọn Xóa TKB
            </button>
          </div>
        )}

        {/* Card 5: Khôi phục dữ liệu gốc Demo */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-3">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Khôi Phục Dữ Liệu Gốc Demo</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Đặt lại toàn bộ dữ liệu mẫu (môn học, các ca phân công và kịch bản thử nghiệm phát hiện trùng lịch của Thầy Cường).
            </p>
          </div>
          <button
            onClick={onResetFactoryDemo}
            className="mt-5 w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Khôi phục mặc định ban đầu
          </button>
        </div>
      </div>
    </div>
  );
};
