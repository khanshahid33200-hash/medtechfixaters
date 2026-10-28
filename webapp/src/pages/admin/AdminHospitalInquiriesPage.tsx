import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Edit3,
  DollarSign,
  ShieldCheck,
  Send,
  Loader2,
  AlertCircle,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { subscriptionService } from '../../services/subscriptionService';
import { useSEO } from '../../hooks/useSEO';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';
import AmbientBackground from '../../components/motion/AmbientBackground';
import { PRIMARY_BUTTON } from '../../lib/motion';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'inquiry_submitted', label: 'Inquiry Submitted' },
  { value: 'contact_initiated', label: 'Contact Initiated' },
  { value: 'proposal_in_preparation', label: 'Proposal in Preparation' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'contract_approved', label: 'Contract Approved' },
  { value: 'awaiting_payment', label: 'Awaiting Payment' },
  { value: 'active', label: 'Active (Provisioned)' },
  { value: 'suspended', label: 'Suspended' },
];

export default function AdminHospitalInquiriesPage() {
  useSEO({
    title: 'Hospital Inquiries Management — MedTechFixaters Admin',
    description: 'Review institutional hospital inquiries, record notes, define custom pricing quotes, and approve contracts.',
  });

  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);

  // Modal State for updating inquiry
  const [newStatus, setNewStatus] = useState('');
  const [quoteRupees, setQuoteRupees] = useState('');
  const [contractStatus, setContractStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const data = await subscriptionService.listHospitalInquiriesAdmin();
      setInquiries(data);
    } catch (err: any) {
      console.warn('Failed to load inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (inq: any) => {
    setSelectedInquiry(inq);
    setNewStatus(inq.inquiry_status || 'inquiry_submitted');
    setQuoteRupees(inq.quoted_amount ? (inq.quoted_amount / 100).toString() : '');
    setContractStatus(inq.contract_status || 'pending');
    setAdminNotes(inq.admin_notes || '');
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry) return;

    setIsUpdating(true);
    try {
      const quotePaise = quoteRupees ? Math.round(parseFloat(quoteRupees) * 100) : undefined;
      await subscriptionService.adminUpdateHospitalInquiry(selectedInquiry.id, {
        status: newStatus,
        quotePaise,
        contractStatus,
        notes: adminNotes,
      });

      setNotice(`Updated inquiry for ${selectedInquiry.organizations?.organization_name || 'Hospital'}`);
      setSelectedInquiry(null);
      await fetchInquiries();
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      alert(`Error updating inquiry: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    const orgName = inq.organizations?.organization_name || '';
    const city = inq.organizations?.city || '';
    const matchSearch =
      orgName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = filterStatus === 'all' || inq.inquiry_status === filterStatus;
    return matchSearch && matchFilter;
  });

  return (
    <div className="relative min-h-[100dvh] text-[#171717] selection:bg-orange-200 selection:text-neutral-900 font-sans antialiased flex flex-col justify-between overflow-x-hidden">
      <AmbientBackground />
      <PublicHeader />

      <main className="flex-1 max-w-6xl mx-auto w-full pt-36 pb-20 px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-orange-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-100 text-[#C2410C] border border-orange-200 text-xs font-bold mb-2">
              <Building2 size={13} className="text-[#FF6A00]" />
              <span>Administrative Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight">
              Hospital Inquiries & Commercial Management
            </h1>
            <p className="text-xs text-[#6B6B6B] font-medium mt-1">
              Review institutional proposals, set custom pricing quotes, approve commercial contracts, and provision access.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchInquiries}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Refresh Inquiries</span>
          </button>
        </div>

        {notice && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 font-semibold shadow-xs">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by hospital name or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-teal-600 outline-none"
            />
          </div>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table of Inquiries */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
            <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">Loading institutional hospital records...</p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-2">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No hospital inquiries found</p>
            <p className="text-xs text-slate-400">Hospital registration submissions will appear here for commercial scoping.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-4">Hospital & Location</th>
                  <th className="px-6 py-4">Scope & Requirements</th>
                  <th className="px-6 py-4">Quoted Amount</th>
                  <th className="px-6 py-4">Stage / Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredInquiries.map((inq) => {
                  const org = inq.organizations;
                  const reqs = inq.requirements || {};
                  return (
                    <tr key={inq.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 text-sm">{org?.organization_name || 'Hospital'}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={12} className="text-slate-400" />
                          <span>{org?.city ? `${org.city}, ${org.state}` : 'City not specified'}</span>
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800">
                          {reqs.doctor_count || '10-25'} Doctors • {reqs.facility_count || '1'} Facility
                        </p>
                        <p className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                          {reqs.required_services || 'Digital OPD, Live Queue, QR Kiosk'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {inq.quoted_amount ? (
                          <span className="font-black text-teal-700 text-sm font-mono">
                            ₹{(inq.quoted_amount / 100).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Pending Quote</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          inq.inquiry_status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : inq.inquiry_status === 'contract_approved'
                            ? 'bg-teal-50 text-teal-800 border border-teal-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {inq.inquiry_status?.replace(/_/g, ' ') || 'Inquiry Submitted'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(inq)}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-xl text-xs transition inline-flex items-center gap-1.5 border border-teal-200 cursor-pointer"
                        >
                          <Edit3 size={13} />
                          <span>Manage Proposal</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal: Update Inquiry & Quote */}
        {selectedInquiry && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-teal-600">
                    Commercial Proposal Scoping
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-0.5">
                    {selectedInquiry.organizations?.organization_name || 'Hospital Practice'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedInquiry(null)}
                  className="text-slate-400 hover:text-slate-900 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveUpdate} className="space-y-4 text-xs">
                <div>
                  <label className="block font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Inquiry Stage *
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                  >
                    {STATUS_OPTIONS.filter((o) => o.value !== 'all').map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      Quoted Amount (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 25000"
                      value={quoteRupees}
                      onChange={(e) => setQuoteRupees(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                      Contract Status
                    </label>
                    <select
                      value={contractStatus}
                      onChange={(e) => setContractStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="drafted">Proposal Drafted</option>
                      <option value="sent">Proposal Sent</option>
                      <option value="signed">Contract Signed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Internal Engineering & Commercial Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Discussed with Medical Director Dr. Deshmukh. 18 doctor standees required with dedicated display board integration."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
                  />
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                  <p>
                    <strong>Provisioning Note:</strong> Marking status as <strong>Active</strong> will activate the hospital organization and grant immediate institutional access to the hospital dashboard.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedInquiry(null)}
                    className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className={`flex-1 py-3 rounded-xl ${PRIMARY_BUTTON} font-bold text-xs cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2`}
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Commercial Update</span>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
