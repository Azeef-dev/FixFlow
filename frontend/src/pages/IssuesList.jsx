import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Search,
  Filter,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  DollarSign,
  Plus,
  Trash2,
  X,
  ShieldAlert,
  ClipboardList,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function IssuesList() {
  const { user, isAdmin, isTechnician } = useAuth();
  const [issues, setIssues] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [assignModalIssue, setAssignModalIssue] = useState(null);
  const [selectedTechId, setSelectedTechId] = useState('');

  const [maintenanceModalIssue, setMaintenanceModalIssue] = useState(null);
  const [resolveModalIssue, setResolveModalIssue] = useState(null);
  const [reopenModalIssue, setReopenModalIssue] = useState(null);

  // Maintenance Form State
  const [notes, setNotes] = useState('');
  const [workPerformed, setWorkPerformed] = useState('');
  const [parts, setParts] = useState([{ name: '', cost: 0, quantity: 1 }]);
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [reopenReason, setReopenReason] = useState('');

  const fetchIssues = async () => {
    try {
      const res = await API.get('/issues', {
        params: {
          status: statusFilter,
          priority: priorityFilter,
          search,
        },
      });
      if (res.data.success) {
        setIssues(res.data.issues);
      }
    } catch {
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await API.get('/auth/technicians');
      if (res.data.success) {
        setTechnicians(res.data.technicians);
      }
    } catch {
      // Ignore if not logged in
    }
  };

  useEffect(() => {
    fetchIssues();
    fetchTechnicians();
  }, [statusFilter, priorityFilter]);

  // Handler: Assign to Technician
  const handleAssignTechnician = async (e) => {
    e.preventDefault();
    if (!selectedTechId) {
      toast.error('Please choose a technician.');
      return;
    }

    try {
      const res = await API.patch(`/issues/${assignModalIssue._id}/assign`, {
        technicianId: selectedTechId,
      });
      if (res.data.success) {
        toast.success(`Assigned ${assignModalIssue.issueNumber} to technician.`);
        setAssignModalIssue(null);
        setSelectedTechId('');
        fetchIssues();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Assignment failed');
    }
  };

  // Handler: Start Inspection
  const handleStartInspection = async (issueId) => {
    try {
      const res = await API.patch(`/issues/${issueId}/inspect`);
      if (res.data.success) {
        toast.success('Inspection started. Asset status set to Under Inspection.');
        fetchIssues();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start inspection');
    }
  };

  // Handler: Save Maintenance Log
  const handleSaveMaintenance = async (e) => {
    e.preventDefault();
    const totalCost = parts.reduce((acc, p) => acc + (parseFloat(p.cost) || 0) * (parseInt(p.quantity) || 1), 0);

    try {
      const res = await API.patch(`/issues/${maintenanceModalIssue._id}/maintenance`, {
        notes,
        workPerformed,
        partsReplaced: parts.filter((p) => p.name.trim()),
        totalCost,
        status: 'Maintenance In Progress',
      });
      if (res.data.success) {
        toast.success('Maintenance log recorded successfully');
        setMaintenanceModalIssue(null);
        fetchIssues();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating maintenance log');
    }
  };

  // Handler: Mark Resolved
  const handleResolveIssue = async (e) => {
    e.preventDefault();
    if (!notes.trim()) {
      toast.error('Business Rule: An issue cannot be resolved without a maintenance note.');
      return;
    }

    const totalCost = parts.reduce((acc, p) => acc + (parseFloat(p.cost) || 0) * (parseInt(p.quantity) || 1), 0);

    try {
      const res = await API.patch(`/issues/${resolveModalIssue._id}/resolve`, {
        notes,
        workPerformed,
        partsReplaced: parts.filter((p) => p.name.trim()),
        totalCost,
        nextServiceDate: nextServiceDate || null,
      });

      if (res.data.success) {
        toast.success('Issue marked resolved. Asset returned to Operational status.');
        setResolveModalIssue(null);
        fetchIssues();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Resolution failed');
    }
  };

  // Handler: Reopen
  const handleReopenIssue = async (e) => {
    e.preventDefault();
    try {
      const res = await API.patch(`/issues/${reopenModalIssue._id}/reopen`, {
        reason: reopenReason,
      });
      if (res.data.success) {
        toast.success('Issue reopened for further servicing');
        setReopenModalIssue(null);
        setReopenReason('');
        fetchIssues();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reopen failed');
    }
  };

  const addPartRow = () => {
    setParts([...parts, { name: '', cost: 0, quantity: 1 }]);
  };

  const removePartRow = (index) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-300 ring-2 ring-red-400 font-extrabold animate-pulse';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
      case 'Medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Low':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Maintenance Issues & Controlled Workflow
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit reported issues, manage assignments, enforce repair rules, and track resolution
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by issue title, number (ISS-1001), or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchIssues()}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="Reported">Reported</option>
            <option value="Assigned">Assigned</option>
            <option value="Inspection Started">Inspection Started</option>
            <option value="Maintenance In Progress">Maintenance In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Reopened">Reopened</option>
          </select>
        </div>
      </div>

      {/* Issues Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
          <Wrench className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No issues found</h3>
          <p className="text-sm text-slate-400">All systems are currently reported healthy.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Ticket #</th>
                  <th className="px-5 py-3.5">Asset</th>
                  <th className="px-5 py-3.5">Issue Details</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Assigned Tech</th>
                  <th className="px-5 py-3.5 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issues.map((iss) => (
                  <tr key={iss._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-4 font-mono font-bold text-blue-700 text-xs whitespace-nowrap">
                      {iss.issueNumber}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{iss.asset?.name || 'N/A'}</div>
                      <div className="text-xs text-slate-400 font-mono">{iss.asset?.assetCode}</div>
                    </td>

                    <td className="px-5 py-4 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate">{iss.title}</div>
                      <div className="text-xs text-slate-500 truncate">{iss.description}</div>
                      {iss.aiTriage?.wasAiUsed && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          <Sparkles className="h-2.5 w-2.5" />
                          <span>AI Triaged</span>
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full border inline-block ${getPriorityBadge(
                          iss.priority
                        )}`}
                      >
                        {iss.priority}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {iss.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-xs">
                      {iss.assignedTechnician ? (
                        <div>
                          <div className="font-semibold text-slate-800">{iss.assignedTechnician.name}</div>
                          <div className="text-[11px] text-slate-400">{iss.assignedTechnician.specialization}</div>
                        </div>
                      ) : (
                        <span className="text-amber-600 font-medium">Unassigned</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right whitespace-nowrap space-x-1.5">
                      {/* View Diagnostic Card */}
                      <button
                        onClick={() => setSelectedIssue(iss)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="View Diagnostic Overview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Admin: Assign */}
                      {isAdmin && iss.status !== 'Resolved' && (
                        <button
                          onClick={() => {
                            setAssignModalIssue(iss);
                            setSelectedTechId(iss.assignedTechnician?._id || '');
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        >
                          Assign
                        </button>
                      )}

                      {/* Technician Actions */}
                      {iss.status === 'Assigned' && (
                        <button
                          onClick={() => handleStartInspection(iss._id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
                        >
                          Start Inspect
                        </button>
                      )}

                      {['Inspection Started', 'Maintenance In Progress'].includes(iss.status) && (
                        <>
                          <button
                            onClick={() => {
                              setMaintenanceModalIssue(iss);
                              setNotes(iss.maintenance?.notes || '');
                              setWorkPerformed(iss.maintenance?.workPerformed || '');
                              setParts(
                                iss.maintenance?.partsReplaced?.length
                                  ? iss.maintenance.partsReplaced
                                  : [{ name: '', cost: 0, quantity: 1 }]
                              );
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition"
                          >
                            Log Work
                          </button>

                          <button
                            onClick={() => {
                              setResolveModalIssue(iss);
                              setNotes(iss.maintenance?.notes || '');
                              setWorkPerformed(iss.maintenance?.workPerformed || '');
                              setParts(
                                iss.maintenance?.partsReplaced?.length
                                  ? iss.maintenance.partsReplaced
                                  : [{ name: '', cost: 0, quantity: 1 }]
                              );
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
                          >
                            Resolve
                          </button>
                        </>
                      )}

                      {/* Reopen Action */}
                      {iss.status === 'Resolved' && (
                        <button
                          onClick={() => setReopenModalIssue(iss)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition"
                        >
                          Reopen
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Diagnostic & Details Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-5">
            <button
              onClick={() => setSelectedIssue(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {selectedIssue.issueNumber}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full border ${getPriorityBadge(
                    selectedIssue.priority
                  )}`}
                >
                  {selectedIssue.priority}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-2">{selectedIssue.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Asset: {selectedIssue.asset?.name} ({selectedIssue.asset?.assetCode})</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-700 block">Reported Description:</span>
              <p className="text-slate-600 leading-relaxed">{selectedIssue.description}</p>
            </div>

            {/* AI Triage Suggestions Card */}
            {selectedIssue.aiTriage?.wasAiUsed && (
              <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 text-xs space-y-3">
                <div className="flex items-center justify-between font-bold text-blue-900">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <span>AI Diagnostic Intelligence</span>
                  </span>
                  <span className="text-[10px] text-blue-600">
                    {selectedIssue.aiTriage.wasUserEdited ? 'Edited by User' : 'Accepted as Suggested'}
                  </span>
                </div>

                {selectedIssue.aiTriage.possibleCauses?.length > 0 && (
                  <div>
                    <span className="font-semibold text-slate-800">Possible Causes:</span>
                    <ul className="list-disc list-inside text-slate-600 mt-1 space-y-0.5 text-[11px]">
                      {selectedIssue.aiTriage.possibleCauses.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedIssue.aiTriage.initialChecks?.length > 0 && (
                  <div>
                    <span className="font-semibold text-slate-800">Safe Initial Checks:</span>
                    <ul className="list-disc list-inside text-slate-600 mt-1 space-y-0.5 text-[11px]">
                      {selectedIssue.aiTriage.initialChecks.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Maintenance Log Card */}
            {selectedIssue.maintenance?.notes && (
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 text-xs space-y-2">
                <span className="font-bold text-emerald-900 block">Completed Maintenance Log:</span>
                <p className="text-slate-700">{selectedIssue.maintenance.notes}</p>
                {selectedIssue.maintenance.workPerformed && (
                  <p className="text-slate-600">
                    <strong>Action:</strong> {selectedIssue.maintenance.workPerformed}
                  </p>
                )}
                <div className="pt-1 flex items-center justify-between text-slate-700 font-semibold border-t border-emerald-200">
                  <span>Total Repair Cost:</span>
                  <span>${selectedIssue.maintenance.totalCost || 0}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign Technician Modal */}
      {assignModalIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Assign Technician to {assignModalIssue.issueNumber}
            </h3>

            <form onSubmit={handleAssignTechnician} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Certified Technician
                </label>
                <select
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Technician --</option>
                  {technicians.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalIssue(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve / Maintenance Modal */}
      {(resolveModalIssue || maintenanceModalIssue) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {resolveModalIssue ? 'Complete & Resolve Maintenance' : 'Log Maintenance Work Progress'}
              </h3>
              <button
                onClick={() => {
                  setResolveModalIssue(null);
                  setMaintenanceModalIssue(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={resolveModalIssue ? handleResolveIssue : handleSaveMaintenance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Maintenance Notes * {resolveModalIssue && <span className="text-red-500 font-normal">(Required to resolve)</span>}
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Replaced damaged HDMI connector and tested 4K projection for 30 minutes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Work Performed Summary
                </label>
                <input
                  type="text"
                  placeholder="e.g. Replaced cable, re-seated HDMI wall plate"
                  value={workPerformed}
                  onChange={(e) => setWorkPerformed(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Parts Replaced Dynamic List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Parts Replaced & Cost</span>
                  <button
                    type="button"
                    onClick={addPartRow}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Part</span>
                  </button>
                </div>

                {parts.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Part Name (e.g. High-speed HDMI Cable 10m)"
                      value={p.name}
                      onChange={(e) => {
                        const updated = [...parts];
                        updated[idx].name = e.target.value;
                        setParts(updated);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Cost ($)"
                      value={p.cost}
                      onChange={(e) => {
                        const updated = [...parts];
                        updated[idx].cost = parseFloat(e.target.value) || 0;
                        setParts(updated);
                      }}
                      className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500"
                    />
                    {parts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePartRow(idx)}
                        className="p-1 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}

                <div className="text-right text-xs font-bold text-slate-700 pt-1">
                  Total Cost: $
                  {parts.reduce((acc, p) => acc + (parseFloat(p.cost) || 0) * (parseInt(p.quantity) || 1), 0).toFixed(2)}
                </div>
              </div>

              {resolveModalIssue && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Next Recommended Service Date
                  </label>
                  <input
                    type="date"
                    value={nextServiceDate}
                    onChange={(e) => setNextServiceDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setResolveModalIssue(null);
                    setMaintenanceModalIssue(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow ${
                    resolveModalIssue ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {resolveModalIssue ? 'Confirm & Resolve Issue' : 'Save Progress'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reopen Modal */}
      {reopenModalIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Reopen {reopenModalIssue.issueNumber}
            </h3>

            <form onSubmit={handleReopenIssue} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Reopening
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Issue recurred 2 hours after resolution..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReopenModalIssue(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow"
                >
                  Reopen Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
