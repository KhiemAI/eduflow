import { SubjectConfig, Teacher, SchoolClass, TimetableEntry } from '../types/index.ts';

export const INITIAL_SUBJECTS: Record<string, SubjectConfig> = {
  'Toán': {
    name: 'Toán',
    dept: 'Toán',
    color: 'bg-blue-50 border-blue-200 text-blue-800 hover:border-blue-400',
    badgeColor: 'bg-blue-100 text-blue-700',
    defaultTeacher: 'Thầy Cường',
  },
  'Ngữ Văn': {
    name: 'Ngữ Văn',
    dept: 'Ngữ Văn',
    color: 'bg-rose-50 border-rose-200 text-rose-800 hover:border-rose-400',
    badgeColor: 'bg-rose-100 text-rose-700',
    defaultTeacher: 'Cô Hương',
  },
  'Tiếng Anh': {
    name: 'Tiếng Anh',
    dept: 'Ngoại ngữ',
    color: 'bg-purple-50 border-purple-200 text-purple-800 hover:border-purple-400',
    badgeColor: 'bg-purple-100 text-purple-700',
    defaultTeacher: 'Cô Lan',
  },
  'Vật lý': {
    name: 'Vật lý',
    dept: 'Khoa học Tự nhiên',
    color: 'bg-cyan-50 border-cyan-200 text-cyan-800 hover:border-cyan-400',
    badgeColor: 'bg-cyan-100 text-cyan-700',
    defaultTeacher: 'Thầy Sơn',
  },
  'Hóa học': {
    name: 'Hóa học',
    dept: 'Khoa học Tự nhiên',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:border-emerald-400',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    defaultTeacher: 'Cô Ngọc',
  },
  'Sinh học': {
    name: 'Sinh học',
    dept: 'Khoa học Tự nhiên',
    color: 'bg-green-50 border-green-200 text-green-800 hover:border-green-400',
    badgeColor: 'bg-green-100 text-green-700',
    defaultTeacher: 'Cô Mai Loan',
  },
  'Lịch sử': {
    name: 'Lịch sử',
    dept: 'Khoa học Xã hội',
    color: 'bg-amber-50 border-amber-200 text-amber-800 hover:border-amber-400',
    badgeColor: 'bg-amber-100 text-amber-700',
    defaultTeacher: 'Thầy Tuấn',
  },
  'Địa lý': {
    name: 'Địa lý',
    dept: 'Khoa học Xã hội',
    color: 'bg-orange-50 border-orange-200 text-orange-800 hover:border-orange-400',
    badgeColor: 'bg-orange-100 text-orange-700',
    defaultTeacher: 'Cô Hà',
  },
  'GDTC': {
    name: 'GDTC',
    dept: 'Thể chất - GDQP',
    color: 'bg-stone-100 border-stone-300 text-stone-800 hover:border-stone-400',
    badgeColor: 'bg-stone-200 text-stone-700',
    defaultTeacher: 'Thầy Bình',
  },
  'Tin học': {
    name: 'Tin học',
    dept: 'Tin học - Công nghệ',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:border-indigo-400',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    defaultTeacher: 'Thầy Dũng',
  },
  'GD Kinh tế & PL': {
    name: 'GD Kinh tế & PL',
    dept: 'Khoa học Xã hội',
    color: 'bg-yellow-50 border-yellow-200 text-yellow-800 hover:border-yellow-400',
    badgeColor: 'bg-yellow-100 text-yellow-700',
    defaultTeacher: 'Cô Yến',
  },
  'Chào cờ': {
    name: 'Chào cờ',
    dept: 'Đoàn Đội',
    color: 'bg-red-50 border-red-200 text-red-800 font-bold hover:border-red-300',
    badgeColor: 'bg-red-100 text-red-700',
    defaultTeacher: 'BGH & Đoàn trường',
    isSpecial: true,
  },
  'SHL': {
    name: 'SHL',
    dept: 'Chủ nhiệm',
    color: 'bg-pink-50 border-pink-200 text-pink-800 font-bold hover:border-pink-300',
    badgeColor: 'bg-pink-100 text-pink-700',
    defaultTeacher: 'GVCN',
    isSpecial: true,
  },
};

// 100 teachers roster for THPT Linh Trung
export const INITIAL_TEACHERS: Teacher[] = [
  // Tổ Toán (16 GV)
  { id: 'T01', name: 'Thầy Cường', dept: 'Toán', email: 'cuong.toan@thptlinhtrung.edu.vn', phone: '0912 345 678', maxLoad: 18 },
  { id: 'T02', name: 'Cô Mai', dept: 'Toán', email: 'mai.toan@thptlinhtrung.edu.vn', phone: '0913 234 567', maxLoad: 18 },
  { id: 'T03', name: 'Thầy Hùng', dept: 'Toán', email: 'hung.toan@thptlinhtrung.edu.vn', phone: '0914 876 543', maxLoad: 19 },
  { id: 'T04', name: 'Thầy Minh', dept: 'Toán', email: 'minh.toan@thptlinhtrung.edu.vn', phone: '0915 678 123', maxLoad: 18 },
  { id: 'T05', name: 'Cô Nga', dept: 'Toán', email: 'nga.toan@thptlinhtrung.edu.vn', phone: '0916 789 234', maxLoad: 18 },
  { id: 'T06', name: 'Thầy Phong', dept: 'Toán', email: 'phong.toan@thptlinhtrung.edu.vn', phone: '0917 890 345', maxLoad: 18 },
  { id: 'T07', name: 'Cô Thảo', dept: 'Toán', email: 'thao.toan@thptlinhtrung.edu.vn', phone: '0918 901 456', maxLoad: 18 },
  { id: 'T08', name: 'Thầy Đạt', dept: 'Toán', email: 'dat.toan@thptlinhtrung.edu.vn', phone: '0919 012 567', maxLoad: 18 },
  { id: 'T09', name: 'Cô Dung', dept: 'Toán', email: 'dung.toan@thptlinhtrung.edu.vn', phone: '0920 123 678', maxLoad: 18 },
  { id: 'T10', name: 'Thầy Trí', dept: 'Toán', email: 'tri.toan@thptlinhtrung.edu.vn', phone: '0921 234 789', maxLoad: 18 },
  { id: 'T11', name: 'Cô Quyên', dept: 'Toán', email: 'quyen.toan@thptlinhtrung.edu.vn', phone: '0922 345 890', maxLoad: 18 },
  { id: 'T12', name: 'Thầy Khánh', dept: 'Toán', email: 'khanh.toan@thptlinhtrung.edu.vn', phone: '0923 456 901', maxLoad: 18 },
  { id: 'T13', name: 'Cô Oanh', dept: 'Toán', email: 'oanh.toan@thptlinhtrung.edu.vn', phone: '0924 567 012', maxLoad: 18 },
  { id: 'T14', name: 'Thầy Tuấn Anh', dept: 'Toán', email: 'tuananh.toan@thptlinhtrung.edu.vn', phone: '0925 678 123', maxLoad: 18 },
  { id: 'T15', name: 'Cô Tuyết', dept: 'Toán', email: 'tuyet.toan@thptlinhtrung.edu.vn', phone: '0926 789 234', maxLoad: 18 },
  { id: 'T16', name: 'Thầy Bảo', dept: 'Toán', email: 'bao.toan@thptlinhtrung.edu.vn', phone: '0927 890 345', maxLoad: 18 },

  // Tổ Ngữ Văn (15 GV)
  { id: 'V01', name: 'Cô Hương', dept: 'Ngữ Văn', email: 'huong.van@thptlinhtrung.edu.vn', phone: '0915 112 233', maxLoad: 17 },
  { id: 'V02', name: 'Thầy Thanh', dept: 'Ngữ Văn', email: 'thanh.van@thptlinhtrung.edu.vn', phone: '0916 445 566', maxLoad: 18 },
  { id: 'V03', name: 'Cô Hồng', dept: 'Ngữ Văn', email: 'hong.van@thptlinhtrung.edu.vn', phone: '0928 111 222', maxLoad: 18 },
  { id: 'V04', name: 'Cô Phương', dept: 'Ngữ Văn', email: 'phuong.van@thptlinhtrung.edu.vn', phone: '0929 222 333', maxLoad: 18 },
  { id: 'V05', name: 'Thầy Vũ', dept: 'Ngữ Văn', email: 'vu.van@thptlinhtrung.edu.vn', phone: '0930 333 444', maxLoad: 18 },
  { id: 'V06', name: 'Cô Diệu', dept: 'Ngữ Văn', email: 'dieu.van@thptlinhtrung.edu.vn', phone: '0931 444 555', maxLoad: 18 },
  { id: 'V07', name: 'Cô Vân', dept: 'Ngữ Văn', email: 'van.van@thptlinhtrung.edu.vn', phone: '0932 555 666', maxLoad: 18 },
  { id: 'V08', name: 'Thầy Khoa', dept: 'Ngữ Văn', email: 'khoa.van@thptlinhtrung.edu.vn', phone: '0933 666 777', maxLoad: 18 },
  { id: 'V09', name: 'Cô Trâm', dept: 'Ngữ Văn', email: 'tram.van@thptlinhtrung.edu.vn', phone: '0934 777 888', maxLoad: 18 },
  { id: 'V10', name: 'Thầy Tân', dept: 'Ngữ Văn', email: 'tan.van@thptlinhtrung.edu.vn', phone: '0935 888 999', maxLoad: 18 },
  { id: 'V11', name: 'Cô Thủy', dept: 'Ngữ Văn', email: 'thuy.van@thptlinhtrung.edu.vn', phone: '0936 999 000', maxLoad: 18 },
  { id: 'V12', name: 'Cô Loan', dept: 'Ngữ Văn', email: 'loan.van@thptlinhtrung.edu.vn', phone: '0937 000 111', maxLoad: 18 },
  { id: 'V13', name: 'Thầy Quang', dept: 'Ngữ Văn', email: 'quang.van@thptlinhtrung.edu.vn', phone: '0938 111 222', maxLoad: 18 },
  { id: 'V14', name: 'Cô Hiền', dept: 'Ngữ Văn', email: 'hien.van@thptlinhtrung.edu.vn', phone: '0939 222 333', maxLoad: 18 },
  { id: 'V15', name: 'Thầy Duy', dept: 'Ngữ Văn', email: 'duy.van@thptlinhtrung.edu.vn', phone: '0940 333 444', maxLoad: 18 },

  // Tổ Ngoại ngữ / Tiếng Anh (14 GV)
  { id: 'E01', name: 'Cô Lan', dept: 'Ngoại ngữ', email: 'lan.anh@thptlinhtrung.edu.vn', phone: '0917 998 877', maxLoad: 18 },
  { id: 'E02', name: 'Thầy John', dept: 'Ngoại ngữ', email: 'john.anh@thptlinhtrung.edu.vn', phone: '0918 333 222', maxLoad: 16 },
  { id: 'E03', name: 'Cô Trang', dept: 'Ngoại ngữ', email: 'trang.anh@thptlinhtrung.edu.vn', phone: '0941 444 555', maxLoad: 18 },
  { id: 'E04', name: 'Thầy Peter', dept: 'Ngoại ngữ', email: 'peter.anh@thptlinhtrung.edu.vn', phone: '0942 555 666', maxLoad: 16 },
  { id: 'E05', name: 'Cô Ánh', dept: 'Ngoại ngữ', email: 'anh.anh@thptlinhtrung.edu.vn', phone: '0943 666 777', maxLoad: 18 },
  { id: 'E06', name: 'Thầy Thomas', dept: 'Ngoại ngữ', email: 'thomas.anh@thptlinhtrung.edu.vn', phone: '0944 777 888', maxLoad: 16 },
  { id: 'E07', name: 'Cô Vy', dept: 'Ngoại ngữ', email: 'vy.anh@thptlinhtrung.edu.vn', phone: '0945 888 999', maxLoad: 18 },
  { id: 'E08', name: 'Thầy Nam', dept: 'Ngoại ngữ', email: 'nam.anh@thptlinhtrung.edu.vn', phone: '0946 999 000', maxLoad: 18 },
  { id: 'E09', name: 'Cô My', dept: 'Ngoại ngữ', email: 'my.anh@thptlinhtrung.edu.vn', phone: '0947 000 111', maxLoad: 18 },
  { id: 'E10', name: 'Cô Châu', dept: 'Ngoại ngữ', email: 'chau.anh@thptlinhtrung.edu.vn', phone: '0948 111 222', maxLoad: 18 },
  { id: 'E11', name: 'Thầy David', dept: 'Ngoại ngữ', email: 'david.anh@thptlinhtrung.edu.vn', phone: '0949 222 333', maxLoad: 16 },
  { id: 'E12', name: 'Cô Uyên', dept: 'Ngoại ngữ', email: 'uyen.anh@thptlinhtrung.edu.vn', phone: '0950 333 444', maxLoad: 18 },
  { id: 'E13', name: 'Thầy Huy', dept: 'Ngoại ngữ', email: 'huy.anh@thptlinhtrung.edu.vn', phone: '0951 444 555', maxLoad: 18 },
  { id: 'E14', name: 'Cô Linh', dept: 'Ngoại ngữ', email: 'linh.anh@thptlinhtrung.edu.vn', phone: '0952 555 666', maxLoad: 18 },

  // Tổ Khoa học Tự nhiên - Vật lý (9 GV)
  { id: 'P01', name: 'Thầy Sơn', dept: 'Khoa học Tự nhiên', email: 'son.ly@thptlinhtrung.edu.vn', phone: '0919 777 888', maxLoad: 18 },
  { id: 'P02', name: 'Thầy Lâm', dept: 'Khoa học Tự nhiên', email: 'lam.ly@thptlinhtrung.edu.vn', phone: '0953 666 777', maxLoad: 18 },
  { id: 'P03', name: 'Cô Giang', dept: 'Khoa học Tự nhiên', email: 'giang.ly@thptlinhtrung.edu.vn', phone: '0954 777 888', maxLoad: 18 },
  { id: 'P04', name: 'Thầy Tài', dept: 'Khoa học Tự nhiên', email: 'tai.ly@thptlinhtrung.edu.vn', phone: '0955 888 999', maxLoad: 18 },
  { id: 'P05', name: 'Cô Ngọc Ánh', dept: 'Khoa học Tự nhiên', email: 'ngocanh.ly@thptlinhtrung.edu.vn', phone: '0956 999 000', maxLoad: 18 },
  { id: 'P06', name: 'Thầy Bình An', dept: 'Khoa học Tự nhiên', email: 'binhan.ly@thptlinhtrung.edu.vn', phone: '0957 000 111', maxLoad: 18 },
  { id: 'P07', name: 'Cô Thư', dept: 'Khoa học Tự nhiên', email: 'thu.ly@thptlinhtrung.edu.vn', phone: '0958 111 222', maxLoad: 18 },
  { id: 'P08', name: 'Thầy Hòa', dept: 'Khoa học Tự nhiên', email: 'hoa.ly@thptlinhtrung.edu.vn', phone: '0959 222 333', maxLoad: 18 },
  { id: 'P09', name: 'Cô Bích', dept: 'Khoa học Tự nhiên', email: 'bich.ly@thptlinhtrung.edu.vn', phone: '0960 333 444', maxLoad: 18 },

  // Tổ Khoa học Tự nhiên - Hóa học (9 GV)
  { id: 'C01', name: 'Cô Ngọc', dept: 'Khoa học Tự nhiên', email: 'ngoc.hoa@thptlinhtrung.edu.vn', phone: '0920 666 555', maxLoad: 18 },
  { id: 'C02', name: 'Thầy Long', dept: 'Khoa học Tự nhiên', email: 'long.hoa@thptlinhtrung.edu.vn', phone: '0961 444 555', maxLoad: 18 },
  { id: 'C03', name: 'Cô Trúc', dept: 'Khoa học Tự nhiên', email: 'truc.hoa@thptlinhtrung.edu.vn', phone: '0962 555 666', maxLoad: 18 },
  { id: 'C04', name: 'Thầy Toàn', dept: 'Khoa học Tự nhiên', email: 'toan.hoa@thptlinhtrung.edu.vn', phone: '0963 666 777', maxLoad: 18 },
  { id: 'C05', name: 'Cô Phượng', dept: 'Khoa học Tự nhiên', email: 'phuong.hoa@thptlinhtrung.edu.vn', phone: '0964 777 888', maxLoad: 18 },
  { id: 'C06', name: 'Thầy Vinh', dept: 'Khoa học Tự nhiên', email: 'vinh.hoa@thptlinhtrung.edu.vn', phone: '0965 888 999', maxLoad: 18 },
  { id: 'C07', name: 'Cô Thanh Mai', dept: 'Khoa học Tự nhiên', email: 'thanhmai.hoa@thptlinhtrung.edu.vn', phone: '0966 999 000', maxLoad: 18 },
  { id: 'C08', name: 'Thầy Đức', dept: 'Khoa học Tự nhiên', email: 'duc.hoa@thptlinhtrung.edu.vn', phone: '0967 000 111', maxLoad: 18 },
  { id: 'C09', name: 'Cô Kim', dept: 'Khoa học Tự nhiên', email: 'kim.hoa@thptlinhtrung.edu.vn', phone: '0968 111 222', maxLoad: 18 },

  // Tổ Khoa học Tự nhiên - Sinh học (7 GV)
  { id: 'B01', name: 'Cô Mai Loan', dept: 'Khoa học Tự nhiên', email: 'loan.sinh@thptlinhtrung.edu.vn', phone: '0921 444 333', maxLoad: 18 },
  { id: 'B02', name: 'Thầy Hậu', dept: 'Khoa học Tự nhiên', email: 'hau.sinh@thptlinhtrung.edu.vn', phone: '0969 222 333', maxLoad: 18 },
  { id: 'B03', name: 'Cô Như', dept: 'Khoa học Tự nhiên', email: 'nhu.sinh@thptlinhtrung.edu.vn', phone: '0970 333 444', maxLoad: 18 },
  { id: 'B04', name: 'Thầy Quân', dept: 'Khoa học Tự nhiên', email: 'quan.sinh@thptlinhtrung.edu.vn', phone: '0971 444 555', maxLoad: 18 },
  { id: 'B05', name: 'Cô Sen', dept: 'Khoa học Tự nhiên', email: 'sen.sinh@thptlinhtrung.edu.vn', phone: '0972 555 666', maxLoad: 18 },
  { id: 'B06', name: 'Thầy Phước', dept: 'Khoa học Tự nhiên', email: 'phuoc.sinh@thptlinhtrung.edu.vn', phone: '0973 666 777', maxLoad: 18 },
  { id: 'B07', name: 'Cô Nhã', dept: 'Khoa học Tự nhiên', email: 'nha.sinh@thptlinhtrung.edu.vn', phone: '0974 777 888', maxLoad: 18 },

  // Tổ Khoa học Xã hội - Lịch sử (6 GV)
  { id: 'H01', name: 'Thầy Tuấn', dept: 'Khoa học Xã hội', email: 'tuan.su@thptlinhtrung.edu.vn', phone: '0922 111 999', maxLoad: 18 },
  { id: 'H02', name: 'Cô Thắm', dept: 'Khoa học Xã hội', email: 'tham.su@thptlinhtrung.edu.vn', phone: '0975 888 999', maxLoad: 18 },
  { id: 'H03', name: 'Thầy Luân', dept: 'Khoa học Xã hội', email: 'luan.su@thptlinhtrung.edu.vn', phone: '0976 999 000', maxLoad: 18 },
  { id: 'H04', name: 'Cô Chi', dept: 'Khoa học Xã hội', email: 'chi.su@thptlinhtrung.edu.vn', phone: '0977 000 111', maxLoad: 18 },
  { id: 'H05', name: 'Thầy Kiên', dept: 'Khoa học Xã hội', email: 'kien.su@thptlinhtrung.edu.vn', phone: '0978 111 222', maxLoad: 18 },
  { id: 'H06', name: 'Cô Ngân', dept: 'Khoa học Xã hội', email: 'ngan.su@thptlinhtrung.edu.vn', phone: '0979 222 333', maxLoad: 18 },

  // Tổ Khoa học Xã hội - Địa lý (6 GV)
  { id: 'G01', name: 'Cô Hà', dept: 'Khoa học Xã hội', email: 'ha.dia@thptlinhtrung.edu.vn', phone: '0923 222 888', maxLoad: 18 },
  { id: 'G02', name: 'Thầy Bách', dept: 'Khoa học Xã hội', email: 'bach.dia@thptlinhtrung.edu.vn', phone: '0980 333 444', maxLoad: 18 },
  { id: 'G03', name: 'Cô Xuân', dept: 'Khoa học Xã hội', email: 'xuan.dia@thptlinhtrung.edu.vn', phone: '0981 444 555', maxLoad: 18 },
  { id: 'G04', name: 'Thầy Thịnh', dept: 'Khoa học Xã hội', email: 'thinh.dia@thptlinhtrung.edu.vn', phone: '0982 555 666', maxLoad: 18 },
  { id: 'G05', name: 'Cô Quỳnh', dept: 'Khoa học Xã hội', email: 'quynh.dia@thptlinhtrung.edu.vn', phone: '0983 666 777', maxLoad: 18 },
  { id: 'G06', name: 'Thầy Kha', dept: 'Khoa học Xã hội', email: 'kha.dia@thptlinhtrung.edu.vn', phone: '0984 777 888', maxLoad: 18 },

  // Tổ Khoa học Xã hội - GD Kinh tế & PL (5 GV)
  { id: 'L01', name: 'Cô Yến', dept: 'Khoa học Xã hội', email: 'yen.gdcd@thptlinhtrung.edu.vn', phone: '0926 777 111', maxLoad: 18 },
  { id: 'L02', name: 'Thầy Thái', dept: 'Khoa học Xã hội', email: 'thai.gdcd@thptlinhtrung.edu.vn', phone: '0985 888 999', maxLoad: 18 },
  { id: 'L03', name: 'Cô Hòa', dept: 'Khoa học Xã hội', email: 'hoa.gdcd@thptlinhtrung.edu.vn', phone: '0986 999 000', maxLoad: 18 },
  { id: 'L04', name: 'Thầy Lộc', dept: 'Khoa học Xã hội', email: 'loc.gdcd@thptlinhtrung.edu.vn', phone: '0987 000 111', maxLoad: 18 },
  { id: 'L05', name: 'Cô Băng', dept: 'Khoa học Xã hội', email: 'bang.gdcd@thptlinhtrung.edu.vn', phone: '0988 111 222', maxLoad: 18 },

  // Tổ Tin học - Công nghệ (6 GV)
  { id: 'CS01', name: 'Thầy Dũng', dept: 'Tin học - Công nghệ', email: 'dung.it@thptlinhtrung.edu.vn', phone: '0925 555 444', maxLoad: 18 },
  { id: 'CS02', name: 'Cô Tiên', dept: 'Tin học - Công nghệ', email: 'tien.it@thptlinhtrung.edu.vn', phone: '0989 222 333', maxLoad: 18 },
  { id: 'CS03', name: 'Thầy Nguyên', dept: 'Tin học - Công nghệ', email: 'nguyen.it@thptlinhtrung.edu.vn', phone: '0990 333 444', maxLoad: 18 },
  { id: 'CS04', name: 'Cô Lam', dept: 'Tin học - Công nghệ', email: 'lam.it@thptlinhtrung.edu.vn', phone: '0991 444 555', maxLoad: 18 },
  { id: 'CS05', name: 'Thầy Hưng', dept: 'Tin học - Công nghệ', email: 'hung.it@thptlinhtrung.edu.vn', phone: '0992 555 666', maxLoad: 18 },
  { id: 'CS06', name: 'Cô Thơ', dept: 'Tin học - Công nghệ', email: 'tho.it@thptlinhtrung.edu.vn', phone: '0993 666 777', maxLoad: 18 },

  // Tổ Thể chất - GDQP (6 GV)
  { id: 'PE01', name: 'Thầy Bình', dept: 'Thể chất - GDQP', email: 'binh.gdtc@thptlinhtrung.edu.vn', phone: '0924 333 777', maxLoad: 20 },
  { id: 'PE02', name: 'Thầy Cảnh', dept: 'Thể chất - GDQP', email: 'canh.gdtc@thptlinhtrung.edu.vn', phone: '0994 777 888', maxLoad: 20 },
  { id: 'PE03', name: 'Thầy Quốc', dept: 'Thể chất - GDQP', email: 'quoc.gdtc@thptlinhtrung.edu.vn', phone: '0995 888 999', maxLoad: 20 },
  { id: 'PE04', name: 'Thầy Việt', dept: 'Thể chất - GDQP', email: 'viet.gdtc@thptlinhtrung.edu.vn', phone: '0996 999 000', maxLoad: 20 },
  { id: 'PE05', name: 'Thầy Hổ', dept: 'Thể chất - GDQP', email: 'ho.gdtc@thptlinhtrung.edu.vn', phone: '0997 000 111', maxLoad: 20 },
  { id: 'PE06', name: 'Thầy Mạnh', dept: 'Thể chất - GDQP', email: 'manh.gdtc@thptlinhtrung.edu.vn', phone: '0998 111 222', maxLoad: 20 },

  // Ban Giám Hiệu & Đoàn trường (1)
  { id: 'SP01', name: 'BGH & Đoàn trường', dept: 'Đoàn Đội', email: 'doantruong@thptlinhtrung.edu.vn', phone: '028 3724 0000', maxLoad: 30 },
];

// Helper to generate full 60 classes (Khối 10: 20 lớp, Khối 11: 20 lớp, Khối 12: 20 lớp)
// Tất cả các lớp học cả ngày (full_day)
export function generate60Classes(teachersList: Teacher[]): SchoolClass[] {
  const result: SchoolClass[] = [];
  const homeroomCandidates = teachersList.filter(t => t.name !== 'BGH & Đoàn trường');
  let teacherIdx = 0;

  // Grade 10: 10A1 -> 10A20 (Học cả ngày)
  for (let i = 1; i <= 20; i++) {
    const id = `10A${i}`;
    const hr = homeroomCandidates[teacherIdx % homeroomCandidates.length]?.name || 'Chưa phân công';
    teacherIdx++;
    result.push({
      id,
      name: `Lớp ${id}`,
      grade: 10,
      homeroomTeacher: hr,
      session: 'full_day',
      room: `Phòng 1${i < 10 ? '0' + i : i}`,
    });
  }

  // Grade 11: 11A1 -> 11A20 (Học cả ngày)
  for (let i = 1; i <= 20; i++) {
    const id = `11A${i}`;
    const hr = homeroomCandidates[teacherIdx % homeroomCandidates.length]?.name || 'Chưa phân công';
    teacherIdx++;
    result.push({
      id,
      name: `Lớp ${id}`,
      grade: 11,
      homeroomTeacher: hr,
      session: 'full_day',
      room: `Phòng 2${i < 10 ? '0' + i : i}`,
    });
  }

  // Grade 12: 12A1 -> 12A20 (Học cả ngày)
  for (let i = 1; i <= 20; i++) {
    const id = `12A${i}`;
    const hr = homeroomCandidates[teacherIdx % homeroomCandidates.length]?.name || 'Chưa phân công';
    teacherIdx++;
    result.push({
      id,
      name: `Lớp ${id}`,
      grade: 12,
      homeroomTeacher: hr,
      session: 'full_day',
      room: `Phòng 3${i < 10 ? '0' + i : i}`,
    });
  }

  return result;
}

export const INITIAL_CLASSES: SchoolClass[] = generate60Classes(INITIAL_TEACHERS);

// Pre-seeded schedule for 10A1 (Học cả ngày: Đủ 40 tiết / tuần)
// Thứ 2 đến Thứ 6: Mỗi ngày 8 tiết (4 tiết Sáng + 4 tiết Chiều) = 40 tiết
export const DEFAULT_TIMETABLE_10A1: TimetableEntry[] = [
  // Thứ 2 (8 tiết)
  // Buổi Sáng
  { day: 2, session: 1, period: 1, sub: 'Chào cờ', teacher: 'BGH & Đoàn trường' },
  { day: 2, session: 1, period: 2, sub: 'Toán', teacher: 'Thầy Cường' },
  { day: 2, session: 1, period: 3, sub: 'Toán', teacher: 'Thầy Cường' },
  { day: 2, session: 1, period: 4, sub: 'Ngữ Văn', teacher: 'Cô Hương' },
  // Buổi Chiều
  { day: 2, session: 2, period: 1, sub: 'Tiếng Anh', teacher: 'Cô Lan' },
  { day: 2, session: 2, period: 2, sub: 'Tin học', teacher: 'Thầy Dũng' },
  { day: 2, session: 2, period: 3, sub: 'Lịch sử', teacher: 'Thầy Tuấn' },
  { day: 2, session: 2, period: 4, sub: 'Địa lý', teacher: 'Cô Hà' },

  // Thứ 3 (8 tiết)
  // Buổi Sáng (Tiết 1 trống lúc đầu để demo phát hiện kiểm tra trùng khi xếp Thầy Cường)
  { day: 3, session: 1, period: 2, sub: 'Tiếng Anh', teacher: 'Cô Lan' },
  { day: 3, session: 1, period: 3, sub: 'Vật lý', teacher: 'Thầy Sơn' },
  { day: 3, session: 1, period: 4, sub: 'Hóa học', teacher: 'Cô Ngọc' },
  // Buổi Chiều
  { day: 3, session: 2, period: 1, sub: 'GDTC', teacher: 'Thầy Bình' },
  { day: 3, session: 2, period: 2, sub: 'GDTC', teacher: 'Thầy Bình' },
  { day: 3, session: 2, period: 3, sub: 'Toán', teacher: 'Thầy Cường' },
  { day: 3, session: 2, period: 4, sub: 'Ngữ Văn', teacher: 'Cô Hương' },

  // Thứ 4 (8 tiết)
  // Buổi Sáng
  { day: 4, session: 1, period: 1, sub: 'Ngữ Văn', teacher: 'Cô Hương' },
  { day: 4, session: 1, period: 2, sub: 'Ngữ Văn', teacher: 'Cô Hương' },
  { day: 4, session: 1, period: 3, sub: 'Sinh học', teacher: 'Cô Mai Loan' },
  { day: 4, session: 1, period: 4, sub: 'Tin học', teacher: 'Thầy Dũng' },
  // Buổi Chiều
  { day: 4, session: 2, period: 1, sub: 'Toán', teacher: 'Thầy Cường' },
  { day: 4, session: 2, period: 2, sub: 'Tiếng Anh', teacher: 'Cô Lan' },
  { day: 4, session: 2, period: 3, sub: 'Vật lý', teacher: 'Thầy Sơn' },
  { day: 4, session: 2, period: 4, sub: 'Hóa học', teacher: 'Cô Ngọc' },

  // Thứ 5 (8 tiết)
  // Buổi Sáng
  { day: 5, session: 1, period: 1, sub: 'Toán', teacher: 'Thầy Cường' },
  { day: 5, session: 1, period: 2, sub: 'Tiếng Anh', teacher: 'Cô Lan' },
  { day: 5, session: 1, period: 3, sub: 'Lịch sử', teacher: 'Thầy Tuấn' },
  { day: 5, session: 1, period: 4, sub: 'Địa lý', teacher: 'Cô Hà' },
  // Buổi Chiều
  { day: 5, session: 2, period: 1, sub: 'Vật lý', teacher: 'Thầy Sơn' },
  { day: 5, session: 2, period: 2, sub: 'Hóa học', teacher: 'Cô Ngọc' },
  { day: 5, session: 2, period: 3, sub: 'Ngữ Văn', teacher: 'Cô Hương' },
  { day: 5, session: 2, period: 4, sub: 'Sinh học', teacher: 'Cô Mai Loan' },

  // Thứ 6 (8 tiết)
  // Buổi Sáng
  { day: 6, session: 1, period: 1, sub: 'GDTC', teacher: 'Thầy Bình' },
  { day: 6, session: 1, period: 2, sub: 'GDTC', teacher: 'Thầy Bình' },
  { day: 6, session: 1, period: 3, sub: 'Vật lý', teacher: 'Thầy Sơn' },
  { day: 6, session: 1, period: 4, sub: 'SHL', teacher: 'Thầy Cường' },
  // Buổi Chiều
  { day: 6, session: 2, period: 1, sub: 'Ngữ Văn', teacher: 'Cô Hương' },
  { day: 6, session: 2, period: 2, sub: 'Sinh học', teacher: 'Cô Mai Loan' },
  { day: 6, session: 2, period: 3, sub: 'Tiếng Anh', teacher: 'Cô Lan' },
  { day: 6, session: 2, period: 4, sub: 'GD Kinh tế & PL', teacher: 'Cô Yến' },
];

// Pre-seeded schedule for 11A2 (Học cả ngày)
export const DEFAULT_TIMETABLE_11A2: TimetableEntry[] = [
  // Thứ 2
  { day: 2, session: 1, period: 1, sub: 'Chào cờ', teacher: 'BGH & Đoàn trường' },
  { day: 2, session: 1, period: 2, sub: 'Ngữ Văn', teacher: 'Thầy Thanh' },
  { day: 2, session: 1, period: 3, sub: 'Ngữ Văn', teacher: 'Thầy Thanh' },
  { day: 2, session: 1, period: 4, sub: 'Tiếng Anh', teacher: 'Thầy John' },
  { day: 2, session: 2, period: 1, sub: 'Toán', teacher: 'Thầy Cường' },

  // CRITICAL CONFLICT SLOT: Thầy Cường teaches Toán on Thứ 3 Sáng Tiết 1
  { day: 3, session: 1, period: 1, sub: 'Toán', teacher: 'Thầy Cường' },
  { day: 3, session: 1, period: 2, sub: 'Toán', teacher: 'Thầy Cường' },
  { day: 3, session: 1, period: 3, sub: 'Lịch sử', teacher: 'Thầy Tuấn' },
  { day: 3, session: 1, period: 4, sub: 'Địa lý', teacher: 'Cô Hà' },
  { day: 3, session: 2, period: 1, sub: 'Tiếng Anh', teacher: 'Thầy John' },

  // Thứ 4
  { day: 4, session: 1, period: 1, sub: 'Vật lý', teacher: 'Thầy Sơn' },
  { day: 4, session: 1, period: 2, sub: 'Hóa học', teacher: 'Cô Ngọc' },
  { day: 4, session: 1, period: 3, sub: 'Tiếng Anh', teacher: 'Thầy John' },
  { day: 4, session: 1, period: 4, sub: 'Sinh học', teacher: 'Cô Mai Loan' },

  // Thứ 5
  { day: 5, session: 1, period: 1, sub: 'Toán', teacher: 'Thầy Cường' },
  { day: 5, session: 1, period: 2, sub: 'Toán', teacher: 'Thầy Cường' },
  { day: 5, session: 1, period: 3, sub: 'GDTC', teacher: 'Thầy Bình' },
  { day: 5, session: 1, period: 4, sub: 'GDTC', teacher: 'Thầy Bình' },

  // Thứ 6
  { day: 6, session: 1, period: 1, sub: 'Ngữ Văn', teacher: 'Thầy Thanh' },
  { day: 6, session: 1, period: 2, sub: 'Tin học', teacher: 'Thầy Dũng' },
  { day: 6, session: 1, period: 3, sub: 'Tiếng Anh', teacher: 'Thầy John' },
  { day: 6, session: 1, period: 4, sub: 'SHL', teacher: 'Thầy Tuấn' },

  // Thứ 7
  { day: 7, session: 1, period: 1, sub: 'Vật lý', teacher: 'Thầy Sơn' },
  { day: 7, session: 1, period: 2, sub: 'Hóa học', teacher: 'Cô Ngọc' },
  { day: 7, session: 1, period: 3, sub: 'Lịch sử', teacher: 'Thầy Tuấn' },
  { day: 7, session: 1, period: 4, sub: 'GD Kinh tế & PL', teacher: 'Cô Yến' },
];

// Pre-seeded schedule for 10A2
export const DEFAULT_TIMETABLE_10A2: TimetableEntry[] = [
  { day: 2, session: 1, period: 1, sub: 'Chào cờ', teacher: 'BGH & Đoàn trường' },
  { day: 2, session: 1, period: 2, sub: 'Ngữ Văn', teacher: 'Cô Hương' },
  { day: 2, session: 1, period: 3, sub: 'Toán', teacher: 'Thầy Hùng' },
  { day: 2, session: 1, period: 4, sub: 'Tiếng Anh', teacher: 'Cô Lan' },

  { day: 3, session: 1, period: 1, sub: 'Lịch sử', teacher: 'Thầy Tuấn' },
  { day: 3, session: 1, period: 2, sub: 'Địa lý', teacher: 'Cô Hà' },
  { day: 3, session: 1, period: 3, sub: 'Toán', teacher: 'Thầy Hùng' },
  { day: 3, session: 1, period: 4, sub: 'Vật lý', teacher: 'Thầy Sơn' },

  { day: 4, session: 1, period: 1, sub: 'Toán', teacher: 'Thầy Hùng' },
  { day: 4, session: 1, period: 2, sub: 'Ngữ Văn', teacher: 'Cô Hương' },
  { day: 4, session: 1, period: 3, sub: 'Tiếng Anh', teacher: 'Cô Lan' },
  { day: 4, session: 1, period: 4, sub: 'Sinh học', teacher: 'Cô Mai Loan' },

  { day: 5, session: 1, period: 1, sub: 'Hóa học', teacher: 'Cô Ngọc' },
  { day: 5, session: 1, period: 2, sub: 'Vật lý', teacher: 'Thầy Sơn' },
  { day: 5, session: 1, period: 3, sub: 'GDTC', teacher: 'Thầy Bình' },
  { day: 5, session: 1, period: 4, sub: 'GDTC', teacher: 'Thầy Bình' },

  { day: 6, session: 1, period: 1, sub: 'Tin học', teacher: 'Thầy Dũng' },
  { day: 6, session: 1, period: 2, sub: 'Toán', teacher: 'Thầy Hùng' },
  { day: 6, session: 1, period: 3, sub: 'Ngữ Văn', teacher: 'Cô Hương' },
  { day: 6, session: 1, period: 4, sub: 'SHL', teacher: 'Thầy Minh' },

  { day: 7, session: 1, period: 1, sub: 'Tiếng Anh', teacher: 'Cô Lan' },
  { day: 7, session: 1, period: 2, sub: 'Toán', teacher: 'Thầy Hùng' },
  { day: 7, session: 1, period: 3, sub: 'Hóa học', teacher: 'Cô Ngọc' },
  { day: 7, session: 1, period: 4, sub: 'GD Kinh tế & PL', teacher: 'Cô Yến' },
];

export const INITIAL_ALL_TIMETABLES: Record<string, TimetableEntry[]> = {
  '10A1': DEFAULT_TIMETABLE_10A1,
  '10A2': DEFAULT_TIMETABLE_10A2,
  '11A2': DEFAULT_TIMETABLE_11A2,
};
