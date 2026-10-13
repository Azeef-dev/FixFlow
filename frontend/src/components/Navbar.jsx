import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { QrCode, LayoutDashboard, Box, Wrench, Shield, User, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, quickSwitchRole, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Fix<span className="text-blue-600">Flow</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                MaintainIQ Engine
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-1 ml-8">
              <Link
                to="/"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/assets"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/assets') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Box className="h-4 w-4" />
                <span>Assets & Labels</span>
              </Link>
              <Link
                to="/issues"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive('/issues') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Wrench className="h-4 w-4" />
                <span>Issues & Workflows</span>
              </Link>
            </nav>
          )}
        </div>

        {/* Right side: Demo Role Switcher + User Profile */}
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <>
              {/* Evaluator Quick Role Switcher */}
              <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
                <span className="px-2 text-slate-500">Demo Role:</span>
                <button
                  onClick={() => quickSwitchRole('admin')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ${
                    user?.role === 'admin' ? 'bg-white shadow text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Shield className="h-3 w-3" />
                  <span>Admin</span>
                </button>
                <button
                  onClick={() => quickSwitchRole('technician')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ${
                    user?.role === 'technician' ? 'bg-white shadow text-indigo-700 font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Wrench className="h-3 w-3" />
                  <span>Tech</span>
                </button>
              </div>

              {/* User badge */}
              <div className="flex items-center space-x-2 pl-2">
                <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 border border-slate-300">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-semibold text-slate-900 leading-tight">{user?.name}</div>
                  <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
                </div>
                <button
                  onClick={() => logout()}
                  title="Sign Out"
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
