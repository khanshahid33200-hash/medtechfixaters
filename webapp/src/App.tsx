import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import apiClient from './api/client'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import LandingPage from './pages/LandingPage'
import ProductPage from './pages/ProductPage'
import AboutUsPage from './pages/AboutUsPage'
import FeaturesPage from './pages/FeaturesPage'
import UpcomingFeaturesPage from './pages/UpcomingFeaturesPage'
import HowItWorksPage from './pages/HowItWorksPage'
import ArchitecturePage from './pages/ArchitecturePage'
import PricingPage from './pages/PricingPage'
import ContactPage from './pages/ContactPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsPage from './pages/TermsPage'
import RefundPolicyPage from './pages/RefundPolicyPage'
import ThankYouPage from './pages/ThankYouPage'
import NotFoundPage from './pages/NotFoundPage'

// Self-Service & Sign In
import AppointmentBookingPage from './pages/AppointmentBookingPage'
import IntakePage from './pages/IntakePage'
import TrackPage from './pages/TrackPage'
import RxPage from './pages/RxPage'
import DisplayBoard from './pages/DisplayBoard'
import PaymentsPage from './pages/PaymentsPage'
import Login from './pages/Login'
import AccountBlockedPage from './pages/AccountBlockedPage'
import Dashboard from './pages/Dashboard'
import Appointments from './pages/Appointments'
import Checkin from './pages/Checkin'
import Queue from './pages/Queue'
import Reports from './pages/Reports'
import QRKiosk from './pages/QRKiosk'
import History from './pages/History'
import DoctorProfile from './pages/DoctorProfile'
import OwnerAdmin from './pages/OwnerAdmin'
// (Legacy Hospital Admin system deleted & merged into Hospital Dashboard system)

// Medtech Fixaters Hospital Dashboard Pages (design.md)
import HospitalDashboardHome from './pages/hospitaldashboard/HospitalDashboardHome'
import HospitalAppointmentsPage from './pages/hospitaldashboard/HospitalAppointmentsPage'
import HospitalLiveQueuePage from './pages/hospitaldashboard/HospitalLiveQueuePage'
import HospitalPatientsPage from './pages/hospitaldashboard/HospitalPatientsPage'
import HospitalDoctorsPage from './pages/hospitaldashboard/HospitalDoctorsPage'
import HospitalDepartmentsPage from './pages/hospitaldashboard/HospitalDepartmentsPage'
import HospitalReportsPage from './pages/hospitaldashboard/HospitalReportsPage'
import HospitalAnalyticsPage from './pages/hospitaldashboard/HospitalAnalyticsPage'
import HospitalNotificationsPage from './pages/hospitaldashboard/HospitalNotificationsPage'
import HospitalSettingsPage from './pages/hospitaldashboard/HospitalSettingsPage'
import HospitalUsersRolesPage from './pages/hospitaldashboard/HospitalUsersRolesPage'
import HospitalQRManagementPage from './pages/hospitaldashboard/HospitalQRManagementPage'
import HospitalChatPage from './pages/hospitaldashboard/HospitalChatPage'
import HospitalLogsPage from './pages/hospitaldashboard/HospitalLogsPage'

// Components
import CookieBanner from './components/CookieBanner'
import ScrollToTop from './components/ScrollToTop'
import StickyChatbot from './components/StickyChatbot'

function App() {
  useEffect(() => {
    // Only set a clinic id on the legacy API client once a real login has
    // populated it — no shared fallback id, which used to pool every
    // logged-out/broken session onto one hospital's data.
    const hospitalId = localStorage.getItem('hospital_id')
    if (hospitalId) apiClient.setClinicId(hospitalId)

    apiClient.healthCheck().catch(() => {
      console.warn('Backend server running locally')
    })
  }, [])

  return (
    <AuthProvider>
      <ScrollToTop />
      <Routes>
        {/* Public Marketing & Legal Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/product" element={<Navigate to="/" replace />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/features/product" element={<FeaturesPage />} />
        <Route path="/features/upcoming" element={<UpcomingFeaturesPage />} />
        <Route path="/upcoming-features" element={<UpcomingFeaturesPage />} />
        <Route path="/architecture" element={<ArchitecturePage />} />
        <Route path="/platform" element={<ArchitecturePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutUsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/book-demo" element={<ContactPage />} />
        <Route path="/demo" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/thank-you" element={<ThankYouPage />} />

        {/* Public Patient Self-Service Workflows & AI/Manual QR Appointment Booking */}
        <Route path="/appointment/:hospitalId" element={<AppointmentBookingPage />} />
        <Route path="/a/:token" element={<AppointmentBookingPage />} />
        <Route path="/book/:token" element={<AppointmentBookingPage />} />
        <Route path="/intake/:token" element={<IntakePage />} />
        <Route path="/track" element={<TrackPage />} />
        <Route path="/rx" element={<RxPage />} />
        <Route path="/display/:token" element={<DisplayBoard />} />
        <Route
          path="/checkin"
          element={
            <ProtectedRoute>
              <Checkin />
            </ProtectedRoute>
          }
        />

        {/* Sign In Portals & Access Control */}
        <Route path="/account-blocked" element={<AccountBlockedPage />} />
        <Route path="/doctor" element={<Login />} />
        <Route path="/doctor/login" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* Dedicated single-role login portals — each locks the role
            toggle and rejects a correctly-authenticated account whose
            real role doesn't match this portal (see Login.tsx lockedRole
            and AuthContext's loginWithSupabase wrong-portal check). */}
        <Route path="/login/doctordashboard" element={<Login lockedRole="doctor" />} />
        <Route path="/login/hospitaladministration" element={<Login lockedRole="hospital_admin" />} />
        <Route path="/login/platformadmin" element={<Navigate to="/mrshahidbabu" replace />} />
        <Route path="/hospitaladminmedtech" element={<Navigate to="/hospitaldashboard/dashboard" replace />} />
        <Route path="/login/hospitaladminmedtech" element={<Navigate to="/login/hospitaladministration" replace />} />
        <Route path="/login/hospitaladmin009" element={<Navigate to="/login/hospitaladministration" replace />} />
        <Route path="/hospitaladmin009" element={<Navigate to="/hospitaldashboard/dashboard" replace />} />
        <Route path="/hospitaladmin" element={<Navigate to="/hospitaldashboard/dashboard" replace />} />

        {/* Secret Platform Owner Control Portal */}
        <Route path="/mrshahidbabu" element={<OwnerAdmin />} />
        <Route path="/MRSHAHIDBABU" element={<OwnerAdmin />} />

        {/* Medtech Fixaters Unified Hospital Administration Dashboard System */}
        <Route path="/hospitaldashboard" element={<ProtectedRoute requiredRole="hospital_admin"><HospitalDashboardHome /></ProtectedRoute>} />
        <Route path="/hospitaldashboard/dashboard" element={<ProtectedRoute requiredRole="hospital_admin"><HospitalDashboardHome /></ProtectedRoute>} />
        <Route path="/hospitaldashboard/appointments" element={<ProtectedRoute requiredRole="hospital_admin"><HospitalAppointmentsPage /></ProtectedRoute>} />
        <Route path="/hospitaldashboard/live-queue" element={<ProtectedRoute requiredRole="hospital_admin"><HospitalLiveQueuePage /></ProtectedRoute>} />
        <Route path="/hospitaldashboard/patients" element={<ProtectedRoute requiredRole="hospital_admin"><HospitalPatientsPage /></ProtectedRoute>} />
        <Route path="/hospitaldashboard/doctors" element={<ProtectedRoute requiredRole="hospital_admin"><HospitalDoctorsPage /></ProtectedRoute>} />
        <Route path="/hospitaldashboard/departments" element={<ProtectedRoute requiredRole="hospital_admin"><HospitalDepartmentsPage /></ProtectedRoute>} />
        <Route path="/hospitaldashboard/reports" element={<ProtectedRoute requiredRole="hospital_admin"><HospitalReportsPage /></ProtectedRoute>} />
        <Route path="/hospitaldashboard/analytics" element={<ProtectedRoute requiredRole="hospital_admin"><HospitalAnalyticsPage /></ProtectedRoute>} />
        <Route path="/hospitaldashboard/notifications" element={<ProtectedRoute requiredRole="hospital_admin"><HospitalNotificationsPage /></ProtectedRoute>} />
        <Route path="/hospitaldashboard/settings" element={<ProtectedRoute requiredRole="hospital_admin"><HospitalSettingsPage /></ProtectedRoute>} />
        <Route path="/hospitaldashboard/settings/hospital-profile" element={<ProtectedRoute requiredRole="hospital_admin"><HospitalSettingsPage /></ProtectedRoute>} />
        <Route path="/hospitaldashboard/users-roles" element={<ProtectedRoute requiredRole="hospital_admin"><HospitalUsersRolesPage /></ProtectedRoute>} />
        <Route path="/hospitaldashboard/qr" element={<ProtectedRoute requiredRole="hospital_admin"><HospitalQRManagementPage /></ProtectedRoute>} />
        <Route path="/hospitaldashboard/chat" element={<ProtectedRoute requiredRole="hospital_admin"><HospitalChatPage /></ProtectedRoute>} />
        <Route path="/hospitaldashboard/logs" element={<ProtectedRoute requiredRole="hospital_admin"><HospitalLogsPage /></ProtectedRoute>} />

        {/* Redirect Legacy Hospital Admin Routes to Hospital Dashboard */}
        <Route path="/hospitaladmin-dashboard" element={<Navigate to="/hospitaldashboard/dashboard" replace />} />
        <Route path="/hospitaladmin/overview" element={<Navigate to="/hospitaldashboard/dashboard" replace />} />
        <Route path="/hospitaladmin/queues" element={<Navigate to="/hospitaldashboard/live-queue" replace />} />
        <Route path="/hospitaladmin/doctors" element={<Navigate to="/hospitaldashboard/doctors" replace />} />
        <Route path="/hospitaladmin/messages" element={<Navigate to="/hospitaldashboard/notifications" replace />} />
        <Route path="/hospitaladmin/qr" element={<Navigate to="/hospitaldashboard/qr" replace />} />
        <Route path="/hospitaladmin/*" element={<Navigate to="/hospitaldashboard/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="doctor">
              <Dashboard initialTab="dashboard" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/queue"
          element={
            <ProtectedRoute requiredRole="doctor">
              <Dashboard initialTab="queue" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <ProtectedRoute requiredRole="doctor">
              <Dashboard initialTab="appointments" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients"
          element={
            <ProtectedRoute requiredRole="doctor">
              <Dashboard initialTab="patients" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/consultations"
          element={
            <ProtectedRoute requiredRole="doctor">
              <Dashboard initialTab="consultations" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prescriptions"
          element={
            <ProtectedRoute requiredRole="doctor">
              <Dashboard initialTab="prescriptions" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates"
          element={
            <ProtectedRoute requiredRole="doctor">
              <Dashboard initialTab="templates" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/follow-ups"
          element={
            <ProtectedRoute requiredRole="doctor">
              <Dashboard initialTab="follow-ups" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute requiredRole="doctor">
              <Dashboard initialTab="reports" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute requiredRole="doctor">
              <Dashboard initialTab="profile" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute requiredRole="doctor">
              <Dashboard initialTab="settings" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute requiredRole="doctor">
              <Dashboard initialTab="reports" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute requiredRole="doctor">
              <Dashboard initialTab="patients" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/qr-kiosk"
          element={
            <ProtectedRoute requiredRole="doctor">
              <Dashboard initialTab="qr-kiosk" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute requiredRole="doctor">
              <Dashboard initialTab="notifications" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/availability"
          element={
            <ProtectedRoute requiredRole="doctor">
              <Dashboard initialTab="availability" />
            </ProtectedRoute>
          }
        />

        {/* Custom 404 Catch-All Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Global Sticky AI Chatbot */}
      <StickyChatbot />

      {/* Global Cookie Consent Banner */}
      <CookieBanner />
    </AuthProvider>
  )
}

export default App
