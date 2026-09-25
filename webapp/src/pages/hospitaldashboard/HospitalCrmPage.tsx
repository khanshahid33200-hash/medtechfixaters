import HospitalDashboardLayout from '../../components/hospitaldashboard/HospitalDashboardLayout'
import CrmOverview from '../../components/crm/CrmOverview'

// Hospital-wide CRM: follow-ups, returning patients and reminder status for every doctor.
export default function HospitalCrmPage() {
  return (
    <HospitalDashboardLayout pageTitle="CRM">
      <CrmOverview canFilterDoctors />
    </HospitalDashboardLayout>
  )
}
