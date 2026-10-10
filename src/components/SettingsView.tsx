import React from 'react';
import { Settings, Clock, School, ShieldCheck, Check } from 'lucide-react';

interface SettingsViewProps {
  schoolName: string;
  setSchoolName: (name: string) => void;
  departmentName: string;
  setDepartmentName: (name: string) => void;
  academicYear: string;
  setAcademicYear: (year: string) => void;
  periodsPerSession: number;
  setPeriodsPerSession: (val: number) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  schoolName,
  setSchoolName,
  departmentName,
  setDepartmentName,
  academicYear,
  setAcademicYear,
  periodsPerSession,
  setPeriodsPerSession,
}) => {
  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-50">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" /> Cài đặt Hệ thống & Tiết học
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập thông tin nhà trường, niên khóa và khung thời gian các tiết học phục vụ công tác xếp thời khóa biểu.
          </p>
        </div>

        {/* School Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <School className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">Thông tin Đơn vị Nhà trường</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Cơ quan quản lý (Sở GD&ĐT):</label>
              <input
                type="text"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                placeholder="Ví dụ: SỞ GIÁO DỤC VÀ ĐÀO TẠO TP.HCM"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-xs font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Tên trường THPT / THCS:</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-xs font-semibold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Niên khóa & Học kỳ:</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-xs font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Periods Config */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">Cấu hình Số Tiết Trong Mỗi Buổi</h3>
          </div>

          <div className="space-y-3 text-xs">
            {/* Chế độ học cả ngày */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Hình thức học tập chính: Học cả ngày • Định mức 40 tiết / tuần
                </div>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Quy chuẩn học tập: <strong>40 tiết / tuần</strong> (Học cả Sáng và Chiều từ Thứ 2 đến Thứ 6 hoặc Thứ 7; mỗi buổi 4 tiết chuẩn x 2 buổi/ngày = 8 tiết/ngày hoặc phân bổ 40 tiết/tuần theo phân phối chương trình Sở GD&ĐT TP.HCM).
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 bg-emerald-200 text-emerald-800 rounded-full">
                40 tiết / tuần
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5">Số tiết tiêu chuẩn mỗi buổi:</label>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => setPeriodsPerSession(4)}
                  className={`p-3 rounded-xl border font-bold text-center transition ${
                    periodsPerSession === 4
                      ? 'bg-blue-50 border-blue-600 text-blue-800 ring-1 ring-blue-500'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  4 Tiết / Buổi
                  <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Tiết 1 đến Tiết 4</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodsPerSession(5)}
                  className={`p-3 rounded-xl border font-bold text-center transition ${
                    periodsPerSession === 5
                      ? 'bg-blue-50 border-blue-600 text-blue-800 ring-1 ring-blue-500'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  5 Tiết / Buổi
                  <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Tiết 1 đến Tiết 5</span>
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <h4 className="font-bold text-slate-700 mb-2">Khung giờ quy chuẩn đã cài đặt:</h4>
              <div className="grid grid-cols-2 gap-2.5 text-[11px] text-slate-600">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-slate-800 font-extrabold text-xs">Buổi Sáng:</strong>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">7h00 - 10h40</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span>• Tiết 1:</span> <strong className="text-slate-700">07:00 - 07:45</strong></div>
                    <div className="flex justify-between"><span>• Tiết 2:</span> <strong className="text-slate-700">07:50 - 08:35</strong></div>
                    <div className="py-1 px-1.5 my-0.5 rounded bg-amber-100/60 text-amber-900 font-semibold text-[10px] flex justify-between">
                      <span>• Ra chơi (30 phút):</span> <span>08:35 - 09:05</span>
                    </div>
                    <div className="flex justify-between"><span>• Tiết 3:</span> <strong className="text-slate-700">09:05 - 09:50</strong></div>
                    <div className="flex justify-between"><span>• Tiết 4:</span> <strong className="text-slate-700">09:55 - 10:40</strong></div>
                    {periodsPerSession === 5 && (
                      <div className="flex justify-between"><span>• Tiết 5:</span> <strong className="text-slate-700">10:45 - 11:30</strong></div>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <strong className="text-slate-800 font-extrabold text-xs">Buổi Chiều:</strong>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">13h00 - 16h25</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between"><span>• Tiết 1:</span> <strong className="text-slate-700">13:00 - 13:45</strong></div>
                    <div className="flex justify-between"><span>• Tiết 2:</span> <strong className="text-slate-700">13:50 - 14:35</strong></div>
                    <div className="py-1 px-1.5 my-0.5 rounded bg-indigo-100/60 text-indigo-900 font-semibold text-[10px] flex justify-between">
                      <span>• Ra chơi (15 phút):</span> <span>14:35 - 14:50</span>
                    </div>
                    <div className="flex justify-between"><span>• Tiết 3:</span> <strong className="text-slate-700">14:50 - 15:35</strong></div>
                    <div className="flex justify-between"><span>• Tiết 4:</span> <strong className="text-slate-700">15:40 - 16:25</strong></div>
                    {periodsPerSession === 5 && (
                      <div className="flex justify-between"><span>• Tiết 5:</span> <strong className="text-slate-700">16:30 - 17:15</strong></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Rules */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm">Quy tắc Xếp TKB & Chống Trùng Lịch</h3>
          </div>
          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Kiểm tra trùng giáo viên toàn trường:</strong> Tự động cảnh báo ngay khi một giáo viên bị gán trùng ca tại 2 lớp khác nhau trong cùng tiết học.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Gợi ý giáo viên thay thế:</strong> Tìm kiếm tức thời các giáo viên cùng tổ chuyên môn đang rảnh và có tải giảng dạy thấp nhất.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Tiết cố định:</strong> Thứ 2 Tiết 1 (Sáng) mặc định là tiết Chào cờ (BGH & Đoàn trường); Thứ 6 Tiết 4 (Sáng) mặc định là tiết Sinh hoạt lớp (SHL - GVCN).</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
