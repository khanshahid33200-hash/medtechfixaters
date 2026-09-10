import axios, { AxiosInstance, AxiosError } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

class ApiClient {
  private client: AxiosInstance
  private clinicId: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add clinic_id to all requests if set (for booking endpoints that use headers)
    this.client.interceptors.request.use((config) => {
      if (this.clinicId) {
        config.headers['clinic_id'] = this.clinicId
      } else {
        config.headers['clinic_id'] = 'clinic-001'
      }
      return config
    })

    // Handle errors globally
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('API Error:', error.response?.status, error.response?.data)
        return Promise.reject(error)
      }
    )
  }

  setClinicId(clinicId: string) {
    this.clinicId = clinicId
  }

  getClinicId(): string | null {
    return this.clinicId
  }

  // Check-in endpoints
  async submitCheckin(data: any) {
    // Send clinic_id as query parameter
    return this.client.post(`/checkins/?clinic_id=${this.clinicId || 'clinic-001'}`, data)
  }

  async getCheckinStats() {
    return this.client.get('/checkins/stats')
  }

  async getDoctorQueue(doctorId: string) {
    return this.client.get(`/checkins/queue/${doctorId}`)
  }

  async updateDoctorQueueStatus(doctorId: string, itemId: string, status: string) {
    return this.client.put(`/checkins/queue/${doctorId}/${itemId}/status`, { status })
  }

  // Appointment endpoints
  async bookAppointment(data: any) {
    return this.client.post('/appointments/', data)
  }

  async listAppointments(filters?: any) {
    return this.client.get('/appointments/', { params: filters })
  }

  async getAppointment(appointmentId: string) {
    return this.client.get(`/appointments/${appointmentId}`)
  }

  async getAvailableSlots(doctorId: string, dateFrom: string, dateTo: string) {
    return this.client.post('/appointments/available-slots', {
      doctor_id: doctorId,
      date_from: dateFrom,
      date_to: dateTo,
    })
  }

  async confirmAppointment(appointmentId: string) {
    return this.client.post(`/appointments/${appointmentId}/confirm`, {})
  }

  async rescheduleAppointment(appointmentId: string, newDate: string) {
    return this.client.put(`/appointments/${appointmentId}/reschedule`, {
      new_appointment_date: newDate,
    })
  }

  async cancelAppointment(appointmentId: string, reason?: string) {
    return this.client.delete(`/appointments/${appointmentId}`, {
      data: { reason },
    })
  }

  async getAppointmentStats() {
    return this.client.get('/appointments/stats')
  }

  // Doctor Profile Endpoint (Supabase database query by Doctor ID)
  async getDoctorProfile(doctorId: string) {
    return this.client.get(`/doctor/profile/${doctorId}`)
  }

  // Admin Doctor Management Endpoints
  async listDoctors() {
    return this.client.get('/doctor/list')
  }

  async createDoctor(data: any) {
    return this.client.post('/doctor/create', data)
  }

  async updateDoctorStatus(doctorId: string, status: string) {
    return this.client.put(`/doctor/${doctorId}/status`, { status })
  }

  async deleteDoctor(doctorId: string) {
    return this.client.delete(`/doctor/${doctorId}`)
  }

  // Health check
  async healthCheck() {
    return this.client.get('/health', { baseURL: 'http://localhost:8000' })
  }
}

export default new ApiClient()
