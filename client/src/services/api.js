const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('medicare_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || 'An error occurred during request.');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),
  sendOtp: (phone_number) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone_number }) }),
  verifyOtp: (payload) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(payload) }),

  // Doctors
  getDoctors: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.department_id) query.append('department_id', params.department_id);
    if (params.day) query.append('day', params.day);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/doctors${qs}`);
  },
  getDoctorById: (id) => request(`/doctors/${id}`),
  getDoctorSlots: (id, date) => request(`/doctors/${id}/slots?date=${date}`),
  getDoctorDashboard: () => request('/doctors/dashboard/metrics'),
  updateDoctorProfile: (data) => request('/doctors/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Patients
  getPatientProfile: () => request('/patients/profile'),
  updatePatientProfile: (data) => request('/patients/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getPatientDashboard: () => request('/patients/dashboard'),

  // Appointments
  createAppointment: (data) => request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  getAppointments: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.date) query.append('date', params.date);
    if (params.doctor_id) query.append('doctor_id', params.doctor_id);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/appointments${qs}`);
  },
  getAppointmentById: (id) => request(`/appointments/${id}`),
  updateAppointmentStatus: (id, data) => request(`/appointments/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAppointment: (id) => request(`/appointments/${id}`, { method: 'DELETE' }),

  // Notifications & Twilio
  getNotifications: () => request('/notifications'),
  getTwilioStatus: () => request('/notifications/status'),
  sendSMS: (data) => request('/notifications/sms', { method: 'POST', body: JSON.stringify(data) }),
  sendWhatsApp: (data) => request('/notifications/whatsapp', { method: 'POST', body: JSON.stringify(data) }),
  runReminders: () => request('/notifications/run-reminders', { method: 'POST' }),

  // Admin
  getAdminAnalytics: () => request('/admin/analytics'),
  getAdminDoctors: () => request('/admin/doctors'),
  createDoctor: (data) => request('/admin/doctors', { method: 'POST', body: JSON.stringify(data) }),
  getAdminPatients: () => request('/admin/patients'),
  getAdminDepartments: () => request('/admin/departments'),
  createDepartment: (data) => request('/admin/departments', { method: 'POST', body: JSON.stringify(data) }),
  getCommunicationLogs: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.channel) query.append('channel', params.channel);
    if (params.trigger_event) query.append('trigger_event', params.trigger_event);
    if (params.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/admin/communications${qs}`);
  },
  testTwilio: (data) => request('/notifications/test', { method: 'POST', body: JSON.stringify(data) })
};
