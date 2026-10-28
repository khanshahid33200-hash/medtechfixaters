import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import apiClient from './api/client'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import LandingPage from './pages/LandingPage'
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
import Login from './pages/Login'
import AccountBlockedPage from './pages/AccountBlockedPage'
import Dashboard from './pages/Dashboard'
import Checkin from './pages/Checkin'
import OwnerAdmin from './pages/OwnerAdmin'
import DoctorSignupPage from './pages/DoctorSignupPage'
import DoctorOnboardingPage from './pages/DoctorOnboardingPage'
import MedicinesPage from './pages/MedicinesPage'

// Standalone Onboarding & Payments System
import AuthCallbackPage from './pages/auth/AuthCallbackPage'
import OnboardingRoot from './pages/onboarding/OnboardingRoot'
import Step1BasicDetails from './pages/onboarding/Step1BasicDetails'
import Step2OrganizationDetails from './pages/onboarding/Step2OrganizationDetails'
import Step3Availability from './pages/onboarding/Step3Availability'
import Step4ConsultationFees from './pages/onboarding/Step4ConsultationFees'
import Step5Review from './pages/onboarding/Step5Review'
import Step6Payment from './pages/onboarding/Step6Payment'
import PaymentSuccessPage from './pages/onboarding/PaymentSuccessPage'
import PaymentPendingOrFailedPage from './pages/onboarding/PaymentPendingOrFailedPage'
import SubscriptionDetailsPage from './pages/subscription/SubscriptionDetailsPage'
import SubscriptionExpiredPage from './pages/subscription/SubscriptionExpiredPage'
import HospitalInquiryStatusPage from './pages/hospital/HospitalInquiryStatusPage'
import AdminHospitalInquiriesPage from './pages/admin/AdminHospitalInquiriesPage'

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
import HospitalCrmPage from './pages/hospitaldashboard/HospitalCrmPage'

// Components
import CookieBanner from './components/CookieBanner'
import ScrollToTop from './components/ScrollToTop'
import RouteFade from './components/motion/RouteFade'
import StickyChatbot from './components/StickyChatbot'

function App() {
  useEffect(() => {
    // Only set a clinic id on the legacy API client once a real login has
    // populated it — no shared fallback id, which used to pool every
    // logged-out/broken session onto one hospital's data.
    const hospitalId = localStorage.getItem('hospital_id')
    if (hospitalId) apiClient.setClinicId(hospitalId)
  }, [])

  return (
    <AuthProvider>
      <ScrollToTop />
      <RouteFade>
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
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/terms-and-conditions" element={<TermsPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/refund-and-cancellation" element={<RefundPolicyPage />} />
        <Route path="/thank-you" element={<ThankYouPage />} />

        {/* Public Patient Self-Service Workflows & AI/Manual QR Appointment Booking */}
        <Route path="/appointment/:hospitalId" element={<AppointmentBookingPage />} />
        <Route path="/a/:token" element={<AppointmentBookingPage />} />
        <Route path="/book/:token" element={<AppointmentBookingPage />} />
        <Route path="/intake/:token" element={<IntakePage />} />
        <Route path="/track" element={<TrackPage />} />
        <Route path="/track/:trackingToken" element={<TrackPage />} />
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

        {/* Single Unified Login & Sign Up Screen */}
        <Route path="/login" element={<Login />} />

        {/* Redirect all other/legacy login and signup routes directly to /login */}
        <Route path="/signup" element={<Navigate to="/login?tab=signup" replace />} />
        <Route path="/signup/*" element={<Navigate to="/login?tab=signup" replace />} />
        <Route path="/register" element={<Navigate to="/login?tab=signup" replace />} />
        <Route path="/signup/doctor" element={<Navigate to="/login?tab=signup" replace />} />
        <Route path="/doctor/signup" element={<Navigate to="/login?tab=signup" replace />} />
        <Route path="/doctor/login" element={<Navigate to="/login" replace />} />
        <Route path="/doctor" element={<Navigate to="/login" replace />} />
        <Route path="/doctor/onboarding" element={<Navigate to="/onboarding" replace />} />
        <Route path="/login/*" element={<Navigate to="/login" replace />} />
        <Route path="/hospitaladminmedtech" element={<Navigate to="/hospitaldashboard/dashboard" replace />} />
        <Route path="/hospitaladmin009" element={<Navigate to="/hospitaldashboard/dashboard" replace />} />
        <Route path="/hospitaladmin" element={<Navigate to="/hospitaldashboard/dashboard" replace />} />

        {/* Auth Callback for Google OAuth */}
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Standalone Onboarding System (Dedicated layout, no website chrome) */}
        <Route path="/onboarding" element={<OnboardingRoot />} />
        <Route path="/onboarding/basic-details" element={<Step1BasicDetails />} />
        <Route path="/onboarding/organization" element={<Step2OrganizationDetails />} />
        <Route path="/onboarding/availability" element={<Step3Availability />} />
        <Route path="/onboarding/consultation-fees" element={<Step4ConsultationFees />} />
        <Route path="/onboarding/review" element={<Step5Review />} />
        <Route path="/onboarding/payment" element={<Step6Payment />} />
        <Route path="/onboarding/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/onboarding/payment/failed" element={<PaymentPendingOrFailedPage />} />
        <Route path="/onboarding/payment/pending" element={<PaymentPendingOrFailedPage />} />

        {/* Seamless backwards compatibility for legacy checkout / onboarding routes */}
        <Route path="/onboarding/category" element={<Navigate to="/onboarding/basic-details" replace />} />
        <Route path="/onboarding/profile" element={<Navigate to="/onboarding/organization" replace />} />
        <Route path="/checkout/intro" element={<Navigate to="/onboarding/payment" replace />} />
        <Route path="/checkout/pending" element={<Navigate to="/onboarding/payment/pending" replace />} />
        <Route path="/checkout/verify" element={<Navigate to="/onboarding/payment/pending" replace />} />
        <Route path="/checkout/status" element={<Navigate to="/onboarding/payment/pending" replace />} />

        <Route path="/subscription" element={<SubscriptionDetailsPage />} />
        <Route path="/subscription/renew" element={<SubscriptionDetailsPage />} />
        <Route path="/subscription/expired" element={<SubscriptionExpiredPage />} />
        <Route path="/hospital/inquiry-status" element={<HospitalInquiryStatusPage />} />
        <Route path="/admin/hospital-inquiries" element={<AdminHospitalInquiriesPage />} />

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
        <Route path="/hospitaldashboard/crm" element={<ProtectedRoute requiredRole="hospital_admin"><HospitalCrmPage /></ProtectedRoute>} />

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
          path="/doctordashboard"
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
        <Route path="/patients" element={<Navigate to="/dashboard" replace />} />
        <Route path="/consultations" element={<Navigate to="/dashboard" replace />} />
        <Route path="/prescriptions" element={<Navigate to="/dashboard" replace />} />
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
        <Route path="/medicines" element={<ProtectedRoute requiredRole="doctor"><MedicinesPage /></ProtectedRoute>} />
        <Route path="/medicines/new" element={<ProtectedRoute requiredRole="doctor"><MedicinesPage /></ProtectedRoute>} />
        <Route path="/medicines/import" element={<ProtectedRoute requiredRole="doctor"><MedicinesPage /></ProtectedRoute>} />
        <Route path="/medicines/rules" element={<ProtectedRoute requiredRole="doctor"><MedicinesPage /></ProtectedRoute>} />
        <Route path="/medicines/tests" element={<ProtectedRoute requiredRole="doctor"><MedicinesPage /></ProtectedRoute>} />
        <Route path="/medicines/import-history" element={<ProtectedRoute requiredRole="doctor"><MedicinesPage /></ProtectedRoute>} />
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
      </RouteFade>

      {/* Global Sticky AI Chatbot */}
      <StickyChatbot />

      {/* Global Cookie Consent Banner */}
      <CookieBanner />
    </AuthProvider>
  )
}

export default App
