import React, { useState, useEffect } from 'react';
import {
  Users, Stethoscope, Calendar, CheckCircle2, XCircle, MessageSquare,
  Activity, Play, RefreshCw, Send, ShieldAlert, Sparkles, Building2, Radio
} from 'lucide-react';
import { api } from '../services/api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

export default function AdminDashboard({ onNavigateToLogs, onNavigateToDoctors, onNavigateToPatients }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningReminders, setRunningReminders] = useState(false);
  const [reminderResult, setReminderResult] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminAnalytics();
      if (res.success) {
        setAnalytics(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunReminders = async () => {
    setRunningReminders(true);
    setReminderResult(null);
    try {
      const res = await api.runReminders();
      setReminderResult(res);
      loadAnalytics();
    } catch (err) {
      setReminderResult({ success: false, message: err.message });
    } finally {
      setRunningReminders(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Activity size={36} color="var(--primary-600)" style={{ animation: 'pulseDot 1.5s infinite', margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--slate-600)', fontWeight: '600' }}>Loading hospital operations analytics...</div>
        </div>
      </div>
    );
  }

  const stats = analytics?.stats || {};
  const notifs = stats.notifications || {};
  const deptDist = analytics?.departmentDistribution || [];
  const recentComms = analytics?.recentCommunications || [];
  const twilio = analytics?.twilioStatus || {};

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="hero-banner" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary-800)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={14} color="var(--primary-600)" />
              Hospital Master Administration
            </span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            fontWeight: '800',
            color: 'var(--slate-900)',
            letterSpacing: '-0.03em'
          }}>
            Operations & Telephony Analytics
          </h1>
          <p style={{ color: 'var(--slate-600)', fontSize: '0.96rem', marginTop: '6px' }}>
            Real-time hospital capacity, patient bookings, and Twilio SMS notification delivery metrics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleRunReminders}
            className="btn btn-primary btn-lg"
            disabled={runningReminders}
          >
            <Play size={18} />
            {runningReminders ? 'Scanning Appointments...' : 'Trigger Automated Reminders Job'}
          </button>
        </div>
      </div>

      {reminderResult && (
        <div className="alert-box alert-success" style={{ marginBottom: '24px' }}>
          <CheckCircle2 size={18} />
          <span style={{ fontWeight: '600' }}>
            {reminderResult.message || `Processed ${reminderResult.processedCount || 0} reminders successfully.`}
          </span>
        </div>
      )}

      {/* Metrics Row 1: Hospital Overview */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <StatCard
          title="Total Patients"
          value={stats.total_patients || 0}
          subtitle="Registered patient profiles"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Active Doctors"
          value={stats.total_doctors || 0}
          subtitle="Licensed physicians"
          icon={Stethoscope}
          color="teal"
        />
        <StatCard
          title="Total Consultations"
          value={stats.total_appointments || 0}
          subtitle="All appointment records"
          icon={Calendar}
          color="indigo"
        />
        <StatCard
          title="Pending Visits"
          value={stats.pending_appointments || 0}
          subtitle="Awaiting physician review"
          icon={Activity}
          color="amber"
        />
      </div>

      {/* Metrics Row 2: Twilio Communication Stats */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <StatCard
          title="Total SMS Sent"
          value={notifs.total_sent || 0}
          subtitle="Dispatched Twilio alerts"
          icon={MessageSquare}
          color="teal"
        />
        <StatCard
          title="Dev Mode Logs"
          value={notifs.total_simulated || 0}
          subtitle="Simulated in local dev"
          icon={Radio}
          color="amber"
        />
        <StatCard
          title="Failed Dispatches"
          value={notifs.total_failed || 0}
          subtitle="Invalid number or SID error"
          icon={XCircle}
          color="rose"
        />
        <StatCard
          title="Delivery Success"
          value={notifs.success_rate || '100%'}
          subtitle="Overall reliability rating"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* 2-Column Section: Department Distribution & Recent Telephony Activity */}
      <div className="grid-2">
        {/* Department Breakdown */}
        <div className="card" style={{ borderRadius: 'var(--radius-xl)' }}>
          <div className="card-header">
            <h3 className="card-title">
              <Building2 size={22} color="var(--primary-600)" />
              Specialization & Department Breakdown
            </h3>
            <button onClick={onNavigateToDoctors} className="btn btn-secondary btn-sm">
              Manage Doctors
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {deptDist.map((d, index) => (
              <div key={d.id || index} style={{
                padding: '14px 18px',
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--slate-200)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: '800', color: 'var(--slate-900)', fontSize: '0.95rem' }}>{d.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                    {d.doctor_count} Physicians • {d.appointment_count || 0} Total Bookings
                  </div>
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  fontWeight: '800',
                  color: 'var(--primary-700)'
                }}>
                  {d.doctor_count} MDs
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Telephony & SMS Logs */}
        <div className="card" style={{ borderRadius: 'var(--radius-xl)' }}>
          <div className="card-header">
            <h3 className="card-title">
              <MessageSquare size={22} color="var(--primary-600)" />
              Recent Twilio Notifications Stream
            </h3>
            <button onClick={onNavigateToLogs} className="btn btn-secondary btn-sm">
              Full SMS Logs
            </button>
          </div>

          {recentComms.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--slate-400)', fontSize: '0.88rem' }}>
              No communications logged yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentComms.map((c) => (
                <div key={c.id} style={{
                  padding: '14px 16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--slate-200)',
                  fontSize: '0.84rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '800', color: 'var(--slate-800)', textTransform: 'capitalize' }}>
                      {c.trigger_event?.replace(/_/g, ' ')}
                    </span>
                    <StatusBadge status={c.status} type="notification" />
                  </div>
                  <p style={{ color: 'var(--slate-600)', margin: '4px 0', lineHeight: 1.45 }}>
                    {c.content}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '0.74rem', color: 'var(--slate-400)' }}>
                    <span>To: {c.recipient_phone}</span>
                    <span>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
