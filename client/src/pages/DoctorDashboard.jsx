import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, User, CheckCircle2, XCircle, FileText,
  Stethoscope, Users, AlertCircle, Phone, MapPin, Sparkles, Activity
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Modal for adding clinical notes & completing appointment
  const [activeNotesModalApt, setActiveNotesModalApt] = useState(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [submittingNotes, setSubmittingNotes] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.getDoctorDashboard();
      if (res.success) {
        setDashboardData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (aptId, newStatus, extra = {}) => {
    try {
      const res = await api.updateAppointmentStatus(aptId, {
        status: newStatus,
        ...extra
      });
      if (res.success) {
        setActionSuccess(`Appointment status updated to ${newStatus}. Patient notified via Twilio.`);
        loadDashboard();
      }
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleCompleteConsultation = async (e) => {
    e.preventDefault();
    if (!activeNotesModalApt) return;
    setSubmittingNotes(true);

    try {
      await handleUpdateStatus(activeNotesModalApt.id, 'completed', {
        doctor_notes: doctorNotes,
        prescription: prescription
      });
      setActiveNotesModalApt(null);
      setDoctorNotes('');
      setPrescription('');
    } finally {
      setSubmittingNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Activity size={36} color="var(--primary-600)" style={{ animation: 'pulseDot 1.5s infinite', margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--slate-600)', fontWeight: '600' }}>Loading physician workspace...</div>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const todayApts = dashboardData?.todayAppointments || [];
  const upcomingApts = dashboardData?.upcomingAppointments || [];

  return (
    <div className="page-wrapper">
      {/* Welcome Hero Banner */}
      <div className="hero-banner" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary-800)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={14} color="var(--primary-600)" />
            Physician Clinical Workspace
          </span>
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          fontWeight: '800',
          color: 'var(--slate-900)',
          letterSpacing: '-0.03em'
        }}>
          Welcome, {user?.full_name} 🩺
        </h1>
        <p style={{ color: 'var(--slate-600)', fontSize: '0.96rem', marginTop: '6px' }}>
          Manage your daily patient queue, complete clinical notes & prescriptions, and trigger real-time Twilio patient SMS alerts.
        </p>
      </div>

      {actionSuccess && (
        <div className="alert-box alert-success" style={{ marginBottom: '24px' }}>
          <CheckCircle2 size={18} />
          <span style={{ fontWeight: '600' }}>{actionSuccess}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <StatCard
          title="Today's Consultations"
          value={stats.today_count || 0}
          subtitle="Patients scheduled today"
          icon={Calendar}
          color="teal"
        />
        <StatCard
          title="Upcoming Schedule"
          value={stats.upcoming_count || 0}
          subtitle="Future confirmed visits"
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Total Consultations"
          value={stats.completed_count || 0}
          subtitle="Completed visits"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Patients Treated"
          value={stats.total_patients || 0}
          subtitle="Distinct medical records"
          icon={Users}
          color="indigo"
        />
      </div>

      {/* Today's Queue */}
      <div className="card" style={{ marginBottom: '28px', borderRadius: 'var(--radius-xl)' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Calendar size={22} color="var(--primary-600)" />
              Today's Patient Schedule ({new Date().toISOString().split('T')[0]})
            </h3>
            <div style={{ fontSize: '0.84rem', color: 'var(--slate-500)', marginTop: '2px' }}>
              {todayApts.length} consultations scheduled
            </div>
          </div>
        </div>

        {todayApts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--slate-400)', fontSize: '0.92rem' }}>
            No appointments scheduled for today. Check upcoming appointments below.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {todayApts.map((apt) => (
              <div key={apt.id} style={{
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--slate-200)',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '1.2rem'
                    }}>
                      {apt.patient_name?.charAt(0)}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--slate-900)' }}>
                          {apt.patient_name}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: '600' }}>
                          ({apt.gender || 'Patient'} • Blood: {apt.blood_group || 'N/A'})
                        </span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--slate-600)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <span><Phone size={13} style={{ display: 'inline' }} /> {apt.patient_phone}</span>
                        <span>•</span>
                        <span>Ref #{apt.appointment_number}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontWeight: '800', color: 'var(--primary-700)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={16} />
                      {apt.appointment_time}
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>
                </div>

                {/* Reason & Symptoms */}
                <div style={{ marginTop: '14px', backgroundColor: '#ffffff', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)', fontSize: '0.86rem' }}>
                  <div><strong>Reason for Visit:</strong> {apt.reason || 'General Consultation'}</div>
                  {apt.symptoms && <div style={{ marginTop: '4px', color: 'var(--slate-600)' }}><strong>Symptoms:</strong> {apt.symptoms}</div>}
                  {apt.medical_history && <div style={{ marginTop: '4px', color: 'var(--slate-500)', fontSize: '0.8rem' }}><strong>Medical History:</strong> {apt.medical_history}</div>}
                  {apt.allergies && <div style={{ marginTop: '4px', color: '#b91c1c', fontSize: '0.8rem' }}><strong>Allergies:</strong> {apt.allergies}</div>}
                  {apt.doctor_notes && <div style={{ marginTop: '6px', color: '#065f46', fontWeight: '700' }}><strong>Clinical Notes:</strong> {apt.doctor_notes}</div>}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                  {apt.status !== 'completed' && (
                    <button
                      onClick={() => {
                        setActiveNotesModalApt(apt);
                        setDoctorNotes(apt.doctor_notes || '');
                        setPrescription(apt.prescription || '');
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      <FileText size={15} />
                      Complete Consultation & Add Notes
                    </button>
                  )}

                  {apt.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                      className="btn btn-secondary btn-sm"
                    >
                      <CheckCircle2 size={15} />
                      Confirm & Send SMS
                    </button>
                  )}

                  {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                    <button
                      onClick={() => {
                        const reason = prompt('Cancellation reason for SMS alert:', 'Doctor emergency reschedule required');
                        if (reason !== null) {
                          handleUpdateStatus(apt.id, 'cancelled', { cancellation_reason: reason });
                        }
                      }}
                      className="btn btn-outline-danger btn-sm"
                    >
                      <XCircle size={15} />
                      Cancel Visit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Consultations Table */}
      <div className="card" style={{ borderRadius: 'var(--radius-xl)' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Clock size={22} color="var(--primary-600)" />
              Upcoming Scheduled Consultations
            </h3>
            <div style={{ fontSize: '0.84rem', color: 'var(--slate-500)', marginTop: '2px' }}>
              Future patient appointments
            </div>
          </div>
        </div>

        {upcomingApts.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--slate-400)', fontSize: '0.9rem' }}>
            No upcoming appointments currently booked.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date & Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {upcomingApts.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: '800', color: 'var(--slate-900)' }}>{a.patient_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>{a.patient_phone}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--slate-800)' }}>{a.appointment_date}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>{a.appointment_time}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.84rem', color: 'var(--slate-700)' }}>{a.reason}</div>
                    </td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {a.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(a.id, 'confirmed')}
                            className="btn btn-secondary btn-sm"
                            title="Confirm"
                          >
                            <CheckCircle2 size={13} color="var(--primary-600)" />
                            Confirm
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clinical Notes & Prescription Modal */}
      {activeNotesModalApt && (
        <div className="modal-overlay" onClick={() => setActiveNotesModalApt(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 className="card-title">
                <FileText size={22} color="var(--primary-600)" />
                Consultation Summary & Prescription
              </h3>
            </div>

            <form onSubmit={handleCompleteConsultation}>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.86rem' }}>
                <div><strong>Patient:</strong> {activeNotesModalApt.patient_name} ({activeNotesModalApt.patient_phone})</div>
                <div><strong>Appointment:</strong> #{activeNotesModalApt.appointment_number} on {activeNotesModalApt.appointment_date}</div>
              </div>

              <div className="form-group">
                <label className="form-label">Clinical Notes & Diagnosis</label>
                <textarea
                  className="form-textarea"
                  placeholder="Enter medical findings, diagnosis, and treatment plan..."
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Prescription / Medication Instructions</label>
                <textarea
                  className="form-textarea"
                  placeholder="e.g. Amoxicillin 500mg - 3x daily for 7 days with food..."
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="alert-box alert-info" style={{ fontSize: '0.82rem' }}>
                <Sparkles size={16} />
                <span>Marking this appointment completed will dispatch a Twilio follow-up SMS and finalize the record.</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveNotesModalApt(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingNotes}>
                  {submittingNotes ? 'Saving...' : 'Finalize & Complete Visit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
