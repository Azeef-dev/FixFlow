import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  QrCode,
  MapPin,
  Calendar,
  Box,
  Wrench,
  Clock,
  Shield,
  Printer,
  Copy,
  ExternalLink,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import API from '../services/api';

export default function AssetDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssetDetail = async () => {
      try {
        const res = await API.get(`/assets/${id}`);
        if (res.data.success) {
          setData(res.data);
        }
      } catch {
        toast.error('Could not fetch asset details');
      } finally {
        setLoading(false);
      }
    };
    fetchAssetDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data?.asset) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-3">
        <h3 className="text-lg font-bold text-slate-800">Asset Not Found</h3>
        <Link to="/assets" className="text-sm font-semibold text-blue-600 hover:underline">
          Return to Asset Inventory
        </Link>
      </div>
    );
  }

  const { asset, issues = [], history = [] } = data;
  const publicUrl = `${window.location.origin}/scan/${asset.assetCode}`;

  const copyPublicLink = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success('Public URL copied to clipboard');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button and quick actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/assets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Assets</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={copyPublicLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Copy Public Link</span>
          </button>
          <Link
            to={`/scan/${asset.assetCode}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open Public QR View</span>
          </Link>
        </div>
      </div>

      {/* Main Asset Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
              {asset.assetCode}
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {asset.status}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {asset.name}
          </h1>

          <div className="flex flex-wrap gap-4 text-xs text-slate-600 pt-1">
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-slate-400" />
              <span>{asset.category}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>
                {asset.location?.building}, {asset.location?.floor}, {asset.location?.room}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-slate-400" />
              <span>Condition: {asset.condition}</span>
            </span>
          </div>
        </div>

        {/* QR Code Preview widget */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center shrink-0 text-center">
          <QRCodeSVG value={publicUrl} size={110} level="M" />
          <span className="text-[10px] font-mono font-bold text-slate-600 mt-2 block">
            {asset.assetCode}
          </span>
          <button
            onClick={() => window.print()}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
          >
            <Printer className="h-3 w-3" />
            <span>Print Label</span>
          </button>
        </div>
      </div>

      {/* Grid: Issues & Permanent Audit History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Issues List */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-blue-600" />
              <span>Reported Issues ({issues.length})</span>
            </h3>
            <Link
              to={`/scan/${asset.assetCode}`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              + Report New
            </Link>
          </div>

          <div className="space-y-3">
            {issues.length > 0 ? (
              issues.map((iss) => (
                <div key={iss._id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-700">{iss.issueNumber}</span>
                    <span className="font-semibold text-slate-700">{iss.status}</span>
                  </div>
                  <div className="font-bold text-slate-800">{iss.title}</div>
                  <p className="text-slate-500 line-clamp-2">{iss.description}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No issues reported for this asset.</p>
            )}
          </div>
        </div>

        {/* Permanent Audit Timeline */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-600" />
              <span>Permanent Audit Timeline</span>
            </h3>
            <p className="text-xs text-slate-400">Complete immutable record of events</p>
          </div>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
            {history.length > 0 ? (
              history.map((h) => (
                <div key={h._id} className="flex items-start gap-3 text-xs pb-3 border-b border-slate-50 last:border-none">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{h.action}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(h.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{h.details}</p>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Actor: {h.actor?.name || 'System'} ({h.actor?.role})
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No history recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
