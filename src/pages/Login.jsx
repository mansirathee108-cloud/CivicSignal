import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import { initializeStorage, loginUser } from '../utils/authStorage';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const signIn = (e, creds) => {
    e?.preventDefault();
    initializeStorage();
    try {
      const user = loginUser(creds?.email ?? email.trim(), creds?.password ?? password);
      const from = location.state?.from;
      if (user.role === 'admin') navigate(from?.startsWith('/admin') ? from : '/admin', { replace: true });
      else navigate('/report', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to track your complaints or manage the city dashboard."
      footer={<>New here? <Link to="/signup" className="text-brand-600 font-semibold hover:underline">Create an account</Link></>}
    >
      {error && <div role="alert" className="rounded-xl bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 text-sm p-3 mb-4">{error}</div>}

      <form onSubmit={signIn} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Email address</label>
          <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="pw" className="label">Password</label>
          <input id="pw" type="password" required autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary w-full !py-3">Log in</button>
      </form>

      <div className="mt-6 rounded-xl bg-soft p-4">
        <p className="text-xs font-semibold text-muted mb-2">Demo accounts (prototype)</p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn-outline !py-2 !text-xs" onClick={() => signIn(null, { email: 'citizen@civic.com', password: 'password' })}>Citizen demo</button>
          <button type="button" className="btn-outline !py-2 !text-xs" onClick={() => signIn(null, { email: 'admin@civic.com', password: 'password' })}>Admin demo</button>
        </div>
      </div>
    </AuthShell>
  );
}
