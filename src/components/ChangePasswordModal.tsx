import { FormEvent, useState } from 'react';
import { X } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onSubmit: (newPassword: string) => Promise<string | null>;
}

export const ChangePasswordModal = ({ isOpen, email, onClose, onSubmit }: ChangePasswordModalProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới nhập lại không khớp.');
      return;
    }

    setBusy(true);
    const result = await onSubmit(newPassword);
    setBusy(false);
    if (result) {
      setError(result);
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="change-password-title" className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="change-password-title" className="text-lg font-bold text-slate-900">Đổi mật khẩu</h2>
            <p className="mt-1 text-sm text-slate-500">Tài khoản: {email}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-500 hover:bg-slate-100" aria-label="Đóng">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            Mật khẩu mới (ít nhất 8 ký tự)
            <input required minLength={8} type="password" autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Nhập lại mật khẩu mới
            <input required minLength={8} type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" />
          </label>
          {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Hủy</button>
            <button disabled={busy} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Đang cập nhật...' : 'Đổi mật khẩu'}</button>
          </div>
        </form>
      </section>
    </div>
  );
};