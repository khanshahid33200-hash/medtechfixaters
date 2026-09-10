import { useState } from 'react'
import { Building2, Clock, Phone, Mail, MapPin, Save } from 'lucide-react'
import Layout from '../components/Layout'
import { Card, CardContent, CardHeader } from '../components/Card'
import Button from '../components/Button'

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'clinic' | 'hours' | 'notifications' | 'integrations'>('clinic')
  const [formData, setFormData] = useState({
    clinicName: 'ABC Medical Clinic',
    clinicEmail: 'info@abcclinic.com',
    clinicPhone: '+91-98765-43210',
    address: '123 Healthcare Street',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    zipCode: '560001',
    timezone: 'IST (India Standard Time)',
    language: 'English',
  })
  const [isSaved, setIsSaved] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setIsSaved(false)
  }

  const handleSave = () => {
    // TODO: Implement save API call
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  return (
    <Layout userRole="admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your clinic settings and preferences</p>
        </div>

        {/* Success Message */}
        {isSaved && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
            <div className="text-green-600">✓</div>
            <p className="text-green-700">Settings saved successfully!</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          {[
            { id: 'clinic' as const, label: 'Clinic', icon: Building2 },
            { id: 'hours' as const, label: 'Operating Hours', icon: Clock },
            { id: 'notifications' as const, label: 'Notifications', icon: Mail },
            { id: 'integrations' as const, label: 'Integrations', icon: Phone },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon size={18} className="inline mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Clinic Settings Tab */}
        {activeTab === 'clinic' && (
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <h2 className="text-lg font-semibold">Clinic Information</h2>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Clinic Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 size={16} className="inline mr-2" />
                  Clinic Name *
                </label>
                <input
                  type="text"
                  name="clinicName"
                  value={formData.clinicName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail size={16} className="inline mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="clinicEmail"
                    value={formData.clinicEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone size={16} className="inline mr-2" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="clinicPhone"
                    value={formData.clinicPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="inline mr-2" />
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* City, State, Country */}
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="ZIP Code"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Timezone & Language */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option>IST (India Standard Time)</option>
                    <option>EST (Eastern Standard Time)</option>
                    <option>PST (Pacific Standard Time)</option>
                    <option>GMT (Greenwich Mean Time)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option>English</option>
                    <option>Hindi</option>
                    <option>Spanish</option>
                    <option>French</option>
                  </select>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-6">
                <Button variant="primary" onClick={handleSave}>
                  <Save size={18} />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Operating Hours Tab */}
        {activeTab === 'hours' && (
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <h2 className="text-lg font-semibold">Operating Hours</h2>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => (
                <div key={day} className="flex items-center gap-4">
                  <span className="w-24 font-medium text-gray-700">{day}</span>
                  <input type="time" defaultValue="09:00" className="px-3 py-2 border border-gray-300 rounded" />
                  <span className="text-gray-500">to</span>
                  <input type="time" defaultValue="18:00" className="px-3 py-2 border border-gray-300 rounded" />
                  <label className="flex items-center ml-auto">
                    <input type="checkbox" defaultChecked={i < 5} className="w-4 h-4 rounded" />
                    <span className="ml-2 text-sm text-gray-600">Open</span>
                  </label>
                </div>
              ))}
              <Button variant="primary" onClick={handleSave} className="mt-6">
                Save Hours
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <h2 className="text-lg font-semibold">Notification Settings</h2>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-3">
                {[
                  'New appointment booking',
                  'Patient check-in',
                  'Appointment reminders',
                  'Cancellations',
                  'Admin alerts',
                ].map(item => (
                  <label key={item} className="flex items-center">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                    <span className="ml-3 text-gray-700">{item}</span>
                  </label>
                ))}
              </div>
              <Button variant="primary" onClick={handleSave} className="mt-6">
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <h2 className="text-lg font-semibold">Integrations</h2>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-4">
                {[
                  { name: 'Twilio SMS/WhatsApp', status: 'Connected' },
                  { name: 'Supabase Realtime Notifications', status: 'Connected' },
                  { name: 'Google Calendar Sync', status: 'Connected' },
                ].map(integration => (
                  <div key={integration.name} className="flex items-center justify-between p-4 border border-gray-200 rounded">
                    <span className="font-medium text-gray-900">{integration.name}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        integration.status === 'Connected'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {integration.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
