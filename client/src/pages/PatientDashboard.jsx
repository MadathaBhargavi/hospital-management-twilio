import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, User, Stethoscope, MessageSquare, AlertCircle,
  PlusCircle, RefreshCw, XCircle, ArrowRight, ShieldCheck, CheckCircle2,
  Heart, MapPin, Sparkles, Activity
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import RescheduleModal from '../components/RescheduleModal';

export default function PatientDashboard({ onNavigateToBook, onNavigateToAppointments, onNavigateToProfile, onOpenOtpModal }) {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRescheduleApt, setSelectedRescheduleApt] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMsg, setCancelMsg] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.getPatientDashboard();
      if (res.success) {
        setDashboardData(res);
      }
    } catch (err) {
      console.error('Error loading patient dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (aptId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment? A Twilio SMS notification will be sent to confirm cancellation.')) {
      return;
    }

    setCancelLoading(true);
    try {
      const res = await api.updateAppointmentStatus(aptId, {
        status: 'cancelled',
        cancellation_reason: 'Cancelled by patient from portal'
      });
      if (res.success) {
        setCancelMsg('Appointment cancelled successfully. SMS alert dispatched.');
        loadDashboard();
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel appointment');
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Activity size={36} color="var(--primary-600)" style={{ animation: 'pulseDot 1.5s infinite', margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--slate-600)', fontWeight: '600', fontSize: '1rem' }}>
            Loading your healthcare dashboard...
          </div>
        </div>
      </div>
    );
  }

  const nextApt = dashboardData?.nextAppointment;
  const stats = dashboardData?.stats || {};
  const recentApts = dashboardData?.recentAppointments || [];
  const recentNotifs = dashboardData?.recentNotifications || [];

  return (
    <div className="page-wrapper">
      {/* Welcome Hero Banner */}
      <div className="hero-banner" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '24px'
      }}>
        <div style={{ maxWidth: '680px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: '800',
              color: 'var(--primary-800)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Sparkles size={14} color="var(--primary-600)" />
              Patient Health Portal
            </span>
            {user?.is_phone_verified ? (
              <span className="badge badge-success" style={{ fontSize: '0.74rem' }}>
                <CheckCircle2 size={13} /> SMS Verified
              </span>
            ) : (
              <button
                onClick={onOpenOtpModal}
                className="badge badge-warning"
                style={{ fontSize: '0.74rem', cursor: 'pointer', border: '1px solid #fde68a' }}
              >
                <AlertCircle size={13} /> Verify Phone with OTP
              </button>
            )}
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            fontWeight: '800',
            color: 'var(--slate-900)',
            letterSpacing: '-0.03em'
          }}>
            Welcome back, {user?.full_name}! 👋
          </h1>
          <p style={{ color: 'var(--slate-600)', fontSize: '0.96rem', marginTop: '6px', lineHeight: 1.5 }}>
            Book clinical consultations, track upcoming appointments, and receive automated Twilio SMS reminders directly to your phone.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onNavigateToBook} className="btn btn-primary btn-lg">
            <PlusCircle size={20} />
            Book New Appointment
          </button>
        </div>
      </div>

      {cancelMsg && (
        <div className="alert-box alert-success" style={{ marginBottom: '24px' }}>
          <CheckCircle2 size={18} />
          <span style={{ fontWeight: '600' }}>{cancelMsg}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <StatCard
          title="Upcoming Visits"
          value={stats.upcoming_count || 0}
          subtitle="Confirmed appointments"
          icon={Calendar}
          color="teal"
        />
        <StatCard
          title="Completed Visits"
          value={stats.completed_count || 0}
          subtitle="Past health consultations"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Cancelled"
          value={stats.cancelled_count || 0}
          subtitle="Cancelled bookings"
          icon={XCircle}
          color="rose"
        />
        <StatCard
          title="Total Bookings"
          value={stats.total_appointments || 0}
          subtitle="Lifetime consultations"
          icon={Stethoscope}
          color="blue"
        />
      </div>

      {/* Next Upcoming Appointment Highlight */}
      {nextApt ? (
        <div className="card" style={{
          marginBottom: '28px',
          borderRadius: 'var(--radius-xl)',
          borderLeft: '5px solid var(--primary-600)',
          background: 'linear-gradient(90deg, #f0fdfa 0%, #ffffff 100%)',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div className="card-header">
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--primary-700)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Next Upcoming Consultation
              </span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--slate-900)', marginTop: '2px' }}>
                Appointment #{nextApt.appointment_number}
              </h2>
            </div>
            <StatusBadge status={nextApt.status} />
          </div>

          <div className="grid-3" style={{ gap: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '1.25rem',
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)'
              }}>
                {nextApt.doctor_name?.replace('Dr. ', '').charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: '800', color: 'var(--slate-900)', fontSize: '1.02rem' }}>{nextApt.doctor_name}</div>
                <div style={{ fontSize: '0.84rem', color: 'var(--primary-700)', fontWeight: '600' }}>
                  {nextApt.doctor_specialization} • {nextApt.department_name}
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', fontWeight: '600' }}>Date & Scheduled Time</div>
              <div style={{ fontWeight: '800', color: 'var(--slate-900)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.96rem' }}>
                <Clock size={16} color="var(--primary-600)" />
                {nextApt.appointment_date} at {nextApt.appointment_time}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', fontWeight: '600' }}>Clinic Location & Fee</div>
              <div style={{ fontWeight: '800', color: 'var(--slate-900)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.96rem' }}>
                <MapPin size={16} color="var(--primary-600)" />
                {nextApt.room_number || 'Main OPD Wing'} • ${nextApt.consultation_fee}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--slate-200)', paddingTop: '16px' }}>
            <button
              onClick={() => setSelectedRescheduleApt(nextApt)}
              className="btn btn-secondary btn-sm"
            >
              <RefreshCw size={14} />
              Reschedule Time
            </button>
            <button
              onClick={() => handleCancelAppointment(nextApt.id)}
              className="btn btn-outline-danger btn-sm"
              disabled={cancelLoading}
            >
              <XCircle size={14} />
              Cancel Appointment
            </button>
          </div>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: '28px', textAlign: 'center', padding: '40px 24px', borderRadius: 'var(--radius-xl)' }}>
          <Calendar size={44} color="var(--slate-300)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--slate-900)' }}>No upcoming appointments scheduled</h3>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginTop: '4px', maxWidth: '440px', margin: '6px auto 18px', lineHeight: 1.5 }}>
            Need to consult a specialist or general physician? Book an appointment online and get instant SMS confirmation.
          </p>
          <button onClick={onNavigateToBook} className="btn btn-primary">
            <PlusCircle size={17} />
            Find Doctors & Book Visit
          </button>
        </div>
      )}

      {/* Two Columns: Recent Appointments & Twilio Notifications Feed */}
      <div className="grid-2">
        {/* Recent Appointments */}
        <div className="card" style={{ borderRadius: 'var(--radius-xl)' }}>
          <div className="card-header">
            <h3 className="card-title">
              <Calendar size={20} color="var(--primary-600)" />
              Recent Appointments
            </h3>
            <button onClick={onNavigateToAppointments} className="btn btn-secondary btn-sm">
              View All
            </button>
          </div>

          {recentApts.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--slate-400)', fontSize: '0.88rem' }}>
              No previous appointments found.
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApts.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: '700', color: 'var(--slate-900)' }}>{a.doctor_name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>{a.specialization}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '700', color: 'var(--slate-800)' }}>{a.appointment_date}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)' }}>{a.appointment_time}</div>
                      </td>
                      <td>
                        <StatusBadge status={a.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Twilio SMS Notification Activity */}
        <div className="card" style={{ borderRadius: 'var(--radius-xl)' }}>
          <div className="card-header">
            <h3 className="card-title">
              <MessageSquare size={20} color="var(--primary-600)" />
              Twilio SMS Activity Log
            </h3>
            <span className="badge badge-info" style={{ fontSize: '0.74rem' }}>{recentNotifs.length} Alerts</span>
          </div>

          {recentNotifs.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--slate-400)', fontSize: '0.88rem' }}>
              No SMS notifications recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentNotifs.map((n) => (
                <div key={n.id} style={{
                  padding: '14px 16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--slate-200)',
                  fontSize: '0.84rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '800', color: 'var(--slate-800)', textTransform: 'capitalize' }}>
                      {n.trigger_event?.replace(/_/g, ' ')} Alert
                    </span>
                    <StatusBadge status={n.status} type="notification" />
                  </div>
                  <p style={{ color: 'var(--slate-600)', margin: '4px 0', lineHeight: 1.45 }}>
                    {n.content}
                  </p>
                  <div style={{ fontSize: '0.74rem', color: 'var(--slate-400)', textAlign: 'right', marginTop: '4px' }}>
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reschedule Modal */}
      {selectedRescheduleApt && (
        <RescheduleModal
          appointment={selectedRescheduleApt}
          onClose={() => setSelectedRescheduleApt(null)}
          onSuccess={() => {
            loadDashboard();
            setCancelMsg('Appointment successfully rescheduled! An updated Twilio SMS was dispatched.');
          }}
        />
      )}
    </div>
  );
}
