import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import { loginUser, registerUser } from '../utils/authStorage';
import { useToast } from '../components/Toast';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'citizen' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const toast = useToast();
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    try {
      registerUser({ ...form, name: form.name.trim(), email: form.email.trim() });
      const user = loginUser(form.email.trim(), form.password);
      toast('Account created. Welcome to CivicSignal!');
      navigate(user.role === 'admin' ? '/admin' : '/report', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Report issues and follow them from one place."
      footer={<>Already have an account? <Link to="/login" className="text-brand-600 font-semibold hover:underline">Log in</Link></>}
    >
      {error && <div role="alert" className="rounded-xl bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 text-sm p-3 mb-4">{error}</div>}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="name" className="label">Full name</label>
          <input id="name" required className="input" autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div>
          <label htmlFor="email" className="label">Email address</label>
          <input id="email" type="email" required className="input" autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div>
          <label htmlFor="pw" className="label">Password (min. 6 characters)</label>
          <input id="pw" type="password" required className="input" autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} />
        </div>
        <div>
          <label htmlFor="role" className="label">Account type</label>
          <select id="role" className="input" value={form.role} onChange={(e) => set('role', e.target.value)}>
            <option value="citizen">Citizen</option>
            <option value="admin">Municipal administrator (demo only)</option>
          </select>
          <p className="text-[11px] text-muted mt-1.5">In the real system, administrator accounts are created by the municipality, not self-registered.</p>
        </div>
        <button type="submit" className="btn-primary w-full !py-3">Create account</button>
      </form>
    </AuthShell>
  );
}
