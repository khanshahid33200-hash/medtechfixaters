import { useState } from 'react'
import {
  CheckCheck,
  Calendar,
  Layers,
  Stethoscope,
  Trash2,
  CheckCircle2
} from 'lucide-react'
import HospitalDashboardLayout from '../../components/hospitaldashboard/HospitalDashboardLayout'

interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  type: 'appointment' | 'queue' | 'doctor' | 'system'
  isRead: boolean
}

export default function HospitalNotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'appointment' | 'queue' | 'doctor'>('all')
  const [notice, setNotice] = useState<string | null>(null)

  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead
    if (filter === 'appointment') return n.type === 'appointment'
    if (filter === 'queue') return n.type === 'queue'
    if (filter === 'doctor') return n.type === 'doctor'
    return true
  })

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })))
    setNotice('✓ All notifications marked as read!')
    setTimeout(() => setNotice(null), 3000)
  }

  const deleteNotif = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  return (
    <HospitalDashboardLayout pageTitle="Notifications">
      {notice && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 size={16} />
          <span>{notice}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Controls Header */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All Alerts' },
              { id: 'unread', label: 'Unread Only' },
              { id: 'appointment', label: 'Appointments' },
              { id: 'queue', label: 'Live Queue' },
              { id: 'doctor', label: 'Doctor Alerts' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filter === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 shrink-0"
          >
            <CheckCheck size={16} />
            <span>Mark All as Read</span>
          </button>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs font-medium space-y-1">
              <p className="font-bold text-slate-700">No notifications yet</p>
              <p className="text-[11px] text-slate-400">Live queue events, appointment updates, and system alerts will appear here.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`p-5 flex items-start justify-between gap-4 transition ${
                  item.isRead ? 'bg-white hover:bg-slate-50/60' : 'bg-blue-50/30 hover:bg-blue-50/50'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                      item.type === 'appointment'
                        ? 'bg-blue-100 text-blue-600'
                        : item.type === 'queue'
                        ? 'bg-purple-100 text-purple-600'
                        : item.type === 'doctor'
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.type === 'appointment' ? <Calendar size={17} /> : item.type === 'queue' ? <Layers size={17} /> : <Stethoscope size={17} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-xs">{item.title}</h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>
                    <span className="text-[10px] text-slate-400 font-medium block mt-1.5">{item.time}</span>
                  </div>
                </div>

                <button
                  onClick={() => deleteNotif(item.id)}
                  className="p-1 text-slate-300 hover:text-rose-500 rounded-lg transition"
                  title="Dismiss"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </HospitalDashboardLayout>
  )
}
