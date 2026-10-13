import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Lock, Mail, Shield, Wrench, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      navigate('/');
    }
  };

  const handleDemoLogin = async (demoEmail) => {
    setLoading(true);
    const success = await login(demoEmail, 'Password123!');
    setLoading(false);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-xl">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/20">
            <QrCode className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Fix<span className="text-blue-600">Flow</span> Sign In
          </h2>
          <p className="text-xs text-slate-500">
            Authentication portal for facility administrators & maintenance engineers
          </p>
        </div>

        {/* Demo Fast-Login Cards for Evaluator */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Hackathon Demo Quick Credentials:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('admin@fixflow.io')}
              className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-left transition space-y-1 shadow-sm"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Shield className="h-3.5 w-3.5 text-blue-600" />
                <span>Admin</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate">admin@fixflow.io</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('tech@fixflow.io')}
              className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 text-left transition space-y-1 shadow-sm"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Wrench className="h-3.5 w-3.5 text-indigo-600" />
                <span>Technician</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate">tech@fixflow.io</div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="email"
                required
                placeholder="name@fixflow.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center items-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow transition"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

