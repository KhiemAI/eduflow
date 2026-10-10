interface SupabaseErrorLike {
  message?: string;
  code?: string;
}

export const getVietnameseErrorMessage = (
  error: SupabaseErrorLike,
  fallback = 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
): string => {
  const message = error.message?.trim() || '';
  const normalized = message.toLowerCase();
  const code = error.code?.toLowerCase() || '';

  if (/only request this after (\d+) seconds?/i.test(message)) {
    const seconds = Number(message.match(/only request this after (\d+) seconds?/i)?.[1]);
    return `Bạn vừa yêu cầu gửi email. Vui lòng đợi ${seconds} giây rồi thử lại.`;
  }
  if (normalized.includes('email rate limit exceeded') || normalized.includes('rate limit')) {
    return 'Bạn đã yêu cầu gửi email quá nhiều lần. Vui lòng đợi một lúc rồi thử lại.';
  }
  if (normalized.includes('invalid login credentials')) {
    return 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại thông tin đăng nhập.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Email chưa được xác nhận. Vui lòng mở email xác nhận trước khi đăng nhập.';
  }
  if (normalized.includes('user already registered') || normalized.includes('already been registered')) {
    return 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng chức năng quên mật khẩu.';
  }
  if (normalized.includes('password should be at least') || normalized.includes('password is too short')) {
    return 'Mật khẩu chưa đủ độ dài yêu cầu. Vui lòng chọn mật khẩu dài hơn.';
  }
  if (normalized.includes('weak_password') || normalized.includes('password should contain')) {
    return 'Mật khẩu chưa đáp ứng yêu cầu bảo mật. Vui lòng chọn mật khẩu mạnh hơn.';
  }
  if (normalized.includes('invalid email') || normalized.includes('unable to validate email')) {
    return 'Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại.';
  }
  if (normalized.includes('new password should be different') || normalized.includes('different from the old password')) {
    return 'Mật khẩu mới cần khác mật khẩu hiện tại.';
  }
  if (normalized.includes('same password')) {
    return 'Mật khẩu mới cần khác mật khẩu hiện tại.';
  }
  if (normalized.includes('expired') || normalized.includes('invalid token') || normalized.includes('otp_expired')) {
    return 'Liên kết đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu gửi liên kết mới.';
  }
  if (normalized.includes('fetch failed') || normalized.includes('network') || normalized.includes('failed to fetch')) {
    return 'Không thể kết nối đến dịch vụ. Vui lòng kiểm tra Internet và thử lại.';
  }
  if (code === '23505' || normalized.includes('duplicate key')) {
    return 'Thông tin này đã tồn tại trong hệ thống.';
  }
  if (normalized.includes('only a workspace admin')) {
    return 'Chỉ quản trị viên workspace mới có quyền mời thành viên.';
  }
  if (normalized.includes('create an eduflow account with this email')) {
    return 'Email này chưa có tài khoản EduFlow. Hãy tạo tài khoản trước khi mời vào workspace.';
  }

  return fallback;
};