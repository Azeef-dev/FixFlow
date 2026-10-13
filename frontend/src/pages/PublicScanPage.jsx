import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  QrCode,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Send,
  RefreshCw,
  Info,
  HelpCircle,
  Wrench,
  Check,
  FileText,
  AlertCircle,
  Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';

export default function PublicScanPage() {
  const { assetCode } = useParams();
  const [asset, setAsset] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Issue Reporting Form State
  const [complaint, setComplaint] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');

  // AI Triage State
  const [isTriaging, setIsTriaging] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [isUserEdited, setIsUserEdited] = useState(false);

  // Editable fields populated by AI
  const [issueTitle, setIssueTitle] = useState('');
  const [issueCategory, setIssueCategory] = useState('');
  const [issuePriority, setIssuePriority] = useState('Medium');

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submittedIssue, setSubmittedIssue] = useState(null);

  useEffect(() => {
    fetchPublicAsset();
  }, [assetCode]);

  const fetchPublicAsset = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get(`/assets/public/${assetCode}`);
      if (res.data.success) {
        setAsset(res.data.asset);
        setRecentActivity(res.data.recentActivity || []);
        setIssueCategory(res.data.asset.category || 'General');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Asset not found or invalid QR link.');
    } finally {
      setLoading(false);
    }
  };

  // Run GenAI Issue Triage
  const handleRunAiTriage = async () => {
    if (!complaint.trim()) {
      toast.error('Please describe the problem first.');
      return;
    }

    try {
      setIsTriaging(true);
      const res = await API.post('/issues/triage', {
        assetCode: asset.assetCode,
        complaint: complaint.trim(),
      });

      if (res.data.success && res.data.suggestions) {
        const s = res.data.suggestions;
        setAiSuggestions(s);
        setIssueTitle(s.suggestedTitle || '');
        setIssueCategory(s.suggestedCategory || asset.category);
        setIssuePriority(s.suggestedPriority || 'Medium');
        setIsUserEdited(false);
        toast.success('AI Issue Triage completed. You can review and adjust suggestions below.');
      }
    } catch {
      toast.error('AI Triage encountered an error. Proceeding with standard reporting.');
    } finally {
      setIsTriaging(false);
    }
  };

  // Submit Issue
  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    if (!complaint.trim()) {
      toast.error('Problem description is required.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        assetCode: asset.assetCode,
        title: issueTitle || `${asset.name} Incident`,
        description: complaint,
        category: issueCategory || asset.category,
        priority: issuePriority,
        reporterName: reporterName.trim() || 'Public Reporter',
        reporterEmail: reporterEmail.trim(),
        reporterPhone: reporterPhone.trim(),
        aiTriage: aiSuggestions,
        isUserEdited,
      };

      const res = await API.post('/issues', payload);
      if (res.data.success) {
        setSubmittedIssue(res.data.issue);
        toast.success(`Issue ${res.data.issue.issueNumber} logged successfully`);
        // Refresh asset status
        fetchPublicAsset();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Verifying Asset QR Identity...</p>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="h-14 w-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Asset Record Not Found</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            {error || 'The QR code scanned does not correspond to an active asset in FixFlow.'}
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow transition"
            >
              <span>Go to Command Center</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="max-w-2xl w-full space-y-6">
        {/* Safe Public Header */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
              <QrCode className="h-5 w-5" />
              <span>FixFlow Public Portal</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              <span>Verified Public Record</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 inline-block mb-1.5">
                {asset.assetCode}
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {asset.name}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Category: <strong>{asset.category}</strong> {asset.modelNumber ? `• Model: ${asset.modelNumber}` : ''}
              </p>
            </div>

            <div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full inline-block ${
                  asset.status === 'Operational'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : asset.status === 'Retired'
                    ? 'bg-slate-200 text-slate-700 border border-slate-300'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {asset.status}
              </span>
            </div>
          </div>

          {/* Quick Specifications */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-600">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex items-start gap-2">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Location</span>
                <span className="font-semibold text-slate-800">
                  {asset.location?.building}, {asset.location?.room}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex items-start gap-2">
              <Activity className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Condition</span>
                <span className="font-semibold text-slate-800">{asset.condition}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex items-start gap-2 col-span-2 sm:col-span-1">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Next Service</span>
                <span className="font-semibold text-slate-800">
                  {asset.nextServiceDate ? new Date(asset.nextServiceDate).toLocaleDateString() : 'Routine'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Successful Submission View */}
        {submittedIssue ? (
          <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Issue Successfully Logged</h3>
                <p className="text-xs text-slate-500">
                  Ticket Reference:{' '}
                  <span className="font-mono font-bold text-blue-700">{submittedIssue.issueNumber}</span>
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Title:</span>
                <span className="font-bold text-slate-800">{submittedIssue.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Priority:</span>
                <span className="font-semibold text-slate-800">{submittedIssue.priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Status:</span>
                <span className="font-semibold text-amber-700">{submittedIssue.status}</span>
              </div>
              <div className="pt-2 text-slate-600">
                Our facilities and maintenance team has been alerted. You can track this issue or report another problem below.
              </div>
            </div>

            <button
              onClick={() => {
                setSubmittedIssue(null);
                setComplaint('');
                setAiSuggestions(null);
              }}
              className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition"
            >
              Report Another Issue for This Asset
            </button>
          </div>
        ) : (
          /* Issue Reporting with AI Triage Form */
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-600" />
                <span>Report an Issue or Malfunction</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Describe what is wrong in plain language. Our AI will analyze the problem and formulate diagnostic suggestions.
              </p>
            </div>

            <form onSubmit={handleSubmitIssue} className="space-y-4">
              {/* Natural Language Complaint Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Describe Problem *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. The projector display is flickering and sometimes does not detect HDMI signal..."
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              {/* AI Triage Trigger Button */}
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-semibold text-blue-900">
                    GenAI Issue Triage (Analyzes causes, priority & safe checks)
                  </span>
                </div>
                <button
                  type="button"
                  disabled={isTriaging || !complaint.trim()}
                  onClick={handleRunAiTriage}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition"
                >
                  {isTriaging ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Run AI Triage</span>
                    </>
                  )}
                </button>
              </div>

              {/* AI Suggestions Review & Edit Card */}
              {aiSuggestions && (
                <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-200 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-200/60">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                      <span>AI Triage Suggestions (Human Review & Edit)</span>
                    </span>
                    <span className="text-[11px] font-semibold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                      Advisory Output
                    </span>
                  </div>

                  {/* Recurring Warning */}
                  {aiSuggestions.recurringWarning && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{aiSuggestions.recurringWarning}</span>
                    </div>
                  )}

                  {/* Editable Fields */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Professional Issue Title
                      </label>
                      <input
                        type="text"
                        value={issueTitle}
                        onChange={(e) => {
                          setIssueTitle(e.target.value);
                          setIsUserEdited(true);
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Category
                        </label>
                        <input
                          type="text"
                          value={issueCategory}
                          onChange={(e) => {
                            setIssueCategory(e.target.value);
                            setIsUserEdited(true);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Priority
                        </label>
                        <select
                          value={issuePriority}
                          onChange={(e) => {
                            setIssuePriority(e.target.value);
                            setIsUserEdited(true);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Diagnostic details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                    {/* Possible Causes */}
                    <div className="bg-white p-3 rounded-lg border border-blue-100">
                      <span className="font-bold text-slate-800 block mb-1">Possible Causes:</span>
                      <ul className="space-y-1 list-disc list-inside text-slate-600 text-[11px]">
                        {aiSuggestions.possibleCauses?.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Safe Initial Checks */}
                    <div className="bg-white p-3 rounded-lg border border-blue-100">
                      <span className="font-bold text-slate-800 block mb-1">Safe Initial Checks:</span>
                      <ul className="space-y-1 list-disc list-inside text-slate-600 text-[11px]">
                        {aiSuggestions.initialChecks?.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Reporter Details (Optional) */}
              <div className="border-t border-slate-100 pt-3">
                <span className="block text-xs font-semibold text-slate-700 mb-2">
                  Reporter Contact (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={reporterEmail}
                    onChange={(e) => setReporterEmail(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="tel"
                    placeholder="Your Phone"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex justify-center items-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow transition"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Submitting Report...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Maintenance Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Safe Recent Activity List */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Clock className="h-4 w-4 text-slate-400" />
            <span>Public Service History Timeline</span>
          </div>

          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((act, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-none">
                  <span className="font-semibold text-slate-800">{act.action}</span>
                  <span className="text-slate-400">
                    {new Date(act.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">No public history recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
