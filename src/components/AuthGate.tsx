import { FormEvent, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { INITIAL_ALL_TIMETABLES, INITIAL_CLASSES, INITIAL_SUBJECTS, INITIAL_TEACHERS } from '../data/mockData.ts';
import { isSupabaseConfigured, supabase } from '../lib/supabase.ts';
import type { WorkspacePayload, WorkspaceRecord } from '../types/workspace.ts';
import App from '../App.tsx';

interface MembershipRecord {
  role: 'admin' | 'editor';
  workspace: WorkspaceRecord | WorkspaceRecord[];
}

const initialPayload = (schoolName: string): WorkspacePayload => ({
  classes: INITIAL_CLASSES,
  teachers: INITIAL_TEACHERS,
  subjectsConfig: INITIAL_SUBJECTS,
  allTimetables: INITIAL_ALL_TIMETABLES,
  departmentName: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO TP.HCM',
  schoolName,
  academicYear: 'Năm học 2024 - 2025 • Học kỳ 1',
  periodsPerSession: 4,
});

export const AuthGate = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceRecord | null>(null);
  const [role, setRole] = useState<'admin' | 'editor' | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const loadWorkspace = async (user: User) => {
    if (!supabase) return;
    const { data, error: queryError } = await supabase
      .from('school_members')
      .select('role, workspace:school_workspaces!inner(id,name,payload,version)')
      .eq('user_id', user.id)
      .maybeSingle();

    if (queryError) {
      setError(queryError.message.includes('relation')
        ? 'Chưa cài cơ sở dữ liệu. Hãy chạy migration Supabase trong thư mục supabase/migrations.'
        : queryError.message);
      setWorkspace(null);
      setRole(null);
      setLoading(false);
      return;
    }

    const membership = data as MembershipRecord | null;
    const workspaceRecord = Array.isArray(membership?.workspace)
      ? membership.workspace[0]
      : membership?.workspace;
    setWorkspace(workspaceRecord || null);
    setRole(membership?.role || null);
    setError('');
    setLoading(false);
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) void loadWorkspace(data.session.user);
      else setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        setLoading(true);
        window.setTimeout(() => void loadWorkspace(nextSession.user), 0);
      } else {
        setWorkspace(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleAuth = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError('');
    setNotice('');

    const result = isSignUp
      ? await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });

    setBusy(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (isSignUp && !result.data.session) {
      setNotice('Tài khoản đã tạo. Hãy xác nhận email, sau đó đăng nhập để tiếp tục.');
    }
  };

  const handleCreateWorkspace = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !session || !schoolName.trim()) return;
    setBusy(true);
    setError('');

    const { data: created, error: createError } = await supabase.rpc('create_school_workspace', {
      workspace_name: schoolName.trim(),
      initial_payload: initialPayload(schoolName.trim()),
    });

    if (createError) {
      setError(createError.message);
      setBusy(false);
      return;
    }

    setBusy(false);
    setWorkspace(created as WorkspaceRecord);
    setRole('admin');
  };

  const handleInvite = async (memberEmail: string) => {
    if (!supabase) return false;
    const { error: inviteError } = await supabase.rpc('invite_school_member', {
      member_email: memberEmail.trim(),
    });
    if (inviteError) {
      setError(inviteError.message);
      return false;
    }
    setNotice(`Đã thêm ${memberEmail} vào workspace. Người này cần có tài khoản EduFlow trước.`);
    return true;
  };

  if (!isSupabaseConfigured || !supabase) {
    return (
      <AuthLayout>
        <h1 className="text-2xl font-black text-slate-900">Kết nối Supabase</h1>
        <p className="mt-2 text-sm text-slate-600">Tạo tệp .env.local từ .env.example, điền URL và anon key của dự án Supabase rồi khởi động lại Vite.</p>
      </AuthLayout>
    );
  }

  if (loading) {
    return <AuthLayout><p className="text-sm font-semibold text-slate-600">Đang kết nối EduFlow...</p></AuthLayout>;
  }

  if (!session) {
    return (
      <AuthLayout>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-700">EduFlow Workspace</p>
        <h1 className="mt-2 text-2xl font-black text-slate-900">{isSignUp ? 'Tạo tài khoản' : 'Đăng nhập'}</h1>
        <p className="mt-2 text-sm text-slate-600">Dữ liệu trường được lưu trên Supabase và đồng bộ giữa các thành viên.</p>
        <form onSubmit={handleAuth} className="mt-6 space-y-3">
          <input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
          <input required minLength={6} type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mật khẩu (ít nhất 6 ký tự)" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
          <button disabled={busy} className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Đang xử lý...' : isSignUp ? 'Đăng ký' : 'Đăng nhập'}</button>
        </form>
        <button onClick={() => { setIsSignUp(!isSignUp); setError(''); setNotice(''); }} className="mt-4 text-sm font-semibold text-blue-700">{isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}</button>
        <StatusMessage error={error} notice={notice} />
      </AuthLayout>
    );
  }

  if (!workspace) {
    return (
      <AuthLayout>
        <h1 className="text-2xl font-black text-slate-900">Tạo workspace trường</h1>
        <p className="mt-2 text-sm text-slate-600">Nếu quản trị viên trường đã mời email này, hãy tải lại để nhận workspace. Nếu chưa có workspace, tài khoản này có thể tạo trường mới.</p>
        <button onClick={() => { setLoading(true); void loadWorkspace(session.user); }} className="mt-3 text-sm font-semibold text-blue-700">Kiểm tra lời mời</button>
        <form onSubmit={handleCreateWorkspace} className="mt-6 space-y-3">
          <input required value={schoolName} onChange={e => setSchoolName(e.target.value)} placeholder="Tên trường" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
          <button disabled={busy} className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{busy ? 'Đang tạo...' : 'Tạo workspace'}</button>
        </form>
        <button onClick={() => { void supabase?.auth.signOut(); }} className="mt-4 text-sm font-semibold text-slate-600">Đăng xuất</button>
        <StatusMessage error={error} notice={notice} />
      </AuthLayout>
    );
  }

  return (
    <App
      key={workspace.id}
      workspaceId={workspace.id}
      userId={session.user.id}
      userEmail={session.user.email || ''}
      memberRole={role || 'editor'}
      initialWorkspace={workspace}
      onInviteMember={handleInvite}
      onLogout={() => { void supabase?.auth.signOut(); }}
    />
  );
};

const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <main className="min-h-screen bg-slate-100 px-4 py-10">
    <section className="mx-auto mt-10 max-w-md rounded-xl border border-slate-200 bg-white p-7 shadow-sm">{children}</section>
  </main>
);

const StatusMessage = ({ error, notice }: { error: string; notice: string }) => (
  <>
    {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
    {notice && <p role="status" className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
  </>
);