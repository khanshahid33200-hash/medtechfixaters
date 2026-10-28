import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Printer,
  Download,
  Lock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { onboardingService, InvoiceData } from '../../services/onboardingService';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const internalOrderId = searchParams.get('internal_order_id') || searchParams.get('order_id') || '';
  const invoiceNumberParam = searchParams.get('invoice_number') || '';

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);

  // Password Setup State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvoice() {
      try {
        const inv = await onboardingService.getLatestInvoice(internalOrderId);
        if (inv) {
          setInvoice(inv);
        } else {
          // Construct fallback display invoice from params
          setInvoice({
            id: 'inv_temp',
            invoice_number: invoiceNumberParam || `MTF-INV-${new Date().getFullYear()}-001`,
            amount_paise: 50000,
            currency: 'INR',
            merchant_details: {
              legal_name: 'MedTechFixaters Healthcare Technologies Pvt Ltd',
              trade_name: 'MedTechFixaters.in',
              support_email: 'support@medtechfixaters.in',
              support_phone: '+91 98765 43210',
              website: 'https://www.medtechfixaters.in',
              address: 'Healthcare Innovation Hub, Bengaluru, India',
              hsn_sac: '998313',
            },
            customer_details: {
              name: 'Healthcare Practitioner',
              email: 'doctor@medtechfixaters.in',
              phone: '',
              clinic_name: 'Clinic Practice',
              address: '',
              city: '',
              state: '',
            },
            item_description: 'MedTechFixaters Platform Activation — First Month',
            invoice_date: new Date().toISOString(),
            invoice_status: 'paid',
          });
        }
      } catch (err) {
        console.warn('Error fetching invoice:', err);
      } finally {
        setLoading(false);
      }
    }

    loadInvoice();
  }, [internalOrderId, invoiceNumberParam]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (invoice) {
      onboardingService.generateInvoicePdf({
        ...invoice,
        orderId: internalOrderId,
      });
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      // Set password securely via Supabase Auth without storing in application tables
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPasswordSuccess(true);
    } catch (err: any) {
      setPasswordError(err.message || 'Unable to update password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF6A00] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased py-10 px-4 sm:px-6 flex flex-col justify-between print:bg-white print:p-0">
      <main className="max-w-3xl mx-auto w-full space-y-8">
        {/* ================= SUCCESS BANNER ================= */}
        <div className="bg-white border-2 border-emerald-500 rounded-3xl p-8 sm:p-10 shadow-xl shadow-emerald-500/10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 size={36} />
          </div>

          <div className="space-y-1">
            <span className="px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs">
              <Sparkles size={12} className="text-emerald-600" />
              <span>Platform Activated Successfully</span>
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight pt-2">
              Welcome to MedTechFixaters
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium max-w-md mx-auto leading-relaxed">
              Your platform fee has been verified by the server. Your clinical practice workspace and patient booking systems are fully operational.
            </p>
          </div>

          {/* Receipt Breakdown Card */}
          <div className="mt-6 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Invoice Number</span>
              <span className="font-mono font-bold text-slate-900">{invoice?.invoice_number || 'MTF-INV-2026-1001'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Internal Order ID</span>
              <span className="font-mono font-bold text-slate-900">{internalOrderId || 'MTF-ORD-2026'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Amount Paid</span>
              <span className="font-mono font-extrabold text-emerald-600 text-sm">₹500.00 INR</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">Payment Date</span>
              <span className="text-slate-700 font-medium">
                {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-slate-400 font-medium">Merchant</span>
              <span className="text-slate-700 font-medium">MedTechFixaters Healthcare Technologies Pvt Ltd</span>
            </div>
          </div>

          {/* Action Buttons: Print & Download PDF */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Printer size={15} />
              <span>Print Invoice</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#FF6A00] bg-orange-50 hover:bg-orange-100 text-[#FF6A00] text-xs font-bold inline-flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Download size={15} />
              <span>Download Invoice PDF</span>
            </button>
          </div>
        </div>

        {/* ================= OPTIONAL PASSWORD CREATION CARD ================= */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 print:hidden">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-orange-50 text-[#FF6A00] shrink-0 mt-0.5">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Create a Direct Login Password (Optional)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                You authenticated using Google. You can now also set an email password to log in directly without Google anytime.
              </p>
            </div>
          </div>

          {passwordSuccess ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>Password successfully created! You can now log in using either Google or your email and password.</span>
            </div>
          ) : (
            <form onSubmit={handleSetPassword} className="space-y-4 pt-2">
              {passwordError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle size={14} className="text-red-500" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#FF6A00]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#FF6A00]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={savingPassword || !password}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer disabled:opacity-40"
                >
                  {savingPassword ? 'Setting Password...' : 'Save Password'}
                </button>
                <span className="text-[11px] text-slate-400">
                  Or skip and proceed directly to your clinical workspace.
                </span>
              </div>
            </form>
          )}
        </div>

        {/* ================= PRIMARY CTA: GO TO DASHBOARD ================= */}
        <div className="pt-2 print:hidden">
          <button
            type="button"
            onClick={handleGoToDashboard}
            className="w-full py-4 px-6 rounded-2xl bg-[#FF6A00] hover:bg-[#E55F00] text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
          >
            <span>Open Clinical Dashboard</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </main>

      {/* Security Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 font-medium print:hidden">
        MedTechFixaters Healthcare Technologies. All clinical data protected under medical privacy protocols.
      </footer>
    </div>
  );
}
