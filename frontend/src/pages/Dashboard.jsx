import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  AlertTriangle,
  Wrench,
  CheckCircle,
  Activity,
  PlusCircle,
  QrCode,
  ArrowUpRight,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await API.get('/dashboard/stats');
      if (res.data.success) {
        setData(res.data);
      }
    } catch {
      toast.error('Could not load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { stats, categoryStats = [], priorityStats = [], recentActivity = [] } = data || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-semibold text-blue-200 mb-3">
            <Activity className="h-3.5 w-3.5" />
            <span>Facility Operational Status: Online</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            FixFlow Command Center
          </h1>
          <p className="mt-1 text-blue-100 max-w-xl text-sm sm:text-base">
            AI-driven QR maintenance triage, continuous asset lifecycle tracking, and immutable audit logs.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {isAdmin && (
            <Link
              to="/assets?action=create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 font-semibold hover:bg-blue-50 transition shadow"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Register Asset</span>
            </Link>
          )}
          <Link
            to="/scan/AST-1001"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 backdrop-blur border border-white/30 text-white font-semibold hover:bg-white/20 transition"
          >
            <QrCode className="h-4 w-4" />
            <span>Test QR Scan View</span>
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Assets */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Registered Assets</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Box className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-slate-900">{stats?.totalAssets || 0}</span>
            <span className="ml-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {stats?.operationalAssets || 0} Operational
            </span>
          </div>
        </div>

        {/* Active Issues */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Active Issues</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-slate-900">{stats?.activeIssues || 0}</span>
            <span className="ml-2 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              In Queue
            </span>
          </div>
        </div>

        {/* Maintenance / Inspection */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">In Maintenance</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Wrench className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-slate-900">{stats?.inMaintenanceAssets || 0}</span>
            <span className="ml-2 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              Being Serviced
            </span>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">Critical Priority</span>
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-red-600">{stats?.criticalIssues || 0}</span>
            <span className="ml-2 text-xs font-semibold text-slate-500">
              Requires Urgent Attention
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Category Matrix + Permanent History Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Asset Breakdown & Quick Access */}
        <div className="lg:col-span-1 space-y-6">
          {/* Category Breakdown */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center justify-between">
              <span>Assets by Category</span>
              <span className="text-xs text-slate-400 font-normal">All Locations</span>
            </h3>
            <div className="space-y-3">
              {categoryStats.length > 0 ? (
                categoryStats.map((cat) => (
                  <div key={cat._id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-medium">{cat._id}</span>
                    <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg text-xs">
                      {cat.count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">No categories registered</p>
              )}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <QrCode className="h-5 w-5 text-blue-400" />
              <span>Public QR Demonstrator</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Open the pre-configured Classroom Projector public QR view to simulate an end-user scanning a real physical label and reporting an issue.
            </p>
            <div className="pt-2">
              <Link
                to="/scan/AST-1001"
                className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 font-semibold text-sm transition"
              >
                <span>Launch QR Simulator</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Permanent History Feed */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Permanent Asset Timeline</h3>
              <p className="text-xs text-slate-500">Live immutable activity audit feed</p>
            </div>
            <Link
              to="/issues"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All Issues</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-6 space-y-5">
            {recentActivity.length > 0 ? (
              recentActivity.map((act) => (
                <div key={act._id} className="flex items-start gap-4 text-sm pb-4 border-b border-slate-50 last:border-none">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 truncate">
                        {act.action}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0">
                        {new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {act.details}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      {act.asset && (
                        <span className="font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">
                          {act.asset.assetCode} - {act.asset.name}
                        </span>
                      )}
                      <span className="text-slate-400">
                        By: <strong className="text-slate-600">{act.actor?.name || 'System'}</strong> ({act.actor?.role})
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 py-6 text-center">No activity history recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
