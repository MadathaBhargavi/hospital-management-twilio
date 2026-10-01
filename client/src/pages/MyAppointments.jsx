import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, RefreshCw, XCircle, FileText, CheckCircle2, AlertCircle, PlusCircle, User, Activity, Stethoscope, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import RescheduleModal from '../components/RescheduleModal';

export default function MyAppointments({ onNavigateToBook }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'upcoming', 'completed', 'cancelled'
  const [selectedRescheduleApt, setSelectedRescheduleApt] = useState(null);
  const [selectedNotesApt, setSelectedNotesApt] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.getAppointments();
      if (res.success) {
        setAppointments(res.appointments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (apt) => {
    const reason = prompt('Please enter a cancellation reason (included in the Twilio SMS sent to your phone):', 'Schedule conflict');
    if (reason === null) return;

    try {
      const res = await api.updateAppointmentStatus(apt.id, {
        status: 'cancelled',
        cancellation_reason: reason || 'Patient requested cancellation'
      });
      if (res.success) {
        setActionSuccessMsg(`Appointment #${apt.appointment_number} cancelled. Twilio cancellation SMS dispatched.`);
        loadAppointments();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel appointment');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const filtered = appointments.filter((a) => {
    if (activeTab === 'upcoming') {
      return (a.status === 'confirmed' || a.status === 'pending' || a.status === 'rescheduled') && a.appointment_date >= today;
    }
    if (activeTab === 'completed') {
      return a.status === 'completed';
    }
    if (activeTab === 'cancelled') {
      return a.status === 'cancelled';
    }
    return true;
  });

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary-700)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              My Consultations
            </span>
            <span className="badge badge-info" style={{ fontSize: '0.74rem' }}>
              {appointments.length} Total Records
            </span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.95rem',
            fontWeight: '800',
            color: 'var(--slate-900)',
            letterSpacing: '-0.03em'
          }}>
            My Scheduled Appointments & History
          </h1>
          <p style={{ color: 'var(--slate-600)', fontSize: '0.94rem', marginTop: '4px' }}>
            Review your consultations, reschedule times, cancel visits, and view doctor prescriptions.
          </p>
        </div>

        <button onClick={onNavigateToBook} className="btn btn-primary btn-lg">
          <PlusCircle size={18} />
          Book New Consultation
        </button>
      </div>

      {actionSuccessMsg && (
        <div className="alert-box alert-success" style={{ marginBottom: '24px' }}>
          <CheckCircle2 size={18} />
          <span style={{ fontWeight: '600' }}>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'all', label: 'All Appointments', count: appointments.length },
          { id: 'upcoming', label: 'Upcoming Visits', count: appointments.filter(a => (a.status === 'confirmed' || a.status === 'pending' || a.status === 'rescheduled') && a.appointment_date >= today).length },
          { id: 'completed', label: 'Completed', count: appointments.filter(a => a.status === 'completed').length },
          { id: 'cancelled', label: 'Cancelled', count: appointments.filter(a => a.status === 'cancelled').length }
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.86rem',
                fontWeight: isSelected ? '700' : '600',
                border: isSelected ? '1px solid var(--primary-600)' : '1px solid var(--slate-200)',
                background: isSelected ? 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' : '#ffffff',
                color: isSelected ? '#ffffff' : 'var(--slate-700)',
                boxShadow: isSelected ? '0 4px 12px rgba(13, 148, 136, 0.25)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                fontSize: '0.74rem',
                padding: '2px 7px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.25)' : 'var(--slate-100)',
                color: isSelected ? '#ffffff' : 'var(--slate-600)',
                fontWeight: '800'
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Appointments List / Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <Activity size={36} color="var(--primary-600)" style={{ animation: 'pulseDot 1.5s infinite', margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--slate-600)', fontWeight: '600' }}>Loading your appointments...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '50px 24px', textAlign: 'center', color: 'var(--slate-400)', borderRadius: 'var(--radius-xl)' }}>
          <Calendar size={44} style={{ margin: '0 auto 14px', opacity: 0.5 }} />
          <h3 style={{ color: 'var(--slate-800)', fontSize: '1.2rem', fontWeight: '800' }}>No appointments found in this view</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>You don't have any appointments matching the selected filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map((apt) => {
            const isPastOrDone = apt.status === 'completed' || apt.status === 'cancelled';
            return (
              <div
                key={apt.id}
                className="card card-interactive"
                style={{
                  borderRadius: 'var(--radius-xl)',
                  padding: '22px 26px',
                  borderLeft: `5px solid ${
                    apt.status === 'confirmed'
                      ? 'var(--primary-600)'
                      : apt.status === 'completed'
                      ? '#059669'
                      : apt.status === 'cancelled'
                      ? '#ef4444'
                      : '#f59e0b'
                  }`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
                      {apt.doctor_name?.replace('Dr. ', '').charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.76rem', fontWeight: '700', color: 'var(--slate-400)', textTransform: 'uppercase' }}>
                        Ref #{apt.appointment_number}
                      </div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--slate-900)' }}>
                        {apt.doctor_name}
                      </h3>
                      <div style={{ fontSize: '0.84rem', color: 'var(--primary-700)', fontWeight: '600' }}>
                        {apt.specialization} • {apt.department_name}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <StatusBadge status={apt.status} />
                  </div>
                </div>

                <div className="grid-3" style={{ gap: '16px', backgroundColor: '#f8fafc', padding: '14px 18px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.86rem' }}>
                  <div>
                    <span style={{ color: 'var(--slate-500)', fontSize: '0.78rem', display: 'block', fontWeight: '600' }}>Schedule</span>
                    <strong style={{ color: 'var(--slate-900)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <Clock size={15} color="var(--primary-600)" />
                      {apt.appointment_date} at {apt.appointment_time}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--slate-500)', fontSize: '0.78rem', display: 'block', fontWeight: '600' }}>Location</span>
                    <strong style={{ color: 'var(--slate-900)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <MapPin size={15} color="var(--primary-600)" />
                      {apt.room_number || 'Room 101'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--slate-500)', fontSize: '0.78rem', display: 'block', fontWeight: '600' }}>Reason & Fee</span>
                    <span style={{ color: 'var(--slate-800)', fontWeight: '600', display: 'block', marginTop: '2px' }}>
                      {apt.reason} (${apt.consultation_fee})
                    </span>
                  </div>
                </div>

                {/* Cancellation details or Doctor notes if available */}
                {apt.cancellation_reason && (
                  <div className="alert-box alert-danger" style={{ marginBottom: '14px', fontSize: '0.82rem' }}>
                    <XCircle size={15} />
                    <span><strong>Cancelled: </strong> {apt.cancellation_reason}</span>
                  </div>
                )}

                {apt.doctor_notes && (
                  <div style={{
                    backgroundColor: 'var(--sky-50)',
                    border: '1px solid var(--sky-200)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    fontSize: '0.84rem',
                    marginBottom: '14px',
                    color: 'var(--sky-900)'
                  }}>
                    <strong>🩺 Doctor Notes & Prescription: </strong> {apt.doctor_notes}
                  </div>
                )}

                {/* Footer Action Buttons */}
                {!isPastOrDone && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--slate-100)' }}>
                    <button
                      onClick={() => setSelectedRescheduleApt(apt)}
                      className="btn btn-secondary btn-sm"
                    >
                      <RefreshCw size={14} />
                      Reschedule
                    </button>
                    <button
                      onClick={() => handleCancel(apt)}
                      className="btn btn-outline-danger btn-sm"
                    >
                      <XCircle size={14} />
                      Cancel Visit
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule Modal */}
      {selectedRescheduleApt && (
        <RescheduleModal
          appointment={selectedRescheduleApt}
          onClose={() => setSelectedRescheduleApt(null)}
          onSuccess={() => {
            loadAppointments();
            setActionSuccessMsg('Appointment successfully rescheduled! An updated Twilio SMS was dispatched.');
          }}
        />
      )}
    </div>
  );
}
