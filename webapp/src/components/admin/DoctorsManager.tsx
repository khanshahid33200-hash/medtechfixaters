import React, { useState, useEffect, useCallback } from 'react';
import {
  Stethoscope,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Gift,
  X,
  Copy,
  Info,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface DoctorProfileItem {
  id: string;
  doctor_code?: string;
  username?: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  client_type?: string;
  hospital_id?: string;
  department?: string;
  specialization?: string;
  registration_number?: string;
  onboarding_status: string;
  account_status: string;
  is_active: boolean;
  platform_fee_exempt: boolean;
  exemption_reason?: string;
  exempted_at?: string;
  exemption_expires_at?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  hospitals?: {
    id: string;
    name: string;
    city?: string;
    phone?: string;
    status?: string;
  };
  doctor_details?: {
    qualification?: string;
    room_number?: string;
    consultation_fee?: number;
    daily_patient_limit?: number;
    availability_status?: string;
  };
}

export default function DoctorsManager() {
  const [doctors, setDoctors] = useState<DoctorProfileItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [onboardingFilter, setOnboardingFilter] = useState('all');
  const [exemptOnly, setExemptOnly] = useState(false);

  // Modals
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfileItem | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<'active' | 'suspended' | 'banned' | 'deleted'>('suspended');
  const [statusReason, setStatusReason] = useState('');

  const [showExemptModal, setShowExemptModal] = useState(false);
  const [exemptionReason, setExemptionReason] = useState('');

  const [showCreateExemptModal, setShowCreateExemptModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    specialization: 'General Physician',
    registration_number: '',
    clinic_name: '',
    account_status: 'active',
    exemption_reason: 'Hospital Network Partnership / VIP Platform Exemption',
    exemption_expires_at: '',
    admin_notes: '',
  });

  const [createdResult, setCreatedResult] = useState<any>(null);

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  };

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        status: statusFilter,
        onboarding_status: onboardingFilter,
        exempt_only: String(exemptOnly),
        search,
      });

      const res = await fetch(`/api/admin/doctors?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        let errMsg = res.statusText;
        try {
          const errBody = await res.json();
          if (errBody?.error) errMsg = errBody.error;
        } catch {}
        throw new Error(`Failed to load doctors: ${errMsg}`);
      }
      const data = await res.json();
      if (data.success) {
        setDoctors(data.doctors || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        throw new Error(data.error || 'Failed to retrieve doctors directory');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching doctor records');
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, onboardingFilter, exemptOnly, search]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Action: Update Account Status
  const handleUpdateStatus = async () => {
    if (!selectedDoctor || !statusReason.trim()) return;
    setActionLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/admin/doctors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'set_status',
          doctor_id: selectedDoctor.id,
          account_status: newStatus,
          reason: statusReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotice(`Doctor status updated to ${newStatus}.`);
        setShowStatusModal(false);
        setStatusReason('');
        fetchDoctors();
      } else {
        throw new Error(data.error || 'Status update failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Grant Fee Exemption
  const handleGrantExemption = async () => {
    if (!selectedDoctor || !exemptionReason.trim()) return;
    setActionLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/admin/doctors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'grant_exemption',
          doctor_id: selectedDoctor.id,
          exemption_reason: exemptionReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotice(`Platform fee exemption granted and account activated!`);
        setShowExemptModal(false);
        setExemptionReason('');
        fetchDoctors();
      } else {
        throw new Error(data.error || 'Failed to grant exemption');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Send Password Reset Link
  const handleSendPasswordReset = async (doc: DoctorProfileItem) => {
    setActionLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/admin/doctors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'send_password_reset',
          email: doc.email,
          doctor_id: doc.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.action_link) {
          navigator.clipboard.writeText(data.action_link);
          setNotice(`Password setup link generated and copied to clipboard for ${doc.email}!`);
        } else {
          setNotice(`Password reset instructions sent to ${doc.email}.`);
        }
      } else {
        throw new Error(data.error || 'Failed to send password reset');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Create Admin-Exempted Doctor (Section 5)
  const handleCreateExemptDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/admin/doctors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'create_exempt_doctor',
          ...createForm,
          fee_exempt: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCreatedResult(data);
        setNotice(`✅ Doctor profile created with platform fee exemption!`);
        fetchDoctors();
      } else {
        throw new Error(data.error || 'Failed to create doctor profile');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {notice && (
        <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-200 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Stethoscope size={22} className="text-indigo-600" />
            <span>Doctor Management & Fee Exemptions</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Search doctor directories, manage account statuses, issue password resets, and grant platform fee exemptions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchDoctors()}
            disabled={loading || actionLoading}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => { setShowCreateExemptModal(true); setCreatedResult(null); }}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Gift size={14} />
            <span>+ Create Exempt Doctor</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by Doctor Name, Code, Email, Specialization..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Account Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="all">All Account Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
              <option value="deleted">Soft Deleted</option>
            </select>
          </div>

          {/* Onboarding Status Filter */}
          <div>
            <select
              value={onboardingFilter}
              onChange={e => { setOnboardingFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="all">All Onboarding Stages</option>
              <option value="ACTIVE">Active (Onboarded)</option>
              <option value="PAYMENT_PENDING">Pending Platform Fee</option>
              <option value="PROFILE_INCOMPLETE">Profile Incomplete</option>
            </select>
          </div>

          {/* Fee Exempt Checkbox */}
          <div className="flex items-center px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={exemptOnly}
                onChange={e => { setExemptOnly(e.target.checked); setPage(1); }}
                className="rounded text-indigo-600 focus:ring-0"
              />
              <span>Fee Exempt Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw size={28} className="animate-spin text-indigo-600 mx-auto" />
            <p className="text-xs font-bold text-slate-600">Loading doctor profiles...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Stethoscope size={36} className="text-slate-300 mx-auto" />
            <h3 className="text-sm font-black text-slate-700">No Doctor Records Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No doctors match your filter criteria. You can register a doctor with fee exemption directly using the button above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Doctor & Code</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Specialization & Practice</th>
                  <th className="py-3 px-4">Platform Fee Status</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{doc.full_name || 'Dr. Practitioner'}</div>
                      <span className="text-[10px] font-mono font-bold text-indigo-600 block">
                        {doc.doctor_code || `DOC-${doc.id.slice(0, 6).toUpperCase()}`}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 font-medium">{doc.email}</div>
                      {doc.phone && <div className="text-[11px] text-slate-400">{doc.phone}</div>}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{doc.specialization || 'General Physician'}</div>
                      <div className="text-[11px] text-slate-500">
                        {doc.hospitals?.name || 'Independent Clinic'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {doc.platform_fee_exempt ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-50 text-purple-700 border border-purple-200">
                            <Gift size={11} />
                            <span>Fee Exempt</span>
                          </span>
                          {doc.exemption_reason && (
                            <span className="text-[10px] text-slate-400 block truncate max-w-[140px]" title={doc.exemption_reason}>
                              {doc.exemption_reason}
                            </span>
                          )}
                        </div>
                      ) : doc.onboarding_status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={11} />
                          <span>Paid & Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                          <span>Fee Pending</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        doc.account_status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : doc.account_status === 'banned'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : doc.account_status === 'deleted'
                          ? 'bg-slate-100 text-slate-500 border border-slate-300'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {doc.account_status || 'active'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(doc.created_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Status Change (Suspend / Ban / Unban) */}
                        <button
                          onClick={() => { setSelectedDoctor(doc); setShowStatusModal(true); setNewStatus(doc.is_active ? 'suspended' : 'active'); }}
                          title="Change Account Status (Suspend, Ban, Unban, Soft Delete)"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                        >
                          <ShieldAlert size={13} />
                        </button>

                        {/* Password Reset Trigger */}
                        <button
                          onClick={() => handleSendPasswordReset(doc)}
                          disabled={actionLoading}
                          title="Generate Password Setup / Reset Link"
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition cursor-pointer"
                        >
                          <KeyRound size={13} />
                        </button>

                        {/* Grant Exemption (if not already exempt) */}
                        {!doc.platform_fee_exempt && (
                          <button
                            onClick={() => { setSelectedDoctor(doc); setShowExemptModal(true); }}
                            title="Grant Platform Fee Exemption"
                            className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition cursor-pointer"
                          >
                            <Gift size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{doctors.length}</span> of <span className="font-bold text-slate-800">{total}</span> total doctors
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 py-1 font-bold text-slate-700">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── STATUS CHANGE MODAL (SUSPEND / BAN / SOFT DELETE) ─── */}
      {showStatusModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Manage Account Access</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Updating access for <span className="font-bold text-slate-800">{selectedDoctor.full_name}</span> ({selectedDoctor.email}).
            </p>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700 block">Target Account Status *</label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              >
                <option value="active">Active (Full Consultation Access)</option>
                <option value="suspended">Suspended (Temporarily Disabled)</option>
                <option value="banned">Banned (Compliance / Fraud Flag)</option>
                <option value="deleted">Soft Deleted (Archived Profile)</option>
              </select>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700 block">Mandatory Compliance Reason *</label>
              <textarea
                rows={3}
                required
                value={statusReason}
                onChange={e => setStatusReason(e.target.value)}
                placeholder="Enter audit reason for this status change (min 5 characters)..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={actionLoading || statusReason.trim().length < 5}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow disabled:opacity-50"
              >
                Apply Status Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── GRANT EXEMPTION MODAL ──────────────────────────── */}
      {showExemptModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Gift size={20} className="text-purple-600" />
                <h3 className="text-base font-black text-slate-900">Grant Platform Fee Exemption</h3>
              </div>
              <button onClick={() => setShowExemptModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Exempting <span className="font-bold text-slate-800">{selectedDoctor.full_name}</span> allows full platform activation without collecting the introductory platform fee. No fabricated payment records will be created.
            </p>

            <div className="space-y-1 text-xs">
              <label className="font-bold text-slate-700 block">Exemption Reason *</label>
              <input
                type="text"
                required
                value={exemptionReason}
                onChange={e => setExemptionReason(e.target.value)}
                placeholder="e.g. VIP Clinical Partner / Government OPD Pilot"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowExemptModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleGrantExemption}
                disabled={actionLoading || !exemptionReason.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow disabled:opacity-50"
              >
                Grant Exemption & Activate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CREATE EXEMPT DOCTOR MODAL (SECTION 5) ───────────── */}
      {showCreateExemptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Gift size={20} className="text-purple-600" />
                <h3 className="text-base font-black text-slate-900">Create Fee-Exempt Doctor Account</h3>
              </div>
              <button onClick={() => setShowCreateExemptModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            {createdResult ? (
              <div className="p-5 bg-purple-50 border border-purple-200 rounded-2xl space-y-3 text-xs">
                <div className="flex items-center gap-2 text-purple-900 font-bold">
                  <CheckCircle2 size={18} className="text-purple-600" />
                  <span>Doctor Account Created Successfully!</span>
                </div>
                <p className="text-purple-800">
                  Account is immediately active with fee exemption recorded in the audit log.
                </p>

                {createdResult.setup_link && (
                  <div className="p-3 bg-white rounded-xl border border-purple-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">One-Time Setup Link:</span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] truncate text-slate-700">{createdResult.setup_link}</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(createdResult.setup_link); setNotice('Link copied!'); }}
                        className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold rounded text-[11px]"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => { setShowCreateExemptModal(false); setCreatedResult(null); }}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateExemptDoctor} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Doctor Full Name *</label>
                    <input
                      type="text"
                      required
                      value={createForm.full_name}
                      onChange={e => setCreateForm(p => ({ ...p, full_name: e.target.value }))}
                      placeholder="Dr. Rajesh Sharma"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={createForm.email}
                      onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="doctor@hospital.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Phone Number</label>
                    <input
                      type="text"
                      value={createForm.phone}
                      onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+91 9876543210"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Specialization</label>
                    <input
                      type="text"
                      value={createForm.specialization}
                      onChange={e => setCreateForm(p => ({ ...p, specialization: e.target.value }))}
                      placeholder="Cardiologist, General Physician..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Clinic / Hospital Practice Name</label>
                    <input
                      type="text"
                      value={createForm.clinic_name}
                      onChange={e => setCreateForm(p => ({ ...p, clinic_name: e.target.value }))}
                      placeholder="Apex Heart & Specialty Clinic"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Medical Registration Info</label>
                    <input
                      type="text"
                      value={createForm.registration_number}
                      onChange={e => setCreateForm(p => ({ ...p, registration_number: e.target.value }))}
                      placeholder="MCI-2024-XXXXX"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Exemption Reason (Recorded in Audit Log) *</label>
                  <input
                    type="text"
                    required
                    value={createForm.exemption_reason}
                    onChange={e => setCreateForm(p => ({ ...p, exemption_reason: e.target.value }))}
                    placeholder="Institutional agreement, pilot launch, or executive waiver"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Internal Admin Notes</label>
                  <textarea
                    rows={2}
                    value={createForm.admin_notes}
                    onChange={e => setCreateForm(p => ({ ...p, admin_notes: e.target.value }))}
                    placeholder="Confidential administrative remarks..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 flex items-start gap-2 text-purple-900 text-[11px]">
                  <Info size={15} className="text-purple-600 shrink-0 mt-0.5" />
                  <span>
                    The doctor will be provisioned with an invitation/setup link. No password will be stored in plain text, and no false financial entries will be made in payment records.
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateExemptModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow disabled:opacity-50"
                  >
                    {actionLoading ? 'Creating Profile…' : 'Create Exempt Profile'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
