import { useState, useEffect } from 'react'
import { Search, RotateCcw } from 'lucide-react'
import Layout from '../components/Layout'
import Button from '../components/Button'

interface PaymentRecord {
  id: string
  appointment_id: string
  amount_in_rupees: number
  doctor_name: string
  patient_name: string
  patient_phone: string
  gateway_provider: string
  gateway_transaction_id: string
  status: 'paid' | 'pending' | 'refunded'
  payment_method: string
  refund_transaction_id?: string
  refund_reason?: string
  timestamp: string
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Refund Modal State
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null)
  const [refundReason, setRefundReason] = useState('')
  const [isRefunding, setIsRefunding] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = () => {
    const saved = JSON.parse(localStorage.getItem('clinicos_payments') || '[]')
    if (saved.length > 0) {
      setPayments(saved)
    } else {
      const mockList: PaymentRecord[] = [
        {
          id: 'pay_rzp_99210041',
          appointment_id: 'appt-2026082301',
          amount_in_rupees: 800,
          doctor_name: 'Dr. Ashok Verma',
          patient_name: 'Ramesh Chandra Sharma',
          patient_phone: '9876543210',
          gateway_provider: 'cashfree',
          gateway_transaction_id: 'txn_cf_8872199',
          status: 'paid',
          payment_method: 'UPI / GPay',
          timestamp: '23 Aug 2026, 10:14 AM'
        },
        {
          id: 'pay_cf_99210042',
          appointment_id: 'appt-2026082302',
          amount_in_rupees: 500,
          doctor_name: 'Dr. Sunita Rao',
          patient_name: 'Ananya Roy',
          patient_phone: '9876543211',
          gateway_provider: 'cashfree',
          gateway_transaction_id: 'txn_cf_8872200',
          status: 'paid',
          payment_method: 'Debit Card',
          timestamp: '23 Aug 2026, 10:28 AM'
        },
        {
          id: 'pay_cf_99210043',
          appointment_id: 'appt-2026082303',
          amount_in_rupees: 600,
          doctor_name: 'Dr. Rajiv Menon',
          patient_name: 'Vikramjit Singh',
          patient_phone: '9876543212',
          gateway_provider: 'cashfree',
          gateway_transaction_id: 'txn_cf_8872201',
          status: 'refunded',
          payment_method: 'UPI / PhonePe',
          refund_transaction_id: 'rfnd_cf_331002',
          refund_reason: 'Doctor called away for emergency surgery',
          timestamp: '23 Aug 2026, 11:05 AM'
        }
      ]
      setPayments(mockList)
      localStorage.setItem('clinicos_payments', JSON.stringify(mockList))
    }
  }

  const handleIssueRefund = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPayment || !refundReason) return

    setIsRefunding(true)

    setTimeout(() => {
      const refundTxnId = `rfnd_rzp_${Math.random().toString(36).substring(2, 8)}`

      const updated = payments.map((p) =>
        p.id === selectedPayment.id
          ? {
              ...p,
              status: 'refunded' as const,
              refund_transaction_id: refundTxnId,
              refund_reason: refundReason
            }
          : p
      )

      setPayments(updated)
      localStorage.setItem('clinicos_payments', JSON.stringify(updated))

      setIsRefunding(false)
      setSelectedPayment(null)
      setRefundReason('')
      setNotice(`Refund of ₹${selectedPayment.amount_in_rupees} processed successfully (Ref: ${refundTxnId}).`)
      setTimeout(() => setNotice(null), 4000)
    }, 1200)
  }

  // Dashboard Aggregates (Section 4.3)
  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount_in_rupees, 0)
  const paidCount = payments.filter((p) => p.status === 'paid').length
  const refundedCount = payments.filter((p) => p.status === 'refunded').length

  const filteredPayments = payments.filter((p) => {
    const matchSearch =
      p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.gateway_transaction_id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-recoleta text-slate-900">Hospital Payment & Refund Console</h1>
            <p className="text-xs text-slate-500">Track Cashfree consultation fee collections, transaction histories, and refunds</p>
          </div>
        </div>

        {notice && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between">
            <span>✓ {notice}</span>
            <button onClick={() => setNotice(null)} className="text-emerald-800 hover:text-slate-900">✕</button>
          </div>
        )}

        {/* Dashboard Aggregates (Specification 4.3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-3xl p-6 shadow-xl space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Total Collections Today</p>
            <p className="text-4xl font-black font-mono">₹{totalPaid.toLocaleString()}</p>
            <p className="text-xs text-emerald-100">{paidCount} successful paid appointments</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Transactions</p>
            <p className="text-4xl font-black text-slate-900 font-mono">{payments.length}</p>
            <p className="text-xs text-slate-500">Processed via Cashfree SDK</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Refunded Appointments</p>
            <p className="text-4xl font-black text-amber-600 font-mono">{refundedCount}</p>
            <p className="text-xs text-slate-500">Reversed to patient bank account</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by Patient, Doctor, or Transaction Ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Payments Table (Specification 4.2) */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Transaction & Gateway ID</th>
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Assigned Doctor</th>
                <th className="px-6 py-4">Fee Charged</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredPayments.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900 font-mono">{pay.gateway_transaction_id}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{pay.id} • {pay.payment_method}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{pay.patient_name}</p>
                    <p className="text-[11px] text-slate-500">+91-{pay.patient_phone}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-blue-600">
                    {pay.doctor_name}
                  </td>
                  <td className="px-6 py-4 font-black text-slate-900 text-sm font-mono">
                    ₹{pay.amount_in_rupees}
                  </td>
                  <td className="px-6 py-4">
                    {pay.status === 'paid' ? (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full border border-emerald-200">
                        ✓ Paid
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-full border border-amber-200">
                        ↩ Refunded
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {pay.status === 'paid' && (
                      <button
                        onClick={() => setSelectedPayment(pay)}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl text-[11px] transition flex items-center justify-end gap-1 ml-auto border border-amber-200"
                      >
                        <RotateCcw size={13} /> Refund ₹{pay.amount_in_rupees}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Refund Modal (Specification 4.2) */}
        {selectedPayment && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold font-recoleta text-slate-900 flex items-center gap-2">
                  <RotateCcw className="text-amber-600" size={20} /> Issue Cashfree Refund
                </h3>
                <button onClick={() => setSelectedPayment(null)} className="text-slate-400 hover:text-slate-900">✕</button>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900 space-y-1">
                <p>Refunding <strong>₹{selectedPayment.amount_in_rupees}</strong> to <strong>{selectedPayment.patient_name}</strong> (+91-{selectedPayment.patient_phone}).</p>
                <p className="text-[11px] text-amber-700">Money will return to patient's card/UPI account in 3–5 business days.</p>
              </div>

              <form onSubmit={handleIssueRefund} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">Reason for Refund *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Doctor called away for emergency surgery"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-600 outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="secondary" onClick={() => setSelectedPayment(null)} className="flex-1 text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isRefunding} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs">
                    {isRefunding ? 'Processing Refund...' : `Confirm Refund ₹${selectedPayment.amount_in_rupees}`}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
